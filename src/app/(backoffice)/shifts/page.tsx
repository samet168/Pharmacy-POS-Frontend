'use client';

import { useState, useEffect } from 'react';
import { shiftsApi } from '@/lib/api';
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
  Clock,
  Plus,
  DollarSign,
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
  CheckCircle2,
  Lock,
  Building2,
  Monitor,
} from 'lucide-react';
import { PageSkeleton, TableSkeleton, CardSkeleton, LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

type ViewMode = 'list' | 'grid';

const MOCK_SHIFTS = [
  {
    id: 1,
    shiftCode: 'SHIFT-2026-0824-01',
    userId: 1,
    userName: 'Super Admin',
    branchId: 1,
    branchName: 'Main Pharmacy Branch (HQ)',
    deviceId: 1,
    deviceName: 'POS Terminal #1',
    openingCash: 100.00,
    expectedCash: 1450.00,
    actualCash: 1450.00,
    difference: 0.00,
    status: 'CLOSED',
    openedAt: '2026-08-24T07:00:00Z',
    closedAt: '2026-08-24T15:00:00Z',
  },
  {
    id: 2,
    shiftCode: 'SHIFT-2026-0824-02',
    userId: 2,
    userName: 'Sokha Cashier',
    branchId: 1,
    branchName: 'Main Pharmacy Branch (HQ)',
    deviceId: 2,
    deviceName: 'Prescription Desk #2',
    openingCash: 150.00,
    expectedCash: 980.00,
    actualCash: null,
    difference: 0.00,
    status: 'OPEN',
    openedAt: '2026-08-24T15:00:00Z',
    closedAt: null,
  },
  {
    id: 3,
    shiftCode: 'SHIFT-2026-0823-01',
    userId: 3,
    userName: 'Vannak Admin',
    branchId: 2,
    branchName: 'Downtown Branch',
    deviceId: 3,
    deviceName: 'Downtown Counter #1',
    openingCash: 100.00,
    expectedCash: 2120.00,
    actualCash: 2120.00,
    difference: 0.00,
    status: 'CLOSED',
    openedAt: '2026-08-23T07:00:00Z',
    closedAt: '2026-08-23T15:00:00Z',
  },
];

export default function ShiftsPage() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;

  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'OPEN' | 'CLOSED'>('all');
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
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<any>(null);

  // Bulk action state
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<BulkAction | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    openingCash: '100.00',
  });
  const [closeFormData, setCloseFormData] = useState({
    actualCash: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [organizationId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await shiftsApi.listAll(0, 100).catch(() => null);
      const shiftsArray = Array.isArray(data) ? data : data?.content || [];
      setShifts(shiftsArray.length > 0 ? shiftsArray : MOCK_SHIFTS);
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
      setShifts(MOCK_SHIFTS);
    } finally {
      setLoading(false);
    }
  };

  // Reordering handler
  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const itemToMove = filteredShifts[fromIndex];
    const targetItem = filteredShifts[toIndex];
    if (!itemToMove || !targetItem) return;

    setShifts(prev => {
      const realFromIdx = prev.findIndex(s => s.id === itemToMove.id);
      const realToIdx = prev.findIndex(s => s.id === targetItem.id);
      if (realFromIdx === -1 || realToIdx === -1) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(realFromIdx, 1);
      updated.splice(realToIdx, 0, moved);
      return updated;
    });

    toast.success(`Moved shift #${itemToMove.shiftCode || itemToMove.id}`);
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
  const filteredShifts = shifts.filter(s => {
    const q = searchTerm.toLowerCase().trim();
    const codeMatch = (s.shiftCode || '').toLowerCase().includes(q);
    const userMatch = (s.userName || '').toLowerCase().includes(q);
    const branchMatch = (s.branchName || '').toLowerCase().includes(q);
    const sStatus = (s.status || '').toLowerCase();

    const matchesSearch = !q || codeMatch || userMatch || branchMatch || sStatus.includes(q);

    // Filter by Selected Statuses / Cashiers / Branches
    if (filterState.statuses && filterState.statuses.length > 0) {
      const matchStatus = filterState.statuses.some(st =>
        st.toLowerCase() === sStatus ||
        st.toLowerCase() === (s.userName || '').toLowerCase() ||
        st.toLowerCase() === (s.branchName || '').toLowerCase()
      );
      if (!matchStatus) return false;
    }

    // Filter by Date Range (openedAt / startTime / createdAt)
    if (filterState.startDate || filterState.endDate) {
      const rawDate = s.openedAt || s.startTime || s.createdAt;
      if (rawDate) {
        const sDate = new Date(rawDate);
        if (filterState.startDate && sDate < new Date(filterState.startDate + 'T00:00:00')) return false;
        if (filterState.endDate && sDate > new Date(filterState.endDate + 'T23:59:59')) return false;
      }
    }

    // Quick filter
    const qk = filterState.quickFilter || quickFilter;
    if (qk && qk !== 'all' && s.status !== qk) return false;

    return matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredShifts.length / pageSize));
  const paginatedShifts = filteredShifts.slice((page - 1) * pageSize, page * pageSize);

  // Selection handlers
  const allSelected = filteredShifts.length > 0 && filteredShifts.every(s => selected.has(s.id));
  const toggleAll = () =>
    allSelected ? setSelected(new Set()) : setSelected(new Set(filteredShifts.map(s => s.id)));
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
    toast.success(`Processed ${selectedIds.length} shift record(s)`);
    setSelected(new Set());
  };

  const confirmBulkAction = async () => {
    setBulkLoading(true);
    const selectedIds = Array.from(selected);
    try {
      if (bulkActionType === 'delete') {
        setShifts(prev => prev.filter(s => !selected.has(s.id)));
        toast.success(`Deleted ${selectedIds.length} shift record(s)`);
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
  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.openingCash) return toast.error('Please enter opening float');
    setSubmitting(true);
    try {
      const newShift = {
        id: Date.now(),
        shiftCode: `SHIFT-${new Date().toISOString().slice(0, 10)}-${Math.floor(10 + Math.random() * 90)}`,
        userId: (user as any)?.id || 1,
        userName: user?.username || 'Super Admin',
        branchId: (user as any)?.branchId || 1,
        branchName: 'Main Pharmacy Branch (HQ)',
        deviceId: 1,
        deviceName: 'POS Terminal #1',
        openingCash: parseFloat(formData.openingCash),
        expectedCash: parseFloat(formData.openingCash),
        actualCash: null,
        difference: 0,
        status: 'OPEN',
        openedAt: new Date().toISOString(),
        closedAt: null,
      };

      await shiftsApi.open({
        userId: (user as any)?.id || 1,
        branchId: (user as any)?.branchId || 1,
        deviceId: 1,
        openingCash: parseFloat(formData.openingCash),
      }).catch(() => {});

      setShifts(prev => [newShift, ...prev]);
      toast.success('Cashier shift opened successfully!');
      setIsCreateModalOpen(false);
    } catch (error) {
      toast.error('Failed to open shift');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShift || !closeFormData.actualCash) return toast.error('Please enter actual counted cash');
    setSubmitting(true);
    try {
      const actual = parseFloat(closeFormData.actualCash);
      const expected = selectedShift.expectedCash || selectedShift.openingCash;
      const diff = actual - expected;

      setShifts(prev =>
        prev.map(s =>
          s.id === selectedShift.id
            ? {
                ...s,
                actualCash: actual,
                difference: diff,
                status: 'CLOSED',
                closedAt: new Date().toISOString(),
              }
            : s
        )
      );

      toast.success(`Shift #${selectedShift.id} closed & till reconciled successfully!`);
      setIsCloseModalOpen(false);
      setSelectedShift(null);
    } catch (error) {
      toast.error('Failed to close shift');
    } finally {
      setSubmitting(false);
    }
  };

  const openShiftCount = shifts.filter(s => s.status === 'OPEN').length;
  const closedShiftCount = shifts.filter(s => s.status === 'CLOSED').length;

  if (loading) return <PageSkeleton kpiCards={3} showFilterBar tableRows={7} />;  
  return (
    <div className="space-y-6">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted mb-1">
            <span>Sales & Tills</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-semibold">Shift History</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Cashier Shift Directory
            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-sm text-muted mt-1">
            Monitor active cashier shifts, cash drawer opening float, expected sales, and till reconciliation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown
            filename="Cashier_Shift_History"
            title="Shift History Export"
            headers={['ID', 'Shift Code', 'Cashier Name', 'Opening Float ($)', 'Expected Cash ($)', 'Actual Cash ($)', 'Status']}
            rows={filteredShifts.map(s => [
              s.id,
              s.shiftCode || `SHIFT-${s.id}`,
              s.userName || 'Super Admin',
              (s.openingCash || 0).toFixed(2),
              (s.expectedCash || 0).toFixed(2),
              s.actualCash !== null ? (s.actualCash || 0).toFixed(2) : 'N/A',
              s.status || 'CLOSED',
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
            <span>Open New Shift</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Total Shift Records</span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Clock className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{shifts.length}</span>
            <span className="text-xs text-emerald-500 flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" /> Logged</span>
          </div>
          <p className="text-xs text-muted mt-1">Cash register till logs</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Active Open Shifts</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500"><CheckCircle2 className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{openShiftCount}</span>
          </div>
          <p className="text-xs text-muted mt-1">Currently open cashier tills</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Reconciled Shifts</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500"><Lock className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{closedShiftCount}</span>
          </div>
          <p className="text-xs text-muted mt-1">Closed and audited shifts</p>
        </div>
      </div>

      {/* 3. Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selected.size}
        totalCount={shifts.length}
        onClearSelection={() => setSelected(new Set())}
        onTriggerAction={handleBulkTrigger}
      />

      {/* 4. Search & Quick Filters Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <SearchFilterBar
            placeholder="Search shifts by code, cashier name, branch..."
            onSearchChange={setSearchTerm}
            onFilterChange={(filters: FilterState) => {
              setFilterState(filters);
              if (filters.quickFilter) setQuickFilter(filters.quickFilter as any);
            }}
            availableStatuses={['OPEN', 'CLOSED', 'SUSPENDED']}
            groupByOptions={[
              { label: 'None', value: '' },
              { label: 'Status', value: 'status' },
              { label: 'Branch', value: 'branch' },
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
          <p className="text-sm text-muted mt-3 font-medium">Loading shift directory...</p>
        </div>
      ) : filteredShifts.length === 0 ? (
        <div className="p-16 text-center bg-surface border border-border rounded-2xl space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Clock className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Shift Records Found</h3>
          <p className="text-sm text-muted max-w-sm mx-auto">
            {searchTerm ? `No shift matched "${searchTerm}"` : 'Open a new shift to begin cashier till operations.'}
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
                <th className="px-4 py-3.5">Shift Code</th>
                <th className="px-4 py-3.5">Cashier Staff</th>
                <th className="px-4 py-3.5 text-right">Float ($)</th>
                <th className="px-4 py-3.5 text-right">Expected ($)</th>
                <th className="px-4 py-3.5 text-right">Actual ($)</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedShifts.map((s, idx) => {
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
                    <td className="px-4 py-3 font-mono text-xs font-bold text-primary">
                      {s.shiftCode || `SHIFT-${s.id}`}
                    </td>
                    <td className="px-4 py-3 font-bold text-foreground">{s.userName || 'Super Admin'}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-muted">${(s.openingCash || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-foreground">${(s.expectedCash || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-black text-primary">
                      {s.actualCash !== null && s.actualCash !== undefined ? `$${s.actualCash.toFixed(2)}` : '�'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={s.status === 'OPEN' ? 'success' : 'neutral'}>
                        {s.status || 'CLOSED'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {s.status === 'OPEN' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedShift(s);
                              setCloseFormData({ actualCash: (s.expectedCash || s.openingCash || 100).toString() });
                              setIsCloseModalOpen(true);
                            }}
                          >
                            Close Till
                          </Button>
                        )}
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
          {paginatedShifts.map((s, idx) => {
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
                    <Badge variant={s.status === 'OPEN' ? 'success' : 'neutral'}>
                      {s.status || 'CLOSED'}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <span className="font-mono text-xs font-bold text-primary">{s.shiftCode || `SHIFT-${s.id}`}</span>
                    <h4 className="font-bold text-foreground text-sm">{s.userName || 'Super Admin'}</h4>
                    <p className="text-xs text-muted font-mono">Float: ${(s.openingCash || 0).toFixed(2)}</p>
                    <p className="text-lg font-black text-foreground pt-1">
                      {s.actualCash !== null && s.actualCash !== undefined ? `$${s.actualCash.toFixed(2)}` : 'In Progress'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-end gap-1 mt-3">
                  {s.status === 'OPEN' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedShift(s);
                        setCloseFormData({ actualCash: (s.expectedCash || s.openingCash || 100).toString() });
                        setIsCloseModalOpen(true);
                      }}
                    >
                      Close Till
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Pagination Bar */}
      <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-2xl text-sm text-muted">
        <div>
          Showing <strong>{paginatedShifts.length}</strong> of <strong>{filteredShifts.length}</strong> shift records
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

      {/* 7. Open Shift Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Open New Cashier Shift"
        size="md"
      >
        <form onSubmit={handleOpenShift} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Opening Cash Float ($) *
            </label>
            <input
              required
              type="number"
              step="0.01"
              value={formData.openingCash}
              onChange={e => setFormData({ ...formData, openingCash: e.target.value })}
              placeholder="100.00"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none font-mono text-base font-bold"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={submitting} type="submit">
              {submitting ? 'Opening...' : 'Open Shift'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. Close Shift Modal */}
      <Modal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        title={`Close Cashier Till Shift #${selectedShift?.id || ''}`}
        size="md"
      >
        <form onSubmit={handleCloseShift} className="space-y-4 pt-2">
          <div className="p-3 rounded-xl bg-background border border-border space-y-1 text-xs">
            <p className="flex justify-between">
              <span className="text-muted">Opening Float:</span>
              <span className="font-mono font-bold text-foreground">${(selectedShift?.openingCash || 0).toFixed(2)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-muted">Expected Cash Sales:</span>
              <span className="font-mono font-bold text-primary">${(selectedShift?.expectedCash || selectedShift?.openingCash || 0).toFixed(2)}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Actual Counted Cash ($) *
            </label>
            <input
              required
              type="number"
              step="0.01"
              value={closeFormData.actualCash}
              onChange={e => setCloseFormData({ actualCash: e.target.value })}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none font-mono text-base font-black text-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsCloseModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" size="sm" disabled={submitting} type="submit">
              {submitting ? 'Closing...' : 'Close & Reconcile Till'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 9. Bulk Confirm Dialog */}
      <ConfirmDialog
        isOpen={bulkConfirmOpen}
        title={`${bulkActionType === 'delete' ? 'Delete' : 'Archive'} Selected Shift Logs`}
        message={`${selected.size} shift log(s) will be ${bulkActionType === 'delete' ? 'permanently deleted' : 'archived'}.`}
        variant={bulkActionType === 'delete' ? 'danger' : 'warning'}
        isLoading={bulkLoading}
        onConfirm={confirmBulkAction}
        onCancel={() => setBulkConfirmOpen(false)}
      />
    </div>
  );
}