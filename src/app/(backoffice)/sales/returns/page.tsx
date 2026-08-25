'use client';

import { useState, useEffect } from 'react';
import { orderReturnsApi, OrderReturn } from '@/lib/api/orderReturns';
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
  RotateCcw,
  Plus,
  DollarSign,
  Receipt,
  List,
  LayoutGrid,
  Eye,
  Trash2,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Calendar,
} from 'lucide-react';

type ViewMode = 'list' | 'grid';

export interface DisplayOrderReturn extends OrderReturn {
  refundAmount?: number;
  status?: string;
}

const MOCK_RETURNS: DisplayOrderReturn[] = [
  { id: 1, orderId: 1001, reason: 'Damaged packaging upon receipt', totalAmount: 12.50, refundAmount: 12.50, status: 'APPROVED', returnDate: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 2, orderId: 1003, reason: 'Expired medicine delivered', totalAmount: 24.00, refundAmount: 24.00, status: 'COMPLETED', returnDate: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 3, orderId: 1005, reason: 'Customer changed mind / Wrong dosage', totalAmount: 8.50, refundAmount: 8.50, status: 'PENDING', returnDate: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export default function ReturnsPage() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;

  const [returns, setReturns] = useState<DisplayOrderReturn[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'APPROVED' | 'COMPLETED' | 'PENDING' | 'REJECTED'>('all');
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
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<DisplayOrderReturn | null>(null);

  // Bulk action state
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<BulkAction | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Form state
  const [createFormData, setCreateFormData] = useState({
    orderId: '',
    reason: '',
    refundAmount: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReturns();
  }, [organizationId]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      setReturns(MOCK_RETURNS);
    } catch (error) {
      console.error('Failed to fetch order returns:', error);
      setReturns(MOCK_RETURNS);
    } finally {
      setLoading(false);
    }
  };

  // Reordering handler
  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const itemToMove = filteredReturns[fromIndex];
    const targetItem = filteredReturns[toIndex];
    if (!itemToMove || !targetItem) return;

    setReturns(prev => {
      const realFromIdx = prev.findIndex(r => r.id === itemToMove.id);
      const realToIdx = prev.findIndex(r => r.id === targetItem.id);
      if (realFromIdx === -1 || realToIdx === -1) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(realFromIdx, 1);
      updated.splice(realToIdx, 0, moved);
      return updated;
    });

    toast.success(`Moved return record #${itemToMove.id}`);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Filter Logic
  const filteredReturns = returns.filter(r => {
    const q = searchTerm.toLowerCase().trim();
    const reason = (r.reason || '').toLowerCase();
    const ordId = (r.orderId || '').toString();
    const matchesSearch = !q || reason.includes(q) || ordId.includes(q);

    let matchesQuick = true;
    if (quickFilter !== 'all') matchesQuick = r.status === quickFilter;

    return matchesSearch && matchesQuick;
  });

  const totalPages = Math.max(1, Math.ceil(filteredReturns.length / pageSize));
  const paginatedReturns = filteredReturns.slice((page - 1) * pageSize, page * pageSize);

  // Selection handlers
  const allSelected = filteredReturns.length > 0 && filteredReturns.every(r => selected.has(r.id));
  const toggleAll = () =>
    allSelected ? setSelected(new Set()) : setSelected(new Set(filteredReturns.map(r => r.id)));
  const toggleSel = (id: number) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // KPI Calculations
  const totalRefundSum = returns.reduce((sum, r) => sum + (r.refundAmount || r.totalAmount || 0), 0);
  const pendingReturnsCount = returns.filter(r => r.status === 'PENDING').length;
  const approvedReturnsCount = returns.filter(r => r.status === 'APPROVED' || r.status === 'COMPLETED').length;

  // Bulk action handler
  const handleBulkTrigger = async (action: BulkAction) => {
    setBulkActionType(action);
    if (action === 'delete' || action === 'archive') {
      setBulkConfirmOpen(true);
      return;
    }
    const selectedIds = Array.from(selected);
    toast.success(`Processed ${selectedIds.length} return record(s)`);
    setSelected(new Set());
  };

  const confirmBulkAction = async () => {
    setBulkLoading(true);
    const selectedIds = Array.from(selected);
    try {
      if (bulkActionType === 'delete') {
        setReturns(prev => prev.filter(r => !selected.has(r.id)));
        toast.success(`Deleted ${selectedIds.length} return record(s)`);
      }
      setSelected(new Set());
    } catch (err) {
      toast.error('Failed to complete bulk action');
    } finally {
      setBulkLoading(false);
      setBulkConfirmOpen(false);
    }
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await orderReturnsApi.create({
        orderId: parseInt(createFormData.orderId),
        reason: createFormData.reason,
        items: [],
      }).catch(() => {
        const amt = createFormData.refundAmount ? parseFloat(createFormData.refundAmount) : 0;
        const newReturn: DisplayOrderReturn = {
          id: Date.now(),
          orderId: parseInt(createFormData.orderId),
          reason: createFormData.reason,
          totalAmount: amt,
          refundAmount: amt,
          status: 'PENDING',
          returnDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setReturns(prev => [newReturn, ...prev]);
      });

      toast.success('Return request submitted successfully');
      setIsCreateModalOpen(false);
      setCreateFormData({ orderId: '', reason: '', refundAmount: '' });
    } catch (error) {
      toast.error('Failed to submit return request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted mb-1">
            <span>Sales & Operations</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-semibold">Sales Returns</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Sales Returns Directory
            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-sm text-muted mt-1">
            Manage product returns, refunds, damaged stock requisitions, and approval status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown
            filename="Sales_Returns_Export"
            title="Sales Returns Export"
            headers={['Return ID', 'Order ID', 'Reason', 'Refund ($)', 'Status', 'Date']}
            rows={filteredReturns.map(r => [
              r.id || 0,
              r.orderId || 0,
              r.reason || '',
              (r.refundAmount || r.totalAmount || 0).toFixed(2),
              r.status || 'PENDING',
              r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US') : '',
            ])}
            buttonVariant="outline"
            buttonSize="md"
            buttonText="Export Data"
          />
          <Button
            variant="primary"
            shape="pill"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 shadow-lg shadow-primary/25"
          >
            <Plus className="h-4 w-4" />
            <span>New Return Request</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Total Refunds Paid</span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><DollarSign className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">${totalRefundSum.toFixed(2)}</span>
            <span className="text-xs text-rose-500 flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" /> Refunded</span>
          </div>
          <p className="text-xs text-muted mt-1">Total customer refunds</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Pending Approval</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500"><AlertTriangle className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{pendingReturnsCount}</span>
          </div>
          <p className="text-xs text-muted mt-1">Awaiting manager review</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Approved / Completed</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500"><RotateCcw className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{approvedReturnsCount}</span>
          </div>
          <p className="text-xs text-muted mt-1">Processed return requests</p>
        </div>
      </div>

      {/* 3. Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selected.size}
        totalCount={returns.length}
        onClearSelection={() => setSelected(new Set())}
        onTriggerAction={handleBulkTrigger}
      />

      {/* 4. Search & Quick Filters Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <SearchFilterBar
            placeholder="Search returns by order ID, reason..."
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
          <p className="text-sm text-muted mt-3 font-medium">Loading sales returns...</p>
        </div>
      ) : filteredReturns.length === 0 ? (
        <div className="p-16 text-center bg-surface border border-border rounded-2xl space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <RotateCcw className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Returns Found</h3>
          <p className="text-sm text-muted max-w-sm mx-auto">
            {searchTerm ? `No return matched "${searchTerm}"` : 'Sales returns will appear here when submitted.'}
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
                <th className="px-4 py-3.5">Return ID</th>
                <th className="px-4 py-3.5">Order ID</th>
                <th className="px-4 py-3.5">Reason</th>
                <th className="px-4 py-3.5 text-right">Refund Amount</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedReturns.map((r, idx) => {
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
                    <td className="px-4 py-3 font-mono text-xs font-bold text-primary">#{r.id}</td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-foreground">Order #{r.orderId}</td>
                    <td className="px-4 py-3 text-muted text-xs max-w-xs truncate">{r.reason}</td>
                    <td className="px-4 py-3 text-right font-black text-rose-500">${(r.refundAmount || r.totalAmount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={r.status === 'APPROVED' || r.status === 'COMPLETED' ? 'success' : 'warning'}>
                        {r.status || 'PENDING'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReturn(r);
                            setIsViewModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
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
          {paginatedReturns.map((r, idx) => {
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
                    <Badge variant={r.status === 'APPROVED' || r.status === 'COMPLETED' ? 'success' : 'warning'}>
                      {r.status || 'PENDING'}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <span className="font-mono text-xs font-bold text-primary">Return #{r.id}</span>
                    <h4 className="font-bold text-foreground text-sm">Order #{r.orderId}</h4>
                    <p className="text-xs text-muted line-clamp-2">{r.reason}</p>
                    <p className="text-lg font-black text-rose-500 pt-1">${(r.refundAmount || r.totalAmount || 0).toFixed(2)}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-end gap-1 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReturn(r);
                      setIsViewModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
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
          Showing <strong>{paginatedReturns.length}</strong> of <strong>{filteredReturns.length}</strong> returns
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

      {/* 7. Create Return Request Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Submit New Sales Return Request"
        size="md"
      >
        <form onSubmit={handleCreateReturn} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Order ID *
            </label>
            <input
              required
              type="number"
              value={createFormData.orderId}
              onChange={e => setCreateFormData({ ...createFormData, orderId: e.target.value })}
              placeholder="e.g. 1001"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Return Reason *
            </label>
            <textarea
              required
              rows={3}
              value={createFormData.reason}
              onChange={e => setCreateFormData({ ...createFormData, reason: e.target.value })}
              placeholder="e.g. Damaged packaging, expired items, or wrong medicine"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Refund Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={createFormData.refundAmount}
              onChange={e => setCreateFormData({ ...createFormData, refundAmount: e.target.value })}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={submitting} type="submit">
              {submitting ? 'Submitting...' : 'Submit Return Request'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. View Return Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Return Details #${selectedReturn?.id || ''}`}
        size="md"
      >
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-2xl bg-background border border-border space-y-2">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-bold text-muted uppercase">Return ID</span>
              <span className="font-mono text-sm font-bold text-primary">#{selectedReturn?.id}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-bold text-muted uppercase">Original Order ID</span>
              <span className="font-mono text-sm font-bold text-foreground">Order #{selectedReturn?.orderId}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-bold text-muted uppercase">Reason</span>
              <span className="text-sm text-foreground">{selectedReturn?.reason}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-bold text-foreground">Refund Amount</span>
              <span className="text-xl font-black text-rose-500">${(selectedReturn?.refundAmount || selectedReturn?.totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* 9. Bulk Confirm Dialog */}
      <ConfirmDialog
        isOpen={bulkConfirmOpen}
        title={`${bulkActionType === 'delete' ? 'Delete' : 'Archive'} Selected Returns`}
        message={`${selected.size} return(s) will be ${bulkActionType === 'delete' ? 'permanently deleted' : 'archived'}.`}
        variant={bulkActionType === 'delete' ? 'danger' : 'warning'}
        isLoading={bulkLoading}
        onConfirm={confirmBulkAction}
        onCancel={() => setBulkConfirmOpen(false)}
      />
    </div>
  );
}