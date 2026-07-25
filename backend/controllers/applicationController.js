const applicationService = require('../services/applicationService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHandler');

/**
 * @desc    Student Apply for Placement Drive
 * @route   POST /api/v1/applications
 * @access  Private (Student, Admin, TPO)
 */
const applyForDrive = async (req, res, next) => {
  try {
    const { drive_id, remarks } = req.body;
    const application = await applicationService.applyForDrive(req.user.id, drive_id, remarks);
    return sendSuccess(res, 'Applied for placement drive successfully', { application }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Withdraw Application (before registration deadline)
 * @route   DELETE /api/v1/applications/:id
 * @access  Private (Student Self, Admin, TPO)
 */
const withdrawApplication = async (req, res, next) => {
  try {
    const isStaff = ['admin', 'tpo'].includes(req.user.role);
    await applicationService.withdrawApplication(req.user.id, req.params.id, isStaff);
    return sendSuccess(res, 'Application withdrawn successfully', null, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List Drive Applications with role-scoped security
 * @route   GET /api/v1/applications
 * @access  Private (Authenticated)
 */
const getApplications = async (req, res, next) => {
  try {
    const result = await applicationService.listApplications(req.user, req.query);
    return sendPaginated(
      res,
      'Applications list retrieved',
      result.applications,
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
 * @desc    Get application details with audit history
 * @route   GET /api/v1/applications/:id
 * @access  Private (Authenticated)
 */
const getApplicationById = async (req, res, next) => {
  try {
    const application = await applicationService.getApplicationById(req.params.id);
    return sendSuccess(res, 'Application details retrieved', { application }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update application status stage & audit history
 * @route   PUT /api/v1/applications/:id/status
 * @access  Private (Admin, TPO, Recruiter)
 */
const updateStatus = async (req, res, next) => {
  try {
    const { status, round_name, remarks } = req.body;
    const application = await applicationService.updateApplicationStatus(
      req.params.id,
      status,
      round_name,
      remarks,
      req.user.id
    );
    return sendSuccess(res, `Application status updated to ${status}`, { application }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk Shortlist candidate applications
 * @route   POST /api/v1/applications/bulk-shortlist
 * @access  Private (Admin, TPO)
 */
const bulkShortlist = async (req, res, next) => {
  try {
    const { application_ids, round_name, remarks } = req.body;
    const shortlisted = await applicationService.bulkShortlist(
      application_ids,
      round_name,
      remarks,
      req.user.id
    );
    return sendSuccess(
      res,
      `Bulk shortlisting completed for ${shortlisted.length} applications`,
      { count: shortlisted.length, applications: shortlisted },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk Reject candidate applications
 * @route   POST /api/v1/applications/bulk-reject
 * @access  Private (Admin, TPO)
 */
const bulkReject = async (req, res, next) => {
  try {
    const { application_ids, remarks } = req.body;
    const rejected = await applicationService.bulkReject(
      application_ids,
      remarks,
      req.user.id
    );
    return sendSuccess(
      res,
      `Bulk rejection completed for ${rejected.length} applications`,
      { count: rejected.length, applications: rejected },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Schedule candidate interview round
 * @route   POST /api/v1/applications/:id/interview
 * @access  Private (Admin, TPO, Recruiter)
 */
const scheduleInterview = async (req, res, next) => {
  try {
    const { round_name, interview_date, mode, meeting_url, venue, remarks } = req.body;
    const result = await applicationService.scheduleInterview(
      req.params.id,
      round_name,
      interview_date,
      mode,
      meeting_url,
      venue,
      remarks,
      req.user.id
    );
    return sendSuccess(res, 'Interview round scheduled successfully', { application: result }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload offer letter PDF to offer-letters bucket
 * @route   POST /api/v1/applications/:id/offer-letter
 * @access  Private (Admin, TPO, Recruiter)
 */
const uploadOfferLetter = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'Please select a PDF file to upload as offer letter', null, 400);
    }
    const application = await applicationService.uploadOfferLetter(
      req.params.id,
      req.file,
      req.user.id
    );
    return sendSuccess(res, 'Offer letter uploaded and status updated to Offer', { application }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get overall application statistics
 * @route   GET /api/v1/applications/statistics
 * @access  Private (Authenticated)
 */
const getStatistics = async (req, res, next) => {
  try {
    const statistics = await applicationService.getApplicationStatistics(req.user);
    return sendSuccess(res, 'Application statistics retrieved', { statistics }, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyForDrive,
  withdrawApplication,
  getApplications,
  getApplicationById,
  updateStatus,
  bulkShortlist,
  bulkReject,
  scheduleInterview,
  uploadOfferLetter,
  getStatistics,
};
