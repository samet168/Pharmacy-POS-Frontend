import { apiClient } from './client';

export interface BranchInventory {
  productId: number;
  branchId: number;
  quantityOnHand: number;
  reorderLevel: number;
  reorderQuantity: number;
}

export interface BranchInventoryRequest {
  productId: number;
  branchId: number;
  reorderLevel: number;
  reorderQuantity: number;
}

export type BranchInventoryResponse = BranchInventory ;

export const branchInventoryApi = {
  getByBranch: async (branchId: number) => {
    return apiClient.get<BranchInventoryResponse[]>(`/branch-inventory/branch/${branchId}`);
  },

  getByProduct: async (branchId: number, productId: number) => {
    return apiClient.get<BranchInventoryResponse>(`/branch-inventory/branch/${branchId}/product/${productId}`);
  },

  updateReorderLevel: async (branchId: number, productId: number, data: { reorderLevel: number; reorderQuantity: number }) => {
    return apiClient.put<BranchInventoryResponse>(`/branch-inventory/branch/${branchId}/product/${productId}/reorder-level`, data);
  },

  getLowStock: async (branchId: number) => {
    return apiClient.get<BranchInventoryResponse[]>(`/branch-inventory/branch/${branchId}/low-stock`);
  },
};