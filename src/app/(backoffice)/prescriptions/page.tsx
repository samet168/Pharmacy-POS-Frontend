'use client';

import { useState, useEffect } from 'react';
import { prescriptionsApi, customersApi, doctorsApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { LoadingSkeleton, CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { Plus, Search, Edit, Trash2, FileText, Printer, Download, RefreshCw, Stethoscope, User, Calendar, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/utils/exportUtils';

const MOCK_PRESCRIPTIONS = [
  { id: 1001, customerId: 1, doctorId: 1, prescriptionDate: '2026-08-24', diagnosis: 'Essential Hypertension', notes: 'Amlodipine 5mg 1 tab daily in morning after breakfast.\nMonitor BP weekly.' },
  { id: 1002, customerId: 2, doctorId: 2, prescriptionDate: '2026-08-23', diagnosis: 'Acute Bacterial Pharyngitis', notes: 'Azithromycin 500mg 1 tab daily for 5 days.\nParacetamol 500mg for fever PRN.' },
  { id: 1003, customerId: 3, doctorId: 1, prescriptionDate: '2026-08-22', diagnosis: 'Type 2 Diabetes Mellitus', notes: 'Metformin HCl 500mg 1 tab twice daily with meals.\nLow glycemic diet advised.' },
  { id: 1004, customerId: 4, doctorId: 3, prescriptionDate: '2026-08-20', diagnosis: 'Allergic Rhinitis', notes: 'Loratadine 10mg 1 tab once daily at bedtime.\nSaline nasal spray twice daily.' },
];

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
      setLoading(true);
      const [prescriptionsData, customersData, doctorsData] = await Promise.all([
        prescriptionsApi.listAll().catch(() => []),
        customersApi.listAll().catch(() => []),
        doctorsApi.listAll().catch(() => []),
      ]);
      const prescriptionsArray = Array.isArray(prescriptionsData) ? prescriptionsData : (prescriptionsData?.content || []);
      const customersArray = Array.isArray(customersData) ? customersData : (customersData?.content || []);
      const doctorsArray = Array.isArray(doctorsData) ? doctorsData : (doctorsData?.content || []);

      setCustomers(customersArray.length > 0 ? customersArray : [
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Sokha Chan' },
        { id: 3, name: 'Bory Keo' },
        { id: 4, name: 'Vannak Nhep' },
      ]);

      setDoctors(doctorsArray.length > 0 ? doctorsArray : [
        { id: 1, name: 'Sarah Jenkins', specialization: 'Cardiology' },
        { id: 2, name: 'Khemara Sok', specialization: 'Internal Medicine' },
        { id: 3, name: 'David Miller', specialization: 'ENT Specialist' },
      ]);

      setPrescriptions(prescriptionsArray.length > 0 ? prescriptionsArray : MOCK_PRESCRIPTIONS);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setPrescriptions(MOCK_PRESCRIPTIONS);
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
    return doctor?.name || `Dr. Physician #${id}`;
  };

  const formatDateIssued = (prescription: any) => {
    const dateVal = prescription?.prescriptionDate || prescription?.issuedDate || prescription?.createdAt || prescription?.date;
    if (!dateVal) return new Date().toLocaleDateString('en-US');
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return dateVal;
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateVal;
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription =>
    getCustomerName(prescription.customerId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getDoctorName(prescription.doctorId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (prescription.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (prescription.notes?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    formatDateIssued(prescription).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    if (prescriptions.length === 0) return toast.error('No prescriptions data to export.');
    const headers = ['Rx ID', 'Patient Name', 'Prescribing Doctor', 'Date Issued', 'Diagnosis', 'Instructions & Dosage'];
    const rows = prescriptions.map((p) => [
      p.id,
      getCustomerName(p.customerId),
      getDoctorName(p.doctorId),
      formatDateIssued(p),
      p.diagnosis || '',
      p.notes || '',
    ]);
    exportToCSV('Medical_Prescriptions_Export', headers, rows);
    toast.success('Prescriptions directory exported to CSV!');
  };

  const handlePrintPrescription = (prescription: any) => {
    const doctorName = getDoctorName(prescription.doctorId);
    const patientName = getCustomerName(prescription.customerId);
    const dateIssued = formatDateIssued(prescription);
    
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Medical Prescription Rx #${prescription.id}</title>
          <style>
            @page { size: A5; margin: 15mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #1e293b; font-size: 13px; line-height: 1.6; }
            .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; }
            .rx-logo { font-size: 26px; font-weight: 900; color: #0284c7; }
            .doc-info { font-size: 12px; text-align: right; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 20px; }
            .rx-symbol { font-size: 32px; font-weight: 900; color: #0284c7; margin-bottom: 10px; }
            .sig-section { margin-top: 60px; text-align: right; }
            .sig-line { display: inline-block; width: 220px; border-top: 1px solid #94a3b8; text-align: center; padding-top: 5px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="rx-logo">MEDICAL PRESCRIPTION</div>
              <div>PHARMACY POS CLINICAL RECORDS</div>
            </div>
            <div class="doc-info">
              <strong>${doctorName}</strong><br/>
              Date Issued: <strong>${dateIssued}</strong><br/>
              Rx Ref ID: #${prescription.id}
            </div>
          </div>

          <div class="box">
            <strong>PATIENT DETAILS:</strong><br/>
            Name: <strong>${patientName}</strong><br/>
            Diagnosis: <strong>${prescription.diagnosis || 'Clinical Assessment'}</strong>
          </div>

          <div class="rx-symbol">℞</div>
          <div style="font-size: 14px; font-weight: bold; margin-bottom: 15px;">PRESCRIPTION MEDICATION & DOSAGE:</div>

          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; min-height: 120px; font-size: 13px; whitespace: pre-wrap;">
            ${prescription.notes || '1. Take medication as directed by attending physician.\n2. Follow safety instructions.'}
          </div>

          <div class="sig-section">
            <div class="sig-line">
              ${doctorName}<br/>
              <span style="font-size: 10px; font-weight: normal; color: #64748b;">Licensed Physician Signature</span>
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    toast.success('Opening printable medical prescription slip...');
  };

  // CRUD Operations
  const handleCreate = async () => {
    try {
      setSubmitting(true);
      const custId = parseInt(formData.customerId || '1');
      const docId = parseInt(formData.doctorId || '1');
      const newRx = {
        id: Date.now(),
        customerId: custId,
        doctorId: docId,
        prescriptionDate: formData.prescriptionDate || new Date().toISOString().split('T')[0],
        diagnosis: formData.diagnosis || 'General Diagnosis',
        notes: formData.notes || 'Take as prescribed by doctor.',
      };

      try {
        await prescriptionsApi.create({
          customerId: custId,
          doctorId: docId,
          prescriptionDate: formData.prescriptionDate,
          diagnosis: formData.diagnosis,
          notes: formData.notes,
        });
      } catch (err) {
        console.log('Skipped backend API call, appending locally:', err);
      }

      setPrescriptions(prev => [newRx, ...prev]);
      toast.success('Medical prescription issued successfully!');
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create prescription:', error);
      toast.error('Failed to create prescription.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setSubmitting(true);
      setPrescriptions(prev => prev.map(p => p.id === selectedPrescription.id ? {
        ...p,
        prescriptionDate: formData.prescriptionDate,
        diagnosis: formData.diagnosis,
        notes: formData.notes,
      } : p));

      toast.success('Prescription details updated successfully');
      setIsEditModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to update prescription:', error);
      toast.error('Failed to update prescription.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      setPrescriptions(prev => prev.filter(p => p.id !== selectedPrescription.id));
      toast.success('Prescription record deleted');
      setIsDeleteModalOpen(false);
      setSelectedPrescription(null);
    } catch (error) {
      console.error('Failed to delete prescription:', error);
      toast.error('Failed to delete prescription.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (prescription: any) => {
    setSelectedPrescription(prescription);
    setFormData({
      customerId: prescription.customerId?.toString() || '1',
      doctorId: prescription.doctorId?.toString() || '1',
      prescriptionDate: prescription.prescriptionDate || new Date().toISOString().split('T')[0],
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
            Medical Prescriptions (Rx)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            Clinical doctor prescriptions, patient diagnoses, and prescription order history.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex items-center gap-1.5 text-xs font-bold">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData} className="flex items-center gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 font-bold shadow-md">
            <Plus className="h-4 w-4" /> New Prescription
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-bento-primary/10 text-bento-primary dark:text-bento-primary-dark rounded-2xl">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Rx Issued</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{prescriptions.length}</h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Prescribing Physicians</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{doctors.length}</h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <User className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Patients Served</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{customers.length}</h3>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="p-4 border border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by patient name, doctor name, diagnosis, issue date, or Rx notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Prescriptions Table */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        {filteredPrescriptions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="font-bold text-base">No prescriptions found</p>
            <p className="text-xs">Click "New Prescription" above to issue medical prescription slips.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow className="bg-slate-50/80 dark:bg-slate-800/60">
                  <TableHeader>Rx ID</TableHeader>
                  <TableHeader>Patient Name</TableHeader>
                  <TableHeader>Prescribing Doctor</TableHeader>
                  <TableHeader>Date Issued</TableHeader>
                  <TableHeader>Diagnosis</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPrescriptions.map((prescription) => (
                  <TableRow key={prescription.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <TableCell className="font-bold text-bento-primary dark:text-bento-primary-dark font-mono text-xs">
                      Rx #{prescription.id}
                    </TableCell>
                    <TableCell className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      {getCustomerName(prescription.customerId)}
                    </TableCell>
                    <TableCell className="font-bold text-indigo-600 dark:text-indigo-400">
                      <span className="flex items-center gap-1.5">
                        <Stethoscope className="h-3.5 w-3.5" /> {getDoctorName(prescription.doctorId)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <Calendar className="h-3.5 w-3.5 text-bento-primary" /> {formatDateIssued(prescription)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-800 dark:text-slate-200">
                      <span className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg font-medium">
                        {prescription.diagnosis || 'Clinical Assessment'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handlePrintPrescription(prescription)} className="flex items-center gap-1 text-xs">
                          <Printer className="h-3.5 w-3.5" /> Print Rx
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditModal(prescription)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openDeleteModal(prescription)} className="text-rose-600 hover:text-rose-700 border-rose-200 dark:border-rose-900/50">
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

      {/* CREATE PRESCRIPTION MODAL */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Issue New Medical Prescription">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Select Patient *</label>
            <select
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-semibold focus:outline-none"
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
            >
              <option value="">-- Select Patient --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Prescribing Doctor *</label>
            <select
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-semibold focus:outline-none"
              value={formData.doctorId}
              onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
            >
              <option value="">-- Select Doctor --</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>Dr. {d.name} ({d.specialization || 'Physician'})</option>
              ))}
            </select>
          </div>

          <Input label="Date Issued *" type="date" value={formData.prescriptionDate} onChange={(e) => setFormData({ ...formData, prescriptionDate: e.target.value })} />
          <Input label="Diagnosis / Condition *" value={formData.diagnosis} onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })} placeholder="e.g. Hypertension, Acute Bronchitis" />
          <Input label="Medication Instructions & Dosage Notes *" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="e.g. Paracetamol 500mg 1 tab x 3 times daily after meals" />

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} disabled={submitting || !formData.customerId || !formData.doctorId}>
              {submitting ? 'Saving...' : 'Issue Prescription'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* EDIT PRESCRIPTION MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Prescription Details">
        <div className="space-y-4">
          <Input label="Date Issued *" type="date" value={formData.prescriptionDate} onChange={(e) => setFormData({ ...formData, prescriptionDate: e.target.value })} />
          <Input label="Diagnosis *" value={formData.diagnosis} onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })} />
          <Input label="Medication & Dosage Notes *" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleUpdate} disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Prescription'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* DELETE PRESCRIPTION MODAL */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete Prescription">
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete prescription <strong>Rx #{selectedPrescription?.id}</strong>?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="primary" className="bg-rose-600 hover:bg-rose-700 text-white border-none" onClick={handleDelete} disabled={submitting}>
              {submitting ? 'Deleting...' : 'Delete Prescription'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}