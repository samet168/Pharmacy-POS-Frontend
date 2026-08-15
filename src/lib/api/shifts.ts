import { apiClient } from './client';
import { PageResponse } from '@/types/api';

// Matches backend ShiftResponse exactly
export interface Shift {
  id: number;
  userId: number;
  branchId: number;
  deviceId?: number;
  openingCash: number;
  expectedCash?: number;
  actualCash?: number;
  difference?: number;
  status: 'OPEN' | 'CLOSED' | 'RECONCILED';
  openedAt: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftRequest {
  userId: number;
  branchId: number;
  deviceId?: number;
  openingCash: number;
  expectedCash?: number;
  actualCash?: number;
  status?: 'OPEN' | 'CLOSED' | 'RECONCILED';
}

export interface ShiftResponse extends Shift {}

export const shiftsApi = {
  listAll: async (page = 0, size = 100) => {
    return apiClient.get<PageResponse<ShiftResponse>>('/shifts', { page, size });
  },

  getCurrent: async (userId: number) => {
    return apiClient.get<ShiftResponse>('/shifts/current', { userId });
  },

  getByUser: async (userId: number, page = 0, size = 100) => {
    return apiClient.get<PageResponse<ShiftResponse>>(`/shifts/user/${userId}`, { page, size });
  },

  getByBranch: async (branchId: number, page = 0, size = 100) => {
    return apiClient.get<PageResponse<ShiftResponse>>(`/shifts/branch/${branchId}`, { page, size });
  },

  getById: async (id: number) => {
    return apiClient.get<ShiftResponse>(`/shifts/${id}`);
  },

  open: async (data: ShiftRequest) => {
    return apiClient.post<ShiftResponse>('/shifts', data);
  },

  close: async (id: number, data: ShiftRequest) => {
    return apiClient.put<ShiftResponse>(`/shifts/${id}/close`, data);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/shifts/${id}`);
  },
};