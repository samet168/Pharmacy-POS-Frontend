'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Megaphone, Plus, Calendar, User, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/stores/authStore';
import { notificationsApi, NotificationResponse } from '@/lib/api/notifications';

export default function AnnouncementsPage() {
  const { user, currentUser } = useAuthStore();
  const [announcements, setAnnouncements] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetRole: 'All Staff Users',
  });

  const orgId = currentUser?.organizationId || user?.organizationId || 1;

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      // Announcements are org-wide notifications (INFO type without specific userId)
      const response = await notificationsApi.getOrganizationNotifications(orgId, 0, 50);
      if (response && response.content) {
        setAnnouncements(response.content);
      }
    } catch (error) {
      console.error('Failed to load announcements', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [orgId]);

  const handleCreate = async () => {
    if (!formData.title || !formData.content) {
      toast.error('Please fill in title and content');
      return;
    }
    setSubmitting(true);
    try {
      const newAnnouncement = await notificationsApi.create({
        organizationId: orgId,
        type: 'INFO',
        title: formData.title,
        message: formData.content,
        metadata: JSON.stringify({ targetRole: formData.targetRole }),
      });
      setAnnouncements(prev => [newAnnouncement, ...prev]);
      toast.success('Announcement broadcasted successfully!');
      setShowCreateModal(false);
      setFormData({ title: '', content: '', targetRole: 'All Staff Users' });
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
      toast.success('Announcement deleted');
    } catch (error) {
      toast.error('Failed to delete announcement');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTargetRole = (announcement: NotificationResponse) => {
    if (announcement.metadata) {
      try {
        const meta = JSON.parse(announcement.metadata);
        return meta.targetRole || 'All Staff Users';
      } catch {}
    }
    return 'All Staff Users';
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto px-2 sm:px-4">
        <LoadingSkeleton variant="text" width={240} height={36} />
        {[1, 2, 3].map(i => <LoadingSkeleton key={i} variant="rectangular" width="100%" height={120} />)}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            Company Broadcast Announcements
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            Publish organization-wide notices, policy updates, and staff announcements across all branch locations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={fetchAnnouncements} className="flex items-center gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 font-bold shadow-md">
            <Plus className="h-4 w-4" /> Post Announcement
          </Button>
        </div>
      </div>

      {/* Announcements Feed */}
      <div className="space-y-6">
        {announcements.length === 0 ? (
          <Card className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3 border-dashed">
            <Megaphone className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="font-bold text-base">No announcements yet</p>
            <p className="text-xs">Post an announcement to notify all staff members.</p>
          </Card>
        ) : (
          announcements.map((item) => (
            <Card key={item.id} className="p-6 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-bento-primary/10 text-bento-primary rounded-2xl">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">{item.title}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                      {item.userId ? `User #${item.userId}` : 'System'} ·{' '}
                      <Calendar className="h-3.5 w-3.5" /> {formatDate(item.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-bold rounded-full border border-indigo-200">
                    {getTargetRole(item)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="text-rose-600 border-rose-200 hover:bg-rose-50 p-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {item.message}
              </p>
            </Card>
          ))
        )}
      </div>

      {/* CREATE MODAL */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Broadcast New Announcement">
        <div className="space-y-4">
          <Input
            label="Announcement Title *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Inventory Audit Notification"
          />

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Target Role / Audience *</label>
            <select
              className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none"
              value={formData.targetRole}
              onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
            >
              <option value="All Staff Users">All Staff Users</option>
              <option value="Pharmacists &amp; Doctors">Pharmacists &amp; Doctors</option>
              <option value="Store Managers &amp; Cashiers">Store Managers &amp; Cashiers</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Announcement Message *</label>
            <textarea
              className="w-full p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:outline-none min-h-[100px]"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write broadcast content..."
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={submitting}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={!formData.title || !formData.content}
              loading={submitting}
            >
              Broadcast Notice
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
