const { body, query, param, validationResult } = require('express-validator');
const { sendError } = require('../utils/responseHandler');

const validate = (validations) => {
  return async (req, res, next) => {
    for (const validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) return next();

    return sendError(
      res,
      'Validation failed',
      errors.array().map((err) => ({ field: err.path, message: err.msg })),
      400
    );
  };
};

const STATUSES = ['Pending Approval', 'Released', 'Accepted', 'Declined', 'Expired', 'Rejected'];
const idParam = param('id').isUUID().withMessage('Invalid offer ID format');

const validateListQuery = validate([
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
  query('company_id').optional().isUUID(),
]);

const validateOfferId = validate([idParam]);

// Runs after multer, so multipart text fields are already on req.body.
const validateCreateOffer = validate([
  body('application_id').isUUID().withMessage('Valid application ID is required'),
  body('package').isFloat({ gt: 0, lt: 1000 }).withMessage('Package (LPA) must be a positive number').toFloat(),
  body('joining_date').optional({ values: 'falsy' }).isISO8601().withMessage('Joining date must be a valid date'),
  body('response_deadline')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Response deadline must be a valid date-time')
    .custom((value) => {
      if (new Date(value).getTime() <= Date.now()) throw new Error('Response deadline must be in the future');
      return true;
    }),
  body('role_title').optional().trim().isLength({ max: 150 }).withMessage('Role title is too long'),
]);

const validateReview = validate([
  idParam,
  body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
  body('remarks').optional().trim().isLength({ max: 500 }).withMessage('Remarks are too long'),
  body('remarks').custom((value, { req }) => {
    if (req.body.action === 'reject' && !value) throw new Error('A reason is required when rejecting an offer');
    return true;
  }),
]);

const validateRespond = validate([
  idParam,
  body('decision').isIn(['accept', 'decline']).withMessage('Decision must be accept or decline'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason is too long'),
]);

module.exports = {
  validateListQuery,
  validateOfferId,
  validateCreateOffer,
  validateReview,
  validateRespond,
};
