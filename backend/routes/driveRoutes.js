const express = require('express');
const router = express.Router();
const driveController = require('../controllers/driveController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeModule } = require('../middleware/authorize');
const { Module, Action } = require('../config/rbac');
const { uploadDriveJd } = require('../config/multer');
const { compressUpload } = require('../middlewares/compressUpload');
const {
  validateCreateDrive,
  validateUpdateDrive,
  validateDriveId,
  validateQueryFilter,
  validateBranchArray,
  validateDeptArray,
  validateBatchArray,
  validateReject,
} = require('../validators/driveValidator');

// All routes require authentication
router.use(verifyToken);

// Placement Drive CRUD Routes
router.get('/', authorizeModule(Module.PLACEMENT_DRIVES, Action.VIEW), validateQueryFilter, driveController.getDrives);
router.get('/lookups', authorizeModule(Module.PLACEMENT_DRIVES, Action.CREATE), driveController.getLookups);
router.get('/summary', authorizeModule(Module.PLACEMENT_DRIVES, Action.CREATE), driveController.getSummary);
router.get('/:id', authorizeModule(Module.PLACEMENT_DRIVES, Action.VIEW), validateDriveId, driveController.getDriveById);
router.get('/:id/my-eligibility', authorizeModule(Module.PLACEMENT_DRIVES, Action.VIEW), validateDriveId, driveController.getMyEligibility);

// Approval workflow (TPO / admin) and the job description file
router.post('/:id/approve', authorizeModule(Module.PLACEMENT_DRIVES, Action.APPROVE), validateDriveId, driveController.approveDrive);
router.post('/:id/reject', authorizeModule(Module.PLACEMENT_DRIVES, Action.APPROVE), validateReject, driveController.rejectDrive);
router.get('/:id/jd', authorizeModule(Module.PLACEMENT_DRIVES, Action.VIEW), validateDriveId, driveController.getJd);
router.post('/:id/jd', authorizeModule(Module.PLACEMENT_DRIVES, Action.EDIT), validateDriveId, uploadDriveJd.single('jd'), compressUpload(), driveController.uploadJd);
router.post('/', authorizeModule(Module.PLACEMENT_DRIVES, Action.CREATE), validateCreateDrive, driveController.createDrive);
router.put('/:id', authorizeModule(Module.PLACEMENT_DRIVES, Action.EDIT), validateUpdateDrive, driveController.updateDrive);
router.delete('/:id', authorizeModule(Module.PLACEMENT_DRIVES, Action.DELETE), validateDriveId, driveController.deleteDrive);

// Drive Full Profile & Analytics Routes
router.get('/:id/profile', authorizeModule(Module.PLACEMENT_DRIVES, Action.VIEW), validateDriveId, driveController.getDriveProfile);
router.get('/:id/statistics', authorizeModule(Module.PLACEMENT_DRIVES, Action.VIEW), validateDriveId, driveController.getDriveStatistics);
router.get(
  '/:id/eligible-students',
  authorizeModule(Module.PLACEMENT_DRIVES, Action.VIEW),
  validateDriveId,
  driveController.getEligibleStudents
);

// Eligibility Binding Routes
router.post(
  '/:id/eligible-branches',
  authorizeModule(Module.PLACEMENT_DRIVES, Action.EDIT),
  validateBranchArray,
  driveController.bindEligibleBranches
);
router.post(
  '/:id/eligible-departments',
  authorizeModule(Module.PLACEMENT_DRIVES, Action.EDIT),
  validateDeptArray,
  driveController.bindEligibleDepartments
);
router.post(
  '/:id/eligible-batches',
  authorizeModule(Module.PLACEMENT_DRIVES, Action.EDIT),
  validateBatchArray,
  driveController.bindEligibleBatches
);

module.exports = router;
