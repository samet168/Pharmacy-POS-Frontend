'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Monitor, RefreshCw, Plus, Search, CheckCircle, Wifi, Printer, DollarSign, ShieldCheck, Download, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/utils/exportUtils';

const MOCK_TERMINALS = [
  { id: 1, code: 'POS-T01', name: 'Main Counter #1 POS Terminal', branchName: 'HQ Monivong Branch', ipAddress: '192.168.1.101', printerStatus: 'ONLINE (80mm Thermal)', drawerStatus: 'CLOSED', status: 'ACTIVE', cashier: 'Super Admin' },
  { id: 2, code: 'POS-T02', name: 'Prescription Desk Terminal #2', branchName: 'HQ Monivong Branch', ipAddress: '192.168.1.102', printerStatus: 'ONLINE (80mm Thermal)', drawerStatus: 'OPEN', status: 'ACTIVE', cashier: 'Sokha Cashier' },
  { id: 3, code: 'POS-T03', name: 'Downtown Branch Counter #1', branchName: 'Downtown Branch', ipAddress: '192.168.1.110', printerStatus: 'ONLINE (A4 Invoice)', drawerStatus: 'CLOSED', status: 'ACTIVE', cashier: 'Vannak Admin' },
  { id: 4, code: 'POS-T04', name: 'Drive-Thru / Express Counter', branchName: 'Downtown Branch', ipAddress: '192.168.1.112', printerStatus: 'OFFLINE (Paper Low)', drawerStatus: 'CLOSED', status: 'INACTIVE', cashier: 'Unassigned' },
];

export default function PosTerminalsPage() {
  const [terminals, setTerminals] = useState(MOCK_TERMINALS);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    ipAddress: '',
    cashier: '',
  });

  const handleExportCSV = () => {
    if (terminals.length === 0) return toast.error('No terminals data to export.');
    const headers = ['Terminal ID', 'Terminal Code', 'Counter Name', 'Branch Location', 'IP Address', 'Printer Status', 'Current Cashier', 'Status'];
    const rows = terminals.map((t) => [
      t.id,
      t.code,
      t.name,
      t.branchName,
      t.ipAddress,
      t.printerStatus,
      t.cashier,
      t.status,
    ]);
    exportToCSV('Pharmacy_POS_Terminals_Directory', headers, rows);
    toast.success('POS Terminals directory exported to CSV!');
  };

  const handleCreate = () => {
    if (!formData.name || !formData.code) {
      toast.error('Please fill in required fields');
      return;
    }
    const newT = {
      id: Date.now(),
      code: formData.code,
      name: formData.name,
      branchName: 'HQ Monivong Branch',
      ipAddress: formData.ipAddress || '192.168.1.120',
      printerStatus: 'ONLINE (80mm Thermal)',
      drawerStatus: 'CLOSED',
      status: 'ACTIVE',
      cashier: formData.cashier || 'Super Admin',
    };
    setTerminals([newT, ...terminals]);
    toast.success('POS Terminal registered successfully!');
    setShowCreateModal(false);
    setFormData({ code: '', name: '', ipAddress: '', cashier: '' });
  };

  const filteredTerminals = terminals.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.ipAddress.includes(searchTerm)
  );

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            POS Terminals & Cash Counters
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            Monitor live cashier counters, thermal printer connectivity, and active POS operators.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex items-center gap-1.5 text-xs font-bold">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 font-bold shadow-md">
            <Plus className="h-4 w-4" /> Add POS Terminal
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-bento-primary/10 text-bento-primary dark:text-bento-primary-dark rounded-2xl">
            <Monitor className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Cashier Terminals</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{terminals.length}</h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <Printer className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Printers Online</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {terminals.filter(t => t.printerStatus.includes('ONLINE')).length}
            </h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Wifi className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Local Subnet Network</p>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">192.168.1.x / 24</h3>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="p-4 border border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by terminal code, counter name, or IP address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Terminals Table */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow className="bg-slate-50/80 dark:bg-slate-800/60">
                <TableHeader>Terminal Code</TableHeader>
                <TableHeader>Counter Name</TableHeader>
                <TableHeader>Store Branch</TableHeader>
                <TableHeader>IP Address</TableHeader>
                <TableHeader>Thermal Printer</TableHeader>
                <TableHeader>Active Cashier</TableHeader>
                <TableHeader>Status</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTerminals.map((t) => (
                <TableRow key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <TableCell className="font-mono text-xs font-bold text-bento-primary dark:text-bento-primary-dark">
                    {t.code}
                  </TableCell>
                  <TableCell className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-indigo-500" /> {t.name}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 dark:text-slate-400">{t.branchName}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-700 dark:text-slate-300">{t.ipAddress}</TableCell>
                  <TableCell className="text-xs">
                    <span className={`px-2.5 py-0.5 rounded-full font-semibold ${
                      t.printerStatus.includes('ONLINE') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {t.printerStatus}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.cashier}</TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                      t.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {t.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* CREATE MODAL */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Register New POS Terminal">
        <div className="space-y-4">
          <Input label="Terminal Code *" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="POS-T05" />
          <Input label="Counter Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Counter #3 Express POS" />
          <Input label="Device IP Address" value={formData.ipAddress} onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })} placeholder="192.168.1.105" />
          <Input label="Assigned Cashier" value={formData.cashier} onChange={(e) => setFormData({ ...formData, cashier: e.target.value })} placeholder="Super Admin" />

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} disabled={!formData.name || !formData.code}>
              Register Terminal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
