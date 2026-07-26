/**
 * Centralized Backend Role-Based Access Control (RBAC) Configuration
 * TPO Management System 2.0
 */

// 1. Roles
const Role = {
  ADMIN: 'admin',
  TPO: 'tpo',
  FACULTY: 'faculty',
  STUDENT: 'student',
  RECRUITER: 'recruiter',
};

// 2. Modules
const Module = {
  DASHBOARD: 'dashboard',
  STUDENTS: 'students',
  COMPANIES: 'companies',
  PLACEMENT_DRIVES: 'placement_drives',
  APPLICATIONS: 'applications',
  INTERVIEWS: 'interviews',
  PLACEMENTS: 'placements',
  OFFER_LETTERS: 'offer_letters',
  TRAINING: 'training',
  REPORTS: 'reports',
  NOTIFICATIONS: 'notifications',
  USERS: 'users',
  SETTINGS: 'settings',
  PROFILE: 'profile',
};

// 3. Actions
const Action = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  APPROVE: 'approve',
  UPLOAD: 'upload',
  EXPORT: 'export',
  IMPORT: 'import',
  MANAGE: 'manage',
};

/**
 * Centralized Role Permission Matrix
 * Stores allowed actions per module for every application role.
 */
const ROLE_PERMISSIONS = {
  [Role.ADMIN]: {
    [Module.DASHBOARD]: { view: true, manage: true, export: true },
    [Module.STUDENTS]: { view: true, create: true, edit: true, delete: true, export: true, import: true, manage: true },
    [Module.COMPANIES]: { view: true, create: true, edit: true, delete: true, export: true, import: true, manage: true },
    [Module.PLACEMENT_DRIVES]: { view: true, create: true, edit: true, delete: true, approve: true, export: true, manage: true },
    [Module.APPLICATIONS]: { view: true, create: true, edit: true, delete: true, approve: true, export: true, manage: true },
    [Module.INTERVIEWS]: { view: true, create: true, edit: true, delete: true, approve: true, export: true, manage: true },
    [Module.PLACEMENTS]: { view: true, create: true, edit: true, delete: true, approve: true, export: true, manage: true },
    [Module.OFFER_LETTERS]: { view: true, upload: true, approve: true, delete: true, export: true, manage: true },
    [Module.TRAINING]: { view: true, create: true, edit: true, delete: true, export: true, manage: true },
    [Module.REPORTS]: { view: true, export: true, manage: true },
    [Module.NOTIFICATIONS]: { view: true, create: true, edit: true, delete: true, manage: true },
    [Module.USERS]: { view: true, create: true, edit: true, delete: true, manage: true },
    [Module.SETTINGS]: { view: true, edit: true, manage: true },
    [Module.PROFILE]: { view: true, edit: true, upload: true },
  },

  [Role.TPO]: {
    [Module.DASHBOARD]: { view: true, export: true },
    [Module.STUDENTS]: { view: true, create: true, edit: true, export: true, import: true },
    [Module.COMPANIES]: { view: true, create: true, edit: true, export: true },
    [Module.PLACEMENT_DRIVES]: { view: true, create: true, edit: true, approve: true, export: true },
    [Module.APPLICATIONS]: { view: true, edit: true, approve: true, export: true },
    [Module.INTERVIEWS]: { view: true, create: true, edit: true, approve: true, export: true },
    [Module.PLACEMENTS]: { view: true, create: true, edit: true, approve: true, export: true },
    [Module.OFFER_LETTERS]: { view: true, upload: true, approve: true, export: true },
    [Module.TRAINING]: { view: true, create: true, edit: true, export: true },
    [Module.REPORTS]: { view: true, export: true },
    [Module.NOTIFICATIONS]: { view: true, create: true },
    [Module.USERS]: { view: false },
    [Module.SETTINGS]: { view: false },
    [Module.PROFILE]: { view: true, edit: true, upload: true },
  },

  [Role.FACULTY]: {
    [Module.DASHBOARD]: { view: true },
    [Module.STUDENTS]: { view: true, export: true },
    [Module.COMPANIES]: { view: false },
    [Module.PLACEMENT_DRIVES]: { view: true },
    [Module.APPLICATIONS]: { view: true },
    [Module.INTERVIEWS]: { view: false },
    [Module.PLACEMENTS]: { view: false },
    [Module.OFFER_LETTERS]: { view: false },
    [Module.TRAINING]: { view: true, create: true, edit: true },
    [Module.REPORTS]: { view: true, export: true },
    [Module.NOTIFICATIONS]: { view: true },
    [Module.USERS]: { view: false },
    [Module.SETTINGS]: { view: false },
    [Module.PROFILE]: { view: true, edit: true, upload: true },
  },

  [Role.STUDENT]: {
    [Module.DASHBOARD]: { view: true },
    [Module.STUDENTS]: { view: true, create: false, edit: false, delete: false },
    [Module.COMPANIES]: { view: true, create: false, edit: false, delete: false },
    [Module.PLACEMENT_DRIVES]: { view: true },
    [Module.APPLICATIONS]: { view: true, create: true, edit: true, delete: true },
    [Module.INTERVIEWS]: { view: true },
    [Module.PLACEMENTS]: { view: true, create: false, edit: false, delete: false },
    [Module.OFFER_LETTERS]: { view: true, edit: true },
    [Module.TRAINING]: { view: true, create: true },
    [Module.REPORTS]: { view: false },
    [Module.NOTIFICATIONS]: { view: true, edit: true, delete: true },
    [Module.USERS]: { view: false },
    [Module.SETTINGS]: { view: false },
    [Module.PROFILE]: { view: true, edit: true, upload: true },
  },

  [Role.RECRUITER]: {
    [Module.DASHBOARD]: { view: true },
    [Module.STUDENTS]: { view: false },
    [Module.COMPANIES]: { view: true, edit: true },
    [Module.PLACEMENT_DRIVES]: { view: true, create: true, edit: true },
    [Module.APPLICATIONS]: { view: true, edit: true, approve: true, export: true },
    [Module.INTERVIEWS]: { view: true, create: true, edit: true },
    [Module.PLACEMENTS]: { view: false },
    [Module.OFFER_LETTERS]: { view: true, upload: true },
    [Module.TRAINING]: { view: false },
    [Module.REPORTS]: { view: true, export: true },
    [Module.NOTIFICATIONS]: { view: true },
    [Module.USERS]: { view: false },
    [Module.SETTINGS]: { view: false },
    [Module.PROFILE]: { view: true, edit: true, upload: true },
  },
};

/**
 * Normalizes input role string to matched Role
 */
const normalizeRole = (roleStr) => {
  if (!roleStr) return Role.STUDENT;
  const clean = roleStr.toString().toLowerCase().trim();

  if (clean === 'admin' || clean === 'tpo_admin' || clean === 'superadmin') return Role.ADMIN;
  if (clean === 'tpo' || clean === 'tpo_officer') return Role.TPO;
  if (clean === 'faculty' || clean === 'coordinator') return Role.FACULTY;
  if (clean === 'recruiter' || clean === 'hr') return Role.RECRUITER;
  if (clean === 'student') return Role.STUDENT;

  return Role.STUDENT;
};

/**
 * Check if a user's role matches required role(s)
 */
const hasRole = (userRole, requiredRole) => {
  if (!requiredRole) return true;
  const normalizedUserRole = normalizeRole(userRole);

  if (Array.isArray(requiredRole)) {
    const normalizedRequired = requiredRole.map((r) => normalizeRole(r));
    return normalizedRequired.includes(normalizedUserRole);
  }

  return normalizedUserRole === normalizeRole(requiredRole);
};

/**
 * Check if a user's role can perform an action on a module
 */
const canPerformAction = (userRole, moduleName, actionName) => {
  if (!moduleName || !actionName) return false;
  const role = normalizeRole(userRole);

  const modulePerms = ROLE_PERMISSIONS[role]?.[moduleName];
  if (!modulePerms) return false;

  // Manage action grants all sub-actions
  if (modulePerms[Action.MANAGE]) return true;

  return Boolean(modulePerms[actionName]);
};

/**
 * Check if a user's role can access/view a module
 */
const canAccessModule = (userRole, moduleName) => {
  return canPerformAction(userRole, moduleName, Action.VIEW);
};

module.exports = {
  Role,
  Module,
  Action,
  ROLE_PERMISSIONS,
  normalizeRole,
  hasRole,
  canPerformAction,
  canAccessModule,
};
