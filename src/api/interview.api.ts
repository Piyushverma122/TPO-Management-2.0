import apiClient from './axios';
import type { Interview, InterviewMode, InterviewStatus } from '../types';

/** upcoming = not started, live = happening now, awaiting = ended without a result, history = finished */
export type InterviewView = 'upcoming' | 'live' | 'awaiting' | 'history';

export interface InterviewSummary {
  upcoming: number;
  live: number;
  awaiting: number;
  history: number;
  today: number;
  passed: number;
}

export interface InterviewQueryParams {
  page?: number;
  limit?: number;
  status?: InterviewStatus;
  company_id?: string;
  drive_id?: string;
  student_id?: string;
  from?: string;
  to?: string;
  upcoming?: boolean;
  view?: InterviewView;
  search?: string;
}

export interface InterviewListResponse {
  success: boolean;
  message: string;
  data: Interview[];
  pagination: { currentPage: number; perPage: number; totalEntries: number; totalPages: number };
}

export interface InterviewSlotPayload {
  round_name?: string;
  scheduled_at?: string;
  end_at?: string;
  mode?: InterviewMode;
  meeting_url?: string;
  venue?: string;
  interviewer_name?: string;
}

export interface CreateInterviewPayload extends InterviewSlotPayload {
  application_id: string;
  round_name: string;
  scheduled_at: string;
}

export const getInterviews = async (params?: InterviewQueryParams) => {
  const response = await apiClient.get<InterviewListResponse>('/interviews', { params });
  return response.data;
};

export const getInterviewSummary = async () => {
  const response = await apiClient.get<{ data: { summary: InterviewSummary } }>('/interviews/summary');
  return response.data.data.summary;
};


export const createInterview = async (data: CreateInterviewPayload) => {
  const response = await apiClient.post('/interviews', data);
  return response.data;
};

export const rescheduleInterview = async (id: string, data: InterviewSlotPayload) => {
  const response = await apiClient.put(`/interviews/${id}`, data);
  return response.data;
};

export const cancelInterview = async (id: string, reason?: string) => {
  const response = await apiClient.patch(`/interviews/${id}/cancel`, { reason });
  return response.data;
};

export const recordInterviewResult = async (
  id: string,
  data: { result: 'Passed' | 'Failed'; feedback?: string; is_final?: boolean }
) => {
  const response = await apiClient.patch(`/interviews/${id}/result`, data);
  return response.data;
};
