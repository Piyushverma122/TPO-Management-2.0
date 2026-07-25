const supabase = require('../config/supabase');

/**
 * List placement drives with search, multi-filters and pagination
 */
const listDrives = async (queryParams) => {
  const page = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || 10;
  const offset = (page - 1) * limit;

  const {
    search,
    company_id,
    status,
    job_type,
    batch,
    min_ctc,
    max_ctc,
  } = queryParams;

  let query = supabase
    .from('placement_drives')
    .select(
      `
      *,
      companies (
        id,
        name,
        logo_url,
        industry,
        tier
      )
    `,
      { count: 'exact' }
    )
    .is('deleted_at', null);

  if (company_id) query = query.eq('company_id', company_id);
  if (status) query = query.eq('status', status);
  if (job_type) query = query.eq('job_type', job_type);
  if (batch || queryParams.passing_year) query = query.eq('passing_year', batch || queryParams.passing_year);
  if (min_ctc) query = query.gte('ctc', parseFloat(min_ctc));
  if (max_ctc) query = query.lte('ctc', parseFloat(max_ctc));

  if (search) {
    query = query.or(`role_title.ilike.%${search}%,drive_code.ilike.%${search}%,location.ilike.%${search}%`);
  }

  query = query.order('drive_date', { ascending: true }).range(offset, offset + limit - 1);

  const { data: drives, count, error } = await query;

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return {
    drives: drives || [],
    page,
    limit,
    total: count || 0,
  };
};

/**
 * Get Placement Drive details by ID
 */
const getDriveById = async (driveId) => {
  const { data: drive, error } = await supabase
    .from('placement_drives')
    .select(
      `
      *,
      companies (
        id,
        name,
        logo_url,
        industry,
        website,
        tier
      )
    `
    )
    .eq('id', driveId)
    .is('deleted_at', null)
    .single();

  if (error || !drive) {
    const err = new Error('Placement drive record not found.');
    err.statusCode = 404;
    throw err;
  }

  return drive;
};

/**
 * Create a new Placement Drive
 */
const createDrive = async (payload, userId) => {
  const {
    company_id,
    role_title,
    job_type = 'Full Time',
    location = 'On Campus',
    ctc = 0.0,
    stipend = 0.0,
    min_cgpa = 6.0,
    max_backlogs = 0,
    passing_year,
    total_openings = 10,
    registration_deadline,
    drive_date,
    rounds = ['Aptitude', 'Technical', 'HR'],
    description,
    status = 'Upcoming',
    branch_ids = [],
    department_ids = [],
    batches = [],
  } = payload;

  const driveCode = `DRV-${Date.now().toString().slice(-6)}`;

  // 1. Insert Placement Drive
  const { data: drive, error: driveErr } = await supabase
    .from('placement_drives')
    .insert([
      {
        drive_code: driveCode,
        company_id,
        role_title,
        job_type,
        location,
        ctc,
        stipend,
        min_cgpa,
        max_backlogs,
        passing_year,
        total_openings,
        registration_deadline,
        drive_date,
        rounds,
        description: description || null,
        status,
        created_by: userId || null,
      },
    ])
    .select('*')
    .single();

  if (driveErr) {
    const err = new Error(driveErr.message);
    err.statusCode = 500;
    throw err;
  }

  // 2. Bind Eligible Branches
  if (Array.isArray(branch_ids) && branch_ids.length > 0) {
    const branchInserts = branch_ids.map((branch_id) => ({
      drive_id: drive.id,
      branch_id,
    }));
    await supabase.from('drive_eligible_branches').insert(branchInserts);
  }

  // 3. Bind Eligible Departments
  if (Array.isArray(department_ids) && department_ids.length > 0) {
    const deptInserts = department_ids.map((department_id) => ({
      drive_id: drive.id,
      department_id,
    }));
    await supabase.from('drive_eligible_departments').insert(deptInserts);
  }

  // 4. Bind Eligible Batches
  if (Array.isArray(batches) && batches.length > 0) {
    const batchInserts = batches.map((pYear) => ({
      drive_id: drive.id,
      passing_year: pYear,
    }));
    await supabase.from('drive_eligible_batches').insert(batchInserts);
  }

  return drive;
};

/**
 * Update Placement Drive details
 */
const updateDrive = async (driveId, payload) => {
  await getDriveById(driveId);

  const updateFields = {};
  if (payload.role_title !== undefined) updateFields.role_title = payload.role_title;
  if (payload.job_type !== undefined) updateFields.job_type = payload.job_type;
  if (payload.location !== undefined) updateFields.location = payload.location;
  if (payload.ctc !== undefined) updateFields.ctc = payload.ctc;
  if (payload.stipend !== undefined) updateFields.stipend = payload.stipend;
  if (payload.min_cgpa !== undefined) updateFields.min_cgpa = payload.min_cgpa;
  if (payload.max_backlogs !== undefined) updateFields.max_backlogs = payload.max_backlogs;
  if (payload.passing_year !== undefined) updateFields.passing_year = payload.passing_year;
  if (payload.total_openings !== undefined) updateFields.total_openings = payload.total_openings;
  if (payload.registration_deadline !== undefined) updateFields.registration_deadline = payload.registration_deadline;
  if (payload.drive_date !== undefined) updateFields.drive_date = payload.drive_date;
  if (payload.rounds !== undefined) updateFields.rounds = payload.rounds;
  if (payload.description !== undefined) updateFields.description = payload.description;
  if (payload.status !== undefined) updateFields.status = payload.status;

  const { data: updatedDrive, error } = await supabase
    .from('placement_drives')
    .update(updateFields)
    .eq('id', driveId)
    .select('*')
    .single();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return updatedDrive;
};

/**
 * Soft Delete Placement Drive
 */
const deleteDrive = async (driveId) => {
  await getDriveById(driveId);

  const { error } = await supabase
    .from('placement_drives')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', driveId);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return true;
};

/**
 * Get Aggregated Drive Profile
 */
const getDriveProfile = async (driveId) => {
  const drive = await getDriveById(driveId);

  // Fetch Eligible Branches
  const { data: eligibleBranches } = await supabase
    .from('drive_eligible_branches')
    .select('id, branch_id, branches(id, name, code)')
    .eq('drive_id', driveId);

  // Fetch Eligible Departments
  const { data: eligibleDepts } = await supabase
    .from('drive_eligible_departments')
    .select('id, department_id, departments(id, name, code)')
    .eq('drive_id', driveId);

  // Fetch Eligible Batches
  const { data: eligibleBatches } = await supabase
    .from('drive_eligible_batches')
    .select('*')
    .eq('drive_id', driveId);

  // Fetch Applications Count Summary
  const { count: appliedCount } = await supabase
    .from('drive_applications')
    .select('id', { count: 'exact', head: true })
    .eq('drive_id', driveId);

  const { count: shortlistedCount } = await supabase
    .from('drive_applications')
    .select('id', { count: 'exact', head: true })
    .eq('drive_id', driveId)
    .eq('status', 'Shortlisted');

  const { count: selectedCount } = await supabase
    .from('drive_applications')
    .select('id', { count: 'exact', head: true })
    .eq('drive_id', driveId)
    .eq('status', 'Selected');

  return {
    ...drive,
    eligibleBranches: eligibleBranches || [],
    eligibleDepartments: eligibleDepts || [],
    eligibleBatches: eligibleBatches || [],
    analytics: {
      appliedCount: appliedCount || 0,
      shortlistedCount: shortlistedCount || 0,
      selectedCount: selectedCount || 0,
    },
  };
};

/**
 * Calculate & return Eligible Students for Drive
 */
const getEligibleStudents = async (driveId) => {
  const drive = await getDriveById(driveId);

  // 1. Fetch eligible branch IDs for this drive
  const { data: eligibleBranches } = await supabase
    .from('drive_eligible_branches')
    .select('branch_id')
    .eq('drive_id', driveId);

  const allowedBranchIds = (eligibleBranches || []).map((b) => b.branch_id);

  // 2. Query students matching criteria
  let studentQuery = supabase
    .from('students')
    .select(
      `
      id,
      roll_number,
      cgpa,
      active_backlogs,
      passing_year,
      placement_status,
      users!inner (
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
    `
    )
    .is('deleted_at', null)
    .gte('cgpa', drive.min_cgpa || 0)
    .lte('active_backlogs', drive.max_backlogs || 0)
    .eq('passing_year', drive.passing_year);

  if (allowedBranchIds.length > 0) {
    studentQuery = studentQuery.in('branch_id', allowedBranchIds);
  }

  const { data: eligibleStudents, error } = await studentQuery;

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return eligibleStudents || [];
};

/**
 * Get Detailed Drive Placement Statistics
 */
const getDriveStatistics = async (driveId) => {
  const eligibleStudents = await getEligibleStudents(driveId);
  const totalEligible = eligibleStudents.length;

  const { count: appliedCount } = await supabase
    .from('drive_applications')
    .select('id', { count: 'exact', head: true })
    .eq('drive_id', driveId);

  const { count: shortlistedCount } = await supabase
    .from('drive_applications')
    .select('id', { count: 'exact', head: true })
    .eq('drive_id', driveId)
    .eq('status', 'Shortlisted');

  const { count: selectedCount } = await supabase
    .from('drive_applications')
    .select('id', { count: 'exact', head: true })
    .eq('drive_id', driveId)
    .eq('status', 'Selected');

  const placementPercentage = totalEligible > 0 ? ((selectedCount || 0) / totalEligible) * 100 : 0;

  return {
    totalEligibleStudents: totalEligible,
    totalApplications: appliedCount || 0,
    totalShortlisted: shortlistedCount || 0,
    totalSelected: selectedCount || 0,
    placementPercentage: parseFloat(placementPercentage.toFixed(2)),
  };
};

/**
 * Bind Eligible Branches
 */
const bindEligibleBranches = async (driveId, branchIds) => {
  await getDriveById(driveId);

  // Clear previous branch bindings
  await supabase.from('drive_eligible_branches').delete().eq('drive_id', driveId);

  const inserts = branchIds.map((branch_id) => ({
    drive_id: driveId,
    branch_id,
  }));

  const { data, error } = await supabase
    .from('drive_eligible_branches')
    .insert(inserts)
    .select('*, branches(id, name, code)');

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return data;
};

/**
 * Bind Eligible Departments
 */
const bindEligibleDepartments = async (driveId, departmentIds) => {
  await getDriveById(driveId);

  await supabase.from('drive_eligible_departments').delete().eq('drive_id', driveId);

  const inserts = departmentIds.map((department_id) => ({
    drive_id: driveId,
    department_id,
  }));

  const { data, error } = await supabase
    .from('drive_eligible_departments')
    .insert(inserts)
    .select('*, departments(id, name, code)');

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return data;
};

/**
 * Bind Eligible Batches
 */
const bindEligibleBatches = async (driveId, batches) => {
  await getDriveById(driveId);

  await supabase.from('drive_eligible_batches').delete().eq('drive_id', driveId);

  const inserts = batches.map((passing_year) => ({
    drive_id: driveId,
    passing_year,
  }));

  const { data, error } = await supabase
    .from('drive_eligible_batches')
    .insert(inserts)
    .select('*');

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return data;
};

module.exports = {
  listDrives,
  getDriveById,
  createDrive,
  updateDrive,
  deleteDrive,
  getDriveProfile,
  getEligibleStudents,
  getDriveStatistics,
  bindEligibleBranches,
  bindEligibleDepartments,
  bindEligibleBatches,
};
