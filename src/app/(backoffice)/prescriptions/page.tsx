'use client';

import { useState, useEffect } from 'react';
import { prescriptionsApi, customersApi, doctorsApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Plus, Search, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    customerId: '',
    doctorId: '',
    prescriptionDate: new Date().toISOString().split('T')[0],
    diagnosis: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prescriptionsData, customersData, doctorsData] = await Promise.all([
        prescriptionsApi.listAll(),
        customersApi.listAll(),
        doctorsApi.listAll(),
      ]);
      const prescriptionsArray = Array.isArray(prescriptionsData) ? prescriptionsData : (prescriptionsData?.content || []);
      const customersArray = Array.isArray(customersData) ? customersData : (customersData?.content || []);
      const doctorsArray = Array.isArray(doctorsData) ? doctorsData : (doctorsData?.content || []);
      setPrescriptions(prescriptionsArray);
      setCustomers(customersArray);
      setDoctors(doctorsArray);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load prescriptions data. Please try again.');
      setPrescriptions([]);
      setCustomers([]);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (id: number) => {
    const customer = customers.find(c => c.id === id);
    return customer?.name || `Customer #${id}`;
  };

  const getDoctorName = (id: number) => {
    const doctor = doctors.find(d => d.id === id);
    return doctor?.name || `Doctor #${id}`;
  };

  const filteredPrescriptions = prescriptions.filter(prescription =>
    getCustomerName(prescription.customerId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getDoctorName(prescription.doctorId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (prescription.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // CRUD Operations
  const handleCreate = async () => {
    try {
      setSubmitting(true);
      await prescriptionsApi.create({
        ...formData,
        customerId: parseInt(formData.customerId),
        doctorId: parseInt(formData.doctorId),
      });
      toast.success('Prescription created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to create prescription:', error);
      toast.error('Failed to create prescription. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setSubmitting(true);
      await prescriptionsApi.update(selectedPrescription.id, {
        ...formData,
        customerId: parseInt(formData.customerId),
        doctorId: parseInt(formData.doctorId),
      });
      toast.success('Prescription updated successfully');
      setIsEditModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to update prescription:', error);
      toast.error('Failed to update prescription. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      await prescriptionsApi.delete(selectedPrescription.id);
      toast.success('Prescription deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedPrescription(null);
      fetchData();
    } catch (error) {
      console.error('Failed to delete prescription:', error);
      toast.error('Failed to delete prescription. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (prescription: any) => {
    setSelectedPrescription(prescription);
    setFormData({
      customerId: prescription.customerId?.toString() || '',
      doctorId: prescription.doctorId?.toString() || '',
      prescriptionDate: prescription.prescriptionDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      diagnosis: prescription.diagnosis || '',
      notes: prescription.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (prescription: any) => {
    setSelectedPrescription(prescription);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      doctorId: '',
      prescriptionDate: new Date().toISOString().split('T')[0],
      diagnosis: '',
      notes: '',
    });
    setSelectedPrescription(null);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prescriptions</h1>
          <p className="text-slate-600">Manage customer prescriptions</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Prescription
        </Button>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <Input
            placeholder="Search prescriptions by customer, doctor, or diagnosis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Customer</TableHeader>
              <TableHeader>Doctor</TableHeader>
              <TableHeader>Date</TableHeader>
              <TableHeader>Diagnosis</TableHeader>
              <TableHeader>Allergy Check</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPrescriptions.map((prescription) => (
              <TableRow key={prescription.id}>
                <TableCell className="font-semibold">{getCustomerName(prescription.customerId)}</TableCell>
                <TableCell>{getDoctorName(prescription.doctorId)}</TableCell>
                <TableCell>{new Date(prescription.prescriptionDate).toLocaleDateString()}</TableCell>
                <TableCell>{prescription.diagnosis || '-'}</TableCell>
                <TableCell>
                  <button className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Check
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <button 
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => openEditModal(prescription)}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-800"
                      onClick={() => openDeleteModal(prescription)}
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
        title={isEditModalOpen ? 'Edit Prescription' : 'New Prescription'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Customer <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
              required
            >
              <option value="">Select customer</option>
              {customers.map((cust) => (
                <option key={cust.id} value={cust.id}>
                  {cust.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Doctor <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.doctorId}
              onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
              required
            >
              <option value="">Select doctor</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} {doc.specialization ? `(${doc.specialization})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Prescription Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.prescriptionDate}
              onChange={(e) => setFormData({ ...formData, prescriptionDate: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Diagnosis
            </label>
            <Input
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              placeholder="Enter diagnosis"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                setIsEditModalOpen(false);
                resetForm();
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={isEditModalOpen ? handleUpdate : handleCreate}
              disabled={submitting || !formData.customerId || !formData.doctorId || !formData.prescriptionDate}
            >
              {submitting ? 'Saving...' : isEditModalOpen ? 'Update Prescription' : 'Create Prescription'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedPrescription(null);
        }}
        title="Delete Prescription"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete this prescription for <strong>{getCustomerName(selectedPrescription?.customerId)}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedPrescription(null);
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
              {submitting ? 'Deleting...' : 'Delete Prescription'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}