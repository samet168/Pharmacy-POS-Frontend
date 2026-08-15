'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { LoadingSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { Plus, Search, Edit, Trash2, Settings, Save, ChevronLeft, ChevronRight, Lock, Key } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/authStore';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<any>(null);
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    description: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const { currentUser } = useAuthStore();

  const [settings, setSettings] = useState([
    { id: 1, key: 'company.name', value: 'Pharmacy POS', description: 'Company name displayed in the application' },
    { id: 2, key: 'tax.rate', value: '10', description: 'Default tax rate percentage' },
    { id: 3, key: 'currency.symbol', value: '$', description: 'Currency symbol for display' },
    { id: 4, key: 'decimal.places', value: '2', description: 'Number of decimal places for prices' },
    { id: 5, key: 'low.stock.threshold', value: '10', description: 'Low stock alert threshold' },
    { id: 6, key: 'expiry.warning.days', value: '30', description: 'Days before expiry to show warning' },
  ]);

  useEffect(() => {
    setLoading(false);
  }, []);

  const filteredSettings = settings.filter(setting =>
    setting.key.toLowerCase().includes('') || setting.description.toLowerCase().includes('')
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setSettings([...settings, { ...formData, id: Date.now() }]);
      toast.success('Setting created successfully');
      setIsCreateModalOpen(false);
      setFormData({ key: '', value: '', description: '' });
    } catch (error: any) {
      console.error('Failed to create setting:', error);
      toast.error('Failed to create setting');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setSettings(settings.map(s => s.id === selectedSetting.id ? { ...formData, id: s.id } : s));
      toast.success('Setting updated successfully');
      setIsEditModalOpen(false);
      setSelectedSetting(null);
    } catch (error: any) {
      console.error('Failed to update setting:', error);
      toast.error('Failed to update setting');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setSettings(settings.filter(s => s.id !== selectedSetting.id));
      toast.success('Setting deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedSetting(null);
    } catch (error: any) {
      console.error('Failed to delete setting:', error);
      toast.error('Failed to delete setting');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authApi.changePassword(passwordData);
      toast.success('Password changed successfully');
      setIsPasswordModalOpen(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Failed to change password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (setting: any) => {
    setSelectedSetting(setting);
    setFormData({
      key: setting.key,
      value: setting.value,
      description: setting.description,
    });
    setIsEditModalOpen(true);
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <LoadingSkeleton variant="text" width={200} height={32} />
            <LoadingSkeleton variant="text" width={300} height={20} />
          </div>
          <LoadingSkeleton variant="rectangular" width={150} height={40} />
        </div>
        <Card className="p-6">
          <LoadingSkeleton variant="rectangular" width="100%" height={40} />
          <TableSkeleton rows={5} />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-bento-primary dark:text-slate-100">System Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage system-wide configuration</p>
        </div>
        <Button variant="primary" shape="pill" size="md" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Setting
        </Button>
      </div>

      {/* Change Password Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-bento-primary/10 rounded-xl">
              <Lock className="h-6 w-6 text-bento-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-bento-primary dark:text-slate-100">Change Password</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Update your account password</p>
            </div>
          </div>
          <Button variant="outline" shape="pill" onClick={() => setIsPasswordModalOpen(true)}>
            <Key className="h-4 w-4 mr-2" />
            Change Password
          </Button>
        </div>
      </Card>

      {/* Settings Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Key</TableHeader>
                <TableHeader>Value</TableHeader>
                <TableHeader>Description</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSettings.length > 0 ? (
                filteredSettings.map((setting: any) => (
                  <TableRow key={setting.id}>
                    <TableCell className="font-medium text-bento-primary dark:text-slate-100">
                      {setting.key}
                    </TableCell>
                    <TableCell>{setting.value}</TableCell>
                    <TableCell>{setting.description}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          className="p-2 hover:bg-bento-bg dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-primary dark:hover:text-slate-100"
                          onClick={() => openEditModal(setting)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-2 hover:bg-bento-pink rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-pink-text"
                          onClick={() => {
                            setSelectedSetting(setting);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <Settings className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                      <p className="text-slate-600 dark:text-slate-400 font-medium">No settings found</p>
                      <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                        Add your first setting to get started
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Setting"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Setting Key *"
            value={formData.key}
            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
            required
          />
          <Input
            label="Value *"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            required
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              shape="pill"
              onClick={() => setIsCreateModalOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button variant="primary" shape="pill" loading={submitting} type="submit">
              Create Setting
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Setting"
        size="md"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="Setting Key *"
            value={formData.key}
            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
            required
          />
          <Input
            label="Value *"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            required
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              shape="pill"
              onClick={() => setIsEditModalOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button variant="primary" shape="pill" loading={submitting} type="submit">
              Update Setting
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Setting"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete setting <strong>{selectedSetting?.key}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              shape="pill"
              onClick={() => setIsDeleteModalOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              shape="pill"
              loading={submitting}
              onClick={handleDelete}
            >
              Delete Setting
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Password"
        size="md"
      >
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Input
            label="Current Password *"
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            required
            showPasswordToggle
          />
          <Input
            label="New Password *"
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            required
            showPasswordToggle
          />
          <Input
            label="Confirm Password *"
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            required
            showPasswordToggle
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              shape="pill"
              onClick={() => setIsPasswordModalOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button variant="primary" shape="pill" loading={submitting} type="submit">
              Change Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}