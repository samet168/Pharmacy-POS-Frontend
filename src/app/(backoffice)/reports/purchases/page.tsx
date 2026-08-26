'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { reportsApi, PurchaseReportResponse, SupplierPurchase, PurchaseByStatus } from '@/lib/api/reports';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { exportToCSV } from '@/lib/utils/exportUtils';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { toast } from 'sonner';
import {
  ShoppingCart,
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
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  Boxes,
  PieChart,
  Package,
  TrendingUp,
} from 'lucide-react';

type ViewMode = 'table' | 'grid' | 'status';
type DatePreset = '7days' | '30days' | 'thisMonth' | 'custom';
type SortField = 'totalValue' | 'orderCount' | 'supplierName';
type SortDir = 'asc' | 'desc';

export default function PurchaseReportPage() {
  const { user, currentUser } = useAuthStore();

  // Date Range State
  const [datePreset, setDatePreset] = useState<DatePreset>('30days');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Data & Loading
  const [reportData, setReportData] = useState<PurchaseReportResponse | null>(null);
  const [supplierPurchases, setSupplierPurchases] = useState<SupplierPurchase[]>([]);
  const [purchasesByStatus, setPurchasesByStatus] = useState<PurchaseByStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // Search, Sorting & View
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortField, setSortField] = useState<SortField>('totalValue');
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
      const res = await reportsApi.getPurchaseReport({
        organizationId: orgId,
        from: startDate,
        to: endDate,
      });

      if (res) {
        setReportData(res);
        setSupplierPurchases(res.supplierPurchases || []);
        setPurchasesByStatus(res.purchasesByStatus || []);
      } else {
        setReportData(null);
        setSupplierPurchases([]);
        setPurchasesByStatus([]);
      }
    } catch (error) {
      console.error('Failed to load purchase report', error);
      toast.error('Failed to load purchase report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [currentUser?.organizationId, user?.organizationId, startDate, endDate]);

  // Derived KPI Metrics
  const totalOrders = Number(reportData?.totalPurchaseOrders ?? 0);
  const totalValue = Number(reportData?.totalPurchaseValue ?? 0);
  const receivedVal = Number(reportData?.receivedValue ?? 0);
  const outstandingVal = Number(reportData?.outstandingValue ?? (totalValue - receivedVal));
  const pendingOrders = Number(reportData?.pendingOrders ?? 0);
  const completedOrders = Number(reportData?.completedOrders ?? 0);
  const cancelledOrders = Number(reportData?.cancelledOrders ?? 0);
  const completionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : '0';

  // Filter & Sort Supplier Purchases
  const processedSuppliers = useMemo(() => {
    let result = [...supplierPurchases];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(s =>
        s.supplierName && s.supplierName.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'totalValue' || sortField === 'orderCount') {
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
  }, [supplierPurchases, searchTerm, sortField, sortDir]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(processedSuppliers.length / pageSize));
  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedSuppliers.slice(start, start + pageSize);
  }, [processedSuppliers, currentPage, pageSize]);

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
  const exportHeaders = ['Supplier Name', 'Purchase Orders Count', 'Total Procurement Spend ($)', 'Share of Procurement (%)'];
  const exportRows = processedSuppliers.map(s => {
    const val = Number(s.totalValue || 0);
    const share = totalValue > 0 ? ((val / totalValue) * 100).toFixed(1) + '%' : '0%';
    return [
      s.supplierName || 'N/A',
      s.orderCount || 0,
      val.toFixed(2),
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
            <span className="text-primary font-semibold">Procurement &amp; Purchases</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Procurement &amp; Purchase Orders Report
            </h1>
            <Badge variant="success">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Live Supply Chain
              </span>
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Supplier procurement history, purchase order fulfillment, goods received values, and pending shipments.
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
            filename={`Pharmacy_Procurement_Report_${startDate}_to_${endDate}`}
            title="Procurement & Purchase Orders Report"
            subtitle={`Period: ${startDate} to ${endDate} | Total Spend: $${totalValue.toFixed(2)}`}
            headers={exportHeaders}
            rows={exportRows}
            buttonVariant="primary"
            buttonText="Export CSV"
          />
        </div>
      </div>

      {/* 2. KPI Metrics Grid (Bento Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spend */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Procurement Spend
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              ${totalValue.toFixed(2)}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Badge variant="success" className="text-[10px] px-1.5 py-0">
                Total POs
              </Badge>
              <span>Across {totalOrders} orders</span>
            </div>
          </div>
        </div>

        {/* Goods Received Value */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Fulfillment Status
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Truck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {completedOrders.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {completionRate}% completed
              </span>
              <span>fulfilled orders</span>
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending Orders
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {pendingOrders}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              {pendingOrders > 0 ? (
                <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                  Awaiting Delivery
                </Badge>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="h-3 w-3" /> All Fulfilled
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Cancelled / Voided POs */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Cancelled POs
            </span>
            <div className="h-9 w-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {cancelledOrders}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              {cancelledOrders > 0 ? (
                <span className="text-rose-500 font-medium">Voided or rejected</span>
              ) : (
                <span className="text-slate-400">Zero cancellations</span>
              )}
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
              placeholder="Search by supplier name..."
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
              Supplier Table
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
              Supplier Cards
            </button>
            <button
              onClick={() => setViewMode('status')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                viewMode === 'status'
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <PieChart className="h-3.5 w-3.5" />
              PO Status Breakdown
            </button>
          </div>
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA BASED ON VIEW MODE */}
      {/* ── VIEW 1: SUPPLIER TABLE VIEW ──────────────────────────────────── */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th
                    onClick={() => handleSort('supplierName')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      Supplier / Vendor
                      {sortField === 'supplierName' && (
                        sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('orderCount')}
                    className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 select-none"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Purchase Orders
                      {sortField === 'orderCount' && (
                        sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('totalValue')}
                    className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 select-none"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Total PO Spend ($)
                      {sortField === 'totalValue' && (
                        sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Procurement Share</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {paginatedSuppliers.length > 0 ? (
                  paginatedSuppliers.map((s, idx) => {
                    const globalIndex = (currentPage - 1) * pageSize + idx;
                    const val = Number(s.totalValue || 0);
                    const orders = Number(s.orderCount || 0);
                    const share = totalValue > 0 ? (val / totalValue) * 100 : 0;
                    const isTop = globalIndex === 0 && val > 0;

                    return (
                      <tr
                        key={s.supplierId || idx}
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
                            <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="line-clamp-1">{s.supplierName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                          {orders.toLocaleString()} POs
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
                          {isTop ? (
                            <Badge variant="success">
                              <span className="flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                Primary Vendor
                              </span>
                            </Badge>
                          ) : (
                            <Badge variant="neutral">Active Supplier</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Building2 className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold text-sm">No supplier procurement records found</p>
                        <p className="text-xs text-slate-400">
                          Try adjusting the date range above.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
              {/* Table Footer with Summary */}
              {paginatedSuppliers.length > 0 && (
                <tfoot className="bg-slate-50 dark:bg-slate-800/90 border-t-2 border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100">
                  <tr>
                    <td colSpan={2} className="py-3 px-4">
                      Total ({processedSuppliers.length} suppliers)
                    </td>
                    <td className="py-3 px-4 text-right">{totalOrders.toLocaleString()} POs</td>
                    <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">
                      ${totalValue.toFixed(2)}
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
                  {Math.min(currentPage * pageSize, processedSuppliers.length)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {processedSuppliers.length}
                </span>{' '}
                vendors
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
          {paginatedSuppliers.length > 0 ? (
            paginatedSuppliers.map((s, idx) => {
              const globalIndex = (currentPage - 1) * pageSize + idx;
              const val = Number(s.totalValue || 0);
              const orders = Number(s.orderCount || 0);
              const isTop = globalIndex === 0 && val > 0;

              return (
                <div
                  key={s.supplierId || idx}
                  className={`bg-white dark:bg-slate-800 rounded-2xl border p-4 space-y-3 transition-all hover:shadow-md ${
                    isTop
                      ? 'border-emerald-400 dark:border-emerald-500/60 ring-1 ring-emerald-400/20'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="h-6 w-6 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                      #{globalIndex + 1}
                    </span>
                    {isTop ? (
                      <Badge variant="success">Primary</Badge>
                    ) : (
                      <Badge variant="neutral">{orders} POs</Badge>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                      {s.supplierName}
                    </h4>
                    <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-2">
                      ${val.toFixed(2)}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{orders} purchase orders</span>
                    <span className="text-primary font-semibold">
                      {totalValue > 0 ? ((val / totalValue) * 100).toFixed(1) : 0}% share
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              No suppliers found.
            </div>
          )}
        </div>
      )}

      {/* ── VIEW 3: PURCHASE ORDER STATUS BREAKDOWN ────────────────────────── */}
      {viewMode === 'status' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Purchase Order Status Distribution
              </h3>
            </div>
            <Badge variant="neutral">
              {purchasesByStatus.length || 0} Statuses
            </Badge>
          </div>

          <div className="space-y-3">
            {purchasesByStatus && purchasesByStatus.length > 0 ? (
              purchasesByStatus.map((st, idx) => {
                const count = Number(st.count || 0);
                const val = Number(st.value || 0);
                const pct = totalOrders > 0 ? (count / totalOrders) * 100 : 0;

                return (
                  <div key={idx} className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-slate-100 uppercase">
                        {st.status || 'UNKNOWN'}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 dark:text-slate-400">
                          {count} POs ({pct.toFixed(1)}%)
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          ${val.toFixed(2)}
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
                No status breakdown data recorded for this period.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}