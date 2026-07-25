import apiClient from './axios';

export interface CompanyQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  tier?: string;
  industry?: string;
  status?: string;
}

export interface CompanyListResponse {
  success: boolean;
  message: string;
  data: {
    companies: any[];
    page: number;
    limit: number;
    total: number;
  };
}

export const getCompanies = async (params?: CompanyQueryParams) => {
  const response = await apiClient.get<CompanyListResponse>('/companies', { params });
  return response.data;
};

export const getCompanyById = async (id: string) => {
  const response = await apiClient.get(`/companies/${id}`);
  return response.data;
};

export const createCompany = async (data: any) => {
  const response = await apiClient.post('/companies', data);
  return response.data;
};

export const updateCompany = async (id: string, data: any) => {
  const response = await apiClient.put(`/companies/${id}`, data);
  return response.data;
};

export const deleteCompany = async (id: string) => {
  const response = await apiClient.delete(`/companies/${id}`);
  return response.data;
};

export const getCompanyProfile = async (id: string) => {
  const response = await apiClient.get(`/companies/${id}/profile`);
  return response.data;
};

export const uploadCompanyLogo = async (companyId: string, formData: FormData) => {
  const response = await apiClient.post(`/companies/${companyId}/logo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const uploadCompanyDocument = async (companyId: string, formData: FormData) => {
  const response = await apiClient.post(`/companies/${companyId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getCompanyDocuments = async (companyId: string) => {
  const response = await apiClient.get(`/companies/${companyId}/documents`);
  return response.data;
};

export const deleteCompanyDocument = async (companyId: string, documentId: string) => {
  const response = await apiClient.delete(`/companies/${companyId}/documents/${documentId}`);
  return response.data;
};

// Recruiter API Endpoints
export const getRecruiters = async (params?: any) => {
  const response = await apiClient.get('/recruiters', { params });
  return response.data;
};

export const getRecruiterById = async (id: string) => {
  const response = await apiClient.get(`/recruiters/${id}`);
  return response.data;
};

export const createRecruiter = async (data: any) => {
  const response = await apiClient.post('/recruiters', data);
  return response.data;
};

export const updateRecruiter = async (id: string, data: any) => {
  const response = await apiClient.put(`/recruiters/${id}`, data);
  return response.data;
};

export const deleteRecruiter = async (id: string) => {
  const response = await apiClient.delete(`/recruiters/${id}`);
  return response.data;
};
