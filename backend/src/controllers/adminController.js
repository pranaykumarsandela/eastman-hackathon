const { query, getClient } = require('../config/db');

/**
 * GET /api/admin/metrics
 * Computes live metrics from database tables
 */
const getAdminMetrics = async (req, res, next) => {
  try {
    // 1. Total & Active products count
    const prodCountsRes = await query(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(*) FILTER (WHERE is_active = TRUE) as active_products,
        COUNT(*) FILTER (WHERE is_active = TRUE AND stock_quantity <= 5) as low_stock_products,
        COUNT(*) FILTER (WHERE is_active = TRUE AND stock_quantity = 0) as out_of_stock_products
      FROM products
    `);

    // 2. Orders & Revenue metrics
    const orderMetricsRes = await query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COUNT(*) FILTER (WHERE order_status = 'CONFIRMED') as confirmed_orders,
        COUNT(*) FILTER (WHERE order_status = 'PROCESSING') as processing_orders,
        COUNT(*) FILTER (WHERE order_status = 'SHIPPED') as shipped_orders,
        COUNT(*) FILTER (WHERE order_status = 'DELIVERED') as delivered_orders,
        COUNT(*) FILTER (WHERE order_status = 'CANCELLED') as cancelled_orders
      FROM orders
    `);

    // 3. Registered Customers count
    const customerCountRes = await query(`
      SELECT COUNT(*) as total_customers FROM users WHERE role = 'customer'
    `);

    // 4. Five most recent orders
    const recentOrdersRes = await query(`
      SELECT id, order_number, customer_name, email, total_amount, order_status, payment_method, created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 5
    `);

    const pCounts = prodCountsRes.rows[0];
    const oMetrics = orderMetricsRes.rows[0];

    res.json({
      success: true,
      data: {
        products: {
          total: parseInt(pCounts.total_products, 10),
          active: parseInt(pCounts.active_products, 10),
          lowStock: parseInt(pCounts.low_stock_products, 10),
          outOfStock: parseInt(pCounts.out_of_stock_products, 10)
        },
        orders: {
          total: parseInt(oMetrics.total_orders, 10),
          totalOrders: parseInt(oMetrics.total_orders, 10),
          totalRevenue: parseFloat(oMetrics.total_revenue),
          statusCounts: {
            CONFIRMED: parseInt(oMetrics.confirmed_orders, 10),
            PROCESSING: parseInt(oMetrics.processing_orders, 10),
            SHIPPED: parseInt(oMetrics.shipped_orders, 10),
            DELIVERED: parseInt(oMetrics.delivered_orders, 10),
            CANCELLED: parseInt(oMetrics.cancelled_orders, 10)
          },
          statusBreakdown: {
            confirmed: parseInt(oMetrics.confirmed_orders, 10),
            processing: parseInt(oMetrics.processing_orders, 10),
            shipped: parseInt(oMetrics.shipped_orders, 10),
            delivered: parseInt(oMetrics.delivered_orders, 10),
            cancelled: parseInt(oMetrics.cancelled_orders, 10)
          }
        },
        customers: {
          total: parseInt(customerCountRes.rows[0].total_customers, 10)
        },
        recentOrders: recentOrdersRes.rows.map(o => ({
          id: o.id,
          orderNumber: o.order_number,
          customerName: o.customer_name,
          totalAmount: parseFloat(o.total_amount),
          orderStatus: o.order_status,
          paymentMethod: o.payment_method,
          createdAt: o.created_at
        }))
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/products
 * Fetch all products for admin with active/inactive status and stock filters
 */
const getAdminProducts = async (req, res, next) => {
  try {
    const { search, category, status, lowStock, page = 1, limit = 50 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const values = [];
    let paramCounter = 1;

    if (search && search.trim()) {
      conditions.push(`(name ILIKE $${paramCounter} OR description ILIKE $${paramCounter})`);
      values.push(`%${search.trim()}%`);
      paramCounter++;
    }

    if (category && category !== 'All' && category.trim()) {
      conditions.push(`category = $${paramCounter}`);
      values.push(category.trim());
      paramCounter++;
    }

    if (status === 'active') {
      conditions.push(`is_active = TRUE`);
    } else if (status === 'inactive') {
      conditions.push(`is_active = FALSE`);
    }

    if (lowStock === 'true') {
      conditions.push(`stock_quantity <= 5`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) FROM products ${whereClause}`;
    const countRes = await query(countSql, values);
    const totalCount = parseInt(countRes.rows[0].count, 10);

    const dataSql = `
      SELECT id, name, description, price, category, image_url, stock_quantity, rating, is_active, created_at, updated_at
      FROM products
      ${whereClause}
      ORDER BY updated_at DESC, id DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    const dataRes = await query(dataSql, [...values, limitNum, offset]);

    res.json({
      success: true,
      data: {
        products: dataRes.rows.map(p => ({
          id: p.id,
          name: p.name,
          title: p.name,
          slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
          description: p.description,
          price: parseFloat(p.price),
          category: p.category,
          imageUrl: p.image_url,
          stockQuantity: p.stock_quantity,
          rating: parseFloat(p.rating),
          isActive: p.is_active,
          createdAt: p.created_at,
          updatedAt: p.updated_at
        })),
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum)
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/products
 * Creates a new product
 */
const createProduct = async (req, res, next) => {
  try {
    const { name, title, description, price, category, imageUrl, stockQuantity, isActive = true } = req.body;
    const productName = (name || title || '').trim();

    if (!productName) {
      return res.status(400).json({ success: false, message: 'Product title / name is required' });
    }

    const numPrice = parseFloat(price);
    const numStock = parseInt(stockQuantity, 10);

    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ success: false, message: 'Price must be a non-negative number' });
    }

    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({ success: false, message: 'Stock quantity must be a non-negative integer' });
    }

    const defaultImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

    const insertSql = `
      INSERT INTO products (name, description, price, category, image_url, stock_quantity, rating, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, 4.5, $7)
      RETURNING *
    `;

    const result = await query(insertSql, [
      productName,
      (description || '').trim(),
      numPrice,
      (category || 'General').trim(),
      imageUrl && imageUrl.trim() ? imageUrl.trim() : defaultImage,
      numStock,
      Boolean(isActive)
    ]);

    const created = result.rows[0];

    res.status(201).json({
      success: true,
      message: `Product "${created.name}" created successfully!`,
      data: {
        id: created.id,
        name: created.name,
        title: created.name,
        description: created.description,
        price: parseFloat(created.price),
        category: created.category,
        imageUrl: created.image_url,
        stockQuantity: created.stock_quantity,
        rating: parseFloat(created.rating),
        isActive: created.is_active,
        createdAt: created.created_at
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/products/:id
 * Updates an existing product
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, title, description, price, category, imageUrl, stockQuantity, isActive } = req.body;

    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    // Check existing
    const existing = await query('SELECT * FROM products WHERE id = $1', [productId]);
    if (existing.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const p = existing.rows[0];

    const rawName = name !== undefined ? name : title;
    const updatedName = rawName !== undefined ? rawName.trim() : p.name;
    const updatedDesc = description !== undefined ? description.trim() : p.description;
    const updatedPrice = price !== undefined ? parseFloat(price) : parseFloat(p.price);
    const updatedCat = category !== undefined ? category.trim() : p.category;
    const updatedImg = imageUrl !== undefined && imageUrl.trim() ? imageUrl.trim() : p.image_url;
    const updatedStock = stockQuantity !== undefined ? parseInt(stockQuantity, 10) : p.stock_quantity;
    const updatedActive = isActive !== undefined ? Boolean(isActive) : p.is_active;

    if (isNaN(updatedPrice) || updatedPrice < 0) {
      return res.status(400).json({ success: false, message: 'Price must be non-negative' });
    }
    if (isNaN(updatedStock) || updatedStock < 0) {
      return res.status(400).json({ success: false, message: 'Stock quantity must be a non-negative integer' });
    }

    const updateSql = `
      UPDATE products
      SET name = $1, description = $2, price = $3, category = $4, image_url = $5, stock_quantity = $6, is_active = $7, updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `;

    const result = await query(updateSql, [
      updatedName, updatedDesc, updatedPrice, updatedCat, updatedImg, updatedStock, updatedActive, productId
    ]);

    const updated = result.rows[0];

    res.json({
      success: true,
      message: `Product "${updated.name}" updated successfully!`,
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        price: parseFloat(updated.price),
        category: updated.category,
        imageUrl: updated.image_url,
        stockQuantity: updated.stock_quantity,
        rating: parseFloat(updated.rating),
        isActive: updated.is_active,
        updatedAt: updated.updated_at
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/products/:id/toggle
 * Quickly toggles active / inactive status
 */
const toggleProductStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id, 10);

    const result = await query(
      'UPDATE products SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING id, name, is_active',
      [productId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const p = result.rows[0];
    res.json({
      success: true,
      message: `Product "${p.name}" is now ${p.is_active ? 'Active' : 'Inactive'}`,
      data: p
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/products/:id/stock
 * Directly sets stock quantity
 */
const updateProductStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stockQuantity } = req.body;
    const productId = parseInt(id, 10);
    const newStock = parseInt(stockQuantity, 10);

    if (isNaN(newStock) || newStock < 0) {
      return res.status(400).json({ success: false, message: 'Stock must be a non-negative integer' });
    }

    const result = await query(
      'UPDATE products SET stock_quantity = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, stock_quantity',
      [newStock, productId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const p = result.rows[0];
    res.json({
      success: true,
      message: `Stock for "${p.name}" updated to ${p.stock_quantity} units`,
      data: p
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/orders
 * Fetches all orders with search, status filters, and pagination
 */
const getAdminOrders = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const values = [];
    let paramCounter = 1;

    if (search && search.trim()) {
      conditions.push(`(order_number ILIKE $${paramCounter} OR customer_name ILIKE $${paramCounter} OR email ILIKE $${paramCounter} OR phone ILIKE $${paramCounter})`);
      values.push(`%${search.trim()}%`);
      paramCounter++;
    }

    if (status && status !== 'ALL') {
      conditions.push(`order_status = $${paramCounter}`);
      values.push(status.trim().toUpperCase());
      paramCounter++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) FROM orders ${whereClause}`, values);
    const totalCount = parseInt(countRes.rows[0].count, 10);

    const ordersSql = `
      SELECT o.*, c.code as coupon_code,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      LEFT JOIN coupons c ON o.coupon_id = c.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    const ordersRes = await query(ordersSql, [...values, limitNum, offset]);

    res.json({
      success: true,
      data: {
        orders: ordersRes.rows.map(o => ({
          id: o.id,
          orderNumber: o.order_number,
          customerName: o.customer_name,
          email: o.email,
          phone: o.phone,
          address: `${o.address}, ${o.city}, ${o.state} - ${o.postal_code}`,
          subtotal: parseFloat(o.subtotal),
          discountAmount: parseFloat(o.discount_amount),
          shippingFee: parseFloat(o.shipping_fee),
          taxAmount: parseFloat(o.tax_amount),
          totalAmount: parseFloat(o.total_amount),
          couponCode: o.coupon_code,
          paymentMethod: o.payment_method,
          paymentStatus: o.payment_status,
          orderStatus: o.order_status,
          itemCount: parseInt(o.item_count, 10),
          createdAt: o.created_at
        })),
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum)
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/orders/:id/status
 * Updates status of an order
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const allowedStatuses = ['CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];
    const newStatus = (orderStatus || '').trim().toUpperCase();

    if (!allowedStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`
      });
    }

    const orderId = parseInt(id, 10);
    const result = await query(
      'UPDATE orders SET order_status = $1 WHERE id = $2 RETURNING id, order_number, order_status',
      [newStatus, orderId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const o = result.rows[0];
    res.json({
      success: true,
      message: `Order ${o.order_number} status updated to ${o.order_status}`,
      data: o
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAdminMetrics,
  getAdminProducts,
  createProduct,
  updateProduct,
  toggleProductStatus,
  updateProductStock,
  getAdminOrders,
  updateOrderStatus
};
