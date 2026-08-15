import { apiClient } from './client';
import { PageResponse } from '@/types/api';

export interface StockTransfer {
  id: number;
  organizationId: number;
  fromBranchId: number;
  toBranchId: number;
  productId: number;
  batchId: number;
  quantity: number;
  status: 'PENDING' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransferRequest {
  organizationId: number;
  fromBranchId: number;
  toBranchId: number;
  productId: number;
  batchId: number;
  quantity: number;
}

export interface StockTransferResponse extends StockTransfer {}

export const stockTransfersApi = {
  listAll: async () => {
    return apiClient.get<StockTransferResponse[]>('/stock-transfers');
  },

  getByOrganization: async (organizationId: number, params?: {
    page?: number;
    size?: number;
    branchId?: number;
  }) => {
    return apiClient.get<PageResponse<StockTransferResponse>>(`/stock-transfers/organization/${organizationId}`, {
      params: { page: 0, size: 20, ...params }
    });
  },

  getByBranch: async (branchId: number) => {
    return apiClient.get<StockTransferResponse[]>(`/stock-transfers/branch/${branchId}`);
  },

  getById: async (id: number) => {
    return apiClient.get<StockTransferResponse>(`/stock-transfers/${id}`);
  },

  create: async (data: StockTransferRequest) => {
    return apiClient.post<StockTransferResponse>('/stock-transfers', data);
  },

  update: async (id: number, data: StockTransferRequest) => {
    return apiClient.put<StockTransferResponse>(`/stock-transfers/${id}`, data);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/stock-transfers/${id}`);
  },

  dispatch: async (id: number) => {
    return apiClient.post<StockTransferResponse>(`/stock-transfers/${id}/dispatch`);
  },

  receive: async (id: number) => {
    return apiClient.post<StockTransferResponse>(`/stock-transfers/${id}/receive`);
  },

  cancel: async (id: number) => {
    return apiClient.post<StockTransferResponse>(`/stock-transfers/${id}/cancel`);
  },
};