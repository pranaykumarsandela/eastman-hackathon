const { query } = require('../config/db');

/**
 * GET /api/products
 * Query params: search, category, sortBy, minPrice, maxPrice, page, limit
 */
const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      sortBy = 'rating_desc',
      minPrice,
      maxPrice,
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions = ['is_active = TRUE'];
    const values = [];
    let paramCounter = 1;

    // Search filter across name and description
    if (search && search.trim()) {
      conditions.push(`(name ILIKE $${paramCounter} OR description ILIKE $${paramCounter})`);
      values.push(`%${search.trim()}%`);
      paramCounter++;
    }

    // Category filter
    if (category && category !== 'All' && category.trim()) {
      conditions.push(`category = $${paramCounter}`);
      values.push(category.trim());
      paramCounter++;
    }

    // Price range filters
    if (minPrice && !isNaN(minPrice)) {
      conditions.push(`price >= $${paramCounter}`);
      values.push(parseFloat(minPrice));
      paramCounter++;
    }

    if (maxPrice && !isNaN(maxPrice)) {
      conditions.push(`price <= $${paramCounter}`);
      values.push(parseFloat(maxPrice));
      paramCounter++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sorting
    let orderBy = 'rating DESC, created_at DESC';
    switch (sortBy) {
      case 'price_asc':
        orderBy = 'price ASC';
        break;
      case 'price_desc':
        orderBy = 'price DESC';
        break;
      case 'rating_desc':
        orderBy = 'rating DESC';
        break;
      case 'newest':
        orderBy = 'created_at DESC';
        break;
      case 'name_asc':
        orderBy = 'name ASC';
        break;
    }

    // Total count query
    const countSql = `SELECT COUNT(*) FROM products ${whereClause}`;
    const countRes = await query(countSql, values);
    const totalCount = parseInt(countRes.rows[0].count, 10);

    // Data query
    const dataSql = `
      SELECT id, name, description, price, category, image_url, stock_quantity, rating, created_at
      FROM products
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;
    const dataValues = [...values, limitNum, offset];
    const dataRes = await query(dataSql, dataValues);

    const products = dataRes.rows.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: parseFloat(p.price),
      category: p.category,
      imageUrl: p.image_url,
      stockQuantity: p.stock_quantity,
      rating: parseFloat(p.rating),
      inStock: p.stock_quantity > 0,
      createdAt: p.created_at
    }));

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/:id
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const result = await query(
      'SELECT * FROM products WHERE id = $1 AND is_active = TRUE',
      [productId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const p = result.rows[0];
    res.json({
      success: true,
      data: {
        id: p.id,
        name: p.name,
        description: p.description,
        price: parseFloat(p.price),
        category: p.category,
        imageUrl: p.image_url,
        stockQuantity: p.stock_quantity,
        rating: parseFloat(p.rating),
        inStock: p.stock_quantity > 0,
        createdAt: p.created_at
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/categories
 */
const getCategories = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT DISTINCT category, COUNT(*) as count FROM products WHERE is_active = TRUE GROUP BY category ORDER BY category ASC'
    );

    res.json({
      success: true,
      data: result.rows.map(r => ({
        name: r.category,
        count: parseInt(r.count, 10)
      }))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  getCategories
};
