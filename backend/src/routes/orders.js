const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const validate = require('../middleware/validate');
const { createOrderSchema, orderLookupSchema } = require('../schemas/validationSchemas');
const { checkoutLimiter } = require('../middleware/rateLimiter');
const { authenticateUser, optionalAuth } = require('../middleware/auth');

// Customer order history (authenticated)
router.get('/my-orders', authenticateUser, orderController.getMyOrders);

// Place order atomically (supports both authenticated customer and guest)
router.post('/', checkoutLimiter, optionalAuth, validate(createOrderSchema), orderController.createOrder);

// Lookup order by order number + email/phone (public secure verification)
router.post('/lookup', validate(orderLookupSchema), orderController.lookupOrder);

// Safe parameterized get with verification
router.get('/:orderNumber', orderController.getOrderByNumber);

module.exports = router;
