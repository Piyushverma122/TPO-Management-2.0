import apiClient from './axios';

export interface TrainingQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
}

export interface TrainingListResponse {
  success: boolean;
  message: string;
  data: {
    trainings: any[];
    page: number;
    limit: number;
    total: number;
  };
}

export const getTrainings = async (params?: TrainingQueryParams) => {
  const response = await apiClient.get<TrainingListResponse>('/trainings', { params });
  return response.data;
};

export const getTrainingById = async (id: string) => {
  const response = await apiClient.get(`/trainings/${id}`);
  return response.data;
};

export const createTraining = async (data: any) => {
  const response = await apiClient.post('/trainings', data);
  return response.data;
};

export const updateTraining = async (id: string, data: any) => {
  const response = await apiClient.put(`/trainings/${id}`, data);
  return response.data;
};

export const deleteTraining = async (id: string) => {
  const response = await apiClient.delete(`/trainings/${id}`);
  return response.data;
};

export const enrollTraining = async (id: string) => {
  const response = await apiClient.post(`/trainings/${id}/enroll`);
  return response.data;
};

export const markAttendance = async (id: string, data: { student_id: string; status: string }) => {
  const response = await apiClient.post(`/trainings/${id}/attendance`, data);
  return response.data;
};

export const uploadTrainingMaterial = async (id: string, formData: FormData) => {
  const response = await apiClient.post(`/trainings/${id}/material`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getTrainingMaterials = async (id: string) => {
  const response = await apiClient.get(`/trainings/${id}/materials`);
  return response.data;
};

export const uploadCertificate = async (id: string, formData: FormData) => {
  const response = await apiClient.post(`/trainings/${id}/certificate`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getTrainingStatistics = async () => {
  const response = await apiClient.get('/trainings/statistics');
  return response.data;
};
