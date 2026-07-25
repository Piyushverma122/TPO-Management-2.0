const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const {
  validateCreateEvent,
  validateUpdateEvent,
  validateEventId,
  validateQueryFilter,
} = require('../validators/calendarValidator');

// All routes require authentication
router.use(verifyToken);

// Dashboard & Quick Filter Routes
router.get('/upcoming', calendarController.getUpcomingEvents);
router.get('/today', calendarController.getTodayEvents);
router.get('/week', calendarController.getWeekEvents);

// Event Listing & CRUD Routes
router.get('/events', validateQueryFilter, calendarController.getEvents);
router.get('/events/:id', validateEventId, calendarController.getEventById);
router.post('/events', authorizeRoles('admin', 'tpo', 'faculty', 'recruiter'), validateCreateEvent, calendarController.createEvent);
router.put('/events/:id', authorizeRoles('admin', 'tpo', 'faculty', 'recruiter'), validateUpdateEvent, calendarController.updateEvent);
router.delete('/events/:id', authorizeRoles('admin', 'tpo', 'faculty', 'recruiter'), validateEventId, calendarController.deleteEvent);

module.exports = router;
