const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
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
router.get('/', validateQueryFilter, applicationController.getApplications);
router.get('/statistics', applicationController.getStatistics);

// Student Apply & Withdraw Routes
router.post('/', authorizeRoles('student', 'admin', 'tpo'), validateApplyDrive, applicationController.applyForDrive);
router.delete('/:id', validateApplicationId, applicationController.withdrawApplication);

// Application Details & Status Workflow
router.get('/:id', validateApplicationId, applicationController.getApplicationById);
router.put(
  '/:id/status',
  authorizeRoles('admin', 'tpo', 'recruiter'),
  validateUpdateStatus,
  applicationController.updateStatus
);

// Bulk Shortlist & Reject Routes
router.post(
  '/bulk-shortlist',
  authorizeRoles('admin', 'tpo'),
  validateBulkShortlist,
  applicationController.bulkShortlist
);
router.post(
  '/bulk-reject',
  authorizeRoles('admin', 'tpo'),
  validateBulkReject,
  applicationController.bulkReject
);

// Interview Scheduling Route
router.post(
  '/:id/interview',
  authorizeRoles('admin', 'tpo', 'recruiter'),
  validateScheduleInterview,
  applicationController.scheduleInterview
);

// Offer Letter Upload Route
router.post(
  '/:id/offer-letter',
  authorizeRoles('admin', 'tpo', 'recruiter'),
  validateApplicationId,
  uploadOfferLetter.single('offer_letter'),
  applicationController.uploadOfferLetter
);

module.exports = router;
