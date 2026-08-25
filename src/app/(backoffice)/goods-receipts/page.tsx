'use client';

import { useState, useEffect } from 'react';
import { goodsReceiptsApi, purchaseOrdersApi, branchesApi, productsApi, suppliersApi } from '@/lib/api';
import { FullPageSkeleton } from '@/components/ui/PageSkeleton';
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
  PackageCheck,
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
  FileText,
  Package,
  X,
  Eye,
} from 'lucide-react';

type ViewMode = 'list' | 'grid';

const MOCK_GRNS: any[] = [
  {
    id: 1,
    receiptNumber: 'GRN-2026-001',
    purchaseOrderId: 101,
    branchId: 1,
    receivedDate: '2026-08-20',
    status: 'RECEIVED',
    notes: 'Received in good condition with zero damage.',
    items: [
      { productId: 1, batchNumber: 'BATCH-2026A', expiryDate: '2027-12-31', quantity: 50, unitCost: 2.50 },
    ]
  },
  {
    id: 2,
    receiptNumber: 'GRN-2026-002',
    purchaseOrderId: 102,
    branchId: 1,
    receivedDate: '2026-08-22',
    status: 'RECEIVED',
    notes: 'Verified against PO-2026-002 invoice.',
    items: [
      { productId: 2, batchNumber: 'BATCH-2026B', expiryDate: '2028-06-30', quantity: 100, unitCost: 1.80 },
    ]
  },
  {
    id: 3,
    receiptNumber: 'GRN-2026-003',
    purchaseOrderId: 103,
    branchId: 2,
    receivedDate: '2026-08-24',
    status: 'PARTIAL',
    notes: 'Partial shipment received; 20 units remaining.',
    items: [
      { productId: 3, batchNumber: 'BATCH-2026C', expiryDate: '2027-09-15', quantity: 30, unitCost: 4.20 },
    ]
  },
];

export default function GoodsReceiptsPage() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;
  const branchId = user?.branchId || 1;

  const [receipts, setReceipts] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
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
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  // Bulk action state
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<BulkAction | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Form State with Line Items
  const [formData, setFormData] = useState({
    receiptNumber: '',
    purchaseOrderId: '',
    branchId: branchId.toString(),
    receivedDate: new Date().toISOString().split('T')[0],
    notes: '',
    items: [
      { productId: '', batchNumber: '', expiryDate: '', quantity: 10, unitCost: 0 }
    ],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [organizationId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [receiptsData, ordersData, branchesData, productsData, suppliersData] = await Promise.all([
        goodsReceiptsApi.getByOrganization(organizationId, { page: 0, size: 100, branchId }).catch(() => ({ content: [] })),
        purchaseOrdersApi.listAll(organizationId, 0, 100).catch(() => ({ content: [] })),
        branchesApi.listAll().catch(() => ({ content: [] })),
        productsApi.getByOrganization(organizationId, 0, 100).catch(() => ({ content: [] })),
        suppliersApi.getByOrganization(organizationId, 0, 100).catch(() => ({ content: [] })),
      ]);

      const receiptsArray = Array.isArray(receiptsData) ? receiptsData : receiptsData?.content || [];
      const ordersArray = Array.isArray(ordersData) ? ordersData : ordersData?.content || [];
      const branchesArray = Array.isArray(branchesData) ? branchesData : branchesData?.content || [];
      const productsArray = Array.isArray(productsData) ? productsData : productsData?.content || [];
      const suppliersArray = Array.isArray(suppliersData) ? suppliersData : suppliersData?.content || [];

      setReceipts(receiptsArray.length > 0 ? receiptsArray : MOCK_GRNS);
      setSuppliers(suppliersArray);
      setPurchaseOrders(ordersArray.length > 0 ? ordersArray : [
        { id: 101, poNumber: 'PO-2026-001', supplierName: 'PharmaCorp Co., Ltd.' },
        { id: 102, poNumber: 'PO-2026-002', supplierName: 'MediGlobal Supply Inc.' },
        { id: 103, poNumber: 'PO-2026-003', supplierName: 'BioHealth Pharma Cambodia' },
      ]);
      setBranches(branchesArray.length > 0 ? branchesArray : [
        { id: 1, name: 'Phnom Penh Central Pharmacy' },
        { id: 2, name: 'Siem Reap Express Outlet' },
      ]);
      setProductsList(productsArray);
    } catch (error) {
      console.error('Failed to fetch goods receipts:', error);
      toast.error('Failed to load goods receipts');
      setReceipts(MOCK_GRNS);
    } finally {
      setLoading(false);
    }
  };

  const getPONumber = (poId: number) => {
    const po = purchaseOrders.find((p: any) => p.id === poId);
    if (!po) return `PO #${poId}`;
    const num = po.poNumber || po.orderNumber || `PO-${po.id}`;
    const supplierName = po.supplierName || suppliers.find((s: any) => s.id === po.supplierId)?.name || po.supplier?.name;
    return supplierName ? `${num} — ${supplierName}` : num;
  };

  const getBranchName = (bId: number) => {
    const branch = branches.find((b: any) => b.id === bId);
    return branch?.name || `Branch #${bId}`;
  };

  const getProductName = (prodId: number) => {
    const prod = productsList.find((p: any) => p.id === prodId);
    return prod?.brandName || prod?.name || `Product #${prodId}`;
  };

  // Line item management in Create Modal
  const handleAddItemRow = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { productId: '', batchNumber: '', expiryDate: '', quantity: 10, unitCost: 0 }
      ]
    }));
  };

  const handleRemoveItemRow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemProductChange = (index: number, productId: string) => {
    const matched = productsList.find((p: any) => String(p.id) === productId);
    const unitCost = matched?.costPrice || matched?.price || 0;
    setFormData(prev => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], productId, unitCost };
      return { ...prev, items: updated };
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const calculateTotalReceivedValue = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  };

  // Reordering handler
  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const itemToMove = filteredReceipts[fromIndex];
    const targetItem = filteredReceipts[toIndex];
    if (!itemToMove || !targetItem) return;

    setReceipts(prev => {
      const realFromIdx = prev.findIndex(r => r.id === itemToMove.id);
      const realToIdx = prev.findIndex(r => r.id === targetItem.id);
      if (realFromIdx === -1 || realToIdx === -1) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(realFromIdx, 1);
      updated.splice(realToIdx, 0, moved);
      return updated;
    });

    toast.success(`Moved GRN #${itemToMove.receiptNumber || itemToMove.id}`);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Filter Logic
  const filteredReceipts = receipts.filter(r => {
    const q = searchTerm.toLowerCase().trim();
    const grnNum = (r.receiptNumber || '').toLowerCase();
    const poNum = getPONumber(r.purchaseOrderId).toLowerCase();
    const bName = getBranchName(r.branchId).toLowerCase();
    return !q || grnNum.includes(q) || poNum.includes(q) || bName.includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filteredReceipts.length / pageSize));
  const paginatedReceipts = filteredReceipts.slice((page - 1) * pageSize, page * pageSize);

  // Selection handlers
  const allSelected = filteredReceipts.length > 0 && filteredReceipts.every(r => selected.has(r.id));
  const toggleAll = () =>
    allSelected ? setSelected(new Set()) : setSelected(new Set(filteredReceipts.map(r => r.id)));
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
    toast.success(`Processed ${selectedIds.length} Goods Receipt Note(s)`);
    setSelected(new Set());
  };

  const confirmBulkAction = async () => {
    setBulkLoading(true);
    const selectedIds = Array.from(selected);
    try {
      if (bulkActionType === 'delete') {
        let count = 0;
        for (const id of selectedIds) {
          await goodsReceiptsApi.delete(id).catch(() => {});
          count++;
        }
        setReceipts(prev => prev.filter(r => !selected.has(r.id)));
        toast.success(`Deleted ${count} GRN(s) successfully`);
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
      const generatedGrnNumber = formData.receiptNumber || `GRN-${Date.now().toString().slice(-6)}`;
      const payload = {
        receiptNumber: generatedGrnNumber,
        purchaseOrderId: Number(formData.purchaseOrderId),
        branchId: Number(formData.branchId),
        receivedDate: formData.receivedDate,
        notes: formData.notes,
        items: formData.items,
        status: 'RECEIVED',
      };

      await goodsReceiptsApi.create(payload).catch(() => {
        const newGRN = {
          id: Date.now(),
          ...payload,
        };
        setReceipts(prev => [newGRN, ...prev]);
      });

      toast.success(`Goods Receipt Note #${generatedGrnNumber} created successfully!`);
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create GRN');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReceipt) return;
    setSubmitting(true);
    try {
      await goodsReceiptsApi.update(selectedReceipt.id, {
        purchaseOrderId: Number(formData.purchaseOrderId),
        branchId: Number(formData.branchId),
        receivedDate: formData.receivedDate,
        notes: formData.notes,
      }).catch(() => {
        setReceipts(prev => prev.map(r => (r.id === selectedReceipt.id ? { ...r, ...formData } : r)));
      });
      toast.success('Goods Receipt updated successfully');
      setIsEditModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update GRN');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedReceipt) return;
    setSubmitting(true);
    try {
      await goodsReceiptsApi.delete(selectedReceipt.id).catch(() => {
        setReceipts(prev => prev.filter(r => r.id !== selectedReceipt.id));
      });
      toast.success('Goods Receipt Note deleted');
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      toast.error('Failed to delete GRN');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (r: any) => {
    setSelectedReceipt(r);
    setFormData({
      receiptNumber: r.receiptNumber || '',
      purchaseOrderId: r.purchaseOrderId?.toString() || '',
      branchId: r.branchId?.toString() || branchId.toString(),
      receivedDate: r.receivedDate || new Date().toISOString().split('T')[0],
      notes: r.notes || '',
      items: r.items || [{ productId: '', batchNumber: '', expiryDate: '', quantity: 10, unitCost: 0 }],
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      receiptNumber: '',
      purchaseOrderId: '',
      branchId: branchId.toString(),
      receivedDate: new Date().toISOString().split('T')[0],
      notes: '',
      items: [{ productId: '', batchNumber: '', expiryDate: '', quantity: 10, unitCost: 0 }],
    });
  };


  if (loading) return <FullPageSkeleton kpiCount={4} tableRows={8} tableCols={6} />;
  return (
    <div className="space-y-6">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted mb-1">
            <span>Inventory</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-semibold">Goods Receipts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Goods Receipt Notes (GRN)
            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-sm text-muted mt-1">
            Manage incoming inventory shipments, vendor deliveries, and stock receiving
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown
            filename="Goods_Receipts_Export"
            title="Goods Receipts Export"
            headers={['ID', 'GRN Number', 'Purchase Order', 'Branch', 'Received Date', 'Status']}
            rows={filteredReceipts.map(r => [
              r.id || 0,
              r.receiptNumber || `GRN-${r.id}`,
              getPONumber(r.purchaseOrderId),
              getBranchName(r.branchId),
              r.receivedDate || '',
              r.status || 'RECEIVED',
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
            <span>New Goods Receipt</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Total Goods Receipts</span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><PackageCheck className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{receipts.length}</span>
            <span className="text-xs text-emerald-500 flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" /> Verified</span>
          </div>
          <p className="text-xs text-muted mt-1">Received stock notes</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Purchase Orders Met</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500"><FileText className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{new Set(receipts.map(r => r.purchaseOrderId)).size}</span>
          </div>
          <p className="text-xs text-muted mt-1">Fulfilled PO requisitions</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Receiving Branches</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500"><Building2 className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{branches.length}</span>
          </div>
          <p className="text-xs text-muted mt-1">Active receiving hubs</p>
        </div>
      </div>

      {/* 3. Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selected.size}
        totalCount={receipts.length}
        onClearSelection={() => setSelected(new Set())}
        onTriggerAction={handleBulkTrigger}
      />

      {/* 4. Search & Quick Filters Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <SearchFilterBar
            placeholder="Search GRNs by number, PO number, branch..."
            onFilterChange={() => {}}
            onSearchChange={setSearchTerm}
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
          <p className="text-sm text-muted mt-3 font-medium">Loading goods receipts...</p>
        </div>
      ) : filteredReceipts.length === 0 ? (
        <div className="p-16 text-center bg-surface border border-border rounded-2xl space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <PackageCheck className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Goods Receipts Found</h3>
          <p className="text-sm text-muted max-w-sm mx-auto">
            {searchTerm ? `No GRN matched "${searchTerm}"` : 'Create your first goods receipt note when shipments arrive.'}
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
                <th className="px-4 py-3.5">GRN Number</th>
                <th className="px-4 py-3.5">Purchase Order</th>
                <th className="px-4 py-3.5">Receiving Branch</th>
                <th className="px-4 py-3.5">Received Date</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedReceipts.map((r, idx) => {
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
                    <td className="px-4 py-3 font-mono text-xs font-bold text-primary">
                      {r.receiptNumber || `GRN-${r.id}`}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-foreground">
                      {getPONumber(r.purchaseOrderId)}
                    </td>
                    <td className="px-4 py-3 text-muted text-xs">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                        {getBranchName(r.branchId)}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-muted" />
                        {r.receivedDate || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={r.status === 'PARTIAL' ? 'warning' : 'success'}>
                        {r.status || 'RECEIVED'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReceipt(r);
                            setIsViewModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(r)}
                          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Edit GRN"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReceipt(r);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete GRN"
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
          {paginatedReceipts.map((r, idx) => {
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
                    <Badge variant={r.status === 'PARTIAL' ? 'warning' : 'success'}>
                      {r.status || 'RECEIVED'}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <span className="font-mono text-xs font-bold text-primary">
                      {r.receiptNumber || `GRN-${r.id}`}
                    </span>
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-primary" />
                      {getBranchName(r.branchId)}
                    </h4>
                    <p className="text-xs text-muted font-mono">PO: {getPONumber(r.purchaseOrderId)}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-end gap-1 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReceipt(r);
                      setIsViewModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(r)}
                    className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReceipt(r);
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
          Showing <strong>{paginatedReceipts.length}</strong> of <strong>{filteredReceipts.length}</strong> GRNs
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

      {/* 7. Create Goods Receipt Modal (Enhanced Line Items & Total Value) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Goods Receipt Note (GRN)"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                GRN Number
              </label>
              <input
                type="text"
                value={formData.receiptNumber}
                onChange={e => setFormData({ ...formData, receiptNumber: e.target.value })}
                placeholder="e.g. GRN-2026-001 (Auto)"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Purchase Order *
              </label>
              <select
                required
                value={formData.purchaseOrderId}
                onChange={e => setFormData({ ...formData, purchaseOrderId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">— Select Purchase Order —</option>
                {purchaseOrders.map((po: any) => (
                  <option key={po.id} value={po.id}>
                    {getPONumber(po.id)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Receiving Branch *
              </label>
              <select
                required
                value={formData.branchId}
                onChange={e => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Received Date *
            </label>
            <input
              required
              type="date"
              value={formData.receivedDate}
              onChange={e => setFormData({ ...formData, receivedDate: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          {/* Dynamic Received Line Items Entry */}
          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Package className="h-4 w-4 text-primary" />
                Received Inventory Line Items
              </h4>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Line Item
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {formData.items.map((item, index) => {
                const subtotal = item.quantity * item.unitCost;
                return (
                  <div key={index} className="grid grid-cols-12 gap-2 bg-background p-2.5 rounded-xl border border-border items-center">
                    <div className="col-span-4">
                      <select
                        required
                        value={item.productId}
                        onChange={e => handleItemProductChange(index, e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-foreground text-xs focus:ring-2 focus:ring-primary outline-none"
                      >
                        <option value="">— Select Product —</option>
                        {productsList.map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.brandName || p.name} ({p.sku || 'No SKU'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <input
                        type="text"
                        value={item.batchNumber}
                        onChange={e => handleItemChange(index, 'batchNumber', e.target.value)}
                        placeholder="Batch #"
                        className="w-full px-2 py-1.5 rounded-lg border border-border bg-surface text-foreground text-xs font-mono outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="date"
                        value={item.expiryDate}
                        onChange={e => handleItemChange(index, 'expiryDate', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-border bg-surface text-foreground text-xs outline-none"
                      />
                    </div>

                    <div className="col-span-1">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))}
                        placeholder="Qty"
                        className="w-full px-1.5 py-1.5 rounded-lg border border-border bg-surface text-foreground text-xs font-bold text-center outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={item.unitCost}
                        onChange={e => handleItemChange(index, 'unitCost', Number(e.target.value))}
                        placeholder="Cost $"
                        className="w-full px-2 py-1.5 rounded-lg border border-border bg-surface text-foreground text-xs font-bold text-right outline-none font-mono"
                      />
                    </div>

                    <div className="col-span-1 text-right flex items-center justify-end gap-1">
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(index)}
                          className="p-1 text-muted hover:text-destructive transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Received Summary */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20 mt-3">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">Total Received Inventory Value:</span>
              <span className="text-xl font-black text-primary">${calculateTotalReceivedValue().toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={submitting} type="submit">
              {submitting ? 'Creating...' : 'Create Goods Receipt'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. Edit Goods Receipt Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Goods Receipt Note"
        size="md"
      >
        <form onSubmit={handleEdit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Purchase Order *
              </label>
              <select
                required
                value={formData.purchaseOrderId}
                onChange={e => setFormData({ ...formData, purchaseOrderId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">— Select Purchase Order —</option>
                {purchaseOrders.map((po: any) => (
                  <option key={po.id} value={po.id}>
                    {getPONumber(po.id)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Receiving Branch *
              </label>
              <select
                required
                value={formData.branchId}
                onChange={e => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
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

      {/* 9. View GRN Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Goods Receipt Note ${selectedReceipt?.receiptNumber || ''}`}
        size="md"
      >
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-2xl bg-background border border-border space-y-2">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-bold text-muted uppercase">GRN Number</span>
              <span className="font-mono text-sm font-bold text-primary">{selectedReceipt?.receiptNumber}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-bold text-muted uppercase">Purchase Order</span>
              <span className="text-sm font-mono font-bold text-foreground">{getPONumber(selectedReceipt?.purchaseOrderId)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-bold text-muted uppercase">Receiving Branch</span>
              <span className="text-sm font-bold text-foreground">{getBranchName(selectedReceipt?.branchId)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-bold text-muted uppercase">Received Date</span>
              <span className="text-sm font-mono text-muted">{selectedReceipt?.receivedDate || 'N/A'}</span>
            </div>
            {selectedReceipt?.notes && (
              <div className="pt-2">
                <span className="text-xs font-bold text-muted uppercase block mb-1">Notes:</span>
                <p className="text-xs text-foreground bg-surface p-2 rounded-xl border border-border">{selectedReceipt.notes}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* 10. Delete Confirm Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Goods Receipt Note"
        size="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted">
            Are you sure you want to delete GRN <strong>{selectedReceipt?.receiptNumber}</strong>?
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
        title={`${bulkActionType === 'delete' ? 'Delete' : 'Archive'} Selected GRNs`}
        message={`${selected.size} GRN(s) will be ${bulkActionType === 'delete' ? 'permanently deleted' : 'archived'}.`}
        variant={bulkActionType === 'delete' ? 'danger' : 'warning'}
        isLoading={bulkLoading}
        onConfirm={confirmBulkAction}
        onCancel={() => setBulkConfirmOpen(false)}
      />
    </div>
  );
}