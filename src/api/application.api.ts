import apiClient from './axios';

export interface ApplicationQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  drive_id?: string;
  company_id?: string;
  student_id?: string;
  status?: string;
  branch_id?: string;
}

export interface ApplicationListResponse {
  success: boolean;
  message: string;
  data: {
    applications: any[];
    page: number;
    limit: number;
    total: number;
  };
}

export const getApplications = async (params?: ApplicationQueryParams) => {
  const response = await apiClient.get<ApplicationListResponse>('/applications', { params });
  return response.data;
};

export const getApplicationById = async (id: string) => {
  const response = await apiClient.get(`/applications/${id}`);
  return response.data;
};

export const applyForDrive = async (data: { drive_id: string; resume_id?: string }) => {
  const response = await apiClient.post('/applications', data);
  return response.data;
};

export const updateApplication = async (id: string, data: { status: string; remarks?: string }) => {
  const response = await apiClient.put(`/applications/${id}`, data);
  return response.data;
};

export const deleteApplication = async (id: string) => {
  const response = await apiClient.delete(`/applications/${id}`);
  return response.data;
};

export const withdrawApplication = async (id: string) => {
  const response = await apiClient.post(`/applications/${id}/withdraw`);
  return response.data;
};

export const bulkShortlist = async (data: { application_ids: string[] }) => {
  const response = await apiClient.post('/applications/bulk-shortlist', data);
  return response.data;
};

export const bulkReject = async (data: { application_ids: string[]; reason?: string }) => {
  const response = await apiClient.post('/applications/bulk-reject', data);
  return response.data;
};

export const scheduleInterview = async (id: string, data: { interview_date: string; mode: string; location_link: string }) => {
  const response = await apiClient.post(`/applications/${id}/schedule-interview`, data);
  return response.data;
};

export const uploadOffer = async (id: string, formData: FormData) => {
  const response = await apiClient.post(`/applications/${id}/upload-offer`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getApplicationStatistics = async () => {
  const response = await apiClient.get('/applications/statistics');
  return response.data;
};
