const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const validate = require('../middleware/validate');
const { checkoutPreviewSchema } = require('../schemas/validationSchemas');
const { checkoutLimiter } = require('../middleware/rateLimiter');

// Live calculation preview before order submission
router.post('/preview', checkoutLimiter, validate(checkoutPreviewSchema), checkoutController.getCheckoutPreview);

module.exports = router;
