const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/trainingController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeModule } = require('../middleware/authorize');
const { Module, Action } = require('../config/rbac');
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
router.get('/', authorizeModule(Module.TRAINING, Action.VIEW), validateQueryFilter, trainingController.getTrainings);
router.get('/statistics', authorizeModule(Module.TRAINING, Action.VIEW), trainingController.getStatistics);

// Training Module CRUD Routes
router.get('/:id', authorizeModule(Module.TRAINING, Action.VIEW), validateTrainingId, trainingController.getTrainingById);
router.post('/', authorizeModule(Module.TRAINING, Action.CREATE), validateCreateTraining, trainingController.createTraining);
router.put('/:id', authorizeModule(Module.TRAINING, Action.EDIT), validateUpdateTraining, trainingController.updateTraining);
router.delete('/:id', authorizeModule(Module.TRAINING, Action.DELETE), validateTrainingId, trainingController.deleteTraining);

// Student Enrollment Routes
router.post('/:id/enroll', authorizeModule(Module.TRAINING, Action.VIEW), validateTrainingId, trainingController.enrollStudent);
router.delete('/:id/enroll', authorizeModule(Module.TRAINING, Action.VIEW), validateTrainingId, trainingController.cancelEnrollment);

// Attendance Tracking Route
router.post(
  '/:id/attendance',
  authorizeModule(Module.TRAINING, Action.EDIT),
  validateAttendance,
  trainingController.markAttendance
);

// Course Material Upload Route
router.post(
  '/:id/material',
  authorizeModule(Module.TRAINING, Action.UPLOAD),
  validateTrainingId,
  uploadTrainingMaterial.single('material'),
  trainingController.uploadMaterial
);

// Completion Certificate Upload Route
router.post(
  '/:id/certificate',
  authorizeModule(Module.TRAINING, Action.UPLOAD),
  validateTrainingId,
  uploadCertificate.single('certificate'),
  trainingController.uploadCertificate
);

// Student Progress Route
router.get('/:id/progress', authorizeModule(Module.TRAINING, Action.VIEW), validateTrainingId, trainingController.getProgress);

module.exports = router;
