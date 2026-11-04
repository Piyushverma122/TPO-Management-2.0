const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeModule } = require('../middleware/authorize');
const { Module, Action } = require('../config/rbac');
const {
  validateListQuery,
  validateInterviewId,
  validateCreateInterview,
  validateReschedule,
  validateCancel,
  validateResult,
} = require('../validators/interviewValidator');

// All routes require authentication
router.use(verifyToken);

router.get('/', authorizeModule(Module.INTERVIEWS, Action.VIEW), validateListQuery, interviewController.listInterviews);
router.get('/summary', authorizeModule(Module.INTERVIEWS, Action.VIEW), interviewController.getSummary);
router.get('/:id', authorizeModule(Module.INTERVIEWS, Action.VIEW), validateInterviewId, interviewController.getInterview);

router.post('/', authorizeModule(Module.INTERVIEWS, Action.CREATE), validateCreateInterview, interviewController.createInterview);
router.put('/:id', authorizeModule(Module.INTERVIEWS, Action.EDIT), validateReschedule, interviewController.rescheduleInterview);
router.patch('/:id/cancel', authorizeModule(Module.INTERVIEWS, Action.EDIT), validateCancel, interviewController.cancelInterview);
router.patch('/:id/result', authorizeModule(Module.INTERVIEWS, Action.EDIT), validateResult, interviewController.recordResult);

module.exports = router;
