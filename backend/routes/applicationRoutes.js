const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeModule } = require('../middleware/authorize');
const { Module, Action } = require('../config/rbac');
const { uploadOfferLetter } = require('../config/multer');
const {
  validateApplyDrive,
  validateUpdateStatus,
  validateApplicationId,
  validateBulkShortlist,
  validateBulkReject,
  validateScheduleInterview,
  validateQueryFilter,
} = require('../validators/applicationValidator');

// All routes require authentication
router.use(verifyToken);

// General Applications Listing & Statistics
router.get('/', authorizeModule(Module.APPLICATIONS, Action.VIEW), validateQueryFilter, applicationController.getApplications);
router.get('/statistics', authorizeModule(Module.APPLICATIONS, Action.VIEW), applicationController.getStatistics);

// Student Apply & Withdraw Routes
router.post('/', authorizeModule(Module.APPLICATIONS, Action.CREATE), validateApplyDrive, applicationController.applyForDrive);
router.delete('/:id', authorizeModule(Module.APPLICATIONS, Action.DELETE), validateApplicationId, applicationController.withdrawApplication);

// Application Details & Status Workflow
router.get('/:id', authorizeModule(Module.APPLICATIONS, Action.VIEW), validateApplicationId, applicationController.getApplicationById);
router.put(
  '/:id/status',
  authorizeModule(Module.APPLICATIONS, Action.APPROVE),
  validateUpdateStatus,
  applicationController.updateStatus
);

// Bulk Shortlist & Reject Routes
router.post(
  '/bulk-shortlist',
  authorizeModule(Module.APPLICATIONS, Action.APPROVE),
  validateBulkShortlist,
  applicationController.bulkShortlist
);
router.post(
  '/bulk-reject',
  authorizeModule(Module.APPLICATIONS, Action.APPROVE),
  validateBulkReject,
  applicationController.bulkReject
);

// Interview Scheduling Route
router.post(
  '/:id/interview',
  authorizeModule(Module.INTERVIEWS, Action.CREATE),
  validateScheduleInterview,
  applicationController.scheduleInterview
);

// Offer Letter Upload Route
router.post(
  '/:id/offer-letter',
  authorizeModule(Module.OFFER_LETTERS, Action.UPLOAD),
  validateApplicationId,
  uploadOfferLetter.single('offer_letter'),
  applicationController.uploadOfferLetter
);

module.exports = router;
