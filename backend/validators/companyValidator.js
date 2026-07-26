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

const validateCreateCompany = validate([
  body('name').trim().notEmpty().withMessage('Company name is required'),
  body('industry').trim().notEmpty().withMessage('Industry classification is required'),
  body('tier')
    .optional()
    .isIn(['Dream', 'Super Dream', 'Standard', 'Mass Recruiter'])
    .withMessage('Tier must be one of: Dream, Super Dream, Standard, Mass Recruiter'),
  body('website').optional().isURL().withMessage('Invalid website URL format'),
  body('min_cgpa').optional().isFloat({ min: 0, max: 10 }).withMessage('min_cgpa must be between 0.0 and 10.0'),
  body('max_backlogs').optional().isInt({ min: 0 }).withMessage('max_backlogs cannot be negative'),
  body('visited_year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Invalid visited year'),
]);

const validateUpdateCompany = validate([
  param('id').isUUID().withMessage('Invalid company ID format'),
  body('name').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
  body('tier')
    .optional()
    .isIn(['Dream', 'Super Dream', 'Standard', 'Mass Recruiter'])
    .withMessage('Invalid tier'),
  body('status')
    .optional()
    .isIn(['Active', 'Upcoming', 'Completed'])
    .withMessage('Invalid company status'),
  body('website').optional().isURL().withMessage('Invalid website URL format'),
  body('min_cgpa').optional().isFloat({ min: 0, max: 10 }).withMessage('min_cgpa must be between 0 and 10'),
]);

const validateCompanyId = validate([
  param('id').isUUID().withMessage('Invalid company ID format'),
]);

const validateCreateRecruiter = validate([
  param('id').isUUID().withMessage('Invalid company ID in parameter'),
  body('email').isEmail().withMessage('Valid official email address is required').normalizeEmail(),
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('designation').trim().notEmpty().withMessage('Designation is required'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number format'),
]);

const validateUpdateRecruiter = validate([
  param('id').isUUID().withMessage('Invalid recruiter ID format'),
  body('designation').optional().trim().notEmpty().withMessage('Designation cannot be empty'),
  body('contact_number').optional().isMobilePhone().withMessage('Invalid phone number'),
]);

const validateQueryFilter = validate([
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
]);

module.exports = {
  validateCreateCompany,
  validateUpdateCompany,
  validateCompanyId,
  validateCreateRecruiter,
  validateUpdateRecruiter,
  validateQueryFilter,
};
