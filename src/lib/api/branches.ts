import { apiClient } from './client';
import { PageResponse } from '@/types/api';

// Matches backend BranchResponse exactly
export interface Branch {
  id: number;
  organizationId: number;
  code: string;
  name: string;
  location?: string;
  phone?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BranchRequest {
  organizationId: number;
  code: string;
  name: string;
  location?: string;
  phone?: string;
}

export interface BranchResponse extends Branch {}

export const branchesApi = {
  listAll: async (page = 0, size = 100) => {
    return apiClient.get<PageResponse<BranchResponse>>('/branches', { page, size });
  },

  getByOrganization: async (organizationId: number, page = 0, size = 100) => {
    return apiClient.get<PageResponse<BranchResponse>>(
      `/branches/organization/${organizationId}`,
      { page, size }
    );
  },

  getById: async (id: number) => {
    return apiClient.get<BranchResponse>(`/branches/${id}`);
  },

  create: async (data: BranchRequest) => {
    return apiClient.post<BranchResponse>('/branches', data);
  },

  update: async (id: number, data: BranchRequest) => {
    return apiClient.put<BranchResponse>(`/branches/${id}`, data);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/branches/${id}`);
  },
};