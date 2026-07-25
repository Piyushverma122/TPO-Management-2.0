const supabase = require('../config/supabase');

/**
 * Generate Student Academic & Placement Report
 */
const getStudentReport = async (filters = {}) => {
  const { branch_id, batch, status, cgpa_min, cgpa_max } = filters;

  let query = supabase
    .from('students')
    .select(
      `
      roll_number,
      current_semester,
      passing_year,
      cgpa,
      active_backlogs,
      placement_status,
      created_at,
      users!inner (
        full_name,
        email,
        phone
      ),
      branches (
        name,
        code
      )
    `
    )
    .is('deleted_at', null);

  if (branch_id) query = query.eq('branch_id', branch_id);
  if (batch) query = query.eq('passing_year', batch);
  if (status) query = query.eq('placement_status', status);
  if (cgpa_min) query = query.gte('cgpa', parseFloat(cgpa_min));
  if (cgpa_max) query = query.lte('cgpa', parseFloat(cgpa_max));

  const { data, error } = await query;

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return (data || []).map((s) => ({
    'Roll Number': s.roll_number,
    'Student Name': s.users?.full_name || '',
    'Email': s.users?.email || '',
    'Phone': s.users?.phone || '',
    'Department': s.users?.department || '',
    'Branch': s.branches?.name || '',
    'Passing Year': s.passing_year,
    'CGPA': s.cgpa,
    'Backlogs': s.active_backlogs || 0,
    'Placement Status': s.placement_status,
  }));
};

/**
 * Generate Company Hiring Summary Report
 */
const getCompanyReport = async (filters = {}) => {
  const { tier, status } = filters;

  let query = supabase
    .from('companies')
    .select('*')
    .is('deleted_at', null);

  if (tier) query = query.eq('tier', tier);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return (data || []).map((c) => ({
    'Company Name': c.name,
    'Industry': c.industry,
    'Tier': c.tier,
    'Status': c.status,
    'Visited Year': c.visited_year,
    'Hired Count': c.hired_count || 0,
    'Avg Package (LPA)': c.avg_package || 0,
    'Highest Package (LPA)': c.highest_package || 0,
    'Min CGPA': c.min_cgpa,
    'Website': c.website || '',
  }));
};

/**
 * Generate Placement Analytics Report
 */
const getPlacementReport = async (filters = {}) => {
  let query = supabase
    .from('placements')
    .select(
      `
      package,
      joining_date,
      offer_status,
      created_at,
      students (
        roll_number,
        passing_year,
        users (full_name, email, department),
        branches (name)
      ),
      companies (
        name,
        tier
      ),
      placement_drives (
        drive_code,
        role_title
      )
    `
    );

  const { data, error } = await query;

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return (data || []).map((p) => ({
    'Student Name': p.students?.users?.full_name || '',
    'Roll Number': p.students?.roll_number || '',
    'Company Name': p.companies?.name || '',
    'Role': p.placement_drives?.role_title || '',
    'Drive Code': p.placement_drives?.drive_code || '',
    'Package (CTC LPA)': p.package,
    'Joining Date': p.joining_date || '',
    'Offer Status': p.offer_status || 'Accepted',
    'Branch': p.students?.branches?.name || '',
    'Department': p.students?.users?.department || '',
    'Passing Year': p.students?.passing_year || '',
  }));
};

/**
 * Generate Training Enrollment & Completion Report
 */
const getTrainingReport = async (filters = {}) => {
  let query = supabase
    .from('training_enrollments')
    .select(
      `
      progress_percentage,
      completed,
      enrolled_at,
      training_modules (
        title,
        category,
        level,
        status
      ),
      students (
        roll_number,
        users (full_name, email, department),
        branches (name)
      )
    `
    );

  const { data, error } = await query;

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return (data || []).map((t) => ({
    'Student Name': t.students?.users?.full_name || '',
    'Roll Number': t.students?.roll_number || '',
    'Course Title': t.training_modules?.title || '',
    'Category': t.training_modules?.category || '',
    'Level': t.training_modules?.level || '',
    'Progress %': t.progress_percentage || 0,
    'Completion Status': t.completed ? 'Completed' : 'In Progress',
    'Enrolled Date': t.enrolled_at ? new Date(t.enrolled_at).toISOString().split('T')[0] : '',
  }));
};

/**
 * Generate Drive Pipeline & Selection Report
 */
const getDriveReport = async (filters = {}) => {
  let query = supabase
    .from('placement_drives')
    .select(
      `
      drive_code,
      role_title,
      job_type,
      ctc,
      min_cgpa,
      passing_year,
      drive_date,
      registration_deadline,
      status,
      applied_count,
      shortlisted_count,
      selected_count,
      companies (name, tier)
    `
    )
    .is('deleted_at', null);

  const { data, error } = await query;

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return (data || []).map((d) => ({
    'Drive Code': d.drive_code,
    'Company': d.companies?.name || '',
    'Role': d.role_title,
    'Job Type': d.job_type,
    'CTC (LPA)': d.ctc,
    'Min CGPA': d.min_cgpa,
    'Batch Year': d.passing_year,
    'Drive Date': d.drive_date,
    'Status': d.status,
    'Applied Count': d.applied_count || 0,
    'Shortlisted Count': d.shortlisted_count || 0,
    'Selected Count': d.selected_count || 0,
  }));
};

module.exports = {
  getStudentReport,
  getCompanyReport,
  getPlacementReport,
  getTrainingReport,
  getDriveReport,
};
