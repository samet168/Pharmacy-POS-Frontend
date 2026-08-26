import { apiClient } from './client';
import { PageResponse } from '@/types/api';

// Matches backend CustomerResponse exactly
export interface Customer {
  id: number;
  organizationId: number;
  name: string;
  phone?: string;
  imageUrl?: string;
  dateOfBirth?: string;
  loyaltyPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRequest {
  organizationId: number;
  name: string;
  phone?: string;
  imageUrl?: string;
  dateOfBirth?: string;
  loyaltyPoints?: number;
}

export type CustomerResponse = Customer ;

export const customersApi = {
  listAll: async (page = 0, size = 100) => {
    return apiClient.get<PageResponse<CustomerResponse>>('/customers', { page, size });
  },

  getByOrganization: async (organizationId: number, page = 0, size = 100) => {
    return apiClient.get<PageResponse<CustomerResponse>>(
      `/customers/organization/${organizationId}`,
      { page, size }
    );
  },

  getByPhone: async (organizationId: number, phone: string) => {
    return apiClient.get<CustomerResponse>(`/customers/organization/${organizationId}/phone/${phone}`);
  },

  search: async (organizationId: number, query: string, page = 0, size = 100) => {
    return apiClient.get<PageResponse<CustomerResponse>>('/customers/search', {
      organizationId,
      query,
      page,
      size,
    });
  },

  getById: async (id: number) => {
    return apiClient.get<CustomerResponse>(`/customers/${id}`);
  },

  /** POST /customers — multipart form data required by backend */
  create: async (data: CustomerRequest, imageFile?: File) => {
    const form = new FormData();
    form.append('customer', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (imageFile) form.append('file', imageFile);
    return apiClient.upload<CustomerResponse>('/customers', form);
  },

  /** PUT /customers/:id — multipart form data required by backend */
  update: async (id: number, data: CustomerRequest, imageFile?: File) => {
    const form = new FormData();
    form.append('customer', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (imageFile) form.append('file', imageFile);
    return apiClient.upload<CustomerResponse>(`/customers/${id}`, form, 'PUT');
  },

  delete: async (id: number) => {
    await apiClient.delete(`/customers/${id}`);
  },
};