'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Download, Calendar, Filter } from 'lucide-react';

export default function SalesReportPage() {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const handleExport = (format: 'csv' | 'pdf') => {
    // Export logic
    console.log(`Exporting as ${format}`);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Report</h1>
          <p className="text-slate-600">View and export sales data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Start Date
            </label>
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              icon={<Calendar className="h-5 w-5" />}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              End Date
            </label>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              icon={<Calendar className="h-5 w-5" />}
            />
          </div>
          <Button>
            <Filter className="h-4 w-4 mr-2" />
            Apply Filter
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-6">
          <h3 className="text-sm text-slate-600 mb-2">Total Sales</h3>
          <p className="text-3xl font-bold text-slate-900">$0.00</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm text-slate-600 mb-2">Total Orders</h3>
          <p className="text-3xl font-bold text-slate-900">0</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm text-slate-600 mb-2">Average Order Value</h3>
          <p className="text-3xl font-bold text-slate-900">$0.00</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Sales by Day</h2>
        <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center">
          <p className="text-slate-600">Chart will be rendered here</p>
        </div>
      </Card>
    </div>
  );
}