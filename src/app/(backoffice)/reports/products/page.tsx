'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { reportsApi, ProductReportResponse, TopSellingProduct } from '@/lib/api/reports';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { exportToCSV } from '@/lib/utils/exportUtils';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { toast } from 'sonner';
import {
  Package,
  TrendingUp,
  DollarSign,
  Search,
  Printer,
  Calendar,
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
  Tag,
  ArrowUpRight,
  ShieldAlert,
  Boxes,
  Award,
} from 'lucide-react';

type TabView = 'velocity' | 'lowStock' | 'expiring';
type ViewMode = 'table' | 'grid';
type DatePreset = '7days' | '30days' | 'thisMonth' | 'custom';
type SortField = 'revenue' | 'quantitySold' | 'profit' | 'productName' | 'sku';
type SortDir = 'asc' | 'desc';

export default function ProductReportPage() {
  const { user, currentUser } = useAuthStore();

  // Date Range State
  const [datePreset, setDatePreset] = useState<DatePreset>('30days');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Data & Loading
  const [reportData, setReportData] = useState<ProductReportResponse | null>(null);
  const [topProducts, setTopProducts] = useState<TopSellingProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabView>('velocity');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Preset Date Handlers
  const handleApplyPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();
    let start = new Date();
    const end = now.toISOString().split('T')[0];

    if (preset === '7days') {
      start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (preset === '30days') {
      start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    } else if (preset === 'thisMonth') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    if (preset !== 'custom') {
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end);
    }
  };

  // Fetch Report Data from Backend API
  const fetchReport = async () => {
    const orgId = currentUser?.organizationId || user?.organizationId || 1;
    if (!orgId) return;

    setLoading(true);
    try {
      const res = await reportsApi.getProductReport({
        organizationId: orgId,
        from: startDate,
        to: endDate,
      });

      if (res) {
        setReportData(res);
        setTopProducts(res.topSellingProducts || []);
      } else {
        setReportData(null);
        setTopProducts([]);
      }
    } catch (error) {
      console.error('Failed to load product report', error);
      toast.error('Failed to load product report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [currentUser?.organizationId, user?.organizationId, startDate, endDate]);

  // Derived KPI Metrics
  const totalProductsCount = Number(reportData?.totalProducts ?? 0);
  const totalRevenue = useMemo(() => {
    return topProducts.reduce((sum, p) => sum + Number(p.revenue || 0), 0);
  }, [topProducts]);

  const totalUnitsSold = useMemo(() => {
    return topProducts.reduce((sum, p) => sum + Number(p.quantitySold || 0), 0);
  }, [topProducts]);

  const totalProfit = useMemo(() => {
    return topProducts.reduce((sum, p) => sum + Number(p.profit || 0), 0);
  }, [topProducts]);

  const lowStockCount = Number(reportData?.lowStockProducts ?? reportData?.lowStockProductsList?.length ?? 0);
  const nearExpiryCount = Number(reportData?.nearExpiryProducts ?? reportData?.expiringProductsList?.length ?? 0);

  // Highest Revenue item for scaling
  const maxRevenue = useMemo(() => {
    if (!topProducts.length) return 0;
    return Math.max(...topProducts.map(p => Number(p.revenue || 0)));
  }, [topProducts]);

  // Filter & Sort Top Selling Products
  const processedProducts = useMemo(() => {
    let result = [...topProducts];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        p =>
          (p.productName && p.productName.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'revenue' || sortField === 'quantitySold' || sortField === 'profit') {
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
  }, [topProducts, searchTerm, sortField, sortDir]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(processedProducts.length / pageSize));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedProducts.slice(start, start + pageSize);
  }, [processedProducts, currentPage, pageSize]);

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
  const exportHeaders = ['Product Name', 'SKU', 'Units Sold', 'Total Revenue ($)', 'Estimated Profit ($)', 'Profit Margin (%)'];
  const exportRows = processedProducts.map(p => {
    const rev = Number(p.revenue || 0);
    const prof = Number(p.profit || 0);
    const margin = rev > 0 ? ((prof / rev) * 100).toFixed(1) + '%' : '0%';
    return [
      p.productName || 'N/A',
      p.sku || 'N/A',
      p.quantitySold || 0,
      rev.toFixed(2),
      prof.toFixed(2),
      margin,
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
            <span className="text-primary font-semibold">Product Performance &amp; Velocity</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Product Performance &amp; Velocity Report
            </h1>
            <Badge variant="success">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Live Catalog
              </span>
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Top-selling medications, revenue velocity, sales margin breakdown, and inventory risk indicators.
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
            filename={`Pharmacy_Product_Performance_${startDate}_to_${endDate}`}
            title="Product Performance & Velocity Report"
            subtitle={`Period: ${startDate} to ${endDate} | Total Revenue: $${totalRevenue.toFixed(2)}`}
            headers={exportHeaders}
            rows={exportRows}
            buttonVariant="primary"
            buttonText="Export CSV"
          />
        </div>
      </div>

      {/* 2. KPI Metrics Grid (Bento Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Top Product Revenue */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Product Sales Revenue
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              ${totalRevenue.toFixed(2)}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Badge variant="success" className="text-[10px] px-1.5 py-0">
                Top Products
              </Badge>
              <span>{topProducts.length} items tracked</span>
            </div>
          </div>
        </div>

        {/* Total Units Sold */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Units Dispensed
            </span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {totalUnitsSold.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span>Total units in period</span>
            </div>
          </div>
        </div>

        {/* Estimated Profit */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Estimated Profit
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              ${totalProfit.toFixed(2)}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}% net margin
              </span>
            </div>
          </div>
        </div>

        {/* Catalog Health & Risk */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Inventory Watchlist
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {lowStockCount + nearExpiryCount}
              </span>
              <span className="text-xs text-slate-400">items need attention</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {lowStockCount > 0 && (
                <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                  {lowStockCount} Low Stock
                </Badge>
              )}
              {nearExpiryCount > 0 && (
                <Badge variant="danger" className="text-[10px] px-1.5 py-0">
                  {nearExpiryCount} Near Expiry
                </Badge>
              )}
              {lowStockCount === 0 && nearExpiryCount === 0 && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Healthy Stock
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter & Tab Controls Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { id: '7days', label: 'Last 7 Days' },
              { id: '30days', label: 'Last 30 Days' },
              { id: 'thisMonth', label: 'This Month' },
              { id: 'custom', label: 'Custom Range' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => handleApplyPreset(p.id as DatePreset)}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-all ${
                  datePreset === p.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date Picker Range Inputs */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="bg-transparent text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="bg-transparent text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={fetchReport}
              className="text-xs rounded-xl px-4 font-semibold"
            >
              Apply Filter
            </Button>
          </div>
        </div>

        {/* Tab & Search Control Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          {/* Main Module Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => {
                setActiveTab('velocity');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'velocity'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              Top Selling Velocity ({topProducts.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('lowStock');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'lowStock'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Low Stock Watchlist ({lowStockCount})
            </button>
            <button
              onClick={() => {
                setActiveTab('expiring');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'expiring'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Expiry Alerts ({nearExpiryCount})
            </button>
          </div>

          {/* Search & View Mode Switcher */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search product name or SKU..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {activeTab === 'velocity' && (
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
      {/* ── TAB 1: TOP SELLING VELOCITY ───────────────────────────────────── */}
      {activeTab === 'velocity' && (
        <>
          {viewMode === 'table' ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th
                        onClick={() => handleSort('productName')}
                        className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          Product Name
                          {sortField === 'productName' && (
                            sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('sku')}
                        className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          SKU Code
                          {sortField === 'sku' && (
                            sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('quantitySold')}
                        className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 select-none"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          Units Dispensed
                          {sortField === 'quantitySold' && (
                            sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('revenue')}
                        className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 select-none"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          Total Revenue ($)
                          {sortField === 'revenue' && (
                            sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('profit')}
                        className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 select-none"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          Profit ($)
                          {sortField === 'profit' && (
                            sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-4 text-right">Revenue Velocity</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {paginatedProducts.length > 0 ? (
                      paginatedProducts.map((p, idx) => {
                        const globalIndex = (currentPage - 1) * pageSize + idx;
                        const rev = Number(p.revenue || 0);
                        const prof = Number(p.profit || 0);
                        const qty = Number(p.quantitySold || 0);
                        const share = totalRevenue > 0 ? (rev / totalRevenue) * 100 : 0;
                        const isLeader = globalIndex === 0 && rev > 0;

                        return (
                          <tr
                            key={p.productId || idx}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                          >
                            <td className="py-3 px-4 text-center font-bold text-slate-400">
                              {globalIndex + 1 <= 3 ? (
                                <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                                  globalIndex === 0
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                    : globalIndex === 1
                                    ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                    : 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                                }`}>
                                  {globalIndex + 1}
                                </span>
                              ) : (
                                globalIndex + 1
                              )}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                              <div className="flex items-center gap-2">
                                <Package className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span className="line-clamp-1">{p.productName}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-500 text-xs">
                              {p.sku || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-slate-800 dark:text-slate-200">
                              {qty.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                              ${rev.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                              ${prof.toFixed(2)}
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
                              {isLeader ? (
                                <Badge variant="success">
                                  <span className="flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    Top Seller
                                  </span>
                                </Badge>
                              ) : prof > rev * 0.4 ? (
                                <Badge variant="info">High Margin</Badge>
                              ) : (
                                <Badge variant="neutral">Normal</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Package className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                            <p className="font-semibold text-sm">No product sales velocity records found</p>
                            <p className="text-xs text-slate-400">
                              Try expanding the date range above.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {/* Table Footer with Summary */}
                  {paginatedProducts.length > 0 && (
                    <tfoot className="bg-slate-50 dark:bg-slate-800/90 border-t-2 border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100">
                      <tr>
                        <td colSpan={3} className="py-3 px-4">
                          Total ({processedProducts.length} products)
                        </td>
                        <td className="py-3 px-4 text-right">{totalUnitsSold.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">
                          ${totalRevenue.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right text-blue-600 dark:text-blue-400">
                          ${totalProfit.toFixed(2)}
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
                      {Math.min(currentPage * pageSize, processedProducts.length)}
                    </span>{' '}
                    of{' '}
                    <span className="font-semibold text-slate-900 dark:text-slate-200">
                      {processedProducts.length}
                    </span>{' '}
                    medications
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
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((p, idx) => {
                  const globalIndex = (currentPage - 1) * pageSize + idx;
                  const rev = Number(p.revenue || 0);
                  const prof = Number(p.profit || 0);
                  const qty = Number(p.quantitySold || 0);
                  const isLeader = globalIndex === 0 && rev > 0;

                  return (
                    <div
                      key={p.productId || idx}
                      className={`bg-white dark:bg-slate-800 rounded-2xl border p-4 space-y-3 transition-all hover:shadow-md ${
                        isLeader
                          ? 'border-amber-400 dark:border-amber-500/60 ring-1 ring-amber-400/20'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                            #{globalIndex + 1}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {p.sku}
                          </span>
                        </div>
                        {isLeader ? (
                          <Badge variant="warning">#1 Seller</Badge>
                        ) : (
                          <Badge variant="neutral">{qty} sold</Badge>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-2">
                          {p.productName}
                        </h4>
                        <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-2">
                          ${rev.toFixed(2)}
                        </div>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Profit: ${prof.toFixed(2)}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Dispensed: {qty} units</span>
                        <span className="text-primary font-semibold">
                          {totalRevenue > 0 ? ((rev / totalRevenue) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  No products found.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── TAB 2: LOW STOCK WATCHLIST ────────────────────────────────────── */}
      {activeTab === 'lowStock' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Low Stock Threshold Watchlist
              </h3>
            </div>
            <Badge variant="warning">{lowStockCount} Products at Risk</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-right">Current Stock</th>
                  <th className="py-3 px-4 text-right">Minimum Stock</th>
                  <th className="py-3 px-4 text-right">Reorder Level</th>
                  <th className="py-3 px-4 text-center">Urgency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {reportData?.lowStockProductsList && reportData.lowStockProductsList.length > 0 ? (
                  reportData.lowStockProductsList.map((item, idx) => {
                    const isOut = Number(item.currentStock || 0) <= 0;
                    return (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                          {item.productName}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{item.sku}</td>
                        <td className="py-3 px-4 text-right font-black text-rose-600 dark:text-rose-400">
                          {item.currentStock}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                          {item.minimumStock}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                          {item.reorderLevel}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isOut ? (
                            <Badge variant="danger">Out of Stock</Badge>
                          ) : (
                            <Badge variant="warning">Reorder Needed</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        <p className="font-semibold text-sm">All products above minimum stock levels</p>
                        <p className="text-xs text-slate-400">No immediate replenishment needed.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: EXPIRING MEDICATION ALERTS ──────────────────────────────── */}
      {activeTab === 'expiring' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-rose-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Near Expiry &amp; Expired Batches
              </h3>
            </div>
            <Badge variant="danger">{nearExpiryCount} Batches</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Medication Name</th>
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4 text-right">Batch Quantity</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4 text-right">Days Left</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {reportData?.expiringProductsList && reportData.expiringProductsList.length > 0 ? (
                  reportData.expiringProductsList.map((item, idx) => {
                    const days = Number(item.daysUntilExpiry || 0);
                    const isExpired = days <= 0;
                    return (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                          {item.productName}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{item.batchNumber}</td>
                        <td className="py-3 px-4 text-right font-semibold">{item.quantity}</td>
                        <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                          {item.expiryDate}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-rose-600 dark:text-rose-400">
                          {isExpired ? 'Expired' : `${days} days`}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isExpired ? (
                            <Badge variant="danger">Expired</Badge>
                          ) : days <= 30 ? (
                            <Badge variant="warning">&lt; 30 Days</Badge>
                          ) : (
                            <Badge variant="info">&lt; 90 Days</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        <p className="font-semibold text-sm">No batches expiring soon</p>
                        <p className="text-xs text-slate-400">All current stock within safe shelf-life.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}