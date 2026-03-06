const User = require('../models/User');
const otpService = require('../services/otpService');
const tokenService = require('../services/tokenService');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

class AuthController {
  /**
   * STEP 1: Register farmer — collect details and send OTP
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { fullName, mobile, address, district, state, dateOfBirth } = req.body;

      // Check if mobile already registered and verified
      const existingUser = await User.findOne({ mobile });
      if (existingUser && existingUser.isVerified) {
        return ApiResponse.badRequest(
          res,
          'Mobile number already registered. Please login.'
        );
      }

      // If unverified user exists, update their details
      if (existingUser && !existingUser.isVerified) {
        existingUser.fullName = fullName;
        existingUser.address = address;
        existingUser.district = district;
        existingUser.state = state;
        existingUser.dateOfBirth = dateOfBirth;
        await existingUser.save();
      } else {
        // Create new unverified user
        await User.create({
          fullName,
          mobile,
          address,
          district,
          state,
          dateOfBirth,
          isVerified: false,
        });
      }

      // Send OTP
      await otpService.sendOTP(mobile, 'registration');

      return ApiResponse.success(
        res,
        { mobile },
        'OTP sent successfully. Please verify your number.'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * STEP 2: Verify registration OTP
   * POST /api/auth/verify-registration
   */
  async verifyRegistration(req, res, next) {
    try {
      const { mobile, otp } = req.body;

      await otpService.verifyOTP(mobile, otp, 'registration');

      const user = await User.findOneAndUpdate(
        { mobile },
        { isVerified: true, lastLogin: new Date() },
        { new: true }
      );

      if (!user) {
        return ApiResponse.notFound(res, 'User not found. Please register again.');
      }

      const deviceInfo = req.headers['user-agent'] || null;
      const ipAddress = req.ip || null;

      const { accessToken, refreshToken } = await tokenService.generateTokenPair(
        user,
        deviceInfo,
        ipAddress
      );

      logger.info(`New farmer registered: ${user._id} | ${mobile}`);

      return ApiResponse.created(res, {
        user: user.toSafeObject(),
        accessToken,
        refreshToken,
      }, 'Registration successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * STEP 1 (Login): Send login OTP to existing user
   * POST /api/auth/send-otp
   */
  async sendLoginOTP(req, res, next) {
    try {
      const { mobile } = req.body;

      const user = await User.findOne({ mobile, isVerified: true });
      if (!user) {
        return ApiResponse.notFound(
          res,
          'No verified account found with this number. Please register.'
        );
      }

      if (!user.isActive) {
        return ApiResponse.forbidden(res, 'Your account has been deactivated.');
      }

      await otpService.sendOTP(mobile, 'login');

      return ApiResponse.success(res, { mobile }, 'OTP sent successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * STEP 2 (Login): Verify login OTP and issue tokens
   * POST /api/auth/verify-login
   */
  async verifyLogin(req, res, next) {
    try {
      const { mobile, otp } = req.body;

      await otpService.verifyOTP(mobile, otp, 'login');

      const user = await User.findOneAndUpdate(
        { mobile },
        { lastLogin: new Date() },
        { new: true }
      );

      if (!user) {
        return ApiResponse.notFound(res, 'User not found');
      }

      const deviceInfo = req.headers['user-agent'] || null;
      const ipAddress = req.ip || null;

      const { accessToken, refreshToken } = await tokenService.generateTokenPair(
        user,
        deviceInfo,
        ipAddress
      );

      logger.info(`Farmer logged in: ${user._id} | ${mobile}`);

      return ApiResponse.success(res, {
        user: user.toSafeObject(),
        accessToken,
        refreshToken,
      }, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token using refresh token
   * POST /api/auth/refresh-token
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return ApiResponse.badRequest(res, 'Refresh token is required');
      }

      const tokenDoc = await tokenService.validateRefreshToken(refreshToken);
      const user = tokenDoc.userId; // Populated

      if (!user.isActive) {
        return ApiResponse.forbidden(res, 'Account is deactivated');
      }

      // Rotate refresh token (revoke old, issue new)
      await tokenService.revokeRefreshToken(refreshToken);

      const { accessToken, refreshToken: newRefreshToken } =
        await tokenService.generateTokenPair(
          user,
          req.headers['user-agent'] || null,
          req.ip || null
        );

      return ApiResponse.success(res, {
        accessToken,
        refreshToken: newRefreshToken,
      }, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout — revoke refresh token
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await tokenService.revokeRefreshToken(refreshToken);
      }

      logger.info(`User logged out: ${req.user._id}`);

      return ApiResponse.success(res, {}, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout from all devices
   * POST /api/auth/logout-all
   */
  async logoutAll(req, res, next) {
    try {
      await tokenService.revokeAllUserTokens(req.user._id);

      logger.info(`User logged out from all devices: ${req.user._id}`);

      return ApiResponse.success(res, {}, 'Logged out from all devices');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
