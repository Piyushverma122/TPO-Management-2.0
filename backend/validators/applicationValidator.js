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

const validateApplyDrive = validate([
  body('drive_id').isUUID().withMessage('Valid drive ID is required'),
  body('remarks').optional().trim(),
]);

const validateUpdateStatus = validate([
  param('id').isUUID().withMessage('Invalid application ID format'),
  body('status')
    .isIn([
      'Applied',
      'Eligible',
      'Shortlisted',
      'Round 1',
      'Round 2',
      'Technical',
      'HR',
      'Offer',
      'Rejected',
      'Selected',
    ])
    .withMessage('Invalid application stage status'),
  body('round_name').optional().trim(),
  body('remarks').optional().trim(),
]);

const validateApplicationId = validate([
  param('id').isUUID().withMessage('Invalid application ID format'),
]);

const validateBulkShortlist = validate([
  body('application_ids')
    .isArray({ min: 1 })
    .withMessage('application_ids must be a non-empty array of UUIDs'),
  body('round_name').optional().trim(),
  body('remarks').optional().trim(),
]);

const validateBulkReject = validate([
  body('application_ids')
    .isArray({ min: 1 })
    .withMessage('application_ids must be a non-empty array of UUIDs'),
  body('remarks').optional().trim(),
]);

const validateScheduleInterview = validate([
  param('id').isUUID().withMessage('Invalid application ID format'),
  body('round_name').trim().notEmpty().withMessage('Interview round name is required'),
  body('interview_date').isISO8601().withMessage('Valid interview date-time is required'),
  body('mode').optional().isIn(['Online', 'Offline']).withMessage('Mode must be Online or Offline'),
  body('meeting_url').optional().isURL().withMessage('Invalid meeting URL'),
  body('venue').optional().trim(),
  body('remarks').optional().trim(),
]);

const validateQueryFilter = validate([
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('drive_id').optional().isUUID(),
  query('company_id').optional().isUUID(),
]);

module.exports = {
  validateApplyDrive,
  validateUpdateStatus,
  validateApplicationId,
  validateBulkShortlist,
  validateBulkReject,
  validateScheduleInterview,
  validateQueryFilter,
};
