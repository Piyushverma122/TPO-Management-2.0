const supabase = require('../config/supabase');
const dataScopeService = require('./dataScopeService');
const { Role, normalizeRole } = require('../config/rbac');

const httpError = (message, statusCode) => Object.assign(new Error(message), { statusCode });
const unwrap = ({ data, error }, label) => {
  if (error) throw httpError(`${label}: ${error.message}`, 500);
  return data || [];
};

const NO_MATCH_ID = '00000000-0000-0000-0000-000000000000';
const round1 = (n) => Math.round(n * 10) / 10;
const sum = (arr) => arr.reduce((a, b) => a + b, 0);
const avg = (arr) => (arr.length ? sum(arr) / arr.length : 0);
const median = (arr) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};
const countBy = (rows, keyOf) => rows.reduce((map, r) => ((map[keyOf(r)] = (map[keyOf(r)] || 0) + 1), map), {});
const toList = (map, valueKey = 'count') => Object.entries(map).map(([name, value]) => ({ name, [valueKey]: value }));

// ---------------------------------------------------------------- scope & filters

/**
 * Who is asking and what they may see.
 *   admin / tpo / faculty : the whole college
 *   recruiter             : only their own company's drives, offers and applicants (no student directory)
 * Filters (batch, department_id, branch_id, from, to) narrow the students and the date window.
 */
const resolveScope = async (user, filters = {}) => {
  const role = normalizeRole(user?.role);
  const scope = { role, companyId: null, studentIds: null, from: null, to: null, driveIds: null };

  if (role === Role.RECRUITER) {
    scope.companyId = await dataScopeService.getCompanyIdForRecruiter(user.id);
    if (!scope.companyId) throw httpError('Your account is not linked to a company.', 403);
  }

  // Faculty only ever report on their own department's students.
  let facultyStudentIds = null;
  if (role === Role.FACULTY) facultyStudentIds = await dataScopeService.getFacultyStudentIds(user.id);

  const { batch, department_id, branch_id, from, to } = filters;
  if (from && !Number.isNaN(Date.parse(from))) scope.from = new Date(from);
  if (to && !Number.isNaN(Date.parse(to))) scope.to = new Date(new Date(to).getTime() + 24 * 3600 * 1000 - 1); // whole last day

  if (batch || department_id || branch_id) {
    let branchIds = null;
    if (branch_id) branchIds = [branch_id];
    else if (department_id) {
      const branches = unwrap(await supabase.from('branches').select('id').eq('department_id', department_id), 'branches');
      branchIds = branches.map((b) => b.id);
    }
    let q = supabase.from('students').select('id').is('deleted_at', null);
    if (batch) q = q.eq('passing_year', batch);
    if (branchIds) q = q.in('branch_id', branchIds.length ? branchIds : [NO_MATCH_ID]);
    scope.studentIds = unwrap(await q, 'students').map((s) => s.id);
  }
  if (facultyStudentIds) {
    const allowed = new Set(facultyStudentIds);
    scope.studentIds = scope.studentIds ? scope.studentIds.filter((id) => allowed.has(id)) : facultyStudentIds;
  }

  if (scope.companyId) {
    scope.driveIds = unwrap(await supabase.from('placement_drives').select('id').eq('company_id', scope.companyId).is('deleted_at', null), 'drives').map((d) => d.id);
  }
  return scope;
};

const inWindow = (scope, iso) => {
  if (!scope.from && !scope.to) return true;
  const t = new Date(iso).getTime();
  return (!scope.from || t >= scope.from.getTime()) && (!scope.to || t <= scope.to.getTime());
};

const studentFilter = (q, scope, column = 'student_id') => (scope.studentIds ? q.in(column, scope.studentIds.length ? scope.studentIds : [NO_MATCH_ID]) : q);

// ---------------------------------------------------------------- the dashboard

const STAGES_SHORTLISTED = ['Shortlisted', 'Round 1', 'Round 2', 'Technical', 'HR', 'Offer', 'Selected'];
const STAGES_INTERVIEW = ['Round 1', 'Round 2', 'Technical', 'HR', 'Offer', 'Selected'];
const BUCKETS = [
  { name: 'Below 5 LPA', min: 0, max: 5 },
  { name: '5 - 10 LPA', min: 5, max: 10 },
  { name: '10 - 20 LPA', min: 10, max: 20 },
  { name: '20+ LPA', min: 20, max: Infinity },
];

/** One payload for the whole Reports page. Everything counted as "placed" is an Accepted offer. */
const getReportDashboard = async (user, filters = {}) => {
  const scope = await resolveScope(user, filters);
  const recruiter = scope.role === Role.RECRUITER;

  let studentsQ = supabase
    .from('students')
    .select('id, passing_year, placement_status, cgpa, branch_id, branches ( id, name, departments ( id, name ) ), users ( full_name )')
    .is('deleted_at', null);
  studentsQ = scope.studentIds ? studentsQ.in('id', scope.studentIds.length ? scope.studentIds : [NO_MATCH_ID]) : studentsQ;

  let placementsQ = supabase
    .from('placements')
    .select('id, student_id, company_id, drive_id, package, offer_status, joining_date, responded_at, created_at, role_title, companies ( id, name, tier ), placement_drives ( role_title )');
  placementsQ = studentFilter(placementsQ, scope);
  if (scope.companyId) placementsQ = placementsQ.eq('company_id', scope.companyId);

  let drivesQ = supabase.from('placement_drives').select('id, status, approval_status, registration_deadline, company_id, created_at, drive_date').is('deleted_at', null);
  if (scope.companyId) drivesQ = drivesQ.eq('company_id', scope.companyId);

  let appsQ = supabase.from('drive_applications').select('id, status, student_id, drive_id, applied_date');
  appsQ = studentFilter(appsQ, scope);
  if (scope.driveIds) appsQ = appsQ.in('drive_id', scope.driveIds.length ? scope.driveIds : [NO_MATCH_ID]);

  let interviewsQ = supabase.from('interviews').select('id, status, scheduled_at, student_id, company_id').is('deleted_at', null);
  interviewsQ = studentFilter(interviewsQ, scope);
  if (scope.companyId) interviewsQ = interviewsQ.eq('company_id', scope.companyId);

  let enrollQ = supabase.from('training_enrollments').select('id, completed, progress_percentage, student_id');
  enrollQ = studentFilter(enrollQ, scope);

  const [students, placements, drives, apps, interviews, enrollments] = await Promise.all([
    recruiter ? Promise.resolve([]) : studentsQ.then((r) => unwrap(r, 'students')),
    placementsQ.then((r) => unwrap(r, 'placements')),
    drivesQ.then((r) => unwrap(r, 'drives')),
    appsQ.then((r) => unwrap(r, 'applications')),
    interviewsQ.then((r) => unwrap(r, 'interviews')),
    recruiter ? Promise.resolve([]) : enrollQ.then((r) => unwrap(r, 'training')),
  ]);

  // The student behind each offer (filters may leave some out of the students list; load the missing few).
  const known = new Map(students.map((s) => [s.id, s]));
  const missing = [...new Set(placements.map((p) => p.student_id))].filter((id) => !known.has(id));
  if (missing.length) {
    const rows = unwrap(await supabase.from('students').select('id, passing_year, placement_status, cgpa, branch_id, branches ( id, name, departments ( id, name ) ), users ( full_name )').in('id', missing), 'students');
    rows.forEach((s) => known.set(s.id, s));
  }

  const dateOf = (p) => p.responded_at || p.created_at;
  const accepted = placements.filter((p) => p.offer_status === 'Accepted' && inWindow(scope, dateOf(p)));
  const packages = accepted.map((p) => Number(p.package) || 0).filter((n) => n > 0);
  const placedStudents = new Set(accepted.map((p) => p.student_id));
  const now = Date.now();

  // ---- trend: placements per month (the window, or the last 12 months)
  const end = scope.to || new Date();
  const start = scope.from || new Date(end.getFullYear(), end.getMonth() - 11, 1);
  const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const months = [];
  for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= end && months.length < 36; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    months.push({ key: monthKey(d), month: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }), placed: 0 });
  }
  accepted.forEach((p) => {
    const m = months.find((x) => x.key === monthKey(new Date(dateOf(p))));
    if (m) m.placed += 1;
  });
  let running = 0;
  const trend = months.map((m) => ({ month: m.month, placed: m.placed, cumulative: (running += m.placed) }));

  const studentOf = (p) => known.get(p.student_id);
  const byDepartment = toList(countBy(accepted, (p) => studentOf(p)?.branches?.departments?.name || 'Unassigned'));
  const byBranch = toList(countBy(accepted, (p) => studentOf(p)?.branches?.name || 'Unassigned'));
  const byBatch = toList(countBy(accepted, (p) => studentOf(p)?.passing_year || 'Unknown')).sort((a, b) => String(a.name).localeCompare(String(b.name)));

  const companyGroups = accepted.reduce((map, p) => {
    const key = p.companies?.name || 'Unknown';
    (map[key] ||= { name: key, tier: p.companies?.tier || null, packages: [], count: 0 });
    map[key].count += 1;
    map[key].packages.push(Number(p.package) || 0);
    return map;
  }, {});
  const topRecruiters = Object.values(companyGroups)
    .map((c) => ({ name: c.name, tier: c.tier, placed: c.count, averagePackage: round1(avg(c.packages)), highestPackage: Math.max(...c.packages) }))
    .sort((a, b) => b.placed - a.placed || b.highestPackage - a.highestPackage)
    .slice(0, 8);

  const packageDistribution = BUCKETS.map((b) => ({ name: b.name, count: packages.filter((n) => n >= b.min && n < b.max).length }));

  // ---- recruitment funnel: how many applications reached each stage (by current status)
  const funnel = [
    { stage: 'Applied', count: apps.length },
    { stage: 'Shortlisted', count: apps.filter((a) => STAGES_SHORTLISTED.includes(a.status)).length },
    { stage: 'Interview rounds', count: apps.filter((a) => STAGES_INTERVIEW.includes(a.status)).length },
    { stage: 'Offered', count: apps.filter((a) => ['Offer', 'Selected'].includes(a.status)).length },
    { stage: 'Placed (accepted)', count: accepted.length },
  ];

  const drivesLive = drives.filter((d) => d.approval_status === 'Approved');
  const trainingDone = enrollments.filter((e) => e.completed).length;

  const latest = accepted
    .sort((a, b) => new Date(dateOf(b)).getTime() - new Date(dateOf(a)).getTime())
    .slice(0, 8)
    .map((p) => ({
      id: p.id,
      student: studentOf(p)?.users?.full_name || '-',
      branch: studentOf(p)?.branches?.name || '-',
      company: p.companies?.name || '-',
      role: p.role_title || p.placement_drives?.role_title || '',
      package: Number(p.package) || 0,
      date: dateOf(p),
    }));

  return {
    filters: { batch: filters.batch || null, department_id: filters.department_id || null, branch_id: filters.branch_id || null, from: filters.from || null, to: filters.to || null },
    scope: recruiter ? 'company' : 'college',
    generatedAt: new Date().toISOString(),
    kpis: {
      totalStudents: recruiter ? null : students.length,
      placedStudents: placedStudents.size,
      placementRate: recruiter || !students.length ? null : round1((placedStudents.size / students.length) * 100),
      highestPackage: packages.length ? Math.max(...packages) : 0,
      averagePackage: round1(avg(packages)),
      medianPackage: round1(median(packages)),
      companiesHiring: new Set(accepted.map((p) => p.company_id)).size,
      totalDrives: drives.length,
      openDrives: drivesLive.filter((d) => ['Upcoming', 'Ongoing'].includes(d.status) && (!d.registration_deadline || new Date(d.registration_deadline).getTime() >= now)).length,
      pendingDriveApprovals: drives.filter((d) => d.approval_status === 'Pending').length,
      offersAwaitingReply: placements.filter((p) => p.offer_status === 'Released').length,
      offersAwaitingApproval: placements.filter((p) => p.offer_status === 'Pending Approval').length,
      totalApplications: apps.length,
      upcomingInterviews: interviews.filter((i) => i.status === 'Scheduled' && new Date(i.scheduled_at).getTime() > now).length,
    },
    trend,
    byDepartment,
    byBranch,
    byBatch,
    topRecruiters,
    packageDistribution,
    funnel,
    interviewOutcomes: toList(countBy(interviews, (i) => i.status)),
    drivesByStatus: toList(countBy(drivesLive, (d) => d.status)),
    training: recruiter ? null : { enrolled: enrollments.length, completed: trainingDone, completionRate: enrollments.length ? Math.round((trainingDone / enrollments.length) * 100) : 0, averageProgress: Math.round(avg(enrollments.map((e) => Number(e.progress_percentage) || 0))) },
    latestPlacements: latest,
  };
};

// ---------------------------------------------------------------- row reports (tables and exports)

const requireStaffFor = (scope, what) => {
  if (scope.role === Role.RECRUITER) throw httpError(`Recruiters cannot export the ${what} report.`, 403);
};

const getStudentReport = async (user, filters = {}) => {
  const scope = await resolveScope(user, filters);
  requireStaffFor(scope, 'student');
  const { status, cgpa_min, cgpa_max } = filters;

  let q = supabase
    .from('students')
    .select('id, roll_number, enrollment_number, current_semester, passing_year, cgpa, active_backlogs, placement_status, users!inner ( full_name, email, phone, last_login ), branches ( name, code, departments ( name ) )')
    .is('deleted_at', null);
  if (scope.studentIds) q = q.in('id', scope.studentIds.length ? scope.studentIds : [NO_MATCH_ID]);
  if (status) q = q.eq('placement_status', status);
  if (cgpa_min) q = q.gte('cgpa', parseFloat(cgpa_min));
  if (cgpa_max) q = q.lte('cgpa', parseFloat(cgpa_max));

  return unwrap(await q, 'students').map((s) => ({
    'Roll Number': s.roll_number,
    'Student Name': s.users?.full_name || '',
    Email: s.users?.email || '',
    Phone: s.users?.phone || '',
    Department: s.branches?.departments?.name || '',
    Branch: s.branches?.name || '',
    'Passing Year': s.passing_year,
    Semester: s.current_semester || '',
    CGPA: s.cgpa,
    'Active Backlogs': s.active_backlogs || 0,
    'Placement Status': s.placement_status,
    'Onboarded (logged in)': s.users?.last_login ? 'Yes' : 'No',
  }));
};

const getPlacementReport = async (user, filters = {}) => {
  const scope = await resolveScope(user, filters);
  let q = supabase
    .from('placements')
    .select('package, joining_date, offer_status, responded_at, created_at, students ( roll_number, passing_year, users ( full_name, email ), branches ( name, departments ( name ) ) ), companies ( name, tier ), placement_drives ( drive_code, role_title )')
    .eq('offer_status', 'Accepted');
  q = studentFilter(q, scope);
  if (scope.companyId) q = q.eq('company_id', scope.companyId);

  return unwrap(await q, 'placements')
    .filter((p) => inWindow(scope, p.responded_at || p.created_at))
    .map((p) => ({
      'Student Name': p.students?.users?.full_name || '',
      'Roll Number': p.students?.roll_number || '',
      Department: p.students?.branches?.departments?.name || '',
      Branch: p.students?.branches?.name || '',
      'Passing Year': p.students?.passing_year || '',
      Company: p.companies?.name || '',
      Tier: p.companies?.tier || '',
      Role: p.placement_drives?.role_title || '',
      'Drive Code': p.placement_drives?.drive_code || '',
      'Package (LPA)': p.package,
      'Joining Date': p.joining_date || '',
      'Accepted On': (p.responded_at || p.created_at || '').slice(0, 10),
    }));
};

const getCompanyReport = async (user, filters = {}) => {
  const scope = await resolveScope(user, filters);
  let q = supabase.from('companies').select('id, name, industry, tier, status, website, headquarters').is('deleted_at', null);
  if (scope.companyId) q = q.eq('id', scope.companyId);
  const companies = unwrap(await q, 'companies');
  if (filters.tier) companies.splice(0, companies.length, ...companies.filter((c) => c.tier === filters.tier));

  // Hiring numbers come from real offers, not from stored counters that can go stale.
  const offers = unwrap(await supabase.from('placements').select('company_id, package').eq('offer_status', 'Accepted'), 'placements');
  const drives = unwrap(await supabase.from('placement_drives').select('company_id').is('deleted_at', null), 'drives');
  return companies.map((c) => {
    const mine = offers.filter((o) => o.company_id === c.id).map((o) => Number(o.package) || 0);
    return {
      Company: c.name,
      Industry: c.industry || '',
      Tier: c.tier || '',
      Status: c.status || '',
      Headquarters: c.headquarters || '',
      Drives: drives.filter((d) => d.company_id === c.id).length,
      Hired: mine.length,
      'Average Package (LPA)': round1(avg(mine)),
      'Highest Package (LPA)': mine.length ? Math.max(...mine) : 0,
    };
  });
};

const getDriveReport = async (user, filters = {}) => {
  const scope = await resolveScope(user, filters);
  let q = supabase
    .from('placement_drives')
    .select('id, drive_code, role_title, job_type, status, approval_status, drive_date, registration_deadline, passing_year, min_cgpa, company_id, companies ( name ), drive_profiles ( id )')
    .is('deleted_at', null);
  if (scope.companyId) q = q.eq('company_id', scope.companyId);
  if (filters.batch) q = q.eq('passing_year', filters.batch);
  const drives = unwrap(await q, 'drives').filter((d) => inWindow(scope, d.drive_date || d.registration_deadline || new Date().toISOString()));

  const ids = drives.map((d) => d.id);
  const apps = ids.length ? unwrap(await supabase.from('drive_applications').select('drive_id, status').in('drive_id', ids), 'applications') : [];
  return drives.map((d) => {
    const mine = apps.filter((a) => a.drive_id === d.id);
    return {
      'Drive Code': d.drive_code,
      Company: d.companies?.name || '',
      Role: d.role_title,
      Profiles: d.drive_profiles?.length || 0,
      Type: d.job_type,
      Approval: d.approval_status,
      Status: d.status,
      'Drive Date': d.drive_date ? String(d.drive_date).slice(0, 10) : '',
      Deadline: d.registration_deadline ? String(d.registration_deadline).slice(0, 10) : '',
      Batch: d.passing_year || '',
      'Min CGPA': d.min_cgpa,
      Applied: mine.length,
      Shortlisted: mine.filter((a) => STAGES_SHORTLISTED.includes(a.status)).length,
      Selected: mine.filter((a) => ['Selected', 'Offer'].includes(a.status)).length,
    };
  });
};

const getTrainingReport = async (user, filters = {}) => {
  const scope = await resolveScope(user, filters);
  requireStaffFor(scope, 'training');
  let q = supabase.from('training_enrollments').select('progress_percentage, completed, enrolled_at, training_modules ( title, category, level ), students ( roll_number, users ( full_name ), branches ( name, departments ( name ) ) ), student_id');
  q = studentFilter(q, scope);
  return unwrap(await q, 'training').map((e) => ({
    'Student Name': e.students?.users?.full_name || '',
    'Roll Number': e.students?.roll_number || '',
    Department: e.students?.branches?.departments?.name || '',
    Branch: e.students?.branches?.name || '',
    Course: e.training_modules?.title || '',
    Category: e.training_modules?.category || '',
    Level: e.training_modules?.level || '',
    'Progress %': e.progress_percentage || 0,
    Completed: e.completed ? 'Yes' : 'No',
    'Enrolled On': e.enrolled_at ? String(e.enrolled_at).slice(0, 10) : '',
  }));
};

const DATASETS = {
  placements: getPlacementReport,
  students: getStudentReport,
  companies: getCompanyReport,
  drives: getDriveReport,
  trainings: getTrainingReport,
};

const getDataset = async (type, user, filters) => {
  const fn = DATASETS[type];
  if (!fn) throw httpError(`Unknown report type "${type}". Use: ${Object.keys(DATASETS).join(', ')}.`, 400);
  return fn(user, filters);
};

module.exports = {
  getReportDashboard,
  getDataset,
};
