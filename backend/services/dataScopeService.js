const supabase = require('../config/supabase');
const { Role, normalizeRole } = require('../config/rbac');

/**
 * Log Ownership Violation to audit_logs table
 */
const logOwnershipViolation = async (user, resource, resourceId, attemptedAction, reason) => {
  try {
    const userId = user?.id || user?.userId || null;
    const role = user?.role || 'anonymous';

    await supabase.from('audit_logs').insert([
      {
        user_id: userId,
        action: 'OWNERSHIP_VIOLATION',
        category: 'Data Ownership & Security',
        details: `Access Denied: Role [${role}] attempted [${attemptedAction}] on [${resource}:${resourceId || 'ALL'}]. ${reason || ''}`,
      },
    ]);
  } catch (err) {
    console.warn('[DataScope Audit Log Failure]', err.message);
  }
};

/**
 * Helper: Resolve student record ID from logged-in user
 */
const getStudentIdForUser = async (userId) => {
  if (!userId) return null;
  const { data } = await supabase
    .from('students')
    .select('id, branch_id')
    .eq('user_id', userId)
    .maybeSingle();
  return data || null;
};

/**
 * Helper: Resolve recruiter company ID from logged-in user
 */
const getCompanyIdForRecruiter = async (userId) => {
  if (!userId) return null;
  const { data } = await supabase
    .from('company_contacts')
    .select('company_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (data?.company_id) return data.company_id;

  const { data: userRow } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', userId)
    .maybeSingle();

  return userRow?.company_id || null;
};

/**
 * Helper: Resolve scope context IDs (student ID, company ID, branch IDs) prior to query building
 */
const resolveScopeContext = async (user) => {
  if (!user) return {};
  const role = normalizeRole(user?.role);
  const userId = user?.id || user?.userId;

  const context = { role, userId };

  if (role === Role.ADMIN || role === Role.TPO) {
    return context;
  }

  if (role === Role.STUDENT && userId) {
    const studentData = await getStudentIdForUser(userId);
    context.studentId = studentData?.id || userId;
  } else if (role === Role.RECRUITER && userId) {
    const companyId = await getCompanyIdForRecruiter(userId);
    context.companyId = companyId || null;
    if (companyId) {
      const { data: companyDrives } = await supabase
        .from('placement_drives')
        .select('id')
        .eq('company_id', companyId);
      context.driveIds = (companyDrives || []).map((d) => d.id);
    }
  } else if (role === Role.FACULTY) {
    const userDept = user?.department || user?.branch_id;
    context.userDept = userDept || null;
    if (userDept) {
      const { data: deptStudents } = await supabase
        .from('students')
        .select('id')
        .eq('branch_id', userDept);
      context.studentIds = (deptStudents || []).map((s) => s.id);
    }
  }

  return context;
};

/**
 * Apply Data Scope filters synchronously directly to a Supabase PostgREST Query.
 * Guaranteed NOT to trigger premature Promise/thenable unwrapping.
 */
const applyDataScope = (query, user, resourceType, scopeContext = null) => {
  if (!user || !query) return query;
  const role = normalizeRole(user?.role);
  const userId = user?.id || user?.userId;

  // Admin & TPO: full college scope (unrestricted)
  if (role === Role.ADMIN || role === Role.TPO) {
    return query;
  }

  // 1. STUDENT SCOPE
  if (role === Role.STUDENT) {
    const studentId = scopeContext?.studentId || userId;

    if (resourceType === 'students' || resourceType === 'profile') {
      return query.eq('user_id', userId);
    }
    if (resourceType === 'applications') {
      return query.eq('student_id', studentId);
    }
    if (resourceType === 'placements') {
      return query.eq('student_id', studentId);
    }
    if (resourceType === 'resumes') {
      return query.eq('student_id', studentId);
    }
    if (resourceType === 'notifications') {
      return query.eq('user_id', userId);
    }
    if (resourceType === 'training') {
      return query.eq('student_id', studentId);
    }
  }

  // 2. RECRUITER SCOPE
  if (role === Role.RECRUITER) {
    const companyId = scopeContext?.companyId;

    if (!companyId) {
      return query.eq('id', '00000000-0000-0000-0000-000000000000');
    }

    if (resourceType === 'companies') {
      return query.eq('id', companyId);
    }
    if (resourceType === 'drives') {
      return query.eq('company_id', companyId);
    }
    if (resourceType === 'applications') {
      const driveIds = scopeContext?.driveIds || [];
      if (driveIds.length > 0) {
        return query.in('drive_id', driveIds);
      }
      return query.eq('id', '00000000-0000-0000-0000-000000000000');
    }
    if (resourceType === 'placements') {
      return query.eq('company_id', companyId);
    }
  }

  // 3. FACULTY SCOPE
  if (role === Role.FACULTY) {
    const userDept = scopeContext?.userDept || user?.department || user?.branch_id;

    if (resourceType === 'students' && userDept) {
      return query.eq('branch_id', userDept);
    }
    if (resourceType === 'applications' && userDept) {
      const studentIds = scopeContext?.studentIds || [];
      if (studentIds.length > 0) {
        return query.in('student_id', studentIds);
      }
      return query.eq('id', '00000000-0000-0000-0000-000000000000');
    }
  }

  return query;
};

/**
 * Validate ownership of a specific single record ID before view/update/delete
 */
const validateOwnership = async (user, resourceType, recordId, attemptedAction = 'ACCESS') => {
  if (!user) return true;
  const role = normalizeRole(user?.role);
  const userId = user?.id || user?.userId;

  // Admin & TPO have full access
  if (role === Role.ADMIN || role === Role.TPO) {
    return true;
  }

  // STUDENT OWNERSHIP VALIDATION
  if (role === Role.STUDENT) {
    const studentData = await getStudentIdForUser(userId);
    const studentId = studentData?.id || userId;

    if (resourceType === 'students') {
      if (recordId !== studentId && recordId !== userId) {
        await logOwnershipViolation(user, resourceType, recordId, attemptedAction, 'Student cannot access another student profile');
        return false;
      }
    }

    if (resourceType === 'applications') {
      const { data } = await supabase.from('drive_applications').select('student_id').eq('id', recordId).maybeSingle();
      if (data && data.student_id !== studentId) {
        await logOwnershipViolation(user, resourceType, recordId, attemptedAction, 'Student cannot access application belonging to another candidate');
        return false;
      }
    }

    if (resourceType === 'resumes') {
      const { data } = await supabase.from('resumes').select('student_id').eq('id', recordId).maybeSingle();
      if (data && data.student_id !== studentId) {
        await logOwnershipViolation(user, resourceType, recordId, attemptedAction, 'Student cannot access resume of another candidate');
        return false;
      }
    }
  }

  // RECRUITER OWNERSHIP VALIDATION
  if (role === Role.RECRUITER) {
    const companyId = await getCompanyIdForRecruiter(userId);

    if (resourceType === 'companies' && recordId !== companyId) {
      await logOwnershipViolation(user, resourceType, recordId, attemptedAction, 'Recruiter cannot access another company profile');
      return false;
    }

    if (resourceType === 'drives') {
      const { data } = await supabase.from('placement_drives').select('company_id').eq('id', recordId).maybeSingle();
      if (data && data.company_id !== companyId) {
        await logOwnershipViolation(user, resourceType, recordId, attemptedAction, 'Recruiter cannot access drive of another company');
        return false;
      }
    }
  }

  return true;
};

module.exports = {
  resolveScopeContext,
  applyDataScope,
  validateOwnership,
  logOwnershipViolation,
  getStudentIdForUser,
  getCompanyIdForRecruiter,
};
