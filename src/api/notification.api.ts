import apiClient from './axios';

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  is_read?: boolean;
  category?: string;
}

export interface NotificationListResponse {
  success: boolean;
  message: string;
  data: {
    notifications: any[];
    page: number;
    limit: number;
    total: number;
    unreadCount: number;
  };
}

export const getNotifications = async (params?: NotificationQueryParams) => {
  const response = await apiClient.get<NotificationListResponse>('/notifications', { params });
  return response.data;
};

export const createNotification = async (data: any) => {
  const response = await apiClient.post('/notifications', data);
  return response.data;
};

export const markNotificationRead = async (id: string) => {
  const response = await apiClient.put(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await apiClient.put('/notifications/read-all');
  return response.data;
};

export const deleteNotification = async (id: string) => {
  const response = await apiClient.delete(`/notifications/${id}`);
  return response.data;
};

export const broadcastNotification = async (data: { title: string; message: string; target_group?: string }) => {
  const response = await apiClient.post('/notifications/broadcast', data);
  return response.data;
};

export const getNotificationStatistics = async () => {
  const response = await apiClient.get('/notifications/statistics');
  return response.data;
};

export const getEmailLogs = async (params?: any) => {
  const response = await apiClient.get('/notifications/email/logs', { params });
  return response.data;
};
