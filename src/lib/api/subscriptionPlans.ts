import { apiClient } from './client';

export interface SubscriptionPlan {
  id: number;
  organizationId: number;
  planName: string;
  maxBranches: number;
  maxUsers: number;
  status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
  startsAt: string;
  endsAt: string;
  createdAt: string;
}

export interface SubscriptionPlanRequest {
  organizationId: number;
  planName: string;
  maxBranches: number;
  maxUsers: number;
  status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
  startsAt: string;
  endsAt: string;
}

export type SubscriptionPlanResponse = SubscriptionPlan ;

export interface SubscriptionCheckoutRequest {
  organizationId: number;
  planName: string;
  billingCycle?: 'MONTHLY' | 'YEARLY';
  maxBranches?: number;
  maxUsers?: number;
  paymentMethod?: string;
  paymentToken?: string;
}

export const subscriptionPlansApi = {
  checkout: async (data: SubscriptionCheckoutRequest) => {
    return apiClient.post<SubscriptionPlanResponse>('/subscription-plans/checkout', data);
  },

  listAll: async () => {
    return apiClient.get<SubscriptionPlanResponse[]>('/subscription-plans');
  },

  getByOrganization: async (organizationId: number) => {
    return apiClient.get<SubscriptionPlanResponse[]>(`/subscription-plans/organization/${organizationId}`);
  },

  getById: async (id: number) => {
    return apiClient.get<SubscriptionPlanResponse>(`/subscription-plans/${id}`);
  },

  create: async (data: SubscriptionPlanRequest) => {
    return apiClient.post<SubscriptionPlanResponse>('/subscription-plans', data);
  },

  update: async (id: number, data: SubscriptionPlanRequest) => {
    return apiClient.put<SubscriptionPlanResponse>(`/subscription-plans/${id}`, data);
  },

  cancel: async (id: number) => {
    return apiClient.post<SubscriptionPlanResponse>(`/subscription-plans/${id}/cancel`);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/subscription-plans/${id}`);
  },
};