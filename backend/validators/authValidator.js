const { body, validationResult } = require('express-validator');
const { sendError } = require('../utils/responseHandler');

const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return sendError(
      res,
      'Validation failed',
      errors.array().map((err) => ({ field: err.path, message: err.msg })),
      400
    );
  };
};

const validateRegister = validate([
  body('email').isEmail().withMessage('Valid email address is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('role')
    .isIn(['admin', 'tpo', 'faculty', 'student', 'recruiter'])
    .withMessage('Role must be one of: admin, tpo, faculty, student, recruiter'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number format'),
  body('department').optional().trim(),
]);

const validateLogin = validate([
  body('email').isEmail().withMessage('Valid email address is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
]);

const validateForgotPassword = validate([
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Valid email address is required')
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters')
    .normalizeEmail(),
]);

const validateResetPassword = validate([
  body('new_password')
    .custom((value, { req }) => {
      const pass = req.body.new_password || req.body.password;
      if (!pass || !pass.trim()) {
        throw new Error('Password is required');
      }
      if (pass.length < 8 || pass.length > 128) {
        throw new Error('Password must be between 8 and 128 characters');
      }
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(pass)) {
        throw new Error(
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        );
      }
      req.body.new_password = pass;
      return true;
    }),
]);

const validateRefreshToken = validate([
  body('refresh_token').notEmpty().withMessage('Refresh token is required'),
]);

module.exports = {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateRefreshToken,
};
