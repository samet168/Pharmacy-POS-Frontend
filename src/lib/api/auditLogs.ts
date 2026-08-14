import { apiClient } from './client';

export interface AuditLog {
  id: number;
  organizationId: number;
  branchId?: number;
  actorUserId: number;
  action: string;
  targetType: string;
  targetId: number;
  beforeJson?: string;
  afterJson?: string;
  createdAt: string;
}

export interface AuditLogRequest {
  organizationId: number;
  branchId?: number;
  actorUserId: number;
  action: string;
  targetType: string;
  targetId: number;
  beforeJson?: string;
  afterJson?: string;
}

export interface AuditLogResponse extends AuditLog {}

export const auditLogsApi = {
  create: async (data: AuditLogRequest) => {
    return apiClient.post<AuditLogResponse>('/audit-logs', data);
  },

  getByOrganization: async (organizationId: number, filters?: {
    actorUserId?: number;
    targetType?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    return apiClient.get<AuditLogResponse[]>(`/audit-logs/organization/${organizationId}`, {
      params: filters
    });
  },

  getByTarget: async (targetType: string, targetId: number) => {
    return apiClient.get<AuditLogResponse[]>(`/audit-logs/target/${targetType}/${targetId}`);
  },
};