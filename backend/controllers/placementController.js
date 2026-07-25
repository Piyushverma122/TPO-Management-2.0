const placementService = require('../services/placementService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHandler');

/**
 * @desc    List placement records with pagination & filters
 * @route   GET /api/v1/placements
 * @access  Private (Authenticated)
 */
const getPlacements = async (req, res, next) => {
  try {
    const result = await placementService.listPlacements(req.query);
    return sendPaginated(
      res,
      'Placements list retrieved',
      result.placements,
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
 * @desc    Get placement details by ID
 * @route   GET /api/v1/placements/:id
 * @access  Private (Authenticated)
 */
const getPlacementById = async (req, res, next) => {
  try {
    const placement = await placementService.getPlacementById(req.params.id);
    return sendSuccess(res, 'Placement details retrieved', { placement }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new official placement record
 * @route   POST /api/v1/placements
 * @access  Private (Admin, TPO)
 */
const createPlacement = async (req, res, next) => {
  try {
    const placement = await placementService.createPlacement(req.body);
    return sendSuccess(res, 'Placement record created successfully', { placement }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update placement record
 * @route   PUT /api/v1/placements/:id
 * @access  Private (Admin, TPO, Recruiter (Own))
 */
const updatePlacement = async (req, res, next) => {
  try {
    const updatedPlacement = await placementService.updatePlacement(req.params.id, req.body);
    return sendSuccess(res, 'Placement record updated', { placement: updatedPlacement }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete placement record
 * @route   DELETE /api/v1/placements/:id
 * @access  Private (Admin, TPO)
 */
const deletePlacement = async (req, res, next) => {
  try {
    await placementService.deletePlacement(req.params.id);
    return sendSuccess(res, 'Placement record deleted', null, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get comprehensive placement analytics statistics
 * @route   GET /api/v1/placements/statistics
 * @access  Private (Authenticated)
 */
const getStatistics = async (req, res, next) => {
  try {
    const statistics = await placementService.getPlacementStatistics();
    return sendSuccess(res, 'Placement statistics calculated successfully', { statistics }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get candidate's placement history & timeline
 * @route   GET /api/v1/placements/student/:studentId
 * @access  Private (Authenticated)
 */
const getStudentHistory = async (req, res, next) => {
  try {
    const history = await placementService.getStudentPlacementHistory(req.params.studentId);
    return sendSuccess(res, 'Student placement timeline retrieved', { history }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get company's complete hiring history list
 * @route   GET /api/v1/placements/company/:companyId
 * @access  Private (Authenticated)
 */
const getCompanyHistory = async (req, res, next) => {
  try {
    const hires = await placementService.getCompanyPlacementHistory(req.params.companyId);
    return sendSuccess(res, 'Company hiring history retrieved', { hires }, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlacements,
  getPlacementById,
  createPlacement,
  updatePlacement,
  deletePlacement,
  getStatistics,
  getStudentHistory,
  getCompanyHistory,
};
