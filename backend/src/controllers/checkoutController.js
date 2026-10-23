const { previewCheckout } = require('../services/orderService');

/**
 * POST /api/checkout/preview
 * Calculates live subtotal, shipping, discounts, tax, and checks real stock
 */
const getCheckoutPreview = async (req, res, next) => {
  try {
    const { items, couponCode } = req.body;
    const preview = await previewCheckout(items, couponCode);

    res.json({
      success: true,
      data: preview
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCheckoutPreview
};
