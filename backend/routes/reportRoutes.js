const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(verifyToken);

// Domain Reports
router.get('/students', authorizeRoles('admin', 'tpo', 'faculty'), reportController.getStudentsReport);
router.get('/companies', authorizeRoles('admin', 'tpo', 'faculty'), reportController.getCompaniesReport);
router.get('/placements', authorizeRoles('admin', 'tpo', 'faculty'), reportController.getPlacementsReport);
router.get('/trainings', authorizeRoles('admin', 'tpo', 'faculty'), reportController.getTrainingsReport);
router.get('/drives', authorizeRoles('admin', 'tpo', 'faculty', 'recruiter'), reportController.getDrivesReport);

// Export Downloads & Payloads
router.get('/export/csv', reportController.exportCSV);
router.get('/export/excel', reportController.exportExcel);
router.get('/export/pdf', reportController.exportPDF);

module.exports = router;
