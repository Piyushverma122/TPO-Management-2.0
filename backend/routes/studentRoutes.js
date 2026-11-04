const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeModule } = require('../middleware/authorize');
const { Module, Action } = require('../config/rbac');
const { uploadResume, uploadDocument } = require('../config/multer');
const { compressUpload } = require('../middlewares/compressUpload');
const {
  validateCreateStudent,
  validateUpdateStudent,
  validateStudentId,
  validateQueryFilter,
  validateUpdateOwnProfile,
} = require('../validators/studentValidator');

// All routes require authentication
router.use(verifyToken);

// Student Full Profile Route (Self & By ID)
router.get('/profile', authorizeModule(Module.PROFILE, Action.VIEW), studentController.getStudentProfile);
router.get('/:id/profile', authorizeModule(Module.PROFILE, Action.VIEW), validateStudentId, studentController.getStudentProfile);

// Student edits their own profile (limited fields)
router.put('/profile', authorizeModule(Module.PROFILE, Action.EDIT), validateUpdateOwnProfile, studentController.updateMyProfile);

// Student Directory & CRUD Routes
router.get('/', authorizeModule(Module.STUDENTS, Action.VIEW), validateQueryFilter, studentController.getStudents);
router.get('/:id/overview', authorizeModule(Module.STUDENTS, Action.VIEW), validateStudentId, studentController.getStudentOverview);
router.get('/:id', authorizeModule(Module.STUDENTS, Action.VIEW), validateStudentId, studentController.getStudentById);
router.post('/', authorizeModule(Module.STUDENTS, Action.CREATE), validateCreateStudent, studentController.createStudent);
router.put('/:id', authorizeModule(Module.STUDENTS, Action.EDIT), validateUpdateStudent, studentController.updateStudent);
router.delete('/:id', authorizeModule(Module.STUDENTS, Action.DELETE), validateStudentId, studentController.deleteStudent);

// Resume Management Routes
router.post(
  '/:id/resume',
  authorizeModule(Module.PROFILE, Action.UPLOAD),
  validateStudentId,
  uploadResume.single('resume'), compressUpload(),
  studentController.uploadResume
);
router.get('/:id/resumes', authorizeModule(Module.PROFILE, Action.VIEW), validateStudentId, studentController.listResumes);
router.get('/resume/:resumeId/file', authorizeModule(Module.PROFILE, Action.VIEW), studentController.getResumeFile);
router.delete('/resume/:resumeId', authorizeModule(Module.PROFILE, Action.EDIT), studentController.deleteResume);

// Student Document Management Routes
router.post(
  '/:id/document',
  authorizeModule(Module.PROFILE, Action.UPLOAD),
  validateStudentId,
  uploadDocument.single('document'), compressUpload(),
  studentController.uploadDocument
);
router.get('/:id/documents', authorizeModule(Module.PROFILE, Action.VIEW), validateStudentId, studentController.listDocuments);
router.get('/document/:documentId/file', authorizeModule(Module.PROFILE, Action.VIEW), studentController.getDocumentFile);
router.delete('/document/:documentId', authorizeModule(Module.PROFILE, Action.EDIT), studentController.deleteDocument);

module.exports = router;
