'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Download, ShoppingCart, DollarSign, Search, Truck, CheckCircle2, Clock, XCircle, RefreshCw } from 'lucide-react';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { exportToCSV } from '@/lib/utils/exportUtils';
import { toast } from 'sonner';
import { reportsApi } from '@/lib/api/reports';
import { useAuthStore } from '@/lib/stores/authStore';

export default function PurchaseReportPage() {
  const { user, currentUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchReport = async () => {
    const orgId = currentUser?.organizationId || user?.organizationId;
    if (!orgId) return;

    setLoading(true);
    try {
      const res = await reportsApi.getPurchaseReport({
        organizationId: orgId,
        from: startDate,
        to: endDate,
      });
      setReportData(res);
    } catch (error) {
      console.error('Failed to load purchase report', error);
      toast.error('Failed to load purchase report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [currentUser?.organizationId, user?.organizationId]);

  const totalPurchaseOrders = reportData?.totalPurchaseOrders || 0;
  const totalPurchaseValue = reportData?.totalPurchaseValue || 0;
  const pendingOrders = reportData?.pendingOrders || 0;
  const completedOrders = reportData?.completedOrders || 0;
  const cancelledOrders = reportData?.cancelledOrders || 0;
  const supplierPurchases = reportData?.supplierPurchases || [];
  const purchasesByStatus = reportData?.purchasesByStatus || [];

  const handleExportCSV = () => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Purchase Orders', totalPurchaseOrders],
      ['Total Purchase Value ($)', Number(totalPurchaseValue).toFixed(2)],
      ['Pending Orders', pendingOrders],
      ['Completed Orders', completedOrders],
      ['Cancelled Orders', cancelledOrders],
    ];
    exportToCSV('Pharmacy_Procurement_Purchase_Report', headers, rows);
    toast.success('Purchase report exported to CSV successfully!');
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
        <LoadingSkeleton variant="text" width={240} height={36} />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <LoadingSkeleton key={i} variant="rectangular" width="100%" height={80} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            Procurement &amp; Purchase Orders Report
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            Supplier purchase order history, procurement expenses, goods received, and pending shipments.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchReport} className="flex items-center gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={handleExportCSV} className="flex items-center gap-1.5 text-xs font-bold shadow-md">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Date Filter */}
      <Card className="p-5 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Start Date</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">End Date</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <Button variant="outline" onClick={fetchReport} className="w-full sm:w-auto font-bold">
            Apply Filter
          </Button>
        </div>
      </Card>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-bento-primary/10 text-bento-primary rounded-2xl">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total POs</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalPurchaseOrders}</h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Value</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              ${Number(totalPurchaseValue).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Pending Orders</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{pendingOrders}</h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Completed</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{completedOrders}</h3>
          </div>
        </Card>
      </div>

      {/* Summary Table */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Purchase Summary by Status</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow className="bg-slate-50/80 dark:bg-slate-800/60">
                <TableHeader>Status</TableHeader>
                <TableHeader>Order Count</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span className="font-bold text-amber-700 dark:text-amber-400">Pending (ORDERED)</span>
                  </span>
                </TableCell>
                <TableCell className="font-bold text-slate-900 dark:text-slate-100">{pendingOrders} orders</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">Completed (RECEIVED)</span>
                  </span>
                </TableCell>
                <TableCell className="font-bold text-slate-900 dark:text-slate-100">{completedOrders} orders</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-rose-500" />
                    <span className="font-bold text-rose-700 dark:text-rose-400">Cancelled</span>
                  </span>
                </TableCell>
                <TableCell className="font-bold text-slate-900 dark:text-slate-100">{cancelledOrders} orders</TableCell>
              </TableRow>
              {supplierPurchases.length > 0 && supplierPurchases.map((row: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-bento-primary" />
                      <span className="font-bold text-slate-900 dark:text-slate-100">{row.supplierName}</span>
                    </span>
                  </TableCell>
                  <TableCell className="font-bold">{row.orderCount} orders · ${Number(row.totalValue || 0).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
