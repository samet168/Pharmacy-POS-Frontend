import { apiClient } from './client';

export type NotificationType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';

// Matches backend NotificationResponse DTO
export interface NotificationResponse {
  id: number;
  organizationId: number;
  userId?: number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  metadata?: string;
  actionUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationRequest {
  organizationId: number;
  userId?: number;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: string;
  actionUrl?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const notificationsApi = {
  create: async (data: NotificationRequest) => {
    return apiClient.post<NotificationResponse>('/notifications', data);
  },

  getById: async (id: number) => {
    return apiClient.get<NotificationResponse>(`/notifications/${id}`);
  },

  getUserNotifications: async (userId: number, page: number = 0, size: number = 20) => {
    return apiClient.get<PageResponse<NotificationResponse>>('/notifications', { userId, page, size });
  },

  getOrganizationNotifications: async (organizationId: number, page: number = 0, size: number = 20) => {
    return apiClient.get<PageResponse<NotificationResponse>>(`/notifications/organization/${organizationId}`, { page, size });
  },

  getUnreadCount: async (userId: number) => {
    return apiClient.get<number>('/notifications/unread-count', { userId });
  },

  markAsRead: async (id: number) => {
    return apiClient.put<NotificationResponse>(`/notifications/${id}/read`);
  },

  markAllAsRead: async (userId: number) => {
    // backend expects userId as @RequestParam, use query string in URL
    return apiClient.put<void>(`/notifications/read-all?userId=${userId}`);
  },

  delete: async (id: number) => {
    return apiClient.delete<void>(`/notifications/${id}`);
  },
};
