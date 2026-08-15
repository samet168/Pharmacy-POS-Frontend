import { apiClient } from './client';
import { PageResponse } from '@/types/api';

export interface Supplier {
  id: number;
  organizationId: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierRequest {
  organizationId?: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  active: boolean;
}

export interface SupplierResponse extends Supplier {}

export const suppliersApi = {
  listAll: async (page = 0, size = 100, organizationId?: number) => {
    const params: Record<string, unknown> = { page, size };
    if (organizationId) params.organizationId = organizationId;
    return apiClient.get<PageResponse<SupplierResponse>>('/suppliers', params);
  },

  getByOrganization: async (organizationId: number, page = 0, size = 100) => {
    return apiClient.get<PageResponse<SupplierResponse>>(
      `/suppliers/organization/${organizationId}`,
      { page, size }
    );
  },

  search: async (organizationId: number, query: string, page = 0, size = 100) => {
    return apiClient.get<PageResponse<SupplierResponse>>('/suppliers/search', {
      organizationId,
      q: query,
      page,
      size,
    });
  },

  getById: async (id: number) => {
    return apiClient.get<SupplierResponse>(`/suppliers/${id}`);
  },

  create: async (data: SupplierRequest) => {
    return apiClient.post<SupplierResponse>('/suppliers', data);
  },

  update: async (id: number, data: SupplierRequest) => {
    return apiClient.put<SupplierResponse>(`/suppliers/${id}`, data);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/suppliers/${id}`);
  },
};