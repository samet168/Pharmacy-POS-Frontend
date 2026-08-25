'use client';

import { FullPageSkeleton } from '@/components/ui/PageSkeleton';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Download, Calendar, Filter, TrendingUp, DollarSign, ShoppingBag, CreditCard, RefreshCw, Printer, ArrowUpRight, BarChart3 } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { toast } from 'sonner';
import { reportsApi } from '@/lib/api/reports';
import { exportToCSV } from '@/lib/utils/exportUtils';

export default function SalesReportPage() {
  const { user, currentUser } = useAuthStore();
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [totalGross, setTotalGross] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [avgOrderVal, setAvgOrderVal] = useState(0);

  const fetchReport = async () => {
    const orgId = currentUser?.organizationId || user?.organizationId;
    if (!orgId) return;

    setLoading(true);
    try {
      const res = await reportsApi.getSalesReport({
        organizationId: orgId,
        from: startDate,
        to: endDate
      });
      
      if (res) {
        const dailySales = (res as any).dailySales || [];
        setData(dailySales);

        setTotalGross((res as any).totalSales || (res as any).totalRevenue || 0);
        setTotalOrders((res as any).totalOrders || 0);
        setTotalProfit((res as any).totalSales || 0);
        setAvgOrderVal((res as any).averageOrderValue || 0);
      } else {
        setData([]);
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
  }, [currentUser?.organizationId, user?.organizationId]);

  const handleFilter = () => {
    fetchReport();
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Orders Count', 'Revenue ($)', 'Customers'];
    const rows = data.map((d) => [
      d.date,
      d.orders || 0,
      (d.revenue || 0).toFixed(2),
      d.customers || 0,
    ]);
    exportToCSV('Pharmacy_Sales_Performance_Report', headers, rows);
    toast.success('Sales report exported to CSV successfully!');
  };

  const handlePrint = () => {
    window.print();
  };


  if (loading) return <FullPageSkeleton kpiCount={4} tableRows={6} tableCols={5} />;
  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            Sales Performance Report
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            Analyze daily revenue, average order sizes, net profits, and payment method breakdowns.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <ExportDropdown
            filename="Pharmacy_Sales_Performance_Report"
            title="Sales Performance Report"
            subtitle={`Period: ${startDate} to ${endDate}`}
            headers={['Date', 'Orders Count', 'Revenue ($)', 'Customers']}
            rows={data.map((d) => [
              d.date,
              d.orders || 0,
              (d.revenue || 0).toFixed(2),
              d.customers || 0,
            ])}
            buttonVariant="outline"
            buttonSize="sm"
            buttonText="Export CSV"
          />
          <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-1.5 text-xs font-bold">
            <Printer className="h-4 w-4" /> Print Report
          </Button>
          <Button variant="outline" size="sm" onClick={fetchReport} className="flex items-center gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
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
        <Button variant="primary" onClick={handleFilter} className="w-full sm:w-auto font-bold px-6">
          Apply Filter
        </Button>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sales Revenue</span>
            <DollarSign className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">${totalGross.toFixed(2)}</span>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
            <ShoppingBag className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalOrders}</span>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Order Value</span>
            <BarChart3 className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">${avgOrderVal.toFixed(2)}</span>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Estimated Net Profit</span>
            <TrendingUp className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">${totalProfit.toFixed(2)}</span>
          </div>
        </Card>
      </div>

      {/* Daily Sales Breakdown Table */}
      <Card className="p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Daily Sales Performance Breakdown</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Date</TableHeader>
                <TableHeader className="text-right">Orders Count</TableHeader>
                <TableHeader className="text-right">Total Revenue ($)</TableHeader>
                <TableHeader className="text-right">Customers</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length > 0 ? (
                data.map((d: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">{d.date}</TableCell>
                    <TableCell className="text-right">{d.orders || 0}</TableCell>
                    <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100">${(d.revenue || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{d.customers || 0}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    No sales performance data for this period.
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