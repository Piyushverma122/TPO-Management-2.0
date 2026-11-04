import apiClient from './axios';
import type { Offer, OfferStatus } from '../types';

export interface OfferQueryParams {
  page?: number;
  limit?: number;
  status?: OfferStatus;
  company_id?: string;
}

export interface OfferListResponse {
  success: boolean;
  message: string;
  data: Offer[];
  pagination: { currentPage: number; perPage: number; totalEntries: number; totalPages: number };
}

export const getOffers = async (params?: OfferQueryParams) => {
  const response = await apiClient.get<OfferListResponse>('/offers', { params });
  return response.data;
};

export interface OfferSummary {
  pending: number;
  released: number;
  accepted: number;
  closed: number;
}

export const getOfferSummary = async () => {
  const response = await apiClient.get<{ data: { summary: OfferSummary } }>('/offers/summary');
  return response.data.data.summary;
};


/** Short-lived signed link to the PDF (the bucket is private). */
export const getOfferFileUrl = async (id: string) => {
  const response = await apiClient.get<{ data: { url: string; file_name: string | null } }>(`/offers/${id}/file`);
  return response.data.data;
};

export const createOffer = async (formData: FormData) => {
  const response = await apiClient.post('/offers', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return response.data;
};

export const reviewOffer = async (id: string, data: { action: 'approve' | 'reject'; remarks?: string }) => {
  const response = await apiClient.patch(`/offers/${id}/review`, data);
  return response.data;
};

export const respondToOffer = async (id: string, data: { decision: 'accept' | 'decline'; reason?: string }) => {
  const response = await apiClient.patch(`/offers/${id}/respond`, data);
  return response.data;
};
