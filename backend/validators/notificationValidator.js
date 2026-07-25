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

const validateCreateNotification = validate([
  body('user_id').isUUID().withMessage('Valid user ID is required'),
  body('title').trim().notEmpty().withMessage('Notification title is required'),
  body('message').trim().notEmpty().withMessage('Notification message is required'),
  body('type')
    .optional()
    .isIn(['Drive Announcement', 'Application Update', 'Interview Scheduled', 'System Alert'])
    .withMessage('Invalid notification type'),
]);

const validateBroadcastNotification = validate([
  body('target')
    .isIn(['All Students', 'Branch', 'Department', 'Batch', 'Company', 'Recruiters'])
    .withMessage('Target must be one of: All Students, Branch, Department, Batch, Company, Recruiters'),
  body('title').trim().notEmpty().withMessage('Notification title is required'),
  body('message').trim().notEmpty().withMessage('Notification message is required'),
  body('type')
    .optional()
    .isIn(['Drive Announcement', 'Application Update', 'Interview Scheduled', 'System Alert']),
  body('target_id').optional().trim(),
]);

const validateNotificationId = validate([
  param('id').isUUID().withMessage('Invalid notification ID format'),
]);

const validateQueryFilter = validate([
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['Drive Announcement', 'Application Update', 'Interview Scheduled', 'System Alert']),
]);

module.exports = {
  validateCreateNotification,
  validateBroadcastNotification,
  validateNotificationId,
  validateQueryFilter,
};
