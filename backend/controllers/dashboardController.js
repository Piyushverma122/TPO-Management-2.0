const dashboardService = require('../services/dashboardService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * @desc    Get Admin Dashboard Overview Metrics
 * @route   GET /api/v1/dashboard/admin
 * @access  Private (Admin)
 */
const getAdminDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getAdminDashboard();
    return sendSuccess(res, 'Admin dashboard metrics retrieved', { dashboard: data, overview: data }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get TPO Dashboard Overview Metrics
 * @route   GET /api/v1/dashboard/tpo
 * @access  Private (Admin, TPO)
 */
const getTPODashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getTPODashboard();
    return sendSuccess(res, 'TPO dashboard metrics retrieved', { dashboard: data, overview: data }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Student Personal Portal Dashboard
 * @route   GET /api/v1/dashboard/student
 * @access  Private (Student, Admin, TPO)
 */
const getStudentDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getStudentDashboard(req.user.id);
    return sendSuccess(res, 'Student dashboard metrics retrieved', { dashboard: data, overview: data }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Recruiter Company Dashboard
 * @route   GET /api/v1/dashboard/recruiter
 * @access  Private (Recruiter, Admin, TPO)
 */
const getRecruiterDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getRecruiterDashboard(req.user.id);
    return sendSuccess(res, 'Recruiter dashboard metrics retrieved', { dashboard: data, overview: data }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Faculty Training & Placement Dashboard
 * @route   GET /api/v1/dashboard/faculty
 * @access  Private (Faculty, Admin, TPO)
 */
const getFacultyDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getFacultyDashboard(req.user.id);
    return sendSuccess(res, 'Faculty dashboard metrics retrieved', { dashboard: data, overview: data }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Detailed System Analytics
 * @route   GET /api/v1/dashboard/analytics
 * @access  Private (Admin, TPO, Faculty)
 */
const getAnalytics = async (req, res, next) => {
  try {
    const analytics = await dashboardService.getAnalytics();
    return sendSuccess(res, 'System analytics retrieved successfully', { analytics }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Formatted JSON Chart Datasets for Bar, Pie, Line, and Area charts
 * @route   GET /api/v1/dashboard/charts
 * @access  Private (Authenticated)
 */
const getChartsData = async (req, res, next) => {
  try {
    const charts = await dashboardService.getChartsData();
    return sendSuccess(res, 'Chart datasets calculated successfully', { charts }, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getTPODashboard,
  getStudentDashboard,
  getRecruiterDashboard,
  getFacultyDashboard,
  getAnalytics,
  getChartsData,
};
