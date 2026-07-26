const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeModule } = require('../middleware/authorize');
const { Module, Action } = require('../config/rbac');
const { uploadResume, uploadDocument } = require('../config/multer');
const {
  validateCreateStudent,
  validateUpdateStudent,
  validateStudentId,
  validateQueryFilter,
} = require('../validators/studentValidator');

// All routes require authentication
router.use(verifyToken);

// Student Directory & CRUD Routes
router.get('/', authorizeModule(Module.STUDENTS, Action.VIEW), validateQueryFilter, studentController.getStudents);
router.get('/:id', authorizeModule(Module.STUDENTS, Action.VIEW), validateStudentId, studentController.getStudentById);
router.post('/', authorizeModule(Module.STUDENTS, Action.CREATE), validateCreateStudent, studentController.createStudent);
router.put('/:id', authorizeModule(Module.STUDENTS, Action.EDIT), validateUpdateStudent, studentController.updateStudent);
router.delete('/:id', authorizeModule(Module.STUDENTS, Action.DELETE), validateStudentId, studentController.deleteStudent);

// Student Full Profile Route
router.get('/:id/profile', authorizeModule(Module.PROFILE, Action.VIEW), validateStudentId, studentController.getStudentProfile);

// Resume Management Routes
router.post(
  '/:id/resume',
  authorizeModule(Module.PROFILE, Action.UPLOAD),
  validateStudentId,
  uploadResume.single('resume'),
  studentController.uploadResume
);
router.get('/:id/resumes', authorizeModule(Module.PROFILE, Action.VIEW), validateStudentId, studentController.listResumes);
router.delete('/resume/:resumeId', authorizeModule(Module.PROFILE, Action.EDIT), studentController.deleteResume);

// Student Document Management Routes
router.post(
  '/:id/document',
  authorizeModule(Module.PROFILE, Action.UPLOAD),
  validateStudentId,
  uploadDocument.single('document'),
  studentController.uploadDocument
);
router.get('/:id/documents', authorizeModule(Module.PROFILE, Action.VIEW), validateStudentId, studentController.listDocuments);
router.delete('/document/:documentId', authorizeModule(Module.PROFILE, Action.EDIT), studentController.deleteDocument);

module.exports = router;
