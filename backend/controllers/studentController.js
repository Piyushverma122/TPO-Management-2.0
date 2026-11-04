const studentService = require('../services/studentService');
const studentOverviewService = require('../services/studentOverviewService');
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
 * Students may only read or change their own files; staff (admin, TPO, faculty, recruiter) pass through
 * because their module permissions already limit what they can reach.
 */
const assertSelfOrStaff = async (req, studentId) => {
  if (req.user.role === 'faculty') {
    // getStudentById enforces the department scope and throws 403 outside it.
    await studentService.getStudentById(studentId, req.user);
    return;
  }
  if (req.user.role !== 'student') return;
  const student = await studentService.getStudentById(studentId);
  if (student.user_id !== req.user.id) {
    throw Object.assign(new Error('Forbidden: you can only access your own records.'), { statusCode: 403 });
  }
};

const assertOwnsFile = async (req, table, fileId) => {
  if (['admin', 'tpo'].includes(req.user.role)) return;
  const owner = await studentService.getFileOwnerUserId(table, fileId);
  if (!owner) throw Object.assign(new Error('Record not found.'), { statusCode: 404 });
  if (owner.userId !== req.user.id) {
    throw Object.assign(new Error('Forbidden: you can only delete your own files.'), { statusCode: 403 });
  }
};

/**
 * @desc    Complete picture of one student for staff: profile, onboarding, applications, interviews, offers, training
 * @route   GET /api/v1/students/:id/overview
 */
const getStudentOverview = async (req, res, next) => {
  try {
    const overview = await studentOverviewService.getStudentOverview(req.params.id, req.user);
    return sendSuccess(res, 'Student overview retrieved', { overview }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Signed link to open a resume PDF
 * @route   GET /api/v1/students/resume/:resumeId/file
 */
const getResumeFile = async (req, res, next) => {
  try {
    const file = await studentService.getResumeFileUrl(req.params.resumeId, req.user);
    return sendSuccess(res, 'Resume link created', file, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Signed link to open a student document
 * @route   GET /api/v1/students/document/:documentId/file
 */
const getDocumentFile = async (req, res, next) => {
  try {
    const file = await studentService.getDocumentFileUrl(req.params.documentId, req.user);
    return sendSuccess(res, 'Document link created', file, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update the signed-in student's own profile (limited fields)
 * @route   PUT /api/v1/students/profile
 */
const updateMyProfile = async (req, res, next) => {
  try {
    const profile = await studentService.updateOwnProfile(req.user.id, req.body);
    return sendSuccess(res, 'Profile updated', { profile }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List students with pagination & filters
 * @route   GET /api/v1/students
 * @access  Private (Admin, TPO, Faculty)
 */
const getStudents = async (req, res, next) => {
  try {
    const result = await studentService.listStudents(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Students list retrieved',
      data: {
        students: result.students,
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
      students: result.students,
      pagination: {
        currentPage: Number(result.page),
        perPage: Number(result.limit),
        totalEntries: Number(result.total),
        totalPages: Math.ceil(result.total / result.limit) || 1,
      },
    });
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
    const student = await studentService.getStudentById(req.params.id, req.user);
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
    const student = await studentService.createStudent(req.body, req.token || req.headers?.authorization);
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
    const studentId =
      req.params.id && req.params.id !== 'profile' && req.params.id !== 'me'
        ? req.params.id
        : req.user?.id;

    if (req.params.id && req.params.id !== 'profile' && req.params.id !== 'me') await assertSelfOrStaff(req, req.params.id);
    const profile = await studentService.getStudentFullProfile(studentId);
    return sendSuccess(res, 'Full candidate profile retrieved', { profile, student: profile }, 200);
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
    if (req.file.buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
      return sendError(res, 'Only PDF files are accepted for resumes.', null, 400);
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
    await assertSelfOrStaff(req, req.params.id);
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
    await assertOwnsFile(req, 'resumes', req.params.resumeId);
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
    await assertSelfOrStaff(req, req.params.id);
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
    await assertOwnsFile(req, 'student_documents', req.params.documentId);
    await studentService.deleteDocument(req.params.documentId);
    return sendSuccess(res, 'Document deleted successfully', null, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudentOverview,
  getDocumentFile,
  getResumeFile,
  updateMyProfile,
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
