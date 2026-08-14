'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { LoadingSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { FileText, Download, Calendar, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('today');
  const [generating, setGenerating] = useState(false);

  const reports = [
    { id: 1, name: 'Sales Report', type: 'sales', description: 'Daily sales summary' },
    { id: 2, name: 'Inventory Report', type: 'inventory', description: 'Stock levels and movements' },
    { id: 3, name: 'Expiry Report', type: 'expiry', description: 'Products nearing expiry' },
    { id: 4, name: 'Low Stock Report', type: 'low_stock', description: 'Products below threshold' },
    { id: 5, name: 'Profit Report', type: 'profit', description: 'Profitability analysis' },
    { id: 6, name: 'Customer Report', type: 'customer', description: 'Customer activity summary' },
  ];

  const mockReportData = [
    { id: 1, date: '2026-08-14', totalSales: 2450, totalOrders: 18, avgOrderValue: 136.11 },
    { id: 2, date: '2026-08-13', totalSales: 3120, totalOrders: 24, avgOrderValue: 130.00 },
    { id: 3, date: '2026-08-12', totalSales: 1890, totalOrders: 15, avgOrderValue: 126.00 },
    { id: 4, date: '2026-08-11', totalSales: 2750, totalOrders: 20, avgOrderValue: 137.50 },
    { id: 5, date: '2026-08-10', totalSales: 2080, totalOrders: 16, avgOrderValue: 130.00 },
  ];

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Report generated successfully');
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = async (reportId: number) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Report downloaded successfully');
    } catch (error: any) {
      console.error('Failed to download report:', error);
      toast.error('Failed to download report');
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <LoadingSkeleton variant="text" width={200} height={32} />
            <LoadingSkeleton variant="text" width={300} height={20} />
          </div>
          <LoadingSkeleton variant="rectangular" width={150} height={40} />
        </div>
        <Card className="p-6">
          <LoadingSkeleton variant="rectangular" width="100%" height={40} />
          <TableSkeleton rows={5} />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-bento-primary dark:text-slate-100">Reports</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Generate and download business reports</p>
        </div>
        <Button variant="primary" shape="pill" size="md" onClick={handleGenerateReport} loading={generating}>
          <FileText className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <Card
            key={report.id}
            className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
              reportType === report.type
                ? 'border-bento-primary dark:border-blue-500 bg-bento-bg dark:bg-slate-800'
                : 'border-bento-gray dark:border-slate-700'
            }`}
            onClick={() => setReportType(report.type)}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-bento-primary dark:text-slate-100 mb-1">{report.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{report.description}</p>
              </div>
              <Badge variant={reportType === report.type ? 'primary' : 'default'}>
                {reportType === report.type ? 'Selected' : 'Select'}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Date Range</label>
            <select
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Branch</label>
            <select
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
            >
              <option value="">All Branches</option>
              <option value="1">Main Branch</option>
              <option value="2">Branch 2</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Report Data Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Date</TableHeader>
                <TableHeader>Total Sales</TableHeader>
                <TableHeader>Total Orders</TableHeader>
                <TableHeader>Avg Order Value</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockReportData.length > 0 ? (
                mockReportData.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-bento-primary dark:text-slate-100">
                      {row.date}
                    </TableCell>
                    <TableCell>${row.totalSales.toFixed(2)}</TableCell>
                    <TableCell>{row.totalOrders}</TableCell>
                    <TableCell>${row.avgOrderValue.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        shape="pill"
                        size="sm"
                        onClick={() => handleDownloadReport(row.id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                      <p className="text-slate-600 dark:text-slate-400 font-medium">No report data found</p>
                      <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                        Generate a report to see data
                      </p>
                    </div>
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