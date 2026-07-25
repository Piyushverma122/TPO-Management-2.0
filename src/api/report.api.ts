import apiClient from './axios';

export interface ReportQueryParams {
  department?: string;
  branch?: string;
  batch?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
}

export const getDashboardReport = async (params?: ReportQueryParams) => {
  const response = await apiClient.get('/reports/dashboard', { params });
  return response.data;
};

export const getPlacementReport = async (params?: ReportQueryParams) => {
  const response = await apiClient.get('/reports/placements', { params });
  return response.data;
};

export const getDriveReport = async (params?: ReportQueryParams) => {
  const response = await apiClient.get('/reports/drives', { params });
  return response.data;
};

export const getStudentReport = async (params?: ReportQueryParams) => {
  const response = await apiClient.get('/reports/students', { params });
  return response.data;
};

export const getCompanyReport = async (params?: ReportQueryParams) => {
  const response = await apiClient.get('/reports/companies', { params });
  return response.data;
};

export const getTrainingReport = async (params?: ReportQueryParams) => {
  const response = await apiClient.get('/reports/trainings', { params });
  return response.data;
};

export const exportPDF = async (params?: ReportQueryParams) => {
  const response = await apiClient.get('/reports/export/pdf', {
    params,
    responseType: 'blob',
  });
  return response.data;
};

export const exportExcel = async (params?: ReportQueryParams) => {
  const response = await apiClient.get('/reports/export/excel', {
    params,
    responseType: 'blob',
  });
  return response.data;
};

export const exportCSV = async (params?: ReportQueryParams) => {
  const response = await apiClient.get('/reports/export/csv', {
    params,
    responseType: 'blob',
  });
  return response.data;
};
