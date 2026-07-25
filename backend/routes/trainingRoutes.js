const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/trainingController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { uploadTrainingMaterial, uploadCertificate } = require('../config/multer');
const {
  validateCreateTraining,
  validateUpdateTraining,
  validateTrainingId,
  validateAttendance,
  validateQueryFilter,
} = require('../validators/trainingValidator');

// All routes require authentication
router.use(verifyToken);

// Trainings Listing & Statistics
router.get('/', validateQueryFilter, trainingController.getTrainings);
router.get('/statistics', trainingController.getStatistics);

// Training Module CRUD Routes
router.get('/:id', validateTrainingId, trainingController.getTrainingById);
router.post('/', authorizeRoles('admin', 'tpo'), validateCreateTraining, trainingController.createTraining);
router.put('/:id', authorizeRoles('admin', 'tpo', 'faculty'), validateUpdateTraining, trainingController.updateTraining);
router.delete('/:id', authorizeRoles('admin', 'tpo'), validateTrainingId, trainingController.deleteTraining);

// Student Enrollment Routes
router.post('/:id/enroll', validateTrainingId, trainingController.enrollStudent);
router.delete('/:id/enroll', validateTrainingId, trainingController.cancelEnrollment);

// Attendance Tracking Route
router.post(
  '/:id/attendance',
  authorizeRoles('admin', 'tpo', 'faculty'),
  validateAttendance,
  trainingController.markAttendance
);

// Course Material Upload Route
router.post(
  '/:id/material',
  authorizeRoles('admin', 'tpo', 'faculty'),
  validateTrainingId,
  uploadTrainingMaterial.single('material'),
  trainingController.uploadMaterial
);

// Completion Certificate Upload Route
router.post(
  '/:id/certificate',
  authorizeRoles('admin', 'tpo', 'faculty'),
  validateTrainingId,
  uploadCertificate.single('certificate'),
  trainingController.uploadCertificate
);

// Student Progress Route
router.get('/:id/progress', validateTrainingId, trainingController.getProgress);

module.exports = router;
