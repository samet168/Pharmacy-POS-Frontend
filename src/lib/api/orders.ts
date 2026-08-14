import { apiClient } from './client';

export interface Order {
  id: number;
  organizationId: number;
  branchId: number;
  deviceId?: number;
  userId: number;
  customerId?: number;
  shiftId?: number;
  prescriptionId?: string;
  orderNumber: string;
  orderDate: string;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  status: 'COMPLETED' | 'VOIDED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'PENDING_SYNC';
  syncStatus: 'PENDING' | 'SYNCED' | 'CONFLICT' | 'FAILED';
  createdAt: string;
  createdAtDevice?: string;
  updatedAt: string;
}

export interface OrderRequest {
  organizationId: number;
  branchId: number;
  deviceId?: number;
  userId: number;
  customerId?: number;
  shiftId?: number;
  prescriptionId?: string;
  items: any[];
  paymentMethod: string;
  amountPaid: number;
}

export interface OrderResponse extends Order {}

export const ordersApi = {
  listAll: async (organizationId: number, branchId?: number) => {
    return apiClient.get<OrderResponse[]>('/orders', { organizationId, branchId });
  },

  getById: async (id: number) => {
    return apiClient.get<OrderResponse>(`/orders/${id}`);
  },

  create: async (data: OrderRequest) => {
    return apiClient.post<OrderResponse>('/orders', data);
  },

  update: async (id: number, data: OrderRequest) => {
    return apiClient.put<OrderResponse>(`/orders/${id}`, data);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/orders/${id}`);
  },

  checkout: async (data: OrderRequest): Promise<OrderResponse> => {
    return apiClient.post<OrderResponse>('/orders/checkout', data);
  },

  applyPromotion: async (id: number, promotionId: number): Promise<OrderResponse> => {
    return apiClient.post<OrderResponse>(`/orders/${id}/apply-promotion`, { promotionId });
  },
};