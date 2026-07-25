const { sendError } = require('../utils/responseHandler');

/**
 * 404 Catch-All Middleware
 */
const notFoundHandler = (req, res, next) => {
  return sendError(res, `Route non-existent: [${req.method}] ${req.originalUrl}`, null, 404);
};

/**
 * Global Express Error Handling Middleware
 */
const globalErrorHandler = (err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  return sendError(res, message, process.env.NODE_ENV === 'development' ? err.stack : null, statusCode);
};

module.exports = {
  notFoundHandler,
  globalErrorHandler,
};
