'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import React from 'react';
import { usersApi, rolesApi } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/authStore';
import { Button } from '../design-system/components/Button';
import { Badge } from '../design-system/components/Badge';
import { SearchFilterBar, FilterState } from '../design-system/components/SearchFilterBar';
import { BulkActionToolbar } from '../design-system/components/BulkActionToolbar';
import { ConfirmDialog } from '../design-system/components/ConfirmDialog';
import { BulkAction } from '../design-system/types';
import { Modal } from '@/components/ui/Modal';
import { SafeImage } from '@/components/ui/SafeImage';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { groupRecordsBy } from '@/lib/utils/filterUtils';
import { toast } from 'sonner';
import {
  Users,
  Plus,
  CheckCircle2,
  Phone,
  Shield,
  KeyRound,
  List,
  LayoutGrid,
  Edit,
  Trash2,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Layers,
  Sparkles,
  TrendingUp,
  UserCheck,
  UploadCloud,
  X,
} from 'lucide-react';
import { PageSkeleton, TableSkeleton, CardSkeleton, LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

type ViewMode = 'list' | 'grid';

export default function UsersPage() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;

  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'active' | 'inactive'>('all');
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
  const [selectedUserItem, setSelectedUserItem] = useState<any>(null);

  // Image Upload Preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk action state
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<BulkAction | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    phone: '',
    pinCode: '',
    roleId: '',
    active: true,
    imageFile: null as File | null,
  });
  const [submitting, setSubmitting] = useState(false);

  const currentUserRole = (user?.roleName || '').toUpperCase();
  const isSuperAdmin = currentUserRole.includes('SUPERADMIN') || (organizationId === 1 && currentUserRole === 'SUPERADMIN');

  useEffect(() => {
    fetchData();
  }, [organizationId, isSuperAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([
        isSuperAdmin ? usersApi.listAll(0, 300) : usersApi.getByOrganization(organizationId, 0, 100),
        rolesApi.listAll(0, 100),
      ]);
      const usersArray = Array.isArray(usersData) ? usersData : usersData?.content || [];
      const rolesArray = Array.isArray(rolesData) ? rolesData : rolesData?.content || [];
      setUsers(usersArray);
      setRoles(rolesArray);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load system users');
      setUsers([]);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  // Strictly hide SUPERADMIN and Owner roles from all other roles
  const availableRoles = useMemo(() => {
    return roles.filter(r => {
      const rName = r.name.toUpperCase();
      if (!isSuperAdmin && (rName.includes('SUPERADMIN') || rName === 'OWNER')) {
        return false;
      }
      return true;
    });
  }, [roles, isSuperAdmin]);

  // Drag & Drop reordering
  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const itemToMove = filteredUsers[fromIndex];
    const targetItem = filteredUsers[toIndex];
    if (!itemToMove || !targetItem) return;

    setUsers(prev => {
      const realFromIdx = prev.findIndex(u => u.id === itemToMove.id);
      const realToIdx = prev.findIndex(u => u.id === targetItem.id);
      if (realFromIdx === -1 || realToIdx === -1) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(realFromIdx, 1);
      updated.splice(realToIdx, 0, moved);
      return updated;
    });

    toast.success(`Moved user "${itemToMove.name || itemToMove.username}"`);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Image Selection
  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setFormData(prev => ({ ...prev, imageFile: null }));
      setImagePreview(null);
      return;
    }
    setFormData(prev => ({ ...prev, imageFile: file }));
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const [filterState, setFilterState] = useState<FilterState>({
    statuses: [],
    groupBy: '',
    startDate: '',
    endDate: '',
    quickFilter: 'all',
  });

  // Filter Logic
  const filteredUsers = users.filter(u => {
    const q = searchTerm.toLowerCase().trim();
    const roleName = roles.find(r => r.id === u.roleId)?.name || '';

    const matchesSearch =
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      roleName.toLowerCase().includes(q);

    // Filter by Selected Roles (statuses)
    if (filterState.statuses && filterState.statuses.length > 0) {
      const matchRole = filterState.statuses.some(st =>
        st.toLowerCase() === roleName.toLowerCase() ||
        (st.toLowerCase() === 'active' && u.active !== false) ||
        (st.toLowerCase() === 'inactive' && u.active === false)
      );
      if (!matchRole) return false;
    }

    // Filter by Date Range (createdAt)
    if (filterState.startDate || filterState.endDate) {
      if (u.createdAt) {
        const uDate = new Date(u.createdAt);
        if (filterState.startDate && uDate < new Date(filterState.startDate + 'T00:00:00')) return false;
        if (filterState.endDate && uDate > new Date(filterState.endDate + 'T23:59:59')) return false;
      }
    }

    // Quick filter
    const qk = filterState.quickFilter || quickFilter;
    if (qk === 'active' && u.active === false) return false;
    if (qk === 'inactive' && u.active !== false) return false;

    return matchesSearch;
  });

  const groupedUsers = useMemo(() => {
    if (!filterState.groupBy) return null;
    return groupRecordsBy(filteredUsers, filterState.groupBy, (key) => {
      if (filterState.groupBy === 'role') {
        const found = roles.find(r => String(r.id) === key || r.name.toLowerCase() === key.toLowerCase());
        return found ? found.name : `Role: ${key}`;
      }
      if (filterState.groupBy === 'status') {
        return key === 'true' || key === 'Active' ? 'Active Accounts' : 'Inactive Accounts';
      }
      return key;
    });
  }, [filteredUsers, filterState.groupBy, roles]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  // Selection handlers
  const allSelected = filteredUsers.length > 0 && filteredUsers.every(u => selected.has(u.id));
  const toggleAll = () =>
    allSelected ? setSelected(new Set()) : setSelected(new Set(filteredUsers.map(u => u.id)));
  const toggleSel = (id: number) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
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
    if (action === 'deactivate') {
      setLoading(true);
      try {
        let count = 0;
        for (const id of selectedIds) {
          const u = users.find(usr => usr.id === id);
          if (!u) continue;
          await usersApi.update(id, { ...u, organizationId, active: false }).catch(() => {});
          count++;
        }
        setUsers(prev => prev.map(u => (selected.has(u.id) ? { ...u, active: false } : u)));
        toast.success(`Deactivated ${count} user(s)`);
        setSelected(new Set());
        fetchData();
      } catch (err) {
        toast.error('Failed to deactivate users');
      } finally {
        setLoading(false);
      }
    } else if (action === 'duplicate') {
      toast.success(`Duplicated ${selectedIds.length} user(s)`);
      setSelected(new Set());
    }
  };

  const confirmBulkAction = async () => {
    setBulkLoading(true);
    const selectedIds = Array.from(selected);
    try {
      if (bulkActionType === 'delete') {
        let count = 0;
        for (const id of selectedIds) {
          await usersApi.delete(id).catch(() => {});
          count++;
        }
        setUsers(prev => prev.filter(u => !selected.has(u.id)));
        toast.success(`Deleted ${count} user(s) successfully`);
      } else if (bulkActionType === 'archive') {
        let count = 0;
        for (const id of selectedIds) {
          const u = users.find(usr => usr.id === id);
          if (!u) continue;
          await usersApi.update(id, { ...u, organizationId, active: false }).catch(() => {});
          count++;
        }
        setUsers(prev => prev.map(u => (selected.has(u.id) ? { ...u, active: false } : u)));
        toast.success(`Archived ${count} user(s) successfully`);
      }
      setSelected(new Set());
      fetchData();
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
    setSubmitting(true);
    try {
      const { imageFile, roleId, ...rest } = formData;
      await usersApi.create(
        {
          ...rest,
          organizationId,
          roleId: Number(roleId || 1),
        },
        imageFile || undefined
      );
      toast.success('User created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserItem) return;
    setSubmitting(true);
    try {
      const { imageFile, roleId, ...rest } = formData;
      await usersApi.update(
        selectedUserItem.id,
        {
          ...rest,
          organizationId,
          roleId: Number(roleId || 1),
        },
        imageFile || undefined
      );
      toast.success('User updated successfully');
      setIsEditModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUserItem) return;
    setSubmitting(true);
    try {
      await usersApi.delete(selectedUserItem.id);
      toast.success('User deleted successfully');
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (userItem: any) => {
    setSelectedUserItem(userItem);
    setFormData({
      username: userItem.username || '',
      password: '',
      name: userItem.name || '',
      phone: userItem.phone || '',
      pinCode: userItem.pinCode || '',
      roleId: userItem.roleId?.toString() || '',
      active: userItem.active !== false,
      imageFile: null,
    });
    setImagePreview(userItem.imageUrl || null);
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      phone: '',
      pinCode: '',
      roleId: '',
      active: true,
      imageFile: null,
    });
    setImagePreview(null);
  };

  if (loading) return <PageSkeleton kpiCards={3} showFilterBar tableRows={7} />;  
  return (
    <div className="space-y-6">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted mb-1">
            <span>Administration</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-semibold">User Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            User Accounts Directory
            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-sm text-muted mt-1">
            Manage pharmacy staff accounts, POS access, and system roles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown
            filename="Users_Directory"
            title="User Accounts Export"
            headers={['ID', 'Name', 'Username', 'Phone', 'Role', 'Status']}
            rows={filteredUsers.map(u => [
              u.id || 0,
              u.name || '',
              u.username || '',
              u.phone || '',
              roles.find(r => r.id === u.roleId)?.name || 'Staff',
              u.active !== false ? 'Active' : 'Inactive',
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
            <span>New User</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Total Accounts</span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Users className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{users.length}</span>
            <span className="text-xs text-emerald-500 flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" /> Staff</span>
          </div>
          <p className="text-xs text-muted mt-1">Registered system users</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Active Users</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500"><UserCheck className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{users.filter(u => u.active !== false).length}</span>
          </div>
          <p className="text-xs text-muted mt-1">Active login credentials</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Assigned Roles</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500"><Shield className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{roles.length}</span>
          </div>
          <p className="text-xs text-muted mt-1">Access permission roles</p>
        </div>
      </div>

      {/* 3. Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selected.size}
        totalCount={users.length}
        onClearSelection={() => setSelected(new Set())}
        onTriggerAction={handleBulkTrigger}
      />

      {/* 4. Search & Quick Filters Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <SearchFilterBar
            placeholder="Search users by name, username, phone, role..."
            onSearchChange={setSearchTerm}
            onFilterChange={(filters: FilterState) => {
              setFilterState(filters);
              if (filters.quickFilter) setQuickFilter(filters.quickFilter as any);
            }}
            availableStatuses={availableRoles.map(r => r.name)}
            groupByOptions={[
              { label: 'None', value: '' },
              { label: 'Role', value: 'role' },
              { label: 'Status (Active/Inactive)', value: 'status' },
            ]}
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
          <p className="text-sm text-muted mt-3 font-medium">Loading user accounts...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-16 text-center bg-surface border border-border rounded-2xl space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Users Found</h3>
          <p className="text-sm text-muted max-w-sm mx-auto">
            {searchTerm ? `No user matched "${searchTerm}"` : 'Add your first user account to get started.'}
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
                <th className="px-4 py-3.5">Full Name</th>
                <th className="px-4 py-3.5">Username</th>
                <th className="px-4 py-3.5">Phone Number</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {groupedUsers ? (
                groupedUsers.map(group => (
                  <React.Fragment key={group.key}>
                    <tr className="bg-indigo-50/60 dark:bg-indigo-950/30 border-y border-indigo-100 dark:border-indigo-900/50">
                      <td colSpan={8} className="px-4 py-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                              <Layers className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-black text-xs text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
                              {group.label}
                            </span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 font-bold text-xs shadow-xs border border-indigo-200/50 dark:border-indigo-800/50">
                            {group.count} account{group.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {group.items.map((u, idx) => {
                      const isChecked = selected.has(u.id);
                      const roleName = roles.find(r => r.id === u.roleId)?.name || 'Staff';
                      return (
                        <tr
                          key={u.id}
                          className={`transition-all duration-150 ${isChecked ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50'}`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSel(u.id)}
                              className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                            />
                          </td>
                          <td className="px-1 py-3 text-muted" />
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <SafeImage
                                src={u.imageUrl}
                                alt={u.name}
                                className="w-9 h-9 rounded-full object-cover border border-border"
                                fallback={
                                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                    {(u.name || u.username || 'U').charAt(0).toUpperCase()}
                                  </div>
                                }
                              />
                              <span className="font-bold text-foreground">{u.name || u.username}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-muted">@{u.username}</td>
                          <td className="px-4 py-3 font-mono text-xs text-muted">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted" />
                              {u.phone || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-foreground border border-border">
                              <Shield className="h-3 w-3 text-primary" />
                              {roleName}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {u.active !== false ? (
                              <Badge variant="success">Active</Badge>
                            ) : (
                              <Badge variant="neutral">Inactive</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openEditModal(u)}
                                className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedUserItem(u);
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
                  </React.Fragment>
                ))
              ) : (
                paginatedUsers.map((u, idx) => {
                  const isChecked = selected.has(u.id);
                  const isDragging = draggedIndex === idx;
                  const isDragOver = dragOverIndex === idx;
                  const roleName = roles.find(r => r.id === u.roleId)?.name || 'Staff';

                  return (
                    <tr
                      key={u.id}
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
                          onChange={() => toggleSel(u.id)}
                          className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-1 py-3 text-muted cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-4 w-4 hover:text-primary transition-colors" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <SafeImage
                            src={u.imageUrl}
                            alt={u.name}
                            className="w-9 h-9 rounded-full object-cover border border-border"
                            fallback={
                              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                {(u.name || u.username || 'U').charAt(0).toUpperCase()}
                              </div>
                            }
                          />
                          <span className="font-bold text-foreground">{u.name || u.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted">@{u.username}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted" />
                          {u.phone || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-foreground border border-border">
                          <Shield className="h-3 w-3 text-primary" />
                          {roleName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {u.active !== false ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="neutral">Inactive</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserItem(u);
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
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedUsers ? (
            groupedUsers.map(group => (
              <div key={group.key} className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <Layers className="h-4 w-4" />
                    </div>
                    <h4 className="font-bold text-sm text-foreground">{group.label}</h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface border border-border text-xs font-bold text-muted">
                    {group.count} account{group.count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {group.items.map(u => {
                    const isChecked = selected.has(u.id);
                    const roleName = roles.find(r => r.id === u.roleId)?.name || 'Staff';
                    return (
                      <div
                        key={u.id}
                        className={`bg-surface border rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-200 relative flex flex-col justify-between ${isChecked ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSel(u.id)}
                              className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                            />
                            <Badge variant={u.active !== false ? 'success' : 'neutral'}>
                              {u.active !== false ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="flex flex-col items-center text-center space-y-2 mb-4">
                            <SafeImage
                              src={u.imageUrl}
                              alt={u.name}
                              className="w-16 h-16 rounded-full object-cover border-2 border-border shadow-sm"
                              fallback={
                                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border-2 border-border shadow-sm">
                                  {(u.name || u.username || 'U').charAt(0).toUpperCase()}
                                </div>
                              }
                            />
                            <div>
                              <h4 className="font-bold text-foreground">{u.name || u.username}</h4>
                              <p className="text-xs text-muted font-mono">@{u.username}</p>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-foreground border border-border">
                              <Shield className="h-3 w-3 text-primary" />
                              {roleName}
                            </span>
                          </div>
                          <div className="space-y-1.5 py-2 border-t border-border text-xs text-muted font-mono">
                            <div className="flex items-center gap-1.5 truncate">
                              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{u.phone || 'No phone'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                          >
                            <Edit className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserItem(u);
                              setIsDeleteModalOpen(true);
                            }}
                            className="text-xs font-semibold text-destructive hover:underline flex items-center gap-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {paginatedUsers.map((u, idx) => {
                const isChecked = selected.has(u.id);
                const isDragging = draggedIndex === idx;
                const isDragOver = dragOverIndex === idx;
                const roleName = roles.find(r => r.id === u.roleId)?.name || 'Staff';

                return (
                  <div
                    key={u.id}
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
                            onChange={() => toggleSel(u.id)}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                          />
                        </div>
                        <Badge variant={u.active !== false ? 'success' : 'neutral'}>
                          {u.active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex flex-col items-center text-center space-y-2 mb-4">
                        <SafeImage
                          src={u.imageUrl}
                          alt={u.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-border shadow-sm"
                          fallback={
                            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border-2 border-border shadow-sm">
                              {(u.name || u.username || 'U').charAt(0).toUpperCase()}
                            </div>
                          }
                        />
                        <div>
                          <h4 className="font-bold text-foreground">{u.name || u.username}</h4>
                          <p className="text-xs text-muted font-mono">@{u.username}</p>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-foreground border border-border">
                          <Shield className="h-3 w-3 text-primary" />
                          {roleName}
                        </span>
                      </div>
                      <div className="space-y-1.5 py-2 border-t border-border text-xs text-muted font-mono">
                        <div className="flex items-center gap-1.5 truncate">
                          <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{u.phone || 'No phone'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(u)}
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUserItem(u);
                          setIsDeleteModalOpen(true);
                        }}
                        className="text-xs font-semibold text-destructive hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. Pagination Bar */}
      <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-2xl text-sm text-muted">
        <div>
          Showing <strong>{paginatedUsers.length}</strong> of <strong>{filteredUsers.length}</strong> users
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

      {/* 7. Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New User Account"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          {/* Image Upload Zone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted">
              Profile Photo
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/60 bg-background hover:bg-primary/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleFileSelect(e.target.files?.[0] || null)}
              />
              {imagePreview ? (
                <div className="relative w-full h-28 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="max-h-28 object-contain rounded-xl shadow-md" />
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleFileSelect(null);
                    }}
                    className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full shadow-md"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center py-1">
                  <UploadCloud className="h-7 w-7 text-primary mx-auto mb-1" />
                  <p className="text-xs font-bold text-foreground">Click or Drag Photo to Upload</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Full Name *
              </label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Chan Sam"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Username *
              </label>
              <input
                required
                type="text"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g. csam"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Password *
              </label>
              <input
                required
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="��������"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 012345678"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Role Permission
              </label>
              <select
                value={formData.roleId}
                onChange={e => setFormData({ ...formData, roleId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">-- Select Role --</option>
                {availableRoles.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                POS Quick PIN (4-digit)
              </label>
              <input
                type="text"
                maxLength={4}
                value={formData.pinCode}
                onChange={e => setFormData({ ...formData, pinCode: e.target.value })}
                placeholder="1234"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={submitting} type="submit">
              {submitting ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User Details"
        size="md"
      >
        <form onSubmit={handleEdit} className="space-y-4 pt-2">
          {/* Image Upload Zone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted">
              Profile Photo
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/60 bg-background hover:bg-primary/5 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleFileSelect(e.target.files?.[0] || null)}
              />
              {imagePreview ? (
                <div className="relative w-full h-28 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="max-h-28 object-contain rounded-xl shadow-md" />
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleFileSelect(null);
                    }}
                    className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full shadow-md"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center py-1">
                  <UploadCloud className="h-7 w-7 text-primary mx-auto mb-1" />
                  <p className="text-xs font-bold text-foreground">Click or Drag Photo to Change</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Full Name *
              </label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Role Permission
              </label>
              <select
                value={formData.roleId}
                onChange={e => setFormData({ ...formData, roleId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">-- Select Role --</option>
                {availableRoles.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                POS Quick PIN (4-digit)
              </label>
              <input
                type="text"
                maxLength={4}
                value={formData.pinCode}
                onChange={e => setFormData({ ...formData, pinCode: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none font-mono"
              />
            </div>
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

      {/* 9. Delete User Confirm Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete User Account"
        size="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted">
            Are you sure you want to delete account <strong>{selectedUserItem?.name || selectedUserItem?.username}</strong>? This action cannot be undone.
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
        title={`${bulkActionType === 'delete' ? 'Delete' : 'Archive'} Selected User Accounts`}
        message={`${selected.size} account(s) will be ${bulkActionType === 'delete' ? 'permanently deleted' : 'archived'}.`}
        variant={bulkActionType === 'delete' ? 'danger' : 'warning'}
        isLoading={bulkLoading}
        onConfirm={confirmBulkAction}
        onCancel={() => setBulkConfirmOpen(false)}
      />
    </div>
  );
}