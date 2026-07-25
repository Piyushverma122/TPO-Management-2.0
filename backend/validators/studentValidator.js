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

const validateCreateStudent = validate([
  body('email').isEmail().withMessage('Valid email address is required').normalizeEmail(),
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('roll_number').trim().notEmpty().withMessage('Roll number is required'),
  body('cgpa').isFloat({ min: 0, max: 10 }).withMessage('CGPA must be between 0.0 and 10.0'),
  body('passing_year').isInt({ min: 2000, max: 2100 }).withMessage('Valid passing year is required'),
  body('current_semester').optional().isInt({ min: 1, max: 10 }).withMessage('Semester must be between 1 and 10'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
]);

const validateUpdateStudent = validate([
  param('id').isUUID().withMessage('Invalid student ID format'),
  body('roll_number').optional().trim().notEmpty().withMessage('Roll number cannot be empty'),
  body('cgpa').optional().isFloat({ min: 0, max: 10 }).withMessage('CGPA must be between 0.0 and 10.0'),
  body('current_semester').optional().isInt({ min: 1, max: 10 }).withMessage('Semester must be between 1 and 10'),
  body('passing_year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Valid passing year required'),
  body('active_backlogs').optional().isInt({ min: 0 }).withMessage('Backlogs cannot be negative'),
  body('placement_status')
    .optional()
    .isIn(['Placed', 'Unplaced', 'In Process', 'Opted Out'])
    .withMessage('Invalid placement status'),
  body('linkedin_url').optional().isURL().withMessage('Invalid LinkedIn URL'),
  body('github_url').optional().isURL().withMessage('Invalid GitHub URL'),
  body('portfolio_url').optional().isURL().withMessage('Invalid Portfolio URL'),
]);

const validateStudentId = validate([
  param('id').isUUID().withMessage('Invalid student ID format'),
]);

const validateQueryFilter = validate([
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('cgpa_min').optional().isFloat({ min: 0, max: 10 }),
  query('cgpa_max').optional().isFloat({ min: 0, max: 10 }),
]);

module.exports = {
  validateCreateStudent,
  validateUpdateStudent,
  validateStudentId,
  validateQueryFilter,
};
