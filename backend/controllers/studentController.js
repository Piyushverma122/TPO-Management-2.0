const studentService = require('../services/studentService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHandler');

/**
 * Helper to check if current user is owner or privileged role
 */
const checkOwnershipOrAdmin = async (req, studentId) => {
  if (['admin', 'tpo'].includes(req.user.role)) {
    return true;
  }
  const student = await studentService.getStudentById(studentId);
  if (student.user_id !== req.user.id) {
    const error = new Error('Forbidden: You do not have permission to manage this student profile.');
    error.statusCode = 403;
    throw error;
  }
  return true;
};

/**
 * @desc    List students with pagination & filters
 * @route   GET /api/v1/students
 * @access  Private (Admin, TPO, Faculty)
 */
const getStudents = async (req, res, next) => {
  try {
    const result = await studentService.listStudents(req.query);
    return sendPaginated(
      res,
      'Students list retrieved',
      result.students,
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
 * @desc    Get Student by ID
 * @route   GET /api/v1/students/:id
 * @access  Private
 */
const getStudentById = async (req, res, next) => {
  try {
    const student = await studentService.getStudentById(req.params.id);
    return sendSuccess(res, 'Student record retrieved', { student }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new student candidate
 * @route   POST /api/v1/students
 * @access  Private (Admin, TPO)
 */
const createStudent = async (req, res, next) => {
  try {
    const student = await studentService.createStudent(req.body);
    return sendSuccess(res, 'Student candidate created successfully', { student }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update student details
 * @route   PUT /api/v1/students/:id
 * @access  Private (Admin, TPO, Self)
 */
const updateStudent = async (req, res, next) => {
  try {
    await checkOwnershipOrAdmin(req, req.params.id);
    const updatedStudent = await studentService.updateStudent(req.params.id, req.body);
    return sendSuccess(res, 'Student record updated', { student: updatedStudent }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft Delete student
 * @route   DELETE /api/v1/students/:id
 * @access  Private (Admin, TPO)
 */
const deleteStudent = async (req, res, next) => {
  try {
    await studentService.deleteStudent(req.params.id);
    return sendSuccess(res, 'Student record soft deleted', null, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get complete candidate profile
 * @route   GET /api/v1/students/:id/profile
 * @access  Private
 */
const getStudentProfile = async (req, res, next) => {
  try {
    const profile = await studentService.getStudentFullProfile(req.params.id);
    return sendSuccess(res, 'Full candidate profile retrieved', { profile }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload PDF resume to Supabase Storage resumes bucket
 * @route   POST /api/v1/students/:id/resume
 * @access  Private (Admin, TPO, Self)
 */
const uploadResume = async (req, res, next) => {
  try {
    await checkOwnershipOrAdmin(req, req.params.id);
    if (!req.file) {
      return sendError(res, 'Please select a valid PDF file to upload', null, 400);
    }
    const versionTitle = req.body.version_title || 'Resume Version';
    const resume = await studentService.uploadResume(
      req.params.id,
      req.file,
      versionTitle,
      req.user.id
    );
    return sendSuccess(res, 'Resume PDF uploaded successfully', { resume }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List candidate resumes
 * @route   GET /api/v1/students/:id/resumes
 * @access  Private
 */
const listResumes = async (req, res, next) => {
  try {
    const resumes = await studentService.listResumes(req.params.id);
    return sendSuccess(res, 'Resumes list retrieved', { resumes }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete candidate resume
 * @route   DELETE /api/v1/students/resume/:resumeId
 * @access  Private (Admin, TPO, Self)
 */
const deleteResume = async (req, res, next) => {
  try {
    await studentService.deleteResume(req.params.resumeId);
    return sendSuccess(res, 'Resume deleted successfully', null, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload document to student-documents bucket
 * @route   POST /api/v1/students/:id/document
 * @access  Private (Admin, TPO, Self)
 */
const uploadDocument = async (req, res, next) => {
  try {
    await checkOwnershipOrAdmin(req, req.params.id);
    if (!req.file) {
      return sendError(res, 'Please upload a document file', null, 400);
    }
    const documentName = req.body.document_name || req.file.originalname;
    const documentType = req.body.document_type || 'General';

    const document = await studentService.uploadDocument(
      req.params.id,
      req.file,
      documentName,
      documentType,
      req.user.id
    );
    return sendSuccess(res, 'Document uploaded successfully', { document }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List candidate documents
 * @route   GET /api/v1/students/:id/documents
 * @access  Private
 */
const listDocuments = async (req, res, next) => {
  try {
    const documents = await studentService.listDocuments(req.params.id);
    return sendSuccess(res, 'Documents list retrieved', { documents }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete candidate document
 * @route   DELETE /api/v1/students/document/:documentId
 * @access  Private (Admin, TPO, Self)
 */
const deleteDocument = async (req, res, next) => {
  try {
    await studentService.deleteDocument(req.params.documentId);
    return sendSuccess(res, 'Document deleted successfully', null, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentProfile,
  uploadResume,
  listResumes,
  deleteResume,
  uploadDocument,
  listDocuments,
  deleteDocument,
};
