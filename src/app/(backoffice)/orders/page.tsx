'use client';

import { useState, useEffect } from 'react';
import { ordersApi, customersApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { LoadingSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { Plus, Search, Edit, Trash2, ShoppingCart, ChevronLeft, ChevronRight, Eye, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [formData, setFormData] = useState({
    organizationId: 1,
    branchId: 1,
    userId: 1,
    customerId: '',
    shiftId: '',
    prescriptionId: '',
    items: [{ productId: '', quantity: 1, unitPrice: 0 }],
    paymentMethod: 'CASH',
    amountPaid: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersData, customersData] = await Promise.all([
        ordersApi.listAll(1, 1).catch(() => []),
        customersApi.listAll().catch(() => []),
      ]);
      setOrders(ordersData);
      setCustomers(customersData);
      setTotalPages(Math.ceil(ordersData.length / pageSize));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.customerId && customers.find((c: any) => c.id === order.customerId)?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedOrders = filteredOrders.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ordersApi.create({
        ...formData,
        customerId: formData.customerId ? parseInt(formData.customerId) : undefined,
        shiftId: formData.shiftId ? parseInt(formData.shiftId) : undefined,
        amountPaid: parseFloat(formData.amountPaid),
        items: formData.items.map(item => ({
          ...item,
          productId: parseInt(item.productId),
        })),
      });
      toast.success('Order created successfully');
      setIsCreateModalOpen(false);
      setFormData({
        organizationId: 1,
        branchId: 1,
        userId: 1,
        customerId: '',
        shiftId: '',
        prescriptionId: '',
        items: [{ productId: '', quantity: 1, unitPrice: 0 }],
        paymentMethod: 'CASH',
        amountPaid: '',
      });
      fetchData();
    } catch (error: any) {
      console.error('Failed to create order:', error);
      toast.error(error.response?.data?.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ordersApi.update(selectedOrder.id, {
        ...formData,
        customerId: formData.customerId ? parseInt(formData.customerId) : undefined,
        shiftId: formData.shiftId ? parseInt(formData.shiftId) : undefined,
        amountPaid: parseFloat(formData.amountPaid),
        items: formData.items.map(item => ({
          ...item,
          productId: parseInt(item.productId),
        })),
      });
      toast.success('Order updated successfully');
      setIsEditModalOpen(false);
      setSelectedOrder(null);
      fetchData();
    } catch (error: any) {
      console.error('Failed to update order:', error);
      toast.error(error.response?.data?.message || 'Failed to update order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await ordersApi.delete(selectedOrder.id);
      toast.success('Order deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedOrder(null);
      fetchData();
    } catch (error: any) {
      console.error('Failed to delete order:', error);
      toast.error(error.response?.data?.message || 'Failed to delete order');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (order: any) => {
    setSelectedOrder(order);
    setFormData({
      organizationId: order.organizationId,
      branchId: order.branchId,
      userId: order.userId,
      customerId: order.customerId?.toString() || '',
      shiftId: order.shiftId?.toString() || '',
      prescriptionId: order.prescriptionId || '',
      items: order.items || [{ productId: '', quantity: 1, unitPrice: 0 }],
      paymentMethod: 'CASH',
      amountPaid: order.finalAmount?.toString() || '',
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (order: any) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setFormData({ ...formData, items: updatedItems });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
      COMPLETED: 'success',
      VOIDED: 'danger',
      REFUNDED: 'danger',
      PARTIALLY_REFUNDED: 'warning',
      PENDING_SYNC: 'info',
    };
    return <Badge variant={variants[status] || 'info'}>{status}</Badge>;
  };

  const getSyncStatusBadge = (syncStatus: string) => {
    const variants: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
      SYNCED: 'success',
      PENDING: 'warning',
      CONFLICT: 'danger',
      FAILED: 'danger',
    };
    return <Badge variant={variants[syncStatus] || 'info'}>{syncStatus}</Badge>;
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
          <h1 className="text-3xl font-bold text-bento-primary dark:text-slate-100">Orders</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage sales orders and transactions</p>
        </div>
        <Button variant="primary" shape="pill" size="md" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Order
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search orders by number or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-4 w-4" />}
              shape="pill"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              className="px-4 py-3 bg-bento-bg dark:bg-slate-800 border border-bento-gray dark:border-slate-700 rounded-pill text-bento-primary dark:text-slate-100"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="VOIDED">Voided</option>
              <option value="REFUNDED">Refunded</option>
              <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
              <option value="PENDING_SYNC">Pending Sync</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Order Number</TableHeader>
                <TableHeader>Date</TableHeader>
                <TableHeader>Customer</TableHeader>
                <TableHeader>Total</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Sync Status</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium text-bento-primary dark:text-slate-100">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {order.customerId
                        ? customers.find((c: any) => c.id === order.customerId)?.name || `Customer #${order.customerId}`
                        : 'Walk-in'}
                    </TableCell>
                    <TableCell className="font-semibold">${order.finalAmount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{getSyncStatusBadge(order.syncStatus)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-2 hover:bg-bento-bg dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-primary dark:hover:text-slate-100"
                          onClick={() => openViewModal(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 hover:bg-bento-bg dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-primary dark:hover:text-slate-100"
                          onClick={() => openEditModal(order)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 hover:bg-bento-pink rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-pink-text"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <ShoppingCart className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                      <p className="text-slate-600 dark:text-slate-400 font-medium">No orders found</p>
                      <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                        {searchTerm || statusFilter ? 'Try adjusting your search or filters' : 'Create your first order to get started'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-bento-gray dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredOrders.length)} of {filteredOrders.length} orders
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                shape="pill"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                shape="pill"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Order"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Customer</label>
              <select
                className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              >
                <option value="">Walk-in Customer</option>
                {customers.map((customer: any) => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Payment Method</label>
              <select
                className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="MOBILE_PAYMENT">Mobile Payment</option>
                <option value="INSURANCE">Insurance</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-bento-primary dark:text-slate-100">Order Items</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {formData.items.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <Input
                    placeholder="Product ID"
                    value={item.productId}
                    onChange={(e) => updateItem(index, 'productId', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                    className="w-24"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-32"
                  />
                  {formData.items.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Input
            label="Amount Paid *"
            type="number"
            step="0.01"
            value={formData.amountPaid}
            onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
            required
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              shape="pill"
              onClick={() => setIsCreateModalOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button variant="primary" shape="pill" loading={submitting} type="submit">
              Create Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Order"
        size="lg"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Customer</label>
              <select
                className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              >
                <option value="">Walk-in Customer</option>
                {customers.map((customer: any) => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Payment Method</label>
              <select
                className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="MOBILE_PAYMENT">Mobile Payment</option>
                <option value="INSURANCE">Insurance</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-bento-primary dark:text-slate-100">Order Items</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {formData.items.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <Input
                    placeholder="Product ID"
                    value={item.productId}
                    onChange={(e) => updateItem(index, 'productId', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                    className="w-24"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-32"
                  />
                  {formData.items.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Input
            label="Amount Paid *"
            type="number"
            step="0.01"
            value={formData.amountPaid}
            onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
            required
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              shape="pill"
              onClick={() => setIsEditModalOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button variant="primary" shape="pill" loading={submitting} type="submit">
              Update Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Order Details"
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Order Number</p>
                <p className="font-semibold text-bento-primary dark:text-slate-100">{selectedOrder.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Date</p>
                <p className="font-semibold text-bento-primary dark:text-slate-100">{new Date(selectedOrder.orderDate).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Customer</p>
                <p className="font-semibold text-bento-primary dark:text-slate-100">
                  {selectedOrder.customerId
                    ? customers.find((c: any) => c.id === selectedOrder.customerId)?.name || `Customer #${selectedOrder.customerId}`
                    : 'Walk-in'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                <div>{getStatusBadge(selectedOrder.status)}</div>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Amount</p>
                <p className="font-semibold text-bento-primary dark:text-slate-100">${selectedOrder.totalAmount?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Discount</p>
                <p className="font-semibold text-bento-primary dark:text-slate-100">${selectedOrder.discountAmount?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Tax</p>
                <p className="font-semibold text-bento-primary dark:text-slate-100">${selectedOrder.taxAmount?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Final Amount</p>
                <p className="font-semibold text-xl text-bento-primary dark:text-slate-100">${selectedOrder.finalAmount?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                shape="pill"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </Button>
              <Button variant="primary" shape="pill">
                <Receipt className="h-4 w-4 mr-2" />
                Print Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Order"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete order <strong>{selectedOrder?.orderNumber}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              shape="pill"
              onClick={() => setIsDeleteModalOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              shape="pill"
              loading={submitting}
              onClick={handleDelete}
            >
              Delete Order
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}