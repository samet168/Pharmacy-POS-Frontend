import { apiClient } from './client';

export interface Shift {
  id: number;
  userId: number;
  branchId: number;
  deviceId?: number;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  actualCash?: number;
  difference?: number;
  status: 'OPEN' | 'CLOSED' | 'RECONCILED';
  createdAt: string;
  updatedAt: string;
}

export interface ShiftRequest {
  userId: number;
  branchId: number;
  deviceId?: number;
  openingCash: number;
}

export interface ShiftCloseRequest {
  actualCash: number;
}

export interface ShiftResponse extends Shift {}

export const shiftsApi = {
  listAll: async () => {
    return apiClient.get<ShiftResponse[]>('/shifts');
  },

  getByBranch: async (branchId: number) => {
    return apiClient.get<ShiftResponse[]>(`/shifts/branch/${branchId}`);
  },

  getById: async (id: number) => {
    return apiClient.get<ShiftResponse>(`/shifts/${id}`);
  },

  create: async (data: ShiftRequest) => {
    return apiClient.post<ShiftResponse>('/shifts', data);
  },

  close: async (id: number, data: ShiftCloseRequest) => {
    return apiClient.put<ShiftResponse>(`/shifts/${id}/close`, data);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/shifts/${id}`);
  },
};