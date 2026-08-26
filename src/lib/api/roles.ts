import { apiClient } from './client';
import { PageResponse } from '@/types/api';

// Matches backend RoleResponse exactly
export interface Role {
  id: number;
  organizationId: number;
  name: string;
  systemRole: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleRequest {
  organizationId?: number;
  name: string;
  isSystemRole?: boolean;
}

export interface RoleResponse extends Role {}

export const rolesApi = {
  listAll: async (page = 0, size = 100, organizationId?: number) => {
    const params: Record<string, unknown> = { page, size };
    if (organizationId) params.organizationId = organizationId;
    return apiClient.get<PageResponse<RoleResponse>>('/roles', params);
  },

  getByOrganization: async (organizationId: number, page = 0, size = 100) => {
    return apiClient.get<PageResponse<RoleResponse>>(
      `/roles/organization/${organizationId}`,
      { page, size }
    );
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

  getPermissions: async (roleId: number) => {
    return apiClient.get<import('./permissions').PermissionResponse[]>(`/roles/${roleId}/permissions`);
  },

  updatePermissions: async (roleId: number, permissionIds: number[]) => {
    return apiClient.put<import('./permissions').PermissionResponse[]>(`/roles/${roleId}/permissions`, {
      permissionIds,
    });
  },
};