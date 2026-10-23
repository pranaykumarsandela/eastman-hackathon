const config = require('../config/env');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  
  // Clean, consistent JSON error response
  const response = {
    success: false,
    message: err.message || 'An internal server error occurred',
    code: err.code || 'INTERNAL_ERROR'
  };

  if (err.errors) {
    response.errors = err.errors;
  }

  if (config.nodeEnv === 'development' && statusCode === 500) {
    response.stack = err.stack;
  }

  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);

  res.status(statusCode).json(response);
};

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found at ${req.originalUrl}`,
    code: 'NOT_FOUND'
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
