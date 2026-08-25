'use client';

import { FullPageSkeleton } from '@/components/ui/PageSkeleton';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Download, ShoppingCart, DollarSign, Search, Truck, CheckCircle2, Clock, XCircle, RefreshCw } from 'lucide-react';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { toast } from 'sonner';
import { reportsApi } from '@/lib/api/reports';
import { useAuthStore } from '@/lib/stores/authStore';
import { exportToCSV } from '@/lib/utils/exportUtils';

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


  if (loading) return <FullPageSkeleton kpiCount={4} tableRows={6} tableCols={5} />;
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
          <ExportDropdown
            filename="Pharmacy_Procurement_Purchase_Report"
            title="Procurement & Purchase Orders Report"
            subtitle={`Period: ${startDate} to ${endDate}`}
            headers={['Metric / Order Status', 'Count / Total Value']}
            rows={[
              ['Total Purchase Orders', totalPurchaseOrders],
              ['Total Purchase Spend ($)', Number(totalPurchaseValue).toFixed(2)],
              ['Pending Orders', pendingOrders],
              ['Completed Orders', completedOrders],
              ['Cancelled Orders', cancelledOrders],
            ]}
            buttonVariant="outline"
            buttonSize="sm"
            buttonText="Export CSV"
          />
        </div>
      </div>

      {/* Date Range Picker Bar */}
      <Card className="p-6 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Input
            type="date"
            label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            type="date"
            label="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <Button variant="primary" onClick={fetchReport} className="w-full sm:w-auto font-bold px-6">
          Apply Filter
        </Button>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total POs</span>
            <ShoppingCart className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalPurchaseOrders}</span>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Spend</span>
            <DollarSign className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">${Number(totalPurchaseValue).toFixed(2)}</span>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Orders</span>
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{pendingOrders}</span>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Orders</span>
            <CheckCircle2 className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{completedOrders}</span>
          </div>
        </Card>
      </div>

      {/* Supplier Purchases Table */}
      <Card className="p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Supplier Procurement Breakdown</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Supplier Name</TableHeader>
                <TableHeader className="text-right">Orders Count</TableHeader>
                <TableHeader className="text-right">Total Amount ($)</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {supplierPurchases.length > 0 ? (
                supplierPurchases.map((s: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">{s.supplierName || `Supplier #${idx+1}`}</TableCell>
                    <TableCell className="text-right">{s.orderCount || 0}</TableCell>
                    <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100">${(s.totalAmount || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                    No supplier procurement data for this period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
