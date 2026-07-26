const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeModule, authorizeRole } = require('../middleware/authorize');
const { Module, Action } = require('../config/rbac');

// All routes require authentication
router.use(verifyToken);

// Role-Specific Dashboards (Module.DASHBOARD VIEW permission check + Role Guarding)
router.get('/admin', authorizeModule(Module.DASHBOARD, Action.VIEW), authorizeRole('admin'), dashboardController.getAdminDashboard);
router.get('/tpo', authorizeModule(Module.DASHBOARD, Action.VIEW), authorizeRole('admin', 'tpo'), dashboardController.getTPODashboard);
router.get('/student', authorizeModule(Module.DASHBOARD, Action.VIEW), authorizeRole('student', 'admin', 'tpo'), dashboardController.getStudentDashboard);
router.get('/recruiter', authorizeModule(Module.DASHBOARD, Action.VIEW), authorizeRole('recruiter', 'admin', 'tpo'), dashboardController.getRecruiterDashboard);
router.get('/faculty', authorizeModule(Module.DASHBOARD, Action.VIEW), authorizeRole('faculty', 'admin', 'tpo'), dashboardController.getFacultyDashboard);

// System Analytics & Chart Datasets
router.get('/analytics', authorizeModule(Module.DASHBOARD, Action.VIEW), dashboardController.getAnalytics);
router.get('/charts', authorizeModule(Module.DASHBOARD, Action.VIEW), dashboardController.getChartsData);

module.exports = router;
