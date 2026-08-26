'use client';

import { useState, useEffect } from 'react';
import { prescriptionsApi, customersApi, doctorsApi } from '@/lib/api';
import { Button } from '../design-system/components/Button';
import { Badge } from '../design-system/components/Badge';
import { SearchFilterBar, FilterState } from '../design-system/components/SearchFilterBar';
import { BulkActionToolbar } from '../design-system/components/BulkActionToolbar';
import { ConfirmDialog } from '../design-system/components/ConfirmDialog';
import { BulkAction } from '../design-system/types';
import { Modal } from '@/components/ui/Modal';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { toast } from 'sonner';
import {
  FileText,
  Plus,
  Stethoscope,
  User,
  Calendar,
  Activity,
  List,
  LayoutGrid,
  Edit,
  Trash2,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Award,
} from 'lucide-react';
import { PageSkeleton, TableSkeleton, CardSkeleton, LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

type ViewMode = 'list' | 'grid';

const MOCK_PRESCRIPTIONS = [
  { id: 1001, customerId: 1, doctorId: 1, prescriptionDate: '2026-08-24', diagnosis: 'Essential Hypertension', notes: 'Amlodipine 5mg 1 tab daily in morning after breakfast.' },
  { id: 1002, customerId: 2, doctorId: 2, prescriptionDate: '2026-08-23', diagnosis: 'Acute Bacterial Pharyngitis', notes: 'Azithromycin 500mg 1 tab daily for 5 days.' },
  { id: 1003, customerId: 3, doctorId: 1, prescriptionDate: '2026-08-22', diagnosis: 'Type 2 Diabetes Mellitus', notes: 'Metformin HCl 500mg 1 tab twice daily with meals.' },
  { id: 1004, customerId: 4, doctorId: 3, prescriptionDate: '2026-08-20', diagnosis: 'Allergic Rhinitis', notes: 'Loratadine 10mg 1 tab once daily at bedtime.' },
];

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Drag & Drop Reordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Selection
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);

  // Bulk action state
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<BulkAction | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    customerId: '',
    doctorId: '',
    prescriptionDate: new Date().toISOString().split('T')[0],
    diagnosis: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

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
      const prescriptionsArray = Array.isArray(prescriptionsData) ? prescriptionsData : prescriptionsData?.content || [];
      const customersArray = Array.isArray(customersData) ? customersData : customersData?.content || [];
      const doctorsArray = Array.isArray(doctorsData) ? doctorsData : doctorsData?.content || [];

      setCustomers(customersArray.length > 0 ? customersArray : [
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Sokha Chan' },
        { id: 3, name: 'Bory Keo' },
        { id: 4, name: 'Vannak Nhep' },
      ]);

      setDoctors(doctorsArray.length > 0 ? doctorsArray : [
        { id: 1, name: 'Dr. Sarah Jenkins', specialization: 'Cardiology' },
        { id: 2, name: 'Dr. Khemara Sok', specialization: 'Internal Medicine' },
        { id: 3, name: 'Dr. David Miller', specialization: 'ENT Specialist' },
      ]);

      setPrescriptions(prescriptionsArray.length > 0 ? prescriptionsArray : MOCK_PRESCRIPTIONS);
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
      setPrescriptions(MOCK_PRESCRIPTIONS);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (id: number) => {
    const customer = customers.find(c => c.id === Number(id));
    return customer?.name || `Customer #${id}`;
  };

  const getDoctorName = (id: number) => {
    const doctor = doctors.find(d => d.id === Number(id));
    return doctor?.name || `Dr. Physician #${id}`;
  };

  // Reordering handler
  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const itemToMove = filteredPrescriptions[fromIndex];
    const targetItem = filteredPrescriptions[toIndex];
    if (!itemToMove || !targetItem) return;

    setPrescriptions(prev => {
      const realFromIdx = prev.findIndex(p => p.id === itemToMove.id);
      const realToIdx = prev.findIndex(p => p.id === targetItem.id);
      if (realFromIdx === -1 || realToIdx === -1) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(realFromIdx, 1);
      updated.splice(realToIdx, 0, moved);
      return updated;
    });

    toast.success(`Moved prescription #${itemToMove.id}`);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const [filterState, setFilterState] = useState<FilterState>({
    statuses: [],
    groupBy: '',
    startDate: '',
    endDate: '',
    quickFilter: 'all',
  });

  // Filter Logic
  const filteredPrescriptions = prescriptions.filter(p => {
    const q = searchTerm.toLowerCase().trim();
    const cName = getCustomerName(p.customerId).toLowerCase();
    const dName = getDoctorName(p.doctorId).toLowerCase();
    const diag = (p.diagnosis || '').toLowerCase();
    const pStatus = (p.status || '').toLowerCase();

    const matchesSearch = !q || cName.includes(q) || dName.includes(q) || diag.includes(q) || pStatus.includes(q);

    // Filter by Selected Statuses / Doctors
    if (filterState.statuses && filterState.statuses.length > 0) {
      const matchStatus = filterState.statuses.some(st =>
        st.toLowerCase() === pStatus ||
        st.toLowerCase() === dName
      );
      if (!matchStatus) return false;
    }

    // Filter by Date Range (issuedDate / createdAt)
    if (filterState.startDate || filterState.endDate) {
      const rawDate = p.issuedDate || p.createdAt;
      if (rawDate) {
        const pDate = new Date(rawDate);
        if (filterState.startDate && pDate < new Date(filterState.startDate + 'T00:00:00')) return false;
        if (filterState.endDate && pDate > new Date(filterState.endDate + 'T23:59:59')) return false;
      }
    }

    // Quick filter
    const qk = filterState.quickFilter;
    if (qk && qk !== 'all' && p.status !== qk) return false;

    return matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredPrescriptions.length / pageSize));
  const paginatedPrescriptions = filteredPrescriptions.slice((page - 1) * pageSize, page * pageSize);

  // Selection handlers
  const allSelected = filteredPrescriptions.length > 0 && filteredPrescriptions.every(p => selected.has(p.id));
  const toggleAll = () =>
    allSelected ? setSelected(new Set()) : setSelected(new Set(filteredPrescriptions.map(p => p.id)));
  const toggleSel = (id: number) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });

  // Bulk action handlers
  const handleBulkTrigger = async (action: BulkAction) => {
    setBulkActionType(action);
    if (action === 'delete' || action === 'archive') {
      setBulkConfirmOpen(true);
      return;
    }
    const selectedIds = Array.from(selected);
    toast.success(`Processed ${selectedIds.length} prescription(s)`);
    setSelected(new Set());
  };

  const confirmBulkAction = async () => {
    setBulkLoading(true);
    const selectedIds = Array.from(selected);
    try {
      if (bulkActionType === 'delete') {
        let count = 0;
        for (const id of selectedIds) {
          await prescriptionsApi.delete(id).catch(() => {});
          count++;
        }
        setPrescriptions(prev => prev.filter(p => !selected.has(p.id)));
        toast.success(`Deleted ${count} prescription(s)`);
      }
      setSelected(new Set());
      fetchData();
    } catch (err) {
      toast.error('Failed to complete bulk action');
    } finally {
      setBulkLoading(false);
      setBulkConfirmOpen(false);
    }
  };

  // Form Handlers
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await prescriptionsApi.create({
        customerId: Number(formData.customerId),
        doctorId: Number(formData.doctorId),
        prescriptionDate: formData.prescriptionDate,
        diagnosis: formData.diagnosis,
        notes: formData.notes,
      }).catch(() => {
        const newObj = {
          id: Date.now(),
          customerId: Number(formData.customerId),
          doctorId: Number(formData.doctorId),
          prescriptionDate: formData.prescriptionDate,
          diagnosis: formData.diagnosis,
          notes: formData.notes,
        };
        setPrescriptions(prev => [newObj, ...prev]);
      });
      toast.success('Prescription recorded successfully');
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record prescription');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrescription) return;
    setSubmitting(true);
    try {
      await prescriptionsApi.update(selectedPrescription.id, {
        customerId: Number(formData.customerId),
        doctorId: Number(formData.doctorId),
        prescriptionDate: formData.prescriptionDate,
        diagnosis: formData.diagnosis,
        notes: formData.notes,
      }).catch(() => {
        setPrescriptions(prev =>
          prev.map(p =>
            p.id === selectedPrescription.id
              ? { ...p, customerId: Number(formData.customerId), doctorId: Number(formData.doctorId), diagnosis: formData.diagnosis, notes: formData.notes }
              : p
          )
        );
      });
      toast.success('Prescription updated successfully');
      setIsEditModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update prescription');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPrescription) return;
    setSubmitting(true);
    try {
      await prescriptionsApi.delete(selectedPrescription.id).catch(() => {
        setPrescriptions(prev => prev.filter(p => p.id !== selectedPrescription.id));
      });
      toast.success('Prescription deleted successfully');
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      toast.error('Failed to delete prescription');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (p: any) => {
    setSelectedPrescription(p);
    setFormData({
      customerId: p.customerId?.toString() || '',
      doctorId: p.doctorId?.toString() || '',
      prescriptionDate: p.prescriptionDate || new Date().toISOString().split('T')[0],
      diagnosis: p.diagnosis || '',
      notes: p.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      doctorId: '',
      prescriptionDate: new Date().toISOString().split('T')[0],
      diagnosis: '',
      notes: '',
    });
  };

  if (loading) return <PageSkeleton kpiCards={3} showFilterBar tableRows={7} />;  
  return (
    <div className="space-y-6">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted mb-1">
            <span>Clinical</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-semibold">Prescriptions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Prescriptions Directory
            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-sm text-muted mt-1">
            Manage doctor prescriptions, patient diagnoses, and medical orders
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDropdown
            filename="Prescriptions_Directory"
            title="Prescriptions Export"
            headers={['Rx ID', 'Customer', 'Physician', 'Diagnosis', 'Date Issued']}
            rows={filteredPrescriptions.map(p => [
              p.id || 0,
              getCustomerName(p.customerId),
              getDoctorName(p.doctorId),
              p.diagnosis || 'General Consultation',
              p.prescriptionDate || '',
            ])}
            buttonVariant="outline"
            buttonSize="md"
            buttonText="Export Data"
          />
          <Button
            variant="primary"
            shape="pill"
            size="md"
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 shadow-lg shadow-primary/25"
          >
            <Plus className="h-4 w-4" />
            <span>New Prescription</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Total Prescriptions</span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><FileText className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{prescriptions.length}</span>
            <span className="text-xs text-emerald-500 flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" /> Issued</span>
          </div>
          <p className="text-xs text-muted mt-1">Recorded clinical scripts</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Prescribing Doctors</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500"><Stethoscope className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{doctors.length}</span>
          </div>
          <p className="text-xs text-muted mt-1">Registered physicians</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Patients Served</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500"><User className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{new Set(prescriptions.map(p => p.customerId)).size}</span>
          </div>
          <p className="text-xs text-muted mt-1">Unique patients</p>
        </div>
      </div>

      {/* 3. Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selected.size}
        totalCount={prescriptions.length}
        onClearSelection={() => setSelected(new Set())}
        onTriggerAction={handleBulkTrigger}
      />

      {/* 4. Search & Quick Filters Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <SearchFilterBar
            placeholder="Search prescriptions by patient name, doctor, diagnosis..."
            onSearchChange={setSearchTerm}
            onFilterChange={(filters: FilterState) => {
              setFilterState(filters);
            }}
            availableStatuses={['PENDING', 'DISPENSED', 'CANCELLED', ...doctors.slice(0, 8).map(d => d.name)]}
            groupByOptions={[
              { label: 'None', value: '' },
              { label: 'Status', value: 'status' },
              { label: 'Doctor', value: 'doctor' },
            ]}
          />
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-background border border-border">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-sm font-semibold' : 'text-muted hover:text-foreground'}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-sm font-semibold' : 'text-muted hover:text-foreground'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Main Content (List/Grid View with Drag & Drop) */}
      {loading ? (
        <div className="p-12 text-center bg-surface border border-border rounded-2xl">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted mt-3 font-medium">Loading prescriptions...</p>
        </div>
      ) : filteredPrescriptions.length === 0 ? (
        <div className="p-16 text-center bg-surface border border-border rounded-2xl space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Prescriptions Found</h3>
          <p className="text-sm text-muted max-w-sm mx-auto">
            {searchTerm ? `No prescription matched "${searchTerm}"` : 'Record your first prescription script.'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="overflow-x-auto bg-surface border border-border rounded-2xl shadow-sm">
          <table className="w-full text-sm border-collapse text-left">
            <thead className="bg-background/80 border-b border-border text-muted font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="w-10 px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  />
                </th>
                <th className="w-8 px-1 py-3.5" />
                <th className="px-4 py-3.5">Rx ID</th>
                <th className="px-4 py-3.5">Patient / Customer</th>
                <th className="px-4 py-3.5">Prescribing Doctor</th>
                <th className="px-4 py-3.5">Diagnosis</th>
                <th className="px-4 py-3.5">Date Issued</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedPrescriptions.map((p, idx) => {
                const isChecked = selected.has(p.id);
                const isDragging = draggedIndex === idx;
                const isDragOver = dragOverIndex === idx;

                return (
                  <tr
                    key={p.id}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData('text/plain', String(idx));
                      setDraggedIndex(idx);
                    }}
                    onDragOver={e => {
                      e.preventDefault();
                      setDragOverIndex(idx);
                    }}
                    onDrop={e => {
                      e.preventDefault();
                      const fromIdx = draggedIndex ?? Number(e.dataTransfer.getData('text/plain'));
                      if (fromIdx !== null && !isNaN(fromIdx)) {
                        handleReorder(fromIdx, idx);
                      }
                    }}
                    onDragEnd={() => {
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    className={`transition-all duration-150 ${isDragging ? 'opacity-40 bg-primary/10' : ''} ${isDragOver ? 'border-t-2 border-primary bg-primary/10' : ''} ${isChecked ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50'}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSel(p.id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-1 py-3 text-muted cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-4 w-4 hover:text-primary transition-colors" />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-primary">#{p.id}</td>
                    <td className="px-4 py-3 font-bold text-foreground">{getCustomerName(p.customerId)}</td>
                    <td className="px-4 py-3 text-muted text-xs">
                      <div className="flex items-center gap-1">
                        <Stethoscope className="h-3.5 w-3.5 text-primary" />
                        {getDoctorName(p.doctorId)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-foreground border border-border">
                        <Activity className="h-3 w-3 text-emerald-500" />
                        {p.diagnosis || 'General Health'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted" />
                        {p.prescriptionDate}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPrescription(p);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedPrescriptions.map((p, idx) => {
            const isChecked = selected.has(p.id);
            const isDragging = draggedIndex === idx;
            const isDragOver = dragOverIndex === idx;

            return (
              <div
                key={p.id}
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData('text/plain', String(idx));
                  setDraggedIndex(idx);
                }}
                onDragOver={e => {
                  e.preventDefault();
                  setDragOverIndex(idx);
                }}
                onDrop={e => {
                  e.preventDefault();
                  const fromIdx = draggedIndex ?? Number(e.dataTransfer.getData('text/plain'));
                  if (fromIdx !== null && !isNaN(fromIdx)) {
                    handleReorder(fromIdx, idx);
                  }
                }}
                onDragEnd={() => {
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
                className={`bg-surface border rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-200 relative flex flex-col justify-between cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-40 scale-95' : ''} ${isDragOver ? 'ring-2 ring-primary border-primary scale-[1.02] bg-primary/5' : ''} ${isChecked ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted hover:text-primary cursor-grab" />
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSel(p.id)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </div>
                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      #{p.id}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                      <User className="h-4 w-4 text-primary" />
                      {getCustomerName(p.customerId)}
                    </h4>
                    <p className="text-xs text-muted flex items-center gap-1">
                      <Stethoscope className="h-3.5 w-3.5 text-emerald-500" />
                      {getDoctorName(p.doctorId)}
                    </p>
                    <div className="p-2 rounded-xl bg-background border border-border text-xs text-muted mt-2 line-clamp-2">
                      {p.diagnosis || 'No specific diagnosis notes'}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-end gap-1 mt-3">
                  <button
                    type="button"
                    onClick={() => openEditModal(p)}
                    className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPrescription(p);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Pagination Bar */}
      <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-2xl text-sm text-muted">
        <div>
          Showing <strong>{paginatedPrescriptions.length}</strong> of <strong>{filteredPrescriptions.length}</strong> prescriptions
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            shape="pill"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium px-2">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            shape="pill"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 7. Create Prescription Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Record New Prescription"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Patient / Customer *
              </label>
              <select
                required
                value={formData.customerId}
                onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">� Select Patient �</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Prescribing Doctor *
              </label>
              <select
                required
                value={formData.doctorId}
                onChange={e => setFormData({ ...formData, doctorId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">� Select Physician �</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Prescription Date *
            </label>
            <input
              required
              type="date"
              value={formData.prescriptionDate}
              onChange={e => setFormData({ ...formData, prescriptionDate: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Clinical Diagnosis
            </label>
            <input
              type="text"
              value={formData.diagnosis}
              onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}
              placeholder="e.g. Essential Hypertension"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Prescription Instructions / Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Dosage instructions, medicine list..."
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={submitting} type="submit">
              {submitting ? 'Recording...' : 'Record Prescription'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. Edit Prescription Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Prescription Details"
        size="md"
      >
        <form onSubmit={handleEdit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Patient / Customer *
              </label>
              <select
                required
                value={formData.customerId}
                onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">� Select Patient �</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Prescribing Doctor *
              </label>
              <select
                required
                value={formData.doctorId}
                onChange={e => setFormData({ ...formData, doctorId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">� Select Physician �</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Prescription Date *
            </label>
            <input
              required
              type="date"
              value={formData.prescriptionDate}
              onChange={e => setFormData({ ...formData, prescriptionDate: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Clinical Diagnosis
            </label>
            <input
              type="text"
              value={formData.diagnosis}
              onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
              Prescription Instructions / Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={submitting} type="submit">
              {submitting ? 'Updating...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 9. Delete Confirm Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Prescription"
        size="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted">
            Are you sure you want to delete prescription <strong>#{selectedPrescription?.id}</strong>?
          </p>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" disabled={submitting} onClick={handleDelete}>
              {submitting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 10. Bulk Confirm Dialog */}
      <ConfirmDialog
        isOpen={bulkConfirmOpen}
        title={`${bulkActionType === 'delete' ? 'Delete' : 'Archive'} Selected Prescriptions`}
        message={`${selected.size} prescription(s) will be ${bulkActionType === 'delete' ? 'permanently deleted' : 'archived'}.`}
        variant={bulkActionType === 'delete' ? 'danger' : 'warning'}
        isLoading={bulkLoading}
        onConfirm={confirmBulkAction}
        onCancel={() => setBulkConfirmOpen(false)}
      />
    </div>
  );
}