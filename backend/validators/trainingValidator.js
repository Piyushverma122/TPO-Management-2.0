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

const validateCreateTraining = validate([
  body('title').trim().notEmpty().withMessage('Training title is required'),
  body('category')
    .optional()
    .isIn(['Technical', 'Aptitude', 'Soft Skills', 'Coding Bootcamp'])
    .withMessage('Category must be Technical, Aptitude, Soft Skills, or Coding Bootcamp'),
  body('duration_hours').optional().isInt({ min: 1 }).withMessage('Duration in hours must be a positive integer'),
  body('level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Level must be Beginner, Intermediate, or Advanced'),
  body('status')
    .optional()
    .isIn(['Active', 'Upcoming', 'Completed'])
    .withMessage('Status must be Active, Upcoming, or Completed'),
  body('start_date').optional().isISO8601().withMessage('Valid start date is required'),
  body('end_date').optional().isISO8601().withMessage('Valid end date is required'),
]);

const validateUpdateTraining = validate([
  param('id').isUUID().withMessage('Invalid training ID format'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('category')
    .optional()
    .isIn(['Technical', 'Aptitude', 'Soft Skills', 'Coding Bootcamp'])
    .withMessage('Invalid category'),
  body('status')
    .optional()
    .isIn(['Active', 'Upcoming', 'Completed'])
    .withMessage('Invalid status'),
]);

const validateTrainingId = validate([
  param('id').isUUID().withMessage('Invalid training ID format'),
]);

const validateAttendance = validate([
  param('id').isUUID().withMessage('Invalid training ID format'),
  body('session_id').isUUID().withMessage('Valid session ID is required'),
  body('student_id').isUUID().withMessage('Valid student ID is required'),
  body('is_present').isBoolean().withMessage('is_present must be a boolean (true/false)'),
]);

const validateQueryFilter = validate([
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn(['Technical', 'Aptitude', 'Soft Skills', 'Coding Bootcamp']),
  query('status').optional().isIn(['Active', 'Upcoming', 'Completed']),
]);

module.exports = {
  validateCreateTraining,
  validateUpdateTraining,
  validateTrainingId,
  validateAttendance,
  validateQueryFilter,
};
