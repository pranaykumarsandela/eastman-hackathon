const { getClient, query } = require('../config/db');
const config = require('../config/env');
const { evaluateCoupon } = require('./couponService');

/**
 * Calculates authoritative order totals given verified item list and coupon.
 */
const calculateOrderTotals = (verifiedItems, coupon = null) => {
  const subtotal = verifiedItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const roundedSubtotal = Math.round(subtotal * 100) / 100;

  // Coupon evaluation
  let discountAmount = 0;
  let appliedCouponId = null;

  if (coupon) {
    const couponEval = evaluateCoupon(coupon, roundedSubtotal);
    if (couponEval.isValid) {
      discountAmount = couponEval.discountAmount;
      appliedCouponId = coupon.id;
    }
  }

  const taxableAmount = Math.max(0, roundedSubtotal - discountAmount);

  // Shipping policy: Free shipping above threshold (default ₹999), else standard shipping (₹79)
  const shippingFee = (taxableAmount >= config.freeShippingThreshold || taxableAmount === 0) 
    ? 0.00 
    : config.standardShippingFee;

  // Tax policy: Documented 5.0% GST on taxable amount
  const taxAmount = Math.round((taxableAmount * (config.gstTaxPercentage / 100)) * 100) / 100;

  const totalAmount = Math.round((taxableAmount + shippingFee + taxAmount) * 100) / 100;

  return {
    subtotal: roundedSubtotal,
    discountAmount,
    shippingFee,
    taxAmount,
    totalAmount,
    couponId: appliedCouponId
  };
};

/**
 * Previews cart checkout calculations based on current DB prices and stock.
 */
const previewCheckout = async (items, couponCode = null) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw { statusCode: 400, message: 'Cart is empty. Please add items to checkout.' };
  }

  const productIds = items.map(i => i.productId);
  const res = await query(
    'SELECT id, name, price, stock_quantity, is_active FROM products WHERE id = ANY($1)',
    [productIds]
  );

  const productMap = new Map();
  for (const p of res.rows) {
    productMap.set(p.id, p);
  }

  const verifiedItems = [];
  const issues = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product || !product.is_active) {
      issues.push(`Product "${item.productId}" is no longer available.`);
      continue;
    }

    if (item.quantity <= 0) {
      issues.push(`Invalid quantity for "${product.name}". Must be greater than 0.`);
      continue;
    }

    if (product.stock_quantity < item.quantity) {
      issues.push(`Only ${product.stock_quantity} units available for "${product.name}" (requested ${item.quantity}).`);
    }

    verifiedItems.push({
      productId: product.id,
      name: product.name,
      unitPrice: parseFloat(product.price),
      quantity: item.quantity,
      lineTotal: Math.round(parseFloat(product.price) * item.quantity * 100) / 100,
      stockQuantity: product.stock_quantity
    });
  }

  let coupon = null;
  let couponError = null;
  if (couponCode && typeof couponCode === 'string') {
    const couponRes = await query(
      'SELECT * FROM coupons WHERE UPPER(code) = $1',
      [couponCode.trim().toUpperCase()]
    );
    if (couponRes.rowCount > 0) {
      coupon = couponRes.rows[0];
    } else {
      couponError = `Coupon "${couponCode}" not found.`;
    }
  }

  const totals = calculateOrderTotals(verifiedItems, coupon);

  return {
    items: verifiedItems,
    issues,
    hasStockIssues: issues.length > 0,
    coupon: coupon ? {
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: parseFloat(coupon.discount_value)
    } : null,
    couponError,
    ...totals,
    freeShippingThreshold: config.freeShippingThreshold,
    amountNeededForFreeShipping: Math.max(0, config.freeShippingThreshold - (totals.subtotal - totals.discountAmount))
  };
};

/**
 * Places an order atomically within a PostgreSQL transaction using row-level locking (FOR UPDATE).
 */
const placeOrder = async (orderData) => {
  const {
    customerName,
    email,
    phone,
    address,
    city,
    state,
    postalCode,
    paymentMethod = 'COD',
    items,
    couponCode = null,
    idempotencyKey = null
  } = orderData;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw { statusCode: 400, message: 'Cannot place an order with an empty cart.' };
  }

  // Idempotency check: if key provided, check if already processed
  if (idempotencyKey) {
    const existingOrder = await query(
      'SELECT id, order_number, total_amount, order_status, created_at FROM orders WHERE idempotency_key = $1',
      [idempotencyKey]
    );
    if (existingOrder.rowCount > 0) {
      return {
        isDuplicate: true,
        order: existingOrder.rows[0],
        message: 'Order already processed successfully.'
      };
    }
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Lock and retrieve inventory rows
    const productIds = items.map(i => i.productId);
    const productsRes = await client.query(
      'SELECT id, name, price, stock_quantity, is_active FROM products WHERE id = ANY($1) FOR UPDATE',
      [productIds]
    );

    const productMap = new Map();
    for (const p of productsRes.rows) {
      productMap.set(p.id, p);
    }

    const verifiedItems = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product || !product.is_active) {
        throw { statusCode: 400, message: `Product "${item.productId}" is not available.` };
      }

      if (item.quantity <= 0) {
        throw { statusCode: 400, message: `Invalid quantity ${item.quantity} for "${product.name}".` };
      }

      if (product.stock_quantity < item.quantity) {
        throw { 
          statusCode: 409, 
          message: `Insufficient stock for "${product.name}". Requested ${item.quantity}, but only ${product.stock_quantity} available.` 
        };
      }

      verifiedItems.push({
        productId: product.id,
        name: product.name,
        unitPrice: parseFloat(product.price),
        quantity: item.quantity,
        lineTotal: Math.round(parseFloat(product.price) * item.quantity * 100) / 100
      });
    }

    // 2. Validate coupon with row lock if applicable
    let coupon = null;
    if (couponCode && typeof couponCode === 'string') {
      const couponRes = await client.query(
        'SELECT * FROM coupons WHERE UPPER(code) = $1 FOR UPDATE',
        [couponCode.trim().toUpperCase()]
      );
      if (couponRes.rowCount > 0) {
        coupon = couponRes.rows[0];
      }
    }

    // 3. Calculate authoritative totals
    const totals = calculateOrderTotals(verifiedItems, coupon);

    // 4. Generate unique readable order number
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderNumber = `SC-${datePrefix}-${randomSuffix}`;

    // 5. Insert order record
    const insertOrderSql = `
      INSERT INTO orders (
        order_number, customer_name, email, phone, address, city, state, postal_code,
        subtotal, discount_amount, shipping_fee, tax_amount, total_amount,
        coupon_id, payment_method, payment_status, order_status, idempotency_key
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18
      ) RETURNING id, order_number, total_amount, order_status, created_at
    `;

    const orderValues = [
      orderNumber, customerName, email, phone, address, city, state, postalCode,
      totals.subtotal, totals.discountAmount, totals.shippingFee, totals.taxAmount, totals.totalAmount,
      totals.couponId, paymentMethod, paymentMethod === 'SIMULATED_ONLINE' ? 'PAID' : 'PENDING', 'CONFIRMED', idempotencyKey
    ];

    const orderRes = await client.query(insertOrderSql, orderValues);
    const createdOrder = orderRes.rows[0];

    // 6. Insert order items & update product stock quantities
    for (const item of verifiedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name_snapshot, unit_price, quantity, line_total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [createdOrder.id, item.productId, item.name, item.unitPrice, item.quantity, item.lineTotal]
      );

      // Decrement stock atomically
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
        [item.quantity, item.productId]
      );
    }

    // 7. Increment coupon usage if coupon applied
    if (totals.couponId) {
      await client.query(
        'UPDATE coupons SET usage_count = usage_count + 1 WHERE id = $1',
        [totals.couponId]
      );
    }

    // Commit transaction!
    await client.query('COMMIT');

    return {
      success: true,
      order: {
        id: createdOrder.id,
        orderNumber: createdOrder.order_number,
        customerName,
        email,
        phone,
        address: `${address}, ${city}, ${state} - ${postalCode}`,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        shippingFee: totals.shippingFee,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        paymentMethod,
        orderStatus: createdOrder.order_status,
        items: verifiedItems,
        createdAt: createdOrder.created_at
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[ORDER TRANSACTION FAILED]', error.message);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Looks up an order by orderNumber + email/phone (secure lookup to avoid sequential ID exposure).
 */
const getOrderByLookup = async (orderNumber, verificationContact) => {
  const contact = (verificationContact || '').trim().toLowerCase();
  
  const orderRes = await query(
    `SELECT o.*, c.code as coupon_code 
     FROM orders o
     LEFT JOIN coupons c ON o.coupon_id = c.id
     WHERE UPPER(o.order_number) = $1 AND (LOWER(o.email) = $2 OR o.phone = $3)`,
    [orderNumber.trim().toUpperCase(), contact, contact]
  );

  if (orderRes.rowCount === 0) {
    return null;
  }

  const order = orderRes.rows[0];

  const itemsRes = await query(
    `SELECT oi.*, p.image_url, p.category
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = $1`,
    [order.id]
  );

  return {
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    email: order.email,
    phone: order.phone,
    address: order.address,
    city: order.city,
    state: order.state,
    postalCode: order.postal_code,
    subtotal: parseFloat(order.subtotal),
    discountAmount: parseFloat(order.discount_amount),
    shippingFee: parseFloat(order.shipping_fee),
    taxAmount: parseFloat(order.tax_amount),
    totalAmount: parseFloat(order.total_amount),
    couponCode: order.coupon_code,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    orderStatus: order.order_status,
    createdAt: order.created_at,
    items: itemsRes.rows.map(item => ({
      id: item.id,
      productId: item.product_id,
      name: item.product_name_snapshot,
      unitPrice: parseFloat(item.unit_price),
      quantity: item.quantity,
      lineTotal: parseFloat(item.line_total),
      imageUrl: item.image_url,
      category: item.category
    }))
  };
};

module.exports = {
  calculateOrderTotals,
  previewCheckout,
  placeOrder,
  getOrderByLookup
};
