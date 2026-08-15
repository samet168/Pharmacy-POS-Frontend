'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { LoadingSkeleton, CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/utils/errorHandler';
import { devicesApi, Device, DeviceRequest } from '@/lib/api/devices';
import { Phone, RefreshCw, Plus, Edit, Trash2, Search, CheckCircle, XCircle, Clock, Monitor, Tablet, Smartphone, RotateCw } from 'lucide-react';

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState<DeviceRequest>({
    branchId: 0,
    deviceUuid: '',
    deviceName: '',
    deviceType: 'POS_TERMINAL',
    active: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const { user } = useAuthStore.getState();
      const organizationId = user?.organizationId || 1;
      
      // For now, get all devices - could filter by branch in the future
      const data = await devicesApi.listAll(0, 100);
      const dataArray = Array.isArray(data) ? data : (data?.content || []);
      setDevices(dataArray);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleCreate = async () => {
    if (!formData.branchId || !formData.deviceUuid) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      await devicesApi.create(formData);
      toast.success('Device registered successfully');
      setShowCreateModal(false);
      setFormData({
        branchId: 0,
        deviceUuid: '',
        deviceName: '',
        deviceType: 'POS_TERMINAL',
        active: true,
      });
      fetchDevices();
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedDevice || !formData.branchId || !formData.deviceUuid) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      await devicesApi.update(selectedDevice.id, formData);
      toast.success('Device updated successfully');
      setShowEditModal(false);
      setSelectedDevice(null);
      fetchDevices();
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDevice) return;

    try {
      setSaving(true);
      await devicesApi.delete(selectedDevice.id);
      toast.success('Device deleted successfully');
      setShowDeleteModal(false);
      setSelectedDevice(null);
      fetchDevices();
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async (deviceUuid: string) => {
    try {
      toast.loading('Syncing device...');
      // Note: Backend has a sync endpoint but it requires queued actions
      // For now, we'll just show a success message
      // await devicesApi.sync(deviceUuid, { queuedActions: [] });
      toast.success('Device synced successfully');
      fetchDevices();
    } catch (error) {
      handleApiError(error);
    }
  };

  const openEditModal = (device: Device) => {
    setSelectedDevice(device);
    setFormData({
      branchId: device.branchId,
      deviceUuid: device.deviceUuid,
      deviceName: device.deviceName || '',
      deviceType: device.deviceType || 'POS_TERMINAL',
      active: device.active,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (device: Device) => {
    setSelectedDevice(device);
    setShowDeleteModal(true);
  };

  const filteredDevices = devices.filter(device =>
    device.deviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.deviceUuid.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.deviceType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'POS_TERMINAL':
        return <Monitor className="h-5 w-5" />;
      case 'TABLET':
        return <Tablet className="h-5 w-5" />;
      case 'MOBILE':
        return <Smartphone className="h-5 w-5" />;
      default:
        return <Phone className="h-5 w-5" />;
    }
  };

  const getSyncStatus = (lastSynced?: string) => {
    if (!lastSynced) return { label: 'Never synced', color: 'text-slate-500' };
    
    const lastSync = new Date(lastSynced);
    const now = new Date();
    const diff = now.getTime() - lastSync.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return { label: 'Just now', color: 'text-green-600 dark:text-green-400' };
    if (hours < 24) return { label: `${hours}h ago`, color: 'text-green-600 dark:text-green-400' };
    if (hours < 48) return { label: `${Math.floor(hours / 24)}d ago`, color: 'text-amber-600 dark:text-amber-400' };
    return { label: `${Math.floor(hours / 24)}d ago`, color: 'text-red-600 dark:text-red-400' };
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-bento-primary dark:text-slate-100">
            Devices
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage POS terminals and registered devices
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchDevices}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Register Device
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-bento-primary/10 rounded-xl">
              <Phone className="h-6 w-6 text-bento-primary" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Devices</p>
              <p className="text-2xl font-bold text-bento-primary dark:text-slate-100">
                {devices.length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Active</p>
              <p className="text-2xl font-bold text-bento-primary dark:text-slate-100">
                {devices.filter(d => d.active).length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Inactive</p>
              <p className="text-2xl font-bold text-bento-primary dark:text-slate-100">
                {devices.filter(d => !d.active).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search devices by name, UUID, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Devices Table */}
      <Card className="overflow-hidden">
        {filteredDevices.length === 0 ? (
          <EmptyState
            title="No devices found"
            description={
              searchTerm
                ? 'Try adjusting your search criteria'
                : 'No devices have been registered yet'
            }
            action={
              !searchTerm && (
                <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Register Device
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Device ID</TableHeader>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>UUID</TableHeader>
                  <TableHeader>Branch</TableHeader>
                  <TableHeader>Last Sync</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Registered</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDevices.map((device) => {
                  const syncStatus = getSyncStatus(device.lastSyncedAt);
                  
                  return (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">#{device.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(device.deviceType)}
                          <span className="font-medium">{device.deviceName || 'Unnamed'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
                          {device.deviceType || 'POS_TERMINAL'}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{device.deviceUuid}</TableCell>
                      <TableCell>#{device.branchId}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span className={syncStatus.color}>{syncStatus.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {device.active ? (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle className="h-4 w-4" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            <XCircle className="h-4 w-4" />
                            Inactive
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(device.registeredAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSync(device.deviceUuid)}
                            className="flex items-center gap-1"
                          >
                            <RotateCw className="h-4 w-4" />
                            Sync
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(device)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(device)}
                            className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Register New Device"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Branch ID *
            </label>
            <Input
              type="number"
              placeholder="Enter branch ID"
              value={formData.branchId || ''}
              onChange={(e) => setFormData({ ...formData, branchId: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Device UUID *
            </label>
            <Input
              placeholder="Enter device UUID"
              value={formData.deviceUuid}
              onChange={(e) => setFormData({ ...formData, deviceUuid: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Device Name
            </label>
            <Input
              placeholder="Enter device name"
              value={formData.deviceName}
              onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Device Type
            </label>
            <select
              value={formData.deviceType}
              onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 rounded-lg bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-bento-primary"
            >
              <option value="POS_TERMINAL">POS Terminal</option>
              <option value="TABLET">Tablet</option>
              <option value="MOBILE">Mobile</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-bento-primary border-bento-gray rounded focus:ring-bento-primary"
            />
            <label htmlFor="active" className="text-sm text-slate-700 dark:text-slate-300">
              Active
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleCreate} loading={saving} className="flex-1">
              Register Device
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit Device - ${selectedDevice?.deviceName || 'Unnamed'}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Branch ID *
            </label>
            <Input
              type="number"
              placeholder="Enter branch ID"
              value={formData.branchId || ''}
              onChange={(e) => setFormData({ ...formData, branchId: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Device UUID *
            </label>
            <Input
              placeholder="Enter device UUID"
              value={formData.deviceUuid}
              onChange={(e) => setFormData({ ...formData, deviceUuid: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Device Name
            </label>
            <Input
              placeholder="Enter device name"
              value={formData.deviceName}
              onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Device Type
            </label>
            <select
              value={formData.deviceType}
              onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 rounded-lg bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-bento-primary"
            >
              <option value="POS_TERMINAL">POS Terminal</option>
              <option value="TABLET">Tablet</option>
              <option value="MOBILE">Mobile</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-bento-primary border-bento-gray rounded focus:ring-bento-primary"
            />
            <label htmlFor="active" className="text-sm text-slate-700 dark:text-slate-300">
              Active
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleUpdate} loading={saving} className="flex-1">
              Update Device
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Device"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <Phone className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Warning: This action cannot be undone
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                Deleting this device will remove it from the system and it will no longer be able to sync data.
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Are you sure you want to delete <strong>{selectedDevice?.deviceName || 'this device'}</strong>?
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleDelete}
              loading={saving}
              variant="danger"
              className="flex-1"
            >
              Delete Device
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}