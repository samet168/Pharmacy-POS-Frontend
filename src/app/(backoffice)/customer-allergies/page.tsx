'use client';

import { useState, useEffect } from 'react';
import { customerAllergiesApi } from '@/lib/api/customerAllergies';
import { customersApi } from '@/lib/api/customers';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { LoadingSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { Plus, Search, Edit, Trash2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/lib/stores/authStore';

export default function CustomerAllergiesPage() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;
  const [allergies, setAllergies] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAllergy, setSelectedAllergy] = useState<any>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    ingredientId: '',
    reactionNotes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [organizationId]);

  useEffect(() => {
    if (selectedCustomer) {
      fetchAllergies();
    }
  }, [selectedCustomer]);

  const fetchCustomers = async () => {
    try {
      const data = await customersApi.getByOrganization(organizationId);
      const dataArray = Array.isArray(data) ? data : (data?.content || []);
      setCustomers(dataArray);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      toast.error('Failed to load customers. Please try again.');
      setCustomers([]);
    }
  };

  const fetchAllergies = async () => {
    if (!selectedCustomer) {
      setAllergies([]);
      return;
    }
    try {
      setLoading(true);
      const data = await customerAllergiesApi.getByCustomer(parseInt(selectedCustomer));
      const dataArray = Array.isArray(data) ? data : [];
      setAllergies(dataArray);
    } catch (error) {
      console.error('Failed to fetch allergies:', error);
      toast.error('Failed to load allergies. Please try again.');
      setAllergies([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAllergies = allergies.filter(allergy =>
    allergy.ingredientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    allergy.reactionNotes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await customerAllergiesApi.create({
        customerId: parseInt(formData.customerId),
        ingredientId: parseInt(formData.ingredientId),
        reactionNotes: formData.reactionNotes,
      });
      toast.success('Customer allergy created successfully');
      setIsCreateModalOpen(false);
      setFormData({ customerId: '', ingredientId: '', reactionNotes: '' });
      fetchAllergies();
    } catch (error: any) {
      console.error('Failed to create allergy:', error);
      toast.error(error.response?.data?.message || 'Failed to create allergy');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await customerAllergiesApi.update(selectedAllergy.id, {
        customerId: parseInt(formData.customerId),
        ingredientId: parseInt(formData.ingredientId),
        reactionNotes: formData.reactionNotes,
      });
      toast.success('Customer allergy updated successfully');
      setIsEditModalOpen(false);
      setSelectedAllergy(null);
      fetchAllergies();
    } catch (error: any) {
      console.error('Failed to update allergy:', error);
      toast.error(error.response?.data?.message || 'Failed to update allergy');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await customerAllergiesApi.delete(selectedAllergy.id);
      toast.success('Customer allergy deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedAllergy(null);
      fetchAllergies();
    } catch (error: any) {
      console.error('Failed to delete allergy:', error);
      toast.error(error.response?.data?.message || 'Failed to delete allergy');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (allergy: any) => {
    setSelectedAllergy(allergy);
    setFormData({
      customerId: allergy.customerId?.toString() || '',
      ingredientId: allergy.ingredientId?.toString() || '',
      reactionNotes: allergy.reactionNotes || '',
    });
    setIsEditModalOpen(true);
  };

  const getCustomerName = (customerId: number) => {
    const customer = customers.find((c: any) => c.id === customerId);
    return customer?.name || `Customer #${customerId}`;
  };

  if (loading && !selectedCustomer) {
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
          <h1 className="text-3xl font-bold text-bento-primary dark:text-slate-100">Customer Allergies</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage customer allergies and ingredient reactions</p>
        </div>
        <Button 
          variant="primary" 
          shape="pill" 
          size="md" 
          onClick={() => setIsCreateModalOpen(true)}
          disabled={!selectedCustomer}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Allergy
        </Button>
      </div>

      {/* Customer Filter */}
      <Card className="p-6">
        <div>
          <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Select Customer</label>
          <select
            className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
          >
            <option value="">Select a customer...</option>
            {customers.map((customer: any) => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Search Bar */}
      {selectedCustomer && (
        <Card className="p-6">
          <Input
            placeholder="Search allergies by ingredient or reaction..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="h-4 w-4" />}
            shape="pill"
          />
        </Card>
      )}

      {/* Allergies Table */}
      {selectedCustomer && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Customer</TableHeader>
                  <TableHeader>Ingredient</TableHeader>
                  <TableHeader>Reaction Notes</TableHeader>
                  <TableHeader className="text-right">Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAllergies.length > 0 ? (
                  filteredAllergies.map((allergy: any) => (
                    <TableRow key={allergy.id}>
                      <TableCell className="font-medium text-bento-primary dark:text-slate-100">
                        {getCustomerName(allergy.customerId)}
                      </TableCell>
                      <TableCell>{allergy.ingredientName || `Ingredient #${allergy.ingredientId}`}</TableCell>
                      <TableCell>{allergy.reactionNotes || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            className="p-2 hover:bg-bento-bg dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-primary dark:hover:text-slate-100"
                            onClick={() => openEditModal(allergy)}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            className="p-2 hover:bg-bento-pink rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-bento-pink-text"
                            onClick={() => {
                              setSelectedAllergy(allergy);
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
                    <TableCell colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <AlertTriangle className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">No allergies found</p>
                        <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                          {searchTerm ? 'Try adjusting your search' : 'Add the first allergy for this customer'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Customer Allergy"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Customer *</label>
            <select
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              required
            >
              <option value="">Select a customer...</option>
              {customers.map((customer: any) => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Ingredient ID *</label>
            <Input
              type="number"
              value={formData.ingredientId}
              onChange={(e) => setFormData({ ...formData, ingredientId: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Reaction Notes</label>
            <Input
              value={formData.reactionNotes}
              onChange={(e) => setFormData({ ...formData, reactionNotes: e.target.value })}
            />
          </div>
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
              Create Allergy
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Customer Allergy"
        size="md"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Customer *</label>
            <select
              className="w-full px-4 py-3 border border-bento-gray dark:border-slate-700 bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary"
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              required
            >
              <option value="">Select a customer...</option>
              {customers.map((customer: any) => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Ingredient ID *</label>
            <Input
              type="number"
              value={formData.ingredientId}
              onChange={(e) => setFormData({ ...formData, ingredientId: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-bento-primary dark:text-slate-100 mb-2">Reaction Notes</label>
            <Input
              value={formData.reactionNotes}
              onChange={(e) => setFormData({ ...formData, reactionNotes: e.target.value })}
            />
          </div>
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
              Update Allergy
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Customer Allergy"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete this allergy? This action cannot be undone.
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
              Delete Allergy
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
