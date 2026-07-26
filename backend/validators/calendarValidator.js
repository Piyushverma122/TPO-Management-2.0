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

const validateCreateEvent = validate([
  body('title').trim().notEmpty().withMessage('Event title is required'),
  body('event_type')
    .isIn(['placement_drive', 'mock_interview', 'training', 'meeting', 'deadline', 'reminder'])
    .withMessage('event_type must be placement_drive, mock_interview, training, meeting, deadline, or reminder'),
  body('start_time').isISO8601().withMessage('Valid start_time ISO timestamp is required'),
  body('end_time').isISO8601().withMessage('Valid end_time ISO timestamp is required'),
  body('location').optional().trim(),
  body('is_all_day').optional().isBoolean(),
  body('reminder_minutes_before').optional().isInt({ min: 0 }),
]);

const validateUpdateEvent = validate([
  param('id').isUUID().withMessage('Invalid event ID format'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('event_type')
    .optional()
    .isIn(['placement_drive', 'mock_interview', 'training', 'meeting', 'deadline', 'reminder']),
  body('start_time').optional().isISO8601(),
  body('end_time').optional().isISO8601(),
]);

const validateEventId = validate([
  param('id').isUUID().withMessage('Invalid event ID format'),
]);

const validateQueryFilter = validate([
  query('start_date').optional().isISO8601().withMessage('Valid start_date required'),
  query('end_date').optional().isISO8601().withMessage('Valid end_date required'),
]);

module.exports = {
  validateCreateEvent,
  validateUpdateEvent,
  validateEventId,
  validateQueryFilter,
};
