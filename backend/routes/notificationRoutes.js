const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const {
  validateCreateNotification,
  validateBroadcastNotification,
  validateNotificationId,
  validateQueryFilter,
} = require('../validators/notificationValidator');

// All routes require authentication
router.use(verifyToken);

// User Notifications
router.get('/', validateQueryFilter, notificationController.getNotifications);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:id/read', validateNotificationId, notificationController.markAsRead);
router.delete('/:id', validateNotificationId, notificationController.deleteNotification);

// Targeted Single & Broadcast Announcements
router.post('/', authorizeRoles('admin', 'tpo'), validateCreateNotification, notificationController.createNotification);
router.post('/broadcast', authorizeRoles('admin', 'tpo'), validateBroadcastNotification, notificationController.broadcastNotification);

// Statistics & Email Logs
router.get('/statistics', authorizeRoles('admin', 'tpo'), notificationController.getStatistics);
router.get('/email/logs', authorizeRoles('admin', 'tpo'), notificationController.getEmailLogs);

module.exports = router;
