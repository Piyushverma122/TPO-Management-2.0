import apiClient from './axios';

export interface PlacementQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  student_id?: string;
  company_id?: string;
  drive_id?: string;
  job_type?: string;
  batch?: string;
}

export interface PlacementListResponse {
  success: boolean;
  message: string;
  data: {
    placements: any[];
    page: number;
    limit: number;
    total: number;
  };
}

export const getPlacements = async (params?: PlacementQueryParams) => {
  const response = await apiClient.get<PlacementListResponse>('/placements', { params });
  return response.data;
};

export const getPlacementById = async (id: string) => {
  const response = await apiClient.get(`/placements/${id}`);
  return response.data;
};

export const createPlacement = async (data: any) => {
  const response = await apiClient.post('/placements', data);
  return response.data;
};

export const updatePlacement = async (id: string, data: any) => {
  const response = await apiClient.put(`/placements/${id}`, data);
  return response.data;
};

export const deletePlacement = async (id: string) => {
  const response = await apiClient.delete(`/placements/${id}`);
  return response.data;
};

export const getPlacementStatistics = async () => {
  const response = await apiClient.get('/placements/statistics');
  return response.data;
};

export const getStudentPlacementHistory = async (studentId: string) => {
  const response = await apiClient.get(`/placements/student/${studentId}`);
  return response.data;
};

export const getCompanyPlacementHistory = async (companyId: string) => {
  const response = await apiClient.get(`/placements/company/${companyId}`);
  return response.data;
};
