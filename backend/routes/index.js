const express = require('express');
const router = express.Router();
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const studentRoutes = require('./studentRoutes');
const { companyRouter } = require('./companyRoutes');
const recruiterRoutes = require('./recruiterRoutes');
const driveRoutes = require('./driveRoutes');
const applicationRoutes = require('./applicationRoutes');
const placementRoutes = require('./placementRoutes');
const trainingRoutes = require('./trainingRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const reportRoutes = require('./reportRoutes');
const notificationRoutes = require('./notificationRoutes');
const chatRoutes = require('./chatRoutes');
const calendarRoutes = require('./calendarRoutes');
const adminRoutes = require('./adminRoutes');
const notificationController = require('./../controllers/notificationController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Mount Sub-routers
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/companies', companyRouter);
router.use('/recruiters', recruiterRoutes);
router.use('/drives', driveRoutes);
router.use('/applications', applicationRoutes);
router.use('/placements', placementRoutes);
router.use('/trainings', trainingRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/chat', chatRoutes);
router.use('/calendar', calendarRoutes);
router.use('/admin', adminRoutes);

// Direct Email Logs alias: GET /api/v1/email/logs
router.get('/email/logs', verifyToken, authorizeRoles('admin', 'tpo'), notificationController.getEmailLogs);

module.exports = router;
