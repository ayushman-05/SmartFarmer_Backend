const logger = require('../utils/logger');
const ApiResponse = require('../utils/apiResponse');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}`, { stack: err.stack });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return ApiResponse.badRequest(res, 'Validation failed', errors);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return ApiResponse.badRequest(res, `${field} already exists`);
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return ApiResponse.badRequest(res, `Invalid ${err.path}: ${err.value}`);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.unauthorized(res, 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.unauthorized(res, 'Token expired');
  }

  // Default to 500
  return ApiResponse.error(
    res,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    err.statusCode || 500
  );
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res) => {
  return ApiResponse.notFound(res, `Route ${req.originalUrl} not found`);
};

module.exports = { errorHandler, notFound };
