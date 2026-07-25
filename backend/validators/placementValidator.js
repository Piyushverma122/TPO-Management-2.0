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

const validateCreatePlacement = validate([
  body('student_id').isUUID().withMessage('Valid student ID is required'),
  body('company_id').isUUID().withMessage('Valid company ID is required'),
  body('drive_id').isUUID().withMessage('Valid drive ID is required'),
  body('package').isFloat({ min: 0 }).withMessage('Package (CTC) must be a positive number'),
  body('joining_date').optional().isISO8601().withMessage('Valid joining date is required'),
  body('offer_status').optional().trim(),
]);

const validateUpdatePlacement = validate([
  param('id').isUUID().withMessage('Invalid placement ID format'),
  body('package').optional().isFloat({ min: 0 }).withMessage('Package must be a positive number'),
  body('joining_date').optional().isISO8601().withMessage('Valid joining date required'),
]);

const validatePlacementId = validate([
  param('id').isUUID().withMessage('Invalid placement ID format'),
]);

const validateQueryFilter = validate([
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('company_id').optional().isUUID(),
  query('student_id').optional().isUUID(),
  query('drive_id').optional().isUUID(),
]);

module.exports = {
  validateCreatePlacement,
  validateUpdatePlacement,
  validatePlacementId,
  validateQueryFilter,
};
