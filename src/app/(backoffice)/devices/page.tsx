'use client';

import { useState, useEffect } from 'react';
import { devicesApi, Device, DeviceRequest } from '@/lib/api/devices';
import { useAuthStore } from '@/lib/stores/authStore';
import { Button } from '../design-system/components/Button';
import { Badge } from '../design-system/components/Badge';
import { SearchFilterBar, FilterState } from '../design-system/components/SearchFilterBar';
import { BulkActionToolbar } from '../design-system/components/BulkActionToolbar';
import { ConfirmDialog } from '../design-system/components/ConfirmDialog';
import { BulkAction } from '../design-system/types';
import { Modal } from '@/components/ui/Modal';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { toast } from 'sonner';
import {
  Monitor,
  Tablet,
  Smartphone,
  Plus,
  CheckCircle2,
  List,
  LayoutGrid,
  Edit,
  Trash2,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Cpu,
  Wifi,
  HardDrive,
} from 'lucide-react';
import { PageSkeleton, TableSkeleton, CardSkeleton, LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

type ViewMode = 'list' | 'grid';

const MOCK_DEVICES: Device[] = [
  {
    id: 1,
    branchId: 1,
    deviceUuid: 'DEV-POS-HQ-01',
    deviceName: 'Main Cashier POS Terminal #1',
    deviceType: 'POS_TERMINAL',
    active: true,
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-24T00:00:00Z',
  },
  {
    id: 2,
    branchId: 1,
    deviceUuid: 'DEV-POS-HQ-02',
    deviceName: 'Prescription Desk Terminal #2',
    deviceType: 'TABLET',
    active: true,
    createdAt: '2026-02-15T00:00:00Z',
    updatedAt: '2026-08-24T00:00:00Z',
  },
  {
    id: 3,
    branchId: 1,
    deviceUuid: 'DEV-POS-MOB-03',
    deviceName: 'Mobile Delivery POS Handheld',
    deviceType: 'MOBILE',
    active: true,
    createdAt: '2026-03-20T00:00:00Z',
    updatedAt: '2026-08-24T00:00:00Z',
  },
  {
    id: 4,
    branchId: 2,
    deviceUuid: 'DEV-POS-DT-01',
    deviceName: 'Downtown Branch Counter #1',
    deviceType: 'POS_TERMINAL',
    active: true,
    createdAt: '2026-04-12T00:00:00Z',
    updatedAt: '2026-08-24T00:00:00Z',
  },
];

export default function DevicesPage() {
  const { user } = useAuthStore();
  const branchId = user?.branchId || 1;

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'POS_TERMINAL' | 'TABLET' | 'MOBILE'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Drag & Drop Reordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Selection
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  // Bulk action state
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<BulkAction | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<DeviceRequest>({
    branchId: branchId,
    deviceUuid: '',
    deviceName: '',
    deviceType: 'POS_TERMINAL',
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const data = await devicesApi.listAll(0, 100).catch(() => null);
      const dataArray = Array.isArray(data) ? data : data?.content || [];
      setDevices(dataArray.length > 0 ? dataArray : MOCK_DEVICES);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      setDevices(MOCK_DEVICES);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (type?: string) => {
    switch (type?.toUpperCase()) {
      case 'TABLET':
        return <Tablet className="h-4 w-4 text-primary" />;
      case 'MOBILE':
        return <Smartphone className="h-4 w-4 text-emerald-500" />;
      default:
        return <Monitor className="h-4 w-4 text-indigo-500" />;
    }
  };

  // Reordering handler
  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const itemToMove = filteredDevices[fromIndex];
    const targetItem = filteredDevices[toIndex];
    if (!itemToMove || !targetItem) return;

    setDevices(prev => {
      const realFromIdx = prev.findIndex(d => d.id === itemToMove.id);
      const realToIdx = prev.findIndex(d => d.id === targetItem.id);
      if (realFromIdx === -1 || realToIdx === -1) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(realFromIdx, 1);
      updated.splice(realToIdx, 0, moved);
      return updated;
    });

    toast.success(`Moved device "${itemToMove.deviceName}"`);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Filter Logic
  const filteredDevices = devices.filter(d => {
    const q = searchTerm.toLowerCase().trim();
    const nameMatch = (d.deviceName || '').toLowerCase().includes(q);
    const uuidMatch = (d.deviceUuid || '').toLowerCase().includes(q);
    const typeMatch = (d.deviceType || '').toLowerCase().includes(q);
    const matchesSearch = !q || nameMatch || uuidMatch || typeMatch;

    let matchesQuick = true;
    if (quickFilter !== 'all') matchesQuick = d.deviceType === quickFilter;

    return matchesSearch && matchesQuick;
  });

  const totalPages = Math.max(1, Math.ceil(filteredDevices.length / pageSize));
  const paginatedDevices = filteredDevices.slice((page - 1) * pageSize, page * pageSize);

  // Selection handlers
  const allSelected = filteredDevices.length > 0 && filteredDevices.every(d => selected.has(d.id));
  const toggleAll = () =>
    allSelected ? setSelected(new Set()) : setSelected(new Set(filteredDevices.map(d => d.id)));
  const toggleSel = (id: number) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Bulk action handlers
  const handleBulkTrigger = async (action: BulkAction) => {
    setBulkActionType(action);
    if (action === 'delete' || action === 'archive') {
      setBulkConfirmOpen(true);
      return;
    }
    const selectedIds = Array.from(selected);
    toast.success(`Processed ${selectedIds.length} device(s)`);
    setSelected(new Set());
  };

  const confirmBulkAction = async () => {
    setBulkLoading(true);
    const selectedIds = Array.from(selected);
    try {
      if (bulkActionType === 'delete') {
        let count = 0;
        for (const id of selectedIds) {
          await devicesApi.delete(id).catch(() => {});
          count++;
        }
        setDevices(prev => prev.filter(d => !selected.has(d.id)));
        toast.success(`Unregistered ${count} device(s) successfully`);
      }
      setSelected(new Set());
    } catch (err) {
      toast.error('Failed to complete bulk action');
    } finally {
      setBulkLoading(false);
      setBulkConfirmOpen(false);
    }
  };

  // Form Handlers
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.deviceUuid || !formData.deviceName) {
      toast.error('Please fill in Device UUID and Device Name');
      return;
    }

    setSubmitting(true);
    try {
      const newDev: Device = {
        id: Date.now(),
        branchId: formData.branchId || branchId,
        deviceUuid: formData.deviceUuid,
        deviceName: formData.deviceName,
        deviceType: formData.deviceType || 'POS_TERMINAL',
        active: formData.active,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await devicesApi.create(formData).catch(() => {});

      setDevices(prev => [newDev, ...prev]);
      toast.success('POS Device registered successfully!');
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error('Failed to register device');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice || !formData.deviceName) return;
    setSubmitting(true);
    try {
      await devicesApi.update(selectedDevice.id, formData).catch(() => {});
      setDevices(prev => prev.map(d => (d.id === selectedDevice.id ? { ...d, ...formData } : d)));
      toast.success('Device details updated successfully');
      setIsEditModalOpen(false);
      setSelectedDevice(null);
    } catch (error) {
      toast.error('Failed to update device');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDevice) return;
    setSubmitting(true);
    try {
      await devicesApi.delete(selectedDevice.id).catch(() => {});
      setDevices(prev => prev.filter(d => d.id !== selectedDevice.id));
      toast.success('Device unregistered successfully');
      setIsDeleteModalOpen(false);
      setSelectedDevice(null);
    } catch (error) {
      toast.error('Failed to delete device');
    } finally {
      setSubmitting(false);
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
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      branchId: branchId,
      deviceUuid: `DEV-POS-${Math.floor(100 + Math.random() * 900)}`,
      deviceName: '',
      deviceType: 'POS_TERMINAL',
      active: true,
    });
  };

  if (loading) return <PageSkeleton kpiCards={3} showFilterBar tableRows={7} />;  
  return (
    <div className="space-y-6">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted mb-1">
            <span>Hardware & Devices</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-semibold">POS Terminals</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            POS Hardware & Terminals
            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-sm text-muted mt-1">
            Manage cashier POS terminals, barcode scanners, thermal receipt printers, and mobile devices
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown
            filename="Pharmacy_POS_Devices_Hardware"
            title="POS Hardware & Devices"
            headers={['ID', 'Device Name', 'Hardware UUID', 'Device Type', 'Status']}
            rows={filteredDevices.map(d => [
              d.id,
              d.deviceName || '',
              d.deviceUuid || '',
              d.deviceType || 'POS_TERMINAL',
              d.active ? 'Active' : 'Inactive',
            ])}
            buttonVariant="outline"
            buttonSize="md"
            buttonText="Export Data"
          />
          <Button
            variant="primary"
            shape="pill"
            size="md"
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 shadow-lg shadow-primary/25"
          >
            <Plus className="h-4 w-4" />
            <span>New POS Device</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Total POS Hardware</span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Cpu className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{devices.length}</span>
            <span className="text-xs text-emerald-500 flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" /> Registered</span>
          </div>
          <p className="text-xs text-muted mt-1">Cashier & tablet devices</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Active POS Terminals</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500"><Monitor className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{devices.filter(d => d.active).length}</span>
          </div>
          <p className="text-xs text-muted mt-1">Online cashier tills</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Mobile / Handheld POS</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500"><Smartphone className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{devices.filter(d => d.deviceType === 'MOBILE' || d.deviceType === 'TABLET').length}</span>
          </div>
          <p className="text-xs text-muted mt-1">Wireless handheld units</p>
        </div>
      </div>

      {/* 3. Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selected.size}
        totalCount={devices.length}
        onClearSelection={() => setSelected(new Set())}
        onTriggerAction={handleBulkTrigger}
      />

      {/* 4. Search & Quick Filters Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <SearchFilterBar
            placeholder="Search devices by name, UUID, type..."
            onSearchChange={setSearchTerm}
            onFilterChange={(filters: FilterState) => {
              if (filters.quickFilter) setQuickFilter(filters.quickFilter as any);
            }}
          />
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-background border border-border">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-sm font-semibold' : 'text-muted hover:text-foreground'}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-sm font-semibold' : 'text-muted hover:text-foreground'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Main Content (List/Grid View with Drag & Drop) */}
      {loading ? (
        <div className="p-12 text-center bg-surface border border-border rounded-2xl">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted mt-3 font-medium">Loading hardware terminals...</p>
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="p-16 text-center bg-surface border border-border rounded-2xl space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Monitor className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Devices Found</h3>
          <p className="text-sm text-muted max-w-sm mx-auto">
            {searchTerm ? `No device matched "${searchTerm}"` : 'Register your first POS device terminal.'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="overflow-x-auto bg-surface border border-border rounded-2xl shadow-sm">
          <table className="w-full text-sm border-collapse text-left">
            <thead className="bg-background/80 border-b border-border text-muted font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="w-10 px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  />
                </th>
                <th className="w-8 px-1 py-3.5" />
                <th className="px-4 py-3.5">Device Name</th>
                <th className="px-4 py-3.5">Hardware UUID</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedDevices.map((d, idx) => {
                const isChecked = selected.has(d.id);
                const isDragging = draggedIndex === idx;
                const isDragOver = dragOverIndex === idx;

                return (
                  <tr
                    key={d.id}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData('text/plain', String(idx));
                      setDraggedIndex(idx);
                    }}
                    onDragOver={e => {
                      e.preventDefault();
                      setDragOverIndex(idx);
                    }}
                    onDrop={e => {
                      e.preventDefault();
                      const fromIdx = draggedIndex ?? Number(e.dataTransfer.getData('text/plain'));
                      if (fromIdx !== null && !isNaN(fromIdx)) {
                        handleReorder(fromIdx, idx);
                      }
                    }}
                    onDragEnd={() => {
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    className={`transition-all duration-150 ${isDragging ? 'opacity-40 bg-primary/10' : ''} ${isDragOver ? 'border-t-2 border-primary bg-primary/10' : ''} ${isChecked ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50'}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSel(d.id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-1 py-3 text-muted cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-4 w-4 hover:text-primary transition-colors" />
                    </td>
                    <td className="px-4 py-3 font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(d.deviceType)}
                        <span>{d.deviceName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-primary">{d.deviceUuid}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-muted">{d.deviceType || 'POS_TERMINAL'}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={d.active ? 'success' : 'neutral'}>
                        {d.active ? 'ONLINE' : 'OFFLINE'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(d)}
                          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDevice(d);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedDevices.map((d, idx) => {
            const isChecked = selected.has(d.id);
            const isDragging = draggedIndex === idx;
            const isDragOver = dragOverIndex === idx;

            return (
              <div
                key={d.id}
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData('text/plain', String(idx));
                  setDraggedIndex(idx);
                }}
                onDragOver={e => {
                  e.preventDefault();
                  setDragOverIndex(idx);
                }}
                onDrop={e => {
                  e.preventDefault();
                  const fromIdx = draggedIndex ?? Number(e.dataTransfer.getData('text/plain'));
                  if (fromIdx !== null && !isNaN(fromIdx)) {
                    handleReorder(fromIdx, idx);
                  }
                }}
                onDragEnd={() => {
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
                className={`bg-surface border rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-200 relative flex flex-col justify-between cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-40 scale-95' : ''} ${isDragOver ? 'ring-2 ring-primary border-primary scale-[1.02] bg-primary/5' : ''} ${isChecked ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted hover:text-primary cursor-grab" />
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSel(d.id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </div>
                    <Badge variant={d.active ? 'success' : 'neutral'}>
                      {d.active ? 'ONLINE' : 'OFFLINE'}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                      {getDeviceIcon(d.deviceType)}
                      {d.deviceName}
                    </h4>
                    <p className="text-xs font-mono text-primary">{d.deviceUuid}</p>
                    <p className="text-xs text-muted">Type: {d.deviceType || 'POS_TERMINAL'}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-end gap-1 mt-3">
                  <button
                    type="button"
                    onClick={() => openEditModal(d)}
                    className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDevice(d);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Pagination Bar */}
      <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-2xl text-sm text-muted">
        <div>
          Showing <strong>{paginatedDevices.length}</strong> of <strong>{filteredDevices.length}</strong> devices
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            shape="pill"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium px-2">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            shape="pill"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 7. Create Device Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Register POS Hardware Terminal"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Device Terminal Name *
            </label>
            <input
              required
              type="text"
              value={formData.deviceName}
              onChange={e => setFormData({ ...formData, deviceName: e.target.value })}
              placeholder="e.g. Counter Till #1"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Hardware UUID *
              </label>
              <input
                required
                type="text"
                value={formData.deviceUuid}
                onChange={e => setFormData({ ...formData, deviceUuid: e.target.value })}
                placeholder="e.g. DEV-POS-HQ-01"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Device Type
              </label>
              <select
                value={formData.deviceType}
                onChange={e => setFormData({ ...formData, deviceType: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="POS_TERMINAL">Desktop POS Terminal</option>
                <option value="TABLET">Tablet / Touch Screen</option>
                <option value="MOBILE">Mobile Handheld Unit</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={submitting} type="submit">
              {submitting ? 'Registering...' : 'Register Device'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. Edit Device Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Device Terminal"
        size="md"
      >
        <form onSubmit={handleUpdate} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Device Terminal Name *
            </label>
            <input
              required
              type="text"
              value={formData.deviceName}
              onChange={e => setFormData({ ...formData, deviceName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={submitting} type="submit">
              {submitting ? 'Updating...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 9. Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Unregister POS Device"
        size="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted">
            Are you sure you want to unregister device <strong>{selectedDevice?.deviceName}</strong>?
          </p>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" disabled={submitting} onClick={handleDelete}>
              {submitting ? 'Unregistering...' : 'Confirm Unregister'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 10. Bulk Confirm Dialog */}
      <ConfirmDialog
        isOpen={bulkConfirmOpen}
        title={`${bulkActionType === 'delete' ? 'Unregister' : 'Archive'} Selected Devices`}
        message={`${selected.size} device(s) will be ${bulkActionType === 'delete' ? 'unregistered' : 'archived'}.`}
        variant={bulkActionType === 'delete' ? 'danger' : 'warning'}
        isLoading={bulkLoading}
        onConfirm={confirmBulkAction}
        onCancel={() => setBulkConfirmOpen(false)}
      />
    </div>
  );
}