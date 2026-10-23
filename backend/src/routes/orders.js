const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const validate = require('../middleware/validate');
const { createOrderSchema, orderLookupSchema } = require('../schemas/validationSchemas');
const { checkoutLimiter } = require('../middleware/rateLimiter');

// Place order atomically
router.post('/', checkoutLimiter, validate(createOrderSchema), orderController.createOrder);

// Lookup order by order number + email/phone
router.post('/lookup', validate(orderLookupSchema), orderController.lookupOrder);

// Safe parameterized get with verification
router.get('/:orderNumber', orderController.getOrderByNumber);

module.exports = router;
