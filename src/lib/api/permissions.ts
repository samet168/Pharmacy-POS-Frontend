import { apiClient } from './client';
import { PageResponse } from '@/types/api';

// Matches backend PermissionResponse exactly
export interface Permission {
  id: number;
  code: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionRequest {
  code: string;
  description: string;
}

export type PermissionResponse = Permission ;

export const permissionsApi = {
  listAll: async (page = 0, size = 100) => {
    return apiClient.get<PageResponse<PermissionResponse>>('/permissions', { page, size });
  },

  getByCode: async (code: string) => {
    return apiClient.get<PermissionResponse>(`/permissions/code/${code}`);
  },

  getById: async (id: number) => {
    return apiClient.get<PermissionResponse>(`/permissions/${id}`);
  },

  create: async (data: PermissionRequest) => {
    return apiClient.post<PermissionResponse>('/permissions', data);
  },

  update: async (id: number, data: PermissionRequest) => {
    return apiClient.put<PermissionResponse>(`/permissions/${id}`, data);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/permissions/${id}`);
  },
};