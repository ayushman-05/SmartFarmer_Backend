const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

/**
 * Validates express-validator results and returns errors if any
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return ApiResponse.badRequest(res, 'Validation failed', errorMessages);
  }
  next();
};

module.exports = validate;
