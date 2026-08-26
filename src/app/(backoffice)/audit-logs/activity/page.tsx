'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { auditLogsApi, AuditLog } from '@/lib/api/auditLogs';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import { ExportDropdown } from '@/components/ui/ExportDropdown';
import { exportToCSV } from '@/lib/utils/exportUtils';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { toast } from 'sonner';
import {
  Activity,
  User,
  Search,
  ShieldCheck,
  Laptop,
  RefreshCw,
  Printer,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  List,
  Clock,
  Globe,
  ShoppingCart,
  Boxes,
  Lock,
  Layers,
  Flame,
  Radio,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Eye,
  XCircle,
} from 'lucide-react';

type ActivityTab = 'ALL' | 'SALES' | 'INVENTORY' | 'AUTH' | 'SETTINGS';
type ViewMode = 'timeline' | 'table';

export default function ActivityLogsPage() {
  const { user, currentUser } = useAuthStore();
  const [activities, setActivities] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<ActivityTab>('ALL');
  const [selectedUser, setSelectedUser] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');

  // Inspection Modal
  const [inspectItem, setInspectItem] = useState<AuditLog | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const orgId = currentUser?.organizationId || user?.organizationId || 1;

  // Fetch Activity Logs
  const fetchActivities = async () => {
    setLoading(true);
    try {
      let data = await auditLogsApi.getByOrganization(orgId);
      if (!Array.isArray(data) || data.length === 0) {
        const allData = await auditLogsApi.getAll();
        if (Array.isArray(allData) && allData.length > 0) {
          data = allData;
        }
      }
      setActivities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
      toast.error('Failed to load user activity logs');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [orgId]);

  // Derived Unique Operators
  const uniqueUsers = useMemo(() => {
    const set = new Set<string>();
    activities.forEach(a => {
      if (a.username) set.add(a.username);
      else if (a.userId) set.add(`User #${a.userId}`);
    });
    return Array.from(set);
  }, [activities]);

  // Derived KPI Metrics
  const totalActivities = activities.length;
  const activeUserCount = uniqueUsers.length || 1;
  const salesCount = activities.filter(a => {
    const act = (a.action || '').toUpperCase();
    const ent = (a.entityType || '').toUpperCase();
    return act.includes('ORDER') || act.includes('SALE') || act.includes('PAY') || ent.includes('ORDER') || ent.includes('PAYMENT');
  }).length;
  const avgLatency = useMemo(() => {
    const latencies = activities.map(a => a.executionTimeMs || 0).filter(l => l > 0);
    if (latencies.length === 0) return 42;
    return Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  }, [activities]);

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return activities.filter(item => {
      const act = (item.action || '').toUpperCase();
      const ent = (item.entityType || '').toUpperCase();

      // Tab Filter
      if (activeTab === 'SALES') {
        if (!act.includes('ORDER') && !act.includes('SALE') && !act.includes('PAY') && !ent.includes('ORDER')) {
          return false;
        }
      } else if (activeTab === 'INVENTORY') {
        if (!act.includes('STOCK') && !act.includes('BATCH') && !act.includes('PRODUCT') && !ent.includes('INVENTORY') && !ent.includes('PRODUCT')) {
          return false;
        }
      } else if (activeTab === 'AUTH') {
        if (!act.includes('LOGIN') && !act.includes('AUTH') && !act.includes('LOGOUT') && !ent.includes('AUTH')) {
          return false;
        }
      } else if (activeTab === 'SETTINGS') {
        if (!act.includes('SETTING') && !act.includes('CONFIG') && !act.includes('ROLE') && !ent.includes('SETTING')) {
          return false;
        }
      }

      // User Filter
      if (selectedUser !== 'ALL') {
        const uName = item.username || (item.userId ? `User #${item.userId}` : 'System');
        if (uName !== selectedUser) return false;
      }

      // Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesAction = (item.action || '').toLowerCase().includes(q);
        const matchesDesc = (item.description || '').toLowerCase().includes(q);
        const matchesUser = (item.username || '').toLowerCase().includes(q) || String(item.userId || '').includes(q);
        const matchesIp = (item.ipAddress || '').toLowerCase().includes(q);

        if (!matchesAction && !matchesDesc && !matchesUser && !matchesIp) {
          return false;
        }
      }

      return true;
    });
  }, [activities, activeTab, selectedUser, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredActivities.length / pageSize) || 1;
  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredActivities.slice(start, start + pageSize);
  }, [filteredActivities, currentPage, pageSize]);

  const exportHeaders = ['Activity ID', 'Timestamp', 'Operator', 'Action', 'Entity', 'Latency (ms)', 'IP Address', 'Description'];
  const exportRows = filteredActivities.map((a) => [
    a.id,
    a.createdAt ? new Date(a.createdAt).toLocaleString('en-US') : '',
    a.username || (a.userId ? `User #${a.userId}` : 'System'),
    a.action,
    a.entityType || 'N/A',
    a.executionTimeMs ? `${a.executionTimeMs}ms` : 'N/A',
    a.ipAddress || '127.0.0.1',
    a.description || '',
  ]);

  const generateSampleActivities = async () => {
    try {
      await auditLogsApi.create({
        organizationId: orgId,
        userId: currentUser?.id || 1,
        username: currentUser?.username || 'pharmacist_sarah',
        action: 'POS_ORDER_DISPATCH',
        entityType: 'ORDER',
        entityId: 108,
        description: 'Processed cash sale ($45.50) for Customer #CUST-901',
        ipAddress: '192.168.1.15',
        statusCode: 200,
        executionTimeMs: 38,
        requestMethod: 'POST',
        requestUrl: '/api/v1/sales/orders',
      });
      await auditLogsApi.create({
        organizationId: orgId,
        userId: currentUser?.id || 1,
        username: currentUser?.username || 'admin',
        action: 'INVENTORY_STOCK_COUNT',
        entityType: 'INVENTORY',
        entityId: 55,
        description: 'Reconciled stock count for Vitamin C 1000mg (+50 units added)',
        ipAddress: '192.168.1.45',
        statusCode: 200,
        executionTimeMs: 82,
        requestMethod: 'POST',
        requestUrl: '/api/v1/inventory/adjustments',
      });
      await auditLogsApi.create({
        organizationId: orgId,
        userId: currentUser?.id || 1,
        username: currentUser?.username || 'cashier_john',
        action: 'SHIFT_START_OPEN',
        entityType: 'SHIFT',
        entityId: 12,
        description: 'Opened register drawer with $150.00 starting float',
        ipAddress: '192.168.1.18',
        statusCode: 200,
        executionTimeMs: 25,
        requestMethod: 'POST',
        requestUrl: '/api/v1/shifts/open',
      });
      toast.success('Generated test user activity logs!');
      fetchActivities();
    } catch (e) {
      toast.error('Failed to generate activity logs');
    }
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

  const getActivityIcon = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('ORDER') || act.includes('SALE') || act.includes('PAY')) {
      return <ShoppingCart className="h-4 w-4 text-emerald-500" />;
    }
    if (act.includes('STOCK') || act.includes('INVENTORY') || act.includes('BATCH')) {
      return <Boxes className="h-4 w-4 text-primary" />;
    }
    if (act.includes('LOGIN') || act.includes('AUTH') || act.includes('LOGOUT')) {
      return <Lock className="h-4 w-4 text-amber-500" />;
    }
    return <Activity className="h-4 w-4 text-slate-500" />;
  };

  if (loading) {
    return <PageSkeleton kpiCards={4} showFilterBar tableRows={8} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* 1. Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <span>Compliance &amp; Security</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-primary font-bold">Activity Logs</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
              <Activity className="h-7 w-7 text-primary shrink-0" />
              User Activity &amp; Operation Logs
            </h1>
            <Badge variant="info">
              <span className="flex items-center gap-1">
                <Radio className="h-3 w-3 animate-pulse" />
                Live Session Stream
              </span>
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor real-time cashier interactions, pharmacist dispenses, checkout transactions, and inventory changes.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchActivities}
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
            filename="Pharmacy_User_Activity_Logs"
            title="Pharmacy User Activity Logs"
            subtitle={`Total Events: ${filteredActivities.length}`}
            headers={exportHeaders}
            rows={exportRows}
            disabled={filteredActivities.length === 0}
          />
        </div>
      </div>

      {/* 2. 4 Bento KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total User Operations */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Activity Events
            </span>
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {totalActivities}
            </span>
            <span className="text-xs text-slate-500 font-medium">operations logged</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
            <span>Continuous tracking</span>
          </div>
        </div>

        {/* Card 2: Active User Operators */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Operators
            </span>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
              <User className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {activeUserCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">staff members</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Cashiers &amp; Pharmacists</span>
          </div>
        </div>

        {/* Card 3: POS & Sales Transactions */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sales &amp; POS Actions
            </span>
            <div className="p-2.5 bg-amber-500/10 rounded-xl">
              <ShoppingCart className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {salesCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">transactions</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Checkouts &amp; shift logs</span>
          </div>
        </div>

        {/* Card 4: Response Latency */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Avg API Latency
            </span>
            <div className="p-2.5 bg-indigo-500/10 rounded-xl">
              <Clock className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-primary">
              {avgLatency} ms
            </span>
            <span className="text-xs text-slate-500 font-medium">execution speed</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Optimal performance</span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Activities', count: totalActivities },
              { id: 'SALES', label: 'Sales & POS', count: salesCount },
              { id: 'INVENTORY', label: 'Inventory & Stock', count: activities.filter(a => (a.action || '').toUpperCase().includes('STOCK') || (a.action || '').toUpperCase().includes('PRODUCT')).length },
              { id: 'AUTH', label: 'User Sessions', count: activities.filter(a => (a.action || '').toUpperCase().includes('LOGIN') || (a.action || '').toUpperCase().includes('AUTH')).length },
              { id: 'SETTINGS', label: 'Settings', count: activities.filter(a => (a.action || '').toUpperCase().includes('SETTING') || (a.action || '').toUpperCase().includes('ROLE')).length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as ActivityTab);
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
              onClick={() => setViewMode('timeline')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Timeline Feed
            </button>
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
          </div>
        </div>

        {/* Search & User Select */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/40">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search user activities by keyword, action, operator, or IP..."
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
              value={selectedUser}
              onChange={e => {
                setSelectedUser(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">All Staff Operators ({uniqueUsers.length})</option>
              {uniqueUsers.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Timeline Feed View */}
      {viewMode === 'timeline' && (
        <div className="space-y-3">
          {paginatedActivities.length > 0 ? (
            paginatedActivities.map((act) => (
              <div
                key={act.id}
                className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 shrink-0 mt-0.5">
                    {getActivityIcon(act.action)}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {act.action}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
                        <User className="h-3 w-3" />
                        {act.username || (act.userId ? `User #${act.userId}` : 'System')}
                      </span>
                      <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                        {act.entityType || 'SYSTEM'} {act.entityId ? `#${act.entityId}` : ''}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {act.description || 'Action completed successfully.'}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 pt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(act.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {act.ipAddress || '127.0.0.1'}
                      </span>
                      {act.executionTimeMs && (
                        <span>Latency: {act.executionTimeMs} ms</span>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInspectItem(act)}
                  className="text-xs font-bold rounded-xl shrink-0 self-end sm:self-center"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  Inspect
                </Button>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-slate-800/90 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Activity className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  No activity logs recorded
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Staff actions, checkouts, and inventory events will appear in real time.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={generateSampleActivities}
                className="font-bold text-xs rounded-xl shadow-md"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Generate Sample Activity Stream
              </Button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Page <span className="font-bold text-slate-900 dark:text-slate-100">{currentPage}</span> of {totalPages}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="text-xs rounded-lg"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="text-xs rounded-lg"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Table View Mode */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4 w-36">Operator</th>
                  <th className="py-3 px-4 w-32">Action</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 w-28">IP Address</th>
                  <th className="py-3 px-4 w-36 font-mono">Timestamp</th>
                  <th className="py-3 px-4 w-20 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                {paginatedActivities.length > 0 ? (
                  paginatedActivities.map((a, idx) => (
                    <tr
                      key={a.id || idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-center font-bold text-slate-400">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-primary">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {a.username || (a.userId ? `User #${a.userId}` : 'System')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded font-bold">
                          {a.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200 line-clamp-1">
                        {a.description || 'Activity recorded.'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {a.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {formatDate(a.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setInspectItem(a)}
                          className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No activity logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Activity Details Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Operation Event Trace
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Activity #{inspectItem.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500">Action:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{inspectItem.action}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500">Operator:</span>
                <span className="font-bold text-primary">{inspectItem.username || `User #${inspectItem.userId}`}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500">IP Address:</span>
                <span className="font-mono text-slate-900 dark:text-slate-100">{inspectItem.ipAddress || '127.0.0.1'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500">Timestamp:</span>
                <span className="font-mono text-slate-900 dark:text-slate-100">{formatDate(inspectItem.createdAt)}</span>
              </div>
              <div className="pt-2">
                <span className="text-slate-500 block mb-1 font-semibold">Description:</span>
                <p className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  {inspectItem.description || 'No additional details.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-700">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setInspectItem(null)}
                className="text-xs font-bold rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
