const supabase = require('../config/supabase');
const studentService = require('./studentService');
const driveService = require('./driveService');

const unwrap = ({ data, error }, label) => {
  if (error) throw Object.assign(new Error(`${label}: ${error.message}`), { statusCode: 500 });
  return data || [];
};

const has = (v) => (typeof v === 'string' ? v.trim() !== '' : v !== null && v !== undefined);

/**
 * What the student still has to do to finish onboarding. Staff see exactly which steps are missing,
 * including for students who never logged in.
 */
const buildOnboarding = ({ student, user, resumes, documents, skills }) => {
  const checklist = [
    { key: 'login', label: 'Logged in at least once', done: has(user?.last_login) },
    { key: 'password', label: 'Changed the temporary password', done: user ? user.must_change_password === false : false },
    { key: 'phone', label: 'Phone number added', done: has(student.phone) || has(user?.phone) },
    { key: 'address', label: 'Address added', done: has(student.address) || has(student.city) },
    { key: 'dob', label: 'Date of birth and gender added', done: has(student.date_of_birth) && has(student.gender) },
    { key: 'marks', label: '10th and 12th/diploma marks added', done: has(student.tenth_percentage) && (has(student.twelfth_percentage) || has(student.diploma_percentage)) },
    { key: 'headline', label: 'Resume headline or bio written', done: has(student.resume_headline) || has(student.bio) },
    { key: 'links', label: 'LinkedIn, GitHub or portfolio link added', done: has(student.linkedin_url) || has(student.github_url) || has(student.portfolio_url) },
    { key: 'skills', label: 'Skills recorded', done: skills.length > 0 },
    { key: 'resume', label: 'Resume uploaded', done: resumes.length > 0 },
    { key: 'documents', label: 'Documents uploaded', done: documents.length > 0 },
  ];
  const completion = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);

  let status = 'Completed';
  if (!has(user?.last_login)) status = 'Not started';
  else if (user.must_change_password || completion < 80) status = 'Pending';

  return { status, completion, checklist, missing: checklist.filter((c) => !c.done).map((c) => c.label) };
};

const ROUND_STAGES = ['Round 1', 'Round 2', 'Technical', 'HR'];

/** Everything an admin needs to know about one student, in a single call. */
const getStudentOverview = async (studentId, user) => {
  // Throws 404/403 when the student does not exist or is outside the caller's scope.
  const base = await studentService.getStudentById(studentId, user);
  const sid = base.id;
  const nowIso = new Date().toISOString();

  const [
    userRows, branchRows, skillRows, semesterRows, resumeRows, documentRows, applicationRows,
    interviewRows, offerRows, enrollmentRows, certificateRows, attendanceRows, notificationRows, openDriveRows,
  ] = await Promise.all([
    supabase.from('users').select('id, email, full_name, phone, avatar_url, is_active, email_verified, last_login, must_change_password, created_at').eq('id', base.user_id).maybeSingle().then((r) => ({ data: r.data ? [r.data] : [], error: r.error })),
    base.branch_id
      ? supabase.from('branches').select('id, name, code, departments ( id, name, code )').eq('id', base.branch_id).maybeSingle().then((r) => ({ data: r.data ? [r.data] : [], error: r.error }))
      : Promise.resolve({ data: [] }),
    supabase.from('student_skills').select('id, proficiency_level, experience_months, is_primary, skills ( id, name, category )').eq('student_id', sid),
    supabase.from('student_semesters').select('*').eq('student_id', sid).order('semester', { ascending: true }),
    supabase.from('resumes').select('id, version_title, file_name, file_size, is_active, is_verified, uploaded_at').eq('student_id', sid).order('uploaded_at', { ascending: false }),
    supabase.from('student_documents').select('id, document_name, document_type, file_name, file_size, mime_type, uploaded_at').eq('student_id', sid).order('uploaded_at', { ascending: false }),
    supabase
      .from('drive_applications')
      .select('id, status, current_round, applied_date, remarks, placement_drives ( id, drive_code, role_title, ctc, location, drive_date, job_type, companies ( id, name, logo_url ) )')
      .eq('student_id', sid)
      .order('applied_date', { ascending: false }),
    supabase
      .from('interviews')
      .select('id, application_id, round_name, round_no, scheduled_at, end_at, mode, meeting_url, venue, interviewer_name, status, feedback, reschedule_count, companies ( name ), placement_drives ( role_title )')
      .eq('student_id', sid)
      .is('deleted_at', null)
      .order('scheduled_at', { ascending: false }),
    supabase
      .from('placements')
      .select('id, package, offer_status, role_title, joining_date, response_deadline, responded_at, decline_reason, file_name, storage_path, created_at, companies ( name, logo_url ), placement_drives ( role_title )')
      .eq('student_id', sid)
      .order('created_at', { ascending: false }),
    supabase.from('training_enrollments').select('id, progress_percentage, completed, enrolled_at, training_modules ( id, title, category, level )').eq('student_id', sid),
    supabase.from('training_certificates').select('id, certificate_number, issued_date, file_name, training_modules ( title )').eq('student_id', sid),
    supabase.from('training_attendance').select('id, is_present').eq('student_id', sid),
    supabase.from('notifications').select('id, title, message, type, is_read, created_at').eq('user_id', base.user_id).order('created_at', { ascending: false }).limit(10),
    supabase
      .from('placement_drives')
      .select('id, drive_code, role_title, approval_status, status, registration_deadline, min_cgpa, max_backlogs, passing_year, ctc, companies ( name, logo_url )')
      .is('deleted_at', null)
      .eq('approval_status', 'Approved')
      .in('status', ['Upcoming', 'Ongoing'])
      .gte('registration_deadline', nowIso)
      .order('registration_deadline', { ascending: true })
      .limit(10),
  ]);

  const account = unwrap(userRows, 'users')[0] || null;
  const branch = unwrap(branchRows, 'branch')[0] || null;
  const skills = unwrap(skillRows, 'skills');
  const semesters = unwrap(semesterRows, 'semesters');
  const resumes = unwrap(resumeRows, 'resumes');
  const documents = unwrap(documentRows, 'documents');
  const applications = unwrap(applicationRows, 'applications');
  const interviews = unwrap(interviewRows, 'interviews');
  const offers = unwrap(offerRows, 'offers');
  const enrollments = unwrap(enrollmentRows, 'training');
  const certificates = unwrap(certificateRows, 'certificates');
  const attendance = unwrap(attendanceRows, 'attendance');
  const notifications = unwrap(notificationRows, 'notifications');
  const openDrives = unwrap(openDriveRows, 'drives');

  // Status history of every application, oldest first, for the timeline.
  const appIds = applications.map((a) => a.id);
  const history = appIds.length
    ? unwrap(await supabase.from('application_status_history').select('id, application_id, stage, round_name, remarks, created_at').in('application_id', appIds).order('created_at', { ascending: true }), 'history')
    : [];
  const historyByApp = history.reduce((map, h) => ((map[h.application_id] ||= []).push(h), map), {});

  // Open drives this student has not applied to yet, and whether they could.
  const appliedDriveIds = new Set(applications.map((a) => a.placement_drives?.id).filter(Boolean));
  const notApplied = [];
  for (const drive of openDrives.filter((d) => !appliedDriveIds.has(d.id))) {
    const { eligible, reasons } = await driveService.evaluateEligibility(drive, base);
    notApplied.push({ id: drive.id, drive_code: drive.drive_code, role_title: drive.role_title, ctc: drive.ctc, registration_deadline: drive.registration_deadline, company: drive.companies, eligible, reasons });
  }

  const now = Date.now();
  const isFinished = (i) => ['Completed', 'Passed', 'Failed', 'Cancelled'].includes(i.status);
  const live = (i) => i.status === 'Scheduled' && new Date(i.scheduled_at).getTime() <= now && new Date(i.end_at || new Date(i.scheduled_at).getTime() + 3600000).getTime() >= now;
  const upcoming = interviews.filter((i) => i.status === 'Scheduled' && new Date(i.scheduled_at).getTime() > now).reverse();
  const liveNow = interviews.filter(live);
  const past = interviews.filter((i) => isFinished(i) || (i.status === 'Scheduled' && !live(i) && new Date(i.scheduled_at).getTime() <= now));

  const byStatus = applications.reduce((map, a) => ((map[a.status] = (map[a.status] || 0) + 1), map), {});
  const accepted = offers.filter((o) => o.offer_status === 'Accepted');
  const present = attendance.filter((a) => a.is_present).length;

  const student = {
    ...base,
    user: account,
    branch,
    department: branch?.departments || null,
  };

  return {
    student,
    onboarding: buildOnboarding({ student: base, user: account, resumes, documents, skills }),
    skills,
    semesters,
    resumes,
    documents,
    applications: applications.map((a) => ({ ...a, history: historyByApp[a.id] || [] })),
    interviews: { upcoming, live: liveNow, past },
    drives: {
      applied: applications.length,
      // Drives the student actually took part in: reached a round, got selected/offered or was rejected after screening.
      attended: applications.filter((a) => ROUND_STAGES.includes(a.status) || ['Offer', 'Selected', 'Rejected'].includes(a.status)).length,
      selected: applications.filter((a) => ['Selected', 'Offer'].includes(a.status)).length,
      rejected: byStatus.Rejected || 0,
      inProgress: applications.filter((a) => !['Rejected', 'Selected', 'Offer', 'Offer Declined'].includes(a.status)).length,
      byStatus,
      openNotApplied: notApplied,
    },
    offers,
    placement: {
      status: base.placement_status,
      accepted: accepted[0] || null,
      acceptedCount: accepted.length,
    },
    training: {
      enrollments,
      certificates,
      attendance: { sessions: attendance.length, present, percentage: attendance.length ? Math.round((present / attendance.length) * 100) : null },
    },
    notifications,
    stats: {
      applications: applications.length,
      interviews: interviews.length,
      upcomingInterviews: upcoming.length + liveNow.length,
      offers: offers.length,
      resumes: resumes.length,
      documents: documents.length,
      certificates: certificates.length,
    },
  };
};

module.exports = { getStudentOverview };
