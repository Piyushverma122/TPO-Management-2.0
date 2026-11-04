const interviewService = require('../services/interviewService');
const { sendSuccess, sendPaginated } = require('../utils/responseHandler');

/**
 * @desc    List interviews (students: own, recruiters: own company, admin/TPO: all)
 * @route   GET /api/v1/interviews
 */
const listInterviews = async (req, res, next) => {
  try {
    const result = await interviewService.listInterviews(req.user, req.query);
    return sendPaginated(res, 'Interviews retrieved', result.interviews, result.page, result.limit, result.total);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/interviews/summary
 */
const getSummary = async (req, res, next) => {
  try {
    const summary = await interviewService.getSummary(req.user);
    return sendSuccess(res, 'Interview summary retrieved', { summary });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/interviews/:id
 */
const getInterview = async (req, res, next) => {
  try {
    const interview = await interviewService.getInterviewById(req.user, req.params.id);
    return sendSuccess(res, 'Interview details retrieved', { interview });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/interviews
 */
const createInterview = async (req, res, next) => {
  try {
    const interview = await interviewService.createInterview(req.user, req.body);
    return sendSuccess(res, 'Interview scheduled successfully', { interview }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/v1/interviews/:id
 */
const rescheduleInterview = async (req, res, next) => {
  try {
    const interview = await interviewService.rescheduleInterview(req.user, req.params.id, req.body);
    return sendSuccess(res, 'Interview rescheduled successfully', { interview });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/interviews/:id/cancel
 */
const cancelInterview = async (req, res, next) => {
  try {
    const interview = await interviewService.cancelInterview(req.user, req.params.id, req.body.reason);
    return sendSuccess(res, 'Interview cancelled', { interview });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/interviews/:id/result
 */
const recordResult = async (req, res, next) => {
  try {
    const interview = await interviewService.recordResult(req.user, req.params.id, req.body);
    return sendSuccess(res, 'Interview result recorded', { interview });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listInterviews,
  getSummary,
  getInterview,
  createInterview,
  rescheduleInterview,
  cancelInterview,
  recordResult,
};
