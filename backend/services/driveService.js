const supabase = require('../config/supabase');
const dataScopeService = require('./dataScopeService');
const notificationService = require('./notificationService');
const emailService = require('./emailService');
const storage = require('./storageService');
const logger = require('../utils/logger');
const { Role, normalizeRole } = require('../config/rbac');

const httpError = (message, statusCode) => Object.assign(new Error(message), { statusCode });
const dbError = (error) => httpError(error.message, 500);

const isStaff = (user) => [Role.ADMIN, Role.TPO].includes(normalizeRole(user?.role));
const isRecruiter = (user) => normalizeRole(user?.role) === Role.RECRUITER;

const DRIVE_SELECT = `
  *,
  companies ( id, name, logo_url, industry, website, tier ),
  drive_profiles ( * ),
  drive_eligible_branches ( branches ( id, name, code ) ),
  drive_eligible_departments ( department_id )
`;

const sortProfiles = (drive) => {
  if (drive?.drive_profiles) drive.drive_profiles.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return drive;
};

// ---------------------------------------------------------------- visibility

/** Students and faculty only ever see approved drives that are not drafts. */
const isPublic = (drive) => drive.approval_status === 'Approved' && drive.status !== 'Draft';

const assertCanView = async (user, drive) => {
  if (!user || isStaff(user)) return;
  if (isRecruiter(user)) {
    const companyId = await dataScopeService.getCompanyIdForRecruiter(user.id);
    if (companyId && companyId === drive.company_id) return;
    throw httpError('Placement drive record not found.', 404);
  }
  if (!isPublic(drive)) throw httpError('Placement drive record not found.', 404);
};

/** Throws unless the user may edit this drive (staff always; a recruiter only for their own unpublished drive). */
const assertCanEdit = async (user, drive) => {
  if (isStaff(user)) return;
  await dataScopeService.assertCanManageCompany(user, drive.company_id);
  if (!['Draft', 'Rejected', 'Pending'].includes(drive.approval_status)) {
    throw httpError('This drive is already published. Ask the TPO to change it.', 409);
  }
};

// ---------------------------------------------------------------- list / read

const listDrives = async (queryParams, reqUser) => {
  const page = parseInt(queryParams.page, 10) || 1;
  const limit = parseInt(queryParams.limit, 10) || 10;
  const offset = (page - 1) * limit;
  const { search, company_id, status, job_type, batch, min_ctc, max_ctc, approval_status } = queryParams;

  let query = supabase.from('placement_drives').select(DRIVE_SELECT, { count: 'exact' }).is('deleted_at', null);

  if (reqUser) {
    const scopeContext = await dataScopeService.resolveScopeContext(reqUser);
    query = dataScopeService.applyDataScope(query, reqUser, 'drives', scopeContext);
    if (!isStaff(reqUser) && !isRecruiter(reqUser)) query = query.eq('approval_status', 'Approved').neq('status', 'Draft');
  }

  if (approval_status) query = query.eq('approval_status', approval_status);
  if (company_id) query = query.eq('company_id', company_id);
  if (status) query = query.eq('status', status);
  if (job_type) query = query.eq('job_type', job_type);
  if (batch || queryParams.passing_year) query = query.eq('passing_year', batch || queryParams.passing_year);
  if (min_ctc) query = query.gte('ctc', parseFloat(min_ctc));
  if (max_ctc) query = query.lte('ctc', parseFloat(max_ctc));
  if (search) {
    const needle = String(search).replace(/[%,()]/g, ' ').trim();
    if (needle) query = query.or(`role_title.ilike.%${needle}%,drive_code.ilike.%${needle}%,location.ilike.%${needle}%`);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  const { data: drives, count, error } = await query;
  if (error) throw dbError(error);

  const normalized = (drives || []).map((d) => {
    sortProfiles(d);
    const branchNames = (d.drive_eligible_branches || []).map((b) => b.branches?.name || b.branches?.code).filter(Boolean);
    return { ...d, allowed_branches: branchNames.length ? branchNames : ['All Branches'], selection_rounds: d.rounds || [] };
  });

  return { drives: normalized, page, limit, total: count || 0 };
};

/** Raw read with no permission check, for internal use. */
const getDriveById = async (driveId) => {
  const { data: drive, error } = await supabase.from('placement_drives').select(DRIVE_SELECT).eq('id', driveId).is('deleted_at', null).maybeSingle();
  if (error) throw dbError(error);
  if (!drive) throw httpError('Placement drive record not found.', 404);
  return sortProfiles(drive);
};

const getDriveForUser = async (driveId, user) => {
  const drive = await getDriveById(driveId);
  await assertCanView(user, drive);
  return drive;
};

// ---------------------------------------------------------------- payload helpers

const num = (v) => (v === undefined || v === null || v === '' ? null : Number(v));

const cleanProfiles = (profiles) =>
  (profiles || []).map((p, index) => ({
    title: String(p.title || '').trim(),
    streams: Array.isArray(p.streams) ? p.streams.map((s) => String(s).trim()).filter(Boolean) : [],
    openings: num(p.openings),
    probation_months: num(p.probation_months),
    stipend_min: num(p.stipend_min),
    stipend_max: num(p.stipend_max),
    ctc_min: num(p.ctc_min),
    ctc_max: num(p.ctc_max),
    ppo_ctc_min: num(p.ppo_ctc_min),
    ppo_ctc_max: num(p.ppo_ctc_max),
    interview_mode: p.interview_mode || null,
    interview_location: p.interview_location ? String(p.interview_location).trim() : null,
    responsibilities: p.responsibilities ? String(p.responsibilities).trim() : null,
    sort_order: index,
  }));

/** The legacy single-value columns are kept in sync so older screens and reports still work. */
const summarize = (profiles) => {
  const max = (key) => profiles.reduce((m, p) => Math.max(m, Number(p[key]) || 0), 0);
  return {
    role_title: profiles.map((p) => p.title).join(' / ').slice(0, 150),
    ctc: max('ctc_max') || max('ppo_ctc_max') || max('ctc_min'),
    stipend: max('stipend_max') || max('stipend_min'),
    total_openings: profiles.reduce((sum, p) => sum + (Number(p.openings) || 0), 0) || null,
  };
};

const replaceProfiles = async (driveId, profiles) => {
  const { error: delErr } = await supabase.from('drive_profiles').delete().eq('drive_id', driveId);
  if (delErr) throw dbError(delErr);
  if (!profiles.length) return;
  const { error } = await supabase.from('drive_profiles').insert(profiles.map((p) => ({ ...p, drive_id: driveId })));
  if (error) throw dbError(error);
};

const bindEligibility = async (driveId, { branch_ids, department_ids, batches }) => {
  const rebind = async (table, rows) => {
    const { error: delErr } = await supabase.from(table).delete().eq('drive_id', driveId);
    if (delErr) throw dbError(delErr);
    if (rows.length) {
      const { error } = await supabase.from(table).insert(rows);
      if (error) throw dbError(error);
    }
  };
  if (Array.isArray(branch_ids)) await rebind('drive_eligible_branches', branch_ids.map((branch_id) => ({ drive_id: driveId, branch_id })));
  if (Array.isArray(department_ids)) await rebind('drive_eligible_departments', department_ids.map((department_id) => ({ drive_id: driveId, department_id })));
  if (Array.isArray(batches)) await rebind('drive_eligible_batches', batches.map((passing_year) => ({ drive_id: driveId, passing_year })));
};

const DRIVE_FIELDS = [
  'job_type', 'location', 'location_note', 'drive_mode', 'min_cgpa', 'max_backlogs', 'passing_year', 'registration_deadline', 'drive_date',
  'rounds', 'description', 'registration_link', 'contact_name', 'contact_email', 'contact_phone', 'bond_details',
];

const generateDriveCode = () => `DRV-${new Date().getFullYear().toString().slice(-2)}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

// ---------------------------------------------------------------- notifications

const staffUserIds = async () => {
  const { data } = await supabase.from('users').select('id').in('role', ['admin', 'tpo']).eq('is_active', true).is('deleted_at', null);
  return (data || []).map((u) => u.id);
};

const companyRecruiterUserIds = async (companyId) => {
  const { data } = await supabase.from('recruiters').select('user_id').eq('company_id', companyId).is('deleted_at', null);
  return (data || []).map((r) => r.user_id);
};

const notify = async (userIds, title, message, type = 'Drive Announcement') => {
  const rows = [...new Set((userIds || []).filter(Boolean))].map((user_id) => ({ user_id, title, message, type, is_read: false }));
  if (!rows.length) return;
  const { error } = await supabase.from('notifications').insert(rows);
  if (error) logger.warn(`Drive notification failed: ${error.message}`);
};

// ---------------------------------------------------------------- eligibility

/** Students who meet the drive's marks, backlog, batch and branch rules. */
const getEligibleStudents = async (driveId) => {
  const drive = await getDriveById(driveId);
  const { data: batchRows } = await supabase.from('drive_eligible_batches').select('passing_year').eq('drive_id', driveId);
  const allowedBranchIds = (drive.drive_eligible_branches || []).map((b) => b.branches?.id).filter(Boolean);
  const allowedYears = (batchRows || []).map((b) => b.passing_year);

  let query = supabase
    .from('students')
    .select('id, user_id, roll_number, cgpa, active_backlogs, passing_year, placement_status, users!inner ( full_name, email, phone, avatar_url ), branches ( id, name, code )')
    .is('deleted_at', null)
    .gte('cgpa', drive.min_cgpa || 0)
    .lte('active_backlogs', drive.max_backlogs || 0);

  if (allowedYears.length) query = query.in('passing_year', allowedYears);
  else if (drive.passing_year) query = query.eq('passing_year', drive.passing_year);
  if (allowedBranchIds.length) query = query.in('branch_id', allowedBranchIds);

  const { data, error } = await query;
  if (error) throw dbError(error);
  return data || [];
};

/**
 * Explains whether one student may apply. Returns { eligible, reasons[] } so the UI can say exactly why not.
 * Used for the apply button and enforced again by applyForDrive.
 */
const evaluateEligibility = async (drive, student) => {
  const reasons = [];
  const now = Date.now();

  if (drive.approval_status !== 'Approved') reasons.push('This drive is not published yet.');
  if (['Draft', 'Completed', 'Conducted'].includes(drive.status)) reasons.push(`Registration is closed (drive is ${drive.status.toLowerCase()}).`);
  if (drive.registration_deadline && new Date(drive.registration_deadline).getTime() < now) reasons.push('The registration deadline has passed.');

  if (!student) {
    reasons.push('Your account is not linked to a student record.');
    return { eligible: false, reasons };
  }

  const cgpa = Number(student.cgpa) || 0;
  if (drive.min_cgpa && cgpa < Number(drive.min_cgpa)) reasons.push(`Minimum CGPA is ${drive.min_cgpa} (yours is ${cgpa}).`);
  if (student.active_backlogs > (drive.max_backlogs ?? 0)) reasons.push(`Active backlogs must be at most ${drive.max_backlogs ?? 0} (you have ${student.active_backlogs}).`);

  const [{ data: batchRows }, { data: branchRows }, { data: deptRows }] = await Promise.all([
    supabase.from('drive_eligible_batches').select('passing_year').eq('drive_id', drive.id),
    supabase.from('drive_eligible_branches').select('branch_id').eq('drive_id', drive.id),
    supabase.from('drive_eligible_departments').select('department_id').eq('drive_id', drive.id),
  ]);

  const years = (batchRows || []).map((b) => b.passing_year);
  if (years.length ? !years.includes(student.passing_year) : drive.passing_year && student.passing_year !== drive.passing_year) {
    reasons.push(`Open to the ${years.length ? years.join(', ') : drive.passing_year} batch (yours is ${student.passing_year}).`);
  }

  const branchIds = (branchRows || []).map((b) => b.branch_id);
  if (branchIds.length && !branchIds.includes(student.branch_id)) reasons.push('Your branch is not eligible for this drive.');

  const deptIds = (deptRows || []).map((d) => d.department_id);
  if (deptIds.length) {
    const { data: branch } = await supabase.from('branches').select('department_id').eq('id', student.branch_id).maybeSingle();
    if (!branch || !deptIds.includes(branch.department_id)) reasons.push('Your department is not eligible for this drive.');
  }

  return { eligible: reasons.length === 0, reasons };
};

const getMyEligibility = async (driveId, user) => {
  const drive = await getDriveForUser(driveId, user);
  const { data: student } = await supabase
    .from('students')
    .select('id, cgpa, active_backlogs, passing_year, branch_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle();
  return evaluateEligibility(drive, student);
};

// ---------------------------------------------------------------- publish / announce

/** Tells eligible students about a newly published drive: in-app for everyone, email when SMTP is set. */
const announceDrive = async (driveId) => {
  try {
    const drive = await getDriveById(driveId);
    const students = await getEligibleStudents(driveId);
    await notify(
      students.map((s) => s.user_id),
      `New drive: ${drive.companies?.name || 'Company'} - ${drive.role_title}`,
      `${drive.companies?.name || 'A company'} is hiring${drive.registration_deadline ? `. Register before ${new Date(drive.registration_deadline).toLocaleDateString()}` : ''}. Open Placement Drives to check the profiles and apply.`
    );
    await Promise.allSettled(students.map((s) => emailService.sendDriveAnnouncementEmail({ to: s.users?.email, name: s.users?.full_name, drive })));
  } catch (err) {
    logger.warn(`Drive announcement failed: ${err.message}`);
  }
};

const audit = async (userId, action, details) => {
  try {
    if (userId) await supabase.from('audit_logs').insert([{ user_id: userId, action, category: 'Placement Drives', details }]);
  } catch (err) {
    logger.warn(`Drive audit log failed: ${err.message}`);
  }
};

// ---------------------------------------------------------------- commands

const createDrive = async (payload, user) => {
  const recruiter = isRecruiter(user);
  let companyId = payload.company_id;
  if (recruiter) {
    companyId = await dataScopeService.getCompanyIdForRecruiter(user.id);
    if (!companyId) throw httpError('Your account is not linked to a company. Please contact the TPO office.', 403);
  }
  if (!companyId) throw httpError('Company is required.', 400);

  const profiles = cleanProfiles(payload.profiles);
  if (!profiles.length) throw httpError('Add at least one profile (role) to the drive.', 400);

  const asDraft = payload.submit === false || payload.status === 'Draft';
  // Recruiters can never publish: their drive waits for TPO/admin approval.
  const approval_status = asDraft ? 'Draft' : recruiter ? 'Pending' : 'Approved';
  const published = approval_status === 'Approved';

  const row = { company_id: companyId, created_by: user.id, approval_status, status: asDraft || recruiter ? 'Draft' : payload.status || 'Upcoming', ...summarize(profiles) };
  for (const field of DRIVE_FIELDS) if (payload[field] !== undefined) row[field] = payload[field] === '' ? null : payload[field];
  if (published) row.published_at = new Date().toISOString();

  let drive;
  for (let attempt = 0; attempt < 5 && !drive; attempt += 1) {
    const { data, error } = await supabase.from('placement_drives').insert([{ ...row, drive_code: generateDriveCode() }]).select('*').single();
    if (!error) drive = data;
    else if (error.code !== '23505') throw dbError(error);
  }
  if (!drive) throw httpError('Could not generate a unique drive code. Please try again.', 500);

  try {
    await replaceProfiles(drive.id, profiles);
    await bindEligibility(drive.id, payload);
  } catch (err) {
    await supabase.from('placement_drives').delete().eq('id', drive.id); // do not leave a half-created drive behind
    throw err;
  }

  await audit(user.id, approval_status === 'Approved' ? 'DRIVE_PUBLISHED' : 'DRIVE_CREATED', `${approval_status} drive ${drive.drive_code}: ${drive.role_title}`);
  if (approval_status === 'Pending') await notifyApprovalNeeded(drive);
  if (published) await announceDrive(drive.id);

  return getDriveById(drive.id);
};

const notifyApprovalNeeded = async (drive) => {
  await notify(await staffUserIds(), 'Drive awaiting approval', `A new drive "${drive.role_title}" (${drive.drive_code}) was submitted and needs approval before students can see it.`, 'System Alert');
};

const updateDrive = async (driveId, payload, user) => {
  const drive = await getDriveById(driveId);
  await assertCanEdit(user, drive);

  const fields = {};
  for (const field of DRIVE_FIELDS) if (payload[field] !== undefined) fields[field] = payload[field] === '' ? null : payload[field];

  // Only staff may move a drive between lifecycle statuses.
  if (isStaff(user) && payload.status !== undefined) fields.status = payload.status;

  let profiles = null;
  if (payload.profiles !== undefined) {
    profiles = cleanProfiles(payload.profiles);
    if (!profiles.length) throw httpError('Add at least one profile (role) to the drive.', 400);
    Object.assign(fields, summarize(profiles));
  }

  // A recruiter resubmitting a draft/rejected drive sends it back to the approval queue.
  const resubmit = isRecruiter(user) && payload.submit === true && ['Draft', 'Rejected'].includes(drive.approval_status);
  if (resubmit) Object.assign(fields, { approval_status: 'Pending', rejection_reason: null });

  // Staff finishing a draft publish it straight away (no approval step for them).
  const publishNow = isStaff(user) && payload.submit === true && ['Draft', 'Rejected'].includes(drive.approval_status);
  if (publishNow) {
    const now = new Date().toISOString();
    Object.assign(fields, {
      approval_status: 'Approved', approved_by: user.id, approved_at: now, published_at: now, rejection_reason: null,
      status: fields.status ?? (drive.status === 'Draft' ? 'Upcoming' : drive.status),
    });
  }

  if (Object.keys(fields).length) {
    const { error } = await supabase.from('placement_drives').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', driveId);
    if (error) throw dbError(error);
  }
  if (profiles) await replaceProfiles(driveId, profiles);
  await bindEligibility(driveId, payload);

  if (resubmit) await notifyApprovalNeeded(drive);
  if (publishNow) await announceDrive(driveId);
  await audit(user.id, 'DRIVE_UPDATED', `Updated drive ${drive.drive_code}`);
  return getDriveById(driveId);
};

const approveDrive = async (driveId, user) => {
  const drive = await getDriveById(driveId);
  if (drive.approval_status !== 'Pending') throw httpError(`Only a pending drive can be approved (this one is ${drive.approval_status}).`, 409);

  const { error } = await supabase
    .from('placement_drives')
    .update({
      approval_status: 'Approved',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      rejection_reason: null,
      status: drive.status === 'Draft' ? 'Upcoming' : drive.status,
    })
    .eq('id', driveId)
    .eq('approval_status', 'Pending'); // a second approver clicking at the same time changes nothing
  if (error) throw dbError(error);

  await audit(user.id, 'DRIVE_APPROVED', `Approved drive ${drive.drive_code}`);
  await notify(await companyRecruiterUserIds(drive.company_id), 'Drive approved', `Your drive "${drive.role_title}" was approved and is now visible to students.`);
  await announceDrive(driveId);
  return getDriveById(driveId);
};

const rejectDrive = async (driveId, user, reason) => {
  const drive = await getDriveById(driveId);
  if (drive.approval_status !== 'Pending') throw httpError(`Only a pending drive can be rejected (this one is ${drive.approval_status}).`, 409);

  const { error } = await supabase
    .from('placement_drives')
    .update({ approval_status: 'Rejected', rejection_reason: reason, approved_by: user.id, approved_at: new Date().toISOString() })
    .eq('id', driveId)
    .eq('approval_status', 'Pending');
  if (error) throw dbError(error);

  await audit(user.id, 'DRIVE_REJECTED', `Rejected drive ${drive.drive_code}: ${reason}`);
  await notify(await companyRecruiterUserIds(drive.company_id), 'Drive rejected', `Your drive "${drive.role_title}" was rejected. Reason: ${reason}. Edit it and submit again.`);
  return getDriveById(driveId);
};

const deleteDrive = async (driveId, user) => {
  const drive = await getDriveById(driveId);
  const { error } = await supabase.from('placement_drives').update({ deleted_at: new Date().toISOString() }).eq('id', driveId);
  if (error) throw dbError(error);
  await audit(user?.id, 'DRIVE_DELETED', `Deleted drive ${drive.drive_code}`);
  return true;
};

// ---------------------------------------------------------------- JD file

const attachJd = async (driveId, file, user) => {
  storage.ensureConfigured();
  if (!file) throw httpError('Please attach the job description as a PDF.', 400);
  if (file.buffer.subarray(0, 5).toString('latin1') !== '%PDF-') throw httpError('The uploaded file is not a valid PDF.', 400);

  const drive = await getDriveById(driveId);
  await assertCanEdit(user, drive); // staff always; a recruiter only while the drive is unpublished

  const key = storage.buildKey('drive-jd', driveId, 'pdf');
  await storage.putObject({ key, body: file.buffer, contentType: 'application/pdf' });

  const { error } = await supabase.from('placement_drives').update({ jd_key: key, jd_name: file.originalname, jd_mime: 'application/pdf' }).eq('id', driveId);
  if (error) {
    await storage.removeObject(key);
    throw dbError(error);
  }
  if (drive.jd_key) await storage.removeObject(drive.jd_key);
  await audit(user.id, 'DRIVE_JD_UPLOADED', `JD uploaded for ${drive.drive_code}`);
  return getDriveById(driveId);
};

const getJdUrl = async (driveId, user) => {
  const drive = await getDriveForUser(driveId, user);
  if (!drive.jd_key) throw httpError('No job description is attached to this drive.', 404);
  const url = await storage.getDownloadUrl(drive.jd_key, { fileName: drive.jd_name, contentType: drive.jd_mime || 'application/pdf' });
  return { url, file_name: drive.jd_name, expires_in: storage.SIGNED_URL_TTL_SECONDS };
};

// ---------------------------------------------------------------- reports

const getDriveProfile = async (driveId, user) => {
  const drive = await getDriveForUser(driveId, user);

  const [{ data: eligibleDepts }, { data: eligibleBatches }, applied, shortlisted, selected] = await Promise.all([
    supabase.from('drive_eligible_departments').select('id, department_id, departments(id, name, code)').eq('drive_id', driveId),
    supabase.from('drive_eligible_batches').select('*').eq('drive_id', driveId),
    supabase.from('drive_applications').select('id', { count: 'exact', head: true }).eq('drive_id', driveId),
    supabase.from('drive_applications').select('id', { count: 'exact', head: true }).eq('drive_id', driveId).eq('status', 'Shortlisted'),
    supabase.from('drive_applications').select('id', { count: 'exact', head: true }).eq('drive_id', driveId).eq('status', 'Selected'),
  ]);

  return {
    ...drive,
    eligibleBranches: (drive.drive_eligible_branches || []).map((b) => ({ branch_id: b.branches?.id, branches: b.branches })),
    eligibleDepartments: eligibleDepts || [],
    eligibleBatches: eligibleBatches || [],
    analytics: { appliedCount: applied.count || 0, shortlistedCount: shortlisted.count || 0, selectedCount: selected.count || 0 },
  };
};

const getDriveStatistics = async (driveId) => {
  const eligibleStudents = await getEligibleStudents(driveId);
  const totalEligible = eligibleStudents.length;
  const count = async (status) => {
    let q = supabase.from('drive_applications').select('id', { count: 'exact', head: true }).eq('drive_id', driveId);
    if (status) q = q.eq('status', status);
    const { count: total } = await q;
    return total || 0;
  };
  const [applied, shortlisted, selected] = await Promise.all([count(), count('Shortlisted'), count('Selected')]);

  return {
    totalEligibleStudents: totalEligible,
    totalApplications: applied,
    totalShortlisted: shortlisted,
    totalSelected: selected,
    placementPercentage: totalEligible > 0 ? parseFloat(((selected / totalEligible) * 100).toFixed(2)) : 0,
  };
};

/** Summary tiles for the staff drives page (same role scope as the list). */
const getSummary = async (user) => {
  const scopeContext = await dataScopeService.resolveScopeContext(user);
  const count = async (extra) => {
    let q = supabase.from('placement_drives').select('id', { count: 'exact', head: true }).is('deleted_at', null);
    q = dataScopeService.applyDataScope(q, user, 'drives', scopeContext);
    const { count: total, error } = await extra(q);
    if (error) throw dbError(error);
    return total || 0;
  };
  const now = new Date().toISOString();
  const [pending, live, upcoming, closed, rejected] = await Promise.all([
    count((q) => q.eq('approval_status', 'Pending')),
    count((q) => q.eq('approval_status', 'Approved').eq('status', 'Ongoing')),
    count((q) => q.eq('approval_status', 'Approved').eq('status', 'Upcoming').gte('registration_deadline', now)),
    count((q) => q.eq('approval_status', 'Approved').in('status', ['Completed', 'Conducted'])),
    count((q) => q.eq('approval_status', 'Rejected')),
  ]);
  return { pending, live, upcoming, closed, rejected };
};

/** Choices for the drive form: branches, departments and (for staff) companies; a recruiter only gets their own company. */
const getLookups = async (user) => {
  const [{ data: branches }, { data: departments }] = await Promise.all([
    supabase.from('branches').select('id, name, code, department_id').order('name'),
    supabase.from('departments').select('id, name, code').order('name'),
  ]);

  let companies = [];
  if (isStaff(user)) {
    const { data } = await supabase.from('companies').select('id, name, logo_url').is('deleted_at', null).order('name');
    companies = data || [];
  } else if (isRecruiter(user)) {
    const companyId = await dataScopeService.getCompanyIdForRecruiter(user.id);
    if (companyId) {
      const { data } = await supabase.from('companies').select('id, name, logo_url').eq('id', companyId);
      companies = data || [];
    }
  }
  return { branches: branches || [], departments: departments || [], companies };
};

// ---------------------------------------------------------------- legacy eligibility binding endpoints

const bindEligibleBranches = async (driveId, branchIds) => {
  await getDriveById(driveId);
  await bindEligibility(driveId, { branch_ids: branchIds });
  const { data } = await supabase.from('drive_eligible_branches').select('*, branches(id, name, code)').eq('drive_id', driveId);
  return data;
};

const bindEligibleDepartments = async (driveId, departmentIds) => {
  await getDriveById(driveId);
  await bindEligibility(driveId, { department_ids: departmentIds });
  const { data } = await supabase.from('drive_eligible_departments').select('*, departments(id, name, code)').eq('drive_id', driveId);
  return data;
};

const bindEligibleBatches = async (driveId, batches) => {
  await getDriveById(driveId);
  await bindEligibility(driveId, { batches });
  const { data } = await supabase.from('drive_eligible_batches').select('*').eq('drive_id', driveId);
  return data;
};

module.exports = {
  listDrives,
  getDriveById,
  getDriveForUser,
  createDrive,
  updateDrive,
  deleteDrive,
  approveDrive,
  rejectDrive,
  attachJd,
  getJdUrl,
  getDriveProfile,
  getEligibleStudents,
  getMyEligibility,
  evaluateEligibility,
  getDriveStatistics,
  getSummary,
  getLookups,
  bindEligibleBranches,
  bindEligibleDepartments,
  bindEligibleBatches,
};
