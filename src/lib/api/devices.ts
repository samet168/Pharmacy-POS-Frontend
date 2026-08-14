import { apiClient } from './client';

export interface Device {
  id: number;
  branchId: number;
  deviceUuid: string;
  deviceName?: string;
  deviceType?: string;
  lastSyncedAt?: string;
  active: boolean;
  registeredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceRequest {
  branchId: number;
  deviceUuid: string;
  deviceName?: string;
  deviceType?: string;
  active: boolean;
}

export interface DeviceResponse extends Device {}

export interface QueuedAction {
  idempotencyKey: string;
  endpoint: string;
  method: string;
  payload: any;
  clientTimestamp: string;
}

export interface SyncRequest {
  queuedActions: QueuedAction[];
}

export interface SyncResponse {
  results: Array<{
    idempotencyKey: string;
    status: 'APPLIED' | 'CONFLICT' | 'REJECTED';
    data?: any;
  }>;
}

export const devicesApi = {
  listAll: async () => {
    return apiClient.get<DeviceResponse[]>('/devices');
  },

  getByUuid: async (deviceUuid: string) => {
    return apiClient.get<DeviceResponse>(`/devices/uuid/${deviceUuid}`);
  },

  getByBranch: async (branchId: number) => {
    return apiClient.get<DeviceResponse[]>(`/devices/branch/${branchId}`);
  },

  getById: async (id: number) => {
    return apiClient.get<DeviceResponse>(`/devices/${id}`);
  },

  create: async (data: DeviceRequest) => {
    return apiClient.post<DeviceResponse>('/devices', data);
  },

  update: async (id: number, data: DeviceRequest) => {
    return apiClient.put<DeviceResponse>(`/devices/${id}`, data);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/devices/${id}`);
  },

  sync: async (deviceUuid: string, data: SyncRequest): Promise<SyncResponse> => {
    return apiClient.post<SyncResponse>(`/devices/sync/${deviceUuid}`, data);
  },
};