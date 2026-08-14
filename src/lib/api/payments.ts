import { apiClient } from './client';

export interface Payment {
  id: number;
  orderId: number;
  paymentMethod: 'CASH' | 'KHQR' | 'CARD' | 'CREDIT' | 'BANK_TRANSFER' | 'WALLET';
  amount: number;
  referenceNumber?: string;
  paymentDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRequest {
  orderId: number;
  paymentMethod: 'CASH' | 'KHQR' | 'CARD' | 'CREDIT' | 'BANK_TRANSFER' | 'WALLET';
  amount: number;
  referenceNumber?: string;
}

export interface PaymentResponse extends Payment {}

export const paymentsApi = {
  listAll: async () => {
    return apiClient.get<PaymentResponse[]>('/payments');
  },

  getByOrder: async (orderId: number) => {
    return apiClient.get<PaymentResponse[]>(`/payments/order/${orderId}`);
  },

  getById: async (id: number) => {
    return apiClient.get<PaymentResponse>(`/payments/${id}`);
  },

  create: async (data: PaymentRequest) => {
    return apiClient.post<PaymentResponse>('/payments', data);
  },

  update: async (id: number, data: PaymentRequest) => {
    return apiClient.put<PaymentResponse>(`/payments/${id}`, data);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/payments/${id}`);
  },
};