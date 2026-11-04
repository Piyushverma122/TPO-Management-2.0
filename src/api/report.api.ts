import apiClient from './axios';

/** Filters shared by the dashboard and every export. All optional. */
export interface ReportFilters {
  batch?: string;
  department_id?: string;
  branch_id?: string;
  from?: string; // yyyy-mm-dd
  to?: string;
}

export type ExportFormat = 'pdf' | 'excel' | 'csv';
export type ReportType = 'summary' | 'placements' | 'students' | 'companies' | 'drives' | 'trainings';

export interface ReportDashboard {
  filters: Record<string, string | null>;
  scope: 'college' | 'company';
  generatedAt: string;
  kpis: {
    totalStudents: number | null;
    placedStudents: number;
    placementRate: number | null;
    highestPackage: number;
    averagePackage: number;
    medianPackage: number;
    companiesHiring: number;
    totalDrives: number;
    openDrives: number;
    pendingDriveApprovals: number;
    offersAwaitingReply: number;
    offersAwaitingApproval: number;
    totalApplications: number;
    upcomingInterviews: number;
  };
  trend: { month: string; placed: number; cumulative: number }[];
  byDepartment: { name: string; count: number }[];
  byBranch: { name: string; count: number }[];
  byBatch: { name: string; count: number }[];
  topRecruiters: { name: string; tier: string | null; placed: number; averagePackage: number; highestPackage: number }[];
  packageDistribution: { name: string; count: number }[];
  funnel: { stage: string; count: number }[];
  interviewOutcomes: { name: string; count: number }[];
  drivesByStatus: { name: string; count: number }[];
  training: { enrolled: number; completed: number; completionRate: number; averageProgress: number } | null;
  latestPlacements: { id: string; student: string; branch: string; company: string; role: string; package: number; date: string }[];
}

const clean = (filters: ReportFilters) => Object.fromEntries(Object.entries(filters).filter(([, v]) => v));

export const getReportDashboard = async (filters: ReportFilters = {}) => {
  const response = await apiClient.get<{ data: ReportDashboard }>('/reports/dashboard', { params: clean(filters) });
  return response.data.data;
};

/** Downloads a real PDF / Excel / CSV file built by the server. */
export const downloadReport = async (format: ExportFormat, type: ReportType, filters: ReportFilters = {}) => {
  const response = await apiClient.get(`/reports/export/${format}`, { params: { type, ...clean(filters) }, responseType: 'blob' });
  const disposition: string = response.headers['content-disposition'] || '';
  const filename = /filename="?([^";]+)"?/i.exec(disposition)?.[1] || `report.${format === 'excel' ? 'xlsx' : format}`;

  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return filename;
};
