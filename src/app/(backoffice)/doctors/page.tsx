'use client';

import { useState, useEffect } from 'react';
import { doctorsApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { LoadingSkeleton, CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { SafeImage } from '@/components/ui/SafeImage';
import { Plus, Search, Edit, Trash2, UserCheck, Stethoscope, Phone, Mail, Award, Download, RefreshCw, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/utils/exportUtils';

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
      setLoading(true);
      const data = await doctorsApi.listAll();
      const dataArray = Array.isArray(data) ? data : (data?.content || []);
      setDoctors(dataArray);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
      toast.error('Failed to load doctors directory.');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doctor.specialization && doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (doctor.phone && doctor.phone.includes(searchTerm)) ||
    (doctor.licenseNumber && doctor.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleExportCSV = () => {
    if (doctors.length === 0) return toast.error('No doctors data to export.');
    const headers = ['Doctor ID', 'Doctor Name', 'Specialization', 'License Number', 'Phone Number', 'Email', 'Clinic Address'];
    const rows = doctors.map((d) => [
      d.id,
      d.name || '',
      d.specialization || '',
      d.licenseNumber || '',
      d.phone || '',
      d.email || '',
      d.address || '',
    ]);
    exportToCSV('Physicians_Directory_Export', headers, rows);
    toast.success('Doctors directory exported to CSV successfully!');
  };

  // CRUD Operations
  const handleCreate = async () => {
    try {
      setSubmitting(true);
      const { imageFile, ...dataToSend } = formData;
      await doctorsApi.create(dataToSend, imageFile || undefined);
      toast.success('Physician added successfully');
      setIsCreateModalOpen(false);
      resetForm();
      fetchDoctors();
    } catch (error) {
      console.error('Failed to create doctor:', error);
      toast.error('Failed to create doctor record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setSubmitting(true);
      const { imageFile, ...dataToSend } = formData;
      await doctorsApi.update(selectedDoctor.id, dataToSend, imageFile || undefined);
      toast.success('Physician details updated');
      setIsEditModalOpen(false);
      resetForm();
      fetchDoctors();
    } catch (error) {
      console.error('Failed to update doctor:', error);
      toast.error('Failed to update doctor record.');
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
      toast.error('Failed to delete doctor record.');
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            Prescribing Doctors & Physicians
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            Manage certified medical practitioners, medical licenses, and prescription issuers.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex items-center gap-1.5 text-xs font-bold">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchDoctors} className="flex items-center gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 font-bold shadow-md">
            <Plus className="h-4 w-4" /> Add Doctor
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-bento-primary/10 text-bento-primary dark:text-bento-primary-dark rounded-2xl">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Physicians</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{doctors.length}</h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Licensed Practitioners</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {doctors.filter(d => d.licenseNumber).length}
            </h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Directory</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{filteredDoctors.length}</h3>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="p-4 border border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by doctor name, specialization, phone, or license number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Doctors Table */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        {filteredDoctors.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <Stethoscope className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="font-bold text-base">No doctors found in directory</p>
            <p className="text-xs">Click "Add Doctor" above to register prescribing physicians.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow className="bg-slate-50/80 dark:bg-slate-800/60">
                  <TableHeader>Doctor Profile</TableHeader>
                  <TableHeader>Specialization</TableHeader>
                  <TableHeader>License Number</TableHeader>
                  <TableHeader>Contact Info</TableHeader>
                  <TableHeader>Clinic Address</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDoctors.map((doctor) => (
                  <TableRow key={doctor.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400">
                          {doctor.imageUrl ? (
                            <SafeImage src={doctor.imageUrl} alt={doctor.name} width={40} height={40} className="w-full h-full object-cover" />
                          ) : (
                            doctor.name?.slice(0, 2).toUpperCase() || 'DR'
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm">Dr. {doctor.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">ID #{doctor.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 text-xs font-bold rounded-full border border-indigo-200 dark:border-indigo-900/50">
                        <Stethoscope className="h-3.5 w-3.5" /> {doctor.specialization || 'General Physician'}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-700 dark:text-slate-300">
                      {doctor.licenseNumber || 'LIC-PENDING'}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        <p className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
                          <Phone className="h-3 w-3 text-slate-400" /> {doctor.phone || 'N/A'}
                        </p>
                        {doctor.email && (
                          <p className="flex items-center gap-1 text-slate-500">
                            <Mail className="h-3 w-3 text-slate-400" /> {doctor.email}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" /> {doctor.address || 'Phnom Penh'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditModal(doctor)} className="flex items-center gap-1">
                          <Edit className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openDeleteModal(doctor)} className="text-rose-600 hover:text-rose-700 border-rose-200 dark:border-rose-900/50">
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

      {/* CREATE DOCTOR MODAL */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add Prescribing Doctor">
        <div className="space-y-4">
          <Input label="Doctor Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Dr. Sarah Jenkins" />
          <Input label="Specialization *" value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} placeholder="Cardiology, Pediatrics, General Medicine" />
          <Input label="Medical License Number *" value={formData.licenseNumber} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} placeholder="MED-889922-KH" />
          
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone Number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+855 12 888 999" />
            <Input label="Email Address" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="doctor@clinic.com" />
          </div>

          <Input label="Hospital / Clinic Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Phnom Penh General Hospital" />

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} disabled={submitting || !formData.name || !formData.specialization}>
              {submitting ? 'Saving...' : 'Save Doctor'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* EDIT DOCTOR MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Doctor Profile">
        <div className="space-y-4">
          <Input label="Doctor Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <Input label="Specialization *" value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} />
          <Input label="Medical License Number" value={formData.licenseNumber} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone Number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            <Input label="Email Address" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <Input label="Hospital / Clinic Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleUpdate} disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Doctor'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* DELETE DOCTOR MODAL */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete Doctor">
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete doctor <strong>Dr. {selectedDoctor?.name}</strong>?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="primary" className="bg-rose-600 hover:bg-rose-700 text-white border-none" onClick={handleDelete} disabled={submitting}>
              {submitting ? 'Deleting...' : 'Delete Doctor'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}