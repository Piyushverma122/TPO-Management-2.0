const { body, query, param, validationResult } = require('express-validator');
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

const validateUpdateSetting = validate([
  param('key').trim().notEmpty().withMessage('Setting key is required'),
  body('value').notEmpty().withMessage('Setting value is required'),
]);

const validateAuditQueryFilter = validate([
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('user_id').optional().isUUID().withMessage('Invalid user ID'),
  query('action').optional().trim(),
  query('category').optional().trim(),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
]);

const validateAuditId = validate([
  param('id').isUUID().withMessage('Invalid audit log ID format'),
]);

module.exports = {
  validateUpdateSetting,
  validateAuditQueryFilter,
  validateAuditId,
};
