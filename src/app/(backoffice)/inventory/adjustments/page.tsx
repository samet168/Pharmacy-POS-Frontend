'use client';

import { useState, useEffect } from 'react';
import { stockAdjustmentsApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Plus, Search, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function StockAdjustmentsPage() {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdjustments();
  }, []);

  const fetchAdjustments = async () => {
    try {
      // Use branch ID 1 as default - in real app, get from auth store
      const data = await stockAdjustmentsApi.getByBranch(1);
      setAdjustments(data);
    } catch (error) {
      console.error('Failed to fetch adjustments:', error);
      toast.error('Failed to load stock adjustments');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stock Adjustments</h1>
          <p className="text damageColour-600">Manage inventory adjustments and corrections</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Adjustment
        </Button>
      </div>

      <Card className="p-6">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Date</TableHeader>
              <TableHeader>Product</TableHeader>
              <TableHeader>Batch</TableHeader>
              <TableHeader>Quantity Change</TableHeader>
              <TableHeader>Reason</TableHeader>
              <TableHeader>Note</TableHeader>
              <TableHeader>Approved By</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {adjustments.map((adjustment) => (
              <TableRow key={adjustment.id}>
                <TableCell>{new Date(adjustment.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>Product #{adjustment.productId}</TableCell>
                <TableCell>Batch #{adjustment.batchId}</TableCell>
                <TableCell className={adjustment.quantityDelta > 0 ? 'text-green-600' : 'text-red-600'}>
                  {adjustment.quantityDelta > 0 ? '+' : ''}{adjustment.quantityDelta}
                </TableCell>
                <TableCell>{adjustment.reason}</TableCell>
                <TableCell>{adjustment.note || '-'}</TableCell>
                <TableCell>{adjustment.approvedBy ? `User #${adjustment.approvedBy}` : 'Pending'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-800">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}