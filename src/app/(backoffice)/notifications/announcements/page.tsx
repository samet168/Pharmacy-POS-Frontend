'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { notificationsApi, NotificationResponse } from '@/lib/api/notifications';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { toast } from 'sonner';
import {
  Megaphone,
  Plus,
  Calendar,
  User,
  RefreshCw,
  Trash2,
  Search,
  Users,
  Radio,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Send,
  XCircle,
  Building2,
  Flame,
  ShieldAlert,
} from 'lucide-react';

type ViewMode = 'grid' | 'table';
type AudienceTab = 'ALL' | 'All Staff Users' | 'Pharmacists' | 'Cashiers' | 'Store Managers';

export default function AnnouncementsPage() {
  const { user, currentUser } = useAuthStore();
  const [announcements, setAnnouncements] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeAudience, setActiveAudience] = useState<AudienceTab>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetRole: 'All Staff Users',
    priority: 'NORMAL',
  });

  const orgId = currentUser?.organizationId || user?.organizationId || 1;

  // Fetch Announcements
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await notificationsApi.getOrganizationNotifications(orgId, 0, 100);
      if (response && response.content) {
        setAnnouncements(response.content);
      } else {
        setAnnouncements([]);
      }
    } catch (error) {
      console.error('Failed to load announcements', error);
      toast.error('Failed to load organization announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [orgId]);

  // Derived KPI Metrics
  const totalCount = announcements.length;
  const allStaffCount = announcements.filter(a => getTargetRole(a) === 'All Staff Users').length;
  const targetedCount = announcements.filter(a => getTargetRole(a) !== 'All Staff Users').length;
  const recentCount = announcements.filter(a => {
    const diffDays = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 3600 * 24);
    return diffDays <= 7;
  }).length;

  // Filtered Announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(item => {
      const role = getTargetRole(item);

      // Audience Filter
      if (activeAudience !== 'ALL' && role !== activeAudience) {
        return false;
      }

      // Search Filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(q);
        const matchesMsg = item.message?.toLowerCase().includes(q);
        const matchesRole = role.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMsg && !matchesRole) return false;
      }

      return true;
    });
  }, [announcements, activeAudience, searchTerm]);

  // Helper Functions
  function getTargetRole(announcement: NotificationResponse): string {
    if (announcement.metadata) {
      try {
        const meta = JSON.parse(announcement.metadata);
        return meta.targetRole || 'All Staff Users';
      } catch {}
    }
    return 'All Staff Users';
  }

  function getPriority(announcement: NotificationResponse): string {
    if (announcement.metadata) {
      try {
        const meta = JSON.parse(announcement.metadata);
        return meta.priority || 'NORMAL';
      } catch {}
    }
    return announcement.type === 'WARNING' || announcement.type === 'ERROR' ? 'URGENT' : 'NORMAL';
  }

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in both title and announcement message');
      return;
    }

    setSubmitting(true);
    try {
      const newAnnouncement = await notificationsApi.create({
        organizationId: orgId,
        type: formData.priority === 'URGENT' ? 'WARNING' : 'INFO',
        title: formData.title.trim(),
        message: formData.content.trim(),
        metadata: JSON.stringify({
          targetRole: formData.targetRole,
          priority: formData.priority,
        }),
      });

      setAnnouncements(prev => [newAnnouncement, ...prev]);
      toast.success('Announcement broadcasted successfully to all staff!');
      setShowCreateModal(false);
      setFormData({
        title: '',
        content: '',
        targetRole: 'All Staff Users',
        priority: 'NORMAL',
      });
    } catch (error) {
      console.error('Failed to create announcement', error);
      toast.error('Failed to broadcast announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationsApi.delete(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast.success('Announcement removed from broadcast board');
    } catch (error) {
      toast.error('Failed to delete announcement');
    }
  };

  const copyAnnouncementText = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied announcement text to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateSampleBroadcasts = async () => {
    try {
      await notificationsApi.create({
        organizationId: orgId,
        type: 'INFO',
        title: 'Monthly Pharmacy Inventory Audit Schedule',
        message: 'All pharmacists and stock managers are requested to complete the physical count by this Friday 6:00 PM.',
        metadata: JSON.stringify({ targetRole: 'All Staff Users', priority: 'IMPORTANT' }),
      });
      await notificationsApi.create({
        organizationId: orgId,
        type: 'WARNING',
        title: 'Updated Policy on Controlled Substance Prescriptions',
        message: 'Mandatory ID check and 2-step pharmacist sign-off required for all Schedule II dispenses starting tomorrow.',
        metadata: JSON.stringify({ targetRole: 'Pharmacists', priority: 'URGENT' }),
      });
      await notificationsApi.create({
        organizationId: orgId,
        type: 'INFO',
        title: 'New POS Terminal Shortcuts & Barcode Scanners Live',
        message: 'Quick key F2 for customer loyalty lookup is now active on all register terminals.',
        metadata: JSON.stringify({ targetRole: 'Cashiers', priority: 'NORMAL' }),
      });
      toast.success('Generated sample organization broadcasts!');
      fetchAnnouncements();
    } catch (e) {
      toast.error('Failed to generate broadcasts');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Just now';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
            <span className="text-primary font-bold">Announcements</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
              <Megaphone className="h-7 w-7 text-primary shrink-0" />
              Broadcast Announcements
            </h1>
            <Badge variant="success">
              <span className="flex items-center gap-1">
                <Radio className="h-3 w-3 animate-pulse" />
                Live Channel
              </span>
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Publish organization-wide bulletins, operational updates, and regulatory guidelines to pharmacy staff.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnnouncements}
            className="flex items-center gap-1.5 text-xs rounded-xl"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold rounded-xl shadow-md"
          >
            <Plus className="h-3.5 w-3.5" />
            Broadcast Bulletin
          </Button>
        </div>
      </div>

      {/* 2. 4 Bento KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Bulletins */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Broadcasts
            </span>
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {totalCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">published bulletins</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
            <span>Visible to all staff</span>
          </div>
        </div>

        {/* Card 2: General Organization Coverage */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              All Staff Bulletins
            </span>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
              <Users className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {allStaffCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">universal reach</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Building2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Organization wide</span>
          </div>
        </div>

        {/* Card 3: Targeted Dept Bulletins */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Targeted Roles
            </span>
            <div className="p-2.5 bg-amber-500/10 rounded-xl">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {targetedCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">role specific</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Pharmacists, Cashiers & Managers</span>
          </div>
        </div>

        {/* Card 4: Recent Bulletins */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              This Week
            </span>
            <div className="p-2.5 bg-indigo-500/10 rounded-xl">
              <Clock className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-primary">
              {recentCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">recent posts</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>Updated regularly</span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Target Audience Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Announcements', count: totalCount },
              { id: 'All Staff Users', label: 'All Staff', count: allStaffCount },
              { id: 'Pharmacists', label: 'Pharmacists', count: announcements.filter(a => getTargetRole(a) === 'Pharmacists').length },
              { id: 'Cashiers', label: 'Cashiers', count: announcements.filter(a => getTargetRole(a) === 'Cashiers').length },
              { id: 'Store Managers', label: 'Managers', count: announcements.filter(a => getTargetRole(a) === 'Store Managers').length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveAudience(tab.id as AudienceTab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeAudience === tab.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeAudience === tab.id
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
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Cards Grid
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

        {/* Search Input */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/40">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search announcements by subject, keyword, or role..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* 4. Bento Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAnnouncements.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-slate-800/90 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Megaphone className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  No announcements broadcasted yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Keep your pharmacy team aligned by broadcasting critical updates, schedules, or inventory notices.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={generateSampleBroadcasts}
                className="font-bold text-xs rounded-xl shadow-md"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Generate Sample Broadcasts
              </Button>
            </div>
          ) : (
            filteredAnnouncements.map((item) => {
              const role = getTargetRole(item);
              const priority = getPriority(item);
              const isUrgent = priority === 'URGENT';

              return (
                <div
                  key={item.id}
                  className={`bg-white dark:bg-slate-800/90 border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                    isUrgent
                      ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/10'
                      : 'border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Target Role & Date */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                        <Users className="h-3 w-3" />
                        {role}
                      </span>

                      {isUrgent ? (
                        <Badge variant="warning">URGENT</Badge>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(item.createdAt)}
                        </span>
                      )}
                    </div>

                    {/* Announcement Title & Message */}
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4">
                        {item.message}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700/40 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">
                      ID #{item.id} • Broadcast
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => copyAnnouncementText(item.id, `${item.title}\n\n${item.message}`)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="Copy content"
                      >
                        {copiedId === item.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Announcement"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 5. Compact Table View */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 w-36">Target Audience</th>
                  <th className="py-3 px-4">Announcement Subject & Message</th>
                  <th className="py-3 px-4 w-32">Date</th>
                  <th className="py-3 px-4 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                {filteredAnnouncements.length > 0 ? (
                  filteredAnnouncements.map((a) => {
                    const role = getTargetRole(a);
                    return (
                      <tr
                        key={a.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 font-bold text-primary">
                            <Users className="h-3.5 w-3.5" />
                            {role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <p className="text-slate-900 dark:text-slate-100 font-bold">
                              {a.title}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-1">
                              {a.message}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {formatDate(a.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => copyAnnouncementText(a.id, `${a.title}\n\n${a.message}`)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              title="Copy"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(a.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      No announcements found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Broadcast Bulletin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Megaphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Broadcast Announcement
                  </h3>
                  <p className="text-xs text-slate-400">
                    Post a new notice or operational update to pharmacy staff.
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Audience *
                  </label>
                  <select
                    value={formData.targetRole}
                    onChange={e => setFormData({ ...formData, targetRole: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="All Staff Users">All Staff Users</option>
                    <option value="Pharmacists">Pharmacists Only</option>
                    <option value="Cashiers">Cashiers & Sales</option>
                    <option value="Store Managers">Store Managers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="NORMAL">Normal Bulletin</option>
                    <option value="IMPORTANT">Important Notice</option>
                    <option value="URGENT">Urgent / Regulatory</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Subject *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Schedule Update: Physical Stock Audit on Friday"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Content *
                </label>
                <textarea
                  rows={4}
                  placeholder="Write clear instructions, details, and guidelines for staff..."
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
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
                onClick={handleCreate}
                className="text-xs font-bold rounded-xl shadow-md"
              >
                {submitting ? 'Broadcasting...' : 'Broadcast Bulletin'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
