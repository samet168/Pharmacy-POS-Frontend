import { apiClient } from './client';
import { z } from 'zod';
import {
  LoginRequest,
  LoginResponse,
  PinLoginRequest,
  RefreshTokenRequest,
  AuthMeResponse,
} from '@/types/api';

// Matches backend RegisterResponse
export interface RegisterResponse {
  userId: number;
  username: string;
  name: string;
  phone: string;
  organizationId: number;
  roleId: number;
  roleName: string;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Zod validation schemas
// ---------------------------------------------------------------------------

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
  phone: z.string().min(4, 'Phone number must be at least 4 digits').optional().or(z.literal('')),
  pinCode: z.string().min(4, 'PIN must be at least 4 characters').optional().or(z.literal('')),
  organizationId: z.number().positive('Organization ID is required'),
  roleId: z.number().positive('Role ID is required').optional(),
  branchId: z.number().positive('Branch ID is required').optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password must be at least 6 characters'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// ---------------------------------------------------------------------------
// Auth API — all methods use apiClient.post/get so ApiResponse<T> is
// automatically unwrapped by the client wrapper functions.
// ---------------------------------------------------------------------------

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const validated = loginSchema.parse(data);
    return apiClient.post<LoginResponse>('/auth/login', validated);
  },

  pinLogin: async (data: PinLoginRequest): Promise<LoginResponse> => {
    const validated = pinLoginSchema.parse(data);
    return apiClient.post<LoginResponse>('/auth/pin-login', validated);
  },

  loginWithGoogle: async (data: {
    email: string;
    name?: string;
    picture?: string;
    googleId?: string;
    idToken?: string;
    organizationId?: number;
    branchId?: number;
    planName?: string;
  }): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>('/auth/google', data);
  },

  register: async (data: unknown): Promise<LoginResponse> => {
    const validated = registerSchema.parse(data);
    return apiClient.post<LoginResponse>('/auth/register', validated);
  },

  refreshToken: async (data: RefreshTokenRequest): Promise<LoginResponse> => {
    const validated = refreshTokenSchema.parse(data);
    return apiClient.post<LoginResponse>('/auth/refresh', validated);
  },

  /**
   * GET /auth/me — returns { username, authorities, authenticated }
   * Backend returns ApiResponse<Map<String,Object>>, unwrapped by client.
   */
  getMe: async (): Promise<AuthMeResponse> => {
    return apiClient.get<AuthMeResponse>('/auth/me');
  },

  /**
   * Alias for getMe for consistency
   */
  getCurrentUser: async (): Promise<AuthMeResponse> => {
    return apiClient.get<AuthMeResponse>('/auth/me');
  },

  logout: async (): Promise<void> => {
    // Backend has no /auth/logout endpoint — just clear local storage.
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('permissions');
      localStorage.removeItem('organizationId');
    }
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> => {
    const validated = changePasswordSchema.parse(data);
    await apiClient.put('/auth/change-password', validated);
  },

  forgotPassword: async (data: { email: string }): Promise<void> => {
    const validated = forgotPasswordSchema.parse(data);
    await apiClient.post('/auth/forgot-password', validated);
  },

  resetPassword: async (data: {
    token: string;
    newPassword: string;
  }): Promise<void> => {
    const validated = resetPasswordSchema.parse(data);
    await apiClient.post('/auth/reset-password', validated);
  },
};
