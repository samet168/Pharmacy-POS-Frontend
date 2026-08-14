'use client';

import { useState, useEffect } from 'react';
import { productBatchesApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Search, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductBatchesPage() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withinDays, setWithinDays] = useState(30);

  useEffect(() => {
    if (withinDays) {
      fetchExpiringBatches();
    } else {
      fetchAllBatches();
    }
  }, [withinDays]);

  const fetchAllBatches = async () => {
    try {
      const data = await productBatchesApi.listAll();
      setBatches(data);
    } catch (error) {
      console.error('Failed to fetch batches:', error);
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiringBatches = async () => {
    try {
      // Use branch ID 1 as default - in real app, get from auth store
      const data = await productBatchesApi.getExpiring(1, withinDays);
      setBatches(data);
    } catch (error) {
      console.error('Failed to fetch expiring batches:', error);
      toast.error('Failed to load expiring batches');
    } finally {
      setLoading(false);
    }
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Product Batches</h1>
        <p className="text-slate-600">Manage product batches and FEFO inventory</p>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Expiring Within (Days)
            </label>
            <Input
              type="number"
              value={withinDays}
              onChange={(e) => setWithinDays(Number(e.target.value))}
              min={0}
            />
          </div>
          <Button onClick={() => withinDays > 0 ? setWithinDays(0) : setWithinDays(30)}>
            {withinDays > 0 ? 'Show All' : 'Show Expiring'}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Batch Number</TableHeader>
              <TableHeader>Product</TableHeader>
              <TableHeader>Expiry Date</TableHeader>
              <TableHeader>Cost Price</TableHeader>
              <TableHeader>Received</TableHeader>
              <TableHeader>Remaining</TableHeader>
              <TableHeader>Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {batches.map((batch) => (
              <TableRow key={batch.id}>
                <TableCell>{batch.batchNumber}</TableCell>
                <TableCell>Product #{batch.productId}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {isExpiringSoon(batch.expiryDate) && (
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    )}
                    {new Date(batch.expiryDate).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>${batch.costPrice.toFixed(2)}</TableCell>
                <TableCell>{batch.quantityReceived}</TableCell>
                <TableCell>
                  <span className={batch.quantityRemaining < 10 ? 'text-red-600 font-semibold' : ''}>
                    {batch.quantityRemaining}
                  </span>
                </TableCell>
                <TableCell>
                  {batch.quantityRemaining === 0 ? (
                    <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                      Empty
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      In Stock
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}