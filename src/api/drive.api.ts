import apiClient from './axios';

export interface DriveQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  company_id?: string;
  status?: string;
  job_type?: string;
  passing_year?: number | string;
}

export interface DriveListResponse {
  success: boolean;
  message: string;
  data: {
    drives: any[];
    page: number;
    limit: number;
    total: number;
  };
}

export const getDrives = async (params?: DriveQueryParams) => {
  const response = await apiClient.get<DriveListResponse>('/drives', { params });
  return response.data;
};

export const getDriveById = async (id: string) => {
  const response = await apiClient.get(`/drives/${id}`);
  return response.data;
};

export const createDrive = async (data: any) => {
  const response = await apiClient.post('/drives', data);
  return response.data;
};

export const updateDrive = async (id: string, data: any) => {
  const response = await apiClient.put(`/drives/${id}`, data);
  return response.data;
};

export const deleteDrive = async (id: string) => {
  const response = await apiClient.delete(`/drives/${id}`);
  return response.data;
};

export const getDriveProfile = async (id: string) => {
  const response = await apiClient.get(`/drives/${id}/profile`);
  return response.data;
};

export const getDriveStatistics = async (id: string) => {
  const response = await apiClient.get(`/drives/${id}/statistics`);
  return response.data;
};
