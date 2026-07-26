const express = require('express');
const router = express.Router();
const driveController = require('../controllers/driveController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeModule } = require('../middleware/authorize');
const { Module, Action } = require('../config/rbac');
const {
  validateCreateDrive,
  validateUpdateDrive,
  validateDriveId,
  validateQueryFilter,
  validateBranchArray,
  validateDeptArray,
  validateBatchArray,
} = require('../validators/driveValidator');

// All routes require authentication
router.use(verifyToken);

// Placement Drive CRUD Routes
router.get('/', authorizeModule(Module.PLACEMENT_DRIVES, Action.VIEW), validateQueryFilter, driveController.getDrives);
router.get('/:id', authorizeModule(Module.PLACEMENT_DRIVES, Action.VIEW), validateDriveId, driveController.getDriveById);
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
