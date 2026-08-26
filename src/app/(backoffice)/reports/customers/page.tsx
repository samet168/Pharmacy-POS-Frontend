'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { reportsApi, CustomerReportResponse, TopCustomer } from '@/lib/api/reports';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { exportToCSV } from '@/lib/utils/exportUtils';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { toast } from 'sonner';
import {
  Users,
  UserPlus,
  UserCheck,
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
  Clock,
  Phone,
  Crown,
  HeartHandshake,
  TrendingUp,
  BarChart3,
  Award,
  PieChart,
} from 'lucide-react';

type ViewMode = 'table' | 'grid' | 'periods';
type DatePreset = '7days' | '30days' | 'thisMonth' | 'custom';
type SortField = 'totalSpending' | 'orderCount' | 'averageOrderValue' | 'customerName' | 'phone';
type SortDir = 'asc' | 'desc';

export default function CustomerReportPage() {
  const { user, currentUser } = useAuthStore();

  // Date Range State
  const [datePreset, setDatePreset] = useState<DatePreset>('30days');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Data & Loading
  const [reportData, setReportData] = useState<CustomerReportResponse | null>(null);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  // Search, Sorting & View
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortField, setSortField] = useState<SortField>('totalSpending');
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
      const res = await reportsApi.getCustomerReport({
        organizationId: orgId,
        from: startDate,
        to: endDate,
      });

      if (res) {
        setReportData(res);
        setTopCustomers(res.topCustomers || []);
      } else {
        setReportData(null);
        setTopCustomers([]);
      }
    } catch (error) {
      console.error('Failed to load customer report', error);
      toast.error('Failed to load customer report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [currentUser?.organizationId, user?.organizationId, startDate, endDate]);

  // Derived KPI Metrics
  const totalCustomers = Number(reportData?.totalCustomers ?? 0);
  const newCustomers = Number(reportData?.newCustomers ?? 0);
  const returningCustomers = Number(reportData?.returningCustomers ?? 0);
  const totalSpending = Number(reportData?.totalSpending ?? 0);
  const avgSpending = Number(reportData?.averageSpending ?? (totalCustomers > 0 ? totalSpending / totalCustomers : 0));
  const retentionRate = totalCustomers > 0 ? ((returningCustomers / totalCustomers) * 100).toFixed(1) : '0';

  // Filter & Sort Top Customers
  const processedCustomers = useMemo(() => {
    let result = [...topCustomers];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        c =>
          (c.customerName && c.customerName.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q))
      );
    }

    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'totalSpending' || sortField === 'orderCount' || sortField === 'averageOrderValue') {
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
  }, [topCustomers, searchTerm, sortField, sortDir]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(processedCustomers.length / pageSize));
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedCustomers.slice(start, start + pageSize);
  }, [processedCustomers, currentPage, pageSize]);

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
  const exportHeaders = ['Patient Name', 'Phone Number', 'Orders Count', 'Total Spend ($)', 'Average Basket Size ($)', 'Loyalty Tier'];
  const exportRows = processedCustomers.map((c, idx) => {
    const spend = Number(c.totalSpending || 0);
    const tier = idx === 0 || spend > 500 ? 'VIP Diamond' : spend > 200 ? 'VIP Gold' : 'Regular';
    return [
      c.customerName || 'Walk-in Patient',
      c.phone || 'N/A',
      c.orderCount || 0,
      spend.toFixed(2),
      Number(c.averageOrderValue || 0).toFixed(2),
      tier,
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
            <span className="text-primary font-semibold">Customer Demographics &amp; Lifetime Value</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Customer Demographics &amp; Lifetime Value Report
            </h1>
            <Badge variant="success">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Patient Analytics
              </span>
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Patient purchasing frequency, lifetime spend metrics, loyalty tiers, and retention analysis.
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
            filename={`Pharmacy_Customer_Analytics_${startDate}_to_${endDate}`}
            title="Customer Demographics & Lifetime Value Report"
            subtitle={`Period: ${startDate} to ${endDate} | Total Spend: $${totalSpending.toFixed(2)}`}
            headers={exportHeaders}
            rows={exportRows}
            buttonVariant="primary"
            buttonText="Export CSV"
          />
        </div>
      </div>

      {/* 2. KPI Metrics Grid (Bento Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Patients
            </span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {totalCustomers.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Badge variant="info" className="text-[10px] px-1.5 py-0">
                +{newCustomers} New
              </Badge>
              <span>registered in period</span>
            </div>
          </div>
        </div>

        {/* Repeat Buyers & Retention */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Repeat Patients
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {returningCustomers.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {retentionRate}% retention
              </span>
              <span>repeat buyers</span>
            </div>
          </div>
        </div>

        {/* Cumulative Spending */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cumulative Spend
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              ${totalSpending.toFixed(2)}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Badge variant="success" className="text-[10px] px-1.5 py-0">
                Revenue
              </Badge>
              <span>Across all patient orders</span>
            </div>
          </div>
        </div>

        {/* Average Spend / LTV */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Avg. Patient Value
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              ${avgSpending.toFixed(2)}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span>Average spend per patient</span>
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
              placeholder="Search by patient name or phone number..."
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
              Patient Cards
            </button>
            <button
              onClick={() => setViewMode('periods')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                viewMode === 'periods'
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <PieChart className="h-3.5 w-3.5" />
              Spending Cohorts
            </button>
          </div>
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA BASED ON VIEW MODE */}
      {/* ── VIEW 1: TABLE VIEW ────────────────────────────────────────────── */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th
                    onClick={() => handleSort('customerName')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      Patient Name
                      {sortField === 'customerName' && (
                        sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('phone')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      Phone Number
                      {sortField === 'phone' && (
                        sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('orderCount')}
                    className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 select-none"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Orders Count
                      {sortField === 'orderCount' && (
                        sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('totalSpending')}
                    className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 select-none"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Total Spend ($)
                      {sortField === 'totalSpending' && (
                        sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('averageOrderValue')}
                    className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 select-none"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Avg / Order ($)
                      {sortField === 'averageOrderValue' && (
                        sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Spend Share</th>
                  <th className="py-3 px-4 text-center">Loyalty Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {paginatedCustomers.length > 0 ? (
                  paginatedCustomers.map((c, idx) => {
                    const globalIndex = (currentPage - 1) * pageSize + idx;
                    const spend = Number(c.totalSpending || 0);
                    const orders = Number(c.orderCount || 0);
                    const avg = Number(c.averageOrderValue || (orders > 0 ? spend / orders : 0));
                    const share = totalSpending > 0 ? (spend / totalSpending) * 100 : 0;
                    const isTop = globalIndex === 0 && spend > 0;

                    return (
                      <tr
                        key={c.customerId || idx}
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
                            <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                              {(c.customerName || 'P').charAt(0).toUpperCase()}
                            </div>
                            <span className="line-clamp-1">{c.customerName || 'Walk-in Patient'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 text-xs">
                          {c.phone || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                          {orders.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                          ${spend.toFixed(2)}
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
                          {isTop || spend > 500 ? (
                            <Badge variant="success">
                              <span className="flex items-center gap-1">
                                <Crown className="h-3 w-3" />
                                VIP Diamond
                              </span>
                            </Badge>
                          ) : spend > 200 ? (
                            <Badge variant="info">VIP Gold</Badge>
                          ) : (
                            <Badge variant="neutral">Regular</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold text-sm">No patient purchase records found</p>
                        <p className="text-xs text-slate-400">
                          Try adjusting the date range above.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
              {/* Table Footer with Summary */}
              {paginatedCustomers.length > 0 && (
                <tfoot className="bg-slate-50 dark:bg-slate-800/90 border-t-2 border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100">
                  <tr>
                    <td colSpan={3} className="py-3 px-4">
                      Total ({processedCustomers.length} patients)
                    </td>
                    <td className="py-3 px-4 text-right">
                      {processedCustomers.reduce((sum, c) => sum + Number(c.orderCount || 0), 0)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">
                      ${totalSpending.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">${avgSpending.toFixed(2)}</td>
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
                  {Math.min(currentPage * pageSize, processedCustomers.length)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {processedCustomers.length}
                </span>{' '}
                patients
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

      {/* ── VIEW 2: BENTO GRID VIEW ───────────────────────────────────────── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedCustomers.length > 0 ? (
            paginatedCustomers.map((c, idx) => {
              const globalIndex = (currentPage - 1) * pageSize + idx;
              const spend = Number(c.totalSpending || 0);
              const orders = Number(c.orderCount || 0);
              const avg = Number(c.averageOrderValue || (orders > 0 ? spend / orders : 0));
              const isTop = globalIndex === 0 && spend > 0;

              return (
                <div
                  key={c.customerId || idx}
                  className={`bg-white dark:bg-slate-800 rounded-2xl border p-4 space-y-3 transition-all hover:shadow-md ${
                    isTop
                      ? 'border-amber-400 dark:border-amber-500/60 ring-1 ring-amber-400/20'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                        {(c.customerName || 'P').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                          {c.customerName || 'Walk-in Patient'}
                        </h4>
                        <span className="font-mono text-[10px] text-slate-400">
                          {c.phone || 'No phone'}
                        </span>
                      </div>
                    </div>
                    {isTop ? (
                      <Badge variant="warning">#1 VIP</Badge>
                    ) : (
                      <Badge variant="neutral">{orders} orders</Badge>
                    )}
                  </div>

                  <div>
                    <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                      ${spend.toFixed(2)}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Avg ${avg.toFixed(2)} / basket
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{orders} total orders</span>
                    <span className="text-primary font-semibold">
                      {totalSpending > 0 ? ((spend / totalSpending) * 100).toFixed(1) : 0}% share
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              No patient records found.
            </div>
          )}
        </div>
      )}

      {/* ── VIEW 3: COHORT / PERIOD SPENDING BREAKDOWN ─────────────────────── */}
      {viewMode === 'periods' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Patient Spending by Period Cohort
              </h3>
            </div>
            <Badge variant="info">
              {reportData?.spendingByPeriod?.length || 0} Cohorts
            </Badge>
          </div>

          <div className="space-y-3">
            {reportData?.spendingByPeriod && reportData.spendingByPeriod.length > 0 ? (
              reportData.spendingByPeriod.map((p, idx) => {
                const amt = Number(p.totalSpending || 0);
                const count = Number(p.customerCount || 0);
                const pct = totalSpending > 0 ? (amt / totalSpending) * 100 : 0;

                return (
                  <div key={idx} className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {p.period}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 dark:text-slate-400">
                          {count} Patients
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          ${amt.toFixed(2)} ({pct.toFixed(1)}%)
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
                No periodic spending cohort data recorded for this range.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}