const twilio = require('twilio');
const logger = require('../utils/logger');

class TwilioService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  /**
   * Send OTP SMS via Twilio
   * @param {string} to - Recipient phone number (E.164 format)
   * @param {string} otp - 6-digit OTP
   * @returns {Promise<object>}
   */
  async sendOTP(to, otp) {
    try {
      // In development, log OTP instead of sending SMS (saves Twilio credits)
      if (process.env.NODE_ENV === 'development') {
        logger.info(`[DEV] OTP for ${to}: ${otp}`);
        return { sid: 'DEV_MODE', status: 'sent' };
      }

      const message = await this.client.messages.create({
        body: `Your FarmerApp verification code is: ${otp}. Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes. Do not share this with anyone.`,
        from: this.fromNumber,
        to,
      });

      logger.info(`OTP sent successfully to ${to}. SID: ${message.sid}`);
      return { sid: message.sid, status: message.status };
    } catch (error) {
      logger.error(`Twilio SMS Error for ${to}: ${error.message}`);
      throw new Error('Failed to send OTP. Please try again.');
    }
  }

  /**
   * Validate phone number format
   * @param {string} phone
   * @returns {boolean}
   */
  isValidPhoneNumber(phone) {
    const e164Regex = /^\+[1-9]\d{9,14}$/;
    return e164Regex.test(phone);
  }
}

module.exports = new TwilioService();
