import { apiClient } from './client';

export interface ActiveIngredient {
  id: number;
  organizationId: number;
  name: string;
  nameKh?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveIngredientRequest {
  organizationId?: number;
  name: string;
  nameKh?: string;
  description?: string;
}

export interface ActiveIngredientResponse extends ActiveIngredient {}

export const activeIngredientsApi = {
  listAll: async () => {
    return apiClient.get<ActiveIngredientResponse[]>('/active-ingredients');
  },

  getByOrganization: async (organizationId: number) => {
    return apiClient.get<ActiveIngredientResponse[]>(`/active-ingredients/organization/${organizationId}`);
  },

  getById: async (id: number) => {
    return apiClient.get<ActiveIngredientResponse>(`/active-ingredients/${id}`);
  },

  create: async (data: ActiveIngredientRequest) => {
    return apiClient.post<ActiveIngredientResponse>('/active-ingredients', data);
  },

  update: async (id: number, data: ActiveIngredientRequest) => {
    return apiClient.put<ActiveIngredientResponse>(`/active-ingredients/${id}`, data);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/active-ingredients/${id}`);
  },
};