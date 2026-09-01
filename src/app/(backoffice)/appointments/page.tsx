'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Video,
  Building,
  RefreshCw,
  Loader2,
  QrCode,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Phone,
  Mail,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';
import { appointmentsApi, AppointmentResponse } from '@/lib/api/appointments';
import { doctorsApi, Doctor } from '@/lib/api/doctors';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export default function BackofficeAppointmentsPage() {
  const { currentBranch, selectedBranchId, user, currentUser } = useAuthStore();
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('ALL');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('ALL');
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentResponse | null>(null);

  // Auto-detect if logged-in user is a regular Doctor
  const roleName = (currentUser?.roleName || user?.roleName || (user as any)?.role?.name || '').toUpperCase();
  const isSuperAdmin = roleName.includes('SUPERADMIN') || roleName.includes('ADMIN') || roleName.includes('OWNER');
  const isDoctorRole = roleName.includes('DOCTOR') && !isSuperAdmin;

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [aptRes, docRes] = await Promise.allSettled([
        appointmentsApi.getAll(0, 100),
        doctorsApi.listAll(0, 50),
      ]);

      if (aptRes.status === 'fulfilled') {
        setAppointments(aptRes.value || []);
      }
      if (docRes.status === 'fulfilled') {
        const docData = docRes.value as any;
        setDoctors(Array.isArray(docData) ? docData : (docData?.content || []));
      }
    } catch (err: any) {
      console.warn('Error loading appointments:', err);
      toast.error('Failed to load appointments from server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Find linked doctor profile for logged-in user if Doctor role
  const loggedInDoctor = React.useMemo(() => {
    if (!isDoctorRole) return null;
    const username = (currentUser?.username || user?.username || '').toLowerCase();
    const name = (currentUser?.name || user?.name || '').toLowerCase();
    return doctors.find(
      (d) =>
        (d.username && d.username.toLowerCase() === username) ||
        (d.name && d.name.toLowerCase().includes(username)) ||
        (d.name && d.name.toLowerCase().includes(name))
    );
  }, [isDoctorRole, user, currentUser, doctors]);

  // Doctor search keywords
  const doctorKeywords = React.useMemo(() => {
    if (!isDoctorRole) return [];
    const username = (currentUser?.username || user?.username || '').toLowerCase().trim();
    const name = (currentUser?.name || user?.name || '').toLowerCase().trim();
    const docName = (loggedInDoctor?.name || '').toLowerCase().trim();
    return [username, name, docName].filter(Boolean);
  }, [isDoctorRole, user, currentUser, loggedInDoctor]);

  // Extract unique branches from loaded appointments
  const availableBranches = React.useMemo(() => {
    const map = new Map<string, string>();
    appointments.forEach((a) => {
      const b = a.branchName || a.clinicName;
      if (b && !b.toLowerCase().includes('telehealth') && !b.toLowerCase().includes('online')) {
        map.set(b.toLowerCase().trim(), b);
      }
    });
    return Array.from(map.values());
  }, [appointments]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await appointmentsApi.updateStatus(id, newStatus);
      toast.success(`Appointment #${id} updated to ${newStatus}`);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );
      if (selectedAppointment?.id === id) {
        setSelectedAppointment((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      (apt.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.patientPhone || '').includes(searchTerm) ||
      (apt.doctorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.branchName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.clinicName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.appointmentNumber || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || apt.status === statusFilter;
    
    // 1. Doctor Filter: If user is a Doctor, strictly show only their own appointments
    let matchesDoctor = true;
    if (isDoctorRole) {
      const aptDoc = (apt.doctorName || '').toLowerCase();
      matchesDoctor =
        (loggedInDoctor && apt.doctorId === loggedInDoctor.id) ||
        doctorKeywords.some((kw) => aptDoc.includes(kw) || kw.includes(aptDoc));
    } else if (selectedDoctorFilter !== 'ALL') {
      matchesDoctor =
        apt.doctorId?.toString() === selectedDoctorFilter ||
        apt.doctorName === selectedDoctorFilter;
    }

    // 2. Branch Filter: Match selected branch or active work branch
    let matchesBranch = true;
    if (selectedBranchFilter !== 'ALL') {
      const filterBr = selectedBranchFilter.toLowerCase();
      const aptBr = (apt.branchName || '').toLowerCase();
      const aptCl = (apt.clinicName || '').toLowerCase();
      matchesBranch =
        aptBr.includes(filterBr) ||
        filterBr.includes(aptBr) ||
        aptCl.includes(filterBr) ||
        filterBr.includes(aptCl);
    }

    return matchesSearch && matchesStatus && matchesDoctor && matchesBranch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Calendar className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Patient Appointments & Telehealth Queue
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase">
              Front Office Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time queue of patient bookings submitted from Front Office (Port 3001)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="rounded-2xl"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <a
            href="http://localhost:3001/appointments"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gradient-to-r from-[#04649C] to-[#24A4EC] text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center gap-1.5 hover:opacity-90"
          >
            <span>Open Patient Booking (Port 3001)</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patient name, phone, doctor or APT#..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending (រង់ចាំ)</option>
            <option value="CONFIRMED">Confirmed (បានបញ្ជាក់)</option>
            <option value="IN_CONSULTATION">In Consultation (កំពុងពិគ្រោះ)</option>
            <option value="COMPLETED">Completed (រួចរាល់)</option>
            <option value="CANCELLED">Cancelled (បោះបង់)</option>
          </select>

          <select
            value={selectedBranchFilter}
            onChange={(e) => setSelectedBranchFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
          >
            <option value="ALL">All Branches (គ្រប់សាខា)</option>
            {availableBranches.map((br) => (
              <option key={br} value={br}>
                {br}
              </option>
            ))}
          </select>

          {isDoctorRole ? (
            <div className="px-3.5 py-2.5 bg-sky-500/10 border border-sky-500/30 rounded-2xl text-xs font-black text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
              <span>My Queue ({user?.name || user?.username})</span>
            </div>
          ) : (
            <select
              value={selectedDoctorFilter}
              onChange={(e) => setSelectedDoctorFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="ALL">All Doctors (គ្រប់វេជ្ជបណ្ឌិត)</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialty})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Appointments List & Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Appointments Table (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Appointments ({filteredAppointments.length})
              </h3>
              {isDoctorRole && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-500/10 text-sky-600 border border-sky-500/20">
                  Doctor View: {user?.name || user?.username}
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 font-bold">Live database items</span>
          </div>

          {loading ? (
            <div className="p-16 text-center flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#04649C] dark:text-[#24A4EC]" />
              <p className="text-xs font-bold text-slate-400">Loading appointments queue...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs space-y-2">
              <Calendar className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p>No appointments match the criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold text-slate-400 uppercase">
                    <th className="py-3 px-4">Ticket / Patient</th>
                    <th className="py-3 px-4">Doctor & Specialty</th>
                    <th className="py-3 px-4">Branch / Location</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAppointments.map((apt) => {
                    const isSelected = selectedAppointment?.id === apt.id;
                    return (
                      <tr
                        key={apt.id}
                        onClick={() => setSelectedAppointment(apt)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-sky-50 dark:bg-sky-950/40'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-black text-slate-900 dark:text-white font-mono text-[11px]">
                            {apt.appointmentNumber || `APT-#${apt.id}`}
                          </div>
                          <div className="text-xs font-bold text-[#04649C] dark:text-[#24A4EC]">{apt.patientName}</div>
                          <div className="text-[10px] text-slate-400">{apt.patientPhone}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{apt.doctorName}</div>
                          <div className="text-[10px] text-slate-400">{apt.doctorSpecialty}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold">
                            <Building className="h-3.5 w-3.5 text-[#04649C] dark:text-[#24A4EC] shrink-0" />
                            <span className="truncate max-w-[140px]">{apt.branchName || apt.clinicName || 'Main Branch'}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{apt.type}</span>
                        </td>

                        <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-300">
                          <div>{apt.appointmentDate}</div>
                          <div className="text-[10px] text-slate-400 font-bold">{apt.appointmentTime}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            {apt.type}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                              apt.status === 'CONFIRMED'
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : apt.status === 'COMPLETED'
                                ? 'bg-sky-500/10 text-sky-600 border-sky-500/20'
                                : apt.status === 'CANCELLED'
                                ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            }`}
                          >
                            {apt.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {apt.status !== 'CONFIRMED' && (
                              <button
                                onClick={() => handleUpdateStatus(apt.id, 'CONFIRMED')}
                                className="px-2 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-[10px] font-black"
                              >
                                Confirm
                              </button>
                            )}
                            {apt.status !== 'COMPLETED' && (
                              <button
                                onClick={() => handleUpdateStatus(apt.id, 'COMPLETED')}
                                className="px-2 py-1 rounded-xl bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 text-[10px] font-black"
                              >
                                Done
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Appointment Details Drawer (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm space-y-5">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-[#04649C] dark:text-[#24A4EC]" />
              <span>Appointment Dossier</span>
            </h3>

            {selectedAppointment ? (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-sky-500">
                      {selectedAppointment.appointmentNumber || `APT-#${selectedAppointment.id}`}
                    </span>
                    <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {selectedAppointment.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-500">Patient Information:</p>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">{selectedAppointment.patientName}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{selectedAppointment.patientPhone || 'N/A'}</span>
                    </p>
                    {selectedAppointment.patientEmail && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span>{selectedAppointment.patientEmail}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Doctor:</span>
                    <span className="font-black text-slate-900 dark:text-white">{selectedAppointment.doctorName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Specialty:</span>
                    <span className="font-bold text-sky-600">{selectedAppointment.doctorSpecialty}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Schedule:</span>
                    <span className="font-bold">{selectedAppointment.appointmentDate} @ {selectedAppointment.appointmentTime}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Branch:</span>
                    <span className="font-bold truncate">{selectedAppointment.clinicName || 'Main Central Branch'}</span>
                  </div>
                </div>

                {selectedAppointment.notes && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                    <span className="font-bold text-amber-700 dark:text-amber-300 block mb-1">Patient Symptoms:</span>
                    <p className="text-slate-700 dark:text-slate-300">{selectedAppointment.notes}</p>
                  </div>
                )}

                {/* Status Action Buttons */}
                <div className="space-y-2 pt-2">
                  <p className="text-[11px] font-bold text-slate-400">Update Status Workflow:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'CONFIRMED')}
                      className="py-2 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors text-center"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'IN_CONSULTATION')}
                      className="py-2 px-3 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors text-center"
                    >
                      In Consult
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'COMPLETED')}
                      className="py-2 px-3 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 transition-colors text-center"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'CANCELLED')}
                      className="py-2 px-3 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors text-center"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <FileText className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p>Click an appointment from the table to view patient details and manage status.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
