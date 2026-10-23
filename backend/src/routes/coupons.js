const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const validate = require('../middleware/validate');
const { couponValidateSchema } = require('../schemas/validationSchemas');

// List public active coupons
router.get('/', couponController.getPublicCoupons);

// Validate single coupon against subtotal
router.post('/validate', validate(couponValidateSchema), couponController.validateCoupon);

// Smart Savings Assistant recommendation
router.get('/recommendation', couponController.getRecommendation);

module.exports = router;
