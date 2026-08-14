import { apiClient } from './client';

export interface Category {
  id: number;
  organizationId: number;
  name: string;
  nameKh?: string;
  parentId?: number;
  parentName?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRequest {
  name: string;
  nameKh?: string;
  parentId?: number;
  active: boolean;
}

export interface CategoryResponse extends Category {}

export const categoriesApi = {
  listAll: async () => {
    return apiClient.get<CategoryResponse[]>('/categories');
  },

  getByOrganization: async (organizationId: number) => {
    return apiClient.get<CategoryResponse[]>(`/categories/organization/${organizationId}`);
  },

  getById: async (id: number) => {
    return apiClient.get<CategoryResponse>(`/categories/${id}`);
  },

  create: async (data: CategoryRequest) => {
    return apiClient.post<CategoryResponse>('/categories', data);
  },

  update: async (id: number, data: CategoryRequest) => {
    return apiClient.put<CategoryResponse>(`/categories/${id}`, data);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/categories/${id}`);
  },
};