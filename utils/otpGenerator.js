const crypto = require('crypto');

/**
 * Generates a cryptographically secure 6-digit OTP
 */
const generateOTP = () => {
  const buffer = crypto.randomBytes(3);
  const otp = (parseInt(buffer.toString('hex'), 16) % 900000) + 100000;
  return otp.toString();
};

/**
 * Returns OTP expiry date
 */
const getOTPExpiry = (minutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

/**
 * Checks if OTP is expired
 */
const isOTPExpired = (expiryDate) => {
  return new Date() > new Date(expiryDate);
};

module.exports = { generateOTP, getOTPExpiry, isOTPExpired };
