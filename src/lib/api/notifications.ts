import { apiClient } from './client';

export interface NotificationResponse {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const notificationsApi = {
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
    return apiClient.put<void>('/notifications/read-all', { userId });
  }
};
