import { apiClient } from './client';

export interface StockMovement {
  id: number;
  organizationId: number;
  branchId: number;
  productId: number;
  batchId: number;
  type: 'PURCHASE_IN' | 'SALE_OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'RETURN_IN' | 'EXPIRED_OUT' | 'DAMAGED_OUT';
  quantityDelta: number;
  referenceType: 'ORDER' | 'GOODS_RECEIPT' | 'ADJUSTMENT' | 'TRANSFER';
  referenceId: number;
  actorUserId: number;
  createdAt: string;
}

export type StockMovementResponse = StockMovement ;

export const stockMovementsApi = {
  getById: async (id: number) => {
    return apiClient.get<StockMovementResponse>(`/stock-movements/${id}`);
  },

  getByBranch: async (branchId: number) => {
    return apiClient.get<StockMovementResponse[]>(`/stock-movements/branch/${branchId}`);
  },

  getByProduct: async (productId: number) => {
    return apiClient.get<StockMovementResponse[]>(`/stock-movements/product/${productId}`);
  },
};