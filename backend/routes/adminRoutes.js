const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const {
  validateUpdateSetting,
  validateAuditQueryFilter,
  validateAuditId,
} = require('../validators/adminValidator');

// All routes require authentication
router.use(verifyToken);

// System Settings Routes (Admin Only)
router.get('/settings', authorizeRoles('admin'), adminController.getSettings);
router.put('/settings/:key', authorizeRoles('admin'), validateUpdateSetting, adminController.updateSetting);
router.post('/settings/reset', authorizeRoles('admin'), adminController.resetSettings);

// Audit Trail Routes (Admin, TPO)
router.get('/audit', authorizeRoles('admin', 'tpo'), validateAuditQueryFilter, adminController.getAuditLogs);
router.get('/audit/statistics', authorizeRoles('admin', 'tpo'), adminController.getAuditStatistics);
router.get('/audit/:id', authorizeRoles('admin', 'tpo'), validateAuditId, adminController.getAuditLogById);

module.exports = router;
