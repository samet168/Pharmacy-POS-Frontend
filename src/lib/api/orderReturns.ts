import { apiClient } from './client';

export interface OrderReturn {
  id: number;
  orderId: number;
  returnDate: string;
  reason: string;
  totalAmount: number;
  approvedBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderReturnRequest {
  orderId: number;
  reason: string;
  items: any[];
}

export interface OrderReturnResponse extends OrderReturn {}

export const orderReturnsApi = {
  create: async (data: OrderReturnRequest) => {
    return apiClient.post<OrderReturnResponse>('/order-returns', data);
  },

  getById: async (id: number) => {
    return apiClient.get<OrderReturnResponse>(`/order-returns/${id}`);
  },

  getByOrder: async (orderId: number) => {
    return apiClient.get<OrderReturnResponse[]>(`/order-returns/order/${orderId}`);
  },
};