import { apiClient } from './client';
import { PageResponse } from '@/types/api';

export interface GoodsReceipt {
  id: number;
  purchaseOrderId: number;
  branchId: number;
  receiptNumber: string;
  receivedDate: string;
  receivedBy: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReceiptRequest {
  purchaseOrderId: number;
  branchId: number;
  receivedDate: string;
  notes?: string;
}

export type GoodsReceiptResponse = GoodsReceipt ;

export const goodsReceiptsApi = {
  listAll: async () => {
    return apiClient.get<GoodsReceiptResponse[]>('/goods-receipts');
  },

  getByOrganization: async (organizationId: number, params?: {
    page?: number;
    size?: number;
    branchId?: number;
  }) => {
    return apiClient.get<PageResponse<GoodsReceiptResponse>>(`/goods-receipts/organization/${organizationId}`, {
      params: { page: 0, size: 20, ...params }
    });
  },

  getByPurchaseOrder: async (purchaseOrderId: number) => {
    return apiClient.get<GoodsReceiptResponse[]>(`/goods-receipts/purchase-order/${purchaseOrderId}`);
  },

  getByBranch: async (branchId: number) => {
    return apiClient.get<GoodsReceiptResponse[]>(`/goods-receipts/branch/${branchId}`);
  },

  getById: async (id: number) => {
    return apiClient.get<GoodsReceiptResponse>(`/goods-receipts/${id}`);
  },

  create: async (data: GoodsReceiptRequest) => {
    return apiClient.post<GoodsReceiptResponse>('/goods-receipts', data);
  },

  update: async (id: number, data: GoodsReceiptRequest) => {
    return apiClient.put<GoodsReceiptResponse>(`/goods-receipts/${id}`, data);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/goods-receipts/${id}`);
  },
};