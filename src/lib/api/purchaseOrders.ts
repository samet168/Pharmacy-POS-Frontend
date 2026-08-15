import { apiClient } from './client';
import { PageResponse } from '@/types/api';

export interface PurchaseOrder {
  id: number;
  organizationId: number;
  branchId: number;
  supplierId: number;
  poNumber: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  status: 'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderRequest {
  organizationId: number;
  branchId: number;
  supplierId: number;
  poNumber: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  notes?: string;
  status?: 'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
}

export interface PurchaseOrderResponse extends PurchaseOrder {}

export const purchaseOrdersApi = {
  listAll: async (organizationId: number, page = 0, size = 50) => {
    return apiClient.get<PageResponse<PurchaseOrderResponse>>(
      `/purchase-orders/organization/${organizationId}`,
      { page, size }
    );
  },

  getBySupplier: async (supplierId: number) => {
    return apiClient.get<PurchaseOrderResponse[]>(`/purchase-orders/supplier/${supplierId}`);
  },

  getByOrganization: async (organizationId: number, page = 0, size = 100) => {
    return apiClient.get<PageResponse<PurchaseOrderResponse>>(
      `/purchase-orders/organization/${organizationId}`,
      { page, size }
    );
  },

  getByOrganizationAndStatus: async (organizationId: number, status: string) => {
    return apiClient.get<PurchaseOrderResponse[]>(`/purchase-orders/organization/${organizationId}/status/${status}`);
  },

  getByBranch: async (branchId: number) => {
    return apiClient.get<PurchaseOrderResponse[]>(`/purchase-orders/branch/${branchId}`);
  },

  getById: async (id: number) => {
    return apiClient.get<PurchaseOrderResponse>(`/purchase-orders/${id}`);
  },

  create: async (data: PurchaseOrderRequest) => {
    return apiClient.post<PurchaseOrderResponse>('/purchase-orders', data);
  },

  update: async (id: number, data: PurchaseOrderRequest) => {
    return apiClient.put<PurchaseOrderResponse>(`/purchase-orders/${id}`, data);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/purchase-orders/${id}`);
  },

  submit: async (id: number) => {
    return apiClient.post<PurchaseOrderResponse>(`/purchase-orders/${id}/submit`);
  },

  addItem: async (id: number, item: any) => {
    return apiClient.post<PurchaseOrderResponse>(`/purchase-orders/${id}/items`, item);
  },

  cancel: async (id: number) => {
    return apiClient.post<PurchaseOrderResponse>(`/purchase-orders/${id}/cancel`);
  },
};