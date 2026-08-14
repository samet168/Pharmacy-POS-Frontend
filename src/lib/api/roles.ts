import { apiClient } from './client';

export interface Role {
  id: number;
  organizationId: number;
  name: string;
  description?: string;
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleRequest {
  name: string;
  description?: string;
  isSystemRole: boolean;
}

export interface RoleResponse extends Role {}

export const rolesApi = {
  listAll: async () => {
    return apiClient.get<RoleResponse[]>('/roles');
  },

  getByOrganization: async (organizationId: number) => {
    return apiClient.get<RoleResponse[]>(`/roles/organization/${organizationId}`);
  },

  getById: async (id: number) => {
    return apiClient.get<RoleResponse>(`/roles/${id}`);
  },

  create: async (data: RoleRequest) => {
    return apiClient.post<RoleResponse>('/roles', data);
  },

  update: async (id: number, data: RoleRequest) => {
    return apiClient.put<RoleResponse>(`/roles/${id}`, data);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/roles/${id}`);
  },
};