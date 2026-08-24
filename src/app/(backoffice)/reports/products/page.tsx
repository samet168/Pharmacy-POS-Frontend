'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Download, Package, TrendingUp, DollarSign, Search, Award, Printer, ArrowUpRight } from 'lucide-react';
import { exportToCSV } from '@/lib/utils/exportUtils';
import { toast } from 'sonner';
import { reportsApi } from '@/lib/api/reports';
import { useAuthStore } from '@/lib/stores/authStore';

export default function ProductReportPage() {
  const { user, currentUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [totalProducts, setTotalProducts] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const fetchReport = async () => {
    const orgId = currentUser?.organizationId || user?.organizationId;
    if (!orgId) return;

    setLoading(true);
    try {
      const res = await reportsApi.getProductReport({ organizationId: orgId, from: startDate, to: endDate });
      if (res) {
        setTotalProducts((res as any).totalProducts || 0);
        if ((res as any).topSellingProducts) {
          const topProducts = (res as any).topSellingProducts;
          setData(topProducts);
          setTotalRevenue(topProducts.reduce((sum: number, item: any) => sum + Number(item.revenue || 0), 0));
        }
      }
    } catch (error) {
      console.error('Failed to load product report', error);
      toast.error('Failed to load product report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [currentUser?.organizationId, user?.organizationId]);

  const filteredData = data.filter(p =>
    (p.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = ['Product Name', 'SKU', 'Units Sold', 'Total Revenue ($)', 'Profit ($)'];
    const rows = filteredData.map((p) => [
      p.productName || '',
      p.sku || '',
      p.quantitySold || 0,
      (p.revenue || 0).toFixed(2),
      (p.profit || 0).toFixed(2),
    ]);
    exportToCSV('Pharmacy_Product_Performance_Report', headers, rows);
    toast.success('Product report exported to CSV successfully!');
  };

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            Product Performance & Velocity Report
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            Top-selling medications, sales volume breakdown, profit margins, and inventory turnover.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchReport} disabled={loading} className="flex items-center gap-1.5 text-xs">
            {loading ? <span className="animate-spin">↻</span> : null} Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={handleExportCSV} className="flex items-center gap-1.5 text-xs font-bold shadow-md">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-bento-primary/10 text-bento-primary rounded-2xl">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Products</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {totalProducts} products
            </h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Revenue Generated</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Top Seller Product</p>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {data.length > 0 ? data[0].productName : 'No sales data'}
            </h3>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="p-4 border border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by product name or medication category..."
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
                <TableHeader>Product Name</TableHeader>
                <TableHeader>SKU</TableHeader>
                <TableHeader>Units Sold</TableHeader>
                <TableHeader>Total Revenue</TableHeader>
                <TableHeader>Profit</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                    <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="font-bold">No product sales data for this period.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((row, index) => (
                  <TableRow key={index} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <TableCell className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Package className="h-4 w-4 text-bento-primary" /> {row.productName}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-400">{row.sku}</TableCell>
                    <TableCell className="font-bold text-slate-900 dark:text-slate-100">{row.quantitySold || 0} units</TableCell>
                    <TableCell className="font-bold text-emerald-600 dark:text-emerald-400">${Number(row.revenue || 0).toFixed(2)}</TableCell>
                    <TableCell className="font-bold text-indigo-600 dark:text-indigo-400">${Number(row.profit || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
