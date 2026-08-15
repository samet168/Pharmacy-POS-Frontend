import { apiClient } from './client';
import { PageResponse } from '@/types/api';

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

  getByOrganization: async (organizationId: number, params?: {
    page?: number;
    size?: number;
    actorUserId?: number;
    targetType?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    return apiClient.get<PageResponse<AuditLogResponse>>(`/audit-logs/organization/${organizationId}`, {
      params: { page: 0, size: 20, ...params }
    });
  },

  getByTarget: async (targetType: string, targetId: number) => {
    return apiClient.get<AuditLogResponse[]>(`/audit-logs/target/${targetType}/${targetId}`);
  },
};