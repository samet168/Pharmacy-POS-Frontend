'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { reportsApi, SalesReportResponse } from '@/lib/api/reports';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { exportToCSV } from '@/lib/utils/exportUtils';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { toast } from 'sonner';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  CreditCard,
  RefreshCw,
  Printer,
  Calendar,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  List,
  LayoutGrid,
  ChevronRight,
  Package,
  Sparkles,
  Percent,
  Receipt,
  Users,
  Building2,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  Clock,
  CheckCircle2,
} from 'lucide-react';

type ViewMode = 'table' | 'grid' | 'breakdown';
type DatePreset = 'today' | '7days' | '30days' | 'thisMonth' | 'custom';
type SortField = 'date' | 'orders' | 'revenue' | 'customers' | 'avgOrder';
type SortDir = 'asc' | 'desc';

export default function SalesReportPage() {
  const { user, currentUser } = useAuthStore();

  // Date Range State
  const [datePreset, setDatePreset] = useState<DatePreset>('7days');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Data & Loading
  const [reportData, setReportData] = useState<SalesReportResponse | null>(null);
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search, Sorting & View
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortField, setSortField] = useState<SortField>('date');
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

    if (preset === 'today') {
      start = now;
    } else if (preset === '7days') {
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
      const res = await reportsApi.getSalesReport({
        organizationId: orgId,
        from: startDate,
        to: endDate,
      });

      if (res) {
        setReportData(res);
        setDailySales(res.dailySales || []);
      } else {
        setReportData(null);
        setDailySales([]);
      }
    } catch (error) {
      console.error('Failed to load sales report', error);
      toast.error('Failed to load sales report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [currentUser?.organizationId, user?.organizationId, startDate, endDate]);

  // Derived Metrics
  const totalRevenue = Number(reportData?.totalRevenue ?? reportData?.totalSales ?? 0);
  const totalOrders = Number(reportData?.totalOrders ?? 0);
  const avgOrderVal = Number(reportData?.averageOrderValue ?? (totalOrders > 0 ? totalRevenue / totalOrders : 0));
  const totalDiscount = Number(reportData?.totalDiscount ?? 0);
  const totalTax = Number(reportData?.totalTax ?? 0);
  const netSales = Number(reportData?.netSales ?? totalRevenue - totalDiscount);
  const refundedOrders = Number(reportData?.refundedOrders ?? 0);

  // Peak Day calculation
  const maxDayRevenue = useMemo(() => {
    if (!dailySales.length) return 0;
    return Math.max(...dailySales.map((d: any) => Number(d.revenue || 0)));
  }, [dailySales]);

  // Filter and Sort Daily Sales
  const processedDailySales = useMemo(() => {
    let result = [...dailySales];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (item: any) =>
          (item.date && item.date.toLowerCase().includes(q)) ||
          (item.revenue && item.revenue.toString().includes(q)) ||
          (item.orders && item.orders.toString().includes(q))
      );
    }

    result.sort((a: any, b: any) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'avgOrder') {
        valA = a.orders > 0 ? Number(a.revenue || 0) / Number(a.orders) : 0;
        valB = b.orders > 0 ? Number(b.revenue || 0) / Number(b.orders) : 0;
      } else if (sortField === 'revenue' || sortField === 'orders' || sortField === 'customers') {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [dailySales, searchTerm, sortField, sortDir]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(processedDailySales.length / pageSize));
  const paginatedDailySales = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedDailySales.slice(start, start + pageSize);
  }, [processedDailySales, currentPage, pageSize]);

  // Toggle Sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // CSV Export Data
  const exportHeaders = ['Date', 'Orders Count', 'Gross Revenue ($)', 'Customers', 'Average Order ($)', 'Share of Period (%)'];
  const exportRows = processedDailySales.map((d: any) => {
    const rev = Number(d.revenue || 0);
    const ord = Number(d.orders || 0);
    const avg = ord > 0 ? rev / ord : 0;
    const share = totalRevenue > 0 ? ((rev / totalRevenue) * 100).toFixed(1) + '%' : '0%';
    return [
      d.date || 'N/A',
      ord,
      rev.toFixed(2),
      d.customers || 0,
      avg.toFixed(2),
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
            <span className="text-primary font-semibold">Sales Performance</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Sales Performance Report
            </h1>
            <Badge variant="success">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Live Data
              </span>
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Comprehensive revenue analytics, order volume trends, and sales channel performance.
          </p>
        </div>

        {/* Global Action Toolbar */}
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
            filename={`Pharmacy_Sales_Performance_${startDate}_to_${endDate}`}
            title="Sales Performance Report"
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
        {/* Total Sales Revenue */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Revenue
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
                Gross Sales
              </Badge>
              <span>Across {totalOrders} orders</span>
            </div>
          </div>
        </div>

        {/* Net Sales */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Net Sales
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              ${netSales.toFixed(2)}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              {totalDiscount > 0 ? (
                <span className="text-rose-500">-${totalDiscount.toFixed(2)} discounts</span>
              ) : (
                <span className="text-slate-400">No discounts applied</span>
              )}
            </div>
          </div>
        </div>

        {/* Total Orders Completed */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Orders
            </span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {totalOrders.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              {refundedOrders > 0 ? (
                <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                  {refundedOrders} Refunded
                </Badge>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="h-3 w-3" /> 100% Completed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Avg. Order Value
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              ${avgOrderVal.toFixed(2)}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span>Avg revenue per basket</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter & Date Preset Control Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { id: 'today', label: 'Today' },
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

        {/* Search Bar & View Mode Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by date (YYYY-MM-DD) or amounts..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* View Mode Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/80 p-1 rounded-xl w-full sm:w-auto justify-end">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Table View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Bento Cards
            </button>
            <button
              onClick={() => setViewMode('breakdown')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                viewMode === 'breakdown'
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <PieChart className="h-3.5 w-3.5" />
              Channels &amp; Products
            </button>
          </div>
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA BASED ON VIEW MODE */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th
                    onClick={() => handleSort('date')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      Date
                      {sortField === 'date' && (
                        sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('orders')}
                    className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 select-none"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Orders Count
                      {sortField === 'orders' && (
                        sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('customers')}
                    className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 select-none"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Customers
                      {sortField === 'customers' && (
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
                    onClick={() => handleSort('avgOrder')}
                    className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 select-none"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Avg / Order ($)
                      {sortField === 'avgOrder' && (
                        sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Share of Period</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {paginatedDailySales.length > 0 ? (
                  paginatedDailySales.map((day: any, idx: number) => {
                    const rev = Number(day.revenue || 0);
                    const ord = Number(day.orders || 0);
                    const avg = ord > 0 ? rev / ord : 0;
                    const share = totalRevenue > 0 ? ((rev / totalRevenue) * 100) : 0;
                    const isPeak = maxDayRevenue > 0 && rev === maxDayRevenue;

                    return (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {day.date}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                          {ord.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                          {day.customers ?? ord}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                          ${rev.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                          ${avg.toFixed(2)}
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
                          {isPeak ? (
                            <Badge variant="success">
                              <span className="flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                Peak Day
                              </span>
                            </Badge>
                          ) : rev > avgOrderVal * 2 ? (
                            <Badge variant="info">High Volume</Badge>
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
                        <ShoppingBag className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold text-sm">No sales performance data found</p>
                        <p className="text-xs text-slate-400">
                          Try selecting a different date range above.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
              {/* Table Footer with Summary */}
              {paginatedDailySales.length > 0 && (
                <tfoot className="bg-slate-50 dark:bg-slate-800/90 border-t-2 border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100">
                  <tr>
                    <td className="py-3 px-4">Period Total ({processedDailySales.length} days)</td>
                    <td className="py-3 px-4 text-right">{totalOrders.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      {processedDailySales.reduce((sum, d) => sum + Number(d.customers || d.orders || 0), 0)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">
                      ${totalRevenue.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">${avgOrderVal.toFixed(2)}</td>
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
                  {Math.min(currentPage * pageSize, processedDailySales.length)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {processedDailySales.length}
                </span>{' '}
                days
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
      )}

      {/* Bento Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedDailySales.length > 0 ? (
            paginatedDailySales.map((day: any, idx: number) => {
              const rev = Number(day.revenue || 0);
              const ord = Number(day.orders || 0);
              const avg = ord > 0 ? rev / ord : 0;
              const isPeak = maxDayRevenue > 0 && rev === maxDayRevenue;

              return (
                <div
                  key={idx}
                  className={`bg-white dark:bg-slate-800 rounded-2xl border p-4 space-y-3 transition-all hover:shadow-md ${
                    isPeak
                      ? 'border-emerald-400 dark:border-emerald-500/60 ring-1 ring-emerald-400/20'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      {day.date}
                    </div>
                    {isPeak ? (
                      <Badge variant="success">Peak</Badge>
                    ) : (
                      <Badge variant="neutral">{ord} orders</Badge>
                    )}
                  </div>

                  <div>
                    <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                      ${rev.toFixed(2)}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Avg ${avg.toFixed(2)} / order
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {day.customers ?? ord} customers
                    </span>
                    <span className="text-[11px] font-semibold text-primary">
                      {totalRevenue > 0 ? ((rev / totalRevenue) * 100).toFixed(1) : 0}% share
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              No daily sales records found for this period.
            </div>
          )}
        </div>
      )}

      {/* Breakdown View (Payment Methods, Branches & Top Products) */}
      {viewMode === 'breakdown' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Methods Breakdown */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Payment Methods Distribution
              </h3>
              <Badge variant="neutral">
                {reportData?.paymentMethodBreakdown?.length || 0} Methods
              </Badge>
            </div>

            <div className="space-y-3">
              {reportData?.paymentMethodBreakdown && reportData.paymentMethodBreakdown.length > 0 ? (
                reportData.paymentMethodBreakdown.map((pm: any, idx: number) => {
                  const amt = Number(pm.amount || 0);
                  const pct = Number(pm.percentage || (totalRevenue > 0 ? (amt / totalRevenue) * 100 : 0));
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                          {pm.paymentMethod || 'Other'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400">
                            {pm.count || 0} txns
                          </span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            ${amt.toFixed(2)} ({pct.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No payment breakdown data available for this range.
                </div>
              )}
            </div>
          </div>

          {/* Top Selling Products in this Period */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Package className="h-4 w-4 text-emerald-500" />
                Top Performing Products
              </h3>
              <Badge variant="success">Leaderboard</Badge>
            </div>

            <div className="space-y-2.5">
              {reportData?.topProducts && reportData.topProducts.length > 0 ? (
                reportData.topProducts.slice(0, 5).map((prod: any, idx: number) => {
                  const rev = Number(prod.revenue || 0);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                            {prod.productName || `Product #${prod.productId}`}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {prod.quantitySold || 0} units sold
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          ${rev.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No top product data recorded in this period.
                </div>
              )}
            </div>
          </div>

          {/* Branch Performance Comparison (if multi-branch) */}
          {reportData?.branchSales && reportData.branchSales.length > 0 && (
            <div className="col-span-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-500" />
                  Branch Revenue Comparison
                </h3>
                <Badge variant="info">Multi-Branch</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {reportData.branchSales.map((branch: any, idx: number) => {
                  const bRev = Number(branch.revenue || 0);
                  const bOrders = Number(branch.orders || 0);
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {branch.branchName || `Branch #${branch.branchId}`}
                        </span>
                        <Badge variant="neutral">{bOrders} Orders</Badge>
                      </div>
                      <div className="text-lg font-black text-slate-900 dark:text-slate-100">
                        ${bRev.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}