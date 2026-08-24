import { apiClient } from './client';

// Matches backend AuditLog entity from iam/entity/AuditLog.java
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

export const auditLogsApi = {
  getAll: async () => {
    return apiClient.get<AuditLogResponse[]>('/audit-logs');
  },

  getByOrganization: async (organizationId: number) => {
    return apiClient.get<AuditLogResponse[]>(`/audit-logs/organization/${organizationId}`);
  },

  getByUser: async (userId: number) => {
    return apiClient.get<AuditLogResponse[]>(`/audit-logs/user/${userId}`);
  },

  getByAction: async (action: string) => {
    return apiClient.get<AuditLogResponse[]>(`/audit-logs/action/${action}`);
  },

  getByEntityType: async (entityType: string) => {
    return apiClient.get<AuditLogResponse[]>(`/audit-logs/entity-type/${entityType}`);
  },

  getByOrganizationAndDateRange: async (
    organizationId: number,
    startDate: string,
    endDate: string
  ) => {
    return apiClient.get<AuditLogResponse[]>(
      `/audit-logs/organization/${organizationId}/date-range`,
      { startDate, endDate }
    );
  },

  delete: async (id: number) => {
    return apiClient.delete<void>(`/audit-logs/${id}`);
  },
};