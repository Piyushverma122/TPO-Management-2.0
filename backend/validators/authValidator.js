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
  body('email').isEmail().withMessage('Valid email address is required').normalizeEmail(),
]);

const validateResetPassword = validate([
  body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
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
