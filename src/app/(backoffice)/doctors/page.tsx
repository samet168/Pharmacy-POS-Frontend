'use client';

import { useState, useEffect } from 'react';
import { doctorsApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Plus, Search, Edit, Trash2, User, X } from 'lucide-react';
import { toast } from 'sonner';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    phone: '',
    email: '',
    address: '',
    licenseNumber: '',
    imageFile: null as File | null,
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const data = await doctorsApi.listAll();
      const dataArray = Array.isArray(data) ? data : (data?.content || []);
      setDoctors(dataArray);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
      toast.error('Failed to load doctors. Please try again.');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doctor.specialization && doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (doctor.phone && doctor.phone.includes(searchTerm))
  );

  // CRUD Operations
  const handleCreate = async () => {
    try {
      setSubmitting(true);
      const { imageFile, ...dataToSend } = formData;
      await doctorsApi.create(dataToSend, imageFile || undefined);
      toast.success('Doctor created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      fetchDoctors();
    } catch (error) {
      console.error('Failed to create doctor:', error);
      toast.error('Failed to create doctor. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setSubmitting(true);
      const { imageFile, ...dataToSend } = formData;
      await doctorsApi.update(selectedDoctor.id, dataToSend, imageFile || undefined);
      toast.success('Doctor updated successfully');
      setIsEditModalOpen(false);
      resetForm();
      fetchDoctors();
    } catch (error) {
      console.error('Failed to update doctor:', error);
      toast.error('Failed to update doctor. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      await doctorsApi.delete(selectedDoctor.id);
      toast.success('Doctor deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedDoctor(null);
      fetchDoctors();
    } catch (error) {
      console.error('Failed to delete doctor:', error);
      toast.error('Failed to delete doctor. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (doctor: any) => {
    setSelectedDoctor(doctor);
    setFormData({
      name: doctor.name || '',
      specialization: doctor.specialization || '',
      phone: doctor.phone || '',
      email: doctor.email || '',
      address: doctor.address || '',
      licenseNumber: doctor.licenseNumber || '',
      imageFile: null,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (doctor: any) => {
    setSelectedDoctor(doctor);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      specialization: '',
      phone: '',
      email: '',
      address: '',
      licenseNumber: '',
      imageFile: null,
    });
    setSelectedDoctor(null);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctors</h1>
          <p className="text-slate-600">Manage doctor information</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Doctor
        </Button>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <Input
            placeholder="Search doctors..."
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
              <TableHeader>Specialization</TableHeader>
              <TableHeader>Phone</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader>License Number</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDoctors.map((doctor) => (
              <TableRow key={doctor.id}>
                <TableCell>
                  {doctor.imageUrl ? (
                    <img src={doctor.imageUrl} alt={doctor.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                        {doctor.name?.charAt(0)?.toUpperCase() || 'D'}
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  {doctor.name}
                </TableCell>
                <TableCell>{doctor.specialization || '-'}</TableCell>
                <TableCell>{doctor.phone || '-'}</TableCell>
                <TableCell>{doctor.email || '-'}</TableCell>
                <TableCell>{doctor.licenseNumber || '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <button 
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => openEditModal(doctor)}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-800"
                      onClick={() => openDeleteModal(doctor)}
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
        title={isEditModalOpen ? 'Edit Doctor' : 'Add New Doctor'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Doctor Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, imageFile: e.target.files?.[0] || null })}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {isEditModalOpen && selectedDoctor?.imageUrl && (
              <div className="mt-2">
                <img src={selectedDoctor.imageUrl} alt="Current doctor image" className="w-20 h-20 rounded-full object-cover" />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Doctor Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter doctor name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Specialization
            </label>
            <Input
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              placeholder="Enter specialization"
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
              Email
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Address
            </label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              License Number
            </label>
            <Input
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              placeholder="Enter license number"
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
              disabled={submitting || !formData.name}
            >
              {submitting ? 'Saving...' : isEditModalOpen ? 'Update Doctor' : 'Create Doctor'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedDoctor(null);
        }}
        title="Delete Doctor"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete doctor <strong>{selectedDoctor?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedDoctor(null);
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
              {submitting ? 'Deleting...' : 'Delete Doctor'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}