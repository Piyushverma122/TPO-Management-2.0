const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const dataScopeService = require('./dataScopeService');

/**
 * List companies with search, filtering and pagination
 */
const listCompanies = async (queryParams, reqUser) => {
  const page = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || 10;
  const offset = (page - 1) * limit;

  const { search, tier, status, industry } = queryParams;

  let query = supabase
    .from('companies')
    .select('*, company_contacts(*)', { count: 'exact' })
    .is('deleted_at', null);

  if (reqUser) {
    const scopeContext = await dataScopeService.resolveScopeContext(reqUser);
    query = dataScopeService.applyDataScope(query, reqUser, 'companies', scopeContext);
  }

  if (tier) query = query.eq('tier', tier);
  if (status) query = query.eq('status', status);
  if (industry) query = query.ilike('industry', `%${industry}%`);

  if (search) {
    query = query.or(`name.ilike.%${search}%,industry.ilike.%${search}%,description.ilike.%${search}%`);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data: companies, count, error } = await query;

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  const normalizedCompanies = (companies || []).map((c) => {
    const primaryContact = c.company_contacts?.find((ct) => ct.is_primary) || c.company_contacts?.[0];
    return {
      ...c,
      hr_name: primaryContact?.hr_name || c.hr_name || null,
      hr_email: primaryContact?.email || c.hr_email || null,
      hr_phone: primaryContact?.phone || c.hr_phone || null,
    };
  });

  return {
    companies: normalizedCompanies,
    page,
    limit,
    total: count || 0,
  };
};

/**
 * Get Company by ID
 */
const getCompanyById = async (companyId, reqUser) => {
  if (reqUser) {
    const isAllowed = await dataScopeService.validateOwnership(reqUser, 'companies', companyId, 'VIEW_COMPANY_BY_ID');
    if (!isAllowed) {
      const err = new Error('You do not have permission to access this company profile.');
      err.statusCode = 403;
      throw err;
    }
  }
  const { data: company, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .is('deleted_at', null)
    .single();

  if (error || !company) {
    const err = new Error('Company record not found.');
    err.statusCode = 404;
    throw err;
  }

  return company;
};

/**
 * Create a new Hiring Company
 */
const createCompany = async (payload) => {
  const {
    name,
    industry,
    website,
    tier = 'Standard',
    status = 'Active',
    min_cgpa = 6.0,
    max_backlogs = 0,
    visited_year = new Date().getFullYear(),
    avg_package = 0.0,
    highest_package = 0.0,
    description,
    headquarters,
    hr_name,
    hr_email,
    hr_phone,
    eligible_branch_ids = [],
  } = payload;

  // Check unique company name
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .eq('name', name)
    .maybeSingle();

  if (existing) {
    const err = new Error('Company with this name already exists.');
    err.statusCode = 409;
    throw err;
  }

  // 1. Insert Company
  const { data: company, error: companyErr } = await supabase
    .from('companies')
    .insert([
      {
        name,
        industry,
        website: website || null,
        tier,
        status,
        min_cgpa,
        max_backlogs,
        visited_year,
        avg_package,
        highest_package,
        description: description || null,
        headquarters: headquarters || null,
      },
    ])
    .select('*')
    .single();

  if (companyErr) {
    const err = new Error(companyErr.message);
    err.statusCode = 500;
    throw err;
  }

  // 2. Insert primary HR Contact if provided
  if (hr_name || hr_email || hr_phone) {
    await supabase.from('company_contacts').insert([
      {
        company_id: company.id,
        hr_name: hr_name || 'HR Recruiter',
        email: hr_email || 'hr@company.com',
        phone: hr_phone || 'N/A',
        is_primary: true,
      },
    ]);
  }

  // 3. Insert eligible branches
  if (Array.isArray(eligible_branch_ids) && eligible_branch_ids.length > 0) {
    const branchInserts = eligible_branch_ids.map((branch_id) => ({
      company_id: company.id,
      branch_id,
    }));
    await supabase.from('company_eligible_branches').insert(branchInserts);
  }

  return company;
};

/**
 * Update Company details
 */
const updateCompany = async (companyId, payload) => {
  await getCompanyById(companyId);

  const updateFields = {};
  if (payload.name !== undefined) updateFields.name = payload.name;
  if (payload.industry !== undefined) updateFields.industry = payload.industry;
  if (payload.website !== undefined) updateFields.website = payload.website;
  if (payload.tier !== undefined) updateFields.tier = payload.tier;
  if (payload.status !== undefined) updateFields.status = payload.status;
  if (payload.min_cgpa !== undefined) updateFields.min_cgpa = payload.min_cgpa;
  if (payload.max_backlogs !== undefined) updateFields.max_backlogs = payload.max_backlogs;
  if (payload.visited_year !== undefined) updateFields.visited_year = payload.visited_year;
  if (payload.avg_package !== undefined) updateFields.avg_package = payload.avg_package;
  if (payload.highest_package !== undefined) updateFields.highest_package = payload.highest_package;
  if (payload.description !== undefined) updateFields.description = payload.description;
  if (payload.headquarters !== undefined) updateFields.headquarters = payload.headquarters;

  const { data: updatedCompany, error } = await supabase
    .from('companies')
    .update(updateFields)
    .eq('id', companyId)
    .select('*')
    .single();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return updatedCompany;
};

/**
 * Soft Delete Company
 */
const deleteCompany = async (companyId) => {
  await getCompanyById(companyId);

  const { error } = await supabase
    .from('companies')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', companyId);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return true;
};

/**
 * Upload Company Logo to "company-logos" storage bucket
 */
const uploadCompanyLogo = async (companyId, file) => {
  await getCompanyById(companyId);

  const fileExt = file.originalname.split('.').pop();
  const fileName = `${Date.now()}_logo.${fileExt}`;
  const storagePath = `${companyId}/${fileName}`;

  // Upload to Supabase Storage 'company-logos'
  const { error: uploadErr } = await supabase.storage
    .from('company-logos')
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadErr) {
    const err = new Error(`Logo Upload Error: ${uploadErr.message}`);
    err.statusCode = 500;
    throw err;
  }

  const { data: publicUrlData } = supabase.storage.from('company-logos').getPublicUrl(storagePath);
  const logoUrl = publicUrlData.publicUrl;

  // Update company record
  const { data: updatedCompany, error: dbErr } = await supabase
    .from('companies')
    .update({ logo_url: logoUrl })
    .eq('id', companyId)
    .select('*')
    .single();

  if (dbErr) {
    const err = new Error(dbErr.message);
    err.statusCode = 500;
    throw err;
  }

  return updatedCompany;
};

/**
 * Upload Document to "company-documents" storage bucket
 */
const uploadCompanyDocument = async (companyId, file, documentType = 'jd_pdf', userId) => {
  await getCompanyById(companyId);

  const fileExt = file.originalname.split('.').pop();
  const fileName = `${Date.now()}_${documentType}.${fileExt}`;
  const storagePath = `${companyId}/${fileName}`;

  // Upload to 'company-documents' bucket
  const { error: uploadErr } = await supabase.storage
    .from('company-documents')
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadErr) {
    const err = new Error(`Company Document Upload Error: ${uploadErr.message}`);
    err.statusCode = 500;
    throw err;
  }

  const { data: publicUrlData } = supabase.storage.from('company-documents').getPublicUrl(storagePath);

  const { data: newDoc, error: dbErr } = await supabase
    .from('company_documents')
    .insert([
      {
        company_id: companyId,
        document_type: documentType,
        bucket_name: 'company-documents',
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
 * List Company Documents
 */
const listCompanyDocuments = async (companyId) => {
  const { data: docs, error } = await supabase
    .from('company_documents')
    .select('*')
    .eq('company_id', companyId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return docs || [];
};

/**
 * Delete Company Document
 */
const deleteCompanyDocument = async (documentId) => {
  const { data: doc, error: fetchErr } = await supabase
    .from('company_documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (fetchErr || !doc) {
    const err = new Error('Company document not found.');
    err.statusCode = 404;
    throw err;
  }

  // Remove from Storage
  await supabase.storage.from('company-documents').remove([doc.storage_path]);

  // Remove from DB
  const { error: dbErr } = await supabase.from('company_documents').delete().eq('id', documentId);

  if (dbErr) {
    const err = new Error(dbErr.message);
    err.statusCode = 500;
    throw err;
  }

  return true;
};

/**
 * Get Complete Company Aggregated Profile
 */
const getCompanyProfile = async (companyId) => {
  const company = await getCompanyById(companyId);

  // Fetch Recruiters
  const { data: recruiters } = await supabase
    .from('recruiters')
    .select('*, users(full_name, email, phone, avatar_url)')
    .eq('company_id', companyId)
    .is('deleted_at', null);

  // Fetch HR Contacts
  const { data: contacts } = await supabase
    .from('company_contacts')
    .select('*')
    .eq('company_id', companyId);

  // Fetch Documents
  const { data: documents } = await supabase
    .from('company_documents')
    .select('*')
    .eq('company_id', companyId);

  // Fetch Eligible Branches
  const { data: eligibleBranches } = await supabase
    .from('company_eligible_branches')
    .select('id, branch_id, branches(id, name, code)')
    .eq('company_id', companyId);

  // Fetch Placement Drives
  const { data: drives } = await supabase
    .from('placement_drives')
    .select('*')
    .eq('company_id', companyId)
    .is('deleted_at', null);

  return {
    ...company,
    recruiters: recruiters || [],
    contacts: contacts || [],
    documents: documents || [],
    eligibleBranches: eligibleBranches || [],
    placementDrives: drives || [],
  };
};

/**
 * List Recruiters for Company
 */
const listRecruiters = async (companyId) => {
  const { data: recruiters, error } = await supabase
    .from('recruiters')
    .select('*, users(full_name, email, phone, avatar_url)')
    .eq('company_id', companyId)
    .is('deleted_at', null);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return recruiters || [];
};

/**
 * Create Recruiter User & Link to Company
 */
const createRecruiter = async (companyId, payload) => {
  await getCompanyById(companyId);

  const { email, password = 'Recruiter@Pass2026', full_name, designation, phone } = payload;

  // 1. Check existing user
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

  // 2. Register in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, role: 'recruiter' } },
  });

  if (authError) {
    const err = new Error(authError.message);
    err.statusCode = 400;
    throw err;
  }

  const userId = authData.user.id;
  const passwordHash = await bcrypt.hash(password, 10);

  // 3. Insert into public.users
  await supabase.from('users').insert([
    {
      id: userId,
      email,
      password_hash: passwordHash,
      full_name,
      role: 'recruiter',
      phone: phone || null,
      is_active: true,
    },
  ]);

  // 4. Insert into public.recruiters
  const { data: recruiter, error: recruiterErr } = await supabase
    .from('recruiters')
    .insert([
      {
        user_id: userId,
        company_id: companyId,
        designation,
        official_email: email,
        contact_number: phone || null,
      },
    ])
    .select('*')
    .single();

  if (recruiterErr) {
    const err = new Error(recruiterErr.message);
    err.statusCode = 500;
    throw err;
  }

  return recruiter;
};

/**
 * Update Recruiter details
 */
const updateRecruiter = async (recruiterId, payload) => {
  const { designation, contact_number } = payload;
  const updateFields = {};
  if (designation !== undefined) updateFields.designation = designation;
  if (contact_number !== undefined) updateFields.contact_number = contact_number;

  const { data: updatedRecruiter, error } = await supabase
    .from('recruiters')
    .update(updateFields)
    .eq('id', recruiterId)
    .select('*')
    .single();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return updatedRecruiter;
};

/**
 * Soft Delete Recruiter
 */
const deleteRecruiter = async (recruiterId) => {
  const { error } = await supabase
    .from('recruiters')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', recruiterId);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return true;
};

module.exports = {
  listCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  uploadCompanyLogo,
  uploadCompanyDocument,
  listCompanyDocuments,
  deleteCompanyDocument,
  getCompanyProfile,
  listRecruiters,
  createRecruiter,
  updateRecruiter,
  deleteRecruiter,
};
