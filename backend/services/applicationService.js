const supabase = require('../config/supabase');
const driveService = require('./driveService');
const dataScopeService = require('./dataScopeService');

/**
 * Student Apply for Placement Drive
 */
const applyForDrive = async (userId, driveId, remarks) => {
  // 1. Fetch Student profile matching user_id
  const { data: student, error: studentErr } = await supabase
    .from('students')
    .select('id, roll_number, cgpa, active_backlogs, passing_year, branch_id')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  if (studentErr || !student) {
    const err = new Error('Student profile not found. Complete profile before applying.');
    err.statusCode = 404;
    throw err;
  }

  // 2. Fetch Placement Drive
  const drive = await driveService.getDriveById(driveId);

  // Published, open for registration, and the student meets every eligibility rule.
  const eligibility = await driveService.evaluateEligibility(drive, student);
  if (!eligibility.eligible) {
    const err = new Error(`Not eligible: ${eligibility.reasons.join(' ')}`);
    err.statusCode = 400;
    throw err;
  }

  // 3. Check duplicate application
  const { data: existingApp } = await supabase
    .from('drive_applications')
    .select('id')
    .eq('drive_id', driveId)
    .eq('student_id', student.id)
    .maybeSingle();

  if (existingApp) {
    const err = new Error('You have already applied for this placement drive.');
    err.statusCode = 409;
    throw err;
  }

  // 4. Check active resume snapshot
  const { data: activeResume } = await supabase
    .from('resumes')
    .select('id')
    .eq('student_id', student.id)
    .eq('is_active', true)
    .maybeSingle();

  if (!activeResume) {
    const err = new Error('No active resume found. Upload a resume before applying.');
    err.statusCode = 400;
    throw err;
  }

  // 6. Insert Drive Application Record
  const { data: application, error: appErr } = await supabase
    .from('drive_applications')
    .insert([
      {
        drive_id: driveId,
        student_id: student.id,
        resume_id: activeResume.id,
        current_round: 'Applied',
        status: 'Applied',
        remarks: remarks || null,
      },
    ])
    .select('*')
    .single();

  if (appErr) {
    const err = new Error(appErr.message);
    err.statusCode = 500;
    throw err;
  }

  // 7. Insert Initial History Audit Record
  await supabase.from('application_status_history').insert([
    {
      application_id: application.id,
      stage: 'Applied',
      round_name: 'Initial Application',
      remarks: remarks || 'Applied via student portal',
      updated_by: userId,
    },
  ]);

  // 8. Increment Drive Applied Count
  await supabase
    .from('placement_drives')
    .update({ applied_count: (drive.applied_count || 0) + 1 })
    .eq('id', driveId);

  return application;
};

/**
 * Withdraw Application (only before deadline)
 */
const withdrawApplication = async (userId, applicationId, isStaff = false) => {
  const { data: app, error: fetchErr } = await supabase
    .from('drive_applications')
    .select('*, placement_drives(registration_deadline, applied_count), students(user_id)')
    .eq('id', applicationId)
    .single();

  if (fetchErr || !app) {
    const err = new Error('Application record not found.');
    err.statusCode = 404;
    throw err;
  }

  // Ownership Check
  if (!isStaff && app.students.user_id !== userId) {
    const err = new Error('Forbidden: You can only withdraw your own application.');
    err.statusCode = 403;
    throw err;
  }

  // Deadline Check
  if (!isStaff) {
    const now = new Date();
    const deadline = new Date(app.placement_drives.registration_deadline);
    if (now > deadline) {
      const err = new Error('Cannot withdraw application after registration deadline.');
      err.statusCode = 400;
      throw err;
    }
  }

  // Delete Application
  const { error: delErr } = await supabase.from('drive_applications').delete().eq('id', applicationId);

  if (delErr) {
    const err = new Error(delErr.message);
    err.statusCode = 500;
    throw err;
  }

  // Decrement Drive Applied Count
  const currentCount = app.placement_drives.applied_count || 1;
  await supabase
    .from('placement_drives')
    .update({ applied_count: Math.max(0, currentCount - 1) })
    .eq('id', app.drive_id);

  return true;
};

/**
 * List Applications with role-scoped filtering and pagination
 */
const listApplications = async (reqUser, queryParams) => {
  const page = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || 10;
  const offset = (page - 1) * limit;

  const { drive_id, company_id, status, search } = queryParams;

  let query = supabase
    .from('drive_applications')
    .select(
      `
      *,
      placement_drives (
        id,
        drive_code,
        role_title,
        job_type,
        ctc,
        location,
        companies (
          id,
          name,
          logo_url,
          tier
        )
      ),
      students (
        id,
        roll_number,
        cgpa,
        current_semester,
        passing_year,
        users (
          full_name,
          email,
          phone,
          avatar_url
        ),
        branches (
          id,
          name,
          code
        )
      ),
      resumes (
        id,
        file_url,
        file_name
      )
    `,
      { count: 'exact' }
    );

  // Role Security Scope
  if (reqUser) {
    const scopeContext = await dataScopeService.resolveScopeContext(reqUser);
    query = dataScopeService.applyDataScope(query, reqUser, 'applications', scopeContext);
  }

  if (drive_id && drive_id !== 'undefined' && drive_id !== 'null') query = query.eq('drive_id', drive_id);
  if (status && status !== 'undefined' && status !== 'null') query = query.eq('status', status);

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data: apps, count, error } = await query;

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  // Offer letter, joining date and offer response live on `placements`; attach them to the matching application.
  const driveIds = [...new Set((apps || []).map((a) => a.drive_id))];
  const studentIds = [...new Set((apps || []).map((a) => a.student_id))];
  const placementByKey = {};
  if (driveIds.length > 0) {
    const { data: placementRows } = await supabase
      .from('placements')
      .select('drive_id, student_id, offer_letter_url, joining_date, offer_status')
      .in('drive_id', driveIds)
      .in('student_id', studentIds);
    (placementRows || []).forEach((p) => {
      placementByKey[`${p.drive_id}:${p.student_id}`] = p;
    });
  }

  const normalizedApps = (apps || []).map((app) => {
    const placement = placementByKey[`${app.drive_id}:${app.student_id}`];
    return {
      ...app,
      drives: app.placement_drives,
      applied_at: app.applied_date || app.created_at,
      offer_letter_url: placement?.offer_letter_url || null,
      joining_date: placement?.joining_date || null,
      offer_status: placement?.offer_status || null,
    };
  });

  return {
    applications: normalizedApps,
    page,
    limit,
    total: count || 0,
  };
};

/**
 * Get Application Details by ID
 */
const getApplicationById = async (applicationId) => {
  const { data: app, error } = await supabase
    .from('drive_applications')
    .select(
      `
      *,
      placement_drives (
        *,
        companies (
          id,
          name,
          logo_url,
          industry,
          website,
          tier
        )
      ),
      students (
        *,
        users (
          id,
          full_name,
          email,
          phone,
          avatar_url
        ),
        branches (
          id,
          name,
          code
        )
      ),
      resumes (
        id,
        file_url,
        file_name,
        file_size
      )
    `
    )
    .eq('id', applicationId)
    .single();

  if (error || !app) {
    const err = new Error('Application record not found.');
    err.statusCode = 404;
    throw err;
  }

  // Fetch status audit history
  const { data: history } = await supabase
    .from('application_status_history')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true });

  return {
    ...app,
    statusHistory: history || [],
  };
};

/**
 * Update Application Status Stage & Log Audit Entry
 */
const updateApplicationStatus = async (applicationId, stage, roundName, remarks, updatedBy) => {
  const app = await getApplicationById(applicationId);

  // 1. Update Application Record
  const { data: updatedApp, error: updateErr } = await supabase
    .from('drive_applications')
    .update({
      status: stage,
      current_round: roundName || stage,
      remarks: remarks || null,
    })
    .eq('id', applicationId)
    .select('*')
    .single();

  if (updateErr) {
    const err = new Error(updateErr.message);
    err.statusCode = 500;
    throw err;
  }

  // 2. Insert Audit History Log
  await supabase.from('application_status_history').insert([
    {
      application_id: applicationId,
      stage,
      round_name: roundName || stage,
      remarks: remarks || `Status changed to ${stage}`,
      updated_by: updatedBy,
    },
  ]);

  // 3. Update drive statistics counters
  if (stage === 'Shortlisted') {
    const { count } = await supabase
      .from('drive_applications')
      .select('id', { count: 'exact', head: true })
      .eq('drive_id', app.drive_id)
      .eq('status', 'Shortlisted');

    await supabase
      .from('placement_drives')
      .update({ shortlisted_count: count || 0 })
      .eq('id', app.drive_id);
  } else if (['Selected', 'Offer'].includes(stage)) {
    const { count } = await supabase
      .from('drive_applications')
      .select('id', { count: 'exact', head: true })
      .eq('drive_id', app.drive_id)
      .in('status', ['Selected', 'Offer']);

    await supabase
      .from('placement_drives')
      .update({ selected_count: count || 0 })
      .eq('id', app.drive_id);
  }

  // 4. Send Stage Transition Notification to Candidate
  try {
    const candidateUserId = app.students?.users?.id || app.students?.user_id;
    if (candidateUserId) {
      await supabase.from('notifications').insert([
        {
          user_id: candidateUserId,
          title: `Application Status Updated: ${stage}`,
          message: `Your application for ${app.placement_drives?.role_title || 'Role'} at ${app.placement_drives?.companies?.name || 'Company'} has moved to: ${stage}.`,
          type: 'Application Update',
          is_read: false,
        },
      ]);
    }
  } catch (e) {
    console.warn('Stage notification fallback:', e.message);
  }

  return updatedApp;
};

/**
 * Bulk Shortlist Applications
 */
const bulkShortlist = async (applicationIds, roundName = 'Shortlisted', remarks, updatedBy) => {
  const updatedApps = [];
  for (const id of applicationIds) {
    try {
      const app = await updateApplicationStatus(id, 'Shortlisted', roundName, remarks, updatedBy);
      updatedApps.push(app);
    } catch (e) {
      console.warn(`Bulk shortlist failed for ${id}:`, e.message);
    }
  }
  return updatedApps;
};

/**
 * Bulk Reject Applications
 */
const bulkReject = async (applicationIds, remarks = 'Application rejected', updatedBy) => {
  const updatedApps = [];
  for (const id of applicationIds) {
    try {
      const app = await updateApplicationStatus(id, 'Rejected', 'Rejected', remarks, updatedBy);
      updatedApps.push(app);
    } catch (e) {
      console.warn(`Bulk reject failed for ${id}:`, e.message);
    }
  }
  return updatedApps;
};

/**
 * Schedule Interview Round
 */
const scheduleInterview = async (applicationId, roundName, interviewDate, mode, meetingUrl, venue, remarks, user) => {
  // Kept for the legacy POST /applications/:id/interview route; the interviews module owns scheduling now.
  const interviewService = require('./interviewService'); // lazy: interviewService depends on this module
  await interviewService.createInterview(user, {
    application_id: applicationId,
    round_name: roundName,
    scheduled_at: interviewDate,
    mode: mode || 'Online',
    meeting_url: meetingUrl,
    venue,
  });
  return getApplicationById(applicationId);
};

/**
 * Get Overall Application Analytics Statistics
 */
const getApplicationStatistics = async (reqUser) => {
  let countQuery = supabase.from('drive_applications').select('status');

  if (reqUser.role === 'student') {
    const { data: std } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', reqUser.id)
      .maybeSingle();

    if (std) countQuery = countQuery.eq('student_id', std.id);
  } else if (reqUser.role === 'recruiter') {
    const { data: recruiter } = await supabase
      .from('recruiters')
      .select('company_id')
      .eq('user_id', reqUser.id)
      .maybeSingle();

    if (recruiter) {
      countQuery = countQuery.eq('placement_drives.company_id', recruiter.company_id);
    }
  }

  const { data: allApps, error } = await countQuery;

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  const stats = {
    totalApplications: allApps ? allApps.length : 0,
    shortlistedCount: 0,
    rejectedCount: 0,
    offerCount: 0,
    selectedCount: 0,
  };

  if (allApps) {
    allApps.forEach((app) => {
      if (app.status === 'Shortlisted') stats.shortlistedCount++;
      else if (app.status === 'Rejected') stats.rejectedCount++;
      else if (app.status === 'Offer') stats.offerCount++;
      else if (app.status === 'Selected') stats.selectedCount++;
    });
  }

  return stats;
};

module.exports = {
  applyForDrive,
  withdrawApplication,
  listApplications,
  getApplicationById,
  updateApplicationStatus,
  bulkShortlist,
  bulkReject,
  scheduleInterview,
  getApplicationStatistics,
};
