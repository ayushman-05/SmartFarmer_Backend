const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

// Rate limiters
const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { success: false, message: 'Too many OTP requests. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});

// Validators
const registerValidators = [
  body('fullName').trim().notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
  body('mobile').trim().notEmpty().withMessage('Mobile number is required')
    .matches(/^\+?[1-9]\d{9,14}$/).withMessage('Invalid mobile number format (use E.164 format, e.g. +919876543210)'),
  body('address').trim().notEmpty().withMessage('Address is required')
    .isLength({ max: 500 }).withMessage('Address too long'),
  body('district').trim().notEmpty().withMessage('District is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('dateOfBirth').notEmpty().withMessage('Date of birth is required')
    .isISO8601().withMessage('Invalid date format'),
];

const mobileValidator = [
  body('mobile').trim().notEmpty().withMessage('Mobile is required')
    .matches(/^\+?[1-9]\d{9,14}$/).withMessage('Invalid mobile number format'),
];

const otpVerifyValidators = [
  body('mobile').trim().notEmpty().withMessage('Mobile is required'),
  body('otp').trim().notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .isNumeric().withMessage('OTP must be numeric'),
];

// ── Routes ──────────────────────────────────────────────────────────────────

// Registration flow
router.post('/register', otpRateLimiter, registerValidators, validate, authController.register);
router.post('/verify-registration', otpRateLimiter, otpVerifyValidators, validate, authController.verifyRegistration);

// Login flow
router.post('/send-otp', loginRateLimiter, mobileValidator, validate, authController.sendLoginOTP);
router.post('/verify-login', loginRateLimiter, otpVerifyValidators, validate, authController.verifyLogin);

// Token management
router.post('/refresh-token',
  body('refreshToken').notEmpty().withMessage('Refresh token required'),
  validate,
  authController.refreshToken
);

// Protected logout routes
router.post('/logout', protect, authController.logout);
router.post('/logout-all', protect, authController.logoutAll);

module.exports = router;
