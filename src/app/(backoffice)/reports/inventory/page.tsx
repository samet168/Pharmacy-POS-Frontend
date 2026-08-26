'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { reportsApi, InventoryReportResponse, BranchStock, CategoryStock, StockMovementSummary } from '@/lib/api/reports';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { exportToCSV } from '@/lib/utils/exportUtils';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { toast } from 'sonner';
import {
  Warehouse,
  DollarSign,
  Search,
  Printer,
  RefreshCw,
  ChevronRight,
  List,
  LayoutGrid,
  Sparkles,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Building2,
  Boxes,
  PieChart,
  Package,
  Layers,
  ArrowRightLeft,
  ShieldAlert,
} from 'lucide-react';

type TabView = 'branches' | 'categories' | 'movements';
type ViewMode = 'table' | 'grid';
type SortField = 'stockValue' | 'totalProducts' | 'lowStockCount' | 'branchName';
type SortDir = 'asc' | 'desc';

export default function InventoryReportPage() {
  const { user, currentUser } = useAuthStore();

  // Data & Loading
  const [reportData, setReportData] = useState<InventoryReportResponse | null>(null);
  const [branchStocks, setBranchStocks] = useState<BranchStock[]>([]);
  const [categoryStocks, setCategoryStocks] = useState<CategoryStock[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovementSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabView>('branches');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortField, setSortField] = useState<SortField>('stockValue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch Report Data from Backend API
  const fetchReport = async () => {
    const orgId = currentUser?.organizationId || user?.organizationId || 1;
    if (!orgId) return;

    setLoading(true);
    try {
      const res = await reportsApi.getInventoryReport({
        organizationId: orgId,
      });

      if (res) {
        setReportData(res);
        setBranchStocks(res.branchStocks || []);
        setCategoryStocks(res.categoryStocks || []);
        setStockMovements(res.stockMovementSummary || []);
      } else {
        setReportData(null);
        setBranchStocks([]);
        setCategoryStocks([]);
        setStockMovements([]);
      }
    } catch (error) {
      console.error('Failed to load inventory report', error);
      toast.error('Failed to load inventory report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [currentUser?.organizationId, user?.organizationId]);

  // Derived KPI Metrics
  const totalStockValue = Number(reportData?.totalStockValue ?? 0);
  const totalStockQuantity = Number(reportData?.totalStockQuantity ?? 0);
  const lowStockCount = Number(reportData?.lowStockCount ?? 0);
  const outOfStockCount = Number(reportData?.outOfStockCount ?? 0);
  const expiringCount = Number(reportData?.expiringCount ?? 0);
  const expiredCount = Number(reportData?.expiredCount ?? 0);

  // Filter & Sort Branch Stocks
  const processedBranches = useMemo(() => {
    let result = [...branchStocks];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(b =>
        b.branchName && b.branchName.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'stockValue' || sortField === 'totalProducts' || sortField === 'lowStockCount') {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      } else {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [branchStocks, searchTerm, sortField, sortDir]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(processedBranches.length / pageSize));
  const paginatedBranches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedBranches.slice(start, start + pageSize);
  }, [processedBranches, currentPage, pageSize]);

  // Sorting Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // CSV Export Data
  const exportHeaders = ['Branch Name', 'Total Products', 'Stock Valuation ($)', 'Low Stock Alerts', 'Share of Valuation (%)'];
  const exportRows = processedBranches.map(b => {
    const val = Number(b.stockValue || 0);
    const share = totalStockValue > 0 ? ((val / totalStockValue) * 100).toFixed(1) + '%' : '0%';
    return [
      b.branchName || 'N/A',
      b.totalProducts || 0,
      val.toFixed(2),
      b.lowStockCount || 0,
      share,
    ];
  });

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <PageSkeleton kpiCards={4} showFilterBar tableRows={7} tableCols={6} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 pb-16 animate-fade-in">
      {/* 1. Header & Navigation Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            <span>Reports</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-semibold">Inventory Valuation &amp; Stock Health</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Inventory Valuation &amp; Stock Health Report
            </h1>
            <Badge variant="success">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Live Warehouse
              </span>
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Total inventory monetary valuation, branch stock allocation, category breakdown, and risk alerts.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs rounded-xl"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs rounded-xl"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>

          <ExportDropdown
            filename="Pharmacy_Inventory_Valuation_Report"
            title="Inventory Valuation & Stock Health Report"
            subtitle={`Total Valuation: $${totalStockValue.toFixed(2)} | Total Units: ${totalStockQuantity}`}
            headers={exportHeaders}
            rows={exportRows}
            buttonVariant="primary"
            buttonText="Export CSV"
          />
        </div>
      </div>

      {/* 2. KPI Metrics Grid (Bento Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock Valuation */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Valuation
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              ${totalStockValue.toFixed(2)}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Badge variant="success" className="text-[10px] px-1.5 py-0">
                Asset Value
              </Badge>
              <span>Across all warehouse branches</span>
            </div>
          </div>
        </div>

        {/* Total Units in Stock */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Units in Stock
            </span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {totalStockQuantity.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span>Total physical medication units</span>
            </div>
          </div>
        </div>

        {/* Low / Out of Stock Risks */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Stock Depletion Risk
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {lowStockCount + outOfStockCount}
              </span>
              <span className="text-xs text-slate-400">items need reorder</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {lowStockCount > 0 && (
                <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                  {lowStockCount} Low
                </Badge>
              )}
              {outOfStockCount > 0 && (
                <Badge variant="danger" className="text-[10px] px-1.5 py-0">
                  {outOfStockCount} Out of Stock
                </Badge>
              )}
              {lowStockCount === 0 && outOfStockCount === 0 && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Fully Stocked
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Expiry Risk Alerts */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Batch Expiry Risk
            </span>
            <div className="h-9 w-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {expiringCount + expiredCount}
              </span>
              <span className="text-xs text-slate-400">batches alert</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {expiredCount > 0 && (
                <Badge variant="danger" className="text-[10px] px-1.5 py-0">
                  {expiredCount} Expired
                </Badge>
              )}
              {expiringCount > 0 && (
                <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                  {expiringCount} Near Expiry
                </Badge>
              )}
              {expiringCount === 0 && expiredCount === 0 && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Fresh Inventory
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter & Tab Controls Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Main Module Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => {
                setActiveTab('branches');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'branches'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              Branch Valuation ({branchStocks.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('categories');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'categories'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Category Breakdown ({categoryStocks.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('movements');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'movements'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              Stock Movement Summary
            </button>
          </div>

          {/* Search & View Mode Switcher */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search branch or location..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {activeTab === 'branches' && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/80 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-800 text-primary shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Table View"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-800 text-primary shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Bento Grid View"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA */}
      {/* ── TAB 1: BRANCH VALUATION ───────────────────────────────────────── */}
      {activeTab === 'branches' && (
        <>
          {viewMode === 'table' ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th
                        onClick={() => handleSort('branchName')}
                        className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          Pharmacy Branch Location
                          {sortField === 'branchName' && (
                            sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('totalProducts')}
                        className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 select-none"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          Products Tracked
                          {sortField === 'totalProducts' && (
                            sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('lowStockCount')}
                        className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 select-none"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          Low Stock Alerts
                          {sortField === 'lowStockCount' && (
                            sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('stockValue')}
                        className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 select-none"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          Stock Valuation ($)
                          {sortField === 'stockValue' && (
                            sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-4 text-right">Valuation Share</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {paginatedBranches.length > 0 ? (
                      paginatedBranches.map((b, idx) => {
                        const globalIndex = (currentPage - 1) * pageSize + idx;
                        const val = Number(b.stockValue || 0);
                        const products = Number(b.totalProducts || 0);
                        const low = Number(b.lowStockCount || 0);
                        const share = totalStockValue > 0 ? (val / totalStockValue) * 100 : 0;
                        const isMain = globalIndex === 0 && val > 0;

                        return (
                          <tr
                            key={b.branchId || idx}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                          >
                            <td className="py-3 px-4 text-center font-bold text-slate-400">
                              {globalIndex + 1}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span className="line-clamp-1">{b.branchName}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                              {products.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {low > 0 ? (
                                <span className="text-amber-600 dark:text-amber-400 font-bold">
                                  {low} items
                                </span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400">0</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                              ${val.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-12 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-primary h-full rounded-full"
                                    style={{ width: `${Math.min(100, share)}%` }}
                                  />
                                </div>
                                <span className="text-slate-600 dark:text-slate-400 w-10 text-right">
                                  {share.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {isMain ? (
                                <Badge variant="success">
                                  <span className="flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    Main Depot
                                  </span>
                                </Badge>
                              ) : low > 5 ? (
                                <Badge variant="warning">Reorder Risk</Badge>
                              ) : (
                                <Badge variant="neutral">Normal</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Warehouse className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                            <p className="font-semibold text-sm">No branch stock data found</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {/* Table Footer with Summary */}
                  {paginatedBranches.length > 0 && (
                    <tfoot className="bg-slate-50 dark:bg-slate-800/90 border-t-2 border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100">
                      <tr>
                        <td colSpan={2} className="py-3 px-4">
                          Total ({processedBranches.length} branches)
                        </td>
                        <td className="py-3 px-4 text-right">
                          {processedBranches.reduce((sum, b) => sum + Number(b.totalProducts || 0), 0)}
                        </td>
                        <td className="py-3 px-4 text-right text-amber-600 dark:text-amber-400">
                          {lowStockCount}
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">
                          ${totalStockValue.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right">100.0%</td>
                        <td className="py-3 px-4 text-center">-</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Showing{' '}
                    <span className="font-semibold text-slate-900 dark:text-slate-200">
                      {(currentPage - 1) * pageSize + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-semibold text-slate-900 dark:text-slate-200">
                      {Math.min(currentPage * pageSize, processedBranches.length)}
                    </span>{' '}
                    of{' '}
                    <span className="font-semibold text-slate-900 dark:text-slate-200">
                      {processedBranches.length}
                    </span>{' '}
                    branches
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="text-xs rounded-lg px-2.5 py-1"
                    >
                      Previous
                    </Button>
                    <span className="text-xs font-semibold px-2 text-slate-700 dark:text-slate-300">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="text-xs rounded-lg px-2.5 py-1"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Bento Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {paginatedBranches.length > 0 ? (
                paginatedBranches.map((b, idx) => {
                  const globalIndex = (currentPage - 1) * pageSize + idx;
                  const val = Number(b.stockValue || 0);
                  const products = Number(b.totalProducts || 0);
                  const low = Number(b.lowStockCount || 0);
                  const isMain = globalIndex === 0 && val > 0;

                  return (
                    <div
                      key={b.branchId || idx}
                      className={`bg-white dark:bg-slate-800 rounded-2xl border p-4 space-y-3 transition-all hover:shadow-md ${
                        isMain
                          ? 'border-emerald-400 dark:border-emerald-500/60 ring-1 ring-emerald-400/20'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                          <Building2 className="h-3.5 w-3.5 text-primary" />
                          <span className="line-clamp-1">{b.branchName}</span>
                        </div>
                        {isMain ? (
                          <Badge variant="success">Main</Badge>
                        ) : (
                          <Badge variant="neutral">{products} items</Badge>
                        )}
                      </div>

                      <div>
                        <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                          ${val.toFixed(2)}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {products} catalog products
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <span className={low > 0 ? 'text-amber-500 font-bold' : 'text-slate-400'}>
                          {low} low stock
                        </span>
                        <span className="text-primary font-semibold">
                          {totalStockValue > 0 ? ((val / totalStockValue) * 100).toFixed(1) : 0}% share
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  No branch records found.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── TAB 2: CATEGORY VALUATION ─────────────────────────────────────── */}
      {activeTab === 'categories' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Stock Valuation by Category
              </h3>
            </div>
            <Badge variant="info">{categoryStocks.length} Categories</Badge>
          </div>

          <div className="space-y-3">
            {categoryStocks && categoryStocks.length > 0 ? (
              categoryStocks.map((cat, idx) => {
                const val = Number(cat.stockValue || 0);
                const count = Number(cat.productCount || 0);
                const pct = totalStockValue > 0 ? (val / totalStockValue) * 100 : 0;

                return (
                  <div key={idx} className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {cat.categoryName || 'Uncategorized'}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 dark:text-slate-400">
                          {count} Products
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          ${val.toFixed(2)} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No category valuation data available.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: STOCK MOVEMENT SUMMARY ─────────────────────────────────── */}
      {activeTab === 'movements' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Stock Movement Activity Breakdown
              </h3>
            </div>
            <Badge variant="neutral">{stockMovements.length} Movement Types</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {stockMovements && stockMovements.length > 0 ? (
              stockMovements.map((mov, idx) => {
                const count = Number(mov.count || 0);
                const qty = Number(mov.quantity || 0);
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                        {mov.movementType || 'MOVEMENT'}
                      </span>
                      <Badge variant="neutral">{count} records</Badge>
                    </div>
                    <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                      {qty.toLocaleString()} units
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center text-xs text-slate-400">
                No stock movement activity recorded.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}