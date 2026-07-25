const notificationService = require('../services/notificationService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHandler');

/**
 * @desc    List notifications for authenticated user
 * @route   GET /api/v1/notifications
 * @access  Private (Authenticated)
 */
const getNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.listNotifications(req.user.id, req.query);
    return sendPaginated(
      res,
      'Notifications list retrieved',
      result.notifications,
      result.page,
      result.limit,
      result.total,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create targeted single notification
 * @route   POST /api/v1/notifications
 * @access  Private (Admin, TPO)
 */
const createNotification = async (req, res, next) => {
  try {
    const notification = await notificationService.createNotification(req.body);
    return sendSuccess(res, 'Notification created successfully', { notification }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/v1/notifications/:id/read
 * @access  Private (Authenticated)
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);
    return sendSuccess(res, 'Notification marked as read', { notification }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all notifications as read for user
 * @route   PUT /api/v1/notifications/read-all
 * @access  Private (Authenticated)
 */
const markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    return sendSuccess(res, 'All notifications marked as read', null, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete single notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private (Authenticated)
 */
const deleteNotification = async (req, res, next) => {
  try {
    await notificationService.deleteNotification(req.params.id, req.user.id);
    return sendSuccess(res, 'Notification deleted successfully', null, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send broadcast announcement to targeted group
 * @route   POST /api/v1/notifications/broadcast
 * @access  Private (Admin, TPO)
 */
const broadcastNotification = async (req, res, next) => {
  try {
    const result = await notificationService.broadcastNotification(req.body);
    return sendSuccess(
      res,
      `Broadcast notification sent to ${result.count} recipients`,
      result,
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get notification & email statistics
 * @route   GET /api/v1/notifications/statistics
 * @access  Private (Admin, TPO)
 */
const getStatistics = async (req, res, next) => {
  try {
    const statistics = await notificationService.getNotificationStatistics();
    return sendSuccess(res, 'Notification statistics retrieved', { statistics }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    View system email logs
 * @route   GET /api/v1/notifications/email/logs
 * @access  Private (Admin, TPO)
 */
const getEmailLogs = async (req, res, next) => {
  try {
    const result = await notificationService.getEmailLogs(req.query);
    return sendPaginated(
      res,
      'Email logs retrieved',
      result.logs,
      result.page,
      result.limit,
      result.total,
      200
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  broadcastNotification,
  getStatistics,
  getEmailLogs,
};
