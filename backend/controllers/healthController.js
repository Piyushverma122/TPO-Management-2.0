const supabase = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * @desc    Health Check Endpoint & Supabase DB Status
 * @route   GET /api/v1/health
 * @access  Public
 */
const getHealthStatus = async (req, res) => {
  try {
    // Check Supabase database connectivity by selecting 1 row from users or system_settings
    const { count, error: dbError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (dbError) {
      return sendError(res, 'Database connection check failed', dbError.message, 503);
    }

    return sendSuccess(res, 'Smart Placement & TPO Portal Backend API is fully operational', {
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      databaseStatus: 'CONNECTED (Supabase PostgreSQL)',
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (err) {
    return sendError(res, 'Health check service exception', err.message, 500);
  }
};

module.exports = {
  getHealthStatus,
};
