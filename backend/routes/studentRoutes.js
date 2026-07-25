const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { uploadResume, uploadDocument } = require('../config/multer');
const {
  validateCreateStudent,
  validateUpdateStudent,
  validateStudentId,
  validateQueryFilter,
} = require('../validators/studentValidator');

// All routes require authentication
router.use(verifyToken);

// Student CRUD Routes
router.get('/', authorizeRoles('admin', 'tpo', 'faculty'), validateQueryFilter, studentController.getStudents);
router.get('/:id', validateStudentId, studentController.getStudentById);
router.post('/', authorizeRoles('admin', 'tpo'), validateCreateStudent, studentController.createStudent);
router.put('/:id', validateUpdateStudent, studentController.updateStudent);
router.delete('/:id', authorizeRoles('admin', 'tpo'), validateStudentId, studentController.deleteStudent);

// Student Full Profile Route
router.get('/:id/profile', validateStudentId, studentController.getStudentProfile);

// Resume Management Routes
router.post(
  '/:id/resume',
  validateStudentId,
  uploadResume.single('resume'),
  studentController.uploadResume
);
router.get('/:id/resumes', validateStudentId, studentController.listResumes);
router.delete('/resume/:resumeId', studentController.deleteResume);

// Student Document Management Routes
router.post(
  '/:id/document',
  validateStudentId,
  uploadDocument.single('document'),
  studentController.uploadDocument
);
router.get('/:id/documents', validateStudentId, studentController.listDocuments);
router.delete('/document/:documentId', studentController.deleteDocument);

module.exports = router;
