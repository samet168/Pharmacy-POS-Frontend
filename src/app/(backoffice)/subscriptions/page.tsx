'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/utils/errorHandler';
import { subscriptionPlansApi, SubscriptionPlan, SubscriptionCheckoutRequest } from '@/lib/api/subscriptionPlans';
import { branchesApi } from '@/lib/api/branches';
import { usersApi } from '@/lib/api/users';
import { dashboardApi } from '@/lib/api/dashboard';
import {
  CreditCard,
  Building2,
  Users,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Crown,
  Zap,
  Shield,
  Loader2,
  QrCode,
  Sparkles,
  Check,
  ArrowRight,
  Lock,
  FileText,
  Copy,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Percent,
  CheckCircle2,
  HelpCircle,
  Printer,
  Sliders,
  DollarSign,
  Download,
  Info,
  Calendar,
  Layers,
  Search,
  CheckSquare,
  Package
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';
import { printOfficialInvoice, exportToCSV } from '@/lib/utils/exportUtils';

interface PlanDefinition {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxBranches: number;
  maxUsers: number;
  maxProducts: number;
  description: string;
  badge?: string;
  icon: any;
  colorTheme: {
    badgeBg: string;
    border: string;
    glow: string;
    button: 'primary' | 'outline';
    gradient: string;
  };
  features: string[];
}

const PLANS: PlanDefinition[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 29,
    yearlyPrice: 23,
    maxBranches: 3,
    maxUsers: 10,
    maxProducts: 5000,
    description: 'Essential POS solution tailored for single clinics or small pharmacy retail branches.',
    icon: Zap,
    colorTheme: {
      badgeBg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-800',
      glow: 'hover:shadow-slate-500/10',
      button: 'outline',
      gradient: 'from-slate-500/10 to-slate-500/5',
    },
    features: [
      'Up to 3 Pharmacy Branches',
      'Up to 10 Staff / Cashier Accounts',
      'Up to 5,000 Medication SKUs',
      'Standard POS Sales & Receipt Printing',
      'Daily Revenue & Sales Reporting',
      'Standard Business Hours Email Support',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 79,
    yearlyPrice: 63,
    maxBranches: 10,
    maxUsers: 50,
    maxProducts: 25000,
    description: 'Advanced multi-branch enterprise suite for expanding pharmacy retail chains.',
    badge: 'MOST POPULAR',
    icon: Crown,
    colorTheme: {
      badgeBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm',
      border: 'border-2 border-emerald-500 ring-4 ring-emerald-500/10 dark:ring-emerald-500/20',
      glow: 'hover:shadow-emerald-500/25',
      button: 'primary',
      gradient: 'from-emerald-500/15 via-teal-500/10 to-transparent',
    },
    features: [
      'Up to 10 Pharmacy Branches',
      'Up to 50 Users with Granular 134-Permission Matrix',
      'Up to 25,000 Medication SKUs',
      'Customer Prescription Tracking & Doctor Directory',
      'Bakong KHQR & Online Payment Gateway',
      'Inter-branch Stock Transfers & Batch Expiry Tracking',
      'Priority 24/7 Phone & Email Technical SLA',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 199,
    yearlyPrice: 159,
    maxBranches: 100,
    maxUsers: 500,
    maxProducts: 100000,
    description: 'Unlimited capacity, automated warehouse logistics & custom cloud infrastructure.',
    icon: Shield,
    colorTheme: {
      badgeBg: 'bg-indigo-600 text-white',
      border: 'border border-indigo-200 dark:border-indigo-900/50',
      glow: 'hover:shadow-indigo-500/15',
      button: 'outline',
      gradient: 'from-indigo-500/15 to-purple-500/5',
    },
    features: [
      'Up to 100 Store Branches & Warehouses',
      'Up to 500 Staff & Management Accounts',
      'Unlimited Medication SKUs & Batches',
      'Multi-tier Central Warehouse Automated Logistics',
      'Custom REST API, Webhooks & ERP Accounting Sync',
      'Dedicated Account Manager (15m SLA Guarantee)',
      'High-Availability Cloud Server with Real-time Failover',
    ],
  },
];

const FEATURE_MATRIX = [
  { name: 'Max Store Branches', starter: '3 Branches', pro: '10 Branches', enterprise: '100 Branches' },
  { name: 'Max Staff Accounts', starter: '10 Users', pro: '50 Users', enterprise: '500 Users' },
  { name: 'Medication SKU Limit', starter: '5,000 SKUs', pro: '25,000 SKUs', enterprise: 'Unlimited SKUs' },
  { name: 'POS Cashier Terminals', starter: 'Standard', pro: 'High-speed Offline Sync', enterprise: 'Unlimited Concurrent' },
  { name: 'Multi-Batch Expiry Tracking', starter: 'Basic', pro: 'Automated FEFO / FIFO', enterprise: 'Warehouse Cold-Chain' },
  { name: 'Inter-Branch Stock Transfer', starter: '—', pro: 'Transfer & Dispatch GRN', enterprise: 'Automated Multi-Warehouse' },
  { name: 'Patient Prescriptions & EHR', starter: '—', pro: 'Included + Doctor Dir', enterprise: 'Full Clinical Dispense' },
  { name: 'Payment Integrations', starter: 'Cash & Card', pro: 'Bakong KHQR + ABA Pay', enterprise: 'Custom Payment Gateways' },
  { name: 'Roles & Permissions Matrix', starter: 'Standard 4 Roles', pro: 'Granular 134 Permissions', enterprise: 'Unlimited Custom Roles' },
  { name: 'Audit Logs & Latency Analytics', starter: '30 Days', pro: '1 Year Historical', enterprise: 'Unlimited Immutable Ledger' },
  { name: 'Support SLA & Training', starter: 'Email (24h)', pro: 'Priority 24/7 (1h SLA)', enterprise: 'Dedicated Manager (15m SLA)' },
];

export default function SubscriptionsPage() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;

  const [subscriptions, setSubscriptions] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [currency, setCurrency] = useState<'USD' | 'KHR'>('USD');
  const [autoRenew, setAutoRenew] = useState(true);

  // Live Capacity Usage Metrics
  const [usageMetrics, setUsageMetrics] = useState({
    branches: 1,
    users: 1,
    products: 5,
    todayOrders: 0,
    totalRevenue: 130,
  });

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'TRIAL' | 'CANCELLED'>('ALL');

  // Modals state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanDefinition | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'KHQR' | 'CARD' | 'BANK'>('KHQR');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [lastTxId, setLastTxId] = useState('');

  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [selectedSubPlan, setSelectedSubPlan] = useState<SubscriptionPlan | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Payment Form State
  const [cardName, setCardName] = useState('Pharmacist Owner');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8892');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const [subsRes, branchesRes, usersRes, overviewRes] = await Promise.all([
        subscriptionPlansApi.getByOrganization(organizationId).catch(() => null),
        branchesApi.listAll(0, 100).catch(() => null),
        usersApi.listAll(0, 100).catch(() => null),
        dashboardApi.getOverview().catch(() => null),
      ]);

      const subList = Array.isArray(subsRes) ? subsRes : (subsRes as any)?.content || [];
      setSubscriptions(subList);

      const branchCount = (branchesRes as any)?.content?.length || (Array.isArray(branchesRes) ? branchesRes.length : 1);
      const userCount = (usersRes as any)?.content?.length || (Array.isArray(usersRes) ? usersRes.length : 1);
      const productCount = (overviewRes as any)?.totalProducts || 5;
      const todayOrders = (overviewRes as any)?.todayOrders || 0;
      const totalRevenue = (overviewRes as any)?.totalRevenue || 130;

      setUsageMetrics({
        branches: branchCount,
        users: userCount,
        products: productCount,
        todayOrders,
        totalRevenue,
      });
    } catch (error) {
      console.error('Failed to load subscription data:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [organizationId]);

  // Active Subscription Resolution
  const activeSubscription = useMemo(() => {
    return subscriptions.find(s => s.status === 'ACTIVE') || subscriptions[0] || {
      id: 1,
      organizationId: organizationId,
      planName: 'Starter',
      maxBranches: 3,
      maxUsers: 10,
      status: 'ACTIVE' as const,
      startsAt: new Date().toISOString().split('T')[0],
      endsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
  }, [subscriptions, organizationId]);

  // Active Plan Definition
  const matchedActivePlan = useMemo(() => {
    return PLANS.find(p => p.name.toLowerCase() === (activeSubscription?.planName || '').toLowerCase()) || PLANS[0];
  }, [activeSubscription]);

  // Filtered Subscriptions History Table
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(sub => {
      if (statusFilter !== 'ALL' && sub.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          sub.planName.toLowerCase().includes(q) ||
          sub.id.toString().includes(q) ||
          sub.status.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [subscriptions, statusFilter, searchTerm]);

  // Pricing Helpers
  const formatPrice = (amountUsd: number) => {
    if (currency === 'KHR') {
      const khr = Math.round(amountUsd * 4100);
      return `${khr.toLocaleString()} ៛`;
    }
    return `$${amountUsd.toFixed(2)}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getDaysRemaining = (endsAtStr?: string) => {
    if (!endsAtStr) return 0;
    try {
      const end = new Date(endsAtStr).getTime();
      const now = new Date().getTime();
      const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      return Math.max(0, diff);
    } catch {
      return 0;
    }
  };

  // Checkout Handlers
  const handleOpenCheckout = (plan: PlanDefinition) => {
    setCheckoutPlan(plan);
    setPaymentSuccess(false);
    setCouponCode('');
    setAppliedDiscount(0);
    setCheckoutModalOpen(true);
  };

  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'PHARMACY20' || couponCode.trim().toUpperCase() === 'BENTO20') {
      setAppliedDiscount(0.2);
      toast.success('Coupon Applied: 20% discount activated!');
    } else {
      toast.error('Invalid coupon code. Try "PHARMACY20"');
    }
  };

  const calculateFinalPrice = (plan: PlanDefinition) => {
    const base = billingCycle === 'YEARLY' ? plan.yearlyPrice * 12 : plan.monthlyPrice;
    return base * (1 - appliedDiscount);
  };

  const handleConfirmPayment = async () => {
    if (!checkoutPlan) return;
    setIsProcessingPayment(true);
    try {
      const checkoutReq: SubscriptionCheckoutRequest = {
        organizationId: Number(organizationId),
        planName: checkoutPlan.name,
        billingCycle: billingCycle,
        maxBranches: checkoutPlan.maxBranches,
        maxUsers: checkoutPlan.maxUsers,
        paymentMethod: paymentMethod,
        paymentToken: `TXN-${Date.now().toString().slice(-8)}`,
      };

      await subscriptionPlansApi.checkout(checkoutReq);
      setLastTxId(`TXN-${Date.now().toString().slice(-8)}`);
      setPaymentSuccess(true);
      toast.success(`Successfully upgraded to ${checkoutPlan.name} Plan!`);
      await fetchSubscriptions();
    } catch (err) {
      console.error('Subscription checkout failed:', err);
      handleApiError(err);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!selectedSubPlan) return;
    setIsCancelling(true);
    try {
      await subscriptionPlansApi.cancel(selectedSubPlan.id);
      toast.success(`Subscription #${selectedSubPlan.id} cancelled successfully.`);
      setShowManageModal(false);
      await fetchSubscriptions();
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
      handleApiError(err);
    } finally {
      setIsCancelling(false);
    }
  };

  // Invoice Printing Handler
  const handlePrintSubscriptionInvoice = (subPlan?: SubscriptionPlan) => {
    const sub = subPlan || activeSubscription;
    const plan = PLANS.find(p => p.name.toLowerCase() === (sub?.planName || '').toLowerCase()) || PLANS[0];
    const amount = billingCycle === 'YEARLY' ? plan.yearlyPrice * 12 : plan.monthlyPrice;

    printOfficialInvoice({
      invoiceNumber: `INV-SUB-${sub.id.toString().padStart(5, '0')}`,
      date: formatDate(sub.createdAt || sub.startsAt),
      dueDate: formatDate(sub.endsAt),
      orgName: `Pharmacy Network (Org #${sub.organizationId})`,
      orgId: sub.organizationId,
      planName: plan.name,
      maxBranches: sub.maxBranches,
      maxUsers: sub.maxUsers,
      billingPeriod: `${billingCycle} (${formatDate(sub.startsAt)} - ${formatDate(sub.endsAt)})`,
      subtotal: amount,
      discount: appliedDiscount * amount,
      tax: 0,
      total: amount * (1 - appliedDiscount),
      paymentMethod: `${paymentMethod} Transfer`,
      status: sub.status,
    });
  };

  const handleExportCSV = () => {
    if (subscriptions.length === 0) {
      toast.error('No subscriptions found to export.');
      return;
    }
    const headers = ['Subscription ID', 'Plan Name', 'Org ID', 'Max Branches', 'Max Users', 'Status', 'Starts At', 'Ends At', 'Created At'];
    const rows = subscriptions.map(s => [
      s.id,
      s.planName,
      s.organizationId,
      s.maxBranches,
      s.maxUsers,
      s.status,
      s.startsAt,
      s.endsAt,
      s.createdAt,
    ]);
    exportToCSV('Pharmacy_Subscriptions_Ledger', headers, rows);
    toast.success('Subscription records exported to CSV!');
  };

  if (loading) {
    return <PageSkeleton />;
  }

  // Calculate percentage gauges
  const branchPct = Math.min(100, Math.round((usageMetrics.branches / (activeSubscription?.maxBranches || 3)) * 100));
  const userPct = Math.min(100, Math.round((usageMetrics.users / (activeSubscription?.maxUsers || 10)) * 100));
  const productPct = Math.min(100, Math.round((usageMetrics.products / (matchedActivePlan.maxProducts || 5000)) * 100));
  const daysLeft = getDaysRemaining(activeSubscription?.endsAt);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Crown className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Subscription &amp; Quota Analytics
              </h1>
              <p className="text-xs text-slate-400">
                Enterprise SaaS capacity monitoring, live quota gauges, and tier billing governance.
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Currency Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-700/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                currency === 'USD'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrency('KHR')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                currency === 'KHR'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              KHR (៛)
            </button>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-700/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                billingCycle === 'MONTHLY'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('YEARLY')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                billingCycle === 'YEARLY'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <span>Yearly</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-400 text-emerald-950 rounded-md font-extrabold uppercase">
                Save 20%
              </span>
            </button>
          </div>

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
              fetchSubscriptions();
            }}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs rounded-2xl"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* 2. Top Bento KPI Cards (4 KPI Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Subscription Tier */}
        <Card className="p-5 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/60 rounded-3xl shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Tier</span>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{activeSubscription.planName}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {activeSubscription.status}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Crown className="h-6 w-6" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700/40 mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-400">Renewal Cycle</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {daysLeft} Days Remaining ({formatDate(activeSubscription.endsAt)})
            </span>
          </div>
        </Card>

        {/* KPI 2: Branch Quota Capacity */}
        <Card className="p-5 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/60 rounded-3xl shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Store Branches</span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{usageMetrics.branches}</h3>
                <span className="text-xs text-slate-400">/ {activeSubscription.maxBranches} Max Allowed</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Building2 className="h-6 w-6" />
            </div>
          </div>

          {/* Linear Progress Gauge */}
          <div className="pt-3 space-y-1.5 mt-2">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-400">Capacity Usage</span>
              <span className={branchPct >= 90 ? 'text-rose-500' : 'text-blue-600 dark:text-blue-400'}>{branchPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  branchPct >= 90 ? 'bg-rose-500' : branchPct >= 70 ? 'bg-amber-500' : 'bg-blue-500'
                }`}
                style={{ width: `${branchPct}%` }}
              />
            </div>
          </div>
        </Card>

        {/* KPI 3: User Accounts Quota */}
        <Card className="p-5 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/60 rounded-3xl shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Staff Accounts</span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{usageMetrics.users}</h3>
                <span className="text-xs text-slate-400">/ {activeSubscription.maxUsers} Max Allowed</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Users className="h-6 w-6" />
            </div>
          </div>

          {/* Linear Progress Gauge */}
          <div className="pt-3 space-y-1.5 mt-2">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-400">Seats Occupied</span>
              <span className={userPct >= 90 ? 'text-rose-500' : 'text-purple-600 dark:text-purple-400'}>{userPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  userPct >= 90 ? 'bg-rose-500' : userPct >= 70 ? 'bg-amber-500' : 'bg-purple-500'
                }`}
                style={{ width: `${userPct}%` }}
              />
            </div>
          </div>
        </Card>

        {/* KPI 4: Catalog & Product SKU Quota */}
        <Card className="p-5 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/60 rounded-3xl shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Catalog SKUs</span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{usageMetrics.products}</h3>
                <span className="text-xs text-slate-400">/ {matchedActivePlan.maxProducts.toLocaleString()} Limit</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Package className="h-6 w-6" />
            </div>
          </div>

          {/* Linear Progress Gauge */}
          <div className="pt-3 space-y-1.5 mt-2">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-400">SKU Utilization</span>
              <span className="text-amber-600 dark:text-amber-400">{productPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${Math.max(5, productPct)}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Hero Active Subscription Telemetry Card */}
      <Card className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl border-0 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Enterprise SLA Guaranteed · Organization #{activeSubscription.organizationId}</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              {activeSubscription.planName} Plan Active Subscription
            </h2>

            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Your pharmacy network is currently operating on the <span className="text-emerald-400 font-bold">{activeSubscription.planName} Tier</span> with capacity for {activeSubscription.maxBranches} store branches and {activeSubscription.maxUsers} users. Next scheduled renewal is on <span className="text-white font-bold">{formatDate(activeSubscription.endsAt)}</span>.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>134-Permission Access Matrix</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Bakong KHQR &amp; POS Integration</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Multi-Warehouse Batch Auditing</span>
              </div>
            </div>
          </div>

          {/* Quick Actions inside Hero */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <Button
              variant="primary"
              onClick={() => handleOpenCheckout(PLANS[1])}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-500/20 py-3 flex items-center justify-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Upgrade / Change Tier
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePrintSubscriptionInvoice()}
              className="border-slate-600 text-white hover:bg-slate-700 font-bold text-xs rounded-2xl py-3 flex items-center justify-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Tax Invoice
            </Button>
            <button
              onClick={() => setShowMatrixModal(true)}
              className="text-xs text-slate-400 hover:text-white underline text-center pt-1"
            >
              View Full Feature Comparison Matrix
            </button>
          </div>
        </div>
      </Card>

      {/* 4. Pricing Tiers Matrix (Bento Cards) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              SaaS Subscription Plans
            </h2>
            <p className="text-xs text-slate-400">
              Select or upgrade the subscription tier that best matches your pharmacy retail chain expansion.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {PLANS.map(plan => {
            const isCurrentPlan = activeSubscription?.planName?.toLowerCase() === plan.name.toLowerCase();
            const price = billingCycle === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice;
            const PlanIcon = plan.icon;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 bg-white dark:bg-slate-800 border transition-all duration-300 flex flex-col justify-between ${
                  isCurrentPlan
                    ? 'border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-4 ring-emerald-500/10 dark:ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 shadow-xs'
                }`}
              >
                {/* Plan Header */}
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-700/60 text-slate-900 dark:text-slate-100">
                      <PlanIcon className="h-6 w-6" />
                    </div>

                    {isCurrentPlan ? (
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500 text-white shadow-xs flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5" />
                        ACTIVE PLAN
                      </span>
                    ) : plan.badge ? (
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs">
                        {plan.badge}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">{plan.name}</h3>
                  <p className="text-xs text-slate-400 min-h-[36px] mb-4">{plan.description}</p>

                  {/* Price Tag */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/60 mb-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                        {formatPrice(price)}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        / month {billingCycle === 'YEARLY' ? '(billed yearly)' : ''}
                      </span>
                    </div>
                    {billingCycle === 'YEARLY' && (
                      <span className="inline-block mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        Total {formatPrice(price * 12)} per year (20% off)
                      </span>
                    )}
                  </div>

                  {/* Capacity Bullet Highlights */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50/60 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-700/40 text-xs font-bold text-slate-700 dark:text-slate-300 mb-5">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span>{plan.maxBranches} Branches</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span>{plan.maxUsers} Users</span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-2.5 mb-6">
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                      Included Capabilities
                    </span>
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan Action Button */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700/40">
                  {isCurrentPlan ? (
                    <Button
                      variant="outline"
                      className="w-full font-bold text-xs rounded-2xl border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                      onClick={() => handlePrintSubscriptionInvoice()}
                    >
                      <Printer className="h-3.5 w-3.5 mr-1.5" />
                      Active (Print Invoice)
                    </Button>
                  ) : (
                    <Button
                      variant={plan.colorTheme.button}
                      className="w-full font-bold text-xs rounded-2xl shadow-md flex items-center justify-center gap-1.5"
                      onClick={() => handleOpenCheckout(plan)}
                    >
                      <Zap className="h-3.5 w-3.5" />
                      Switch to {plan.name}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Invoices & Historical Subscription Ledger Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Subscription Invoices &amp; Ledger History
            </h3>
            <p className="text-xs text-slate-400">
              Audit trail of SaaS subscriptions, capacity limits, and tax invoices.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-700/60 rounded-xl text-xs font-bold">
              {(['ALL', 'ACTIVE', 'TRIAL', 'CANCELLED'] as const).map(st => (
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

        {filteredSubscriptions.length === 0 ? (
          <EmptyState
            title="No subscription records found"
            description="There are currently no matching subscription invoices in this filter view."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 dark:border-slate-700/60">
                  <TableHead className="text-xs font-bold">INVOICE ID</TableHead>
                  <TableHead className="text-xs font-bold">PLAN TIER</TableHead>
                  <TableHead className="text-xs font-bold">BRANCH QUOTA</TableHead>
                  <TableHead className="text-xs font-bold">USER QUOTA</TableHead>
                  <TableHead className="text-xs font-bold">PERIOD (START - EXPIRY)</TableHead>
                  <TableHead className="text-xs font-bold">STATUS</TableHead>
                  <TableHead className="text-xs font-bold text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map(sub => (
                  <TableRow key={sub.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/30 transition-colors">
                    <TableCell className="font-mono font-bold text-xs text-primary">
                      #INV-SUB-{sub.id.toString().padStart(5, '0')}
                    </TableCell>
                    <TableCell className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {sub.planName} Plan
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                      {sub.maxBranches} Store Branches
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                      {sub.maxUsers} Staff Seats
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                      {formatDate(sub.startsAt)} → {formatDate(sub.endsAt)}
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
                          onClick={() => handlePrintSubscriptionInvoice(sub)}
                          className="h-7 text-xs px-2.5 rounded-xl flex items-center gap-1"
                        >
                          <Printer className="h-3 w-3" />
                          Invoice
                        </Button>
                        {sub.status === 'ACTIVE' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSubPlan(sub);
                              setShowManageModal(true);
                            }}
                            className="h-7 text-xs px-2.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            Manage
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* 6. MODAL: Checkout & Upgrade Plan */}
      {checkoutModalOpen && checkoutPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-2xl">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                    Upgrade to {checkoutPlan.name} Plan
                  </h3>
                  <p className="text-xs text-slate-400">
                    Confirm your tier upgrade and simulated payment settlement.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {paymentSuccess ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                  <CheckCircle className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                    Upgrade Successful!
                  </h4>
                  <p className="text-xs text-slate-400">
                    Transaction reference: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{lastTxId}</span>
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl text-xs space-y-1.5 text-slate-600 dark:text-slate-300 text-left">
                  <div className="flex justify-between">
                    <span>Activated Plan:</span>
                    <span className="font-bold">{checkoutPlan.name} Tier</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Allocated Branches:</span>
                    <span className="font-bold">{checkoutPlan.maxBranches} Branches</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Allocated Staff Seats:</span>
                    <span className="font-bold">{checkoutPlan.maxUsers} Users</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl text-xs"
                    onClick={() => handlePrintSubscriptionInvoice()}
                  >
                    <Printer className="h-3.5 w-3.5 mr-1.5" />
                    Print Receipt
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1 rounded-xl text-xs font-bold"
                    onClick={() => setCheckoutModalOpen(false)}
                  >
                    Done &amp; Return
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Plan Summary Box */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Selected Plan:</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">{checkoutPlan.name} Plan</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Billing Cycle:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{billingCycle}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Total Price:</span>
                    <span className="text-base font-black text-primary font-mono">
                      {formatPrice(calculateFinalPrice(checkoutPlan))}
                    </span>
                  </div>
                </div>

                {/* Coupon Code Input */}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Coupon code (e.g. PHARMACY20)"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    className="text-xs uppercase font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleApplyCoupon}
                    className="text-xs rounded-xl shrink-0"
                  >
                    Apply
                  </Button>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'KHQR', label: 'Bakong KHQR', icon: QrCode },
                      { id: 'CARD', label: 'Credit Card', icon: CreditCard },
                      { id: 'BANK', label: 'Bank Transfer', icon: Building2 },
                    ].map(pm => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id as any)}
                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                          paymentMethod === pm.id
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <pm.icon className="h-5 w-5" />
                        <span>{pm.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === 'KHQR' && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 text-center space-y-2">
                    <QrCode className="h-16 w-16 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      Scan with any Cambodian Mobile Banking App (ABA, Wing, ACLEDA, Bakong)
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      Instant settlement verification via National Bank of Cambodia Bakong network.
                    </p>
                  </div>
                )}

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCheckoutModalOpen(false)}
                    className="text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isProcessingPayment}
                    onClick={handleConfirmPayment}
                    className="text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Processing Settlement...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-3.5 w-3.5" />
                        <span>Authorize &amp; Upgrade Plan</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. MODAL: Full Feature Comparison Matrix */}
      {showMatrixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-4xl shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-2xl">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                    Comprehensive Feature Comparison Matrix
                  </h3>
                  <p className="text-xs text-slate-400">
                    Detailed capability breakdown between Starter, Professional, and Enterprise tiers.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMatrixModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 dark:border-slate-700">
                    <TableHead className="text-xs font-bold">SYSTEM CAPABILITY</TableHead>
                    <TableHead className="text-xs font-bold text-center">STARTER</TableHead>
                    <TableHead className="text-xs font-bold text-center text-primary">PROFESSIONAL</TableHead>
                    <TableHead className="text-xs font-bold text-center text-indigo-500">ENTERPRISE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {FEATURE_MATRIX.map((row, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                      <TableCell className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {row.name}
                      </TableCell>
                      <TableCell className="text-xs text-center text-slate-600 dark:text-slate-300">
                        {row.starter}
                      </TableCell>
                      <TableCell className="text-xs text-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20">
                        {row.pro}
                      </TableCell>
                      <TableCell className="text-xs text-center font-bold text-indigo-600 dark:text-indigo-400">
                        {row.enterprise}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-700 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMatrixModal(false)}
                className="text-xs rounded-xl"
              >
                Close Comparison
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: Cancel / Manage Subscription Confirmation */}
      {showManageModal && selectedSubPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 rounded-2xl">
                <AlertTriangle className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Cancel Subscription #{selectedSubPlan.id}?
                </h3>
                <p className="text-xs text-slate-400">
                  Plan: {selectedSubPlan.planName} · Org #{selectedSubPlan.organizationId}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Cancelling this subscription will suspend auto-renewals. Your pharmacy branches and staff accounts will continue working until <span className="font-bold text-slate-900 dark:text-slate-100">{formatDate(selectedSubPlan.endsAt)}</span>.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowManageModal(false)}
                className="text-xs rounded-xl"
              >
                Keep Active
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isCancelling}
                onClick={handleCancelSubscription}
                className="text-xs font-bold rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
