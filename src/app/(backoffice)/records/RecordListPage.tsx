import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../design-system/components/Button';
import { SearchFilterBar, FilterState } from '../design-system/components/SearchFilterBar';
import { BulkActionToolbar } from '../design-system/components/BulkActionToolbar';
import { ConfirmDialog } from '../design-system/components/ConfirmDialog';
import { useSelection } from '../design-system/hooks/useSelection';
import { BulkAction, BulkActionsConfig } from '../design-system/types';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export interface Column<T> {
  title: string;
  accessor: keyof T;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface RecordListPageProps<T> {
  title: string;
  columns: Column<T>[];
  getId: (item: T) => string | number;
  fetchData: (params: {
    page: number;
    pageSize: number;
    search?: string;
    filters?: FilterState;
  }) => Promise<{ data: T[]; total: number }>;
  bulkActionsConfig?: BulkActionsConfig<T>;
  onNewRecord?: () => void;
}

export function RecordListPage<T>({
  title,
  columns,
  getId,
  fetchData,
  bulkActionsConfig,
  onNewRecord,
}: RecordListPageProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<FilterState>({
    statuses: [],
    groupBy: '',
    startDate: '',
    endDate: '',
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Selection hook
  const {
    selectedIds,
    isCrossPageSelected,
    selectedCount,
    isAllCurrentSelected,
    toggleSelect,
    selectAllCurrentPage,
    clearSelection,
    selectAllCrossPage,
    isSelected,
  } = useSelection(rows, getId);

  // Modal dialog state for destructive action confirmation
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action?: BulkAction;
    title: string;
    message: string;
    variant: 'danger' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
  });
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchData({
        page,
        pageSize,
        search: searchTerm,
        filters: filterState,
      });
      setRows(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchData, page, pageSize, searchTerm, filterState]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle header checkbox (select all on page toggle)
  const handleHeaderCheckboxChange = () => {
    if (isAllCurrentSelected) {
      clearSelection();
    } else {
      selectAllCurrentPage();
    }
  };

  // Trigger Bulk Action
  const handleTriggerAction = (action: BulkAction) => {
    const selectedItems = rows.filter(item => isSelected(getId(item)));

    if (action === 'delete') {
      const customConf = bulkActionsConfig?.confirm?.delete;
      setConfirmDialog({
        isOpen: true,
        action: 'delete',
        title: customConf?.title || 'Delete Selected Records',
        message:
          customConf?.message(selectedCount) ||
          `${selectedCount} record(s) will be permanently deleted. This action cannot be undone.`,
        variant: 'danger',
      });
      return;
    }

    if (action === 'archive') {
      const customConf = bulkActionsConfig?.confirm?.archive;
      setConfirmDialog({
        isOpen: true,
        action: 'archive',
        title: customConf?.title || 'Archive Selected Records',
        message:
          customConf?.message(selectedCount) ||
          `${selectedCount} record(s) will be soft-archived.`,
        variant: 'warning',
      });
      return;
    }

    // Direct actions (duplicate, deactivate)
    executeBulkAction(action, selectedItems);
  };

  const executeBulkAction = async (action: BulkAction, selectedItems: T[]) => {
    if (!bulkActionsConfig?.run) return;
    setActionLoading(true);
    try {
      await bulkActionsConfig.run(action, selectedItems);
      clearSelection();
      await loadData();
    } catch (err) {
      console.error(`Failed to execute ${action}:`, err);
    } finally {
      setActionLoading(false);
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleConfirmModalAction = () => {
    if (!confirmDialog.action) return;
    const selectedItems = rows.filter(item => isSelected(getId(item)));
    executeBulkAction(confirmDialog.action, selectedItems);
  };

  const handleExportSelected = () => {
    const selectedItems = rows.filter(item => isSelected(getId(item)));
    console.log('Exporting selected items:', selectedItems);
    const jsonStr = JSON.stringify(selectedItems, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* 1. Header & Main Action */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {onNewRecord && (
          <Button
            variant="primary"
            shape="pill"
            size="md"
            onClick={onNewRecord}
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>New Record</span>
          </Button>
        )}
      </div>

      {/* 2. Bulk Action Toolbar (Appears dynamically when rows selected) */}
      <BulkActionToolbar
        selectedCount={selectedCount}
        totalCount={total}
        isCrossPageSelected={isCrossPageSelected}
        onSelectAllCrossPage={selectAllCrossPage}
        onClearSelection={clearSelection}
        config={bulkActionsConfig}
        onTriggerAction={handleTriggerAction}
        onExportSelected={handleExportSelected}
      />

      {/* 3. Search & Multi-Filter Toolbar */}
      <SearchFilterBar
        onSearchChange={setSearchTerm}
        onFilterChange={setFilterState}
      />

      {/* 4. Enterprise Table */}
      <div className="overflow-x-auto bg-surface rounded-xl shadow-sm border border-border">
        <table className="w-full text-sm border-collapse text-left">
          <thead className="bg-surface/80 border-b border-border text-muted font-medium">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={isAllCurrentSelected && rows.length > 0}
                  onChange={handleHeaderCheckboxChange}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                />
              </th>
              {columns.map(col => (
                <th key={String(col.accessor)} className="px-4 py-3 font-semibold">
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="p-8 text-center text-muted">
                  Loading records...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="p-8 text-center text-muted">
                  No records matching criteria.
                </td>
              </tr>
            ) : (
              rows.map(row => {
                const id = getId(row);
                const checked = isSelected(id);
                return (
                  <tr
                    key={id}
                    className={`transition-colors ${
                      checked
                        ? 'bg-primary/5 hover:bg-primary/10'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <td className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelect(id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </td>
                    {columns.map(col => (
                      <td key={String(col.accessor)} className="px-4 py-3">
                        {col.render ? col.render(row) : (row[col.accessor] as any)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Pagination Controls */}
      <div className="flex items-center justify-between py-2 text-sm text-muted">
        <div>
          Showing{' '}
          <span className="font-semibold text-foreground">
            {total === 0 ? 0 : (page - 1) * pageSize + 1}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-foreground">
            {Math.min(page * pageSize, total)}
          </span>{' '}
          of <span className="font-semibold text-foreground">{total}</span> records
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            shape="pill"
            size="sm"
            disabled={page === 1 || loading}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>
            Page <strong className="text-foreground">{page}</strong>
          </span>
          <Button
            variant="outline"
            shape="pill"
            size="sm"
            disabled={page * pageSize >= total || loading}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 6. Destructive Confirmation Modal */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        isLoading={actionLoading}
        onConfirm={handleConfirmModalAction}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
