const { query } = require('../config/db');
const { validateCouponCode, getBestCouponRecommendation } = require('../services/couponService');

/**
 * GET /api/coupons
 * Returns list of public active coupons that customers can explore
 */
const getPublicCoupons = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, code, discount_type, discount_value, minimum_order_value, maximum_discount, expiry_date
       FROM coupons
       WHERE is_active = TRUE AND expiry_date > NOW()
       ORDER BY minimum_order_value ASC`
    );

    const coupons = result.rows.map(c => ({
      id: c.id,
      code: c.code,
      discountType: c.discount_type,
      discountValue: parseFloat(c.discount_value),
      minOrder: parseFloat(c.minimum_order_value),
      maxDiscount: c.maximum_discount ? parseFloat(c.maximum_discount) : null,
      expiryDate: c.expiry_date,
      description: c.discount_type === 'PERCENTAGE' 
        ? `${c.discount_value}% OFF${c.maximum_discount ? ` up to ₹${c.maximum_discount}` : ''}`
        : `Flat ₹${c.discount_value} OFF`
    }));

    res.json({
      success: true,
      data: coupons
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/coupons/validate
 * Body: { code: string, subtotal: number }
 */
const validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required'
      });
    }

    const numericSubtotal = parseFloat(subtotal) || 0;
    const result = await validateCouponCode(code, numericSubtotal);

    if (!result.isValid) {
      return res.status(400).json({
        success: false,
        message: result.error,
        shortfall: result.shortfall || 0
      });
    }

    res.json({
      success: true,
      message: `Coupon "${result.coupon.code}" applied successfully! You save ₹${result.discountAmount.toFixed(2)}`,
      data: {
        code: result.coupon.code,
        discountType: result.coupon.discount_type,
        discountValue: result.coupon.discount_value,
        discountAmount: result.discountAmount,
        minOrder: result.coupon.minimum_order_value,
        maxDiscount: result.coupon.maximum_discount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/coupons/recommendation?subtotal=...
 * Calls deterministic Smart Savings Assistant algorithm
 */
const getRecommendation = async (req, res, next) => {
  try {
    const subtotal = parseFloat(req.query.subtotal) || 0;
    const recommendation = await getBestCouponRecommendation(subtotal);

    res.json({
      success: true,
      data: recommendation
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicCoupons,
  validateCoupon,
  getRecommendation
};
