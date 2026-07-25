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

const validateCreateDrive = validate([
  body('company_id').isUUID().withMessage('Valid company ID is required'),
  body('role_title').trim().notEmpty().withMessage('Role title is required'),
  body('job_type')
    .optional()
    .isIn(['Full Time', 'Internship', 'PPO', 'Dual (Intern + FT)'])
    .withMessage('Invalid job type'),
  body('ctc').optional().isFloat({ min: 0 }).withMessage('CTC must be a positive number'),
  body('stipend').optional().isFloat({ min: 0 }).withMessage('Stipend must be a positive number'),
  body('min_cgpa').optional().isFloat({ min: 0, max: 10 }).withMessage('min_cgpa must be between 0.0 and 10.0'),
  body('max_backlogs').optional().isInt({ min: 0 }).withMessage('max_backlogs cannot be negative'),
  body('passing_year').isInt({ min: 2000, max: 2100 }).withMessage('Valid passing year is required'),
  body('registration_deadline').isISO8601().withMessage('Valid registration deadline date-time is required'),
  body('drive_date').isISO8601().withMessage('Valid drive date is required'),
  body('status')
    .optional()
    .isIn(['Ongoing', 'Upcoming', 'Conducted', 'Completed', 'Draft'])
    .withMessage('Invalid status'),
]);

const validateUpdateDrive = validate([
  param('id').isUUID().withMessage('Invalid drive ID format'),
  body('role_title').optional().trim().notEmpty().withMessage('Role title cannot be empty'),
  body('job_type')
    .optional()
    .isIn(['Full Time', 'Internship', 'PPO', 'Dual (Intern + FT)'])
    .withMessage('Invalid job type'),
  body('min_cgpa').optional().isFloat({ min: 0, max: 10 }).withMessage('min_cgpa must be between 0.0 and 10.0'),
  body('status')
    .optional()
    .isIn(['Ongoing', 'Upcoming', 'Conducted', 'Completed', 'Draft'])
    .withMessage('Invalid status'),
]);

const validateDriveId = validate([
  param('id').isUUID().withMessage('Invalid drive ID format'),
]);

const validateQueryFilter = validate([
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['Ongoing', 'Upcoming', 'Conducted', 'Completed', 'Draft']),
  query('job_type').optional().isIn(['Full Time', 'Internship', 'PPO', 'Dual (Intern + FT)']),
]);

const validateBranchArray = validate([
  param('id').isUUID().withMessage('Invalid drive ID format'),
  body('branch_ids').isArray({ min: 1 }).withMessage('branch_ids must be a non-empty array of branch UUIDs'),
]);

const validateDeptArray = validate([
  param('id').isUUID().withMessage('Invalid drive ID format'),
  body('department_ids').isArray({ min: 1 }).withMessage('department_ids must be a non-empty array of department UUIDs'),
]);

const validateBatchArray = validate([
  param('id').isUUID().withMessage('Invalid drive ID format'),
  body('batches').isArray({ min: 1 }).withMessage('batches must be a non-empty array of passing year integers'),
]);

module.exports = {
  validateCreateDrive,
  validateUpdateDrive,
  validateDriveId,
  validateQueryFilter,
  validateBranchArray,
  validateDeptArray,
  validateBatchArray,
};
