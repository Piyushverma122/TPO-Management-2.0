const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeModule } = require('../middleware/authorize');
const { Module, Action } = require('../config/rbac');
const { uploadCompanyLogo, uploadCompanyDoc } = require('../config/multer');
const {
  validateCreateCompany,
  validateUpdateCompany,
  validateCompanyId,
  validateCreateRecruiter,
  validateQueryFilter,
} = require('../validators/companyValidator');

// All routes require authentication
router.use(verifyToken);

// Company CRUD Routes
router.get('/', authorizeModule(Module.COMPANIES, Action.VIEW), validateQueryFilter, companyController.getCompanies);
router.get('/:id', authorizeModule(Module.COMPANIES, Action.VIEW), validateCompanyId, companyController.getCompanyById);
router.post('/', authorizeModule(Module.COMPANIES, Action.CREATE), validateCreateCompany, companyController.createCompany);
router.put('/:id', authorizeModule(Module.COMPANIES, Action.EDIT), validateUpdateCompany, companyController.updateCompany);
router.delete('/:id', authorizeModule(Module.COMPANIES, Action.DELETE), validateCompanyId, companyController.deleteCompany);

// Company Full Profile
router.get('/:id/profile', authorizeModule(Module.COMPANIES, Action.VIEW), validateCompanyId, companyController.getCompanyProfile);

// Company Logo & Document Management Routes
router.post(
  '/:id/logo',
  authorizeModule(Module.COMPANIES, Action.EDIT),
  validateCompanyId,
  uploadCompanyLogo.single('logo'),
  companyController.uploadLogo
);
router.post(
  '/:id/document',
  authorizeModule(Module.COMPANIES, Action.UPLOAD),
  validateCompanyId,
  uploadCompanyDoc.single('document'),
  companyController.uploadDocument
);
router.get('/:id/documents', authorizeModule(Module.COMPANIES, Action.VIEW), validateCompanyId, companyController.listDocuments);
router.delete('/document/:documentId', authorizeModule(Module.COMPANIES, Action.DELETE), companyController.deleteDocument);

// Recruiter Management Routes
router.get('/:id/recruiters', authorizeModule(Module.COMPANIES, Action.VIEW), validateCompanyId, companyController.listRecruiters);
router.post(
  '/:id/recruiters',
  authorizeModule(Module.COMPANIES, Action.CREATE),
  validateCreateRecruiter,
  companyController.createRecruiter
);

module.exports = {
  companyRouter: router,
};
