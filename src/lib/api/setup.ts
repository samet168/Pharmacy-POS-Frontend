import { apiClient } from './client';

export interface BootstrapResponse {
  success: boolean;
  message: string;
}

export interface FixPermissionsResponse {
  success: boolean;
  message: string;
}

export const setupApi = {
  bootstrap: async (): Promise<BootstrapResponse> => {
    return apiClient.post<BootstrapResponse>('/setup/bootstrap');
  },

  fixPermissions: async (): Promise<FixPermissionsResponse> => {
    return apiClient.post<FixPermissionsResponse>('/setup/fix-permissions');
  },
};