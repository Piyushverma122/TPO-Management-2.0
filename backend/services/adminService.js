const supabase = require('../config/supabase');

/**
 * List System Settings grouped by Category
 */
const listSettings = async () => {
  const { data: settings, error } = await supabase
    .from('system_settings')
    .select('*')
    .order('key', { ascending: true });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  // Group settings by category
  const groupedSettings = {};
  (settings || []).forEach((setting) => {
    const category = setting.category || 'General';
    if (!groupedSettings[category]) {
      groupedSettings[category] = [];
    }
    groupedSettings[category].push(setting);
  });

  return {
    rawSettings: settings || [],
    groupedSettings,
  };
};

/**
 * Update System Setting Value
 */
const updateSetting = async (key, value, userId) => {
  const { data: updated, error } = await supabase
    .from('system_settings')
    .update({
      value: String(value),
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('key', key)
    .select('*')
    .single();

  if (error || !updated) {
    const err = new Error('Setting key not found.');
    err.statusCode = 404;
    throw err;
  }

  return updated;
};

/**
 * Reset System Settings to defaults
 */
const resetSettings = async (userId) => {
  const defaultSettings = [
    { key: 'system_name', category: 'General', value: 'Smart Placement & TPO Management System', description: 'System Brand Title' },
    { key: 'academic_year', category: 'General', value: '2025-2026', description: 'Current Active Academic Session' },
    { key: 'allow_student_registration', category: 'Security', value: 'true', description: 'Enable Self Student Registration' },
    { key: 'max_active_applications', category: 'Placement', value: '5', description: 'Maximum Active Applications per Student' },
    { key: 'email_notifications_enabled', category: 'Email', value: 'true', description: 'Enable System Email Notifications' },
  ];

  for (let s of defaultSettings) {
    await supabase.from('system_settings').upsert({
      ...s,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    });
  }

  return listSettings();
};

/**
 * List Audit Logs with pagination & multi-filters
 */
const listAuditLogs = async (queryParams) => {
  const page = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || 15;
  const offset = (page - 1) * limit;

  const { user_id, action, category, start_date, end_date } = queryParams;

  let query = supabase
    .from('audit_logs')
    .select(
      `
      *,
      users (
        id,
        full_name,
        email,
        role
      )
    `,
      { count: 'exact' }
    );

  if (user_id) query = query.eq('user_id', user_id);
  if (action) query = query.ilike('action', `%${action}%`);
  if (category) query = query.eq('category', category);
  if (start_date) query = query.gte('created_at', start_date);
  if (end_date) query = query.lte('created_at', end_date);

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data: logs, count, error } = await query;

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return {
    logs: logs || [],
    page,
    limit,
    total: count || 0,
  };
};

/**
 * Get Audit Log Details by ID
 */
const getAuditLogById = async (auditId) => {
  const { data: log, error } = await supabase
    .from('audit_logs')
    .select(
      `
      *,
      users (
        id,
        full_name,
        email,
        role
      )
    `
    )
    .eq('id', auditId)
    .single();

  if (error || !log) {
    const err = new Error('Audit log record not found.');
    err.statusCode = 404;
    throw err;
  }

  return log;
};

/**
 * Get Audit Statistics
 */
const getAuditStatistics = async () => {
  const [
    { count: totalLogs },
    { data: recentLogs },
    { data: logs },
  ] = await Promise.all([
    supabase.from('audit_logs').select('id', { count: 'exact', head: true }),
    supabase
      .from('audit_logs')
      .select('id, action, category, created_at, users(full_name, role)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('audit_logs')
      .select('action, user_id, users(full_name)')
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  // Compute Most Active Users
  const userActivityMap = {};
  let failedActionsCount = 0;

  (logs || []).forEach((l) => {
    if (l.action && l.action.toLowerCase().includes('failed')) {
      failedActionsCount++;
    }
    const name = l.users?.full_name || 'System';
    userActivityMap[name] = (userActivityMap[name] || 0) + 1;
  });

  const mostActiveUsers = Object.entries(userActivityMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalLogs: totalLogs || 0,
    failedActionsCount,
    recentLogs: recentLogs || [],
    mostActiveUsers,
  };
};

module.exports = {
  listSettings,
  updateSetting,
  resetSettings,
  listAuditLogs,
  getAuditLogById,
  getAuditStatistics,
};
