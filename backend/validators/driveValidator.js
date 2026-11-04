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

const JOB_TYPES = ['Full Time', 'Internship', 'PPO', 'Dual (Intern + FT)'];
const STATUSES = ['Ongoing', 'Upcoming', 'Conducted', 'Completed', 'Draft'];

const optionalMoney = (field, label) =>
  body(field).optional({ values: 'null' }).if((v) => v !== '').isFloat({ min: 0 }).withMessage(`${label} must be a positive number`);

/** Fields shared by create and update. `required` only matters on create. */
const driveFields = (required) => {
  const need = (chain, message) => (required ? chain.exists({ checkFalsy: true }).withMessage(message) : chain.optional());
  return [
    need(body('passing_year'), 'Passing year is required').isInt({ min: 2000, max: 2100 }).withMessage('Valid passing year is required'),
    need(body('registration_deadline'), 'Registration deadline is required').isISO8601().withMessage('Valid registration deadline date-time is required'),
    need(body('drive_date'), 'Drive date is required').isISO8601().withMessage('Valid drive date is required'),
    body('job_type').optional().isIn(JOB_TYPES).withMessage('Invalid job type'),
    body('drive_mode').optional().isIn(['On Campus', 'Off Campus', 'Pool Campus', 'Virtual']).withMessage('Invalid drive mode'),
    body('status').optional().isIn(STATUSES).withMessage('Invalid status'),
    body('min_cgpa').optional().isFloat({ min: 0, max: 10 }).withMessage('min_cgpa must be between 0.0 and 10.0'),
    body('max_backlogs').optional().isInt({ min: 0 }).withMessage('max_backlogs cannot be negative'),
    body('registration_link').optional({ values: 'falsy' }).isURL({ require_protocol: true }).withMessage('Registration link must start with http(s)://'),
    body('contact_email').optional({ values: 'falsy' }).isEmail().withMessage('Contact email is invalid'),
    body('location_note').optional().isLength({ max: 2000 }),
    body('bond_details').optional().isLength({ max: 2000 }),
    body('description').optional().isLength({ max: 10000 }),
    body('rounds').optional().isArray({ max: 15 }).withMessage('rounds must be a list'),
    body('profiles').optional().isArray({ min: 1, max: 20 }).withMessage('Add between 1 and 20 profiles'),
    body('profiles.*.title').trim().notEmpty().withMessage('Every profile needs a title').isLength({ max: 150 }),
    body('profiles.*.interview_mode').optional({ values: 'falsy' }).isIn(['Virtual', 'Physical', 'Hybrid']).withMessage('Interview mode must be Virtual, Physical or Hybrid'),
    ...['openings', 'probation_months', 'stipend_min', 'stipend_max', 'ctc_min', 'ctc_max', 'ppo_ctc_min', 'ppo_ctc_max'].map((f) =>
      body(`profiles.*.${f}`).optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage(`${f} must be a positive number`)
    ),
    body('profiles.*.stipend_max').custom((max, { req, pathValues }) => {
      const p = req.body.profiles?.[pathValues[0]];
      return !(p && max && p.stipend_min && Number(max) < Number(p.stipend_min));
    }).withMessage('Stipend maximum cannot be below the minimum'),
    body('profiles.*.ctc_max').custom((max, { req, pathValues }) => {
      const p = req.body.profiles?.[pathValues[0]];
      return !(p && max && p.ctc_min && Number(max) < Number(p.ctc_min));
    }).withMessage('CTC maximum cannot be below the minimum'),
    body('branch_ids').optional().isArray(),
    body('department_ids').optional().isArray(),
    body('batches').optional().isArray(),
  ];
};

const validateCreateDrive = validate([
  body('company_id').optional({ values: 'falsy' }).isUUID().withMessage('Valid company ID is required'),
  body('profiles').isArray({ min: 1 }).withMessage('Add at least one profile (role) to the drive'),
  ...driveFields(true),
]);

const validateUpdateDrive = validate([param('id').isUUID().withMessage('Invalid drive ID format'), ...driveFields(false)]);

const validateReject = validate([
  param('id').isUUID().withMessage('Invalid drive ID format'),
  body('reason').trim().notEmpty().withMessage('A reason is required to reject a drive').isLength({ max: 500 }),
]);

const validateDriveId = validate([
  param('id').isUUID().withMessage('Invalid drive ID format'),
]);

const validateQueryFilter = validate([
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('approval_status').optional().isIn(['Draft', 'Pending', 'Approved', 'Rejected']).withMessage('Invalid approval status'),
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
  validateReject,
};
