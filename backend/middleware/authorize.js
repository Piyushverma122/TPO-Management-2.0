const { canPerformAction, hasRole } = require('../config/rbac');
const { supabaseAdmin } = require('../config/supabase');

/**
 * Log Authorization Failure to audit_logs table
 */
const logAuthFailure = async (req, moduleName, actionName, reason) => {
  try {
    const userId = req.user?.id || req.user?.userId || null;
    const role = req.user?.role || 'anonymous';
    const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1';
    const endpoint = req.originalUrl || req.url;

    await supabaseAdmin.from('audit_logs').insert([
      {
        user_id: userId,
        action: 'ACCESS_DENIED',
        category: 'Security / RBAC',
        details: `403 Forbidden: User role [${role}] denied ${actionName} on module [${moduleName}]. ${reason || ''} (Endpoint: ${endpoint}, IP: ${ipAddress})`,
      },
    ]);
  } catch (err) {
    console.warn('[RBAC Audit Log Fallback]', err.message);
  }
};

/**
 * Middleware 1: authorizeModule(module, action)
 * Validates module action permission using backend RBAC configuration.
 */
const authorizeModule = (moduleName, actionName) => {
  return async (req, res, next) => {
    // Read logged-in user role
    const userRole = req.user?.role;

    if (!userRole) {
      await logAuthFailure(req, moduleName, actionName, 'No authenticated user session found');
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
      });
    }

    // Check permission via central RBAC matrix
    const isAllowed = canPerformAction(userRole, moduleName, actionName);

    if (!isAllowed) {
      await logAuthFailure(req, moduleName, actionName, `Role [${userRole}] lacks permission`);
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
      });
    }

    next();
  };
};

/**
 * Middleware 2: authorizeRole(...roles)
 * Validates whether the logged-in user's role matches any of the specified roles.
 */
const authorizeRole = (...allowedRoles) => {
  return async (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole) {
      await logAuthFailure(req, 'RBAC_ROLE', 'ROLE_CHECK', 'No user session');
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
      });
    }

    const isAllowed = hasRole(userRole, allowedRoles);

    if (!isAllowed) {
      await logAuthFailure(req, 'RBAC_ROLE', 'ROLE_CHECK', `Role [${userRole}] not in allowed list [${allowedRoles.join(', ')}]`);
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
      });
    }

    next();
  };
};

module.exports = {
  authorizeModule,
  authorizeRole,
  logAuthFailure,
};
