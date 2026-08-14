import { apiClient } from './client';

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