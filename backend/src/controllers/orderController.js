const { placeOrder, getOrderByLookup, getCustomerOrders } = require('../services/orderService');

/**
 * POST /api/orders
 * Places an order within an atomic database transaction
 */
const createOrder = async (req, res, next) => {
  try {
    const orderData = {
      ...req.body,
      userId: req.user ? req.user.id : null
    };

    const result = await placeOrder(orderData);

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
 * GET /api/orders/my-orders
 * Returns order history for the authenticated customer
 */
const getMyOrders = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Please log in to view your order history.',
        code: 'UNAUTHORIZED'
      });
    }

    const orders = await getCustomerOrders(req.user.id);

    res.json({
      success: true,
      data: orders
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
  getMyOrders,
  lookupOrder,
  getOrderByNumber
};
