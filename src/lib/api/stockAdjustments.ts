import { apiClient } from './client';
import { PageResponse } from '@/types/api';

export interface StockAdjustment {
  id: number;
  organizationId: number;
  branchId: number;
  productId: number;
  batchId: number;
  quantityDelta: number;
  reason: 'DAMAGE' | 'EXPIRY' | 'COUNT_CORRECTION' | 'OTHER';
  note?: string;
  approvedBy?: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockAdjustmentRequest {
  organizationId: number;
  branchId: number;
  productId: number;
  batchId: number;
  quantityDelta: number;
  reason: 'DAMAGE' | 'EXPIRY' | 'COUNT_CORRECTION' | 'OTHER';
  note?: string;
}

export interface StockAdjustmentResponse extends StockAdjustment {}

export const stockAdjustmentsApi = {
  listAll: async () => {
    return apiClient.get<StockAdjustmentResponse[]>('/stock-adjustments');
  },

  getByOrganization: async (organizationId: number, params?: {
    page?: number;
    size?: number;
    branchId?: number;
    reason?: string;
  }) => {
    return apiClient.get<PageResponse<StockAdjustmentResponse>>(`/stock-adjustments/organization/${organizationId}`, {
      params: { page: 0, size: 20, ...params }
    });
  },

  getByBranch: async (branchId: number) => {
    return apiClient.get<StockAdjustmentResponse[]>(`/stock-adjustments/branch/${branchId}`);
  },

  getById: async (id: number) => {
    return apiClient.get<StockAdjustmentResponse>(`/stock-adjustments/${id}`);
  },

  create: async (data: StockAdjustmentRequest) => {
    return apiClient.post<StockAdjustmentResponse>('/stock-adjustments', data);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/stock-adjustments/${id}`);
  },
};