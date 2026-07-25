const calendarService = require('../services/calendarService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * @desc    List calendar events with optional date range & event_type filters
 * @route   GET /api/v1/calendar/events
 * @access  Private (Authenticated)
 */
const getEvents = async (req, res, next) => {
  try {
    const events = await calendarService.listEvents(req.query);
    return sendSuccess(res, 'Calendar events list retrieved', { events }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get calendar event details by ID
 * @route   GET /api/v1/calendar/events/:id
 * @access  Private (Authenticated)
 */
const getEventById = async (req, res, next) => {
  try {
    const event = await calendarService.getEventById(req.params.id);
    return sendSuccess(res, 'Calendar event details retrieved', { event }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new calendar event
 * @route   POST /api/v1/calendar/events
 * @access  Private (Admin, TPO, Faculty, Recruiter)
 */
const createEvent = async (req, res, next) => {
  try {
    const event = await calendarService.createEvent(req.body, req.user.id);
    return sendSuccess(res, 'Calendar event created successfully', { event }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update calendar event details
 * @route   PUT /api/v1/calendar/events/:id
 * @access  Private (Admin, TPO, Faculty, Creator)
 */
const updateEvent = async (req, res, next) => {
  try {
    const updatedEvent = await calendarService.updateEvent(req.params.id, req.body, req.user.id);
    return sendSuccess(res, 'Calendar event updated successfully', { event: updatedEvent }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete calendar event
 * @route   DELETE /api/v1/calendar/events/:id
 * @access  Private (Admin, TPO, Creator)
 */
const deleteEvent = async (req, res, next) => {
  try {
    await calendarService.deleteEvent(req.params.id);
    return sendSuccess(res, 'Calendar event deleted', null, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Quick Filter: Upcoming Events
 * @route   GET /api/v1/calendar/upcoming
 * @access  Private (Authenticated)
 */
const getUpcomingEvents = async (req, res, next) => {
  try {
    const events = await calendarService.getUpcomingEvents();
    return sendSuccess(res, 'Upcoming events retrieved', { events }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Quick Filter: Today's Scheduled Events
 * @route   GET /api/v1/calendar/today
 * @access  Private (Authenticated)
 */
const getTodayEvents = async (req, res, next) => {
  try {
    const events = await calendarService.getTodayEvents();
    return sendSuccess(res, "Today's events retrieved", { events }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Quick Filter: Current Week's Scheduled Events
 * @route   GET /api/v1/calendar/week
 * @access  Private (Authenticated)
 */
const getWeekEvents = async (req, res, next) => {
  try {
    const events = await calendarService.getWeekEvents();
    return sendSuccess(res, "This week's events retrieved", { events }, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getUpcomingEvents,
  getTodayEvents,
  getWeekEvents,
};
