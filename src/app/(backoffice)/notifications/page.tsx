'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSkeleton, CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { Bell, RefreshCw, Check, CheckCircle, AlertTriangle, Info, X, Clock } from 'lucide-react';

interface Notification {
  id: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Note: Backend doesn't have a notifications endpoint yet
      // This is a placeholder implementation
      // When backend endpoint is available, use: apiClient.get('/notifications')
      setNotifications([]);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      // Placeholder for marking as read
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Placeholder for marking all as read
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
      case 'ERROR':
        return <X className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'INFO':
      default:
        return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20';
      case 'WARNING':
        return 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20';
      case 'ERROR':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20';
      case 'INFO':
      default:
        return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <LoadingSkeleton variant="text" width={200} height={32} />
            <LoadingSkeleton variant="text" width={400} height={20} className="mt-2" />
          </div>
          <LoadingSkeleton variant="rectangular" width={150} height={40} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <CardSkeleton />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-bento-primary dark:text-slate-100">
            Notifications
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Stay updated with system alerts and announcements
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={markAllAsRead}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Mark All Read
            </Button>
          )}
          <Button
            onClick={fetchNotifications}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-bento-primary/10 rounded-xl">
              <Bell className="h-6 w-6 text-bento-primary" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total</p>
              <p className="text-2xl font-bold text-bento-primary dark:text-slate-100">
                {notifications.length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Unread</p>
              <p className="text-2xl font-bold text-bento-primary dark:text-slate-100">
                {unreadCount}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Warnings</p>
              <p className="text-2xl font-bold text-bento-primary dark:text-slate-100">
                {notifications.filter(n => n.type === 'WARNING').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <X className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Errors</p>
              <p className="text-2xl font-bold text-bento-primary dark:text-slate-100">
                {notifications.filter(n => n.type === 'ERROR').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Notifications List */}
      <Card className="p-6">
        {notifications.length === 0 ? (
          <EmptyState
            title="No notifications"
            description="You're all caught up! No new notifications to display."
            icon={<Bell className="h-12 w-12 text-slate-400" />}
            action={<Button onClick={fetchNotifications}>Refresh</Button>}
          />
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  notification.read 
                    ? 'opacity-60 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                    : getNotificationColor(notification.type)
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-bento-primary dark:text-slate-100">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="shrink-0"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(notification.createdAt)}</span>
                      </div>
                      {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                        <span>• Additional details available</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}