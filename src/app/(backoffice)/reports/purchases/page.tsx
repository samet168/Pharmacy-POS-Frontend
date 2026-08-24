'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Download, ShoppingCart, DollarSign, Search, Truck, CheckCircle2 } from 'lucide-react';
import { exportToCSV } from '@/lib/utils/exportUtils';
import { toast } from 'sonner';
import { reportsApi } from '@/lib/api/reports';
import { useAuthStore } from '@/lib/stores/authStore';

export default function PurchaseReportPage() {
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
        const res = await reportsApi.getPurchaseReport({ organizationId: orgId });
        if (res && (res as any).supplierPurchases) {
          setData((res as any).supplierPurchases);
        }
      } catch (error) {
        console.error('Failed to load purchase report', error);
        toast.error('Failed to load purchase report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [currentUser?.organizationId, user?.organizationId]);

  const filteredData = data.filter(p =>
    (p.poNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = ['Supplier Name', 'Order Count', 'Total Value ($)'];
    const rows = filteredData.map((p) => [
      p.supplierName || '',
      p.orderCount || 0,
      (p.totalValue || 0).toFixed(2),
    ]);
    exportToCSV('Pharmacy_Procurement_Purchase_Report', headers, rows);
    toast.success('Purchase report exported to CSV successfully!');
  };

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            Procurement & Purchase Orders Report
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            Supplier purchase order history, procurement expenses, goods received, and pending shipments.
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
            <ShoppingCart className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Purchase Orders</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{data.length} POs</h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Procurement Expenditure</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              ${data.reduce((sum, item) => sum + (item.totalCost || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Active Suppliers</p>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">PharmaMed & 3 Vendors</h3>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="p-4 border border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by PO number or supplier name..."
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
                <TableHeader>Supplier Name</TableHeader>
                <TableHeader>Order Count</TableHeader>
                <TableHeader>Total Value</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((row, index) => (
                <TableRow key={index} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <TableCell className="font-bold text-slate-900 dark:text-slate-100">{row.supplierName || ''}</TableCell>
                  <TableCell className="font-semibold text-slate-700 dark:text-slate-300">{row.orderCount || 0} orders</TableCell>
                  <TableCell className="font-bold text-emerald-600 dark:text-emerald-400">${(row.totalValue || 0).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
