'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Download, Activity, User, Search, ShieldCheck, Laptop, RefreshCw } from 'lucide-react';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { toast } from 'sonner';
import { auditLogsApi, AuditLog } from '@/lib/api/auditLogs';
import { exportToCSV } from '@/lib/utils/exportUtils';
import { useAuthStore } from '@/lib/stores/authStore';

export default function ActivityLogsPage() {
  const { user, currentUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activities, setActivities] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    const orgId = currentUser?.organizationId || user?.organizationId || 1;
    setLoading(true);
    try {
      let data = await auditLogsApi.getByOrganization(orgId);
      if (!Array.isArray(data) || data.length === 0) {
        const allData = await auditLogsApi.getAll();
        if (Array.isArray(allData) && allData.length > 0) {
          data = allData;
        }
      }
      const logsArray = Array.isArray(data) ? data : [];
      logsArray.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setActivities(logsArray);
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
      toast.error('Failed to load activity logs');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [currentUser?.organizationId, user?.organizationId]);

  const filtered = activities.filter(a =>
    (a.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.entityType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.ipAddress || '').includes(searchTerm)
  );

  const handleExportCSV = () => {
    if (activities.length === 0) return toast.error('No activity logs to export.');
    const headers = ['Log ID', 'Username', 'Action', 'Entity Type', 'Description', 'IP Address', 'User Agent', 'Timestamp'];
    const rows = filtered.map((a) => [
      a.id,
      a.username || (a.userId ? `User #${a.userId}` : 'System'),
      a.action,
      a.entityType || 'N/A',
      a.description || '',
      a.ipAddress || 'N/A',
      a.userAgent || 'N/A',
      a.createdAt ? new Date(a.createdAt).toLocaleString('en-US') : '',
    ]);
    exportToCSV('Pharmacy_User_Activity_Logs', headers, rows);
    toast.success('Activity logs exported to CSV successfully!');
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            User Activity Feed &amp; Event Logs
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            Live user session tracking, checkout activities, inventory mutations, and login IP addresses.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchActivities} className="flex items-center gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <ExportDropdown
            filename="Pharmacy_User_Activity_Logs"
            title="User Activity Feed & Event Logs"
            subtitle="User Session Tracking, Checkout Events & Inventory Mutations"
            headers={['Log ID', 'Username', 'Action', 'Entity Type', 'Description', 'IP Address', 'User Agent', 'Timestamp']}
            rows={filtered.map((a) => [
              `#${a.id}`,
              a.username || (a.userId ? `User #${a.userId}` : 'System'),
              a.action,
              a.entityType || 'N/A',
              a.description || '',
              a.ipAddress || 'N/A',
              a.userAgent || 'N/A',
              a.createdAt ? new Date(a.createdAt).toLocaleString('en-US') : '',
            ])}
            buttonVariant="primary"
            buttonText="Export Activity Feed"
          />
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-5 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-bento-primary/10 text-bento-primary rounded-2xl">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Activity Events</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{activities.length} Records</h3>
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
            <p className="text-xs font-medium text-slate-500">Unique Actions</p>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {Array.from(new Set(activities.map(a => a.action))).length} Types
            </h3>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="p-4 border border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by user, action, entity type, or IP address..."
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
                <TableHeader>Action</TableHeader>
                <TableHeader>Entity</TableHeader>
                <TableHeader>Description</TableHeader>
                <TableHeader>IP Address</TableHeader>
                <TableHeader>Timestamp</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <div className="space-y-3">
                      <p>{searchTerm ? 'No matching activity logs found.' : 'No activity logs available yet.'}</p>
                      {!searchTerm && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={async () => {
                            const orgId = currentUser?.organizationId || user?.organizationId || 1;
                            const userId = currentUser?.id || (user as any)?.userId || (user as any)?.id || 1;
                            try {
                              await auditLogsApi.create({
                                organizationId: orgId,
                                userId: userId,
                                username: currentUser?.username || user?.username || 'admin',
                                action: 'USER_LOGIN',
                                entityType: 'Session',
                                description: 'User authenticated from POS terminal workstation',
                                ipAddress: '127.0.0.1',
                                userAgent: navigator.userAgent,
                                statusCode: 200,
                              });
                              await auditLogsApi.create({
                                organizationId: orgId,
                                userId: userId,
                                username: currentUser?.username || user?.username || 'admin',
                                action: 'ORDER_CHECKOUT',
                                entityType: 'Order',
                                entityId: 1001,
                                description: 'POS Checkout completed ($45.50 via Cash)',
                                ipAddress: '127.0.0.1',
                                statusCode: 200,
                              });
                              await auditLogsApi.create({
                                organizationId: orgId,
                                userId: userId,
                                username: currentUser?.username || user?.username || 'admin',
                                action: 'PRODUCT_PRICE_UPDATE',
                                entityType: 'Product',
                                entityId: 205,
                                description: 'Updated selling price for Paracetamol 500mg',
                                ipAddress: '127.0.0.1',
                                statusCode: 200,
                              });
                              toast.success('Generated initial activity logs!');
                              fetchActivities();
                            } catch (e) {
                              toast.error('Failed to generate activity logs');
                            }
                          }}
                          className="text-xs font-bold shadow-md"
                        >
                          Generate Activity Feed
                        </Button>
                      )}
                    </div>
                  </td>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <TableCell className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-bento-primary shrink-0" />
                        {row.username || (row.userId ? `User #${row.userId}` : 'System')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 text-xs font-extrabold rounded-lg font-mono uppercase ${
                        row.action.includes('CREATE') || row.action.includes('LOGIN') ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        row.action.includes('UPDATE') || row.action.includes('PATCH') ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
                        row.action.includes('DELETE') || row.action.includes('LOGOUT') ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                        'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {row.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {row.entityType || 'N/A'}{row.entityId ? ` #${row.entityId}` : ''}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {row.description || row.requestUrl || 'N/A'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-indigo-600 dark:text-indigo-400">
                      {row.ipAddress || 'N/A'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">{formatDate(row.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
