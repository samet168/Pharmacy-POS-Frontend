'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { notificationsApi, NotificationResponse, NotificationType } from '@/lib/api/notifications';
import { Button } from '../design-system/components/Button';
import { Badge } from '../design-system/components/Badge';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { toast } from 'sonner';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Clock,
  CheckCheck,
  Trash2,
  RefreshCw,
  Search,
  Plus,
  Radio,
  Filter,
  Sparkles,
  ChevronRight,
  Send,
  Layers,
  LayoutGrid,
  List,
  ShieldAlert,
  Flame,
  Check,
  ExternalLink,
} from 'lucide-react';

type FilterTab = 'all' | 'unread' | 'warnings' | 'success' | 'info';
type ViewMode = 'feed' | 'table';

export default function NotificationsPage() {
  const { user, currentUser } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'INFO' as NotificationType,
  });

  const userId = currentUser?.id || (user as any)?.userId || (user as any)?.id || 1;
  const orgId = currentUser?.organizationId || user?.organizationId || 1;

  // Fetch Notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const [userRes, orgRes] = await Promise.allSettled([
        notificationsApi.getUserNotifications(userId, 0, 100),
        notificationsApi.getOrganizationNotifications(orgId, 0, 100)
      ]);

      const itemsMap = new Map<number, NotificationResponse>();

      if (userRes.status === 'fulfilled' && userRes.value?.content) {
        userRes.value.content.forEach(item => itemsMap.set(item.id, item));
      }

      if (orgRes.status === 'fulfilled' && orgRes.value?.content) {
        orgRes.value.content.forEach(item => itemsMap.set(item.id, item));
      }

      const combined = Array.from(itemsMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setNotifications(combined);
    } catch (error) {
      console.error('Failed to load notifications', error);
      toast.error('Failed to load system notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [userId, orgId]);

  // Derived KPI Metrics
  const totalCount = notifications.length;
  const unreadCount = notifications.filter(n => !n.read).length;
  const warningAndErrorCount = notifications.filter(n => n.type === 'WARNING' || n.type === 'ERROR').length;
  const resolvedCount = notifications.filter(n => n.type === 'SUCCESS' || n.read).length;

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(item => {
      // Tab filter
      if (activeTab === 'unread' && item.read) return false;
      if (activeTab === 'warnings' && item.type !== 'WARNING' && item.type !== 'ERROR') return false;
      if (activeTab === 'success' && item.type !== 'SUCCESS') return false;
      if (activeTab === 'info' && item.type !== 'INFO') return false;

      // Type filter
      if (selectedType !== 'ALL' && item.type !== selectedType) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(query);
        const matchesMessage = item.message?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesMessage) return false;
      }

      return true;
    });
  }, [notifications, activeTab, selectedType, searchTerm]);

  // Actions
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
      toast.success('Notification removed');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleCreateNotification = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please fill in both title and message');
      return;
    }

    setSubmitting(true);
    try {
      const created = await notificationsApi.create({
        organizationId: orgId,
        userId: userId,
        type: formData.type,
        title: formData.title.trim(),
        message: formData.message.trim(),
      });

      setNotifications(prev => [created, ...prev]);
      toast.success('System alert created and dispatched!');
      setShowCreateModal(false);
      setFormData({ title: '', message: '', type: 'INFO' });
    } catch (error) {
      console.error('Failed to dispatch notification', error);
      toast.error('Failed to create notification');
    } finally {
      setSubmitting(false);
    }
  };

  const generateSampleAlerts = async () => {
    try {
      await notificationsApi.create({
        organizationId: orgId,
        userId: userId,
        type: 'WARNING',
        title: 'Low Stock Alert: Amoxicillin 500mg',
        message: 'Current warehouse stock is below minimum threshold (12 capsules remaining).',
      });
      await notificationsApi.create({
        organizationId: orgId,
        userId: userId,
        type: 'SUCCESS',
        title: 'POS Shift #104 Reconciled Successfully',
        message: 'Cash drawer reconciled with $0.00 variance by Pharmacist on duty.',
      });
      await notificationsApi.create({
        organizationId: orgId,
        type: 'INFO',
        title: 'Automated Database Backup Completed',
        message: 'Daily PostgreSQL database snapshot was archived securely.',
      });
      await notificationsApi.create({
        organizationId: orgId,
        userId: userId,
        type: 'ERROR',
        title: 'Batch Expiry Notice: Paracetamol 500mg',
        message: 'Lot #B492 has passed its expiration date. Immediate disposal recommended.',
      });
      toast.success('Generated test system alerts!');
      fetchNotifications();
    } catch (e) {
      toast.error('Failed to generate sample alerts');
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'ERROR':
        return <XCircle className="h-5 w-5 text-rose-500" />;
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const getTypeBadge = (type: NotificationType) => {
    switch (type) {
      case 'SUCCESS':
        return <Badge variant="success">SUCCESS</Badge>;
      case 'WARNING':
        return <Badge variant="warning">WARNING</Badge>;
      case 'ERROR':
        return <Badge variant="danger">CRITICAL</Badge>;
      default:
        return <Badge variant="info">INFO</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Just now';
    const d = new Date(dateString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <PageSkeleton kpiCards={4} showFilterBar tableRows={6} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* 1. Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <span>Communications</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-primary font-bold">Notifications</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
              <Bell className="h-7 w-7 text-primary shrink-0" />
              System Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 bg-rose-500 text-white text-xs font-black rounded-full animate-pulse shadow-sm">
                {unreadCount} UNREAD
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time pharmacy alerts, inventory warnings, batch expiry reminders, and POS shift activity logs.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotifications}
            className="flex items-center gap-1.5 text-xs rounded-xl"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All Read
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold rounded-xl shadow-md"
          >
            <Plus className="h-3.5 w-3.5" />
            New Alert
          </Button>
        </div>
      </div>

      {/* 2. 4 Bento KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Alerts */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Notifications
            </span>
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Bell className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {totalCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">recorded alerts</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
            <span>Active alert stream</span>
          </div>
        </div>

        {/* Card 2: Unread Alerts */}
        <div className={`border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow ${
          unreadCount > 0
            ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
            : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/60'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Unread Action Items
            </span>
            <div className="p-2.5 bg-rose-500/10 rounded-xl">
              <Flame className="h-5 w-5 text-rose-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
              {unreadCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">pending attention</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold">
            <span>{unreadCount === 0 ? 'All notifications read' : 'Requires review'}</span>
          </div>
        </div>

        {/* Card 3: Warnings & Critical Errors */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Warnings & Errors
            </span>
            <div className="p-2.5 bg-amber-500/10 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {warningAndErrorCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">risk alerts</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
            <span>Low stock & expiry tracking</span>
          </div>
        </div>

        {/* Card 4: Resolved / System Confirmations */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Resolved / Normal
            </span>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {resolvedCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">handled events</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            <span>{totalCount > 0 ? `${Math.round((resolvedCount / totalCount) * 100)}% handled` : '100% stable'}</span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Alerts', count: totalCount },
              { id: 'unread', label: 'Unread Only', count: unreadCount },
              { id: 'warnings', label: 'Warnings & Errors', count: warningAndErrorCount },
              { id: 'success', label: 'Success', count: notifications.filter(n => n.type === 'SUCCESS').length },
              { id: 'info', label: 'System Info', count: notifications.filter(n => n.type === 'INFO').length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FilterTab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl shrink-0 self-end md:self-auto">
            <button
              onClick={() => setViewMode('feed')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'feed'
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Feed
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Table
            </button>
          </div>
        </div>

        {/* Search & Type Select */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/40">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications by title, keyword, or alert details..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">All Alert Types</option>
              <option value="WARNING">Warnings (Low Stock / Risk)</option>
              <option value="ERROR">Critical Errors & Expiry</option>
              <option value="SUCCESS">Success & Reconciliations</option>
              <option value="INFO">System Information</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Notifications Feed View */}
      {viewMode === 'feed' && (
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white dark:bg-slate-800/90 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Bell className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  No notifications match your filter
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  There are currently no active alerts matching the selected category or search term.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={generateSampleAlerts}
                className="font-bold text-xs rounded-xl shadow-md"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Generate Sample Test Alerts
              </Button>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start justify-between gap-4 ${
                  !item.read
                    ? 'bg-indigo-50/20 dark:bg-indigo-950/20 border-primary/40 shadow-sm'
                    : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/60 opacity-90'
                } hover:shadow-md`}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-100 dark:border-slate-700 shadow-sm shrink-0">
                    {getIcon(item.type)}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {item.title}
                      </h3>
                      {getTypeBadge(item.type)}
                      {!item.read && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-500 text-white">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(item.createdAt)}
                      </span>
                      {item.userId && (
                        <span>Target: User #{item.userId}</span>
                      )}
                      {!item.userId && (
                        <span className="text-primary font-semibold">Broadcast: All Organization</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {!item.read ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markAsRead(item.id)}
                      className="text-xs font-bold text-primary border-primary/30 hover:bg-primary/5 rounded-xl px-3 py-1"
                    >
                      Mark Read
                    </Button>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 px-2">
                      <Check className="h-3 w-3 text-emerald-500" />
                      Read
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteNotification(item.id)}
                    className="text-xs text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl px-2.5 py-1"
                    title="Delete Notification"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 5. Notifications Table View */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">Status</th>
                  <th className="py-3 px-4 w-28">Type</th>
                  <th className="py-3 px-4">Title & Message</th>
                  <th className="py-3 px-4 w-44">Timestamp</th>
                  <th className="py-3 px-4 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((n) => (
                    <tr
                      key={n.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors ${
                        !n.read ? 'bg-indigo-50/10 dark:bg-indigo-950/10 font-bold' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        {!n.read ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {getTypeBadge(n.type)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="text-slate-900 dark:text-slate-100 font-bold">
                            {n.title}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-1">
                            {n.message}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {formatDate(n.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!n.read && (
                            <button
                              onClick={() => markAsRead(n.id)}
                              className="p-1 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                              title="Mark Read"
                            >
                              <CheckCheck className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(n.id)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No notifications found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Create Custom Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Send className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Dispatch System Alert
                  </h3>
                  <p className="text-xs text-slate-400">
                    Broadcast an alert or notification to pharmacy staff.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alert Severity / Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['INFO', 'WARNING', 'ERROR', 'SUCCESS'] as NotificationType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: t })}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                        formData.type === t
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alert Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Low Stock Alert: Paracetamol 500mg"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alert Description & Instructions *
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter detailed alert message for pharmacy staff..."
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateModal(false)}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={submitting}
                onClick={handleCreateNotification}
                className="text-xs font-bold rounded-xl shadow-md"
              >
                {submitting ? 'Dispatching...' : 'Dispatch Alert'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}