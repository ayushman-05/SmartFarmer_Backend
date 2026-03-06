const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

class UserController {
  /**
   * Get current user profile
   * GET /api/users/me
   */
  async getProfile(req, res, next) {
    try {
      return ApiResponse.success(res, { user: req.user.toSafeObject() }, 'Profile fetched');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update profile — mobile number update NOT allowed
   * PUT /api/users/me
   */
  async updateProfile(req, res, next) {
    try {
      const { fullName, address, district, state, dateOfBirth, preferredLanguage } = req.body;

      // Explicitly exclude mobile from updates
      const updateData = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (address !== undefined) updateData.address = address;
      if (district !== undefined) updateData.district = district;
      if (state !== undefined) updateData.state = state;
      if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
      if (preferredLanguage !== undefined) updateData.preferredLanguage = preferredLanguage;

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      logger.info(`Profile updated for user: ${req.user._id}`);

      return ApiResponse.success(res, { user: user.toSafeObject() }, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate own account
   * DELETE /api/users/me
   */
  async deactivateAccount(req, res, next) {
    try {
      await User.findByIdAndUpdate(req.user._id, { isActive: false });

      logger.info(`Account deactivated: ${req.user._id}`);

      return ApiResponse.success(res, {}, 'Account deactivated successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
