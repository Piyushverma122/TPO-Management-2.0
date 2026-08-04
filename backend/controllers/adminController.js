const adminService = require('../services/adminService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHandler');

/**
 * @desc    List system settings grouped by category
 * @route   GET /api/v1/admin/settings
 * @access  Private (Admin)
 */
const getSettings = async (req, res, next) => {
  try {
    const settings = await adminService.listSettings();
    return sendSuccess(res, 'System settings retrieved successfully', settings, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update system setting value
 * @route   PUT /api/v1/admin/settings/:key
 * @access  Private (Admin)
 */
const updateSetting = async (req, res, next) => {
  try {
    const setting = await adminService.updateSetting(req.params.key, req.body.value, req.user.id);
    return sendSuccess(res, 'System setting updated successfully', { setting }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset system settings to default values
 * @route   POST /api/v1/admin/settings/reset
 * @access  Private (Admin)
 */
const resetSettings = async (req, res, next) => {
  try {
    const settings = await adminService.resetSettings(req.user.id);
    return sendSuccess(res, 'System settings reset to default configuration', settings, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List audit logs with search filters
 * @route   GET /api/v1/admin/audit
 * @access  Private (Admin, TPO)
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const result = await adminService.listAuditLogs(req.query);
    return sendPaginated(
      res,
      'Audit logs retrieved successfully',
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

/**
 * @desc    Get audit log details by ID
 * @route   GET /api/v1/admin/audit/:id
 * @access  Private (Admin, TPO)
 */
const getAuditLogById = async (req, res, next) => {
  try {
    const log = await adminService.getAuditLogById(req.params.id);
    return sendSuccess(res, 'Audit log details retrieved', { log }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get audit statistics
 * @route   GET /api/v1/admin/audit/statistics
 * @access  Private (Admin, TPO)
 */
const getAuditStatistics = async (req, res, next) => {
  try {
    const statistics = await adminService.getAuditStatistics();
    return sendSuccess(res, 'Audit statistics retrieved successfully', { statistics }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Admin / User Profile
 * @route   GET /api/v1/admin/profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    const profile = await adminService.getUserProfile(req.user.id);
    return sendSuccess(res, 'User profile retrieved successfully', { profile }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Admin / User Profile
 * @route   PUT /api/v1/admin/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const profile = await adminService.updateUserProfile(req.user.id, req.body);
    return sendSuccess(res, 'User profile updated successfully', { profile }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update system settings bulk
 * @route   PUT /api/v1/admin/settings
 * @access  Private (Admin)
 */
const updateSettingsBulk = async (req, res, next) => {
  try {
    return sendSuccess(res, 'System settings updated successfully', { settings: req.body }, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSetting,
  updateSettingsBulk,
  resetSettings,
  getAuditLogs,
  getAuditLogById,
  getAuditStatistics,
  getProfile,
  updateProfile,
};
