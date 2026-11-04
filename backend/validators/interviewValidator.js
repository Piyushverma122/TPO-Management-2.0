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

const STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'Passed', 'Failed'];

const idParam = param('id').isUUID().withMessage('Invalid interview ID format');

const modeRules = (requireForMode) => [
  body('mode').optional().isIn(['Online', 'Offline']).withMessage('Mode must be Online or Offline'),
  body('meeting_url')
    .optional({ values: 'falsy' })
    .isURL({ require_protocol: true })
    .withMessage('Meeting link must be a valid URL (include https://)'),
  body('venue').optional().trim().isLength({ max: 255 }).withMessage('Venue is too long'),
  body('interviewer_name').optional().trim().isLength({ max: 150 }).withMessage('Interviewer name is too long'),
  ...(requireForMode
    ? [
        body('meeting_url').custom((value, { req }) => {
          if ((req.body.mode || 'Online') === 'Online' && !value) throw new Error('Meeting link is required for online interviews');
          return true;
        }),
        body('venue').custom((value, { req }) => {
          if (req.body.mode === 'Offline' && !value) throw new Error('Venue is required for offline interviews');
          return true;
        }),
      ]
    : []),
];

const validateListQuery = validate([
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
  query('company_id').optional().isUUID(),
  query('drive_id').optional().isUUID(),
  query('student_id').optional().isUUID(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('upcoming').optional().isBoolean(),
  query('view').optional().isIn(['upcoming', 'live', 'awaiting', 'history']).withMessage('View must be one of: upcoming, live, awaiting, history'),
]);

const validateInterviewId = validate([idParam]);

const validateCreateInterview = validate([
  body('application_id').isUUID().withMessage('Valid application ID is required'),
  body('round_name').trim().notEmpty().withMessage('Round name is required').isLength({ max: 100 }),
  body('scheduled_at').isISO8601().withMessage('Valid interview date-time is required'),
  body('end_at').optional().isISO8601().withMessage('End time must be a valid date-time'),
  ...modeRules(true),
]);

const validateReschedule = validate([
  idParam,
  body('round_name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('scheduled_at').optional().isISO8601().withMessage('Valid interview date-time is required'),
  body('end_at').optional().isISO8601().withMessage('End time must be a valid date-time'),
  ...modeRules(false),
]);

const validateCancel = validate([idParam, body('reason').optional().trim().isLength({ max: 500 })]);

const validateResult = validate([
  idParam,
  body('result').isIn(['Passed', 'Failed']).withMessage('Result must be Passed or Failed'),
  body('feedback').optional().trim().isLength({ max: 2000 }).withMessage('Feedback is too long'),
  body('is_final').optional().isBoolean().withMessage('is_final must be true or false'),
]);

module.exports = {
  validateListQuery,
  validateInterviewId,
  validateCreateInterview,
  validateReschedule,
  validateCancel,
  validateResult,
};
