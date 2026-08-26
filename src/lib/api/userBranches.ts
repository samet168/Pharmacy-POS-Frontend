import { apiClient } from './client';

export interface UserBranch {
  userId: number;
  branchId: number;
  assignedAt: string;
}

export interface UserBranchRequest {
  userId: number;
  branchId: number;
}

export type UserBranchResponse = UserBranch ;

export const userBranchesApi = {
  listAll: async () => {
    return apiClient.get<UserBranchResponse[]>('/user-branches');
  },

  getByUser: async (userId: number) => {
    return apiClient.get<UserBranchResponse[]>(`/user-branches/user/${userId}`);
  },

  getByBranch: async (branchId: number) => {
    return apiClient.get<UserBranchResponse[]>(`/user-branches/branch/${branchId}`);
  },

  create: async (data: UserBranchRequest) => {
    return apiClient.post<UserBranchResponse>('/user-branches', data);
  },

  delete: async (userId: number, branchId: number) => {
    await apiClient.delete(`/user-branches/user/${userId}/branch/${branchId}`);
  },
};