import { apiClient } from './client';

// Matches backend AuditLog entity from iam/entity/AuditLog.java and AuditLogResponse DTO
export interface AuditLog {
  id: number;
  organizationId: number;
  userId?: number;
  username?: string;
  action: string;
  entityType?: string;
  entityId?: number;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestUrl?: string;
  requestBody?: string;
  responseBody?: string;
  statusCode?: number;
  executionTimeMs?: number;
  createdAt: string;
}

export type AuditLogResponse = AuditLog;

export interface AuditLogQueryParams {
  organizationId?: number;
  userId?: number;
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
}

export const auditLogsApi = {
  getLogs: async (params?: AuditLogQueryParams) => {
    return apiClient.get<AuditLogResponse[]>('/audit-logs', params as Record<string, unknown>);
  },

  getAll: async () => {
    return apiClient.get<AuditLogResponse[]>('/audit-logs');
  },

  getById: async (id: number) => {
    return apiClient.get<AuditLogResponse>(`/audit-logs/${id}`);
  },

  getByOrganization: async (organizationId: number) => {
    return apiClient.get<AuditLogResponse[]>('/audit-logs', { organizationId });
  },

  getByUser: async (userId: number) => {
    return apiClient.get<AuditLogResponse[]>('/audit-logs', { userId });
  },

  getByAction: async (action: string) => {
    return apiClient.get<AuditLogResponse[]>('/audit-logs', { action });
  },

  getByEntityType: async (entityType: string) => {
    return apiClient.get<AuditLogResponse[]>('/audit-logs', { entityType });
  },

  getByOrganizationAndDateRange: async (
    organizationId: number,
    from: string,
    to: string
  ) => {
    return apiClient.get<AuditLogResponse[]>('/audit-logs', { organizationId, from, to });
  },

  create: async (data: Partial<AuditLog>) => {
    return apiClient.post<AuditLogResponse>('/audit-logs', data);
  },

  delete: async (id: number) => {
    return apiClient.delete<void>(`/audit-logs/${id}`);
  },
};