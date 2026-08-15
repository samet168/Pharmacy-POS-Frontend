'use client';

import { useState, useEffect } from 'react';
import { customersApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Plus, Search, Edit, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/stores/authStore';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    imageUrl: '',
    dateOfBirth: '',
    loyaltyPoints: 0,
    imageFile: null as File | null,
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { user } = useAuthStore.getState();
      const organizationId = user?.organizationId || 1;
      const data = await customersApi.getByOrganization(organizationId, 0, 100);
      const dataArray = Array.isArray(data) ? data : (data?.content || []);
      setCustomers(dataArray);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      toast.error('Failed to load customers. Please try again.');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // CRUD Operations
  const handleCreate = async () => {
    try {
      setSubmitting(true);
      const { user } = useAuthStore.getState();
      const organizationId = user?.organizationId || 1;
      
      const { imageFile, ...dataToSend } = formData;
      await customersApi.create({
        ...dataToSend,
        organizationId,
      }, imageFile || undefined);
      toast.success('Customer created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      console.error('Failed to create customer:', error);
      toast.error('Failed to create customer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setSubmitting(true);
      const { user } = useAuthStore.getState();
      const organizationId = user?.organizationId || 1;
      
      const { imageFile, ...dataToSend } = formData;
      await customersApi.update(selectedCustomer.id, {
        ...dataToSend,
        organizationId,
      }, imageFile || undefined);
      toast.success('Customer updated successfully');
      setIsEditModalOpen(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      console.error('Failed to update customer:', error);
      toast.error('Failed to update customer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      await customersApi.delete(selectedCustomer.id);
      toast.success('Customer deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error('Failed to delete customer:', error);
      toast.error('Failed to delete customer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (customer: any) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      imageUrl: customer.imageUrl || '',
      dateOfBirth: customer.dateOfBirth || '',
      loyaltyPoints: customer.loyaltyPoints || 0,
      imageFile: null,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (customer: any) => {
    setSelectedCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      imageUrl: '',
      dateOfBirth: '',
      loyaltyPoints: 0,
      imageFile: null,
    });
    setSelectedCustomer(null);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-600">Manage customer information</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Image</TableHeader>
              <TableHeader>Name</TableHeader>
              <TableHeader>Phone</TableHeader>
              <TableHeader>Loyalty Points</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  {customer.imageUrl ? (
                    <img src={customer.imageUrl} alt={customer.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                        {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.phone || '-'}</TableCell>
                <TableCell>{customer.loyaltyPoints || 0}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <button 
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => openEditModal(customer)}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-800"
                      onClick={() => openDeleteModal(customer)}
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          resetForm();
        }}
        title={isEditModalOpen ? 'Edit Customer' : 'Add New Customer'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Customer Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, imageFile: e.target.files?.[0] || null })}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {isEditModalOpen && selectedCustomer?.imageUrl && (
              <div className="mt-2">
                <img src={selectedCustomer.imageUrl} alt="Current customer image" className="w-20 h-20 rounded-full object-cover" />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Customer Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter customer name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Phone Number
            </label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Date of Birth
            </label>
            <Input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Loyalty Points
            </label>
            <Input
              type="number"
              value={formData.loyaltyPoints}
              onChange={(e) => setFormData({ ...formData, loyaltyPoints: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={isEditModalOpen ? handleUpdate : handleCreate}
              disabled={submitting || !formData.name || !formData.phone}
            >
              {submitting ? 'Saving...' : isEditModalOpen ? 'Update Customer' : 'Create Customer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedCustomer(null);
        }}
        title="Delete Customer"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete customer <strong>{selectedCustomer?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedCustomer(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? 'Deleting...' : 'Delete Customer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}