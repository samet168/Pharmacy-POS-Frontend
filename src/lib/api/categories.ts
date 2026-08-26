import { apiClient } from './client';
import { PageResponse } from '@/types/api';

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
  organizationId?: number;
  name: string;
  nameKh?: string;
  parentId?: number;
  active: boolean;
}

export type CategoryResponse = Category ;

export const categoriesApi = {
  listAll: async (page = 0, size = 100, organizationId?: number) => {
    const params: Record<string, unknown> = { page, size };
    if (organizationId) params.organizationId = organizationId;
    return apiClient.get<PageResponse<CategoryResponse>>('/categories', params);
  },

  getByOrganization: async (organizationId: number, page = 0, size = 100) => {
    return apiClient.get<PageResponse<CategoryResponse>>(
      `/categories/organization/${organizationId}`,
      { page, size }
    );
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