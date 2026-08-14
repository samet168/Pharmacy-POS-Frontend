import { apiClient } from './client';

export interface Branch {
  id: number;
  organizationId: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  managerId?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BranchRequest {
  organizationId: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  managerId?: number;
  active: boolean;
}

export interface BranchResponse extends Branch {}

export const branchesApi = {
  listAll: async () => {
    return apiClient.get<BranchResponse[]>('/branches');
  },

  getByOrganization: async (organizationId: number) => {
    return apiClient.get<BranchResponse[]>(`/branches/organization/${organizationId}`);
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