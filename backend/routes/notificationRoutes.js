const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeModule } = require('../middleware/authorize');
const { Module, Action } = require('../config/rbac');
const {
  validateCreateNotification,
  validateBroadcastNotification,
  validateNotificationId,
  validateQueryFilter,
} = require('../validators/notificationValidator');

// All routes require authentication
router.use(verifyToken);

// User Notifications
router.get('/', authorizeModule(Module.NOTIFICATIONS, Action.VIEW), validateQueryFilter, notificationController.getNotifications);
router.put('/read-all', authorizeModule(Module.NOTIFICATIONS, Action.VIEW), notificationController.markAllAsRead);
router.put('/:id/read', authorizeModule(Module.NOTIFICATIONS, Action.VIEW), validateNotificationId, notificationController.markAsRead);
router.delete('/:id', authorizeModule(Module.NOTIFICATIONS, Action.EDIT), validateNotificationId, notificationController.deleteNotification);

// Targeted Single & Broadcast Announcements
router.post('/', authorizeModule(Module.NOTIFICATIONS, Action.CREATE), validateCreateNotification, notificationController.createNotification);
router.post('/broadcast', authorizeModule(Module.NOTIFICATIONS, Action.CREATE), validateBroadcastNotification, notificationController.broadcastNotification);

// Statistics & Email Logs
router.get('/statistics', authorizeModule(Module.NOTIFICATIONS, Action.VIEW), notificationController.getStatistics);
router.get('/email/logs', authorizeModule(Module.NOTIFICATIONS, Action.VIEW), notificationController.getEmailLogs);

module.exports = router;
