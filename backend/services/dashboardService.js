const supabase = require('../config/supabase');

/**
 * Admin Dashboard Overview Metrics
 */
const getAdminDashboard = async () => {
  const [
    { count: totalStudents },
    { count: totalCompanies },
    { count: totalDrives },
    { count: totalPlacements },
    { count: totalRecruiters },
    { count: totalTrainings },
    { count: activeUsers },
    { data: upcomingDrives },
    { data: recentActivities },
  ] = await Promise.all([
    supabase.from('students').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('companies').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('placement_drives').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('placements').select('id', { count: 'exact', head: true }),
    supabase.from('recruiters').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('training_modules').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_active', true).is('deleted_at', null),
    supabase
      .from('placement_drives')
      .select('id, drive_code, role_title, drive_date, registration_deadline, ctc, companies(name, logo_url)')
      .eq('status', 'Upcoming')
      .is('deleted_at', null)
      .order('drive_date', { ascending: true })
      .limit(5),
    supabase
      .from('audit_logs')
      .select('id, action, category, created_at, user_id, users(full_name, role)')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  return {
    totalStudents: totalStudents || 0,
    totalCompanies: totalCompanies || 0,
    totalDrives: totalDrives || 0,
    totalPlacements: totalPlacements || 0,
    totalRecruiters: totalRecruiters || 0,
    totalTrainings: totalTrainings || 0,
    activeUsers: activeUsers || 0,
    upcomingDrives: upcomingDrives || [],
    recentActivities: recentActivities || [],
  };
};

/**
 * TPO Dashboard Metrics
 */
const getTPODashboard = async () => {
  const [
    { count: activeDrives },
    { count: pendingApplications },
    { data: upcomingInterviews },
    { data: placements },
    { count: totalCompanies },
    { count: activeTrainings },
  ] = await Promise.all([
    supabase.from('placement_drives').select('id', { count: 'exact', head: true }).in('status', ['Ongoing', 'Upcoming']).is('deleted_at', null),
    supabase.from('drive_applications').select('id', { count: 'exact', head: true }).eq('status', 'Applied'),
    supabase
      .from('application_status_history')
      .select('id, stage, round_name, remarks, created_at, drive_applications(id, placement_drives(role_title, companies(name)), students(users(full_name)))')
      .ilike('stage', '%round%')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('placements').select('package'),
    supabase.from('companies').select('id', { count: 'exact', head: true }).eq('status', 'Active').is('deleted_at', null),
    supabase.from('training_modules').select('id', { count: 'exact', head: true }).eq('status', 'Active').is('deleted_at', null),
  ]);

  const packages = (placements || []).map((p) => parseFloat(p.package) || 0);
  const totalPlacements = packages.length;
  const highestPackage = packages.length ? Math.max(...packages) : 0;
  const averagePackage = packages.length ? parseFloat((packages.reduce((a, b) => a + b, 0) / totalPlacements).toFixed(2)) : 0;

  return {
    activeDrives: activeDrives || 0,
    pendingApplications: pendingApplications || 0,
    upcomingInterviews: upcomingInterviews || [],
    placementStatistics: {
      totalPlacements,
      highestPackage,
      averagePackage,
    },
    companyStatistics: {
      activeCompanies: totalCompanies || 0,
    },
    trainingStatistics: {
      activeTrainings: activeTrainings || 0,
    },
  };
};

/**
 * Student Dashboard Metrics
 */
const getStudentDashboard = async (userId) => {
  const { data: student } = await supabase
    .from('students')
    .select('id, placement_status, active_resume_id')
    .eq('user_id', userId)
    .maybeSingle();

  const studentId = student ? student.id : null;

  const [
    { data: appliedDrives },
    { data: activeResume },
    { data: notifications },
    { data: enrollments },
  ] = await Promise.all([
    studentId
      ? supabase
          .from('drive_applications')
          .select('id, status, current_round, applied_date, placement_drives(id, role_title, ctc, drive_date, companies(name, logo_url))')
          .eq('student_id', studentId)
          .order('applied_date', { ascending: false })
      : Promise.resolve({ data: [] }),
    studentId && student.active_resume_id
      ? supabase.from('resumes').select('id, version_title, file_url, is_verified').eq('id', student.active_resume_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
    studentId
      ? supabase.from('training_enrollments').select('*, training_modules(title)').eq('student_id', studentId)
      : Promise.resolve({ data: [] }),
  ]);

  return {
    placementStatus: student ? student.placement_status : 'Unplaced',
    appliedDrives: appliedDrives || [],
    activeResume: activeResume || null,
    notifications: notifications || [],
    trainingEnrollments: enrollments || [],
  };
};

/**
 * Recruiter Dashboard Metrics
 */
const getRecruiterDashboard = async (userId) => {
  const { data: recruiter } = await supabase
    .from('recruiters')
    .select('company_id, companies(name, logo_url)')
    .eq('user_id', userId)
    .maybeSingle();

  if (!recruiter) {
    return {
      companyName: 'Not Assigned',
      activeDrives: 0,
      applicationsReceived: 0,
      shortlistedCandidates: 0,
      selectedCandidates: 0,
    };
  }

  const companyId = recruiter.company_id;

  const [
    { count: activeDrives },
    { data: companyDrives },
  ] = await Promise.all([
    supabase.from('placement_drives').select('id', { count: 'exact', head: true }).eq('company_id', companyId).in('status', ['Ongoing', 'Upcoming']).is('deleted_at', null),
    supabase.from('placement_drives').select('id').eq('company_id', companyId),
  ]);

  const driveIds = (companyDrives || []).map((d) => d.id);

  let applicationsReceived = 0;
  let shortlistedCandidates = 0;
  let selectedCandidates = 0;

  if (driveIds.length > 0) {
    const { data: apps } = await supabase
      .from('drive_applications')
      .select('status')
      .in('drive_id', driveIds);

    if (apps) {
      applicationsReceived = apps.length;
      apps.forEach((a) => {
        if (a.status === 'Shortlisted') shortlistedCandidates++;
        else if (['Selected', 'Offer'].includes(a.status)) selectedCandidates++;
      });
    }
  }

  return {
    companyName: recruiter.companies?.name || '',
    activeDrives: activeDrives || 0,
    applicationsReceived,
    shortlistedCandidates,
    selectedCandidates,
  };
};

/**
 * Faculty Dashboard Metrics
 */
const getFacultyDashboard = async (userId) => {
  const [
    { count: activeTrainings },
    { data: sessions },
    { count: totalPlacements },
  ] = await Promise.all([
    supabase.from('training_modules').select('id', { count: 'exact', head: true }).eq('status', 'Active').is('deleted_at', null),
    supabase.from('training_sessions').select('id, title, session_date, meeting_link, training_modules(title)').order('session_date', { ascending: true }).limit(5),
    supabase.from('placements').select('id', { count: 'exact', head: true }),
  ]);

  return {
    activeTrainings: activeTrainings || 0,
    upcomingSessions: sessions || [],
    totalPlacements: totalPlacements || 0,
  };
};

/**
 * Detailed System Analytics
 */
const getAnalytics = async () => {
  const [
    { data: placements },
    { data: companies },
    { data: students },
  ] = await Promise.all([
    supabase.from('placements').select('package, created_at, companies(name, tier), students(passing_year, branches(name))'),
    supabase.from('companies').select('name, hired_count, avg_package, highest_package').is('deleted_at', null),
    supabase.from('students').select('created_at, passing_year, placement_status, branches(name)').is('deleted_at', null),
  ]);

  // Monthly Placements Trend
  const monthlyMap = {};
  (placements || []).forEach((p) => {
    const month = new Date(p.created_at).toISOString().slice(0, 7); // YYYY-MM
    monthlyMap[month] = (monthlyMap[month] || 0) + 1;
  });

  const monthlyPlacements = Object.entries(monthlyMap).map(([month, count]) => ({ month, count }));

  // Branch-wise Placements
  const branchMap = {};
  (placements || []).forEach((p) => {
    const bName = p.students?.branches?.name || 'General';
    branchMap[bName] = (branchMap[bName] || 0) + 1;
  });

  const branchPlacements = Object.entries(branchMap).map(([branch, count]) => ({ branch, count }));

  return {
    monthlyPlacements,
    companyHiring: (companies || []).map((c) => ({ name: c.name, hiredCount: c.hired_count || 0, avgPackage: c.avg_package || 0 })),
    branchPlacements,
  };
};

/**
 * Formatted JSON datasets for Bar, Pie, Line, and Area charts
 */
const getChartsData = async () => {
  const analytics = await getAnalytics();

  return {
    barChart: {
      title: 'Company-wise Hiring Breakdown',
      xAxisKey: 'name',
      yAxisKey: 'hiredCount',
      data: analytics.companyHiring.slice(0, 10),
    },
    pieChart: {
      title: 'Branch-wise Placement Share',
      nameKey: 'branch',
      dataKey: 'count',
      data: analytics.branchPlacements,
    },
    lineChart: {
      title: 'Monthly Placements Growth Trend',
      xAxisKey: 'month',
      yAxisKey: 'count',
      data: analytics.monthlyPlacements,
    },
    areaChart: {
      title: 'Cumulative Placement Analytics',
      xAxisKey: 'month',
      yAxisKey: 'count',
      data: analytics.monthlyPlacements,
    },
  };
};

module.exports = {
  getAdminDashboard,
  getTPODashboard,
  getStudentDashboard,
  getRecruiterDashboard,
  getFacultyDashboard,
  getAnalytics,
  getChartsData,
};
