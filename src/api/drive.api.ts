import apiClient from './axios';

export type ApprovalStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected';
export type DriveStatus = 'Draft' | 'Upcoming' | 'Ongoing' | 'Conducted' | 'Completed';

export interface DriveProfile {
  id?: string;
  title: string;
  streams: string[];
  openings?: number | string | null;
  probation_months?: number | string | null;
  stipend_min?: number | string | null;
  stipend_max?: number | string | null;
  ctc_min?: number | string | null;
  ctc_max?: number | string | null;
  ppo_ctc_min?: number | string | null;
  ppo_ctc_max?: number | string | null;
  interview_mode?: 'Virtual' | 'Physical' | 'Hybrid' | '' | null;
  interview_location?: string | null;
  responsibilities?: string | null;
}

export interface DriveRound {
  name: string;
  mode?: string;
  notes?: string;
}

/** A drive as the API returns it (snake_case, with joined company, profiles and branches). */
export interface DriveRecord {
  id: string;
  drive_code: string;
  company_id: string;
  role_title: string;
  job_type: string;
  drive_mode: string;
  location: string | null;
  location_note: string | null;
  ctc: number | string | null;
  stipend: number | string | null;
  min_cgpa: number | string | null;
  max_backlogs: number | null;
  passing_year: number | null;
  total_openings: number | null;
  registration_deadline: string | null;
  drive_date: string | null;
  registration_link: string | null;
  rounds: (string | DriveRound)[] | null;
  description: string | null;
  bond_details: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  jd_name: string | null;
  jd_key: string | null;
  status: DriveStatus;
  approval_status: ApprovalStatus;
  rejection_reason: string | null;
  applied_count: number | null;
  shortlisted_count: number | null;
  selected_count: number | null;
  created_at: string;
  companies?: { id: string; name: string; logo_url?: string | null; industry?: string | null; website?: string | null; tier?: string | null };
  drive_profiles?: DriveProfile[];
  allowed_branches?: string[];
  drive_eligible_branches?: { branches: { id: string; name: string; code: string } }[];
  drive_eligible_departments?: { department_id: string }[];
}

export interface DriveQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  company_id?: string;
  status?: string;
  approval_status?: ApprovalStatus;
  job_type?: string;
  passing_year?: number | string;
}

export interface DriveListResponse {
  success: boolean;
  message: string;
  data: DriveRecord[];
  pagination: { currentPage: number; perPage: number; totalEntries: number; totalPages: number };
}

export interface DriveSummary {
  pending: number;
  live: number;
  upcoming: number;
  closed: number;
  rejected: number;
}

export interface DriveLookups {
  branches: { id: string; name: string; code: string; department_id: string }[];
  departments: { id: string; name: string; code: string }[];
  companies: { id: string; name: string; logo_url?: string | null }[];
}

export interface Eligibility {
  eligible: boolean;
  reasons: string[];
}

/** Payload for create/update. `submit` decides between saving a draft and sending/publishing. */
export interface DrivePayload {
  company_id?: string;
  job_type?: string;
  drive_mode?: string;
  location?: string;
  location_note?: string;
  min_cgpa?: number | string;
  max_backlogs?: number | string;
  passing_year?: number | string;
  registration_deadline?: string;
  drive_date?: string;
  registration_link?: string;
  rounds?: DriveRound[];
  description?: string;
  bond_details?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  status?: DriveStatus;
  profiles: DriveProfile[];
  branch_ids?: string[];
  department_ids?: string[];
  batches?: number[];
  submit?: boolean;
}

export const getDrives = async (params?: DriveQueryParams) => {
  const response = await apiClient.get<DriveListResponse>('/drives', { params });
  return response.data;
};

export const getDriveSummary = async () => {
  const response = await apiClient.get<{ data: { summary: DriveSummary } }>('/drives/summary');
  return response.data.data.summary;
};

export const getDriveLookups = async () => {
  const response = await apiClient.get<{ data: DriveLookups }>('/drives/lookups');
  return response.data.data;
};

export const getDriveById = async (id: string) => {
  const response = await apiClient.get<{ data: { drive: DriveRecord } }>(`/drives/${id}`);
  return response.data.data.drive;
};

export const getMyEligibility = async (id: string) => {
  const response = await apiClient.get<{ data: { eligibility: Eligibility } }>(`/drives/${id}/my-eligibility`);
  return response.data.data.eligibility;
};

export const createDrive = async (data: DrivePayload) => {
  const response = await apiClient.post<{ data: { drive: DriveRecord } }>('/drives', data);
  return response.data.data.drive;
};

export const updateDrive = async (id: string, data: Partial<DrivePayload>) => {
  const response = await apiClient.put<{ data: { drive: DriveRecord } }>(`/drives/${id}`, data);
  return response.data.data.drive;
};

export const deleteDrive = async (id: string) => {
  const response = await apiClient.delete(`/drives/${id}`);
  return response.data;
};

export const approveDrive = async (id: string) => {
  const response = await apiClient.post(`/drives/${id}/approve`);
  return response.data;
};

export const rejectDrive = async (id: string, reason: string) => {
  const response = await apiClient.post(`/drives/${id}/reject`, { reason });
  return response.data;
};

export const uploadDriveJd = async (id: string, file: File) => {
  const form = new FormData();
  form.append('jd', file);
  const response = await apiClient.post(`/drives/${id}/jd`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return response.data;
};

/** Short-lived signed link to the JD PDF. */
export const getDriveJdUrl = async (id: string) => {
  const response = await apiClient.get<{ data: { url: string; file_name: string | null } }>(`/drives/${id}/jd`);
  return response.data.data;
};
