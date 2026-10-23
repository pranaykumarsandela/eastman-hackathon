const rateLimit = require('express-rate-limit');

// General API rate limit: 200 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// Stricter rate limit on checkout & orders: 20 requests per 15 minutes
const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many order attempts from this IP, please try again in a few minutes',
    code: 'CHECKOUT_RATE_LIMIT_EXCEEDED'
  }
});

module.exports = {
  apiLimiter,
  checkoutLimiter
};
