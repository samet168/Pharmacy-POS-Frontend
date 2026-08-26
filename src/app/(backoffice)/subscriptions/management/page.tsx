'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/stores/authStore';
import { subscriptionPlansApi, SubscriptionPlan, SubscriptionPlanRequest } from '@/lib/api/subscriptionPlans';
import { organizationsApi, OrganizationResponse } from '@/lib/api/organizations';
import { branchesApi } from '@/lib/api/branches';
import { usersApi } from '@/lib/api/users';
import { printOfficialInvoice, exportToCSV } from '@/lib/utils/exportUtils';
import {
  Crown,
  Shield,
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Layers,
  Printer,
  Download,
  Zap,
  Sliders,
  Clock,
  Sparkles,
  Plus,
  Loader2,
  Lock
} from 'lucide-react';

interface SubscriberRow extends SubscriptionPlan {
  orgName: string;
  orgSlug: string;
  usedBranches: number;
  usedUsers: number;
  monthlyRevenue: number;
}

export default function SubscribersManagementPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;
  const userRole = (user?.roleName || '').toUpperCase();
  const isSuperAdmin = userRole.includes('SUPERADMIN') || (organizationId === 1 && userRole === 'SUPERADMIN');

  const [subscriptions, setSubscriptions] = useState<SubscriptionPlan[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<'ALL' | 'Starter' | 'Professional' | 'Enterprise'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED'>('ALL');

  // Edit / Extension Modal
  const [selectedSubscriber, setSelectedSubscriber] = useState<SubscriberRow | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    planName: 'Professional',
    maxBranches: 10,
    maxUsers: 50,
    status: 'ACTIVE' as 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED',
    endsAt: '',
  });
  const [savingSub, setSavingSub] = useState(false);

  useEffect(() => {
    fetchGlobalSubscribers();
  }, []);

  const fetchGlobalSubscribers = async () => {
    try {
      setLoading(true);
      const [subsRes, orgsRes, branchesRes, usersRes] = await Promise.all([
        subscriptionPlansApi.listAll().catch(() => []),
        organizationsApi.listAll().catch(() => []),
        branchesApi.listAll(0, 300).catch(() => null),
        usersApi.listAll(0, 300).catch(() => null),
      ]);

      const subsList = Array.isArray(subsRes) ? subsRes : (subsRes as any)?.content || [];
      const orgsList = Array.isArray(orgsRes) ? orgsRes : (orgsRes as any)?.content || [];
      const allBranches = (branchesRes as any)?.content || (Array.isArray(branchesRes) ? branchesRes : []);
      const allUsers = (usersRes as any)?.content || (Array.isArray(usersRes) ? usersRes : []);

      setOrganizations(orgsList);
      setSubscriptions(subsList);
    } catch (error) {
      console.error('Failed to load subscribers:', error);
      toast.error('Failed to load tenant subscribers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Build Enriched Rows
  const enrichedSubscribers: SubscriberRow[] = useMemo(() => {
    return subscriptions.map(sub => {
      const org = organizations.find(o => o.id === sub.organizationId);
      const planUpper = sub.planName.toUpperCase();
      const monthlyRev = planUpper.includes('ENTERPRISE') ? 199 : planUpper.includes('PROFESSIONAL') ? 79 : 29;

      return {
        ...sub,
        orgName: org?.name || `Pharmacy Org #${sub.organizationId}`,
        orgSlug: org?.slug || `tenant-${sub.organizationId}`,
        usedBranches: Math.min(sub.maxBranches, 1),
        usedUsers: Math.min(sub.maxUsers, 1),
        monthlyRevenue: sub.status === 'ACTIVE' ? monthlyRev : 0,
      };
    });
  }, [subscriptions, organizations]);

  // Filtered List
  const filteredSubscribers = useMemo(() => {
    return enrichedSubscribers.filter(sub => {
      if (planFilter !== 'ALL' && !sub.planName.toLowerCase().includes(planFilter.toLowerCase())) return false;
      if (statusFilter !== 'ALL' && sub.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          sub.orgName.toLowerCase().includes(q) ||
          sub.orgSlug.toLowerCase().includes(q) ||
          sub.planName.toLowerCase().includes(q) ||
          sub.id.toString().includes(q) ||
          sub.organizationId.toString().includes(q)
        );
      }
      return true;
    });
  }, [enrichedSubscribers, planFilter, statusFilter, searchTerm]);

  // Derived Global Platform KPIs
  const totalSubscribersCount = enrichedSubscribers.length;
  const activeSubscribersCount = enrichedSubscribers.filter(s => s.status === 'ACTIVE').length;
  const totalMRR = enrichedSubscribers.reduce((acc, s) => acc + s.monthlyRevenue, 0);
  const totalARR = totalMRR * 12;

  // Open Edit / Extend Modal
  const handleOpenManage = (sub: SubscriberRow) => {
    setSelectedSubscriber(sub);
    setEditFormData({
      planName: sub.planName,
      maxBranches: sub.maxBranches,
      maxUsers: sub.maxUsers,
      status: sub.status,
      endsAt: sub.endsAt ? sub.endsAt.split('T')[0] : '',
    });
    setIsManageModalOpen(true);
  };

  // Add Days Shortcut
  const handleAddDays = (days: number) => {
    const currentEnd = editFormData.endsAt ? new Date(editFormData.endsAt) : new Date();
    currentEnd.setDate(currentEnd.getDate() + days);
    setEditFormData(prev => ({
      ...prev,
      endsAt: currentEnd.toISOString().split('T')[0],
    }));
    toast.success(`Added +${days} days to subscription period`);
  };

  // Save Subscription Updates to Backend
  const handleSaveSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubscriber) return;

    setSavingSub(true);
    try {
      const updateReq: SubscriptionPlanRequest = {
        organizationId: selectedSubscriber.organizationId,
        planName: editFormData.planName,
        maxBranches: Number(editFormData.maxBranches),
        maxUsers: Number(editFormData.maxUsers),
        status: editFormData.status,
        startsAt: selectedSubscriber.startsAt || new Date().toISOString().split('T')[0],
        endsAt: editFormData.endsAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      };

      await subscriptionPlansApi.update(selectedSubscriber.id, updateReq);
      toast.success(`Updated subscription for Org #${selectedSubscriber.organizationId} successfully!`);
      setIsManageModalOpen(false);
      await fetchGlobalSubscribers();
    } catch (err: any) {
      console.error('Failed to update subscription:', err);
      toast.error(err?.response?.data?.message || 'Failed to update tenant subscription');
    } finally {
      setSavingSub(false);
    }
  };

  const handlePrintInvoice = (sub: SubscriberRow) => {
    printOfficialInvoice({
      invoiceNumber: `INV-SUB-${sub.id.toString().padStart(5, '0')}`,
      date: sub.startsAt || new Date().toISOString().split('T')[0],
      dueDate: sub.endsAt || new Date().toISOString().split('T')[0],
      orgName: sub.orgName,
      orgId: sub.organizationId,
      planName: sub.planName,
      maxBranches: sub.maxBranches,
      maxUsers: sub.maxUsers,
      billingPeriod: `Annual Platform Subscription (${sub.startsAt} - ${sub.endsAt})`,
      subtotal: sub.monthlyRevenue * 12 || 278,
      discount: 0,
      tax: 0,
      total: sub.monthlyRevenue * 12 || 278,
      paymentMethod: 'Bakong KHQR Settled',
      status: sub.status,
    });
  };

  const handleExportCSV = () => {
    if (enrichedSubscribers.length === 0) return toast.error('No subscribers to export.');
    const headers = ['Sub ID', 'Organization Name', 'Org ID', 'Plan Tier', 'Branches Quota', 'Users Quota', 'Status', 'MRR ($)', 'Starts At', 'Expires At'];
    const rows = enrichedSubscribers.map(s => [
      s.id,
      s.orgName,
      s.organizationId,
      s.planName,
      s.maxBranches,
      s.maxUsers,
      s.status,
      `$${s.monthlyRevenue}`,
      s.startsAt,
      s.endsAt,
    ]);
    exportToCSV('Platform_SaaS_Subscribers_Ledger', headers, rows);
    toast.success('Tenant subscribers exported to CSV!');
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-8 max-w-md text-center shadow-xl space-y-4">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20 shadow-xs">
            <Lock className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Access Restricted: SUPERADMIN Only
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              The <strong>Tenant Subscribers &amp; SaaS Governance</strong> portal is strictly reserved for the root <strong>SUPERADMIN</strong> role. Other roles do not have permission to view or manage global tenant subscriptions.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="w-full text-xs font-bold rounded-2xl shadow-md"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl border border-amber-500/30">
            <Crown className="h-7 w-7 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Tenant Subscribers &amp; SaaS Governance
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800 uppercase">
                SuperAdmin Portal
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Master control portal for monitoring registered pharmacy subscribers, capacity allocations, and recurring revenues.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs rounded-2xl"
          >
            <Download className="h-3.5 w-3.5" />
            CSV Export
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRefreshing(true);
              fetchGlobalSubscribers();
            }}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs rounded-2xl"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* 2. Platform Bento KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Subscribers */}
        <Card className="p-5 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/60 rounded-3xl shadow-xs">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subscribers</span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{activeSubscribersCount}</h3>
                <span className="text-xs text-slate-400">/ {totalSubscribersCount} Total Orgs</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700/40 mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Active Retention</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {totalSubscribersCount > 0 ? Math.round((activeSubscribersCount / totalSubscribersCount) * 100) : 100}%
            </span>
          </div>
        </Card>

        {/* KPI 2: Monthly Recurring Revenue */}
        <Card className="p-5 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/60 rounded-3xl shadow-xs">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Platform MRR</span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                ${totalMRR.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700/40 mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Est. Monthly SaaS Revenue</span>
            <span className="font-bold text-primary">Live Sync</span>
          </div>
        </Card>

        {/* KPI 3: Annual Run Rate */}
        <Card className="p-5 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/60 rounded-3xl shadow-xs">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Projected ARR</span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                ${totalARR.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700/40 mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Annual Run Rate Forecast</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">12x MRR</span>
          </div>
        </Card>

        {/* KPI 4: Tier Distribution */}
        <Card className="p-5 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/60 rounded-3xl shadow-xs">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tier Allocation</span>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {enrichedSubscribers.filter(s => s.planName.toLowerCase().includes('starter')).length} Starter
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  {enrichedSubscribers.filter(s => s.planName.toLowerCase().includes('pro')).length} Pro
                </span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Layers className="h-6 w-6" />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700/40 mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Enterprise Scale</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {enrichedSubscribers.filter(s => s.planName.toLowerCase().includes('enterprise')).length} Orgs
            </span>
          </div>
        </Card>
      </div>

      {/* 3. Subscribers Governance Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-xs p-6 space-y-4">
        {/* Table Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Tenant Subscribers Roster
            </h3>
            <p className="text-xs text-slate-400">
              Showing {filteredSubscribers.length} of {totalSubscribersCount} subscribed pharmacy networks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by pharmacy name, slug, org ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Plan Filter */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-700/60 rounded-xl text-xs font-bold">
              {(['ALL', 'Starter', 'Professional', 'Enterprise'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPlanFilter(p)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    planFilter === p
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-700/60 rounded-xl text-xs font-bold">
              {(['ALL', 'ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    statusFilter === st
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        {filteredSubscribers.length === 0 ? (
          <EmptyState
            title="No matching subscribers found"
            description="Try searching with a different pharmacy name or adjust your filter selection."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 dark:border-slate-700/60">
                  <TableHead className="text-xs font-bold">PHARMACY NETWORK</TableHead>
                  <TableHead className="text-xs font-bold">ACTIVE PLAN</TableHead>
                  <TableHead className="text-xs font-bold">BRANCH QUOTA</TableHead>
                  <TableHead className="text-xs font-bold">USER SEATS</TableHead>
                  <TableHead className="text-xs font-bold">REVENUE</TableHead>
                  <TableHead className="text-xs font-bold">PERIOD (EXPIRY)</TableHead>
                  <TableHead className="text-xs font-bold">STATUS</TableHead>
                  <TableHead className="text-xs font-bold text-right">GOVERNANCE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscribers.map(sub => (
                  <TableRow key={sub.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/30 transition-colors">
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                            {sub.orgName}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-500">
                            Org #{sub.organizationId}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-400">/{sub.orgSlug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        {sub.planName} Plan
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{sub.maxBranches}</span> Max Branches
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{sub.maxUsers}</span> Staff Seats
                    </TableCell>
                    <TableCell className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                      ${sub.monthlyRevenue}/mo
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                      <div>{sub.endsAt ? sub.endsAt.split('T')[0] : 'No Expiry'}</div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          sub.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : sub.status === 'TRIAL'
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                            : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {sub.status === 'ACTIVE' && <CheckCircle className="h-3 w-3" />}
                        {sub.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintInvoice(sub)}
                          className="h-7 text-xs px-2.5 rounded-xl flex items-center gap-1"
                        >
                          <Printer className="h-3 w-3" />
                          Invoice
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenManage(sub)}
                          className="h-7 text-xs px-2.5 rounded-xl flex items-center gap-1"
                        >
                          <Sliders className="h-3 w-3" />
                          Manage
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* 4. MODAL: SuperAdmin Manage & Extend Subscription */}
      {isManageModalOpen && selectedSubscriber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 rounded-2xl">
                  <Crown className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                    Manage Subscription: {selectedSubscriber.orgName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Organization ID #{selectedSubscriber.organizationId} · Sub #{selectedSubscriber.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsManageModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubscriber} className="space-y-4">
              {/* Plan Tier Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Plan Tier
                </label>
                <select
                  value={editFormData.planName}
                  onChange={e => {
                    const p = e.target.value;
                    const b = p === 'Starter' ? 3 : p === 'Professional' ? 10 : 100;
                    const u = p === 'Starter' ? 10 : p === 'Professional' ? 50 : 500;
                    setEditFormData(prev => ({ ...prev, planName: p, maxBranches: b, maxUsers: u }));
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Starter">Starter Plan (3 Branches, 10 Users)</option>
                  <option value="Professional">Professional Plan (10 Branches, 50 Users)</option>
                  <option value="Enterprise">Enterprise Plan (100 Branches, 500 Users)</option>
                </select>
              </div>

              {/* Custom Quota Overrides */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Max Store Branches
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    value={editFormData.maxBranches}
                    onChange={e => setEditFormData({ ...editFormData, maxBranches: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Max Staff Seats
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={5000}
                    value={editFormData.maxUsers}
                    onChange={e => setEditFormData({ ...editFormData, maxUsers: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Subscription Status
                </label>
                <select
                  value={editFormData.status}
                  onChange={e => setEditFormData({ ...editFormData, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="ACTIVE">ACTIVE (Fully Operational)</option>
                  <option value="TRIAL">TRIAL (14-Day Free Period)</option>
                  <option value="SUSPENDED">SUSPENDED (Temporary Hold)</option>
                  <option value="CANCELLED">CANCELLED (Deactivated)</option>
                </select>
              </div>

              {/* Expiry Date & Quick Extensions */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Subscription Expiry Date
                </label>
                <Input
                  type="date"
                  value={editFormData.endsAt}
                  onChange={e => setEditFormData({ ...editFormData, endsAt: e.target.value })}
                  required
                />

                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 font-medium">Quick Extend:</span>
                  <button
                    type="button"
                    onClick={() => handleAddDays(30)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold hover:bg-slate-200"
                  >
                    +30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddDays(90)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold hover:bg-slate-200"
                  >
                    +90 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddDays(365)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold hover:bg-emerald-100"
                  >
                    +1 Year (365 Days)
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsManageModalOpen(false)}
                  className="text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={savingSub}
                  className="text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  {savingSub ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Updating Database...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
