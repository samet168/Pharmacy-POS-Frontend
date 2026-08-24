import { apiClient } from './client';

export interface AuditLogResponse {
  id: number;
  organizationId: number;
  userId: number;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export const auditApi = {
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
  }
};
