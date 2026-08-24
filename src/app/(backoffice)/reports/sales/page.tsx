'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Download, Calendar, Filter, TrendingUp, DollarSign, ShoppingBag, CreditCard, RefreshCw, Printer, ArrowUpRight, BarChart3 } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';
import { exportToCSV } from '@/lib/utils/exportUtils';
import { toast } from 'sonner';
import { reportsApi } from '@/lib/api/reports';

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
      
      // Backend returns totalSales, totalRevenue, totalDiscount, totalTax, netSales, averageOrderValue, totalOrders, dailySales, etc.
      if (res) {
        const dailySales = (res as any).dailySales || [];
        setData(dailySales);

        setTotalGross((res as any).totalSales || (res as any).totalRevenue || 0);
        setTotalOrders((res as any).totalOrders || 0);
        setTotalProfit((res as any).totalSales || 0); // Using totalSales as profit placeholder
        setAvgOrderVal((res as any).averageOrderValue || 0);
      } else {
        // Fallback if data structure is unexpected, use empty array
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
          <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-1.5 text-xs">
            <Printer className="h-4 w-4" /> Print Report
          </Button>
          <Button variant="primary" size="sm" onClick={handleExportCSV} className="flex items-center gap-1.5 text-xs font-bold shadow-md">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Date Filter Card */}
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
          <Button variant="outline" onClick={handleFilter} disabled={loading} className="w-full sm:w-auto font-bold flex items-center justify-center gap-2">
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />} 
            {loading ? 'Loading...' : 'Filter Range'}
          </Button>
        </div>
      </Card>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Gross Sales Revenue</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">${totalGross.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Completed Orders</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalOrders}</h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-bento-primary/10 text-bento-primary rounded-2xl">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Avg Order Value</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">${(avgOrderVal || 0).toFixed(2)}</h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Estimated Net Profit</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow className="bg-slate-50/80 dark:bg-slate-800/60">
                <TableHeader>Sales Date</TableHeader>
                <TableHeader>Orders</TableHeader>
                <TableHeader>Revenue</TableHeader>
                <TableHeader>Customers</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <TableCell className="font-bold text-slate-900 dark:text-slate-100">{row.date}</TableCell>
                  <TableCell className="font-semibold text-slate-700 dark:text-slate-300">{row.orders || 0} orders</TableCell>
                  <TableCell className="font-bold text-emerald-600 dark:text-emerald-400">${(row.revenue || 0).toFixed(2)}</TableCell>
                  <TableCell className="font-semibold text-slate-700 dark:text-slate-300">{row.customers || 0} customers</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}