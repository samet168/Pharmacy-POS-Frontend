'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Download, Warehouse, AlertTriangle, Search, CheckCircle2, DollarSign } from 'lucide-react';
import { exportToCSV } from '@/lib/utils/exportUtils';
import { toast } from 'sonner';
import { reportsApi } from '@/lib/api/reports';
import { useAuthStore } from '@/lib/stores/authStore';

export default function InventoryReportPage() {
  const { user, currentUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [totalStockValue, setTotalStockValue] = useState(0);
  const [totalStockQuantity, setTotalStockQuantity] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    const fetchReport = async () => {
      const orgId = currentUser?.organizationId || user?.organizationId;
      if (!orgId) return;

      setLoading(true);
      try {
        const res = await reportsApi.getInventoryReport({ organizationId: orgId });
        if (res) {
          setTotalStockValue((res as any).totalStockValue || 0);
          setTotalStockQuantity((res as any).totalStockQuantity || 0);
          setLowStockCount((res as any).lowStockCount || 0);
          if ((res as any).branchStocks) {
            setData((res as any).branchStocks);
          }
        }
      } catch (error) {
        console.error('Failed to load inventory report', error);
        toast.error('Failed to load inventory report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [currentUser?.organizationId, user?.organizationId]);

  const filteredData = data.filter(i =>
    (i.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.batchNo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = ['Branch Name', 'Total Products', 'Stock Value ($)', 'Low Stock Count'];
    const rows = filteredData.map((i) => [
      i.branchName || '',
      i.totalProducts || 0,
      (i.stockValue || 0).toFixed(2),
      i.lowStockCount || 0,
    ]);
    exportToCSV('Pharmacy_Inventory_Valuation_Report', headers, rows);
    toast.success('Inventory report exported to CSV successfully!');
  };

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            Inventory Valuation & Stock Health Report
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            Current stock quantities, batch tracking, low stock alerts, and total warehouse inventory value.
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
            <Warehouse className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Stocked Quantity</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {totalStockQuantity} items
            </h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Valuation Asset</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              ${totalStockValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-600 rounded-2xl">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Stock Alerts (Low/Expiry)</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {lowStockCount} items needing reorder
            </h3>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="p-4 border border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by SKU, medication name, or batch number..."
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
                <TableHeader>Branch Name</TableHeader>
                <TableHeader>Total Products</TableHeader>
                <TableHeader>Stock Value</TableHeader>
                <TableHeader>Low Stock Count</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((row, index) => (
                <TableRow key={index} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <TableCell className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Warehouse className="h-4 w-4 text-bento-primary" /> {row.branchName || ''}
                  </TableCell>
                  <TableCell className="font-bold text-slate-900 dark:text-slate-100">{row.totalProducts || 0} products</TableCell>
                  <TableCell className="font-bold text-emerald-600 dark:text-emerald-400">${(row.stockValue || 0).toFixed(2)}</TableCell>
                  <TableCell className="font-bold text-rose-600 dark:text-rose-400">{row.lowStockCount || 0} low stock</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
