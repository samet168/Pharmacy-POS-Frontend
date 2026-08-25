'use client';

import { FullPageSkeleton } from '@/components/ui/PageSkeleton';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Download, Users, DollarSign, Search, Award, UserPlus, UserCheck, RefreshCw } from 'lucide-react';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { toast } from 'sonner';
import { reportsApi } from '@/lib/api/reports';
import { useAuthStore } from '@/lib/stores/authStore';
import { exportToCSV } from '@/lib/utils/exportUtils';

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


  if (loading) return <FullPageSkeleton kpiCount={3} tableRows={6} tableCols={5} />;
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
          <ExportDropdown
            filename="Pharmacy_Customer_Analytics_Report"
            title="Customer Demographics & Lifetime Value Report"
            subtitle={`Period: ${startDate} to ${endDate}`}
            headers={['Customer Name', 'Phone Number', 'Total Orders', 'Total Spend ($)', 'Average Order Value ($)']}
            rows={
              topCustomers.length > 0
                ? filteredData.map((c) => [
                    c.customerName || '',
                    c.phone || '',
                    c.orderCount || 0,
                    `$${Number(c.totalSpending || 0).toFixed(2)}`,
                    `$${Number(c.averageOrderValue || 0).toFixed(2)}`,
                  ])
                : [
                    ['Total Customers', 'All registered accounts', totalCustomers, '-', '-'],
                    ['New Customers', 'Registered in period', newCustomers, '-', '-'],
                    ['Returning Customers', 'Repeat buyers', returningCustomers, '-', '-'],
                    ['Total Spending', 'Cumulative revenue', '-', `$${Number(totalSpending).toFixed(2)}`, '-'],
                  ]
            }
            buttonVariant="primary"
            buttonText="Export Customers"
          />
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Customers</span>
            <Users className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalCustomers}</span>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">New Registrations</span>
            <UserPlus className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{newCustomers}</span>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Repeat Buyers</span>
            <UserCheck className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{returningCustomers}</span>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Cumulative Spend</span>
            <DollarSign className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">${Number(totalSpending).toFixed(2)}</span>
          </div>
        </Card>
      </div>

      {/* Top Spending Customers Table */}
      <Card className="p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Top Purchasing Patients Directory</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Customer Name</TableHeader>
                <TableHeader>Phone Number</TableHeader>
                <TableHeader className="text-right">Orders Count</TableHeader>
                <TableHeader className="text-right">Total Spend ($)</TableHeader>
                <TableHeader className="text-right">Avg Order Value ($)</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((c: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-bold text-slate-900 dark:text-slate-100">{c.customerName || `Customer #${idx+1}`}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{c.phone || 'N/A'}</TableCell>
                    <TableCell className="text-right font-semibold">{c.orderCount || 0}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">${Number(c.totalSpending || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold text-indigo-600 dark:text-indigo-400">${Number(c.averageOrderValue || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    No customer demographics data available for this date range.
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
