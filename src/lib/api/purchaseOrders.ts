import { apiClient } from './client';

export interface PurchaseOrder {
  id: number;
  organizationId: number;
  branchId: number;
  supplierId: number;
  orderNumber: string;
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
  orderDate: string;
  expectedDeliveryDate?: string;
  notes?: string;
}

export interface PurchaseOrderResponse extends PurchaseOrder {}

export const purchaseOrdersApi = {
  listAll: async () => {
    return apiClient.get<PurchaseOrderResponse[]>('/purchase-orders');
  },

  getBySupplier: async (supplierId: number) => {
    return apiClient.get<PurchaseOrderResponse[]>(`/purchase-orders/supplier/${supplierId}`);
  },

  getByOrganization: async (organizationId: number) => {
    return apiClient.get<PurchaseOrderResponse[]>(`/purchase-orders/organization/${organizationId}`);
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