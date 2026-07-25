const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

/**
 * List students with pagination, search, and multi-field filters
 */
const listStudents = async (queryParams) => {
  const page = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || 10;
  const offset = (page - 1) * limit;

  const {
    search,
    branch,
    department,
    batch,
    placement_status,
    cgpa_min,
    cgpa_max,
  } = queryParams;

  let query = supabase
    .from('students')
    .select(
      `
      id,
      roll_number,
      current_semester,
      passing_year,
      cgpa,
      active_backlogs,
      placement_status,
      created_at,
      users!inner (
        id,
        full_name,
        email,
        phone,
        avatar_url,
        department
      ),
      branches (
        id,
        name,
        code
      )
    `,
      { count: 'exact' }
    )
    .is('deleted_at', null);

  // Apply filters
  if (branch) {
    query = query.ilike('branch', `%${branch}%`);
  }

  if (batch || queryParams.passing_year) {
    query = query.eq('passing_year', batch || queryParams.passing_year);
  }

  if (placement_status) {
    query = query.eq('placement_status', placement_status);
  }

  if (cgpa_min) {
    query = query.gte('cgpa', parseFloat(cgpa_min));
  }

  if (cgpa_max) {
    query = query.lte('cgpa', parseFloat(cgpa_max));
  }

  if (search) {
    query = query.or(
      `roll_number.ilike.%${search}%,users.full_name.ilike.%${search}%,users.email.ilike.%${search}%`
    );
  }

  // Pagination & Order
  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return {
    students: data || [],
    page,
    limit,
    total: count || 0,
  };
};

/**
 * Get Student by ID
 */
const getStudentById = async (studentId) => {
  const { data: student, error } = await supabase
    .from('students')
    .select(
      `
      *,
      users (
        id,
        full_name,
        email,
        phone,
        avatar_url,
        department
      ),
      branches (
        id,
        name,
        code
      )
    `
    )
    .eq('id', studentId)
    .is('deleted_at', null)
    .single();

  if (error || !student) {
    const err = new Error('Student record not found.');
    err.statusCode = 404;
    throw err;
  }

  return student;
};

/**
 * Create new Student candidate profile
 */
const createStudent = async (payload) => {
  const {
    email,
    password = 'Student@Pass2026',
    full_name,
    roll_number,
    branch_id,
    cgpa,
    passing_year,
    current_semester = 1,
    phone,
  } = payload;

  // 1. Check if user email or roll number exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingUser) {
    const err = new Error('User with this email already exists.');
    err.statusCode = 409;
    throw err;
  }

  // 2. Register user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, role: 'student' } },
  });

  if (authError) {
    const err = new Error(authError.message);
    err.statusCode = 400;
    throw err;
  }

  const userId = authData.user.id;
  const passwordHash = await bcrypt.hash(password, 10);

  // 3. Create user record in public.users
  const { error: userError } = await supabase.from('users').insert([
    {
      id: userId,
      email,
      password_hash: passwordHash,
      full_name,
      role: 'student',
      phone: phone || null,
      is_active: true,
    },
  ]);

  if (userError) {
    const err = new Error(userError.message);
    err.statusCode = 500;
    throw err;
  }

  // 4. Create student profile in public.students
  const { data: student, error: studentError } = await supabase
    .from('students')
    .insert([
      {
        user_id: userId,
        roll_number,
        branch_id: branch_id || null,
        cgpa,
        passing_year,
        current_semester,
        placement_status: 'Unplaced',
      },
    ])
    .select('*')
    .single();

  if (studentError) {
    const err = new Error(studentError.message);
    err.statusCode = 500;
    throw err;
  }

  return student;
};

/**
 * Update Student details
 */
const updateStudent = async (studentId, payload) => {
  // Verify student exists
  await getStudentById(studentId);

  const {
    roll_number,
    branch_id,
    cgpa,
    current_semester,
    passing_year,
    active_backlogs,
    placement_status,
    dob,
    gender,
    address,
    city,
    state,
    country,
    linkedin_url,
    github_url,
    portfolio_url,
    resume_headline,
    bio,
  } = payload;

  const updateFields = {};
  if (roll_number !== undefined) updateFields.roll_number = roll_number;
  if (branch_id !== undefined) updateFields.branch_id = branch_id;
  if (cgpa !== undefined) updateFields.cgpa = cgpa;
  if (current_semester !== undefined) updateFields.current_semester = current_semester;
  if (passing_year !== undefined) updateFields.passing_year = passing_year;
  if (active_backlogs !== undefined) updateFields.active_backlogs = active_backlogs;
  if (placement_status !== undefined) updateFields.placement_status = placement_status;
  if (dob !== undefined) updateFields.date_of_birth = dob;
  if (gender !== undefined) updateFields.gender = gender;
  if (address !== undefined) updateFields.address = address;
  if (city !== undefined) updateFields.city = city;
  if (state !== undefined) updateFields.state = state;
  if (country !== undefined) updateFields.country = country;
  if (linkedin_url !== undefined) updateFields.linkedin_url = linkedin_url;
  if (github_url !== undefined) updateFields.github_url = github_url;
  if (portfolio_url !== undefined) updateFields.portfolio_url = portfolio_url;
  if (resume_headline !== undefined) updateFields.resume_headline = resume_headline;
  if (bio !== undefined) updateFields.bio = bio;

  const { data: updatedStudent, error } = await supabase
    .from('students')
    .update(updateFields)
    .eq('id', studentId)
    .select('*')
    .single();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return updatedStudent;
};

/**
 * Soft Delete Student record
 */
const deleteStudent = async (studentId) => {
  await getStudentById(studentId);

  const { error } = await supabase
    .from('students')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', studentId);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return true;
};

/**
 * Get Full Student Profile Aggregation
 */
const getStudentFullProfile = async (studentId) => {
  const student = await getStudentById(studentId);

  // Fetch Skills
  const { data: skills } = await supabase
    .from('student_skills')
    .select('id, skill_id, proficiency_level, skills (id, name, category)')
    .eq('student_id', studentId);

  // Fetch Active Resume
  const { data: activeResume } = await supabase
    .from('resumes')
    .select('*')
    .eq('student_id', studentId)
    .eq('is_active', true)
    .maybeSingle();

  // Fetch Student Documents
  const { data: documents } = await supabase
    .from('student_documents')
    .select('*')
    .eq('student_id', studentId);

  // Fetch Semester Records
  const { data: semesters } = await supabase
    .from('student_semesters')
    .select('*')
    .eq('student_id', studentId)
    .order('semester', { ascending: true });

  return {
    ...student,
    skills: skills || [],
    activeResume: activeResume || null,
    documents: documents || [],
    semesters: semesters || [],
  };
};

/**
 * Upload Resume PDF to "resumes" storage bucket & save record
 */
const uploadResume = async (studentId, file, versionTitle = 'Resume Version', userId) => {
  await getStudentById(studentId);

  const fileExt = file.originalname.split('.').pop();
  const fileName = `${Date.now()}_resume.${fileExt}`;
  const storagePath = `${studentId}/${fileName}`;

  // 1. Upload Buffer to Supabase Storage 'resumes' Bucket
  const { error: uploadErr } = await supabase.storage
    .from('resumes')
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadErr) {
    const err = new Error(`Supabase Storage Upload Error: ${uploadErr.message}`);
    err.statusCode = 500;
    throw err;
  }

  // Get Public File URL
  const { data: publicUrlData } = supabase.storage.from('resumes').getPublicUrl(storagePath);
  const fileUrl = publicUrlData.publicUrl;

  // 2. Deactivate previous active resumes
  await supabase
    .from('resumes')
    .update({ is_active: false })
    .eq('student_id', studentId);

  // 3. Insert new active resume record
  const { data: newResume, error: dbErr } = await supabase
    .from('resumes')
    .insert([
      {
        student_id: studentId,
        version_title: versionTitle,
        bucket_name: 'resumes',
        storage_path: storagePath,
        file_name: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size,
        file_url: fileUrl,
        is_active: true,
        uploaded_by: userId || null,
      },
    ])
    .select('*')
    .single();

  if (dbErr) {
    const err = new Error(dbErr.message);
    err.statusCode = 500;
    throw err;
  }

  // Update active_resume_id on student profile
  await supabase
    .from('students')
    .update({ active_resume_id: newResume.id })
    .eq('id', studentId);

  return newResume;
};

/**
 * List Student Resumes
 */
const listResumes = async (studentId) => {
  const { data: resumes, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('student_id', studentId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return resumes || [];
};

/**
 * Delete Resume version
 */
const deleteResume = async (resumeId) => {
  const { data: resume, error: fetchErr } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', resumeId)
    .single();

  if (fetchErr || !resume) {
    const err = new Error('Resume record not found.');
    err.statusCode = 404;
    throw err;
  }

  // Delete file from Supabase Storage
  await supabase.storage.from('resumes').remove([resume.storage_path]);

  // Delete DB record
  const { error: dbErr } = await supabase.from('resumes').delete().eq('id', resumeId);

  if (dbErr) {
    const err = new Error(dbErr.message);
    err.statusCode = 500;
    throw err;
  }

  return true;
};

/**
 * Upload Document to "student-documents" storage bucket
 */
const uploadDocument = async (studentId, file, documentName, documentType, userId) => {
  await getStudentById(studentId);

  const fileExt = file.originalname.split('.').pop();
  const fileName = `${Date.now()}_${documentName.replace(/\s+/g, '_')}.${fileExt}`;
  const storagePath = `${studentId}/${fileName}`;

  // Upload to Supabase Storage 'student-documents'
  const { error: uploadErr } = await supabase.storage
    .from('student-documents')
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadErr) {
    const err = new Error(`Supabase Storage Document Upload Error: ${uploadErr.message}`);
    err.statusCode = 500;
    throw err;
  }

  const { data: publicUrlData } = supabase.storage.from('student-documents').getPublicUrl(storagePath);

  const { data: newDoc, error: dbErr } = await supabase
    .from('student_documents')
    .insert([
      {
        student_id: studentId,
        document_name: documentName,
        document_type: documentType || 'General',
        bucket_name: 'student-documents',
        storage_path: storagePath,
        file_name: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size,
        file_url: publicUrlData.publicUrl,
        uploaded_by: userId || null,
      },
    ])
    .select('*')
    .single();

  if (dbErr) {
    const err = new Error(dbErr.message);
    err.statusCode = 500;
    throw err;
  }

  return newDoc;
};

/**
 * List Student Documents
 */
const listDocuments = async (studentId) => {
  const { data: docs, error } = await supabase
    .from('student_documents')
    .select('*')
    .eq('student_id', studentId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return docs || [];
};

/**
 * Delete Student Document
 */
const deleteDocument = async (documentId) => {
  const { data: doc, error: fetchErr } = await supabase
    .from('student_documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (fetchErr || !doc) {
    const err = new Error('Document record not found.');
    err.statusCode = 404;
    throw err;
  }

  // Delete file from Storage
  await supabase.storage.from('student-documents').remove([doc.storage_path]);

  // Delete DB record
  const { error: dbErr } = await supabase.from('student_documents').delete().eq('id', documentId);

  if (dbErr) {
    const err = new Error(dbErr.message);
    err.statusCode = 500;
    throw err;
  }

  return true;
};

module.exports = {
  listStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentFullProfile,
  uploadResume,
  listResumes,
  deleteResume,
  uploadDocument,
  listDocuments,
  deleteDocument,
};
