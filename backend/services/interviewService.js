// Same client as every other service: service-role when SUPABASE_USE_SERVICE_ROLE=true, anon otherwise.
const db = require('../config/supabase');
const { Role, normalizeRole } = require('../config/rbac');
const dataScopeService = require('./dataScopeService');
const applicationService = require('./applicationService');
const calendarService = require('./calendarService');
const emailService = require('./emailService');
const logger = require('../utils/logger');

const DEFAULT_DURATION_MS = 60 * 60 * 1000;
const SCHEDULABLE_STAGES = ['Shortlisted', 'Round 1', 'Round 2', 'Technical', 'HR'];

const INTERVIEW_SELECT = `
  *,
  students ( id, roll_number, user_id, users ( id, full_name, email ) ),
  placement_drives ( id, drive_code, role_title ),
  companies ( id, name, logo_url )
`;

const httpError = (message, statusCode) => Object.assign(new Error(message), { statusCode });

const dbError = (error) => httpError(error.message, 500);

const stageForRound = (roundName = '') => {
  const name = roundName.toLowerCase();
  if (name.includes('technical')) return 'Technical';
  if (/\bhr\b/.test(name)) return 'HR';
  if (name.includes('round 2')) return 'Round 2';
  return 'Round 1';
};

const formatWhen = (iso) =>
  new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

/** Loads an application with the drive, company and candidate details needed to schedule against it. */
const getApplicationContext = async (applicationId) => {
  const { data: app, error } = await db
    .from('drive_applications')
    .select(
      `id, status, drive_id, student_id,
       placement_drives ( id, company_id, role_title, companies ( id, name ) ),
       students ( id, user_id, users ( id, full_name, email ) )`
    )
    .eq('id', applicationId)
    .maybeSingle();

  if (error) throw dbError(error);
  if (!app) throw httpError('Application record not found.', 404);
  return app;
};

/** Students may only see their own interviews; recruiters only their company's. */
const assertCanView = async (user, interview) => {
  const role = normalizeRole(user.role);
  if (role === Role.ADMIN || role === Role.TPO) return;

  const ctx = await dataScopeService.resolveScopeContext(user);
  const allowed =
    (role === Role.STUDENT && ctx.studentId && interview.student_id === ctx.studentId) ||
    (role === Role.RECRUITER && ctx.companyId && interview.company_id === ctx.companyId);

  if (!allowed) {
    await dataScopeService.logOwnershipViolation(user, 'interviews', interview.id, 'VIEW', 'Interview does not belong to this user');
    throw httpError('Interview not found.', 404);
  }
};

const fetchInterview = async (id) => {
  const { data, error } = await db.from('interviews').select(INTERVIEW_SELECT).eq('id', id).is('deleted_at', null).maybeSingle();
  if (error) throw dbError(error);
  if (!data) throw httpError('Interview not found.', 404);
  return data;
};

/** Rejects a slot when the same candidate already has a scheduled interview overlapping it. */
const assertNoClash = async (studentId, startIso, endIso, excludeId = null) => {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();

  const { data, error } = await db
    .from('interviews')
    .select('id, scheduled_at, end_at')
    .eq('student_id', studentId)
    .eq('status', 'Scheduled')
    .is('deleted_at', null)
    .gte('scheduled_at', new Date(start - 24 * 60 * 60 * 1000).toISOString())
    .lte('scheduled_at', endIso);
  if (error) throw dbError(error);

  const clash = (data || []).find((row) => {
    if (row.id === excludeId) return false;
    const rowStart = new Date(row.scheduled_at).getTime();
    const rowEnd = row.end_at ? new Date(row.end_at).getTime() : rowStart + DEFAULT_DURATION_MS;
    return rowStart < end && rowEnd > start;
  });
  if (clash) throw httpError('This candidate already has another interview scheduled at that time.', 409);
};

const addHistory = async (applicationId, stage, roundName, remarks, userId) => {
  const { error } = await db
    .from('application_status_history')
    .insert([{ application_id: applicationId, stage, round_name: roundName, remarks, updated_by: userId }]);
  if (error) logger.warn(`Interview history log failed: ${error.message}`);
};

const notify = async (userIds, title, message) => {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return;
  const { error } = await db
    .from('notifications')
    .insert(ids.map((user_id) => ({ user_id, title, message, type: 'Interview Scheduled', is_read: false })));
  if (error) logger.warn(`Interview notification failed: ${error.message}`);
};

const companyRecruiterUserIds = async (companyId) => {
  const { data } = await db.from('recruiters').select('user_id').eq('company_id', companyId).is('deleted_at', null);
  return (data || []).map((r) => r.user_id);
};

/** Notifies the candidate, and the company's recruiters when staff (not the recruiter) made the change. */
const announce = async (user, interview, kind, extra = '') => {
  try {
    const company = interview.companies?.name || 'the company';
    const role = interview.placement_drives?.role_title || 'the role';
    const when = formatWhen(interview.scheduled_at);
    const titles = {
      scheduled: `Interview scheduled: ${interview.round_name}`,
      rescheduled: `Interview rescheduled: ${interview.round_name}`,
      cancelled: `Interview cancelled: ${interview.round_name}`,
      result: `Interview result: ${interview.round_name}`,
    };
    const messages = {
      scheduled: `${interview.round_name} for ${role} at ${company} is on ${when} (${interview.mode}).`,
      rescheduled: `${interview.round_name} for ${role} at ${company} has moved to ${when} (${interview.mode}).`,
      cancelled: `${interview.round_name} for ${role} at ${company} on ${when} was cancelled.${extra ? ` Reason: ${extra}` : ''}`,
      result: `Your ${interview.round_name} for ${role} at ${company}: ${interview.status}.${extra ? ` ${extra}` : ''}`,
    };

    const recipients = [interview.students?.user_id];
    if (normalizeRole(user.role) !== Role.RECRUITER && kind !== 'result') {
      recipients.push(...(await companyRecruiterUserIds(interview.company_id)));
    }
    await notify(recipients, titles[kind], messages[kind]);

    const candidate = interview.students?.users;
    if (candidate?.email) {
      await emailService.sendInterviewEmail({
        to: candidate.email,
        name: candidate.full_name,
        kind,
        title: titles[kind],
        company,
        role,
        round: interview.round_name,
        when,
        mode: interview.mode,
        meetingUrl: interview.meeting_url,
        venue: interview.venue,
        note: extra,
      });
    }
  } catch (e) {
    logger.warn(`Interview announce failed: ${e.message}`);
  }
};

const syncCalendar = async (user, interview, action) => {
  try {
    const location = interview.mode === 'Online' ? interview.meeting_url : interview.venue;
    const title = `Interview: ${interview.round_name} - ${interview.companies?.name || ''}`.trim();
    const endIso = interview.end_at || new Date(new Date(interview.scheduled_at).getTime() + DEFAULT_DURATION_MS).toISOString();

    if (action === 'create') {
      const event = await calendarService.createEvent(
        {
          title,
          event_type: 'mock_interview',
          description: `${interview.students?.users?.full_name || 'Candidate'} - ${interview.placement_drives?.role_title || ''}`.trim(),
          start_time: interview.scheduled_at,
          end_time: endIso,
          location,
          related_entity_id: interview.id,
        },
        user.id
      );
      await db.from('interviews').update({ calendar_event_id: event.id }).eq('id', interview.id);
      return event.id;
    }

    if (!interview.calendar_event_id) return null;
    const payload = action === 'update'
      ? { title, start_time: interview.scheduled_at, end_time: endIso, location, status: 'Scheduled' }
      : { status: action === 'cancel' ? 'Cancelled' : 'Completed' };
    await calendarService.updateEvent(interview.calendar_event_id, payload, user.id);
    return interview.calendar_event_id;
  } catch (e) {
    logger.warn(`Interview calendar sync (${action}) failed: ${e.message}`);
    return null;
  }
};

// ---------------------------------------------------------------- queries

const FINISHED_STATUSES = ['Completed', 'Passed', 'Failed', 'Cancelled'];

/**
 * Where an interview sits on the timeline:
 *   upcoming  - scheduled, not started yet
 *   live      - scheduled and happening right now
 *   awaiting  - scheduled, ended, but nobody recorded the result yet
 *   history   - finished (passed, failed, completed or cancelled)
 */
const applyView = (query, view) => {
  const now = new Date().toISOString();
  switch (view) {
    case 'upcoming':
      return query.eq('status', 'Scheduled').gt('scheduled_at', now);
    case 'live':
      return query.eq('status', 'Scheduled').lte('scheduled_at', now).gte('end_at', now);
    case 'awaiting':
      return query.eq('status', 'Scheduled').lt('end_at', now);
    case 'history':
      return query.in('status', FINISHED_STATUSES);
    default:
      return query;
  }
};

const listInterviews = async (user, queryParams) => {
  const page = parseInt(queryParams.page, 10) || 1;
  const limit = parseInt(queryParams.limit, 10) || 10;
  const offset = (page - 1) * limit;
  const { status, company_id, drive_id, student_id, from, to, upcoming, search } = queryParams;
  const view = queryParams.view || (String(upcoming) === 'true' ? 'upcoming' : undefined);

  let query = db.from('interviews').select(INTERVIEW_SELECT, { count: 'exact' }).is('deleted_at', null);

  const scopeContext = await dataScopeService.resolveScopeContext(user);
  query = dataScopeService.applyDataScope(query, user, 'interviews', scopeContext);

  if (status) query = query.eq('status', status);
  if (company_id) query = query.eq('company_id', company_id);
  if (drive_id) query = query.eq('drive_id', drive_id);
  if (student_id) query = query.eq('student_id', student_id);
  if (from) query = query.gte('scheduled_at', from);
  if (to) query = query.lte('scheduled_at', to);
  if (search) query = query.ilike('round_name', `%${String(search).replace(/[%,]/g, ' ')}%`);

  query = applyView(query, view);
  // Things still to happen read soonest-first; everything else newest-first.
  query = query.order('scheduled_at', { ascending: ['upcoming', 'live'].includes(view) });

  const { data, count, error } = await query.range(offset, offset + limit - 1);
  if (error) throw dbError(error);

  return { interviews: data || [], page, limit, total: count || 0 };
};

/** Counts for the dashboard cards (same role scope as the list). */
const getSummary = async (user) => {
  const scopeContext = await dataScopeService.resolveScopeContext(user);
  const count = async (view, extra = (q) => q) => {
    let query = db.from('interviews').select('id', { count: 'exact', head: true }).is('deleted_at', null);
    query = dataScopeService.applyDataScope(query, user, 'interviews', scopeContext);
    const { count: total, error } = await extra(applyView(query, view));
    if (error) throw dbError(error);
    return total || 0;
  };

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const [upcoming, live, awaiting, history, today, passed] = await Promise.all([
    count('upcoming'),
    count('live'),
    count('awaiting'),
    count('history'),
    count(undefined, (q) => q.gte('scheduled_at', startOfDay.toISOString()).lt('scheduled_at', endOfDay.toISOString()).neq('status', 'Cancelled')),
    count(undefined, (q) => q.eq('status', 'Passed')),
  ]);

  return { upcoming, live, awaiting, history, today, passed };
};

const getInterviewById = async (user, id) => {
  const interview = await fetchInterview(id);
  await assertCanView(user, interview);
  return interview;
};

// ---------------------------------------------------------------- commands

const createInterview = async (user, payload) => {
  const { application_id, round_name, scheduled_at, end_at, mode = 'Online', meeting_url, venue, interviewer_name } = payload;

  const app = await getApplicationContext(application_id);
  const drive = app.placement_drives;
  await dataScopeService.assertCanManageCompany(user, drive.company_id);

  if (!SCHEDULABLE_STAGES.includes(app.status)) {
    throw httpError(`Interviews can only be scheduled for shortlisted candidates (current stage: ${app.status}).`, 400);
  }
  if (new Date(scheduled_at).getTime() < Date.now() - 5 * 60 * 1000) {
    throw httpError('Interview date and time must be in the future.', 400);
  }

  const endIso = end_at || new Date(new Date(scheduled_at).getTime() + DEFAULT_DURATION_MS).toISOString();
  if (new Date(endIso) <= new Date(scheduled_at)) throw httpError('End time must be after the start time.', 400);

  await assertNoClash(app.student_id, scheduled_at, endIso);

  const { count } = await db
    .from('interviews')
    .select('id', { count: 'exact', head: true })
    .eq('application_id', application_id)
    .is('deleted_at', null);

  const { data: created, error } = await db
    .from('interviews')
    .insert([
      {
        application_id,
        drive_id: app.drive_id,
        student_id: app.student_id,
        company_id: drive.company_id,
        round_name,
        round_no: (count || 0) + 1,
        scheduled_at,
        end_at: endIso,
        mode,
        meeting_url: mode === 'Online' ? meeting_url || null : null,
        venue: mode === 'Offline' ? venue || null : null,
        interviewer_name: interviewer_name || null,
        created_by: user.id,
      },
    ])
    .select('id')
    .single();
  if (error) throw dbError(error);

  const stage = stageForRound(round_name);
  if (app.status !== stage) {
    await applicationService.updateApplicationStatus(application_id, stage, round_name, `Interview scheduled for ${formatWhen(scheduled_at)} (${mode})`, user.id);
  } else {
    await addHistory(application_id, stage, round_name, `Interview scheduled for ${formatWhen(scheduled_at)} (${mode})`, user.id);
  }

  let interview = await fetchInterview(created.id);
  await syncCalendar(user, interview, 'create');
  interview = await fetchInterview(created.id);
  await announce(user, interview, 'scheduled');
  return interview;
};

const rescheduleInterview = async (user, id, payload) => {
  const interview = await fetchInterview(id);
  await dataScopeService.assertCanManageCompany(user, interview.company_id);
  if (interview.status !== 'Scheduled') throw httpError(`A ${interview.status.toLowerCase()} interview cannot be rescheduled.`, 400);

  const scheduled_at = payload.scheduled_at || interview.scheduled_at;
  if (payload.scheduled_at && new Date(scheduled_at).getTime() < Date.now() - 5 * 60 * 1000) {
    throw httpError('Interview date and time must be in the future.', 400);
  }
  const endIso = payload.end_at || (payload.scheduled_at
    ? new Date(new Date(scheduled_at).getTime() + DEFAULT_DURATION_MS).toISOString()
    : interview.end_at);
  if (new Date(endIso) <= new Date(scheduled_at)) throw httpError('End time must be after the start time.', 400);

  await assertNoClash(interview.student_id, scheduled_at, endIso, id);

  const mode = payload.mode || interview.mode;
  const updates = {
    scheduled_at,
    end_at: endIso,
    mode,
    meeting_url: mode === 'Online' ? payload.meeting_url ?? interview.meeting_url : null,
    venue: mode === 'Offline' ? payload.venue ?? interview.venue : null,
    interviewer_name: payload.interviewer_name ?? interview.interviewer_name,
    round_name: payload.round_name || interview.round_name,
    reschedule_count: interview.reschedule_count + 1,
    updated_at: new Date().toISOString(),
  };

  const { error } = await db.from('interviews').update(updates).eq('id', id);
  if (error) throw dbError(error);

  const updated = await fetchInterview(id);
  await syncCalendar(user, updated, 'update');
  await addHistory(updated.application_id, (await getApplicationContext(updated.application_id)).status, updated.round_name, `Interview rescheduled to ${formatWhen(updated.scheduled_at)}`, user.id);
  await announce(user, updated, 'rescheduled');
  return updated;
};

const cancelInterview = async (user, id, reason) => {
  const interview = await fetchInterview(id);
  await dataScopeService.assertCanManageCompany(user, interview.company_id);
  if (interview.status !== 'Scheduled') throw httpError(`A ${interview.status.toLowerCase()} interview cannot be cancelled.`, 400);

  const { error } = await db
    .from('interviews')
    .update({ status: 'Cancelled', feedback: reason || interview.feedback, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw dbError(error);

  const updated = await fetchInterview(id);
  await syncCalendar(user, updated, 'cancel');
  await addHistory(updated.application_id, (await getApplicationContext(updated.application_id)).status, updated.round_name, `Interview cancelled${reason ? `: ${reason}` : ''}`, user.id);
  await announce(user, updated, 'cancelled', reason || '');
  return updated;
};

/**
 * Records the outcome of an interview. Failing ends the candidacy; passing the final round selects the candidate.
 */
const recordResult = async (user, id, { result, feedback, is_final = false }) => {
  const interview = await fetchInterview(id);
  await dataScopeService.assertCanManageCompany(user, interview.company_id);
  if (interview.status !== 'Scheduled') throw httpError(`Result already recorded or interview ${interview.status.toLowerCase()}.`, 400);
  if (new Date(interview.scheduled_at).getTime() > Date.now()) throw httpError('A result cannot be recorded before the interview takes place.', 400);

  const { error } = await db
    .from('interviews')
    .update({ status: result, feedback: feedback || null, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw dbError(error);

  if (result === 'Failed') {
    await applicationService.updateApplicationStatus(interview.application_id, 'Rejected', interview.round_name, feedback || 'Not selected after interview', user.id);
  } else if (is_final) {
    await applicationService.updateApplicationStatus(interview.application_id, 'Selected', interview.round_name, feedback || 'Selected after final round', user.id);
  } else {
    await addHistory(interview.application_id, (await getApplicationContext(interview.application_id)).status, interview.round_name, `Cleared ${interview.round_name}`, user.id);
  }

  const updated = await fetchInterview(id);
  await syncCalendar(user, updated, 'complete');
  await announce(user, updated, 'result', feedback || '');
  return updated;
};

module.exports = {
  listInterviews,
  getSummary,
  getInterviewById,
  createInterview,
  rescheduleInterview,
  cancelInterview,
  recordResult,
};
