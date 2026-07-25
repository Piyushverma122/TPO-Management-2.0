import apiClient from './axios';

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  user_id?: string;
  action?: string;
  module?: string;
}

export const getAdminSettings = async () => {
  const response = await apiClient.get('/admin/settings');
  return response.data;
};

export const updateAdminSettings = async (data: any) => {
  const response = await apiClient.put('/admin/settings', data);
  return response.data;
};

export const getAdminProfile = async () => {
  const response = await apiClient.get('/admin/profile');
  return response.data;
};

export const updateAdminProfile = async (data: { full_name?: string; email?: string; phone?: string }) => {
  const response = await apiClient.put('/admin/profile', data);
  return response.data;
};

export const changePassword = async (data: { currentPassword?: string; oldPassword?: string; newPassword?: string }) => {
  const response = await apiClient.post('/admin/change-password', data);
  return response.data;
};

export const getAuditLogs = async (params?: AuditLogQueryParams) => {
  const response = await apiClient.get('/admin/audit-logs', { params });
  return response.data;
};

export const getAuditLogById = async (id: string) => {
  const response = await apiClient.get(`/admin/audit-logs/${id}`);
  return response.data;
};

export const getSystemHealth = async () => {
  const response = await apiClient.get('/admin/system-health');
  return response.data;
};

export const getSystemStatistics = async () => {
  const response = await apiClient.get('/admin/system-statistics');
  return response.data;
};
