const trainingService = require('../services/trainingService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHandler');

/**
 * @desc    List training modules with pagination & filters
 * @route   GET /api/v1/trainings
 * @access  Private (Authenticated)
 */
const getTrainings = async (req, res, next) => {
  try {
    const result = await trainingService.listTrainings(req.query);
    return sendPaginated(
      res,
      'Training modules list retrieved',
      result.trainings,
      result.page,
      result.limit,
      result.total,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get training module details by ID
 * @route   GET /api/v1/trainings/:id
 * @access  Private (Authenticated)
 */
const getTrainingById = async (req, res, next) => {
  try {
    const training = await trainingService.getTrainingById(req.params.id);
    return sendSuccess(res, 'Training module details retrieved', { training }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new training module
 * @route   POST /api/v1/trainings
 * @access  Private (Admin, TPO)
 */
const createTraining = async (req, res, next) => {
  try {
    const training = await trainingService.createTraining(req.body);
    return sendSuccess(res, 'Training module created successfully', { training }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update training module details
 * @route   PUT /api/v1/trainings/:id
 * @access  Private (Admin, TPO, Faculty)
 */
const updateTraining = async (req, res, next) => {
  try {
    const updatedTraining = await trainingService.updateTraining(req.params.id, req.body);
    return sendSuccess(res, 'Training module updated successfully', { training: updatedTraining }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft Delete training module
 * @route   DELETE /api/v1/trainings/:id
 * @access  Private (Admin, TPO)
 */
const deleteTraining = async (req, res, next) => {
  try {
    await trainingService.deleteTraining(req.params.id);
    return sendSuccess(res, 'Training module soft deleted', null, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Enroll student in training module
 * @route   POST /api/v1/trainings/:id/enroll
 * @access  Private (Student Self, Admin, TPO)
 */
const enrollStudent = async (req, res, next) => {
  try {
    const enrollment = await trainingService.enrollStudent(req.params.id, req.user.id);
    return sendSuccess(res, 'Enrolled in training module successfully', { enrollment }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel student enrollment
 * @route   DELETE /api/v1/trainings/:id/enroll
 * @access  Private (Student Self, Admin, TPO)
 */
const cancelEnrollment = async (req, res, next) => {
  try {
    await trainingService.cancelEnrollment(req.params.id, req.user.id);
    return sendSuccess(res, 'Training enrollment cancelled', null, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark session attendance
 * @route   POST /api/v1/trainings/:id/attendance
 * @access  Private (Admin, TPO, Faculty)
 */
const markAttendance = async (req, res, next) => {
  try {
    const { session_id, student_id, is_present, remarks } = req.body;
    const attendance = await trainingService.markAttendance(session_id, student_id, is_present, remarks);
    return sendSuccess(res, 'Session attendance recorded successfully', { attendance }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload course material to training-materials bucket
 * @route   POST /api/v1/trainings/:id/material
 * @access  Private (Admin, TPO, Faculty)
 */
const uploadMaterial = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'Please upload a course material document file', null, 400);
    }
    const material = await trainingService.uploadTrainingMaterial(
      req.params.id,
      req.file,
      req.body.title
    );
    return sendSuccess(res, 'Training material uploaded successfully', { material }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload completion certificate PDF to training-certificates bucket
 * @route   POST /api/v1/trainings/:id/certificate
 * @access  Private (Admin, TPO, Faculty)
 */
const uploadCertificate = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'Please select a PDF certificate file to upload', null, 400);
    }
    const { student_id, certificate_number } = req.body;
    if (!student_id) {
      return sendError(res, 'student_id is required for issuing certificate', null, 400);
    }
    const certificate = await trainingService.uploadCertificate(
      req.params.id,
      student_id,
      req.file,
      certificate_number
    );
    return sendSuccess(res, 'Training certificate issued & uploaded successfully', { certificate }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student training progress
 * @route   GET /api/v1/trainings/:id/progress
 * @access  Private (Authenticated)
 */
const getProgress = async (req, res, next) => {
  try {
    const progress = await trainingService.getStudentProgress(req.params.id, req.user.id);
    return sendSuccess(res, 'Student training progress retrieved', { progress }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get overall dashboard training statistics
 * @route   GET /api/v1/trainings/statistics
 * @access  Private (Authenticated)
 */
const getStatistics = async (req, res, next) => {
  try {
    const statistics = await trainingService.getTrainingStatistics();
    return sendSuccess(res, 'Training statistics retrieved successfully', { statistics }, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrainings,
  getTrainingById,
  createTraining,
  updateTraining,
  deleteTraining,
  enrollStudent,
  cancelEnrollment,
  markAttendance,
  uploadMaterial,
  uploadCertificate,
  getProgress,
  getStatistics,
};
