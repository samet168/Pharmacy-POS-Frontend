'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { auditLogsApi, AuditLog } from '@/lib/api/auditLogs';
import { Button } from '../design-system/components/Button';
import { Badge } from '../design-system/components/Badge';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { exportToCSV } from '@/lib/utils/exportUtils';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Printer,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  List,
  Clock,
  User,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  FileCode,
  Shield,
  Layers,
  Flame,
  Radio,
  FileText,
  Activity,
  Globe,
  Lock,
} from 'lucide-react';

type FilterTab = 'ALL' | 'AUTH' | 'CREATE' | 'UPDATE' | 'DELETE';
type ViewMode = 'table' | 'feed';

export default function AuditLogsPage() {
  const { user, currentUser } = useAuthStore();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Inspection Modal
  const [inspectLog, setInspectLog] = useState<AuditLog | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const orgId = currentUser?.organizationId || user?.organizationId || 1;

  // Fetch Audit Logs from Backend API
  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      let data = await auditLogsApi.getByOrganization(orgId);
      if (!Array.isArray(data) || data.length === 0) {
        const allData = await auditLogsApi.getAll();
        if (Array.isArray(allData) && allData.length > 0) {
          data = allData;
        }
      }
      setAuditLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      toast.error('Failed to load audit logs from server');
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [orgId]);

  // Derived KPI Metrics
  const totalLogs = auditLogs.length;
  const authEvents = auditLogs.filter(l => {
    const act = (l.action || '').toUpperCase();
    return act.includes('LOGIN') || act.includes('AUTH') || act.includes('LOGOUT') || act.includes('PASSWORD');
  }).length;
  const mutations = auditLogs.filter(l => {
    const act = (l.action || '').toUpperCase();
    return act.includes('CREATE') || act.includes('UPDATE') || act.includes('EDIT') || act.includes('SAVE');
  }).length;
  const deletions = auditLogs.filter(l => {
    const act = (l.action || '').toUpperCase();
    return act.includes('DELETE') || act.includes('REMOVE') || act.includes('PURGE');
  }).length;

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const act = (log.action || '').toUpperCase();

      // Tab Filter
      if (activeTab === 'AUTH') {
        if (!act.includes('LOGIN') && !act.includes('AUTH') && !act.includes('LOGOUT') && !act.includes('PASSWORD')) {
          return false;
        }
      } else if (activeTab === 'CREATE') {
        if (!act.includes('CREATE') && !act.includes('ADD') && !act.includes('INSERT')) return false;
      } else if (activeTab === 'UPDATE') {
        if (!act.includes('UPDATE') && !act.includes('EDIT') && !act.includes('PATCH') && !act.includes('SAVE')) return false;
      } else if (activeTab === 'DELETE') {
        if (!act.includes('DELETE') && !act.includes('REMOVE') && !act.includes('PURGE')) return false;
      }

      // Entity Filter
      if (selectedEntity !== 'ALL') {
        const ent = (log.entityType || '').toUpperCase();
        if (!ent.includes(selectedEntity)) return false;
      }

      // Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesAction = (log.action || '').toLowerCase().includes(q);
        const matchesEntity = (log.entityType || '').toLowerCase().includes(q);
        const matchesUser = (log.username || '').toLowerCase().includes(q) || String(log.userId || '').includes(q);
        const matchesDesc = (log.description || '').toLowerCase().includes(q);
        const matchesIp = (log.ipAddress || '').toLowerCase().includes(q);
        const matchesMethod = (log.requestMethod || '').toLowerCase().includes(q);

        if (!matchesAction && !matchesEntity && !matchesUser && !matchesDesc && !matchesIp && !matchesMethod) {
          return false;
        }
      }

      return true;
    });
  }, [auditLogs, activeTab, selectedEntity, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const exportHeaders = ['ID', 'Timestamp', 'Operator', 'Action', 'Entity', 'Entity ID', 'Status Code', 'IP Address', 'Description'];
  const exportRows = filteredLogs.map((l) => [
    l.id,
    l.createdAt ? new Date(l.createdAt).toLocaleString('en-US') : '',
    l.username || (l.userId ? `User #${l.userId}` : 'System'),
    l.action,
    l.entityType || 'N/A',
    l.entityId || 'N/A',
    l.statusCode || 200,
    l.ipAddress || '127.0.0.1',
    l.description || '',
  ]);

  const generateSampleAuditLogs = async () => {
    try {
      await auditLogsApi.create({
        organizationId: orgId,
        userId: currentUser?.id || 1,
        username: currentUser?.username || 'admin',
        action: 'USER_LOGIN',
        entityType: 'AUTH',
        description: 'Pharmacist logged in via web portal',
        ipAddress: '192.168.1.45',
        statusCode: 200,
        executionTimeMs: 45,
        requestMethod: 'POST',
        requestUrl: '/api/v1/auth/login',
      });
      await auditLogsApi.create({
        organizationId: orgId,
        userId: currentUser?.id || 1,
        username: currentUser?.username || 'admin',
        action: 'PRODUCT_PRICE_UPDATE',
        entityType: 'PRODUCT',
        entityId: 102,
        description: 'Updated unit price for Amoxicillin 500mg from $12.00 to $14.50',
        ipAddress: '192.168.1.45',
        statusCode: 200,
        executionTimeMs: 120,
        requestMethod: 'PUT',
        requestUrl: '/api/v1/products/102',
      });
      await auditLogsApi.create({
        organizationId: orgId,
        userId: currentUser?.id || 1,
        username: currentUser?.username || 'admin',
        action: 'ORDER_CHECKOUT_COMPLETED',
        entityType: 'ORDER',
        entityId: 804,
        description: 'Completed checkout for Prescription Invoice #INV-2026-0804',
        ipAddress: '192.168.1.12',
        statusCode: 201,
        executionTimeMs: 230,
        requestMethod: 'POST',
        requestUrl: '/api/v1/orders/checkout',
      });
      await auditLogsApi.create({
        organizationId: orgId,
        userId: currentUser?.id || 1,
        username: currentUser?.username || 'admin',
        action: 'BATCH_DISPOSAL_DELETE',
        entityType: 'INVENTORY',
        entityId: 44,
        description: 'Removed expired medication batch #LOT-992 from stock tracking',
        ipAddress: '192.168.1.45',
        statusCode: 200,
        executionTimeMs: 65,
        requestMethod: 'DELETE',
        requestUrl: '/api/v1/inventory/batches/44',
      });

      toast.success('Generated sample compliance audit trail!');
      fetchAuditLogs();
    } catch (e) {
      toast.error('Failed to generate sample audit logs');
    }
  };

  const getActionBadge = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('CREATE') || act.includes('ADD') || act.includes('INSERT')) {
      return <Badge variant="success">CREATE</Badge>;
    }
    if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('PATCH') || act.includes('SAVE')) {
      return <Badge variant="info">UPDATE</Badge>;
    }
    if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('PURGE')) {
      return <Badge variant="danger">DELETE</Badge>;
    }
    if (act.includes('LOGIN') || act.includes('AUTH') || act.includes('PASSWORD')) {
      return <Badge variant="warning">SECURITY</Badge>;
    }
    return <Badge variant="neutral">EVENT</Badge>;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading) {
    return <PageSkeleton kpiCards={4} showFilterBar tableRows={8} />;
  }

  return (
    <div className="space-y-6 w-full">
      {/* 1. Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <span>Compliance &amp; Security</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-primary font-bold">Audit Logs</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="h-7 w-7 text-primary shrink-0" />
              System Audit &amp; Compliance Logs
            </h1>
            <Badge variant="success">
              <span className="flex items-center gap-1">
                <Radio className="h-3 w-3 animate-pulse" />
                Live Audit Stream
              </span>
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Immutable regulatory audit trail tracking data mutations, security logins, pricing alterations, and system events.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAuditLogs}
            className="flex items-center gap-1.5 text-xs rounded-xl"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs rounded-xl"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>

          <ExportDropdown
            filename="Pharmacy_Audit_Security_Logs"
            title="Pharmacy Security & Audit Logs"
            subtitle={`Total Events: ${filteredLogs.length}`}
            headers={exportHeaders}
            rows={exportRows}
            disabled={filteredLogs.length === 0}
          />
        </div>
      </div>

      {/* 2. 4 Bento KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Audit Events */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Audit Trail
            </span>
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <FileText className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {totalLogs}
            </span>
            <span className="text-xs text-slate-500 font-medium">immutable records</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
            <span>Real-time logging active</span>
          </div>
        </div>

        {/* Card 2: Security & Auth Events */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Security &amp; Auth
            </span>
            <div className="p-2.5 bg-amber-500/10 rounded-xl">
              <Lock className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {authEvents}
            </span>
            <span className="text-xs text-slate-500 font-medium">sessions tracked</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Shield className="h-3.5 w-3.5 text-amber-500" />
            <span>Login &amp; access control</span>
          </div>
        </div>

        {/* Card 3: Data Mutations */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Data Mutations
            </span>
            <div className="p-2.5 bg-indigo-500/10 rounded-xl">
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-primary">
              {mutations}
            </span>
            <span className="text-xs text-slate-500 font-medium">updates &amp; inserts</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <FileCode className="h-3.5 w-3.5 text-primary" />
            <span>Records created &amp; changed</span>
          </div>
        </div>

        {/* Card 4: Deletions & Purges */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Deletions &amp; Purges
            </span>
            <div className="p-2.5 bg-rose-500/10 rounded-xl">
              <XCircle className="h-5 w-5 text-rose-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
              {deletions}
            </span>
            <span className="text-xs text-slate-500 font-medium">purged records</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Critical action oversight</span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Filter Tabs & Search Toolbar */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Action Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Logs', count: totalLogs },
              { id: 'AUTH', label: 'Security & Auth', count: authEvents },
              { id: 'CREATE', label: 'Creations', count: auditLogs.filter(l => (l.action || '').toUpperCase().includes('CREATE')).length },
              { id: 'UPDATE', label: 'Updates', count: auditLogs.filter(l => (l.action || '').toUpperCase().includes('UPDATE')).length },
              { id: 'DELETE', label: 'Deletions', count: deletions },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as FilterTab);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl shrink-0 self-end md:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Table
            </button>
            <button
              onClick={() => setViewMode('feed')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'feed'
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Inspector Feed
            </button>
          </div>
        </div>

        {/* Search & Entity Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/40">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit trail by action, username, entity, IP address, or description..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedEntity}
              onChange={e => {
                setSelectedEntity(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">All Entity Types</option>
              <option value="ORDER">Orders &amp; Sales</option>
              <option value="PRODUCT">Products &amp; Catalog</option>
              <option value="INVENTORY">Inventory &amp; Batches</option>
              <option value="AUTH">Authentication / IAM</option>
              <option value="PRESCRIPTION">Prescriptions</option>
              <option value="PAYMENT">Payments</option>
              <option value="SHIFT">POS Shifts</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Bento Table View Mode */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4 w-28">Action</th>
                  <th className="py-3 px-4 w-28">Entity</th>
                  <th className="py-3 px-4">Description &amp; Event Scope</th>
                  <th className="py-3 px-4 w-36">User &amp; IP</th>
                  <th className="py-3 px-4 w-24 text-center">Status</th>
                  <th className="py-3 px-4 w-36 font-mono">Timestamp</th>
                  <th className="py-3 px-4 w-20 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                {paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log, idx) => {
                    const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <tr
                        key={log.id || idx}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                      >
                        <td className="py-3 px-4 text-center font-bold text-slate-400">
                          {globalIdx}
                        </td>
                        <td className="py-3 px-4">
                          {getActionBadge(log.action)}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                            {log.entityType || 'SYSTEM'}
                            {log.entityId ? ` #${log.entityId}` : ''}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                              {log.description || log.action}
                            </p>
                            {log.requestUrl && (
                              <p className="text-[10px] font-mono text-slate-400">
                                {log.requestMethod || 'GET'} {log.requestUrl}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                              <User className="h-3 w-3 text-primary" />
                              {log.username || (log.userId ? `User #${log.userId}` : 'System')}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                              <Globe className="h-2.5 w-2.5" />
                              {log.ipAddress || '127.0.0.1'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[11px] font-bold ${
                            !log.statusCode || log.statusCode < 400
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                          }`}>
                            {log.statusCode || 200}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setInspectLog(log)}
                            className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                            title="Inspect Audit Metadata"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Shield className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold text-sm">No audit logs match the selected criteria</p>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={generateSampleAuditLogs}
                          className="mt-2 text-xs font-bold rounded-xl"
                        >
                          <Sparkles className="h-3.5 w-3.5 mr-1" />
                          Generate Test Audit Trail
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Showing{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {(currentPage - 1) * pageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {Math.min(currentPage * pageSize, filteredLogs.length)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {filteredLogs.length}
                </span>{' '}
                events
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="text-xs rounded-lg px-2.5 py-1"
                >
                  Previous
                </Button>
                <span className="text-xs font-semibold px-2 text-slate-700 dark:text-slate-300">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="text-xs rounded-lg px-2.5 py-1"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Inspector Feed View Mode */}
      {viewMode === 'feed' && (
        <div className="space-y-3">
          {paginatedLogs.length > 0 ? (
            paginatedLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {log.action}
                        </h3>
                        {getActionBadge(log.action)}
                        <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                          {log.entityType || 'SYSTEM'} {log.entityId ? `#${log.entityId}` : ''}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {log.description || 'System operation executed.'}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInspectLog(log)}
                    className="text-xs font-bold rounded-xl shrink-0"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Details
                  </Button>
                </div>

                <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/40 flex-wrap">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3 text-primary" />
                    {log.username || (log.userId ? `User #${log.userId}` : 'System')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {log.ipAddress || '127.0.0.1'}
                  </span>
                  {log.requestUrl && (
                    <span>
                      {log.requestMethod} {log.requestUrl}
                    </span>
                  )}
                  <span className="flex items-center gap-1 ml-auto">
                    <Clock className="h-3 w-3" />
                    {formatDate(log.createdAt)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-slate-800/90 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-12 text-center">
              <p className="text-xs text-slate-400">No audit logs found</p>
            </div>
          )}
        </div>
      )}

      {/* 6. Metadata Inspection Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Audit Event Payload &amp; Trace Details
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Log Record ID #{inspectLog.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Action</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{inspectLog.action}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Entity Type / ID</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {inspectLog.entityType || 'SYSTEM'} {inspectLog.entityId ? `#${inspectLog.entityId}` : ''}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Status Code</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {inspectLog.statusCode || 200} OK
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Operator / User</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {inspectLog.username || (inspectLog.userId ? `User #${inspectLog.userId}` : 'System')}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">IP Address</span>
                <span className="font-bold font-mono text-slate-900 dark:text-slate-100">
                  {inspectLog.ipAddress || '127.0.0.1'}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Execution Time</span>
                <span className="font-bold font-mono text-slate-900 dark:text-slate-100">
                  {inspectLog.executionTimeMs ? `${inspectLog.executionTimeMs} ms` : 'N/A'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Event Description
              </label>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200">
                {inspectLog.description || 'No detailed description provided.'}
              </div>
            </div>

            {inspectLog.requestUrl && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  HTTP Request Endpoint
                </label>
                <div className="p-2.5 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto">
                  {inspectLog.requestMethod || 'GET'} {inspectLog.requestUrl}
                </div>
              </div>
            )}

            {inspectLog.userAgent && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Client User Agent
                </label>
                <div className="p-2 bg-slate-50 dark:bg-slate-900/50 font-mono text-[11px] text-slate-500 rounded-xl">
                  {inspectLog.userAgent}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-700">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setInspectLog(null)}
                className="text-xs font-bold rounded-xl"
              >
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}