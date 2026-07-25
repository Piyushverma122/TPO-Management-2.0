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

const validateCreateConversation = validate([
  body('participant_ids')
    .isArray({ min: 1 })
    .withMessage('participant_ids must be a non-empty array of user UUIDs'),
  body('title').optional().trim(),
  body('is_group').optional().isBoolean(),
]);

const validateSendMessage = validate([
  body('conversation_id').isUUID().withMessage('Valid conversation ID is required'),
  body('message').trim().notEmpty().withMessage('Message text cannot be empty'),
  body('message_type').optional().trim(),
]);

const validateEditMessage = validate([
  param('id').isUUID().withMessage('Invalid message ID format'),
  body('message').trim().notEmpty().withMessage('Updated message text is required'),
]);

const validateMessageId = validate([
  param('id').isUUID().withMessage('Invalid message ID format'),
]);

const validateConversationId = validate([
  param('id').isUUID().withMessage('Invalid conversation ID format'),
]);

const validateQueryFilter = validate([
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
]);

module.exports = {
  validateCreateConversation,
  validateSendMessage,
  validateEditMessage,
  validateMessageId,
  validateConversationId,
  validateQueryFilter,
};
