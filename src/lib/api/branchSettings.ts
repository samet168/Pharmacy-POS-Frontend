import { apiClient } from './client';

export interface BranchSettings {
  id: number;
  branchId: number;
  businessName?: string;
  address?: string;
  phone?: string;
  email?: string;
  operatingHours?: string;
  taxId?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  defaultPaymentMethod?: string;
  referenceRateUsdToKhr?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BranchSettingsRequest {
  branchId: number;
  businessName?: string;
  address?: string;
  phone?: string;
  email?: string;
  operatingHours?: string;
  taxId?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  defaultPaymentMethod?: string;
  referenceRateUsdToKhr?: number;
}

export type BranchSettingsResponse = BranchSettings ;

export const branchSettingsApi = {
  getByBranch: async (branchId: number) => {
    return apiClient.get<BranchSettingsResponse>(`/branch-settings/branch/${branchId}`);
  },

  upsert: async (data: BranchSettingsRequest) => {
    return apiClient.post<BranchSettingsResponse>('/branch-settings', data);
  },
};