const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../schemas/validationSchemas');
const { authenticateUser } = require('../middleware/auth');
const { checkoutLimiter } = require('../middleware/rateLimiter');

// Public registration (always customer role)
router.post('/register', checkoutLimiter, validate(registerSchema), authController.register);

// Login
router.post('/login', checkoutLimiter, validate(loginSchema), authController.login);

// Current user profile
router.get('/me', authenticateUser, authController.getMe);

module.exports = router;
