const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeModule } = require('../middleware/authorize');
const { Module, Action } = require('../config/rbac');
const {
  validateUpdateSetting,
  validateAuditQueryFilter,
  validateAuditId,
} = require('../validators/adminValidator');

// All routes require authentication
router.use(verifyToken);

// System Settings Routes (Settings Module - MANAGE / VIEW / EDIT)
router.get('/settings', authorizeModule(Module.SETTINGS, Action.VIEW), adminController.getSettings);
router.put('/settings/:key', authorizeModule(Module.SETTINGS, Action.EDIT), validateUpdateSetting, adminController.updateSetting);
router.post('/settings/reset', authorizeModule(Module.SETTINGS, Action.MANAGE), adminController.resetSettings);

// Audit Trail Routes (Reports & Users / Settings Module - VIEW)
router.get('/audit', authorizeModule(Module.REPORTS, Action.VIEW), validateAuditQueryFilter, adminController.getAuditLogs);
router.get('/audit/statistics', authorizeModule(Module.REPORTS, Action.VIEW), adminController.getAuditStatistics);
router.get('/audit/:id', authorizeModule(Module.REPORTS, Action.VIEW), validateAuditId, adminController.getAuditLogById);

module.exports = router;
