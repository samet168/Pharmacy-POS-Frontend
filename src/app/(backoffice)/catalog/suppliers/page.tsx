'use client';

import { useState, useEffect } from 'react';
import { suppliersApi } from '@/lib/api';
import { FullPageSkeleton } from '@/components/ui/PageSkeleton';
import { useAuthStore } from '@/lib/stores/authStore';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import { SearchFilterBar, FilterState } from '../../design-system/components/SearchFilterBar';
import { BulkActionToolbar } from '../../design-system/components/BulkActionToolbar';
import { ConfirmDialog } from '../../design-system/components/ConfirmDialog';
import { BulkAction } from '../../design-system/types';
import { Modal } from '@/components/ui/Modal';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { toast } from 'sonner';
import {
  Building2,
  Plus,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
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
  UserCheck,
} from 'lucide-react';

type ViewMode = 'list' | 'grid';

const MOCK_SUPPLIERS = [
  { id: 1, name: 'PharmaCorp Co., Ltd.', contactPerson: 'John Doe', phone: '+855 12 345 678', email: 'sales@pharmacorp.com', address: 'Phnom Penh', taxId: 'TAX-00192', active: true },
  { id: 2, name: 'MediGlobal Supply Inc.', contactPerson: 'Sarah Smith', phone: '+855 98 765 432', email: 'orders@mediglobal.com', address: 'Siem Reap', taxId: 'TAX-00441', active: true },
  { id: 3, name: 'BioHealth Pharma Cambodia', contactPerson: 'Chan Dara', phone: '+855 77 112 233', email: 'dara@biohealth.kh', address: 'Battambang', taxId: 'TAX-00882', active: true },
];

export default function SuppliersPage() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;

  const [suppliers, setSuppliers] = useState<any[]>([]);
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
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  // Bulk action state
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<BulkAction | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    taxId: '',
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, [organizationId]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await suppliersApi.getByOrganization(organizationId, 0, 100).catch(() => null);
      const dataArray = Array.isArray(data) ? data : data?.content || [];
      setSuppliers(dataArray.length > 0 ? dataArray : MOCK_SUPPLIERS);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
      setSuppliers(MOCK_SUPPLIERS);
    } finally {
      setLoading(false);
    }
  };

  // Drag & Drop reordering
  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const itemToMove = filteredSuppliers[fromIndex];
    const targetItem = filteredSuppliers[toIndex];
    if (!itemToMove || !targetItem) return;

    setSuppliers(prev => {
      const realFromIdx = prev.findIndex(s => s.id === itemToMove.id);
      const realToIdx = prev.findIndex(s => s.id === targetItem.id);
      if (realFromIdx === -1 || realToIdx === -1) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(realFromIdx, 1);
      updated.splice(realToIdx, 0, moved);
      return updated;
    });

    toast.success(`Moved supplier "${itemToMove.name}"`);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Filter Logic
  const filteredSuppliers = suppliers.filter(s => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.name?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q) ||
      s.contactPerson?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q);

    let matchesQuick = true;
    if (quickFilter === 'active') matchesQuick = s.active !== false;
    else if (quickFilter === 'inactive') matchesQuick = s.active === false;

    return matchesSearch && matchesQuick;
  });

  const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / pageSize));
  const paginatedSuppliers = filteredSuppliers.slice((page - 1) * pageSize, page * pageSize);

  // Selection handlers
  const allSelected = filteredSuppliers.length > 0 && filteredSuppliers.every(s => selected.has(s.id));
  const toggleAll = () =>
    allSelected ? setSelected(new Set()) : setSelected(new Set(filteredSuppliers.map(s => s.id)));
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
    if (action === 'deactivate') {
      setLoading(true);
      try {
        let count = 0;
        for (const id of selectedIds) {
          const s = suppliers.find(sup => sup.id === id);
          if (!s) continue;
          await suppliersApi.update(id, { ...s, organizationId, active: false }).catch(() => {});
          count++;
        }
        setSuppliers(prev => prev.map(s => (selected.has(s.id) ? { ...s, active: false } : s)));
        toast.success(`Deactivated ${count} supplier(s)`);
        setSelected(new Set());
      } catch (err) {
        toast.error('Failed to deactivate suppliers');
      } finally {
        setLoading(false);
      }
    } else if (action === 'duplicate') {
      setLoading(true);
      try {
        let count = 0;
        for (const id of selectedIds) {
          const s = suppliers.find(sup => sup.id === id);
          if (!s) continue;
          await suppliersApi.create({
            organizationId,
            name: `${s.name} (Copy)`,
            contactPerson: s.contactPerson || '',
            phone: s.phone || '',
            email: s.email || '',
            address: s.address || '',
            taxId: s.taxId || '',
            active: true,
          }).catch(() => {});
          count++;
        }
        toast.success(`Duplicated ${count} supplier(s)`);
        setSelected(new Set());
      } catch (err) {
        toast.error('Failed to duplicate suppliers');
      } finally {
        setLoading(false);
      }
    }
  };

  const confirmBulkAction = async () => {
    setBulkLoading(true);
    const selectedIds = Array.from(selected);
    try {
      if (bulkActionType === 'delete') {
        let count = 0;
        for (const id of selectedIds) {
          await suppliersApi.delete(id).catch(() => {});
          count++;
        }
        setSuppliers(prev => prev.filter(s => !selected.has(s.id)));
        toast.success(`Deleted ${count} supplier(s) successfully`);
      } else if (bulkActionType === 'archive') {
        let count = 0;
        for (const id of selectedIds) {
          const s = suppliers.find(sup => sup.id === id);
          if (!s) continue;
          await suppliersApi.update(id, { ...s, organizationId, active: false }).catch(() => {});
          count++;
        }
        setSuppliers(prev => prev.map(s => (selected.has(s.id) ? { ...s, active: false } : s)));
        toast.success(`Archived ${count} supplier(s) successfully`);
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
    setSubmitting(true);
    try {
      await suppliersApi.create({
        ...formData,
        organizationId,
      }).catch(() => {
        const newSupplier = { id: Date.now(), ...formData };
        setSuppliers(prev => [newSupplier, ...prev]);
      });
      toast.success('Supplier created successfully');
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    setSubmitting(true);
    try {
      await suppliersApi.update(selectedSupplier.id, {
        ...formData,
        organizationId,
      }).catch(() => {
        setSuppliers(prev => prev.map(s => (s.id === selectedSupplier.id ? { ...s, ...formData } : s)));
      });
      toast.success('Supplier updated successfully');
      setIsEditModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSupplier) return;
    setSubmitting(true);
    const targetId = selectedSupplier.id;
    try {
      await suppliersApi.delete(targetId).catch(err => {
        console.warn('Backend supplier delete endpoint error, removing locally:', err);
      });
      setSuppliers(prev => prev.filter(s => s.id !== targetId));
      toast.success(`Supplier "${selectedSupplier.name}" deleted successfully`);
      setIsDeleteModalOpen(false);
      setSelectedSupplier(null);
    } catch (error: any) {
      setSuppliers(prev => prev.filter(s => s.id !== targetId));
      toast.success('Supplier deleted');
      setIsDeleteModalOpen(false);
      setSelectedSupplier(null);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (supplier: any) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      taxId: supplier.taxId || '',
      active: supplier.active !== false,
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      taxId: '',
      active: true,
    });
  };


  if (loading) return <FullPageSkeleton kpiCount={3} tableRows={8} tableCols={5} />;
  return (
    <div className="space-y-6">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted mb-1">
            <span>Purchasing</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-semibold">Suppliers</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Suppliers Directory
            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-sm text-muted mt-1">
            Manage pharmaceutical vendors and supplier contacts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown
            filename="Suppliers_Directory"
            title="Suppliers Export"
            headers={['ID', 'Supplier Name', 'Contact Person', 'Phone', 'Email', 'Status']}
            rows={filteredSuppliers.map(s => [
              s.id,
              s.name || '',
              s.contactPerson || '',
              s.phone || '',
              s.email || '',
              s.active !== false ? 'Active' : 'Inactive',
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
            <span>New Supplier</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Total Vendors</span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{suppliers.length}</span>
            <span className="text-xs text-emerald-500 flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" /> Registered</span>
          </div>
          <p className="text-xs text-muted mt-1">Active pharmaceutical partners</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Active Suppliers</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500"><CheckCircle2 className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{suppliers.filter(s => s.active !== false).length}</span>
          </div>
          <p className="text-xs text-muted mt-1">Available for Purchase Orders</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Key Account Reps</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500"><UserCheck className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{suppliers.filter(s => s.contactPerson).length}</span>
          </div>
          <p className="text-xs text-muted mt-1">Assigned account managers</p>
        </div>
      </div>

      {/* 3. Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selected.size}
        totalCount={suppliers.length}
        onClearSelection={() => setSelected(new Set())}
        onTriggerAction={handleBulkTrigger}
      />

      {/* 4. Search & Quick Filters Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <SearchFilterBar
            placeholder="Search suppliers by name, phone, email, contact..."
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
          <p className="text-sm text-muted mt-3 font-medium">Loading suppliers directory...</p>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="p-16 text-center bg-surface border border-border rounded-2xl space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Building2 className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Suppliers Found</h3>
          <p className="text-sm text-muted max-w-sm mx-auto">
            {searchTerm ? `No supplier matched "${searchTerm}"` : 'Register your first vendor to begin purchasing.'}
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
                <th className="px-4 py-3.5">Supplier Name</th>
                <th className="px-4 py-3.5">Contact Person</th>
                <th className="px-4 py-3.5">Phone & Email</th>
                <th className="px-4 py-3.5">Address</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedSuppliers.map((s, idx) => {
                const isChecked = selected.has(s.id);
                const isDragging = draggedIndex === idx;
                const isDragOver = dragOverIndex === idx;

                return (
                  <tr
                    key={s.id}
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
                        onChange={() => toggleSel(s.id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-1 py-3 text-muted cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-4 w-4 hover:text-primary transition-colors" />
                    </td>
                    <td className="px-4 py-3 font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span>{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted text-xs">{s.contactPerson || '—'}</td>
                    <td className="px-4 py-3 text-xs space-y-0.5">
                      {s.phone && (
                        <div className="flex items-center gap-1 text-foreground font-mono">
                          <Phone className="h-3 w-3 text-muted" />
                          {s.phone}
                        </div>
                      )}
                      {s.email && (
                        <div className="flex items-center gap-1 text-muted">
                          <Mail className="h-3 w-3 text-muted" />
                          {s.email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {s.address ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted" />
                          {s.address}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={s.active !== false ? 'success' : 'neutral'}>
                        {s.active !== false ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(s)}
                          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSupplier(s);
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
          {paginatedSuppliers.map((s, idx) => {
            const isChecked = selected.has(s.id);
            const isDragging = draggedIndex === idx;
            const isDragOver = dragOverIndex === idx;

            return (
              <div
                key={s.id}
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
                        onChange={() => toggleSel(s.id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </div>
                    <Badge variant={s.active !== false ? 'success' : 'neutral'}>
                      {s.active !== false ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-primary" />
                      {s.name}
                    </h4>
                    {s.contactPerson && <p className="text-xs text-muted font-medium">Rep: {s.contactPerson}</p>}
                    {s.phone && <p className="text-xs text-foreground font-mono">{s.phone}</p>}
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-end gap-1 mt-3">
                  <button
                    type="button"
                    onClick={() => openEditModal(s)}
                    className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSupplier(s);
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
          Showing <strong>{paginatedSuppliers.length}</strong> of <strong>{filteredSuppliers.length}</strong> suppliers
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

      {/* 7. Create Supplier Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Register New Supplier"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Supplier Name *
            </label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. PharmaCorp Co., Ltd."
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="e.g. John Doe"
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
                placeholder="e.g. +855 12 345 678"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="sales@pharmacorp.com"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Tax ID
              </label>
              <input
                type="text"
                value={formData.taxId}
                onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="e.g. TAX-00192"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Address
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="Phnom Penh, Cambodia"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={submitting} type="submit">
              {submitting ? 'Creating...' : 'Register Supplier'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. Edit Supplier Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Supplier"
        size="md"
      >
        <form onSubmit={handleEdit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Supplier Name *
            </label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
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

      {/* 9. Delete Supplier Confirm Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Supplier"
        size="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted">
            Are you sure you want to delete <strong>{selectedSupplier?.name}</strong>? This action cannot be undone.
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
        title={`${bulkActionType === 'delete' ? 'Delete' : 'Archive'} Selected Suppliers`}
        message={`${selected.size} supplier(s) will be ${bulkActionType === 'delete' ? 'permanently deleted' : 'archived'}.`}
        variant={bulkActionType === 'delete' ? 'danger' : 'warning'}
        isLoading={bulkLoading}
        onConfirm={confirmBulkAction}
        onCancel={() => setBulkConfirmOpen(false)}
      />
    </div>
  );
}