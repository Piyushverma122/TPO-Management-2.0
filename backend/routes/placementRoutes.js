const express = require('express');
const router = express.Router();
const placementController = require('../controllers/placementController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const {
  validateCreatePlacement,
  validateUpdatePlacement,
  validatePlacementId,
  validateQueryFilter,
} = require('../validators/placementValidator');

// All routes require authentication
router.use(verifyToken);

// Placements Listing & Comprehensive Statistics
router.get('/', validateQueryFilter, placementController.getPlacements);
router.get('/statistics', placementController.getStatistics);

// Student & Company Placement Histories
router.get('/student/:studentId', placementController.getStudentHistory);
router.get('/company/:companyId', placementController.getCompanyHistory);

// Placement Record CRUD Routes
router.get('/:id', validatePlacementId, placementController.getPlacementById);
router.post('/', authorizeRoles('admin', 'tpo'), validateCreatePlacement, placementController.createPlacement);
router.put('/:id', authorizeRoles('admin', 'tpo', 'recruiter'), validateUpdatePlacement, placementController.updatePlacement);
router.delete('/:id', authorizeRoles('admin', 'tpo'), validatePlacementId, placementController.deletePlacement);

module.exports = router;
