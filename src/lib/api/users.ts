import { apiClient } from './client';
import { PageResponse } from '@/types/api';

// Matches backend UserResponse exactly
export interface User {
  id: number;
  organizationId: number;
  roleId: number;
  name: string;
  username: string;
  phone?: string;
  imageUrl?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRequest {
  organizationId: number;
  roleId: number;
  name: string;
  username: string;
  password?: string;
  phone?: string;
  pinCode?: string;
  imageUrl?: string;
  isActive?: boolean;
  branchIds?: number[];
}

export type UserResponse = User ;

export const usersApi = {
  listAll: async (page = 0, size = 100, organizationId?: number) => {
    const params: Record<string, unknown> = { page, size };
    if (organizationId) params.organizationId = organizationId;
    return apiClient.get<PageResponse<UserResponse>>('/users', params);
  },

  getByOrganization: async (organizationId: number, page = 0, size = 100) => {
    return apiClient.get<PageResponse<UserResponse>>(
      `/users/organization/${organizationId}`,
      { page, size }
    );
  },

  getById: async (id: number) => {
    return apiClient.get<UserResponse>(`/users/${id}`);
  },

  /** POST /users — multipart form data required by backend */
  create: async (data: UserRequest, imageFile?: File) => {
    const form = new FormData();
    form.append('user', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (imageFile) form.append('file', imageFile);
    return apiClient.upload<UserResponse>('/users', form);
  },

  /** PUT /users/:id — multipart form data required by backend */
  update: async (id: number, data: UserRequest, imageFile?: File) => {
    const form = new FormData();
    form.append('user', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (imageFile) form.append('file', imageFile);
    return apiClient.upload<UserResponse>(`/users/${id}`, form, 'PUT');
  },

  delete: async (id: number) => {
    await apiClient.delete(`/users/${id}`);
  },
};