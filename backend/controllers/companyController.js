const companyService = require('../services/companyService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHandler');

/**
 * Helper to check if recruiter owns company or user is Admin/TPO
 */
const checkCompanyAccess = async (req, companyId) => {
  if (['admin', 'tpo'].includes(req.user.role)) {
    return true;
  }
  if (req.user.role === 'recruiter') {
    // Check if recruiter belongs to this companyId
    const recruiters = await companyService.listRecruiters(companyId);
    const isOwner = recruiters.some((r) => r.user_id === req.user.id);
    if (!isOwner) {
      const err = new Error('Forbidden: Recruiter can only modify their associated company.');
      err.statusCode = 403;
      throw err;
    }
    return true;
  }
  const err = new Error('Forbidden: Insufficient privileges.');
  err.statusCode = 403;
  throw err;
};

/**
 * @desc    List companies with pagination & filters
 * @route   GET /api/v1/companies
 * @access  Private (Authenticated)
 */
const getCompanies = async (req, res, next) => {
  try {
    const result = await companyService.listCompanies(req.query);
    return sendPaginated(
      res,
      'Companies list retrieved',
      result.companies,
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
 * @desc    Get company by ID
 * @route   GET /api/v1/companies/:id
 * @access  Private (Authenticated)
 */
const getCompanyById = async (req, res, next) => {
  try {
    const company = await companyService.getCompanyById(req.params.id);
    return sendSuccess(res, 'Company details retrieved', { company }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new hiring company
 * @route   POST /api/v1/companies
 * @access  Private (Admin, TPO)
 */
const createCompany = async (req, res, next) => {
  try {
    const company = await companyService.createCompany(req.body);
    return sendSuccess(res, 'Company created successfully', { company }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update company details
 * @route   PUT /api/v1/companies/:id
 * @access  Private (Admin, TPO, Recruiter (Own))
 */
const updateCompany = async (req, res, next) => {
  try {
    await checkCompanyAccess(req, req.params.id);
    const updatedCompany = await companyService.updateCompany(req.params.id, req.body);
    return sendSuccess(res, 'Company details updated', { company: updatedCompany }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft Delete company
 * @route   DELETE /api/v1/companies/:id
 * @access  Private (Admin, TPO)
 */
const deleteCompany = async (req, res, next) => {
  try {
    await companyService.deleteCompany(req.params.id);
    return sendSuccess(res, 'Company record soft deleted', null, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload company logo to company-logos bucket
 * @route   POST /api/v1/companies/:id/logo
 * @access  Private (Admin, TPO, Recruiter (Own))
 */
const uploadLogo = async (req, res, next) => {
  try {
    await checkCompanyAccess(req, req.params.id);
    if (!req.file) {
      return sendError(res, 'Please select an image file to upload as logo', null, 400);
    }
    const company = await companyService.uploadCompanyLogo(req.params.id, req.file);
    return sendSuccess(res, 'Company logo uploaded successfully', { company }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload JD / Hiring Document to company-documents bucket
 * @route   POST /api/v1/companies/:id/document
 * @access  Private (Admin, TPO, Recruiter (Own))
 */
const uploadDocument = async (req, res, next) => {
  try {
    await checkCompanyAccess(req, req.params.id);
    if (!req.file) {
      return sendError(res, 'Please upload a document file', null, 400);
    }
    const documentType = req.body.document_type || 'jd_pdf';
    const document = await companyService.uploadCompanyDocument(
      req.params.id,
      req.file,
      documentType,
      req.user.id
    );
    return sendSuccess(res, 'Company document uploaded successfully', { document }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List company hiring documents
 * @route   GET /api/v1/companies/:id/documents
 * @access  Private (Authenticated)
 */
const listDocuments = async (req, res, next) => {
  try {
    const documents = await companyService.listCompanyDocuments(req.params.id);
    return sendSuccess(res, 'Company documents list retrieved', { documents }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete company document
 * @route   DELETE /api/v1/companies/document/:documentId
 * @access  Private (Admin, TPO, Recruiter (Own))
 */
const deleteDocument = async (req, res, next) => {
  try {
    await companyService.deleteCompanyDocument(req.params.documentId);
    return sendSuccess(res, 'Company document deleted', null, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get aggregated company profile
 * @route   GET /api/v1/companies/:id/profile
 * @access  Private (Authenticated)
 */
const getCompanyProfile = async (req, res, next) => {
  try {
    const profile = await companyService.getCompanyProfile(req.params.id);
    return sendSuccess(res, 'Full company profile retrieved', { profile }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List recruiters for company
 * @route   GET /api/v1/companies/:id/recruiters
 * @access  Private (Authenticated)
 */
const listRecruiters = async (req, res, next) => {
  try {
    const recruiters = await companyService.listRecruiters(req.params.id);
    return sendSuccess(res, 'Company recruiters list retrieved', { recruiters }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create recruiter user for company
 * @route   POST /api/v1/companies/:id/recruiters
 * @access  Private (Admin, TPO)
 */
const createRecruiter = async (req, res, next) => {
  try {
    const recruiter = await companyService.createRecruiter(req.params.id, req.body);
    return sendSuccess(res, 'Recruiter account created successfully', { recruiter }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update recruiter details
 * @route   PUT /api/v1/recruiters/:id
 * @access  Private (Admin, TPO, Self)
 */
const updateRecruiter = async (req, res, next) => {
  try {
    const updatedRecruiter = await companyService.updateRecruiter(req.params.id, req.body);
    return sendSuccess(res, 'Recruiter details updated', { recruiter: updatedRecruiter }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete recruiter
 * @route   DELETE /api/v1/recruiters/:id
 * @access  Private (Admin, TPO)
 */
const deleteRecruiter = async (req, res, next) => {
  try {
    await companyService.deleteRecruiter(req.params.id);
    return sendSuccess(res, 'Recruiter soft deleted', null, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  uploadLogo,
  uploadDocument,
  listDocuments,
  deleteDocument,
  getCompanyProfile,
  listRecruiters,
  createRecruiter,
  updateRecruiter,
  deleteRecruiter,
};
