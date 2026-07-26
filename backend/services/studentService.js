const { supabase, supabaseAdmin } = require('../config/supabase');
const bcrypt = require('bcryptjs');
const dataScopeService = require('./dataScopeService');
const { sendStudentWelcomeEmail } = require('./emailService');

/**
 * List students with pagination, search, and multi-field filters
 */
const listStudents = async (queryParams, reqUser) => {
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
        avatar_url
      ),
      branches (
        id,
        name,
        code
      ),
      placements (
        package,
        offer_status,
        companies (
          name
        )
      )
    `,
      { count: 'exact' }
    )
    .is('deleted_at', null);

  if (reqUser) {
    const scopeContext = await dataScopeService.resolveScopeContext(reqUser);
    query = dataScopeService.applyDataScope(query, reqUser, 'students', scopeContext);
  }

  // Apply filters
  if (branch) {
    query = query.eq('branch_id', branch);
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
    const { data: matchedUsers } = await supabase
      .from('users')
      .select('id')
      .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);

    const matchedUserIds = (matchedUsers || []).map((u) => u.id);
    if (matchedUserIds.length > 0) {
      query = query.or(`roll_number.ilike.%${search}%,user_id.in.(${matchedUserIds.join(',')})`);
    } else {
      query = query.ilike('roll_number', `%${search}%`);
    }
  }

  // Pagination & Order
  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data: students, count, error } = await query;

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  const normalizedStudents = (students || []).map((s) => {
    const activePlacement = s.placements?.[0];
    return {
      ...s,
      company_placed: activePlacement?.companies?.name || '(pending)',
      package_offered: activePlacement?.package ? `₹${activePlacement.package} LPA` : '--',
    };
  });

  return {
    students: normalizedStudents,
    page,
    limit,
    total: count || 0,
  };
};

/**
 * Get Student by ID
 */
const getStudentById = async (studentId, reqUser) => {
  if (reqUser) {
    const isAllowed = await dataScopeService.validateOwnership(reqUser, 'students', studentId, 'VIEW_STUDENT_BY_ID');
    if (!isAllowed) {
      const err = new Error('You do not have permission to access this student record.');
      err.statusCode = 403;
      throw err;
    }
  }
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
        avatar_url
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
 * Helper to query database via supabaseAdmin with automatic fallback to user authenticated client or standard supabase client
 */
const dbQuery = async (queryFn, authToken) => {
  let res = await queryFn(supabaseAdmin);
  if (res?.error && (res.error.message?.includes('Invalid API key') || res.error.code === 'PGRST301' || res.error.code === '42501')) {
    if (authToken) {
      try {
        const { createClient } = require('@supabase/supabase-js');
        const env = require('../config/env');
        const cleanToken = authToken.startsWith('Bearer ') ? authToken.slice(7) : authToken;
        const userClient = createClient(env.supabaseUrl, env.supabaseKey, {
          global: {
            headers: {
              Authorization: `Bearer ${cleanToken}`,
            },
          },
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
        const userRes = await queryFn(userClient);
        if (!userRes?.error) return userRes;
      } catch (e) {
        // Fallback
      }
    }
    res = await queryFn(supabase);
  }
  return res;
};

/**
 * Create new Student candidate profile
 */
const createStudent = async (payload, authToken) => {
  const {
    email,
    password = 'Student@Pass2026',
    full_name,
    roll_number,
    enrollment_number,
    branch_id,
    cgpa,
    passing_year,
    current_semester = 1,
    date_of_birth,
    dob,
    gender,
    phone,
    alternate_phone,
    address,
    city,
    state,
    country = 'India',
    pincode,
    linkedin_url,
    github_url,
    portfolio_url,
    leetcode_url,
    hackerrank_url,
    resume_headline,
    bio,
    tenth_percentage,
    twelfth_percentage,
    diploma_percentage,
    active_backlogs = 0,
    history_backlogs = 0,
    placement_status = 'Unplaced',
  } = payload;

  // 1. Pre-check if roll_number already exists in public.students
  if (roll_number) {
    const { data: existingRoll } = await dbQuery((db) =>
      db.from('students').select('id').eq('roll_number', roll_number).maybeSingle(),
      authToken
    );

    if (existingRoll) {
      const err = new Error(`Student with Roll Number '${roll_number}' already exists.`);
      err.statusCode = 409;
      throw err;
    }
  }

  // 2. Check if user email exists in public.users
  const { data: existingUser } = await dbQuery((db) =>
    db.from('users').select('id').eq('email', email).maybeSingle(),
    authToken
  );

  let userId;

  if (existingUser) {
    userId = existingUser.id;
    // Check if student profile already exists in public.students for this user
    const { data: existingStudent } = await dbQuery((db) =>
      db.from('students').select('id').eq('user_id', userId).maybeSingle(),
      authToken
    );

    if (existingStudent) {
      const err = new Error('Student candidate record with this email already exists.');
      err.statusCode = 409;
      throw err;
    }
  } else {
    // 3. Register user in Supabase Auth as SINGLE SOURCE OF TRUTH
    let authRes;
    let authError;

    try {
      const res = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role: 'STUDENT' },
      });
      authRes = res.data;
      authError = res.error;
    } catch (e) {
      authError = e;
    }

    if (authError && (authError.message?.includes('Invalid API key') || authError.status === 401)) {
      // Fall back to direct GoTrue HTTP Auth Signup
      try {
        const https = require('https');
        const env = require('../config/env');
        const postData = JSON.stringify({
          email,
          password,
          data: { full_name, role: 'STUDENT' },
        });
        const url = new URL(`${env.supabaseUrl}/auth/v1/signup`);
        const httpRes = await new Promise((resolve) => {
          const req = https.request(
            url,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                apikey: env.supabaseKey,
              },
            },
            (r) => {
              let body = '';
              r.on('data', (chunk) => (body += chunk));
              r.on('end', () => {
                try { resolve(JSON.parse(body)); } catch (e) { resolve(null); }
              });
            }
          );
          req.on('error', () => resolve(null));
          req.write(postData);
          req.end();
        });

        if (httpRes?.id) {
          authRes = { user: httpRes };
          authError = null;
        }
      } catch (e) {
        // Fallback
      }
    }

    if (authRes?.user) {
      userId = authRes.user.id;
    } else {
      // Generate deterministic / fallback UUID if auth lookup fails
      const crypto = require('crypto');
      userId = crypto.randomUUID();
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Insert user record into public.users
    let { error: userError } = await dbQuery((db) =>
      db.from('users').upsert(
        [
          {
            id: userId,
            email,
            password_hash: passwordHash,
            full_name,
            role: 'student',
            phone: phone || null,
            is_active: true,
            must_change_password: true,
          },
        ],
        { onConflict: 'email' }
      ),
      authToken
    );

    // Fallback if must_change_password column does not exist in DB schema yet
    if (userError && (userError.code === '42703' || userError.message?.includes('must_change_password'))) {
      const { error: retryError } = await dbQuery((db) =>
        db.from('users').upsert(
          [
            {
              id: userId,
              email,
              password_hash: passwordHash,
              full_name,
              role: 'student',
              phone: phone || null,
              is_active: true,
            },
          ],
          { onConflict: 'email' }
        ),
        authToken
      );
      userError = retryError;
    }

    if (userError) {
      const err = new Error(userError.message);
      err.statusCode = 500;
      throw err;
    }
  }

  // 5. Create student profile in public.students
  const studentInsertPayload = {
    user_id: userId,
    roll_number: roll_number || `RN${Date.now().toString().slice(-6)}`,
    enrollment_number: enrollment_number || null,
    branch_id: branch_id || null,
    cgpa: cgpa !== undefined && cgpa !== null && cgpa !== '' ? parseFloat(cgpa) : 8.0,
    passing_year: passing_year ? parseInt(passing_year) : new Date().getFullYear() + 2,
    current_semester: current_semester ? parseInt(current_semester) : 1,
    date_of_birth: date_of_birth || dob || null,
    gender: gender || null,
    phone: phone || null,
    alternate_phone: alternate_phone || null,
    address: address || null,
    city: city || null,
    state: state || null,
    country: country || 'India',
    pincode: pincode || null,
    linkedin_url: linkedin_url || null,
    github_url: github_url || null,
    portfolio_url: portfolio_url || null,
    leetcode_url: leetcode_url || null,
    hackerrank_url: hackerrank_url || null,
    resume_headline: resume_headline || null,
    bio: bio || null,
    tenth_percentage: tenth_percentage !== undefined && tenth_percentage !== null && tenth_percentage !== '' ? parseFloat(tenth_percentage) : null,
    twelfth_percentage: twelfth_percentage !== undefined && twelfth_percentage !== null && twelfth_percentage !== '' ? parseFloat(twelfth_percentage) : null,
    diploma_percentage: diploma_percentage !== undefined && diploma_percentage !== null && diploma_percentage !== '' ? parseFloat(diploma_percentage) : null,
    active_backlogs: active_backlogs ? parseInt(active_backlogs) : 0,
    history_backlogs: history_backlogs ? parseInt(history_backlogs) : 0,
    placement_status: placement_status || 'Unplaced',
  };

  const { data: student, error: studentError } = await dbQuery(
    (db) => db.from('students').insert([studentInsertPayload]).select('*').single(),
    authToken
  );

  if (studentError) {
    let statusCode = 500;
    let message = studentError.message;
    if (
      studentError.code === '23505' ||
      studentError.message?.includes('duplicate key') ||
      studentError.message?.includes('violates unique constraint')
    ) {
      statusCode = 409;
      if (studentError.message?.includes('roll_number')) {
        message = `Student with Roll Number '${roll_number}' already exists.`;
      } else {
        message = 'Duplicate candidate record already exists.';
      }
    }
    const err = new Error(message);
    err.statusCode = statusCode;
    throw err;
  }

  // 6. Auto-create default resume profile
  try {
    const { data: defaultResume } = await dbQuery(
      (db) =>
        db
          .from('resumes')
          .insert([
            {
              student_id: student.id,
              version_title: `${full_name || 'Candidate'} Primary Resume`,
              file_name: 'default_resume.pdf',
              file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
              storage_path: 'resumes/default_resume.pdf',
              file_size: 1024,
              is_active: true,
              is_verified: true,
            },
          ])
          .select('id')
          .maybeSingle(),
      authToken
    );

    if (defaultResume) {
      await dbQuery(
        (db) => db.from('students').update({ active_resume_id: defaultResume.id }).eq('id', student.id),
        authToken
      );
      student.active_resume_id = defaultResume.id;
    }
  } catch (e) {
    console.error('Auto resume creation fallback error:', e);
  }

  // 7. Auto-create Welcome Notification
  try {
    if (userId) {
      await dbQuery(
        (db) =>
          db.from('notifications').insert([
            {
              user_id: userId,
              title: 'Welcome to Smart TPO Portal 🚀',
              message: `Hello ${full_name || 'Candidate'}, your candidate account and student profile have been registered successfully!`,
              type: 'System Alert',
              is_read: false,
            },
          ]),
        authToken
      );
    }
  } catch (e) {
    console.error('Welcome notification trigger fallback error:', e);
  }

  // 8. Log Audit Event
  try {
    if (userId) {
      await dbQuery(
        (db) =>
          db.from('audit_logs').insert([
            {
              user_id: userId,
              action: 'STUDENT_ENROLLED',
              category: 'Student Management',
              details: `Student account created for ${full_name} (${email}).`,
            },
          ]),
        authToken
      );
    }
  } catch (e) {
    console.error('Audit log trigger fallback error:', e);
  }

  // 9. Send Welcome Email with Login Credentials
  try {
    await sendStudentWelcomeEmail(email, full_name || 'Student', password);
  } catch (e) {
    console.error('Welcome email send error (non-blocking):', e.message);
  }

  return { ...student, _tempPassword: password, _email: email };
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
