import { apiClient } from './client';

export interface ProductBatch {
  id: number;
  organizationId: number;
  branchId: number;
  productId: number;
  batchNumber: string;
  expiryDate: string;
  costPrice: number;
  quantityReceived: number;
  quantityRemaining: number;
  goodsReceiptId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductBatchRequest {
  organizationId: number;
  branchId: number;
  productId: number;
  batchNumber: string;
  expiryDate: string;
  costPrice: number;
  quantityReceived: number;
  goodsReceiptId?: number;
}

export interface ProductBatchResponse extends ProductBatch {}

export const productBatchesApi = {
  listAll: async () => {
    return apiClient.get<ProductBatchResponse[]>('/product-batches');
  },

  getByProduct: async (productId: number) => {
    return apiClient.get<ProductBatchResponse[]>(`/product-batches/product/${productId}`);
  },

  getByBranch: async (branchId: number) => {
    return apiClient.get<ProductBatchResponse[]>(`/product-batches/branch/${branchId}`);
  },

  getExpiring: async (branchId: number, withinDays: number = 30) => {
    return apiClient.get<ProductBatchResponse[]>(`/product-batches/branch/${branchId}/expiring`, {
      params: { withinDays }
    });
  },

  getById: async (id: number) => {
    return apiClient.get<ProductBatchResponse>(`/product-batches/${id}`);
  },

  create: async (data: ProductBatchRequest) => {
    return apiClient.post<ProductBatchResponse>('/product-batches', data);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/product-batches/${id}`);
  },
};