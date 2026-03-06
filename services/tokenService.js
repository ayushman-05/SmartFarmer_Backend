const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');
const logger = require('../utils/logger');

class TokenService {
  /**
   * Generate Access Token (short-lived)
   */
  generateAccessToken(payload) {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m',
      issuer: 'farmer-app',
      audience: 'farmer-app-client',
    });
  }

  /**
   * Generate Refresh Token (long-lived, stored in DB)
   */
  generateRefreshToken() {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Verify Access Token
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
        issuer: 'farmer-app',
        audience: 'farmer-app-client',
      });
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  /**
   * Save refresh token to DB
   */
  async saveRefreshToken(userId, token, deviceInfo = null, ipAddress = null) {
    const expiresAt = new Date();
    const days = parseInt(process.env.REFRESH_TOKEN_EXPIRY) || 7;
    expiresAt.setDate(expiresAt.getDate() + days);

    // Revoke old tokens for this device to prevent accumulation
    await RefreshToken.deleteMany({ userId, isRevoked: true });

    const refreshToken = await RefreshToken.create({
      userId,
      token,
      expiresAt,
      deviceInfo,
      ipAddress,
    });

    return refreshToken;
  }

  /**
   * Validate refresh token from DB
   */
  async validateRefreshToken(token) {
    const tokenDoc = await RefreshToken.findOne({
      token,
      isRevoked: false,
    }).populate('userId');

    if (!tokenDoc) throw new Error('Invalid refresh token');
    if (new Date() > tokenDoc.expiresAt) {
      await tokenDoc.deleteOne();
      throw new Error('Refresh token expired');
    }

    return tokenDoc;
  }

  /**
   * Revoke a specific refresh token
   */
  async revokeRefreshToken(token) {
    await RefreshToken.findOneAndUpdate({ token }, { isRevoked: true });
  }

  /**
   * Revoke all refresh tokens for a user (logout all devices)
   */
  async revokeAllUserTokens(userId) {
    await RefreshToken.updateMany({ userId }, { isRevoked: true });
  }

  /**
   * Generate both tokens and return token pair
   */
  async generateTokenPair(user, deviceInfo = null, ipAddress = null) {
    const payload = {
      userId: user._id.toString(),
      mobile: user.mobile,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken();

    await this.saveRefreshToken(user._id, refreshToken, deviceInfo, ipAddress);

    return { accessToken, refreshToken };
  }
}

module.exports = new TokenService();
