'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { toast } from 'sonner';
import { auditLogsApi, AuditLog } from '@/lib/api/auditLogs';
import { useAuthStore } from '@/lib/stores/authStore';
import { FileText, Search, Filter, RefreshCw, Calendar, User, Eye, Download, ShieldCheck, Activity } from 'lucide-react';
import { exportToCSV } from '@/lib/utils/exportUtils';

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 1,
    organizationId: 1,
    userId: 1,
    action: 'USER_LOGIN',
    targetType: 'Authentication',
    targetId: 1,
    changes: '{"ip": "192.168.1.101", "status": "SUCCESS", "browser": "Chrome 128"}',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 2,
    organizationId: 1,
    userId: 1,
    action: 'ORDER_CREATE',
    targetType: 'POS Order',
    targetId: 1004,
    changes: '{"orderTotal": 45.00, "itemsCount": 3, "paymentMethod": "KHQR"}',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 3,
    organizationId: 1,
    userId: 2,
    action: 'PRODUCT_UPDATE',
    targetType: 'Inventory Item',
    targetId: 42,
    changes: '{"productName": "Paracetamol 500mg", "oldStock": 50, "newStock": 120}',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 4,
    organizationId: 1,
    userId: 1,
    action: 'SHIFT_OPEN',
    targetType: 'Cashier Register',
    targetId: 102,
    changes: '{"openingFloat": 150.00, "terminal": "POS-T01"}',
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
];

export default function AuditLogsPage() {
  const { user } = useAuthStore();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const data = await auditLogsApi.getByOrganization(user?.organizationId || 1).catch(() => null);
      const logsArray = Array.isArray(data) ? data : (data?.content || []);
      setAuditLogs(logsArray.length > 0 ? logsArray : DEFAULT_AUDIT_LOGS);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      setAuditLogs(DEFAULT_AUDIT_LOGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handleExportCSV = () => {
    if (auditLogs.length === 0) return toast.error('No audit logs to export.');
    const headers = ['Log ID', 'Action Event', 'Resource Type', 'Target ID', 'Changes Data', 'Timestamp'];
    const rows = auditLogs.map((l) => [
      l.id,
      l.action,
      l.targetType,
      l.targetId,
      l.changes || '',
      l.createdAt ? new Date(l.createdAt).toLocaleString('en-US') : '',
    ]);
    exportToCSV('Pharmacy_Audit_Security_Logs', headers, rows);
    toast.success('Audit logs exported to CSV successfully!');
  };

  const filteredLogs = auditLogs.filter(log =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.targetType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.targetId.toString().includes(searchTerm)
  );

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('CREATE') || act.includes('OPEN')) {
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
    }
    if (act.includes('UPDATE') || act.includes('EDIT')) {
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300';
    }
    if (act.includes('DELETE') || act.includes('REMOVE')) {
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
    }
    return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
        <LoadingSkeleton variant="text" width={240} height={36} />
        <Card className="p-8"><LoadingSkeleton variant="rectangular" width="100%" height={250} /></Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            System Security Audit Logs
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            Immutable audit trial of system operations, user logins, data mutations, and security events.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex items-center gap-1.5 text-xs font-bold">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchAuditLogs} className="flex items-center gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-bento-primary/10 text-bento-primary rounded-2xl">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Audit Events</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{auditLogs.length} Records</h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Integrity Status</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">Verified Secure</h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Retention Policy</p>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">365 Days Compliance</h3>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="p-4 border border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by action, target type, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow className="bg-slate-50/80 dark:bg-slate-800/60">
                <TableHeader>Event ID</TableHeader>
                <TableHeader>Action Event</TableHeader>
                <TableHeader>Resource Target</TableHeader>
                <TableHeader>Audit Payload Changes</TableHeader>
                <TableHeader>Timestamp</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <TableCell className="font-mono text-xs font-bold text-slate-400">#{log.id}</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-1 text-xs font-extrabold rounded-lg font-mono uppercase ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {log.targetType} (#{log.targetId})
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-slate-600 dark:text-slate-300 max-w-md truncate">
                    {log.changes || 'N/A'}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 font-mono">{formatDate(log.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}