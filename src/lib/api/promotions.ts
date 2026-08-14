import { apiClient } from './client';

export interface Promotion {
  id: number;
  organizationId: number;
  name: string;
  type: 'PERCENT_OFF' | 'FIXED_OFF' | 'BOGO';
  value: number;
  startDate: string;
  endDate: string;
  applicableProductIds?: number[];
  applicableCategoryIds?: number[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionRequest {
  organizationId: number;
  name: string;
  type: 'PERCENT_OFF' | 'FIXED_OFF' | 'BOGO';
  value: number;
  startDate: string;
  endDate: string;
  applicableProductIds?: number[];
  applicableCategoryIds?: number[];
  active: boolean;
}

export interface PromotionResponse extends Promotion {}

export const promotionsApi = {
  listAll: async () => {
    return apiClient.get<PromotionResponse[]>('/promotions');
  },

  getActiveByOrganization: async (organizationId: number) => {
    return apiClient.get<PromotionResponse[]>(`/promotions/organization/${organizationId}/active`);
  },

  getById: async (id: number) => {
    return apiClient.get<PromotionResponse>(`/promotions/${id}`);
  },

  create: async (data: PromotionRequest) => {
    return apiClient.post<PromotionResponse>('/promotions', data);
  },

  update: async (id: number, data: PromotionRequest) => {
    return apiClient.put<PromotionResponse>(`/promotions/${id}`, data);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/promotions/${id}`);
  },
};