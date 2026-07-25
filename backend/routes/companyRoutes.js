const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { uploadCompanyLogo, uploadCompanyDoc } = require('../config/multer');
const {
  validateCreateCompany,
  validateUpdateCompany,
  validateCompanyId,
  validateCreateRecruiter,
  validateUpdateRecruiter,
  validateQueryFilter,
} = require('../validators/companyValidator');

// All routes require authentication
router.use(verifyToken);

// Company CRUD Routes
router.get('/', validateQueryFilter, companyController.getCompanies);
router.get('/:id', validateCompanyId, companyController.getCompanyById);
router.post('/', authorizeRoles('admin', 'tpo'), validateCreateCompany, companyController.createCompany);
router.put('/:id', validateUpdateCompany, companyController.updateCompany);
router.delete('/:id', authorizeRoles('admin', 'tpo'), validateCompanyId, companyController.deleteCompany);

// Company Full Profile
router.get('/:id/profile', validateCompanyId, companyController.getCompanyProfile);

// Company Logo & Document Management Routes
router.post(
  '/:id/logo',
  validateCompanyId,
  uploadCompanyLogo.single('logo'),
  companyController.uploadLogo
);
router.post(
  '/:id/document',
  validateCompanyId,
  uploadCompanyDoc.single('document'),
  companyController.uploadDocument
);
router.get('/:id/documents', validateCompanyId, companyController.listDocuments);
router.delete('/document/:documentId', companyController.deleteDocument);

// Recruiter Management Routes
router.get('/:id/recruiters', validateCompanyId, companyController.listRecruiters);
router.post(
  '/:id/recruiters',
  authorizeRoles('admin', 'tpo'),
  validateCreateRecruiter,
  companyController.createRecruiter
);

// Separate recruiter routes mounted directly under /recruiters handled in index.js or sub-routes
module.exports = {
  companyRouter: router,
};
