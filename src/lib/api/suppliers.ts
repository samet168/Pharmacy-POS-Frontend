import { apiClient } from './client';

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
  listAll: async () => {
    return apiClient.get<SupplierResponse[]>('/suppliers');
  },

  getByOrganization: async (organizationId: number) => {
    return apiClient.get<SupplierResponse[]>(`/suppliers/organization/${organizationId}`);
  },

  search: async (organizationId: number, query: string) => {
    return apiClient.get<SupplierResponse[]>('/suppliers/search', {
      params: { organizationId, q: query }
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