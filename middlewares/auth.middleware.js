const tokenService = require('../services/tokenService');
const ApiResponse = require('../utils/apiResponse');
const User = require('../models/User');

/**
 * Protect routes — verifies access token
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = tokenService.verifyAccessToken(token);

    // Fetch fresh user data
    const user = await User.findById(decoded.userId).select('-__v');
    if (!user) {
      return ApiResponse.unauthorized(res, 'User no longer exists');
    }

    if (!user.isActive) {
      return ApiResponse.forbidden(res, 'Account has been deactivated');
    }

    req.user = user;
    next();
  } catch (error) {
    return ApiResponse.unauthorized(res, error.message || 'Invalid token');
  }
};

/**
 * Role-based access control middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return ApiResponse.forbidden(
        res,
        `Role '${req.user.role}' is not authorized to access this resource`
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
