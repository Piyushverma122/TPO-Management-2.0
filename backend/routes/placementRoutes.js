const express = require('express');
const router = express.Router();
const placementController = require('../controllers/placementController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeModule } = require('../middleware/authorize');
const { Module, Action } = require('../config/rbac');
const {
  validateCreatePlacement,
  validateUpdatePlacement,
  validatePlacementId,
  validateQueryFilter,
} = require('../validators/placementValidator');

// All routes require authentication
router.use(verifyToken);

// Placements Listing & Comprehensive Statistics
router.get('/', authorizeModule(Module.PLACEMENTS, Action.VIEW), validateQueryFilter, placementController.getPlacements);
router.get('/statistics', authorizeModule(Module.PLACEMENTS, Action.VIEW), placementController.getStatistics);

// Student & Company Placement Histories
router.get('/student/:studentId', authorizeModule(Module.PLACEMENTS, Action.VIEW), placementController.getStudentHistory);
router.get('/company/:companyId', authorizeModule(Module.PLACEMENTS, Action.VIEW), placementController.getCompanyHistory);

// Placement Record CRUD Routes
router.get('/:id', authorizeModule(Module.PLACEMENTS, Action.VIEW), validatePlacementId, placementController.getPlacementById);
router.post('/', authorizeModule(Module.PLACEMENTS, Action.CREATE), validateCreatePlacement, placementController.createPlacement);
router.put('/:id', authorizeModule(Module.PLACEMENTS, Action.EDIT), validateUpdatePlacement, placementController.updatePlacement);
router.delete('/:id', authorizeModule(Module.PLACEMENTS, Action.DELETE), validatePlacementId, placementController.deletePlacement);

module.exports = router;
