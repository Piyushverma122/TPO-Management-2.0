/**
 * Role-Based Access Control (RBAC) Centralized Configuration
 * TPO Management System 2.0
 */

// 1. Application Roles
export enum Role {
  ADMIN = 'admin',
  TPO = 'tpo',
  FACULTY = 'faculty',
  STUDENT = 'student',
  RECRUITER = 'recruiter',
}

export type RoleType = Role | `${Role}` | string;

// 2. Application Modules
export enum Module {
  DASHBOARD = 'dashboard',
  STUDENTS = 'students',
  COMPANIES = 'companies',
  PLACEMENT_DRIVES = 'placement_drives',
  APPLICATIONS = 'applications',
  INTERVIEWS = 'interviews',
  PLACEMENTS = 'placements',
  OFFER_LETTERS = 'offer_letters',
  TRAINING = 'training',
  REPORTS = 'reports',
  NOTIFICATIONS = 'notifications',
  USERS = 'users',
  SETTINGS = 'settings',
  PROFILE = 'profile',
}

export type ModuleType = Module | `${Module}`;

// 3. Application Actions / Permissions
export enum Action {
  VIEW = 'view',
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
  APPROVE = 'approve',
  UPLOAD = 'upload',
  EXPORT = 'export',
  IMPORT = 'import',
  MANAGE = 'manage',
}

export type ActionType = Action | `${Action}`;

// Permission Map per Module
export type ModulePermissions = Partial<Record<Action, boolean>>;

// Full Role Permission Matrix
export type RolePermissionsMatrix = Record<Role, Partial<Record<Module, ModulePermissions>>>;

/**
 * Centralized Role Permission Matrix
 * Stores allowed actions per module for every application role.
 */
export const ROLE_PERMISSIONS: RolePermissionsMatrix = {
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
    [Module.STUDENTS]: { view: false },
    [Module.COMPANIES]: { view: false },
    [Module.PLACEMENT_DRIVES]: { view: true },
    [Module.APPLICATIONS]: { view: true, create: true, edit: true, delete: true },
    [Module.INTERVIEWS]: { view: true },
    [Module.PLACEMENTS]: { view: false },
    [Module.OFFER_LETTERS]: { view: true },
    [Module.TRAINING]: { view: true },
    [Module.REPORTS]: { view: false },
    [Module.NOTIFICATIONS]: { view: true },
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
 * Normalizes input role string to matched Role enum
 */
export const normalizeRole = (roleStr?: RoleType | null): Role => {
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
 * Utility Function 1: hasRole()
 * Check if a user's role matches a target role or any role in a given array of roles.
 */
export const hasRole = (userRole?: RoleType | null, requiredRole?: RoleType | RoleType[]): boolean => {
  if (!requiredRole) return true;
  const normalizedUserRole = normalizeRole(userRole);

  if (Array.isArray(requiredRole)) {
    const normalizedRequired = requiredRole.map((r) => normalizeRole(r));
    return normalizedRequired.includes(normalizedUserRole);
  }

  return normalizedUserRole === normalizeRole(requiredRole);
};

/**
 * Utility Function 2: hasPermission()
 * Check if a role has permission to perform a specific action on a module.
 */
export const hasPermission = (
  userRole?: RoleType | null,
  module?: ModuleType,
  action?: ActionType
): boolean => {
  if (!module || !action) return false;
  const role = normalizeRole(userRole);

  const modulePerms = ROLE_PERMISSIONS[role]?.[module as Module];
  if (!modulePerms) return false;

  // Manage action grants all sub-actions
  if (modulePerms[Action.MANAGE]) return true;

  return Boolean(modulePerms[action as Action]);
};

/**
 * Utility Function 3: canAccessModule()
 * Check if a role has View access to a specific module.
 */
export const canAccessModule = (userRole?: RoleType | null, module?: ModuleType): boolean => {
  return hasPermission(userRole, module, Action.VIEW);
};

/**
 * Utility Function 4: canPerformAction()
 * Alias for hasPermission to check action capability on a module.
 */
export const canPerformAction = (
  userRole?: RoleType | null,
  module?: ModuleType,
  action?: ActionType
): boolean => {
  return hasPermission(userRole, module, action);
};
