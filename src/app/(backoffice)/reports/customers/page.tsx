'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Download, Users, DollarSign, Search, Award, UserPlus, UserCheck, RefreshCw } from 'lucide-react';
import { exportToCSV } from '@/lib/utils/exportUtils';
import { toast } from 'sonner';
import { reportsApi } from '@/lib/api/reports';
import { useAuthStore } from '@/lib/stores/authStore';

export default function CustomerReportPage() {
  const { user, currentUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchReport = async () => {
    const orgId = currentUser?.organizationId || user?.organizationId;
    if (!orgId) return;

    setLoading(true);
    try {
      const res = await reportsApi.getCustomerReport({
        organizationId: orgId,
        from: startDate,
        to: endDate,
      });
      setReportData(res);
    } catch (error) {
      console.error('Failed to load customer report', error);
      toast.error('Failed to load customer report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [currentUser?.organizationId, user?.organizationId]);

  const totalCustomers = reportData?.totalCustomers || 0;
  const newCustomers = reportData?.newCustomers || 0;
  const returningCustomers = reportData?.returningCustomers || 0;
  const totalSpending = reportData?.totalSpending || 0;
  const topCustomers: any[] = reportData?.topCustomers || [];

  const filteredData = topCustomers.filter(c =>
    (c.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone || '').includes(searchTerm)
  );

  const handleExportCSV = () => {
    if (topCustomers.length > 0) {
      const headers = ['Customer Name', 'Phone Number', 'Total Orders', 'Total Spend ($)', 'Average Order Value ($)'];
      const rows = filteredData.map((c) => [
        c.customerName || '',
        c.phone || '',
        c.orderCount || 0,
        Number(c.totalSpending || 0).toFixed(2),
        Number(c.averageOrderValue || 0).toFixed(2),
      ]);
      exportToCSV('Pharmacy_Customer_Analytics_Report', headers, rows);
    } else {
      // Export summary stats if no top customers data
      const headers = ['Metric', 'Value'];
      const rows = [
        ['Total Customers', totalCustomers],
        ['New Customers (Period)', newCustomers],
        ['Returning Customers', returningCustomers],
        ['Total Spending ($)', Number(totalSpending).toFixed(2)],
      ];
      exportToCSV('Pharmacy_Customer_Analytics_Report', headers, rows);
    }
    toast.success('Customer report exported to CSV successfully!');
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
            Customer Demographics &amp; Lifetime Value Report
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            Patient purchasing frequency, total spend metrics, VIP loyalty tiers, and retention analysis.
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
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Customers</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalCustomers}</h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">New Customers (Period)</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{newCustomers}</h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Returning Customers</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{returningCustomers}</h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Spending</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              ${Number(totalSpending).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </Card>
      </div>

      {/* Top Customers Table */}
      {topCustomers.length > 0 && (
        <>
          <Card className="p-4 border border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by customer name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </Card>

          <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800">
              <h2 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" /> Top Customers by Spending
              </h2>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow className="bg-slate-50/80 dark:bg-slate-800/60">
                    <TableHeader>Customer Name</TableHeader>
                    <TableHeader>Phone Number</TableHeader>
                    <TableHeader>Total Orders</TableHeader>
                    <TableHeader>Total Lifetime Spend</TableHeader>
                    <TableHeader>Average Order Value</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.map((row, index) => (
                    <TableRow key={index} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <TableCell className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Users className="h-4 w-4 text-bento-primary" /> {row.customerName}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-400">{row.phone}</TableCell>
                      <TableCell className="font-bold text-slate-900 dark:text-slate-100">{row.orderCount || 0} orders</TableCell>
                      <TableCell className="font-bold text-emerald-600 dark:text-emerald-400">${Number(row.totalSpending || 0).toFixed(2)}</TableCell>
                      <TableCell className="font-bold text-indigo-600 dark:text-indigo-400">${Number(row.averageOrderValue || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}

      {topCustomers.length === 0 && (
        <Card className="p-8 text-center text-slate-500 border-dashed">
          <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="font-bold">No customer detail data available for this period.</p>
          <p className="text-xs mt-1">Summary stats above are from total registered customers.</p>
        </Card>
      )}
    </div>
  );
}
