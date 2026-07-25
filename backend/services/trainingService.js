const supabase = require('../config/supabase');

/**
 * List training modules with pagination and category/status filters
 */
const listTrainings = async (queryParams) => {
  const page = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || 10;
  const offset = (page - 1) * limit;

  const { search, category, status, level } = queryParams;

  let query = supabase
    .from('training_modules')
    .select(
      `
      *,
      faculty (
        id,
        designation,
        users (
          full_name,
          email,
          phone,
          avatar_url
        )
      )
    `,
      { count: 'exact' }
    )
    .is('deleted_at', null);

  if (category) query = query.eq('category', category);
  if (status) query = query.eq('status', status);
  if (level) query = query.eq('level', level);

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data: modules, count, error } = await query;

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return {
    trainings: modules || [],
    page,
    limit,
    total: count || 0,
  };
};

/**
 * Get Training Module details by ID
 */
const getTrainingById = async (moduleId) => {
  const { data: module, error } = await supabase
    .from('training_modules')
    .select(
      `
      *,
      faculty (
        id,
        designation,
        users (
          full_name,
          email,
          phone,
          avatar_url
        )
      )
    `
    )
    .eq('id', moduleId)
    .is('deleted_at', null)
    .single();

  if (error || !module) {
    const err = new Error('Training module not found.');
    err.statusCode = 404;
    throw err;
  }

  // Fetch sessions
  const { data: sessions } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('module_id', moduleId)
    .order('session_date', { ascending: true });

  // Fetch materials
  const { data: materials } = await supabase
    .from('training_materials')
    .select('*')
    .eq('module_id', moduleId);

  // Fetch enrollments count
  const { count: enrollmentsCount } = await supabase
    .from('training_enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('module_id', moduleId);

  return {
    ...module,
    sessions: sessions || [],
    materials: materials || [],
    enrollmentsCount: enrollmentsCount || 0,
  };
};

/**
 * Create a new Training Module
 */
const createTraining = async (payload) => {
  const {
    title,
    description,
    category = 'Technical',
    faculty_id,
    duration_hours = 10,
    level = 'Intermediate',
    status = 'Active',
    start_date,
    end_date,
  } = payload;

  const { data: module, error } = await supabase
    .from('training_modules')
    .insert([
      {
        title,
        description: description || null,
        category,
        faculty_id: faculty_id || null,
        duration_hours,
        level,
        status,
        start_date: start_date || null,
        end_date: end_date || null,
      },
    ])
    .select('*')
    .single();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return module;
};

/**
 * Update Training Module details
 */
const updateTraining = async (moduleId, payload) => {
  await getTrainingById(moduleId);

  const updateFields = {};
  if (payload.title !== undefined) updateFields.title = payload.title;
  if (payload.description !== undefined) updateFields.description = payload.description;
  if (payload.category !== undefined) updateFields.category = payload.category;
  if (payload.faculty_id !== undefined) updateFields.faculty_id = payload.faculty_id;
  if (payload.duration_hours !== undefined) updateFields.duration_hours = payload.duration_hours;
  if (payload.level !== undefined) updateFields.level = payload.level;
  if (payload.status !== undefined) updateFields.status = payload.status;
  if (payload.start_date !== undefined) updateFields.start_date = payload.start_date;
  if (payload.end_date !== undefined) updateFields.end_date = payload.end_date;

  const { data: updatedModule, error } = await supabase
    .from('training_modules')
    .update(updateFields)
    .eq('id', moduleId)
    .select('*')
    .single();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return updatedModule;
};

/**
 * Soft Delete Training Module
 */
const deleteTraining = async (moduleId) => {
  await getTrainingById(moduleId);

  const { error } = await supabase
    .from('training_modules')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', moduleId);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return true;
};

/**
 * Enroll Student in Training Module
 */
const enrollStudent = async (moduleId, userId) => {
  // Fetch student profile matching user_id
  const { data: student, error: studentErr } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (studentErr || !student) {
    const err = new Error('Student profile not found.');
    err.statusCode = 404;
    throw err;
  }

  await getTrainingById(moduleId);

  // Check duplicate enrollment
  const { data: existing } = await supabase
    .from('training_enrollments')
    .select('id')
    .eq('module_id', moduleId)
    .eq('student_id', student.id)
    .maybeSingle();

  if (existing) {
    const err = new Error('Already enrolled in this training module.');
    err.statusCode = 409;
    throw err;
  }

  const { data: enrollment, error: enrollErr } = await supabase
    .from('training_enrollments')
    .insert([
      {
        module_id: moduleId,
        student_id: student.id,
        progress_percentage: 0,
        completed: false,
      },
    ])
    .select('*')
    .single();

  if (enrollErr) {
    const err = new Error(enrollErr.message);
    err.statusCode = 500;
    throw err;
  }

  return enrollment;
};

/**
 * Cancel Student Enrollment
 */
const cancelEnrollment = async (moduleId, userId) => {
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!student) {
    const err = new Error('Student profile not found.');
    err.statusCode = 404;
    throw err;
  }

  const { error } = await supabase
    .from('training_enrollments')
    .delete()
    .eq('module_id', moduleId)
    .eq('student_id', student.id);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return true;
};

/**
 * Mark Session Attendance
 */
const markAttendance = async (sessionId, studentId, isPresent, remarks) => {
  // Upsert attendance record
  const { data: attendance, error } = await supabase
    .from('training_attendance')
    .upsert(
      [
        {
          session_id: sessionId,
          student_id: studentId,
          is_present: isPresent,
          attendance_time: new Date().toISOString(),
          remarks: remarks || null,
        },
      ],
      { onConflict: 'session_id,student_id' }
    )
    .select('*')
    .single();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return attendance;
};

/**
 * Upload Course Material to "training-materials" storage bucket
 */
const uploadTrainingMaterial = async (moduleId, file, title) => {
  await getTrainingById(moduleId);

  const fileExt = file.originalname.split('.').pop();
  const fileName = `${Date.now()}_material.${fileExt}`;
  const storagePath = `${moduleId}/${fileName}`;

  // Upload to Supabase Storage 'training-materials'
  const { error: uploadErr } = await supabase.storage
    .from('training-materials')
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadErr) {
    const err = new Error(`Material Upload Error: ${uploadErr.message}`);
    err.statusCode = 500;
    throw err;
  }

  const { data: publicUrlData } = supabase.storage.from('training-materials').getPublicUrl(storagePath);

  const { data: newMaterial, error: dbErr } = await supabase
    .from('training_materials')
    .insert([
      {
        module_id: moduleId,
        title: title || file.originalname,
        bucket_name: 'training-materials',
        storage_path: storagePath,
        file_name: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size,
        file_url: publicUrlData.publicUrl,
      },
    ])
    .select('*')
    .single();

  if (dbErr) {
    const err = new Error(dbErr.message);
    err.statusCode = 500;
    throw err;
  }

  return newMaterial;
};

/**
 * Upload Completion Certificate PDF to "training-certificates" storage bucket
 */
const uploadCertificate = async (moduleId, studentId, file, certNumber) => {
  await getTrainingById(moduleId);

  const fileExt = file.originalname.split('.').pop();
  const certNo = certNumber || `CERT-${Date.now().toString().slice(-6)}`;
  const fileName = `${Date.now()}_cert.${fileExt}`;
  const storagePath = `${moduleId}/${studentId}/${fileName}`;

  // Upload to 'training-certificates' bucket
  const { error: uploadErr } = await supabase.storage
    .from('training-certificates')
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadErr) {
    const err = new Error(`Certificate Upload Error: ${uploadErr.message}`);
    err.statusCode = 500;
    throw err;
  }

  const { data: publicUrlData } = supabase.storage.from('training-certificates').getPublicUrl(storagePath);

  const { data: cert, error: dbErr } = await supabase
    .from('training_certificates')
    .insert([
      {
        module_id: moduleId,
        student_id: studentId,
        certificate_number: certNo,
        bucket_name: 'training-certificates',
        storage_path: storagePath,
        file_name: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size,
        certificate_url: publicUrlData.publicUrl,
        issued_date: new Date().toISOString().split('T')[0],
      },
    ])
    .select('*')
    .single();

  if (dbErr) {
    const err = new Error(dbErr.message);
    err.statusCode = 500;
    throw err;
  }

  // Update student training enrollment completion status
  await supabase
    .from('training_enrollments')
    .update({ completed: true, progress_percentage: 100 })
    .eq('module_id', moduleId)
    .eq('student_id', studentId);

  return cert;
};

/**
 * Get Student Progress in Training Module
 */
const getStudentProgress = async (moduleId, userId) => {
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  const studentId = student ? student.id : userId;

  const { data: enrollment } = await supabase
    .from('training_enrollments')
    .select('*')
    .eq('module_id', moduleId)
    .eq('student_id', studentId)
    .maybeSingle();

  const { data: certificate } = await supabase
    .from('training_certificates')
    .select('*')
    .eq('module_id', moduleId)
    .eq('student_id', studentId)
    .maybeSingle();

  // Calculate Attendance Percentage
  const { data: sessions } = await supabase
    .from('training_sessions')
    .select('id')
    .eq('module_id', moduleId);

  const totalSessions = sessions ? sessions.length : 0;
  let attendanceRate = 0;

  if (totalSessions > 0) {
    const sessionIds = sessions.map((s) => s.id);
    const { count: attendedCount } = await supabase
      .from('training_attendance')
      .select('id', { count: 'exact', head: true })
      .in('session_id', sessionIds)
      .eq('student_id', studentId)
      .eq('is_present', true);

    attendanceRate = parseFloat(((attendedCount || 0) / totalSessions * 100).toFixed(2));
  }

  return {
    isEnrolled: !!enrollment,
    enrollmentDetails: enrollment || null,
    attendanceRatePercentage: attendanceRate,
    overallProgressPercentage: enrollment ? enrollment.progress_percentage || attendanceRate : 0,
    isCompleted: enrollment ? enrollment.completed : false,
    certificate: certificate || null,
  };
};

/**
 * Get Overall Dashboard Training Statistics
 */
const getTrainingStatistics = async () => {
  const { count: totalTrainings } = await supabase
    .from('training_modules')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null);

  const { count: activeTrainings } = await supabase
    .from('training_modules')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'Active')
    .is('deleted_at', null);

  const { count: totalEnrollments } = await supabase
    .from('training_enrollments')
    .select('id', { count: 'exact', head: true });

  const { count: completedEnrollments } = await supabase
    .from('training_enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('completed', true);

  const completionRate = totalEnrollments > 0 ? ((completedEnrollments || 0) / totalEnrollments) * 100 : 0;

  return {
    totalTrainings: totalTrainings || 0,
    activeTrainings: activeTrainings || 0,
    totalEnrollments: totalEnrollments || 0,
    completionRatePercentage: parseFloat(completionRate.toFixed(2)),
  };
};

module.exports = {
  listTrainings,
  getTrainingById,
  createTraining,
  updateTraining,
  deleteTraining,
  enrollStudent,
  cancelEnrollment,
  markAttendance,
  uploadTrainingMaterial,
  uploadCertificate,
  getStudentProgress,
  getTrainingStatistics,
};
