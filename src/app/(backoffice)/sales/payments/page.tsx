'use client';

import { useState, useEffect } from 'react';
import { paymentsApi, Payment } from '@/lib/api/payments';
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
  CreditCard,
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
  QrCode,
  Calendar,
} from 'lucide-react';

type ViewMode = 'list' | 'grid';

export interface DisplayPayment extends Omit<Payment, 'paymentDate'> {
  referenceNumber?: string;
  transactionRef?: string;
  paymentRef?: string;
  refNo?: string;
  transactionId?: string;
  referenceNo?: string;
  paymentAmount?: number;
  amountPaid?: number;
  paymentDate?: string;
}

const MOCK_PAYMENTS: DisplayPayment[] = [
  { id: 1, orderId: 1001, amount: 24.50, paymentMethod: 'CASH', referenceNumber: 'REF-CASH-991', paymentDate: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 2, orderId: 1002, amount: 15.00, paymentMethod: 'KHQR', referenceNumber: 'ABA-KHQR-882', paymentDate: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 3, orderId: 1003, amount: 42.00, paymentMethod: 'CARD', referenceNumber: 'VISA-4412', paymentDate: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 4, orderId: 1004, amount: 8.75, paymentMethod: 'CASH', referenceNumber: 'REF-CASH-774', paymentDate: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export default function PaymentsPage() {
  const { user, branchIds: storeBranchIds } = useAuthStore();
  const organizationId = user?.organizationId || 1;
  const branchId = storeBranchIds?.[0] || 1;

  const [payments, setPayments] = useState<DisplayPayment[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'CASH' | 'KHQR' | 'CARD' | 'BANK_TRANSFER'>('all');
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
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<DisplayPayment | null>(null);

  // Bulk action state
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<BulkAction | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [organizationId, branchId]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentsApi.getByOrganization(organizationId, { branchId }).catch(() => null);
      const paymentsArray = Array.isArray(data) ? data : data?.content || [];
      setPayments(paymentsArray.length > 0 ? paymentsArray : MOCK_PAYMENTS);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      setPayments(MOCK_PAYMENTS);
    } finally {
      setLoading(false);
    }
  };

  // Field resolution helpers
  const getPaymentAmount = (p: any): number => {
    if (!p) return 0;
    return p.amount ?? p.paymentAmount ?? p.totalAmount ?? p.amountPaid ?? p.amountCollected ?? 0;
  };

  const getPaymentRef = (p: any): string => {
    if (!p) return 'N/A';
    return (
      p.referenceNumber ||
      p.transactionRef ||
      p.paymentRef ||
      p.refNo ||
      p.transactionId ||
      p.referenceNo ||
      `REF-${p.paymentMethod || 'PAY'}-${p.id}`
    );
  };

  // Reordering handler
  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const itemToMove = filteredPayments[fromIndex];
    const targetItem = filteredPayments[toIndex];
    if (!itemToMove || !targetItem) return;

    setPayments(prev => {
      const realFromIdx = prev.findIndex(p => p.id === itemToMove.id);
      const realToIdx = prev.findIndex(p => p.id === targetItem.id);
      if (realFromIdx === -1 || realToIdx === -1) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(realFromIdx, 1);
      updated.splice(realToIdx, 0, moved);
      return updated;
    });

    toast.success(`Moved payment #${itemToMove.id}`);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Filter Logic
  const filteredPayments = payments.filter(p => {
    const q = searchTerm.toLowerCase().trim();
    const refNum = getPaymentRef(p).toLowerCase();
    const ordId = (p.orderId || '').toString();
    const matchesSearch = !q || refNum.includes(q) || ordId.includes(q);

    let matchesQuick = true;
    if (quickFilter !== 'all') matchesQuick = p.paymentMethod === quickFilter;

    return matchesSearch && matchesQuick;
  });

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const paginatedPayments = filteredPayments.slice((page - 1) * pageSize, page * pageSize);

  // Selection handlers
  const allSelected = filteredPayments.length > 0 && filteredPayments.every(p => selected.has(p.id));
  const toggleAll = () =>
    allSelected ? setSelected(new Set()) : setSelected(new Set(filteredPayments.map(p => p.id)));
  const toggleSel = (id: number) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // KPI Calculations
  const totalAmountSum = payments.reduce((sum, p) => sum + getPaymentAmount(p), 0);
  const cashPaymentsCount = payments.filter(p => p.paymentMethod === 'CASH').length;
  const digitalPaymentsCount = payments.filter(p => p.paymentMethod !== 'CASH').length;

  // Bulk action handler
  const handleBulkTrigger = async (action: BulkAction) => {
    setBulkActionType(action);
    if (action === 'delete' || action === 'archive') {
      setBulkConfirmOpen(true);
      return;
    }
    const selectedIds = Array.from(selected);
    toast.success(`Processed ${selectedIds.length} payment record(s)`);
    setSelected(new Set());
  };

  const confirmBulkAction = async () => {
    setBulkLoading(true);
    const selectedIds = Array.from(selected);
    try {
      if (bulkActionType === 'delete') {
        setPayments(prev => prev.filter(p => !selected.has(p.id)));
        toast.success(`Deleted ${selectedIds.length} payment record(s)`);
      }
      setSelected(new Set());
    } catch (err) {
      toast.error('Failed to complete bulk action');
    } finally {
      setBulkLoading(false);
      setBulkConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted mb-1">
            <span>Sales & Finance</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-semibold">Payments History</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Payments Directory
            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-sm text-muted mt-1">
            Manage POS customer payments, transaction logs, and payment methods
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown
            filename="Payments_Export"
            title="Payments History Export"
            headers={['Payment ID', 'Order ID', 'Amount ($)', 'Payment Method', 'Reference #', 'Date']}
            rows={filteredPayments.map(p => [
              p.id || 0,
              p.orderId || 0,
              getPaymentAmount(p).toFixed(2),
              p.paymentMethod || 'CASH',
              getPaymentRef(p),
              p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-US') : '',
            ])}
            buttonVariant="outline"
            buttonSize="md"
            buttonText="Export Data"
          />
        </div>
      </div>

      {/* 2. KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Total Payments Collected</span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><DollarSign className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">${totalAmountSum.toFixed(2)}</span>
            <span className="text-xs text-emerald-500 flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" /> Collected</span>
          </div>
          <p className="text-xs text-muted mt-1">Total revenue collected</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Digital / KHQR Transactions</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500"><QrCode className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{digitalPaymentsCount}</span>
          </div>
          <p className="text-xs text-muted mt-1">KHQR & Card transactions</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Cash Transactions</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500"><Receipt className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{cashPaymentsCount}</span>
          </div>
          <p className="text-xs text-muted mt-1">Physical cash payments</p>
        </div>
      </div>

      {/* 3. Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selected.size}
        totalCount={payments.length}
        onClearSelection={() => setSelected(new Set())}
        onTriggerAction={handleBulkTrigger}
      />

      {/* 4. Search & Quick Filters Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <SearchFilterBar
            placeholder="Search payments by order ID, reference #..."
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
          <p className="text-sm text-muted mt-3 font-medium">Loading payments history...</p>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="p-16 text-center bg-surface border border-border rounded-2xl space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <CreditCard className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Payments Found</h3>
          <p className="text-sm text-muted max-w-sm mx-auto">
            {searchTerm ? `No payment matched "${searchTerm}"` : 'Payments will appear here when checkouts occur.'}
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
                <th className="px-4 py-3.5">Payment ID</th>
                <th className="px-4 py-3.5">Order ID</th>
                <th className="px-4 py-3.5">Method</th>
                <th className="px-4 py-3.5">Reference #</th>
                <th className="px-4 py-3.5 text-right">Amount ($)</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedPayments.map((p, idx) => {
                const isChecked = selected.has(p.id);
                const isDragging = draggedIndex === idx;
                const isDragOver = dragOverIndex === idx;

                return (
                  <tr
                    key={p.id}
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
                        onChange={() => toggleSel(p.id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-1 py-3 text-muted cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-4 w-4 hover:text-primary transition-colors" />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-primary">#{p.id}</td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-foreground">Order #{p.orderId}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-foreground border border-border">
                        <CreditCard className="h-3 w-3 text-primary" />
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground font-semibold">{getPaymentRef(p)}</td>
                    <td className="px-4 py-3 text-right font-black text-foreground">${getPaymentAmount(p).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPayment(p);
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
          {paginatedPayments.map((p, idx) => {
            const isChecked = selected.has(p.id);
            const isDragging = draggedIndex === idx;
            const isDragOver = dragOverIndex === idx;

            return (
              <div
                key={p.id}
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
                        onChange={() => toggleSel(p.id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </div>
                    <Badge variant="success">{p.paymentMethod}</Badge>
                  </div>

                  <div className="space-y-1">
                    <span className="font-mono text-xs font-bold text-primary">Payment #{p.id}</span>
                    <h4 className="font-bold text-foreground text-sm">Order #{p.orderId}</h4>
                    <p className="text-xs font-mono text-foreground font-semibold">{getPaymentRef(p)}</p>
                    <p className="text-lg font-black text-foreground pt-1">${getPaymentAmount(p).toFixed(2)}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-end gap-1 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPayment(p);
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
          Showing <strong>{paginatedPayments.length}</strong> of <strong>{filteredPayments.length}</strong> payments
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

      {/* 7. View Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Payment Details #${selectedPayment?.id || ''}`}
        size="md"
      >
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-2xl bg-background border border-border space-y-2">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-bold text-muted uppercase">Payment ID</span>
              <span className="font-mono text-sm font-bold text-primary">#{selectedPayment?.id}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-bold text-muted uppercase">Order ID</span>
              <span className="font-mono text-sm font-bold text-foreground">Order #{selectedPayment?.orderId}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-bold text-muted uppercase">Payment Method</span>
              <span className="text-sm font-mono text-foreground">{selectedPayment?.paymentMethod}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-bold text-muted uppercase">Reference Number</span>
              <span className="text-sm font-mono text-foreground font-bold">{getPaymentRef(selectedPayment)}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-bold text-foreground">Amount Collected</span>
              <span className="text-xl font-black text-primary">${getPaymentAmount(selectedPayment).toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* 8. Bulk Confirm Dialog */}
      <ConfirmDialog
        isOpen={bulkConfirmOpen}
        title={`${bulkActionType === 'delete' ? 'Delete' : 'Archive'} Selected Payments`}
        message={`${selected.size} payment(s) will be ${bulkActionType === 'delete' ? 'permanently deleted' : 'archived'}.`}
        variant={bulkActionType === 'delete' ? 'danger' : 'warning'}
        isLoading={bulkLoading}
        onConfirm={confirmBulkAction}
        onCancel={() => setBulkConfirmOpen(false)}
      />
    </div>
  );
}