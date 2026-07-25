import apiClient from './axios';
import { User } from '../types';

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    session?: {
      access_token: string;
      refresh_token: string | null;
    };
    user: User;
  };
}

export interface AuthUserResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

/**
 * Login user with email & password
 */
export const loginApi = async (credentials: { email: string; password: string }) => {
  const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
  return response.data;
};

/**
 * Register new user
 */
export const registerApi = async (userData: any) => {
  const response = await apiClient.post('/auth/register', userData);
  return response.data;
};

/**
 * Logout current authenticated user
 */
export const logoutApi = async () => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

/**
 * Fetch current authenticated user profile
 */
export const getCurrentUserApi = async () => {
  const response = await apiClient.get<AuthUserResponse>('/auth/me');
  return response.data;
};

/**
 * Initiate forgot password reset link
 */
export const forgotPasswordApi = async (email: string) => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

/**
 * Reset user password with token
 */
export const resetPasswordApi = async (data: { token: string; password: string }) => {
  const response = await apiClient.post('/auth/reset-password', data);
  return response.data;
};
