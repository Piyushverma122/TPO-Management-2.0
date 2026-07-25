import apiClient from './axios';

export interface StudentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  branch_id?: string;
  department?: string;
  passing_year?: number | string;
  placement_status?: string;
  skill?: string;
  cgpa_min?: number;
  cgpa_max?: number;
}

export interface StudentListResponse {
  success: boolean;
  message: string;
  data: {
    students: any[];
    page: number;
    limit: number;
    total: number;
  };
}

export const getStudents = async (params?: StudentQueryParams) => {
  const response = await apiClient.get<StudentListResponse>('/students', { params });
  return response.data;
};

export const getStudentById = async (id: string) => {
  const response = await apiClient.get(`/students/${id}`);
  return response.data;
};

export const createStudent = async (data: any) => {
  const response = await apiClient.post('/students', data);
  return response.data;
};

export const updateStudent = async (id: string, data: any) => {
  const response = await apiClient.put(`/students/${id}`, data);
  return response.data;
};

export const deleteStudent = async (id: string) => {
  const response = await apiClient.delete(`/students/${id}`);
  return response.data;
};

export const getStudentProfile = async () => {
  const response = await apiClient.get('/students/profile');
  return response.data;
};

export const uploadResume = async (studentId: string, formData: FormData) => {
  const response = await apiClient.post(`/students/${studentId}/resume`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getResumes = async (studentId: string) => {
  const response = await apiClient.get(`/students/${studentId}/resume`);
  return response.data;
};

export const deleteResume = async (studentId: string, resumeId: string) => {
  const response = await apiClient.delete(`/students/${studentId}/resume/${resumeId}`);
  return response.data;
};

export const uploadDocument = async (studentId: string, formData: FormData) => {
  const response = await apiClient.post(`/students/${studentId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getDocuments = async (studentId: string) => {
  const response = await apiClient.get(`/students/${studentId}/documents`);
  return response.data;
};

export const deleteDocument = async (studentId: string, documentId: string) => {
  const response = await apiClient.delete(`/students/${studentId}/documents/${documentId}`);
  return response.data;
};
