import { apiClient } from './client';

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

export interface GoodsReceiptResponse extends GoodsReceipt {}

export const goodsReceiptsApi = {
  listAll: async () => {
    return apiClient.get<GoodsReceiptResponse[]>('/goods-receipts');
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