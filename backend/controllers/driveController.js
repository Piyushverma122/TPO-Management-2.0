const driveService = require('../services/driveService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHandler');

/**
 * Helper to verify if recruiter owns company drive or user is Admin/TPO
 */
const checkDriveAccess = async (req, driveId) => {
  if (['admin', 'tpo'].includes(req.user.role)) {
    return true;
  }
  if (req.user.role === 'recruiter') {
    const drive = await driveService.getDriveById(driveId);
    // Check if recruiter belongs to drive.company_id
    const { data: recruiter } = await require('../config/supabase')
      .from('recruiters')
      .select('company_id')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!recruiter || recruiter.company_id !== drive.company_id) {
      const err = new Error('Forbidden: Recruiter can only access placement drives for their own company.');
      err.statusCode = 403;
      throw err;
    }
    return true;
  }
  return true;
};

/**
 * @desc    List placement drives with search & filters
 * @route   GET /api/v1/drives
 * @access  Private (Authenticated)
 */
const getDrives = async (req, res, next) => {
  try {
    const result = await driveService.listDrives(req.query, req.user);
    return sendPaginated(
      res,
      'Placement drives list retrieved',
      result.drives,
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
 * @desc    Get drive details by ID
 * @route   GET /api/v1/drives/:id
 * @access  Private (Authenticated)
 */
const getDriveById = async (req, res, next) => {
  try {
    const drive = await driveService.getDriveById(req.params.id);
    return sendSuccess(res, 'Placement drive details retrieved', { drive }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new placement drive
 * @route   POST /api/v1/drives
 * @access  Private (Admin, TPO)
 */
const createDrive = async (req, res, next) => {
  try {
    const drive = await driveService.createDrive(req.body, req.user.id);
    return sendSuccess(res, 'Placement drive created successfully', { drive }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update placement drive details
 * @route   PUT /api/v1/drives/:id
 * @access  Private (Admin, TPO, Recruiter (Own))
 */
const updateDrive = async (req, res, next) => {
  try {
    await checkDriveAccess(req, req.params.id);
    const updatedDrive = await driveService.updateDrive(req.params.id, req.body);
    return sendSuccess(res, 'Placement drive updated successfully', { drive: updatedDrive }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft Delete placement drive
 * @route   DELETE /api/v1/drives/:id
 * @access  Private (Admin, TPO)
 */
const deleteDrive = async (req, res, next) => {
  try {
    await driveService.deleteDrive(req.params.id);
    return sendSuccess(res, 'Placement drive soft deleted', null, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get full drive profile with company & eligibility rules
 * @route   GET /api/v1/drives/:id/profile
 * @access  Private (Authenticated)
 */
const getDriveProfile = async (req, res, next) => {
  try {
    const profile = await driveService.getDriveProfile(req.params.id);
    return sendSuccess(res, 'Full placement drive profile retrieved', { profile }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Calculate & return eligible students for drive
 * @route   GET /api/v1/drives/:id/eligible-students
 * @access  Private (Admin, TPO, Faculty, Recruiter)
 */
const getEligibleStudents = async (req, res, next) => {
  try {
    await checkDriveAccess(req, req.params.id);
    const eligibleStudents = await driveService.getEligibleStudents(req.params.id);
    return sendSuccess(
      res,
      `Eligible students list retrieved (${eligibleStudents.length} candidates)`,
      { eligibleStudents, count: eligibleStudents.length },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get placement drive analytics statistics
 * @route   GET /api/v1/drives/:id/statistics
 * @access  Private (Authenticated)
 */
const getDriveStatistics = async (req, res, next) => {
  try {
    const statistics = await driveService.getDriveStatistics(req.params.id);
    return sendSuccess(res, 'Placement drive statistics retrieved', { statistics }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bind eligible branches to drive
 * @route   POST /api/v1/drives/:id/eligible-branches
 * @access  Private (Admin, TPO)
 */
const bindEligibleBranches = async (req, res, next) => {
  try {
    const branches = await driveService.bindEligibleBranches(req.params.id, req.body.branch_ids);
    return sendSuccess(res, 'Eligible branches updated for drive', { branches }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bind eligible departments to drive
 * @route   POST /api/v1/drives/:id/eligible-departments
 * @access  Private (Admin, TPO)
 */
const bindEligibleDepartments = async (req, res, next) => {
  try {
    const departments = await driveService.bindEligibleDepartments(req.params.id, req.body.department_ids);
    return sendSuccess(res, 'Eligible departments updated for drive', { departments }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bind eligible batches to drive
 * @route   POST /api/v1/drives/:id/eligible-batches
 * @access  Private (Admin, TPO)
 */
const bindEligibleBatches = async (req, res, next) => {
  try {
    const batches = await driveService.bindEligibleBatches(req.params.id, req.body.batches);
    return sendSuccess(res, 'Eligible batches updated for drive', { batches }, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDrives,
  getDriveById,
  createDrive,
  updateDrive,
  deleteDrive,
  getDriveProfile,
  getEligibleStudents,
  getDriveStatistics,
  bindEligibleBranches,
  bindEligibleDepartments,
  bindEligibleBatches,
};
