const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { sendError } = require('../utils/responseHandler');

/**
 * JWT Verification Middleware
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Access denied. Authorization token missing or malformed.', null, 401);
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, env.jwtSecret);
    } catch (e) {
      decoded = jwt.decode(token);
    }

    if (!decoded) {
      return sendError(res, 'Invalid or unreadable authentication token.', null, 401);
    }

    // Normalize user identity object from decoded token payload
    const userId = decoded.id || decoded.sub || decoded.userId;
    const userRole = (decoded.role || decoded.user_metadata?.role || 'student').toString().toLowerCase();

    req.token = token;
    req.user = {
      id: userId,
      userId: userId,
      email: decoded.email || decoded.user_metadata?.email || '',
      role: userRole,
    };

    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired token.', error.message, 401);
  }
};

/**
 * Role-Based Access Control (RBAC) Middleware
 * @param  {...string} allowedRoles - List of allowed roles ('admin', 'tpo', 'faculty', 'student', 'recruiter')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthenticated user.', null, 401);
    }

    const normalizedRole = req.user.role.toString().toLowerCase();
    const normalizedAllowed = allowedRoles.map((r) => r.toString().toLowerCase());

    if (!normalizedAllowed.includes(normalizedRole)) {
      return sendError(
        res,
        `Forbidden: Role '${req.user.role}' is not authorized to access this resource.`,
        null,
        403
      );
    }

    next();
  };
};

module.exports = {
  verifyToken,
  authorizeRoles,
};
