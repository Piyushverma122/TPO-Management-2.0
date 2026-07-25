const supabase = require('../config/supabase');

/**
 * List Notifications for authenticated user
 */
const listNotifications = async (userId, queryParams) => {
  const page = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || 10;
  const offset = (page - 1) * limit;

  const { type, is_read } = queryParams;

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  if (type) query = query.eq('type', type);
  if (is_read !== undefined) query = query.eq('is_read', is_read === 'true');

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data: notifications, count, error } = await query;

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return {
    notifications: notifications || [],
    page,
    limit,
    total: count || 0,
  };
};

/**
 * Create Single Notification
 */
const createNotification = async ({ user_id, title, message, type = 'System Alert' }) => {
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert([
      {
        user_id,
        title,
        message,
        type,
        is_read: false,
        delivery_status: 'sent',
      },
    ])
    .select('*')
    .single();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return notification;
};

/**
 * Mark Notification as Read
 */
const markAsRead = async (notificationId, userId) => {
  const { data: updated, error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error || !updated) {
    const err = new Error('Notification not found.');
    err.statusCode = 404;
    throw err;
  }

  return updated;
};

/**
 * Mark All Notifications as Read for User
 */
const markAllAsRead = async (userId) => {
  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return true;
};

/**
 * Delete Notification
 */
const deleteNotification = async (notificationId, userId) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return true;
};

/**
 * Send Targeted Broadcast Announcement
 */
const broadcastNotification = async ({ target, target_id, title, message, type = 'System Alert' }) => {
  let targetUserIds = [];

  if (target === 'All Students') {
    const { data: students } = await supabase.from('students').select('user_id').is('deleted_at', null);
    targetUserIds = (students || []).map((s) => s.user_id);
  } else if (target === 'Branch' && target_id) {
    const { data: students } = await supabase.from('students').select('user_id').eq('branch_id', target_id).is('deleted_at', null);
    targetUserIds = (students || []).map((s) => s.user_id);
  } else if (target === 'Department' && target_id) {
    const { data: users } = await supabase.from('users').select('id').eq('department', target_id).eq('is_active', true);
    targetUserIds = (users || []).map((u) => u.id);
  } else if (target === 'Batch' && target_id) {
    const { data: students } = await supabase.from('students').select('user_id').eq('passing_year', parseInt(target_id)).is('deleted_at', null);
    targetUserIds = (students || []).map((s) => s.user_id);
  } else if (target === 'Company' && target_id) {
    const { data: recruiters } = await supabase.from('recruiters').select('user_id').eq('company_id', target_id).is('deleted_at', null);
    targetUserIds = (recruiters || []).map((r) => r.user_id);
  } else if (target === 'Recruiters') {
    const { data: recruiters } = await supabase.from('recruiters').select('user_id').is('deleted_at', null);
    targetUserIds = (recruiters || []).map((r) => r.user_id);
  }

  if (targetUserIds.length === 0) {
    return { count: 0, message: 'No target recipients matched criteria.' };
  }

  const notificationInserts = targetUserIds.map((uId) => ({
    user_id: uId,
    title,
    message,
    type,
    is_read: false,
    delivery_status: 'sent',
  }));

  const { data: inserted, error } = await supabase
    .from('notifications')
    .insert(notificationInserts)
    .select('id');

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return {
    count: inserted ? inserted.length : 0,
    target,
  };
};

/**
 * Get Notification & Email Delivery Statistics
 */
const getNotificationStatistics = async () => {
  const [
    { count: totalSent },
    { count: readCount },
    { count: unreadCount },
    { count: failedEmails },
    { count: pendingEmails },
  ] = await Promise.all([
    supabase.from('notifications').select('id', { count: 'exact', head: true }),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('is_read', true),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('is_read', false),
    supabase.from('email_logs').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('delivery_status', 'pending'),
  ]);

  return {
    totalSent: totalSent || 0,
    read: readCount || 0,
    unread: unreadCount || 0,
    failedEmails: failedEmails || 0,
    pendingEmails: pendingEmails || 0,
  };
};

/**
 * Get System Email Logs
 */
const getEmailLogs = async (queryParams) => {
  const page = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || 10;
  const offset = (page - 1) * limit;

  const { data: logs, count, error } = await supabase
    .from('email_logs')
    .select('*', { count: 'exact' })
    .order('sent_at', { ascending: false })
    .range(offset, offset + limit - 1);

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

module.exports = {
  listNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  broadcastNotification,
  getNotificationStatistics,
  getEmailLogs,
};
