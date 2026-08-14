import { apiClient } from './client';

export interface CustomerAllergy {
  id: number;
  customerId: number;
  ingredientId: number;
  ingredientName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerAllergyRequest {
  customerId: number;
  ingredientId: number;
}

export interface CustomerAllergyResponse extends CustomerAllergy {}

export const customerAllergiesApi = {
  listAll: async () => {
    return apiClient.get<CustomerAllergyResponse[]>('/customer-allergies');
  },

  getByCustomer: async (customerId: number) => {
    return apiClient.get<CustomerAllergyResponse[]>(`/customer-allergies/customer/${customerId}`);
  },

  getById: async (id: number) => {
    return apiClient.get<CustomerAllergyResponse>(`/customer-allergies/${id}`);
  },

  create: async (data: CustomerAllergyRequest) => {
    return apiClient.post<CustomerAllergyResponse>('/customer-allergies', data);
  },

  update: async (id: number, data: CustomerAllergyRequest) => {
    return apiClient.put<CustomerAllergyResponse>(`/customer-allergies/${id}`, data);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/customer-allergies/${id}`);
  },
};