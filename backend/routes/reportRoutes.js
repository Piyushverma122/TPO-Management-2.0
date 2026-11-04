const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeModule } = require('../middleware/authorize');
const { Module, Action } = require('../config/rbac');

// All routes require authentication
router.use(verifyToken);

// The whole Reports page in one call (KPIs, charts, tables). A recruiter only ever gets their own company's numbers.
router.get('/dashboard', authorizeModule(Module.REPORTS, Action.VIEW), reportController.getDashboard);

// Downloads: /export/csv|excel|pdf?type=summary|placements|students|companies|drives|trainings
router.get('/export/:format', authorizeModule(Module.REPORTS, Action.EXPORT), reportController.exportReport);

// Tabular reports: placements | students | companies | drives | trainings
router.get('/:type', authorizeModule(Module.REPORTS, Action.VIEW), reportController.getReportRows);

module.exports = router;
