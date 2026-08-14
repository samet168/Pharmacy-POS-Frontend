import { apiClient } from './client';

export interface User {
  id: number;
  organizationId: number;
  roleId: number;
  username: string;
  name: string;
  phone?: string;
  email?: string;
  pinCode?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRequest {
  organizationId: number;
  roleId: number;
  username: string;
  password?: string;
  name: string;
  phone?: string;
  email?: string;
  pinCode?: string;
  active: boolean;
}

export interface UserResponse extends User {}

export const usersApi = {
  listAll: async () => {
    return apiClient.get<UserResponse[]>('/users');
  },

  getById: async (id: number) => {
    return apiClient.get<UserResponse>(`/users/${id}`);
  },

  create: async (data: UserRequest) => {
    return apiClient.post<UserResponse>('/users', data);
  },

  update: async (id: number, data: UserRequest) => {
    return apiClient.put<UserResponse>(`/users/${id}`, data);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/users/${id}`);
  },

  getBranches: async (id: number) => {
    return apiClient.get<number[]>(`/users/${id}/branches`);
  },

  updateBranches: async (id: number, branchIds: number[]) => {
    return apiClient.put<number[]>(`/users/${id}/branches`, { branchIds });
  },
};