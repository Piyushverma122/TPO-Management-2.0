const supabase = require('../config/supabase');

const EVENT_TYPE_ALIASES = {
  interview: 'mock_interview',
  interviews: 'mock_interview',
  mock_interview: 'mock_interview',
  drive: 'placement_drive',
  drives: 'placement_drive',
  placement_drive: 'placement_drive',
  training: 'training',
  meeting: 'meeting',
  deadline: 'deadline',
  reminder: 'reminder',
};

const mapEventTypeAlias = (rawType) => {
  if (!rawType) return null;
  const clean = rawType.toString().toLowerCase().trim();
  return EVENT_TYPE_ALIASES[clean] || null;
};

/**
 * List Calendar Events with date range and event_type filters
 */
const listEvents = async (queryParams) => {
  const { start_date, end_date, event_type } = queryParams;

  let query = supabase
    .from('calendar_events')
    .select(
      `
      *,
      users!created_by (
        id,
        full_name,
        email,
        role
      )
    `
    );

  if (event_type) {
    const mappedType = mapEventTypeAlias(event_type);
    if (mappedType) {
      query = query.eq('event_type', mappedType);
    }
  }
  if (start_date) query = query.gte('start_time', start_date);
  if (end_date) query = query.lte('end_time', end_date);

  query = query.order('start_time', { ascending: true });

  const { data: events, error } = await query;

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return events || [];
};

/**
 * Get Event Details by ID
 */
const getEventById = async (eventId) => {
  const { data: event, error } = await supabase
    .from('calendar_events')
    .select(
      `
      *,
      users!created_by (
        id,
        full_name,
        email,
        role
      )
    `
    )
    .eq('id', eventId)
    .single();

  if (error || !event) {
    const err = new Error('Calendar event not found.');
    err.statusCode = 404;
    throw err;
  }

  return event;
};

/**
 * Create a new Calendar Event
 */
const createEvent = async (payload, userId) => {
  const {
    title,
    event_type,
    description,
    start_time,
    end_time,
    location,
    is_all_day = false,
    reminder_minutes_before = 15,
    related_entity_id,
  } = payload;

  const { data: event, error } = await supabase
    .from('calendar_events')
    .insert([
      {
        title,
        event_type,
        description: description || null,
        start_time,
        end_time,
        location: location || null,
        is_all_day,
        reminder_minutes_before,
        related_entity_id: related_entity_id || null,
        created_by: userId,
        updated_by: userId,
        status: 'Scheduled',
      },
    ])
    .select('*')
    .single();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return event;
};

/**
 * Update Calendar Event
 */
const updateEvent = async (eventId, payload, userId) => {
  await getEventById(eventId);

  const updateFields = {
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };

  if (payload.title !== undefined) updateFields.title = payload.title;
  if (payload.event_type !== undefined) updateFields.event_type = payload.event_type;
  if (payload.description !== undefined) updateFields.description = payload.description;
  if (payload.start_time !== undefined) updateFields.start_time = payload.start_time;
  if (payload.end_time !== undefined) updateFields.end_time = payload.end_time;
  if (payload.location !== undefined) updateFields.location = payload.location;
  if (payload.is_all_day !== undefined) updateFields.is_all_day = payload.is_all_day;
  if (payload.reminder_minutes_before !== undefined) updateFields.reminder_minutes_before = payload.reminder_minutes_before;
  if (payload.status !== undefined) updateFields.status = payload.status;

  const { data: updatedEvent, error } = await supabase
    .from('calendar_events')
    .update(updateFields)
    .eq('id', eventId)
    .select('*')
    .single();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return updatedEvent;
};

/**
 * Delete Calendar Event
 */
const deleteEvent = async (eventId) => {
  await getEventById(eventId);

  const { error } = await supabase.from('calendar_events').delete().eq('id', eventId);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return true;
};

/**
 * Quick Filter: Upcoming Events (from NOW)
 */
const getUpcomingEvents = async () => {
  const now = new Date().toISOString();

  const { data: events, error } = await supabase
    .from('calendar_events')
    .select('*')
    .gte('start_time', now)
    .order('start_time', { ascending: true })
    .limit(10);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return events || [];
};

/**
 * Quick Filter: Today's Scheduled Events
 */
const getTodayEvents = async () => {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  const { data: events, error } = await supabase
    .from('calendar_events')
    .select('*')
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .order('start_time', { ascending: true });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return events || [];
};

/**
 * Quick Filter: Current Week's Scheduled Events
 */
const getWeekEvents = async () => {
  const now = new Date();
  const firstDay = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
  const lastDay = new Date(now.setDate(now.getDate() - now.getDay() + 6)).toISOString();

  const { data: events, error } = await supabase
    .from('calendar_events')
    .select('*')
    .gte('start_time', firstDay)
    .lte('start_time', lastDay)
    .order('start_time', { ascending: true });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return events || [];
};

module.exports = {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getUpcomingEvents,
  getTodayEvents,
  getWeekEvents,
};
