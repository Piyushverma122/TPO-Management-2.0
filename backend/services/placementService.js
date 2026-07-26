const supabase = require('../config/supabase');
const dataScopeService = require('./dataScopeService');

/**
 * List Placement Records with pagination and multi-field filters
 */
const listPlacements = async (queryParams, reqUser) => {
  const page = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || 10;
  const offset = (page - 1) * limit;

  const { company_id, student_id, drive_id, year } = queryParams;

  let query = supabase
    .from('placements')
    .select(
      `
      *,
      students (
        id,
        roll_number,
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
      companies (
        id,
        name,
        logo_url,
        industry,
        tier
      ),
      placement_drives (
        id,
        drive_code,
        role_title,
        job_type,
        location
      )
    `,
      { count: 'exact' }
    );

  if (reqUser) {
    const scopeContext = await dataScopeService.resolveScopeContext(reqUser);
    query = dataScopeService.applyDataScope(query, reqUser, 'placements', scopeContext);
  }

  if (company_id) query = query.eq('company_id', company_id);
  if (student_id) query = query.eq('student_id', student_id);
  if (drive_id) query = query.eq('drive_id', drive_id);
  if (year) query = query.eq('students.passing_year', year);

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data: placements, count, error } = await query;

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return {
    placements: placements || [],
    page,
    limit,
    total: count || 0,
  };
};

/**
 * Get Placement Details by ID
 */
const getPlacementById = async (placementId) => {
  const { data: placement, error } = await supabase
    .from('placements')
    .select(
      `
      *,
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
      companies (
        id,
        name,
        logo_url,
        industry,
        website,
        tier
      ),
      placement_drives (
        id,
        drive_code,
        role_title,
        job_type,
        location,
        ctc
      )
    `
    )
    .eq('id', placementId)
    .single();

  if (error || !placement) {
    const err = new Error('Placement record not found.');
    err.statusCode = 404;
    throw err;
  }

  return placement;
};

/**
 * Create a new Placement Record
 */
const createPlacement = async (payload) => {
  const {
    student_id,
    company_id,
    drive_id,
    package: ctcPackage,
    joining_date,
    offer_status = 'Accepted',
    offer_letter_url,
  } = payload;

  // 1. Insert Placement Record
  const { data: placement, error: insertErr } = await supabase
    .from('placements')
    .insert([
      {
        student_id,
        company_id,
        drive_id,
        package: ctcPackage,
        joining_date: joining_date || null,
        offer_status,
        offer_letter_url: offer_letter_url || null,
      },
    ])
    .select('*')
    .single();

  if (insertErr) {
    const err = new Error(insertErr.message);
    err.statusCode = 500;
    throw err;
  }

  // 2. Update Student placement_status to 'Placed'
  await supabase
    .from('students')
    .update({ placement_status: 'Placed' })
    .eq('id', student_id);

  // 3. Update Drive Selected Count
  const { count: selectedCount } = await supabase
    .from('placements')
    .select('id', { count: 'exact', head: true })
    .eq('drive_id', drive_id);

  await supabase
    .from('placement_drives')
    .update({ selected_count: selectedCount || 1 })
    .eq('id', drive_id);

  // 4. Update Company Hired Count
  try {
    const { count: companyHiredCount } = await supabase
      .from('placements')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', company_id);

    await supabase
      .from('companies')
      .update({ hired_count: companyHiredCount || 1 })
      .eq('id', company_id);
  } catch (e) {
    console.warn('Company hired_count update fallback:', e.message);
  }

  // 5. Send Placement Celebratory Notification
  try {
    const { data: studentObj } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', student_id)
      .maybeSingle();

    if (studentObj?.user_id) {
      await supabase.from('notifications').insert([
        {
          user_id: studentObj.user_id,
          title: '🎉 Placement Offer Confirmed!',
          message: `Congratulations! Your placement offer of ₹${ctcPackage} LPA has been recorded in the TPO Portal.`,
          type: 'Placement Update',
          is_read: false,
        },
      ]);
    }
  } catch (e) {
    console.warn('Placement notification trigger fallback:', e.message);
  }

  return placement;
};

/**
 * Update Placement Record
 */
const updatePlacement = async (placementId, payload) => {
  await getPlacementById(placementId);

  const updateFields = {};
  if (payload.package !== undefined) updateFields.package = payload.package;
  if (payload.joining_date !== undefined) updateFields.joining_date = payload.joining_date;
  if (payload.offer_status !== undefined) updateFields.offer_status = payload.offer_status;
  if (payload.offer_letter_url !== undefined) updateFields.offer_letter_url = payload.offer_letter_url;

  const { data: updatedPlacement, error } = await supabase
    .from('placements')
    .update(updateFields)
    .eq('id', placementId)
    .select('*')
    .single();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return updatedPlacement;
};

/**
 * Delete Placement Record
 */
const deletePlacement = async (placementId) => {
  const placement = await getPlacementById(placementId);

  const { error } = await supabase.from('placements').delete().eq('id', placementId);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  // Check if student has remaining placements
  const { count: remaining } = await supabase
    .from('placements')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', placement.student_id);

  if (remaining === 0) {
    await supabase
      .from('students')
      .update({ placement_status: 'Unplaced' })
      .eq('id', placement.student_id);
  }

  return true;
};

/**
 * Comprehensive Placement Analytics Statistics
 */
const getPlacementStatistics = async () => {
  const { data: placements, error } = await supabase
    .from('placements')
    .select(
      `
      package,
      joining_date,
      companies (id, name, tier),
      students (
        passing_year,
        branches (id, name, code),
        users (department)
      )
    `
    );

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  if (!placements || placements.length === 0) {
    return {
      totalPlacements: 0,
      highestPackage: 0,
      averagePackage: 0,
      medianPackage: 0,
      lowestPackage: 0,
      companyBreakdown: [],
      branchBreakdown: [],
      departmentBreakdown: [],
      batchBreakdown: [],
    };
  }

  const packages = placements.map((p) => parseFloat(p.package) || 0).sort((a, b) => a - b);
  const total = packages.length;
  const highest = packages[total - 1];
  const lowest = packages[0];
  const sum = packages.reduce((acc, val) => acc + val, 0);
  const average = parseFloat((sum / total).toFixed(2));

  let median = 0;
  if (total % 2 === 0) {
    median = (packages[total / 2 - 1] + packages[total / 2]) / 2;
  } else {
    median = packages[Math.floor(total / 2)];
  }
  median = parseFloat(median.toFixed(2));

  // Company breakdown
  const companyMap = {};
  // Branch breakdown
  const branchMap = {};
  // Department breakdown
  const deptMap = {};
  // Batch breakdown
  const batchMap = {};

  placements.forEach((p) => {
    const companyName = p.companies?.name || 'Unknown';
    companyMap[companyName] = (companyMap[companyName] || 0) + 1;

    const branchName = p.students?.branches?.name || 'General';
    branchMap[branchName] = (branchMap[branchName] || 0) + 1;

    const deptName = p.students?.users?.department || 'General';
    deptMap[deptName] = (deptMap[deptName] || 0) + 1;

    const batchYear = p.students?.passing_year || 'Unknown';
    batchMap[batchYear] = (batchMap[batchYear] || 0) + 1;
  });

  return {
    totalPlacements: total,
    highestPackage: highest,
    averagePackage: average,
    medianPackage: median,
    lowestPackage: lowest,
    companyBreakdown: Object.entries(companyMap).map(([name, count]) => ({ name, count })),
    branchBreakdown: Object.entries(branchMap).map(([name, count]) => ({ name, count })),
    departmentBreakdown: Object.entries(deptMap).map(([name, count]) => ({ name, count })),
    batchBreakdown: Object.entries(batchMap).map(([year, count]) => ({ year, count })),
  };
};

/**
 * Get Student Placement Timeline
 */
const getStudentPlacementHistory = async (studentId) => {
  const { data: history, error } = await supabase
    .from('placements')
    .select(
      `
      *,
      companies (
        id,
        name,
        logo_url,
        industry
      ),
      placement_drives (
        id,
        drive_code,
        role_title,
        job_type,
        location
      )
    `
    )
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return history || [];
};

/**
 * Get Company Hires History
 */
const getCompanyPlacementHistory = async (companyId) => {
  const { data: hires, error } = await supabase
    .from('placements')
    .select(
      `
      *,
      students (
        id,
        roll_number,
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
      placement_drives (
        id,
        drive_code,
        role_title
      )
    `
    )
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return hires || [];
};

module.exports = {
  listPlacements,
  getPlacementById,
  createPlacement,
  updatePlacement,
  deletePlacement,
  getPlacementStatistics,
  getStudentPlacementHistory,
  getCompanyPlacementHistory,
};
