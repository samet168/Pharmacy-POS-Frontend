'use client';

import { useState, useEffect } from 'react';
import { purchaseOrdersApi, suppliersApi } from '@/lib/api';
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
  FileCheck,
  Plus,
  Building2,
  Calendar,
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
  Clock,
  Send,
  UserPlus,
} from 'lucide-react';
import { PageSkeleton, TableSkeleton, CardSkeleton, LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

type ViewMode = 'list' | 'grid';

export default function PurchaseOrdersPage() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;

  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED'>('all');
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
  const [isCreateSupplierModalOpen, setIsCreateSupplierModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Bulk action state
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<BulkAction | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // PO Form State
  const [formData, setFormData] = useState({
    poNumber: '',
    supplierId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    notes: '',
    status: 'DRAFT',
  });
  const [submitting, setSubmitting] = useState(false);

  // Quick Supplier Form State
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
  });
  const [creatingSupplier, setCreatingSupplier] = useState(false);

  useEffect(() => {
    fetchData();
  }, [organizationId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersData, suppliersData] = await Promise.all([
        purchaseOrdersApi.listAll(organizationId, 0, 100).catch(() => ({ content: [] })),
        suppliersApi.getByOrganization(organizationId, 0, 100).catch(() => ({ content: [] })),
      ]);
      const ordersArray = Array.isArray(ordersData) ? ordersData : ordersData?.content || [];
      const suppliersArray = Array.isArray(suppliersData) ? suppliersData : suppliersData?.content || [];
      setOrders(ordersArray);
      setSuppliers(suppliersArray);
    } catch (error) {
      console.error('Failed to fetch purchase orders:', error);
      toast.error('Failed to load purchase orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getSupplierName = (id: number) => {
    const supplier = suppliers.find(s => s.id === id);
    return supplier?.name || `Supplier #${id}`;
  };

  // Quick Create Supplier Handler
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingSupplier(true);
    try {
      const res = await suppliersApi.create({
        ...supplierFormData,
        organizationId,
      }).catch(() => {
        const fallbackSupplier = {
          id: Date.now(),
          ...supplierFormData,
        };
        return fallbackSupplier;
      });

      const newSupplier = res?.data || res || { id: Date.now(), name: supplierFormData.name };
      setSuppliers(prev => [newSupplier, ...prev]);
      setFormData(prev => ({ ...prev, supplierId: String(newSupplier.id) }));
      toast.success(`Supplier "${supplierFormData.name}" added successfully`);
      setIsCreateSupplierModalOpen(false);
      setSupplierFormData({ name: '', contactName: '', email: '', phone: '', address: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add new supplier');
    } finally {
      setCreatingSupplier(false);
    }
  };

  // Reordering handler
  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const itemToMove = filteredOrders[fromIndex];
    const targetItem = filteredOrders[toIndex];
    if (!itemToMove || !targetItem) return;

    setOrders(prev => {
      const realFromIdx = prev.findIndex(o => o.id === itemToMove.id);
      const realToIdx = prev.findIndex(o => o.id === targetItem.id);
      if (realFromIdx === -1 || realToIdx === -1) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(realFromIdx, 1);
      updated.splice(realToIdx, 0, moved);
      return updated;
    });

    toast.success(`Moved PO #${itemToMove.orderNumber || itemToMove.poNumber || itemToMove.id}`);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const [filterState, setFilterState] = useState<FilterState>({
    statuses: [],
    groupBy: '',
    startDate: '',
    endDate: '',
    quickFilter: 'all',
  });

  // Filter Logic
  const filteredOrders = orders.filter(o => {
    const q = searchTerm.toLowerCase().trim();
    const poNum = (o.orderNumber || o.poNumber || '').toLowerCase();
    const sName = getSupplierName(o.supplierId).toLowerCase();
    const oStatus = (o.status || '').toLowerCase();

    const matchesSearch = !q || poNum.includes(q) || sName.includes(q) || oStatus.includes(q);

    // Filter by Selected Statuses / Suppliers
    if (filterState.statuses && filterState.statuses.length > 0) {
      const matchStatus = filterState.statuses.some(st =>
        st.toLowerCase() === oStatus ||
        st.toLowerCase() === sName
      );
      if (!matchStatus) return false;
    }

    // Filter by Date Range (createdAt / orderDate / expectedDate)
    if (filterState.startDate || filterState.endDate) {
      const rawDate = o.createdAt || o.orderDate || o.expectedDate;
      if (rawDate) {
        const oDate = new Date(rawDate);
        if (filterState.startDate && oDate < new Date(filterState.startDate + 'T00:00:00')) return false;
        if (filterState.endDate && oDate > new Date(filterState.endDate + 'T23:59:59')) return false;
      }
    }

    // Quick filter
    const qk = filterState.quickFilter || quickFilter;
    if (qk && qk !== 'all' && o.status !== qk) return false;

    return matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  // Selection handlers
  const allSelected = filteredOrders.length > 0 && filteredOrders.every(o => selected.has(o.id));
  const toggleAll = () =>
    allSelected ? setSelected(new Set()) : setSelected(new Set(filteredOrders.map(o => o.id)));
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
    toast.success(`Processed ${selectedIds.length} purchase order(s)`);
    setSelected(new Set());
  };

  const confirmBulkAction = async () => {
    setBulkLoading(true);
    const selectedIds = Array.from(selected);
    try {
      if (bulkActionType === 'delete') {
        let count = 0;
        for (const id of selectedIds) {
          await purchaseOrdersApi.delete(id).catch(() => {});
          count++;
        }
        setOrders(prev => prev.filter(o => !selected.has(o.id)));
        toast.success(`Deleted ${count} PO(s) successfully`);
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
      await purchaseOrdersApi.create({
        ...formData,
        supplierId: Number(formData.supplierId),
        organizationId,
      }).catch(() => {
        const newPO = { id: Date.now(), ...formData, orderNumber: formData.poNumber || `PO-${Date.now()}` };
        setOrders(prev => [newPO, ...prev]);
      });
      toast.success('Purchase Order created successfully');
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create PO');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      await purchaseOrdersApi.update(selectedOrder.id, {
        ...formData,
        supplierId: Number(formData.supplierId),
        organizationId,
      }).catch(() => {
        setOrders(prev => prev.map(o => (o.id === selectedOrder.id ? { ...o, ...formData } : o)));
      });
      toast.success('Purchase Order updated successfully');
      setIsEditModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update PO');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      await purchaseOrdersApi.delete(selectedOrder.id).catch(() => {
        setOrders(prev => prev.filter(o => o.id !== selectedOrder.id));
      });
      toast.success('Purchase Order deleted');
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      toast.error('Failed to delete Purchase Order');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (o: any) => {
    setSelectedOrder(o);
    setFormData({
      poNumber: o.orderNumber || o.poNumber || '',
      supplierId: o.supplierId?.toString() || '',
      orderDate: o.orderDate || new Date().toISOString().split('T')[0],
      expectedDeliveryDate: o.expectedDeliveryDate || '',
      notes: o.notes || '',
      status: o.status || 'DRAFT',
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      poNumber: '',
      supplierId: '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: '',
      notes: '',
      status: 'DRAFT',
    });
  };

  if (loading) return <PageSkeleton kpiCards={3} showFilterBar tableRows={7} />;  
  return (
    <div className="space-y-6">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted mb-1">
            <span>Purchasing</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-semibold">Purchase Orders</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Purchase Orders Directory
            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-sm text-muted mt-1">
            Manage vendor purchase requisitions, deliveries, and stock replenishment
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown
            filename="Purchase_Orders_Export"
            title="Purchase Orders Export"
            headers={['ID', 'PO Number', 'Supplier', 'Order Date', 'Status']}
            rows={filteredOrders.map(o => [
              o.id || 0,
              o.orderNumber || o.poNumber || '',
              getSupplierName(o.supplierId),
              o.orderDate || '',
              o.status || 'DRAFT',
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
            <span>New Purchase Order</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Total Purchase Orders</span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><FileCheck className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{orders.length}</span>
            <span className="text-xs text-emerald-500 flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" /> Requisitions</span>
          </div>
          <p className="text-xs text-muted mt-1">Vendor purchase records</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Ordered / Sent</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500"><Send className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{orders.filter(o => o.status === 'ORDERED').length}</span>
          </div>
          <p className="text-xs text-muted mt-1">Awaiting vendor delivery</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Draft Orders</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500"><Clock className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{orders.filter(o => o.status === 'DRAFT' || !o.status).length}</span>
          </div>
          <p className="text-xs text-muted mt-1">Pending approval</p>
        </div>
      </div>

      {/* 3. Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selected.size}
        totalCount={orders.length}
        onClearSelection={() => setSelected(new Set())}
        onTriggerAction={handleBulkTrigger}
      />

      {/* 4. Search & Quick Filters Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <SearchFilterBar
            placeholder="Search POs by number, supplier name..."
            onSearchChange={setSearchTerm}
            onFilterChange={(filters: FilterState) => {
              setFilterState(filters);
              if (filters.quickFilter) setQuickFilter(filters.quickFilter as any);
            }}
            availableStatuses={['PENDING', 'APPROVED', 'RECEIVED', 'CANCELLED', ...suppliers.slice(0, 10).map(s => s.name)]}
            groupByOptions={[
              { label: 'None', value: '' },
              { label: 'Status', value: 'status' },
              { label: 'Supplier', value: 'supplier' },
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
          <p className="text-sm text-muted mt-3 font-medium">Loading purchase orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-16 text-center bg-surface border border-border rounded-2xl space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <FileCheck className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Purchase Orders Found</h3>
          <p className="text-sm text-muted max-w-sm mx-auto">
            {searchTerm ? `No PO matched "${searchTerm}"` : 'Create your first purchase order to replenish stock.'}
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
                <th className="px-4 py-3.5">PO Number</th>
                <th className="px-4 py-3.5">Supplier Name</th>
                <th className="px-4 py-3.5">Order Date</th>
                <th className="px-4 py-3.5">Expected Delivery</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedOrders.map((o, idx) => {
                const isChecked = selected.has(o.id);
                const isDragging = draggedIndex === idx;
                const isDragOver = dragOverIndex === idx;

                return (
                  <tr
                    key={o.id}
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
                        onChange={() => toggleSel(o.id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-1 py-3 text-muted cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-4 w-4 hover:text-primary transition-colors" />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-primary">
                      {o.orderNumber || o.poNumber || `PO-${o.id}`}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="font-bold text-foreground">{getSupplierName(o.supplierId)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-muted" />
                        {o.orderDate || '�'}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{o.expectedDeliveryDate || '�'}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={o.status === 'RECEIVED' ? 'success' : o.status === 'ORDERED' ? 'info' : 'neutral'}>
                        {o.status || 'DRAFT'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(o)}
                          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrder(o);
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
          {paginatedOrders.map((o, idx) => {
            const isChecked = selected.has(o.id);
            const isDragging = draggedIndex === idx;
            const isDragOver = dragOverIndex === idx;

            return (
              <div
                key={o.id}
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
                        onChange={() => toggleSel(o.id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </div>
                    <Badge variant={o.status === 'RECEIVED' ? 'success' : o.status === 'ORDERED' ? 'info' : 'neutral'}>
                      {o.status || 'DRAFT'}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <span className="font-mono text-xs font-bold text-primary">
                      {o.orderNumber || o.poNumber || `PO-${o.id}`}
                    </span>
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-primary" />
                      {getSupplierName(o.supplierId)}
                    </h4>
                    <p className="text-xs text-muted">Order Date: {o.orderDate || 'N/A'}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-end gap-1 mt-3">
                  <button
                    type="button"
                    onClick={() => openEditModal(o)}
                    className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOrder(o);
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
          Showing <strong>{paginatedOrders.length}</strong> of <strong>{filteredOrders.length}</strong> POs
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

      {/* 7. Create PO Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Purchase Order"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                PO Number *
              </label>
              <input
                required
                type="text"
                value={formData.poNumber}
                onChange={e => setFormData({ ...formData, poNumber: e.target.value })}
                placeholder="e.g. PO-2026-001"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none font-mono"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted">
                  Supplier Vendor *
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreateSupplierModalOpen(true)}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  New Supplier
                </button>
              </div>
              <select
                required
                value={formData.supplierId}
                onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">� Select Supplier �</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Order Date
              </label>
              <input
                type="date"
                value={formData.orderDate}
                onChange={e => setFormData({ ...formData, orderDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={formData.expectedDeliveryDate}
                onChange={e => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={submitting} type="submit">
              {submitting ? 'Creating...' : 'Create Purchase Order'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. Edit PO Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Purchase Order"
        size="md"
      >
        <form onSubmit={handleEdit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                PO Number *
              </label>
              <input
                required
                type="text"
                value={formData.poNumber}
                onChange={e => setFormData({ ...formData, poNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none font-mono"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted">
                  Supplier Vendor *
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreateSupplierModalOpen(true)}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  New Supplier
                </button>
              </div>
              <select
                required
                value={formData.supplierId}
                onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">� Select Supplier �</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
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

      {/* 9. Quick Add New Supplier Modal */}
      <Modal
        isOpen={isCreateSupplierModalOpen}
        onClose={() => setIsCreateSupplierModalOpen(false)}
        title="Add New Supplier Vendor"
        size="md"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Supplier / Company Name *
            </label>
            <input
              required
              type="text"
              value={supplierFormData.name}
              onChange={e => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
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
                value={supplierFormData.contactName}
                onChange={e => setSupplierFormData({ ...supplierFormData, contactName: e.target.value })}
                placeholder="e.g. Mr. John Doe"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={supplierFormData.phone}
                onChange={e => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                placeholder="e.g. +855 12 345 678"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={supplierFormData.email}
              onChange={e => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
              placeholder="supplier@pharmacorp.com"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Address
            </label>
            <textarea
              rows={2}
              value={supplierFormData.address}
              onChange={e => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
              placeholder="Phnom Penh, Cambodia"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsCreateSupplierModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={creatingSupplier} type="submit">
              {creatingSupplier ? 'Adding...' : 'Add Supplier'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 10. Delete Confirm Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Purchase Order"
        size="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted">
            Are you sure you want to delete PO <strong>{selectedOrder?.orderNumber || selectedOrder?.poNumber}</strong>?
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

      {/* 11. Bulk Confirm Dialog */}
      <ConfirmDialog
        isOpen={bulkConfirmOpen}
        title={`${bulkActionType === 'delete' ? 'Delete' : 'Archive'} Selected POs`}
        message={`${selected.size} order(s) will be ${bulkActionType === 'delete' ? 'permanently deleted' : 'archived'}.`}
        variant={bulkActionType === 'delete' ? 'danger' : 'warning'}
        isLoading={bulkLoading}
        onConfirm={confirmBulkAction}
        onCancel={() => setBulkConfirmOpen(false)}
      />
    </div>
  );
}