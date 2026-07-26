const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeModule } = require('../middleware/authorize');
const { Module, Action } = require('../config/rbac');

// All routes require authentication
router.use(verifyToken);

// Domain Reports
router.get('/students', authorizeModule(Module.REPORTS, Action.VIEW), reportController.getStudentsReport);
router.get('/companies', authorizeModule(Module.REPORTS, Action.VIEW), reportController.getCompaniesReport);
router.get('/placements', authorizeModule(Module.REPORTS, Action.VIEW), reportController.getPlacementsReport);
router.get('/trainings', authorizeModule(Module.REPORTS, Action.VIEW), reportController.getTrainingsReport);
router.get('/drives', authorizeModule(Module.REPORTS, Action.VIEW), reportController.getDrivesReport);

// Export Downloads & Payloads
router.get('/export/csv', authorizeModule(Module.REPORTS, Action.EXPORT), reportController.exportCSV);
router.get('/export/excel', authorizeModule(Module.REPORTS, Action.EXPORT), reportController.exportExcel);
router.get('/export/pdf', authorizeModule(Module.REPORTS, Action.EXPORT), reportController.exportPDF);

module.exports = router;
