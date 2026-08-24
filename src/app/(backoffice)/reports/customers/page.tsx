'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Download, Users, DollarSign, Search, Award, HeartHandshake } from 'lucide-react';
import { exportToCSV } from '@/lib/utils/exportUtils';
import { toast } from 'sonner';
import { reportsApi } from '@/lib/api/reports';
import { useAuthStore } from '@/lib/stores/authStore';

export default function CustomerReportPage() {
  const { user, currentUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      const orgId = currentUser?.organizationId || user?.organizationId;
      if (!orgId) return;

      setLoading(true);
      try {
        const res = await reportsApi.getCustomerReport({ organizationId: orgId });
        if (res && (res as any).topCustomers) {
          setData((res as any).topCustomers);
        }
      } catch (error) {
        console.error('Failed to load customer report', error);
        toast.error('Failed to load customer report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [currentUser?.organizationId, user?.organizationId]);

  const filteredData = data.filter(c =>
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone || '').includes(searchTerm) ||
    (c.loyaltyTier || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = ['Customer Name', 'Phone Number', 'Total Orders', 'Total Spend ($)', 'Average Order Value ($)'];
    const rows = filteredData.map((c) => [
      c.customerName || '',
      c.phone || '',
      c.orderCount || 0,
      (c.totalSpending || 0).toFixed(2),
      (c.averageOrderValue || 0).toFixed(2),
    ]);
    exportToCSV('Pharmacy_Customer_Analytics_Report', headers, rows);
    toast.success('Customer report exported to CSV successfully!');
  };

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            Customer Demographics & Lifetime Value Report
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            Patient purchasing frequency, total spend metrics, VIP loyalty tiers, and retention analysis.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button variant="primary" size="sm" onClick={handleExportCSV} className="flex items-center gap-1.5 text-xs font-bold shadow-md">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-bento-primary/10 text-bento-primary rounded-2xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Active Patient Customers</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{data.length} Registered</h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Customer Spend</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              ${data.reduce((sum, item) => sum + (item.totalSpend || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Top VIP Patient</p>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Vannak Nguon ($2,840)</h3>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="p-4 border border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by customer name, phone, or loyalty tier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
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
                  <TableCell className="font-bold text-emerald-600 dark:text-emerald-400">${(row.totalSpending || 0).toFixed(2)}</TableCell>
                  <TableCell className="font-bold text-indigo-600 dark:text-indigo-400">${(row.averageOrderValue || 0).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
