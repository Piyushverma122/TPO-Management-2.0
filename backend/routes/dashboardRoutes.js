const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(verifyToken);

// Role-Specific Dashboards
router.get('/admin', authorizeRoles('admin'), dashboardController.getAdminDashboard);
router.get('/tpo', authorizeRoles('admin', 'tpo'), dashboardController.getTPODashboard);
router.get('/student', authorizeRoles('student', 'admin', 'tpo'), dashboardController.getStudentDashboard);
router.get('/recruiter', authorizeRoles('recruiter', 'admin', 'tpo'), dashboardController.getRecruiterDashboard);
router.get('/faculty', authorizeRoles('faculty', 'admin', 'tpo'), dashboardController.getFacultyDashboard);

// System Analytics & Chart Datasets
router.get('/analytics', authorizeRoles('admin', 'tpo', 'faculty'), dashboardController.getAnalytics);
router.get('/charts', dashboardController.getChartsData);

module.exports = router;
