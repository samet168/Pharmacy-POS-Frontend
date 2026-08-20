'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ordersApi, customersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/authStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { LoadingSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { Plus, Search, Edit, Trash2, ShoppingCart, ChevronLeft, ChevronRight, Eye, Receipt, CreditCard, Printer } from 'lucide-react';
import { toast } from 'sonner';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
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
    organizationId: 0,
    branchId: 0,
    userId: 0,
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
      const { user } = useAuthStore.getState();
      const organizationId = user?.organizationId || 1;
      
      const [ordersData, customersData] = await Promise.all([
        ordersApi.listAll({ organizationId }, page - 1, pageSize).catch(err => {
          console.error('Failed to fetch orders:', err);
          return { content: [], totalPages: 1 };
        }),
        customersApi.getByOrganization(organizationId, 0, 100).catch(err => {
          console.error('Failed to fetch customers:', err);
          return { content: [] };
        }),
      ]);
      
      const ordersArray = Array.isArray(ordersData) ? ordersData : (ordersData?.content || []);
      const customersArray = Array.isArray(customersData) ? customersData : (customersData?.content || []);
      setOrders(ordersArray);
      setCustomers(customersArray);
      setTotalPages(ordersData?.totalPages || 1);
      
      if (ordersArray.length === 0 && customersArray.length === 0) {
        toast.info('No orders or customers found');
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load orders and customers. Please check your connection.');
      setOrders([]);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.customerId && customers.find((c: any) => c.id === order.customerId)?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedOrders = filteredOrders;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { user } = useAuthStore.getState();
      const organizationId = user?.organizationId || 1;
      const branchId = user?.branchIds?.[0] || 1; // Get branch from user or default to 1
      
      // Validate items
      if (!formData.items || formData.items.length === 0 || formData.items.some(item => !item.productId)) {
        toast.error('Please add at least one valid item to the order');
        setSubmitting(false);
        return;
      }
      
      // Use checkout API to create order
      await ordersApi.checkout({
        organizationId,
        branchId,
        userId: user?.userId || 1,
        customerId: formData.customerId ? parseInt(formData.customerId) : undefined,
        shiftId: formData.shiftId ? parseInt(formData.shiftId) : undefined,
        items: formData.items.map(item => ({
          productId: parseInt(item.productId),
          quantity: item.quantity,
          unitId: 1, // Default unit
          unitPrice: item.unitPrice,
        })),
        payments: [{
          orderId: 0,
          paymentMethod: formData.paymentMethod as any,
          amountPaid: parseFloat(formData.amountPaid),
        }],
      });
      toast.success('Order created successfully');
      setIsCreateModalOpen(false);
      setFormData({
        organizationId,
        branchId: branchId,
        userId: user?.userId || 1,
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
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create order. Please try again.';
      toast.error(errorMessage);
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
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update order. Please try again.';
      toast.error(errorMessage);
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
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete order. Please try again.';
      toast.error(errorMessage);
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

  const openViewModal = async (order: any) => {
    try {
      setLoading(true);
      // Fetch full order details including items
      const orderDetails = await ordersApi.getById(order.id);
      setSelectedOrder({
        ...order,
        ...orderDetails,
        items: orderDetails.items || [],
        payments: orderDetails.payments || []
      });
      setIsViewModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      toast.error('Failed to load order details');
      // Fallback to basic order data
      setSelectedOrder(order);
      setIsViewModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = (order: any) => {
    // Route to checkout with order pre-loaded
    router.push(`/checkout?orderId=${order.id}`);
  };

  const handlePrintReceipt = (order: any) => {
    // For now, show a toast. In a real implementation, this would trigger a print dialog
    toast.success(`Printing receipt for order ${order.invoiceNumber || order.id}`);
    // Future implementation: window.print() or generate PDF
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
    const statusStyles: Record<string, string> = {
      PAID: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400',
      COMPLETED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400',
      PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400',
      UNPAID: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400',
      CANCELLED: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400',
      REFUNDED: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400',
      VOIDED: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400',
      PARTIALLY_REFUNDED: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400',
      PENDING_SYNC: 'bg-slate-100 text-slate-800 dark:bg-slate-950/50 dark:text-slate-400',
    };
    
    const styleClass = statusStyles[status] || 'bg-slate-100 text-slate-800 dark:bg-slate-950/50 dark:text-slate-400';
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styleClass}`}>
        {status}
      </span>
    );
  };

  const getSyncStatusBadge = (syncStatus: string) => {
    const syncStyles: Record<string, string> = {
      SYNCED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400',
      PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400',
      CONFLICT: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400',
      FAILED: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400',
    };
    
    const styleClass = syncStyles[syncStatus] || 'bg-slate-100 text-slate-800 dark:bg-slate-950/50 dark:text-slate-400';
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styleClass}`}>
        {syncStatus}
      </span>
    );
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
        <Button variant="primary" shape="pill" size="md" onClick={() => router.push('/orders/new')}>
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
              <option value="PAID">Paid</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="UNPAID">Unpaid</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
              <option value="VOIDED">Voided</option>
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
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium text-bento-primary dark:text-slate-100">
                      {order.invoiceNumber || `#${order.id}`}
                    </TableCell>
                    <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {order.customerId
                        ? customers.find((c: any) => c.id === order.customerId)?.name || `Customer #${order.customerId}`
                        : 'Walk-in'}
                    </TableCell>
                    <TableCell className="font-semibold">${order.finalAmount?.toFixed(2) || order.grandTotal?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-2 hover:bg-bento-bg dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-primary dark:hover:text-slate-100"
                          onClick={() => openViewModal(order)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {(order.status === 'UNPAID' || order.status === 'PENDING') && (
                          <button
                            className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 rounded-full transition-colors text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                            onClick={() => handlePayNow(order)}
                            title="Pay Now"
                          >
                            <CreditCard className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          className="p-2 hover:bg-bento-bg dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-primary dark:hover:text-slate-100"
                          onClick={() => handlePrintReceipt(order)}
                          title="Print Receipt"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 hover:bg-bento-bg dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-primary dark:hover:text-slate-100"
                          onClick={() => openEditModal(order)}
                          title="Edit Order"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 hover:bg-bento-pink rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-pink-text"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDeleteModalOpen(true);
                          }}
                          title="Delete Order"
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
                      {!searchTerm && !statusFilter && (
                        <Button
                          variant="primary"
                          shape="pill"
                          size="sm"
                          className="mt-4"
                          onClick={() => router.push('/orders/new')}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Order
                        </Button>
                      )}
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
        size="xl"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Order Number</p>
                <p className="font-semibold text-bento-primary dark:text-slate-100 text-lg">
                  {selectedOrder.invoiceNumber || `#ORD-${selectedOrder.id}`}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Date & Time</p>
                <p className="font-semibold text-bento-primary dark:text-slate-100">
                  {new Date(selectedOrder.orderDate || selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</p>
                <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Customer</p>
                <p className="font-semibold text-bento-primary dark:text-slate-100">
                  {selectedOrder.customerId
                    ? (() => {
                        const customer = customers.find((c: any) => c.id === selectedOrder.customerId);
                        return customer?.name || `Customer #${selectedOrder.customerId}`;
                      })()
                    : 'Walk-in Customer'}
                </p>
                {selectedOrder.customerId && (() => {
                  const customer = customers.find((c: any) => c.id === selectedOrder.customerId);
                  return customer?.phone && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">{customer.phone}</p>
                  );
                })()}
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Payment Method</p>
                <p className="font-semibold text-bento-primary dark:text-slate-100">
                  {selectedOrder.paymentMethod || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Cashier</p>
                <p className="font-semibold text-bento-primary dark:text-slate-100">
                  {selectedOrder.userName || `User #${selectedOrder.userId}`}
                </p>
              </div>
            </div>

            {/* Ordered Items Table */}
            <div>
              <h3 className="text-sm font-semibold text-bento-primary dark:text-slate-100 mb-3">Ordered Items</h3>
              <div className="border border-bento-gray dark:border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Product</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Unit Price</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Quantity</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bento-gray dark:divide-slate-700">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item: any, index: number) => (
                        <tr key={index} className="bg-white dark:bg-slate-900">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-bento-primary dark:text-slate-100">{item.productName || `Product #${item.productId}`}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">ID: {item.productId}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-bento-primary dark:text-slate-100">
                            ${item.unitPrice?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-4 py-3 text-right text-bento-primary dark:text-slate-100">
                            {item.quantity || 0}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-bento-primary dark:text-slate-100">
                            ${((item.unitPrice || 0) * (item.quantity || 0)).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                          No items found for this order
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Summary Box */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-bento-primary dark:text-slate-100 mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                  <span className="font-medium text-bento-primary dark:text-slate-100">
                    ${selectedOrder.subtotal?.toFixed(2) || selectedOrder.totalAmount?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Discount</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    -${selectedOrder.discountAmount?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Tax</span>
                  <span className="font-medium text-bento-primary dark:text-slate-100">
                    ${selectedOrder.taxAmount?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="border-t border-bento-gray dark:border-slate-700 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-bento-primary dark:text-slate-100">Grand Total</span>
                    <span className="font-bold text-xl text-bento-primary dark:text-slate-100">
                      ${selectedOrder.grandTotal?.toFixed(2) || selectedOrder.finalAmount?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
                {/* Payment Information */}
                {selectedOrder.payments && selectedOrder.payments.length > 0 ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Amount Paid</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        ${selectedOrder.payments.reduce((sum: number, p: any) => sum + (p.amountPaid || 0), 0).toFixed(2)}
                      </span>
                    </div>
                    {(() => {
                      const totalPaid = selectedOrder.payments.reduce((sum: number, p: any) => sum + (p.amountPaid || 0), 0);
                      const grandTotal = selectedOrder.grandTotal || selectedOrder.finalAmount || 0;
                      const isPaidInFull = totalPaid >= grandTotal;
                      const changeOrBalance = Math.abs(totalPaid - grandTotal);
                      
                      return (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 dark:text-slate-400">
                            {isPaidInFull ? 'Change' : 'Outstanding Balance'}
                          </span>
                          <span className={`font-medium ${isPaidInFull ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            ${changeOrBalance.toFixed(2)}
                          </span>
                        </div>
                      );
                    })()}
                  </>
                ) : selectedOrder.amountPaid ? (
                  // Fallback for old field structure
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Amount Paid</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        ${selectedOrder.amountPaid.toFixed(2)}
                      </span>
                    </div>
                    {(() => {
                      const grandTotal = selectedOrder.grandTotal || selectedOrder.finalAmount || 0;
                      const isPaidInFull = selectedOrder.amountPaid >= grandTotal;
                      const changeOrBalance = Math.abs(selectedOrder.amountPaid - grandTotal);
                      
                      return (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 dark:text-slate-400">
                            {isPaidInFull ? 'Change' : 'Outstanding Balance'}
                          </span>
                          <span className={`font-medium ${isPaidInFull ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            ${changeOrBalance.toFixed(2)}
                          </span>
                        </div>
                      );
                    })()}
                  </>
                ) : null}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-bento-gray dark:border-slate-700">
              <Button
                variant="outline"
                shape="pill"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </Button>
              <Button 
                variant="outline" 
                shape="pill"
                onClick={() => handlePrintReceipt(selectedOrder)}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Receipt
              </Button>
              {(selectedOrder.status === 'UNPAID' || selectedOrder.status === 'PENDING') && (
                <Button 
                  variant="primary" 
                  shape="pill"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handlePayNow(selectedOrder);
                  }}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Proceed to Payment
                </Button>
              )}
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