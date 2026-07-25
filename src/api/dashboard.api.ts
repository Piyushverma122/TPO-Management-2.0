import apiClient from './axios';

export interface AdminDashboardData {
  totalStudents: number;
  totalCompanies: number;
  totalDrives: number;
  totalPlacements: number;
  totalRecruiters: number;
  totalTrainings: number;
  activeUsers: number;
  upcomingDrives: any[];
  recentActivities: any[];
}

export interface TPODashboardData {
  activeDrives: number;
  pendingApplications: number;
  upcomingInterviews: any[];
  placementStatistics: {
    totalPlacements: number;
    highestPackage: number;
    averagePackage: number;
  };
  companyStatistics: {
    activeCompanies: number;
  };
  trainingStatistics: {
    activeTrainings: number;
  };
}

export interface StudentDashboardData {
  placementStatus: string;
  appliedDrives: any[];
  activeResume: any | null;
  notifications: any[];
  trainingEnrollments: any[];
}

export interface RecruiterDashboardData {
  companyName: string;
  activeDrives: number;
  applicationsReceived: number;
  shortlistedCandidates: number;
  selectedCandidates: number;
}

export interface FacultyDashboardData {
  activeTrainings: number;
  upcomingSessions: any[];
  totalPlacements: number;
}

export const getAdminDashboard = async () => {
  const response = await apiClient.get<{ success: boolean; data: { dashboard: AdminDashboardData } }>(
    '/dashboard/admin'
  );
  return response.data;
};

export const getTPODashboard = async () => {
  const response = await apiClient.get<{ success: boolean; data: { dashboard: TPODashboardData } }>(
    '/dashboard/tpo'
  );
  return response.data;
};

export const getStudentDashboard = async () => {
  const response = await apiClient.get<{ success: boolean; data: { dashboard: StudentDashboardData } }>(
    '/dashboard/student'
  );
  return response.data;
};

export const getRecruiterDashboard = async () => {
  const response = await apiClient.get<{ success: boolean; data: { dashboard: RecruiterDashboardData } }>(
    '/dashboard/recruiter'
  );
  return response.data;
};

export const getFacultyDashboard = async () => {
  const response = await apiClient.get<{ success: boolean; data: { dashboard: FacultyDashboardData } }>(
    '/dashboard/faculty'
  );
  return response.data;
};
