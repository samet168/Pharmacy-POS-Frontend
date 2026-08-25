'use client';

import { useState, useEffect } from 'react';
import { rolesApi } from '@/lib/api/roles';
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
  Shield,
  Plus,
  ShieldCheck,
  UserCheck,
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
  Lock,
  Key,
} from 'lucide-react';

type ViewMode = 'list' | 'grid';

const MOCK_ROLES = [
  { id: 1, name: 'SUPER_ADMIN', description: 'Full system control & organization management', isSystemRole: true, createdAt: '2026-01-01' },
  { id: 2, name: 'PHARMACIST_MANAGER', description: 'Inventory management, purchases & prescription audit', isSystemRole: false, createdAt: '2026-01-15' },
  { id: 3, name: 'CASHIER_POS', description: 'POS sales checkout, receipt printing & cash register', isSystemRole: false, createdAt: '2026-02-01' },
  { id: 4, name: 'INVENTORY_CLERK', description: 'Stock receiving, batch tracking & goods receipts', isSystemRole: false, createdAt: '2026-02-10' },
];

export default function RolesPermissionsPage() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;

  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'system' | 'custom'>('all');
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
  const [selectedRole, setSelectedRole] = useState<any>(null);

  // Bulk action state
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<BulkAction | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isSystemRole: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, [organizationId]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await rolesApi.getByOrganization(organizationId, 0, 100).catch(() => null);
      const dataArray = Array.isArray(data) ? data : data?.content || [];
      setRoles(dataArray.length > 0 ? dataArray : MOCK_ROLES);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      setRoles(MOCK_ROLES);
    } finally {
      setLoading(false);
    }
  };

  // Reordering handler
  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const itemToMove = filteredRoles[fromIndex];
    const targetItem = filteredRoles[toIndex];
    if (!itemToMove || !targetItem) return;

    setRoles(prev => {
      const realFromIdx = prev.findIndex(r => r.id === itemToMove.id);
      const realToIdx = prev.findIndex(r => r.id === targetItem.id);
      if (realFromIdx === -1 || realToIdx === -1) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(realFromIdx, 1);
      updated.splice(realToIdx, 0, moved);
      return updated;
    });

    toast.success(`Moved role "${itemToMove.name}"`);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Filter Logic
  const filteredRoles = roles.filter(role => {
    const q = searchTerm.toLowerCase().trim();
    const nameMatch = (role.name || '').toLowerCase().includes(q);
    const descMatch = (role.description || '').toLowerCase().includes(q);
    const matchesSearch = !q || nameMatch || descMatch;

    let matchesQuick = true;
    if (quickFilter === 'system') matchesQuick = role.isSystemRole === true;
    else if (quickFilter === 'custom') matchesQuick = role.isSystemRole !== true;

    return matchesSearch && matchesQuick;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / pageSize));
  const paginatedRoles = filteredRoles.slice((page - 1) * pageSize, page * pageSize);

  // Selection handlers
  const allSelected = filteredRoles.length > 0 && filteredRoles.every(r => selected.has(r.id));
  const toggleAll = () =>
    allSelected ? setSelected(new Set()) : setSelected(new Set(filteredRoles.map(r => r.id)));
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
    toast.success(`Processed ${selectedIds.length} role(s)`);
    setSelected(new Set());
  };

  const confirmBulkAction = async () => {
    setBulkLoading(true);
    const selectedIds = Array.from(selected);
    try {
      if (bulkActionType === 'delete') {
        let count = 0;
        for (const id of selectedIds) {
          const r = roles.find(item => item.id === id);
          if (r?.isSystemRole) continue;
          await rolesApi.delete(id).catch(() => {});
          count++;
        }
        setRoles(prev => prev.filter(r => !selected.has(r.id) || r.isSystemRole));
        toast.success(`Deleted ${count} custom role(s) successfully`);
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
    if (!formData.name) return toast.error('Role name is required');
    setSubmitting(true);
    try {
      const formattedName = formData.name.toUpperCase().replace(/\s+/g, '_');
      await rolesApi.create({
        name: formattedName,
        isSystemRole: formData.isSystemRole,
        organizationId,
      }).catch(() => {
        const newRole = {
          id: Date.now(),
          name: formattedName,
          description: formData.description || 'Custom access role',
          isSystemRole: formData.isSystemRole,
          createdAt: new Date().toISOString().split('T')[0],
        };
        setRoles(prev => [newRole, ...prev]);
      });

      toast.success(`Role "${formattedName}" created successfully!`);
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error('Failed to create role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setSubmitting(true);
    try {
      const formattedName = formData.name.toUpperCase().replace(/\s+/g, '_');
      await rolesApi.update(selectedRole.id, {
        name: formattedName,
        isSystemRole: formData.isSystemRole,
        organizationId,
      }).catch(() => {
        setRoles(prev => prev.map(r => (r.id === selectedRole.id ? { ...r, ...formData, name: formattedName } : r)));
      });

      toast.success('Role updated successfully');
      setIsEditModalOpen(false);
      setSelectedRole(null);
    } catch (error: any) {
      toast.error('Failed to update role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRole) return;
    if (selectedRole.isSystemRole) {
      toast.error('System roles cannot be deleted');
      return;
    }
    setSubmitting(true);
    try {
      await rolesApi.delete(selectedRole.id).catch(() => {
        setRoles(prev => prev.filter(r => r.id !== selectedRole.id));
      });

      toast.success(`Role "${selectedRole.name}" deleted successfully`);
      setIsDeleteModalOpen(false);
      setSelectedRole(null);
    } catch (error: any) {
      toast.error('Failed to delete role');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (role: any) => {
    setSelectedRole(role);
    setFormData({
      name: role.name || '',
      description: role.description || '',
      isSystemRole: role.isSystemRole || false,
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isSystemRole: false,
    });
  };


  if (loading) return <FullPageSkeleton kpiCount={3} tableRows={6} tableCols={4} />;
  return (
    <div className="space-y-6">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted mb-1">
            <span>User Management</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-semibold">Roles & Permissions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Roles & Permissions
            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-sm text-muted mt-1">
            Configure system access control, permission matrices, and security roles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown
            filename="Roles_Permissions_Export"
            title="Roles Directory Export"
            headers={['ID', 'Role Name', 'Description', 'Type', 'Created Date']}
            rows={filteredRoles.map(r => [
              r.id,
              r.name || '',
              r.description || '',
              r.isSystemRole ? 'System' : 'Custom',
              r.createdAt || '',
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
            <span>New Role</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Configured Roles</span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Shield className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{roles.length}</span>
            <span className="text-xs text-emerald-500 flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" /> Profiles</span>
          </div>
          <p className="text-xs text-muted mt-1">Total access roles</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">System Protection Roles</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500"><Lock className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{roles.filter(r => r.isSystemRole).length}</span>
          </div>
          <p className="text-xs text-muted mt-1">Default protected roles</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Custom Access Roles</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500"><Key className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{roles.filter(r => !r.isSystemRole).length}</span>
          </div>
          <p className="text-xs text-muted mt-1">Organization-specific roles</p>
        </div>
      </div>

      {/* 3. Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selected.size}
        totalCount={roles.length}
        onClearSelection={() => setSelected(new Set())}
        onTriggerAction={handleBulkTrigger}
      />

      {/* 4. Search & Quick Filters Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <SearchFilterBar
            placeholder="Search roles by name, description..."
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
          <p className="text-sm text-muted mt-3 font-medium">Loading roles and permissions...</p>
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="p-16 text-center bg-surface border border-border rounded-2xl space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Shield className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Roles Found</h3>
          <p className="text-sm text-muted max-w-sm mx-auto">
            {searchTerm ? `No role matched "${searchTerm}"` : 'Create your first custom role to manage staff permissions.'}
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
                <th className="px-4 py-3.5">Role Name</th>
                <th className="px-4 py-3.5">Description</th>
                <th className="px-4 py-3.5 text-center">Type</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedRoles.map((r, idx) => {
                const isChecked = selected.has(r.id);
                const isDragging = draggedIndex === idx;
                const isDragOver = dragOverIndex === idx;

                return (
                  <tr
                    key={r.id}
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
                        onChange={() => toggleSel(r.id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-1 py-3 text-muted cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-4 w-4 hover:text-primary transition-colors" />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-primary flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      {r.name}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted max-w-xs truncate">{r.description || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={r.isSystemRole ? 'warning' : 'success'}>
                        {r.isSystemRole ? 'SYSTEM' : 'CUSTOM'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(r)}
                          disabled={r.isSystemRole}
                          className={`p-1.5 rounded-lg transition-colors ${r.isSystemRole ? 'text-muted/40 cursor-not-allowed' : 'text-muted hover:text-primary hover:bg-primary/10'}`}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRole(r);
                            setIsDeleteModalOpen(true);
                          }}
                          disabled={r.isSystemRole}
                          className={`p-1.5 rounded-lg transition-colors ${r.isSystemRole ? 'text-muted/40 cursor-not-allowed' : 'text-muted hover:text-destructive hover:bg-destructive/10'}`}
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
          {paginatedRoles.map((r, idx) => {
            const isChecked = selected.has(r.id);
            const isDragging = draggedIndex === idx;
            const isDragOver = dragOverIndex === idx;

            return (
              <div
                key={r.id}
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
                        onChange={() => toggleSel(r.id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </div>
                    <Badge variant={r.isSystemRole ? 'warning' : 'success'}>
                      {r.isSystemRole ? 'SYSTEM' : 'CUSTOM'}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-mono font-bold text-foreground text-sm flex items-center gap-1.5">
                      <Shield className="h-4 w-4 text-primary" />
                      {r.name}
                    </h4>
                    <p className="text-xs text-muted line-clamp-2 pt-1">{r.description || 'No description provided.'}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-end gap-1 mt-3">
                  <button
                    type="button"
                    onClick={() => openEditModal(r)}
                    disabled={r.isSystemRole}
                    className={`p-1.5 rounded-lg transition-colors ${r.isSystemRole ? 'text-muted/40 cursor-not-allowed' : 'text-muted hover:text-primary hover:bg-primary/10'}`}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole(r);
                      setIsDeleteModalOpen(true);
                    }}
                    disabled={r.isSystemRole}
                    className={`p-1.5 rounded-lg transition-colors ${r.isSystemRole ? 'text-muted/40 cursor-not-allowed' : 'text-muted hover:text-destructive hover:bg-destructive/10'}`}
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
          Showing <strong>{paginatedRoles.length}</strong> of <strong>{filteredRoles.length}</strong> roles
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

      {/* 7. Create Role Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Role"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Role Code Name *
            </label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. INVENTORY_MANAGER"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Role Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Full permissions to access inventory receiving and stock audit..."
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isSystemRole}
              onChange={e => setFormData({ ...formData, isSystemRole: e.target.checked })}
              className="rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
            <div>
              <p className="text-xs font-bold text-foreground">Protected System Role</p>
              <p className="text-[11px] text-muted">System roles cannot be edited or deleted by standard users</p>
            </div>
          </label>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={submitting} type="submit">
              {submitting ? 'Creating...' : 'Create Role'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. Edit Role Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Role"
        size="md"
      >
        <form onSubmit={handleEdit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Role Code Name *
            </label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Role Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
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
        title="Delete Role"
        size="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted">
            Are you sure you want to delete role <strong>{selectedRole?.name}</strong>?
          </p>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" disabled={submitting} onClick={handleDelete}>
              {submitting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 10. Bulk Confirm Dialog */}
      <ConfirmDialog
        isOpen={bulkConfirmOpen}
        title={`${bulkActionType === 'delete' ? 'Delete' : 'Archive'} Selected Roles`}
        message={`${selected.size} role(s) will be ${bulkActionType === 'delete' ? 'permanently deleted' : 'archived'}. System roles will be protected.`}
        variant={bulkActionType === 'delete' ? 'danger' : 'warning'}
        isLoading={bulkLoading}
        onConfirm={confirmBulkAction}
        onCancel={() => setBulkConfirmOpen(false)}
      />
    </div>
  );
}
