/**
 * Standardized REST API Success Response Formatter
 */
const sendSuccess = (res, message = 'Success', data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Standardized REST API Error Response Formatter
 */
const sendError = (res, message = 'An error occurred', error = null, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error ? (typeof error === 'string' ? error : error.message || error) : null,
  });
};

/**
 * Standardized REST API Paginated Response Formatter
 */
const sendPaginated = (res, message = 'Success', data = [], page = 1, limit = 10, total = 0, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination: {
      currentPage: Number(page),
      perPage: Number(limit),
      totalEntries: Number(total),
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendPaginated,
};
