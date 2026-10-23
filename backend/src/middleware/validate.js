const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[property]);
      req[property] = parsed;
      next();
    } catch (err) {
      const formattedErrors = err.errors ? err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      })) : [{ message: err.message }];

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: formattedErrors
      });
    }
  };
};

module.exports = validate;
