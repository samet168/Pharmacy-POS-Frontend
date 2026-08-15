'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { LoadingSkeleton, CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/utils/errorHandler';
import { auditLogsApi, AuditLog } from '@/lib/api/auditLogs';
import { useAuthStore } from '@/lib/stores/authStore';
import { FileText, Search, Filter, RefreshCw, Calendar, User, Eye, ChevronDown, ChevronUp } from 'lucide-react';

export default function AuditLogsPage() {
  const { currentUser } = useAuthStore();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    targetType: '',
    dateFrom: '',
    dateTo: '',
  });
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  const fetchAuditLogs = async () => {
    if (!currentUser?.organizationId) {
      toast.error('Organization ID not found');
      return;
    }

    try {
      setLoading(true);
      const data = await auditLogsApi.getByOrganization(currentUser.organizationId, {
        action: filters.action || undefined,
        targetType: filters.targetType || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      });
      const logsArray = Array.isArray(data) ? data : (data?.content || []);
      setAuditLogs(logsArray);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [currentUser?.organizationId]);

  const filteredLogs = auditLogs.filter(log =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.targetType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.targetId.toString().includes(searchTerm)
  );

  const getActionColor = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create') || actionLower.includes('add')) {
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    }
    if (actionLower.includes('update') || actionLower.includes('edit')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
    if (actionLower.includes('delete') || actionLower.includes('remove')) {
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    }
    if (actionLower.includes('login') || actionLower.includes('auth')) {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    }
    return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-400';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatJson = (jsonString?: string) => {
    if (!jsonString) return 'N/A';
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <LoadingSkeleton variant="text" width={200} height={32} />
            <LoadingSkeleton variant="text" width={400} height={20} className="mt-2" />
          </div>
          <LoadingSkeleton variant="rectangular" width={150} height={40} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-bento-primary dark:text-slate-100">
            Audit Logs
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Track system activity and changes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchAuditLogs}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-bento-primary/10 rounded-xl">
              <FileText className="h-6 w-6 text-bento-primary" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Logs</p>
              <p className="text-2xl font-bold text-bento-primary dark:text-slate-100">
                {auditLogs.length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Creates</p>
              <p className="text-2xl font-bold text-bento-primary dark:text-slate-100">
                {auditLogs.filter(l => l.action.toLowerCase().includes('create')).length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Updates</p>
              <p className="text-2xl font-bold text-bento-primary dark:text-slate-100">
                {auditLogs.filter(l => l.action.toLowerCase().includes('update')).length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Deletes</p>
              <p className="text-2xl font-bold text-bento-primary dark:text-slate-100">
                {auditLogs.filter(l => l.action.toLowerCase().includes('delete')).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search by action, target type, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          {showFilters && (
            <div className="flex flex-wrap gap-2">
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="px-4 py-2 border border-bento-gray dark:border-slate-700 rounded-lg bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-bento-primary"
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="LOGIN">Login</option>
              </select>
              <select
                value={filters.targetType}
                onChange={(e) => setFilters({ ...filters, targetType: e.target.value })}
                className="px-4 py-2 border border-bento-gray dark:border-slate-700 rounded-lg bg-bento-white dark:bg-slate-800 text-bento-primary dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-bento-primary"
              >
                <option value="">All Types</option>
                <option value="PRODUCT">Product</option>
                <option value="CUSTOMER">Customer</option>
                <option value="ORDER">Order</option>
                <option value="USER">User</option>
              </select>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-auto"
              />
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-auto"
              />
              <Button onClick={fetchAuditLogs}>Apply</Button>
            </div>
          )}
        </div>
      </Card>

      {/* Audit Logs Table */}
      <Card className="overflow-hidden">
        {filteredLogs.length === 0 ? (
          <EmptyState
            title="No audit logs found"
            description={
              searchTerm || showFilters
                ? 'Try adjusting your search or filters'
                : 'No audit logs have been recorded yet'
            }
            action={<Button onClick={fetchAuditLogs}>Refresh Data</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>ID</TableHeader>
                  <TableHeader>Action</TableHeader>
                  <TableHeader>Target Type</TableHeader>
                  <TableHeader>Target ID</TableHeader>
                  <TableHeader>User ID</TableHeader>
                  <TableHeader>Branch</TableHeader>
                  <TableHeader>Timestamp</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.map((log) => (
                  <>
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">#{log.id}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{log.targetType}</TableCell>
                      <TableCell className="font-medium">#{log.targetId}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4 text-slate-400" />
                          <span>#{log.actorUserId}</span>
                        </div>
                      </TableCell>
                      <TableCell>{log.branchId ? `#${log.branchId}` : 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-sm">{formatDate(log.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          {expandedLog === log.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedLog === log.id && (
                      <TableRow>
                        <TableCell colSpan={8} className="p-4 bg-slate-50 dark:bg-slate-800/50">
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Before:</p>
                              <pre className="text-xs bg-white dark:bg-slate-900 p-3 rounded-lg overflow-x-auto">
                                {formatJson(log.beforeJson)}
                              </pre>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">After:</p>
                              <pre className="text-xs bg-white dark:bg-slate-900 p-3 rounded-lg overflow-x-auto">
                                {formatJson(log.afterJson)}
                              </pre>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}