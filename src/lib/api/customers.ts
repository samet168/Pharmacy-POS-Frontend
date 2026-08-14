import { apiClient } from './client';

export interface Customer {
  id: number;
  organizationId: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRequest {
  organizationId: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
}

export interface CustomerResponse extends Customer {}

export const customersApi = {
  listAll: async () => {
    return apiClient.get<CustomerResponse[]>('/customers');
  },

  getByOrganization: async (organizationId: number) => {
    return apiClient.get<CustomerResponse[]>(`/customers/organization/${organizationId}`);
  },

  getByPhone: async (organizationId: number, phone: string) => {
    return apiClient.get<CustomerResponse>(`/customers/organization/${organizationId}/phone/${phone}`);
  },

  getById: async (id: number) => {
    return apiClient.get<CustomerResponse>(`/customers/${id}`);
  },

  create: async (data: CustomerRequest) => {
    return apiClient.post<CustomerResponse>('/customers', data);
  },

  update: async (id: number, data: CustomerRequest) => {
    return apiClient.put<CustomerResponse>(`/customers/${id}`, data);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/customers/${id}`);
  },
};