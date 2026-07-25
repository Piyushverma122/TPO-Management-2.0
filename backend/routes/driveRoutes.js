const express = require('express');
const router = express.Router();
const driveController = require('../controllers/driveController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
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
router.get('/', validateQueryFilter, driveController.getDrives);
router.get('/:id', validateDriveId, driveController.getDriveById);
router.post('/', authorizeRoles('admin', 'tpo'), validateCreateDrive, driveController.createDrive);
router.put('/:id', validateUpdateDrive, driveController.updateDrive);
router.delete('/:id', authorizeRoles('admin', 'tpo'), validateDriveId, driveController.deleteDrive);

// Drive Full Profile & Analytics Routes
router.get('/:id/profile', validateDriveId, driveController.getDriveProfile);
router.get('/:id/statistics', validateDriveId, driveController.getDriveStatistics);
router.get(
  '/:id/eligible-students',
  authorizeRoles('admin', 'tpo', 'faculty', 'recruiter'),
  validateDriveId,
  driveController.getEligibleStudents
);

// Eligibility Binding Routes
router.post(
  '/:id/eligible-branches',
  authorizeRoles('admin', 'tpo'),
  validateBranchArray,
  driveController.bindEligibleBranches
);
router.post(
  '/:id/eligible-departments',
  authorizeRoles('admin', 'tpo'),
  validateDeptArray,
  driveController.bindEligibleDepartments
);
router.post(
  '/:id/eligible-batches',
  authorizeRoles('admin', 'tpo'),
  validateBatchArray,
  driveController.bindEligibleBatches
);

module.exports = router;
