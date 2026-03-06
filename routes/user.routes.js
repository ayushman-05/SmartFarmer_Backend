const express = require('express');
const { body } = require('express-validator');

const userController = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

// All user routes are protected
router.use(protect);

const profileUpdateValidators = [
  body('fullName').optional().trim()
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
  body('address').optional().trim()
    .isLength({ max: 500 }).withMessage('Address too long'),
  body('district').optional().trim().notEmpty().withMessage('District cannot be empty'),
  body('state').optional().trim().notEmpty().withMessage('State cannot be empty'),
  body('dateOfBirth').optional()
    .isISO8601().withMessage('Invalid date format'),
  body('preferredLanguage').optional().trim()
    .isLength({ max: 10 }).withMessage('Invalid language code'),
];

router.get('/me', userController.getProfile);
router.put('/me', profileUpdateValidators, validate, userController.updateProfile);
router.delete('/me', userController.deactivateAccount);

module.exports = router;
