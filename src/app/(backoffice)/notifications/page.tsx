'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { toast } from 'sonner';
import { Bell, CheckCircle, AlertTriangle, Info, X, Clock, CheckCheck, Trash2, RefreshCw } from 'lucide-react';
import { notificationsApi, NotificationResponse } from '@/lib/api/notifications';
import { useAuthStore } from '@/lib/stores/authStore';

export default function NotificationsPage() {
  const { user, currentUser } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    const userId = currentUser?.id || user?.id;
    if (!userId) return;

    setLoading(true);
    try {
      const response = await notificationsApi.getUserNotifications(userId, 0, 50);
      if (response && response.content) {
        setNotifications(response.content);
      }
    } catch (error) {
      console.error('Failed to load notifications', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentUser?.id, user?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    const userId = currentUser?.id || user?.id;
    if (!userId) return;
    try {
      await notificationsApi.markAllAsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await notificationsApi.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'ERROR':
        return <X className="h-5 w-5 text-rose-500" />;
      default:
        return <Info className="h-5 w-5 text-bento-primary" />;
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto px-2 sm:px-4">
        <LoadingSkeleton variant="text" width={240} height={36} />
        {[1, 2, 3].map(i => <LoadingSkeleton key={i} variant="rectangular" width="100%" height={80} />)}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
              System Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 bg-rose-500 text-white text-xs font-black rounded-full">
                {unreadCount} UNREAD
              </span>
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            Real-time inventory alerts, medication expiry warnings, and POS shift activity logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchNotifications} className="flex items-center gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} className="flex items-center gap-1.5 text-xs font-bold">
              <CheckCheck className="h-4 w-4 text-emerald-600" /> Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3 border-dashed">
            <Bell className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="font-bold text-base">No notifications</p>
            <p className="text-xs">Your system is all caught up!</p>
          </Card>
        ) : (
          notifications.map((item) => (
            <Card
              key={item.id}
              className={`p-5 border transition-all flex items-start justify-between gap-4 rounded-2xl ${
                !item.read
                  ? 'border-bento-primary/40 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 opacity-80'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                  {getIcon(item.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.title}</h3>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.message}</p>
                  <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1 pt-1">
                    <Clock className="h-3 w-3" /> {formatDate(item.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!item.read && (
                  <Button variant="outline" size="sm" onClick={() => markAsRead(item.id)} className="text-[11px] font-bold">
                    Mark Read
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteNotification(item.id)}
                  className="text-[11px] text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}