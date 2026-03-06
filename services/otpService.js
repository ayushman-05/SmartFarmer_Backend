const OTP = require('../models/OTP');
const { generateOTP, getOTPExpiry, isOTPExpired } = require('../utils/otpGenerator');
const twilioService = require('./twilioService');
const logger = require('../utils/logger');

const MAX_OTP_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

class OTPService {
  /**
   * Send OTP to mobile number
   */
  async sendOTP(mobile, purpose = 'login') {
    // Check for recent OTP (cooldown enforcement)
    const recentOTP = await OTP.findOne({
      mobile,
      purpose,
      isUsed: false,
      createdAt: { $gt: new Date(Date.now() - OTP_RESEND_COOLDOWN_SECONDS * 1000) },
    });

    if (recentOTP) {
      const waitSeconds = Math.ceil(
        (OTP_RESEND_COOLDOWN_SECONDS * 1000 - (Date.now() - recentOTP.createdAt)) / 1000
      );
      throw new Error(`Please wait ${waitSeconds} seconds before requesting a new OTP`);
    }

    // Invalidate any existing unused OTPs for this mobile+purpose
    await OTP.updateMany(
      { mobile, purpose, isUsed: false },
      { isUsed: true }
    );

    const otp = generateOTP();
    const expiresAt = getOTPExpiry();

    // Save OTP to DB
    await OTP.create({ mobile, otp, purpose, expiresAt });

    // Send via Twilio
    await twilioService.sendOTP(mobile, otp);

    logger.info(`OTP sent to ${mobile} for ${purpose}`);
    return true;
  }

  /**
   * Verify OTP
   */
  async verifyOTP(mobile, otp, purpose = 'login') {
    const otpDoc = await OTP.findOne({
      mobile,
      purpose,
      isUsed: false,
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      throw new Error('OTP not found or already used. Please request a new one.');
    }

    if (isOTPExpired(otpDoc.expiresAt)) {
      await otpDoc.deleteOne();
      throw new Error('OTP has expired. Please request a new one.');
    }

    if (otpDoc.attempts >= MAX_OTP_ATTEMPTS) {
      await otpDoc.deleteOne();
      throw new Error('Too many failed attempts. Please request a new OTP.');
    }

    if (otpDoc.otp !== otp) {
      // Increment attempts
      otpDoc.attempts += 1;
      await otpDoc.save();
      const remainingAttempts = MAX_OTP_ATTEMPTS - otpDoc.attempts;
      throw new Error(`Invalid OTP. ${remainingAttempts} attempt(s) remaining.`);
    }

    // Mark OTP as used
    otpDoc.isUsed = true;
    await otpDoc.save();

    logger.info(`OTP verified successfully for ${mobile}`);
    return true;
  }
}

module.exports = new OTPService();
