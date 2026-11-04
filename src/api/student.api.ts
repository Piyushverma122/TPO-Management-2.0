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

/** The signed-in student edits their own (non-academic) details. */
export const updateMyProfile = async (data: Record<string, unknown>) => {
  const response = await apiClient.put('/students/profile', data);
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
  const response = await apiClient.get(`/students/${studentId}/resumes`);
  return response.data;
};

/** Short-lived signed link to a resume PDF (files are private). */
export const getResumeFileUrl = async (resumeId: string) => {
  const response = await apiClient.get<{ data: { url: string; file_name: string | null } }>(`/students/resume/${resumeId}/file`);
  return response.data.data;
};

export const deleteResume = async (resumeId: string) => {
  const response = await apiClient.delete(`/students/resume/${resumeId}`);
  return response.data;
};

export const uploadDocument = async (studentId: string, formData: FormData) => {
  const response = await apiClient.post(`/students/${studentId}/document`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getDocuments = async (studentId: string) => {
  const response = await apiClient.get(`/students/${studentId}/documents`);
  return response.data;
};

export const deleteDocument = async (documentId: string) => {
  const response = await apiClient.delete(`/students/document/${documentId}`);
  return response.data;
};

export interface OnboardingChecklistItem {
  key: string;
  label: string;
  done: boolean;
}

/** One student as staff see them: profile, onboarding, applications, interviews, offers, training and more. */
export interface StudentOverview {
  student: Record<string, any>;
  onboarding: { status: 'Completed' | 'Pending' | 'Not started'; completion: number; checklist: OnboardingChecklistItem[]; missing: string[] };
  skills: any[];
  semesters: any[];
  resumes: any[];
  documents: any[];
  applications: any[];
  interviews: { upcoming: any[]; live: any[]; past: any[] };
  drives: {
    applied: number;
    attended: number;
    selected: number;
    rejected: number;
    inProgress: number;
    byStatus: Record<string, number>;
    openNotApplied: { id: string; drive_code: string; role_title: string; ctc: number | string | null; registration_deadline: string; company?: { name: string; logo_url?: string | null }; eligible: boolean; reasons: string[] }[];
  };
  offers: any[];
  placement: { status: string; accepted: any | null; acceptedCount: number };
  training: { enrollments: any[]; certificates: any[]; attendance: { sessions: number; present: number; percentage: number | null } };
  notifications: any[];
  stats: { applications: number; interviews: number; upcomingInterviews: number; offers: number; resumes: number; documents: number; certificates: number };
}

export const getStudentOverview = async (id: string) => {
  const response = await apiClient.get<{ data: { overview: StudentOverview } }>(`/students/${id}/overview`);
  return response.data.data.overview;
};

/** Short-lived signed link to a student document (files are private). */
export const getDocumentFileUrl = async (documentId: string) => {
  const response = await apiClient.get<{ data: { url: string; file_name: string | null } }>(`/students/document/${documentId}/file`);
  return response.data.data;
};
