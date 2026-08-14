import { apiClient } from './client';
import { z } from 'zod';
import { LoginRequest, LoginResponse, PinLoginRequest, RefreshTokenRequest, RegisterResponse, AuthMeResponse, ApiResponse } from '@/types/api';

// Zod schemas for request validation
export const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const pinLoginSchema = z.object({
  pinCode: z.string().min(4, 'PIN must be at least 4 characters'),
  branchId: z.number().positive('Branch ID is required'),
  deviceUuid: z.string().optional(),
});

export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone number is required'),
  pinCode: z.string().min(4, 'PIN must be at least 4 characters').optional(),
  organizationId: z.number().positive('Organization ID is required'),
  roleId: z.number().positive('Role ID is required'),
  branchId: z.number().positive('Branch ID is required').optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password must be at least 6 characters'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const validated = loginSchema.parse(data);
    const response = await apiClient.getClient().post<ApiResponse<LoginResponse>>('/auth/login', validated);
    // Handle different response structures
    if (response.data && typeof response.data === 'object') {
      return response.data.data || response.data;
    }
    return response;
  },

  pinLogin: async (data: PinLoginRequest): Promise<LoginResponse> => {
    const validated = pinLoginSchema.parse(data);
    const response = await apiClient.getClient().post<ApiResponse<LoginResponse>>('/auth/pin-login', validated);
    if (response.data && typeof response.data === 'object') {
      return response.data.data || response.data;
    }
    return response;
  },

  register: async (data: LoginRequest): Promise<RegisterResponse> => {
    const validated = registerSchema.parse(data);
    const response = await apiClient.getClient().post<ApiResponse<RegisterResponse>>('/auth/register', validated);
    if (response.data && typeof response.data === 'object') {
      return response.data.data || response.data;
    }
    return response;
  },

  refreshToken: async (data: RefreshTokenRequest): Promise<LoginResponse> => {
    const validated = refreshTokenSchema.parse(data);
    const response = await apiClient.getClient().post<ApiResponse<LoginResponse>>('/auth/refresh', validated);
    if (response.data && typeof response.data === 'object') {
      return response.data.data || response.data;
    }
    return response;
  },

  getMe: async (): Promise<AuthMeResponse> => {
    const response = await apiClient.getClient().get<ApiResponse<AuthMeResponse>>('/auth/me');
    if (response.data && typeof response.data === 'object') {
      return response.data.data || response.data;
    }
    return response;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.getClient().post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('permissions');
      }
    }
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    const validated = changePasswordSchema.parse(data);
    await apiClient.getClient().post('/auth/change-password', validated);
  },

  forgotPassword: async (data: { email: string }): Promise<void> => {
    const validated = forgotPasswordSchema.parse(data);
    await apiClient.getClient().post('/auth/forgot-password', validated);
  },

  resetPassword: async (data: { token: string; newPassword: string }): Promise<void> => {
    const validated = resetPasswordSchema.parse(data);
    await apiClient.getClient().post('/auth/reset-password', validated);
  },
};