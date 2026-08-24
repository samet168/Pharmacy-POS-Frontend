'use client';

import { useState, useEffect } from 'react';
import { customersApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { LoadingSkeleton, CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { SafeImage } from '@/components/ui/SafeImage';
import { Plus, Search, Edit, Trash2, Users, Star, Calendar, Phone, Download, RefreshCw, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/stores/authStore';
import { exportToCSV } from '@/lib/utils/exportUtils';

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
      setLoading(true);
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

  const handleExportCSV = () => {
    if (customers.length === 0) return toast.error('No customers data to export.');
    const headers = ['Customer ID', 'Name', 'Phone Number', 'Date of Birth', 'Loyalty Points', 'Created Date'];
    const rows = customers.map((c) => [
      c.id,
      c.name || '',
      c.phone || '',
      c.dateOfBirth || '',
      c.loyaltyPoints || 0,
      c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US') : '',
    ]);
    exportToCSV('Pharmacy_Customers_Directory', headers, rows);
    toast.success('Customers directory exported to CSV successfully!');
  };

  // CRUD Handlers
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

  const totalPoints = customers.reduce((acc, c) => acc + (c.loyaltyPoints || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <LoadingSkeleton variant="text" width={220} height={36} />
            <LoadingSkeleton variant="text" width={340} height={20} className="mt-2" />
          </div>
          <LoadingSkeleton variant="rectangular" width={160} height={42} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Customer Directory
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            Manage pharmacy patient profiles, contact details, and loyalty rewards points.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex items-center gap-1.5 text-xs font-bold">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchCustomers} className="flex items-center gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 font-bold shadow-md">
            <Plus className="h-4 w-4" /> Add Customer
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-bento-primary/10 text-bento-primary dark:text-bento-primary-dark rounded-2xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Customers</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{customers.length}</h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl">
            <Star className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Loyalty Points</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalPoints.toLocaleString()} PTS</h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Patients</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{filteredCustomers.length}</h3>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="p-4 border border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by customer name or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Customers Table (Desktop & Mobile View) */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="font-bold text-base">No customers found</p>
            <p className="text-xs">Add your first patient profile to track prescriptions and loyalty points.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow className="bg-slate-50/80 dark:bg-slate-800/60">
                  <TableHeader>Customer Profile</TableHeader>
                  <TableHeader>Phone Number</TableHeader>
                  <TableHeader>Date of Birth</TableHeader>
                  <TableHeader>Loyalty Points</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-bento-primary">
                          {customer.imageUrl ? (
                            <SafeImage src={customer.imageUrl} alt={customer.name} width={40} height={40} className="w-full h-full object-cover" />
                          ) : (
                            customer.name?.slice(0, 2).toUpperCase() || 'CU'
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{customer.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">ID #{customer.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <Phone className="h-3.5 w-3.5 text-slate-400" /> {customer.phone || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" /> {customer.dateOfBirth || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 text-xs font-bold rounded-full border border-amber-200 dark:border-amber-900/50">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {customer.loyaltyPoints || 0} PTS
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditModal(customer)} className="flex items-center gap-1">
                          <Edit className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openDeleteModal(customer)} className="text-rose-600 hover:text-rose-700 border-rose-200 dark:border-rose-900/50">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* CREATE CUSTOMER MODAL */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add New Customer">
        <div className="space-y-4">
          <Input label="Customer Full Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
          <Input label="Phone Number *" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+855 12 345 678" />
          <Input label="Date of Birth" type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} />
          <Input label="Initial Loyalty Points" type="number" value={formData.loyaltyPoints} onChange={(e) => setFormData({ ...formData, loyaltyPoints: parseInt(e.target.value) || 0 })} />

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} disabled={submitting || !formData.name || !formData.phone}>
              {submitting ? 'Saving...' : 'Save Customer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* EDIT CUSTOMER MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Customer Profile">
        <div className="space-y-4">
          <Input label="Customer Full Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <Input label="Phone Number *" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          <Input label="Date of Birth" type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} />
          <Input label="Loyalty Points" type="number" value={formData.loyaltyPoints} onChange={(e) => setFormData({ ...formData, loyaltyPoints: parseInt(e.target.value) || 0 })} />

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleUpdate} disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Customer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete Customer">
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete customer <strong>{selectedCustomer?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="primary" className="bg-rose-600 hover:bg-rose-700 text-white border-none" onClick={handleDelete} disabled={submitting}>
              {submitting ? 'Deleting...' : 'Delete Customer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}