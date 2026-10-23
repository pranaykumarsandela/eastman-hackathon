const { placeOrder, getOrderByLookup } = require('../services/orderService');

/**
 * POST /api/orders
 * Places an order within an atomic database transaction
 */
const createOrder = async (req, res, next) => {
  try {
    const result = await placeOrder(req.body);

    if (result.isDuplicate) {
      return res.status(200).json({
        success: true,
        isDuplicate: true,
        message: result.message,
        data: result.order
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      data: result.order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/lookup
 * Secure order lookup by orderNumber and email or phone
 */
const lookupOrder = async (req, res, next) => {
  try {
    const { orderNumber, contact } = req.body;

    if (!orderNumber || !contact) {
      return res.status(400).json({
        success: false,
        message: 'Both Order Number and verified Email/Phone are required for lookup.'
      });
    }

    const order = await getOrderByLookup(orderNumber, contact);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'No matching order found. Please check your order number and contact details.'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/:orderNumber
 * Fetch order details (requires email or phone in query for privacy verification)
 */
const getOrderByNumber = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const { contact } = req.query;

    if (!contact) {
      return res.status(400).json({
        success: false,
        message: 'Verification contact (email or phone) is required to view order details.'
      });
    }

    const order = await getOrderByLookup(orderNumber, contact);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or verification failed.'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  lookupOrder,
  getOrderByNumber
};
