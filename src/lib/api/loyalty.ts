import { apiClient } from './client';

export interface LoyaltyAccount {
  customerId: number;
  pointsBalance: number;
  tier: string;
}

export interface LoyaltyTransaction {
  id: number;
  customerId: number;
  orderId?: number;
  pointsDelta: number;
  reason: string;
  createdAt: string;
}

export interface LoyaltyRedeemRequest {
  points: number;
}

export const loyaltyApi = {
  getCustomerAccount: async (customerId: number): Promise<LoyaltyAccount> => {
    return apiClient.get<LoyaltyAccount>(`/loyalty/customer/${customerId}`);
  },

  redeemPoints: async (customerId: number, data: LoyaltyRedeemRequest): Promise<void> => {
    await apiClient.post(`/loyalty/customer/${customerId}/redeem`, data);
  },
};