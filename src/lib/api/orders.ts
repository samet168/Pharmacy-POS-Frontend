import { apiClient } from './client';
import { PageResponse } from '@/types/api';

// Mirrors backend OrderResponse fields
export interface Order {
  id: number;
  clientUuid?: string;
  invoiceNumber?: string;
  organizationId: number;
  branchId: number;
  deviceId?: number;
  userId: number;
  customerId?: number;
  shiftId?: number;
  prescriptionId?: number;
  prescriptionUrl?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  status: 'COMPLETED' | 'VOIDED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'PENDING_SYNC';
  syncStatus: 'PENDING' | 'SYNCED' | 'CONFLICT' | 'FAILED';
  createdAtDevice?: string;
  createdAt: string;
}

export type OrderResponse = Order;

// Mirrors backend CheckoutItemRequest
export interface CheckoutItem {
  productId: number;
  quantity: number;
  unitId: number;
  unitPrice: number;
  dosageInstruction?: string;
}

// Mirrors backend PaymentRequest (orderId is set server-side for checkout)
export interface CheckoutPayment {
  orderId: number;          // set to 0 for checkout — backend fills in
  paymentMethod: 'CASH' | 'KHQR' | 'CARD' | 'CREDIT' | 'BANK_TRANSFER' | 'WALLET';
  amountPaid: number;
  currency?: string;
  exchangeRateUsed?: number;
  transactionRef?: string;
}

// Mirrors backend CheckoutRequest
export interface CheckoutRequest {
  organizationId: number;
  branchId: number;
  deviceId?: number;
  userId: number;
  customerId?: number;
  shiftId?: number;
  prescriptionId?: number;
  prescriptionUrl?: string;
  items: CheckoutItem[];
  payments: CheckoutPayment[];
  promotionId?: number;
  loyaltyPointsEarned?: number;
  invoiceNumber?: string;
  clientUuid?: string;
}

export interface OrderItemResponse {
  id: number;
  orderId: number;
  productId: number;
  batchId?: number;
  unitId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  dosageInstruction?: string;
  createdAt?: string;
}

export interface PaymentResponse {
  id: number;
  orderId: number;
  paymentMethod: string;
  amountPaid: number;
  currency: string;
  exchangeRateUsed?: number;
  transactionRef?: string;
  createdAt?: string;
}

// Mirrors backend CheckoutResponse
export interface CheckoutResponse {
  order: OrderResponse;
  items: OrderItemResponse[];
  payments: PaymentResponse[];
  allergyWarnings: string[];
  message?: string;
}

// Simple OrderRequest (for GET /orders filter params)
export interface OrderListParams {
  organizationId: number;
  branchId?: number;
}

export const ordersApi = {
  /** GET /orders?organizationId=&branchId= — paginated */
  listAll: async (params: OrderListParams, page = 0, size = 50) => {
    return apiClient.get<PageResponse<OrderResponse>>('/orders', {
      ...params,
      page,
      size,
    } as Record<string, unknown>);
  },

  getById: async (id: number) => {
    return apiClient.get<OrderResponse>(`/orders/${id}`);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/orders/${id}`);
  },

  update: async (id: number, data: Partial<CheckoutRequest>) => {
    return apiClient.put<OrderResponse>(`/orders/${id}`, data);
  },

  /**
   * POST /orders/checkout
   * Main POS checkout — creates order + processes payments atomically.
   */
  checkout: async (data: CheckoutRequest): Promise<CheckoutResponse> => {
    return apiClient.post<CheckoutResponse>('/orders/checkout', data);
  },
};
