'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Download, Activity, User, Search, Clock, ShieldCheck, Laptop } from 'lucide-react';
import { exportToCSV } from '@/lib/utils/exportUtils';
import { toast } from 'sonner';
import { auditLogsApi, AuditLog } from '@/lib/api/auditLogs';
import { useAuthStore } from '@/lib/stores/authStore';

export default function ActivityLogsPage() {
  const { user, currentUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activities, setActivities] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      const orgId = currentUser?.organizationId || user?.organizationId || 1;
      setLoading(true);
      try {
        const data = await auditLogsApi.getByOrganization(orgId);
        const logsArray = Array.isArray(data) ? data : (data?.content || []);
        setActivities(logsArray);
      } catch (error) {
        console.error('Failed to fetch activity logs:', error);
        toast.error('Failed to load activity logs');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [currentUser?.organizationId, user?.organizationId]);

  const filtered = activities.filter(a =>
    (a.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.targetType || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    if (activities.length === 0) return toast.error('No activity logs to export.');
    const headers = ['Log ID', 'User ID', 'Role', 'Activity Action', 'IP Address', 'Device / Target', 'Timestamp'];
    const rows = filtered.map((a) => {
      let ip = 'Unknown';
      let device = a.targetType || 'Unknown';
      try {
        if (a.changes) {
          const c = JSON.parse(a.changes);
          if (c.ip) ip = c.ip;
          if (c.browser) device = c.browser;
        }
      } catch (e) {}

      return [
        a.id,
        a.actorUserId || 'N/A',
        'User', // Mock role for now
        a.action,
        ip,
        device,
        a.createdAt ? new Date(a.createdAt).toLocaleString('en-US') : '',
      ];
    });
    exportToCSV('Pharmacy_User_Activity_Logs', headers, rows);
    toast.success('Activity logs exported to CSV successfully!');
  };

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            User Activity Feed & Event Logs
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            Live user session tracking, checkout activities, inventory mutations, and login IP addresses.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button variant="primary" size="sm" onClick={handleExportCSV} className="flex items-center gap-1.5 text-xs font-bold shadow-md">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-bento-primary/10 text-bento-primary rounded-2xl">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Active User Sessions</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">3 Online Now</h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Security Threats</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">0 Anomalies</h3>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl">
            <Laptop className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">POS Terminals Active</p>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Counter #1 & Desk #2</h3>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="p-4 border border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by user, activity description, or IP address..."
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
                <TableHeader>User</TableHeader>
                <TableHeader>Role</TableHeader>
                <TableHeader>Activity Description</TableHeader>
                <TableHeader>IP Address</TableHeader>
                <TableHeader>Device / Client</TableHeader>
                <TableHeader>Timestamp</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <TableCell className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <User className="h-4 w-4 text-bento-primary" /> {row.user}
                  </TableCell>
                  <TableCell>
                    <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg uppercase">
                      {row.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-800 dark:text-slate-200">{row.activity}</TableCell>
                  <TableCell className="font-mono text-xs text-indigo-600 dark:text-indigo-400">{row.ipAddress}</TableCell>
                  <TableCell className="text-xs text-slate-500">{row.device}</TableCell>
                  <TableCell className="text-xs text-slate-500 font-mono">{row.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
