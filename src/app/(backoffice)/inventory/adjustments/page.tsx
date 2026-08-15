'use client';

import { useState, useEffect } from 'react';
import { stockAdjustmentsApi, productsApi, productBatchesApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Plus, Search, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/stores/authStore';

export default function StockAdjustmentsPage() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;
  const branchId = user?.branchId || 1;
  
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    productId: '',
    batchId: '',
    quantityDelta: '',
    reason: 'COUNT_CORRECTION' as 'DAMAGE' | 'EXPIRY' | 'COUNT_CORRECTION' | 'OTHER',
    note: '',
  });

  useEffect(() => {
    fetchData();
  }, [organizationId, branchId]);

  const fetchData = async () => {
    try {
      const [adjustmentsData, productsData, batchesData] = await Promise.all([
        stockAdjustmentsApi.getByOrganization(organizationId, { branchId }),
        productsApi.listAll(),
        productBatchesApi.getByBranch(branchId),
      ]);
      const adjustmentsArray = Array.isArray(adjustmentsData) ? adjustmentsData : (adjustmentsData?.content || []);
      setAdjustments(adjustmentsArray);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setBatches(Array.isArray(batchesData) ? batchesData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (id: number) => {
    const product = products.find((p: any) => p.id === id);
    return product?.name || `Product #${id}`;
  };

  const getBatchNumber = (id: number) => {
    const batch = batches.find((b: any) => b.id === id);
    return batch?.batchNumber || `Batch #${id}`;
  };

  const filteredAdjustments = adjustments.filter((adjustment: any) =>
    getProductName(adjustment.productId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getBatchNumber(adjustment.batchId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    adjustment.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter batches based on selected product
  const getFilteredBatches = () => {
    if (!formData.productId) return batches;
    return batches.filter((b: any) => b.productId === parseInt(formData.productId));
  };

  // CRUD Operations
  const handleCreate = async () => {
    try {
      setSubmitting(true);
      await stockAdjustmentsApi.create({
        ...formData,
        productId: parseInt(formData.productId),
        batchId: parseInt(formData.batchId),
        quantityDelta: parseInt(formData.quantityDelta),
        organizationId,
        branchId,
      });
      toast.success('Stock adjustment created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to create stock adjustment:', error);
      toast.error('Failed to create stock adjustment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      await stockAdjustmentsApi.delete(selectedAdjustment.id);
      toast.success('Stock adjustment deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedAdjustment(null);
      fetchData();
    } catch (error) {
      console.error('Failed to delete stock adjustment:', error);
      toast.error('Failed to delete stock adjustment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (adjustment: any) => {
    setSelectedAdjustment(adjustment);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      batchId: '',
      quantityDelta: '',
      reason: 'COUNT_CORRECTION',
      note: '',
    });
    setSelectedAdjustment(null);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stock Adjustments</h1>
          <p className="text-slate-600">Manage inventory adjustments and corrections</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Adjustment
        </Button>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <Input
            placeholder="Search adjustments by product, batch, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>

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
            {filteredAdjustments.map((adjustment: any) => (
              <TableRow key={adjustment.id}>
                <TableCell>{new Date(adjustment.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{getProductName(adjustment.productId)}</TableCell>
                <TableCell>{getBatchNumber(adjustment.batchId)}</TableCell>
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
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() => openDeleteModal(adjustment)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="New Stock Adjustment"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Product <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.productId}
              onChange={(e) => {
                setFormData({ ...formData, productId: e.target.value, batchId: '' });
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
              required
            >
              <option value="">Select product</option>
              {products.map((prod: any) => (
                <option key={prod.id} value={prod.id}>
                  {prod.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Batch <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.batchId}
              onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
              required
              disabled={!formData.productId}
            >
              <option value="">Select batch</option>
              {getFilteredBatches().map((batch: any) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batchNumber} (Qty: {batch.quantityRemaining}, Exp: {new Date(batch.expiryDate).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Quantity Change <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={formData.quantityDelta}
              onChange={(e) => setFormData({ ...formData, quantityDelta: e.target.value })}
              placeholder="Enter quantity change (positive or negative)"
              required
            />
            <p className="text-xs text-slate-500 mt-1">Use positive number to add stock, negative to remove stock</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
              required
            >
              <option value="DAMAGE">Damage</option>
              <option value="EXPIRY">Expiry</option>
              <option value="COUNT_CORRECTION">Count Correction</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Note
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Enter additional notes"
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={submitting || !formData.productId || !formData.batchId || !formData.quantityDelta}
            >
              {submitting ? 'Creating...' : 'Create Adjustment'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedAdjustment(null);
        }}
        title="Delete Stock Adjustment"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete this stock adjustment for <strong>{getProductName(selectedAdjustment?.productId)}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedAdjustment(null);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? 'Deleting...' : 'Delete Adjustment'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}