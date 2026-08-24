'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Megaphone, Plus, Calendar, User, ShieldCheck, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/stores/authStore';

const MOCK_ANNOUNCEMENTS = [
  {
    id: 1,
    title: 'Pharmacy SaaS System Maintenance Schedule',
    content: 'Routine server optimization will occur on Sunday at 02:00 AM UTC. Expect 5 minutes of brief offline latency.',
    targetRole: 'All Staff Users',
    postedBy: 'Super Admin',
    createdAt: '2026-08-20',
  },
  {
    id: 2,
    title: 'New Drug Interaction Warning Database Updated',
    content: 'We have integrated 1,200+ active pharmaceutical ingredient contraindication pairs into the POS checkout system.',
    targetRole: 'Pharmacists & Doctors',
    postedBy: 'Medical Advisory',
    createdAt: '2026-08-15',
  },
  {
    id: 3,
    title: 'National Holiday Store Hours & Shift Rosters',
    content: 'Branch operating hours for upcoming holiday will be 08:00 AM - 06:00 PM. Please check shift schedule.',
    targetRole: 'Store Managers & Cashiers',
    postedBy: 'HR Department',
    createdAt: '2026-08-10',
  },
];

export default function AnnouncementsPage() {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState(MOCK_ANNOUNCEMENTS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetRole: 'All Staff Users',
  });

  const handleCreate = () => {
    if (!formData.title || !formData.content) {
      toast.error('Please fill in title and content');
      return;
    }
    const newA = {
      id: Date.now(),
      title: formData.title,
      content: formData.content,
      targetRole: formData.targetRole,
      postedBy: user?.username || 'Super Admin',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setAnnouncements([newA, ...announcements]);
    toast.success('Announcement broadcasted successfully!');
    setShowCreateModal(false);
    setFormData({ title: '', content: '', targetRole: 'All Staff Users' });
  };

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
          <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 font-bold shadow-md">
            <Plus className="h-4 w-4" /> Post Announcement
          </Button>
        </div>
      </div>

      {/* Announcements Feed */}
      <div className="space-y-6">
        {announcements.map((item) => (
          <Card key={item.id} className="p-6 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-bento-primary/10 text-bento-primary rounded-2xl">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">{item.title}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <User className="h-3.5 w-3.5" /> Posted by <strong>{item.postedBy}</strong> · <Calendar className="h-3.5 w-3.5" /> {item.createdAt}
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-bold rounded-full border border-indigo-200 self-start sm:self-auto">
                {item.targetRole}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {item.content}
            </p>
          </Card>
        ))}
      </div>

      {/* CREATE MODAL */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Broadcast New Announcement">
        <div className="space-y-4">
          <Input label="Announcement Title *" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Inventory Audit Notification" />
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Target Role / Audience *</label>
            <select
              className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none"
              value={formData.targetRole}
              onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
            >
              <option value="All Staff Users">All Staff Users</option>
              <option value="Pharmacists & Doctors">Pharmacists & Doctors</option>
              <option value="Store Managers & Cashiers">Store Managers & Cashiers</option>
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
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} disabled={!formData.title || !formData.content}>
              Broadcast Notice
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
