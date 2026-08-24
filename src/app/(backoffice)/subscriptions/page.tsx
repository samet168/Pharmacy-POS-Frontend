'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { LoadingSkeleton, CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/utils/errorHandler';
import { subscriptionPlansApi, SubscriptionPlan } from '@/lib/api/subscriptionPlans';
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
  Info
} from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';
import { printOfficialInvoice, exportToCSV } from '@/lib/utils/exportUtils';

interface PlanDefinition {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxBranches: number;
  maxUsers: number;
  description: string;
  badge?: string;
  icon: any;
  colorTheme: {
    badgeBg: string;
    border: string;
    glow: string;
    button: 'primary' | 'outline';
  };
  features: string[];
}

const PLANS: PlanDefinition[] = [
  {
    name: 'Starter',
    monthlyPrice: 29,
    yearlyPrice: 23,
    maxBranches: 3,
    maxUsers: 10,
    description: 'Essential POS solution tailored for single or small pharmacy branches.',
    icon: Zap,
    colorTheme: {
      badgeBg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-800',
      glow: 'hover:shadow-slate-500/10',
      button: 'outline',
    },
    features: [
      'Up to 3 Pharmacy Branches',
      'Up to 10 Cashier / Admin Accounts',
      'Basic Inventory & Stock Catalog',
      'Standard POS Sales & Receipts',
      'Daily Sales & Revenue Reports',
      'Standard Email Support',
    ],
  },
  {
    name: 'Professional',
    monthlyPrice: 79,
    yearlyPrice: 63,
    maxBranches: 10,
    maxUsers: 50,
    description: 'Advanced multi-branch feature suite for growing pharmacy networks.',
    badge: 'MOST POPULAR',
    icon: Crown,
    colorTheme: {
      badgeBg: 'bg-gradient-to-r from-bento-primary to-emerald-600 text-white shadow-sm',
      border: 'border-2 border-bento-primary ring-4 ring-bento-primary/10 dark:ring-bento-primary/20',
      glow: 'hover:shadow-bento-primary/25',
      button: 'primary',
    },
    features: [
      'Up to 10 Pharmacy Branches',
      'Up to 50 Users with Custom Role Permissions',
      'Advanced Inventory & Low Stock Alerts',
      'Customer Prescription Tracking',
      'Bakong KHQR & Card Payment Integration',
      'Real-time Analytics, Profit & Audit Logs',
      'Priority 24/7 Dedicated Support',
    ],
  },
  {
    name: 'Enterprise',
    monthlyPrice: 199,
    yearlyPrice: 159,
    maxBranches: 100,
    maxUsers: 500,
    description: 'Unlimited scale & dedicated cloud infrastructure for large chains.',
    icon: Shield,
    colorTheme: {
      badgeBg: 'bg-indigo-600 text-white',
      border: 'border border-indigo-200 dark:border-indigo-900/50',
      glow: 'hover:shadow-indigo-500/15',
      button: 'outline',
    },
    features: [
      'Up to 100 Pharmacy Branches',
      'Up to 500 Staff Accounts',
      'Multi-tier Warehouse & Inter-branch Transfer',
      'Custom API, ERP & Accounting Integration',
      'Dedicated Account Manager & SLA Guarantee',
      '99.99% Uptime Guarantee & Custom Backups',
      '24/7 On-Call Technical Support',
    ],
  },
];

// Feature matrix items for full plan comparison modal
const FEATURE_MATRIX = [
  { name: 'Max Pharmacy Branches', starter: '3 Branches', pro: '10 Branches', enterprise: '100 Branches' },
  { name: 'Max Staff Accounts', starter: '10 Users', pro: '50 Users', enterprise: '500 Users' },
  { name: 'POS Terminals & Offline Mode', starter: 'Standard', pro: 'Advanced Sync', enterprise: 'Unlimited High-Speed' },
  { name: 'Inventory & Batch Expiry Tracking', starter: 'Basic', pro: 'Advanced Multi-batch', enterprise: 'Full Warehouse Suite' },
  { name: 'Customer Prescriptions & Medical History', starter: '—', pro: 'Included', enterprise: 'Included + EHR Export' },
  { name: 'Bakong KHQR & Card Online Gateways', starter: 'Standard', pro: 'Instant Settlement', enterprise: 'Custom Payment API' },
  { name: 'Custom User Roles & Access Permissions', starter: 'Basic', pro: 'Granular Matrix', enterprise: 'Unlimited Custom Roles' },
  { name: 'Inter-Branch Stock Transfer', starter: '—', pro: 'Supported', enterprise: 'Multi-Warehouse Automated' },
  { name: 'Audit Logs & Financial Analytics', starter: 'Basic Reports', pro: 'Real-time Profit & Audit', enterprise: 'Custom BI & Financials' },
  { name: 'API & ERP Integration', starter: '—', pro: 'REST API Access', enterprise: 'Full REST + Webhooks' },
  { name: 'Customer Support SLA', starter: 'Email (24h)', pro: 'Priority 24/7 Phone & Email', enterprise: 'Dedicated Manager (15m SLA)' },
];

export default function SubscriptionsPage() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;

  const [subscriptions, setSubscriptions] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [currency, setCurrency] = useState<'USD' | 'KHR'>('USD');
  const [autoRenew, setAutoRenew] = useState(true);

  // Modals state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanDefinition | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'KHQR' | 'BANK'>('CARD');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [lastTxId, setLastTxId] = useState('');

  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [selectedSubPlan, setSelectedSubPlan] = useState<SubscriptionPlan | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Form input state
  const [cardName, setCardName] = useState('Super Admin');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8892');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await subscriptionPlansApi.getByOrganization(organizationId);
      setSubscriptions(Array.isArray(data) ? data : []);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [organizationId]);

  const activeSubscription = subscriptions.find((s) => s.status === 'ACTIVE') || subscriptions[0];

  const openCheckoutModal = (plan: PlanDefinition) => {
    setCheckoutPlan(plan);
    setPaymentSuccess(false);
    setAppliedDiscount(0);
    setCouponCode('');
    setCheckoutModalOpen(true);
  };

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (code === 'PHARMACY20' || code === 'PROMO20' || code === 'SUPERADMIN') {
      setAppliedDiscount(0.2);
      toast.success('Promo code applied! 20% discount applied to total.');
    } else if (code) {
      toast.error('Invalid promo code. Try "PHARMACY20"');
    }
  };

  const handleConfirmCheckout = async () => {
    if (!checkoutPlan) return;

    try {
      setIsProcessingPayment(true);
      toast.loading(`Processing payment for ${checkoutPlan.name} Plan...`, { id: 'payment-tx' });

      await new Promise((resolve) => setTimeout(resolve, 1800));

      await subscriptionPlansApi.checkout({
        organizationId,
        planName: checkoutPlan.name,
        billingCycle,
        maxBranches: checkoutPlan.maxBranches,
        maxUsers: checkoutPlan.maxUsers,
        paymentMethod: paymentMethod === 'CARD' ? 'STRIPE_CARD' : paymentMethod === 'KHQR' ? 'ABA_KHQR' : 'BANK_TRANSFER',
        paymentToken: `PAY-${Date.now()}`,
      });

      const txNumber = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
      setLastTxId(txNumber);
      setPaymentSuccess(true);
      toast.success(`Payment Confirmed! ${checkoutPlan.name} Plan activated.`, { id: 'payment-tx' });

      await fetchSubscriptions();
    } catch (error) {
      toast.error(`Checkout failed. Please try again.`, { id: 'payment-tx' });
      handleApiError(error);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!selectedSubPlan) return;
    try {
      setIsCancelling(true);
      toast.loading('Processing subscription cancellation...', { id: 'cancel-sub' });
      await subscriptionPlansApi.cancel(selectedSubPlan.id);
      toast.success(`Subscription #${selectedSubPlan.id} (${selectedSubPlan.planName}) has been cancelled.`, { id: 'cancel-sub' });
      await fetchSubscriptions();
      setShowManageModal(false);
    } catch (error) {
      toast.error('Failed to cancel subscription', { id: 'cancel-sub' });
      handleApiError(error);
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePrintSubscriptionInvoice = (subPlan?: SubscriptionPlan) => {
    const plan = checkoutPlan || PLANS.find(p => p.name.toLowerCase() === (subPlan?.planName || activeSubscription?.planName || '').toLowerCase()) || PLANS[1];
    printOfficialInvoice({
      invoiceNumber: subPlan ? `INV-2026-${subPlan.id}` : lastTxId || `INV-${Date.now()}`,
      date: subPlan?.startsAt ? formatDate(subPlan.startsAt) : new Date().toLocaleDateString('en-US'),
      dueDate: subPlan?.endsAt ? formatDate(subPlan.endsAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US'),
      orgName: `Pharmacy Organization #${organizationId}`,
      orgId: organizationId,
      planName: plan.name,
      maxBranches: subPlan?.maxBranches || plan.maxBranches,
      maxUsers: subPlan?.maxUsers || plan.maxUsers,
      billingPeriod: billingCycle === 'YEARLY' ? '12 Months (Yearly)' : '1 Month (Monthly)',
      subtotal: plan.monthlyPrice,
      discount: discountAmount,
      tax: plan.monthlyPrice * 0.1,
      total: plan.monthlyPrice * 1.1,
      paymentMethod: 'Credit Card / ABA KHQR',
      status: subPlan?.status || 'PAID',
    });
    toast.success('Opening printable official invoice...');
  };

  const toggleAutoRenew = () => {
    const nextState = !autoRenew;
    setAutoRenew(nextState);
    toast.success(`Auto-renewal has been turned ${nextState ? 'ON' : 'OFF'}.`);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      TRIAL: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
      ACTIVE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
      SUSPENDED: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
      CANCELLED: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
    };
    return colors[status] || 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-400';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (endDate?: string) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const formatCurrency = (usdVal: number) => {
    if (currency === 'KHR') {
      return `៛${Math.round(usdVal * 4100).toLocaleString()}`;
    }
    return `$${usdVal}`;
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <LoadingSkeleton variant="text" width={240} height={36} />
            <LoadingSkeleton variant="text" width={340} height={20} className="mt-2" />
          </div>
          <LoadingSkeleton variant="rectangular" width={160} height={42} />
        </div>
        <CardSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Calculate pricing breakdown
  const baseMonthly = checkoutPlan ? (billingCycle === 'YEARLY' ? checkoutPlan.yearlyPrice : checkoutPlan.monthlyPrice) : 0;
  const periodTotal = billingCycle === 'YEARLY' ? baseMonthly * 12 : baseMonthly;
  const discountAmount = periodTotal * appliedDiscount;
  const subtotal = periodTotal - discountAmount;
  const tax = subtotal * 0.1;
  const grandTotal = subtotal + tax;
  const grandTotalKHR = Math.round(grandTotal * 4100);

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Subscription & Quota Analytics
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-bento-primary/10 text-bento-primary dark:text-bento-primary-dark font-semibold text-xs rounded-full border border-bento-primary/20">
              <ShieldCheck className="h-3.5 w-3.5" /> Multi-Tenant POS SaaS
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            Manage your pharmacy branch limits, active organization plan, auto-renewal, and billing invoices.
          </p>
        </div>

        {/* Currency & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Currency Switcher */}
          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                currency === 'USD' ? 'bg-bento-primary text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              $ USD
            </button>
            <button
              type="button"
              onClick={() => setCurrency('KHR')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                currency === 'KHR' ? 'bg-bento-primary text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              ៛ KHR
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={() => setShowMatrixModal(true)} className="flex items-center gap-1.5 text-xs font-bold">
            <Sliders className="h-3.5 w-3.5" />
            Compare Features
          </Button>

          <Button variant="outline" size="sm" onClick={fetchSubscriptions} className="flex items-center gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Hero Active Subscription Banner & Quota Gauges */}
      {activeSubscription && (
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl overflow-hidden border border-indigo-500/30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-bento-primary/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            {/* Left Info Column */}
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-sm">
                  <Crown className="h-7 w-7 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                      {activeSubscription.planName} Plan
                    </h2>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      {activeSubscription.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Organization ID #{activeSubscription.organizationId} · Active since {formatDate(activeSubscription.startsAt)}
                  </p>
                </div>
              </div>

              {/* Quota Usage Gauges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between text-xs font-semibold mb-2 text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-bento-primary-dark" /> Branch Capacity Quota
                    </span>
                    <span className="text-white font-bold">{activeSubscription.maxBranches} Max Branches</span>
                  </div>
                  <div className="w-full bg-slate-800/80 h-3 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div className="bg-gradient-to-r from-bento-primary to-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: '40%' }}></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5">
                    <span>2 Branches Active</span>
                    <span className="text-emerald-400 font-bold">40% Capacity Used</span>
                  </div>
                </div>

                <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between text-xs font-semibold mb-2 text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-emerald-400" /> Staff Accounts Quota
                    </span>
                    <span className="text-white font-bold">{activeSubscription.maxUsers} Max Users</span>
                  </div>
                  <div className="w-full bg-slate-800/80 h-3 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-500" style={{ width: '25%' }}></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5">
                    <span>8 Staff Accounts Active</span>
                    <span className="text-emerald-400 font-bold">25% Capacity Used</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Expiry, Auto-renew & Upgrade Logic Column */}
            <div className="flex flex-col items-start lg:items-end justify-between gap-5 border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-8">
              <div className="text-left lg:text-right">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Next Billing / Expiration Date</p>
                <p className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  {formatDate(activeSubscription.endsAt)}
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-300 text-xs font-semibold rounded-full mt-2 border border-emerald-500/20">
                  <Clock className="h-3.5 w-3.5" />
                  {getDaysRemaining(activeSubscription.endsAt)} Days Remaining
                </div>
              </div>

              {/* Auto-renew Switch Bar */}
              <div className="flex items-center gap-3 bg-white/5 p-2 px-3 rounded-2xl border border-white/10">
                <span className="text-xs font-medium text-slate-300">Auto-Renew Subscription</span>
                <button
                  type="button"
                  onClick={toggleAutoRenew}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-1 ${
                    autoRenew ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white transition-transform ${autoRenew ? 'translate-x-5' : 'translate-x-0'}`}></span>
                </button>
              </div>

              {/* Conditional Upgrade / Active Status Badge */}
              {activeSubscription.status === 'ACTIVE' && getDaysRemaining(activeSubscription.endsAt) > 7 ? (
                <div className="flex flex-col items-start lg:items-end gap-1.5">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-2xl border border-emerald-500/40 shadow-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Subscription Active & Upgraded
                  </span>
                  <p className="text-[11px] text-slate-300 font-medium">
                    Renewal available on {formatDate(activeSubscription.endsAt)}
                  </p>
                </div>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => {
                    const targetPlan = PLANS.find((p) => p.name === 'Professional') || PLANS[1];
                    openCheckoutModal(targetPlan);
                  }}
                  className="w-full lg:w-auto justify-center gap-2 bg-gradient-to-r from-bento-primary to-emerald-500 hover:from-bento-primary-dark hover:to-emerald-600 text-white font-bold shadow-lg shadow-bento-primary/30 border-none px-6 py-2.5 text-sm"
                >
                  <Sparkles className="h-4 w-4" />
                  {activeSubscription?.status === 'ACTIVE' ? 'Renew Subscription' : 'Upgrade Organization Plan'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pricing Header & Billing Switch Toggle */}
      <div className="text-center space-y-4 pt-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-bento-primary dark:text-bento-primary-dark">
            Flexible SaaS Subscription Plans
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            Scale Your Pharmacy POS Operations
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mt-1.5">
            Choose the ideal subscription plan tailored for your pharmacy network capacity and features.
          </p>
        </div>

        {/* Monthly vs Yearly Switch Pill */}
        <div className="inline-flex items-center p-1 bg-slate-200/70 dark:bg-slate-800 rounded-full border border-slate-300/60 dark:border-slate-700 shadow-inner">
          <button
            type="button"
            onClick={() => setBillingCycle('MONTHLY')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
              billingCycle === 'MONTHLY'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('YEARLY')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
              billingCycle === 'YEARLY'
                ? 'bg-bento-primary text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Yearly Billing
            <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-black rounded-full uppercase tracking-wider animate-pulse">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 pt-2">
        {PLANS.map((plan) => {
          const IconComp = plan.icon;
          const price = billingCycle === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice;
          const isCurrentPlan = activeSubscription?.planName?.toLowerCase() === plan.name.toLowerCase();

          return (
            <div
              key={plan.name}
              className={`rounded-3xl p-6 sm:p-7 bg-white dark:bg-slate-900 flex flex-col justify-between relative transition-all duration-300 hover:-translate-y-1.5 ${plan.colorTheme.border} ${plan.colorTheme.glow} shadow-sm hover:shadow-xl`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-bento-primary via-emerald-600 to-teal-500 text-white text-[11px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                  <Crown className="h-3.5 w-3.5" />
                  {plan.badge}
                </div>
              )}

              <div>
                {/* Header Icon & Tag */}
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-bento-primary/10 dark:bg-bento-primary/20 rounded-2xl text-bento-primary dark:text-bento-primary-dark">
                    <IconComp className="h-7 w-7" />
                  </div>
                  {isCurrentPlan && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-extrabold rounded-full border border-emerald-300 dark:border-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5" /> CURRENT PLAN
                    </span>
                  )}
                </div>

                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{plan.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[36px] leading-relaxed">
                  {plan.description}
                </p>

                {/* Price Display */}
                <div className="my-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      {formatCurrency(price)}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/ month</span>
                  </div>

                  {billingCycle === 'YEARLY' ? (
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" /> Billed annually ({formatCurrency(price * 12)}/year)
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1">Billed monthly</p>
                  )}
                </div>

                {/* Feature Bullet List */}
                <div className="space-y-3 mb-8">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Included Features:</p>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                      <span className="p-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 mt-0.5 flex-shrink-0">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <Button
                variant={plan.badge ? 'primary' : 'outline'}
                className="w-full justify-center gap-2 font-bold py-3 text-sm shadow-sm"
                disabled={isCurrentPlan}
                onClick={() => openCheckoutModal(plan)}
              >
                {isCurrentPlan ? (
                  <>
                    <CheckCircle className="h-4 w-4" /> Active Plan (Renews {formatDate(activeSubscription?.endsAt)})
                  </>
                ) : (
                  <>
                    Upgrade to {plan.name} <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Subscription Invoices History Table */}
      <div className="space-y-4 pt-8 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Subscription Invoices & Payment History
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Download and print official tax invoices for your organization.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (subscriptions.length === 0) return toast.error('No subscriptions to export.');
              const headers = ['Subscription ID', 'Plan Name', 'Org ID', 'Max Branches', 'Max Users', 'Status', 'Starts On', 'Expires On'];
              const rows = subscriptions.map((s) => [s.id, s.planName, s.organizationId, s.maxBranches, s.maxUsers, s.status, s.startsAt, s.endsAt]);
              exportToCSV('Pharmacy_Subscription_History', headers, rows);
              toast.success('Subscription history exported to CSV!');
            }}
            className="flex items-center gap-2 text-xs font-bold"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        {subscriptions.length === 0 ? (
          <EmptyState
            title="No active subscriptions found"
            description="Choose a plan above to activate subscription features for your pharmacy organization."
            action={
              <Button onClick={() => openCheckoutModal(PLANS[1])} className="flex items-center gap-2">
                <Crown className="h-4 w-4" /> Select Professional Plan
              </Button>
            }
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <Card className="hidden md:block overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <Table>
                <TableHead>
                  <TableRow className="bg-slate-50/80 dark:bg-slate-800/60">
                    <TableHeader>Plan Name</TableHeader>
                    <TableHeader>Invoice Ref</TableHeader>
                    <TableHeader>Branches Quota</TableHeader>
                    <TableHeader>Users Quota</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Starts On</TableHeader>
                    <TableHeader>Expires On</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <TableRow key={sub.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <TableCell className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Crown className="h-4 w-4 text-bento-primary" />
                        {sub.planName} Plan
                      </TableCell>
                      <TableCell className="font-mono text-xs">INV-2026-0{sub.id}</TableCell>
                      <TableCell>{sub.maxBranches} Branches</TableCell>
                      <TableCell>{sub.maxUsers} Users</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${getStatusColor(sub.status)}`}>
                          {sub.status}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(sub.startsAt)}</TableCell>
                      <TableCell>{formatDate(sub.endsAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintSubscriptionInvoice(sub)}
                            className="flex items-center gap-1.5 text-xs"
                          >
                            <Printer className="h-3.5 w-3.5" /> Invoice
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSubPlan(sub);
                              setShowManageModal(true);
                            }}
                          >
                            Manage
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {/* Mobile Card List View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {subscriptions.map((sub) => (
                <Card key={sub.id} className="p-4 space-y-3 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                      <Crown className="h-4 w-4 text-bento-primary" />
                      {sub.planName} Plan
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getStatusColor(sub.status)}`}>
                      {sub.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <div>
                      <span>Max Branches: </span>
                      <strong className="text-slate-800 dark:text-slate-200">{sub.maxBranches}</strong>
                    </div>
                    <div>
                      <span>Max Users: </span>
                      <strong className="text-slate-800 dark:text-slate-200">{sub.maxUsers}</strong>
                    </div>
                    <div>
                      <span>Starts: </span>
                      <span>{formatDate(sub.startsAt)}</span>
                    </div>
                    <div>
                      <span>Expires: </span>
                      <span>{formatDate(sub.endsAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 justify-center text-xs"
                      onClick={() => handlePrintSubscriptionInvoice(sub)}
                    >
                      <Printer className="h-3.5 w-3.5 mr-1" /> Invoice
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 justify-center text-xs"
                      onClick={() => {
                        setSelectedSubPlan(sub);
                        setShowManageModal(true);
                      }}
                    >
                      Manage
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* REALISTIC CHECKOUT MODAL */}
      <Modal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        title={paymentSuccess ? 'Subscription Activated!' : `Checkout — ${checkoutPlan?.name} Plan`}
      >
        {checkoutPlan && (
          <div className="space-y-6">
            {!paymentSuccess ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Payment Details (7 cols) */}
                <div className="lg:col-span-7 space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Select Payment Method
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CARD')}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                          paymentMethod === 'CARD'
                            ? 'border-bento-primary bg-bento-primary/10 text-bento-primary dark:text-bento-primary-dark ring-2 ring-bento-primary/20'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <CreditCard className="h-5 w-5" />
                        Credit Card
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('KHQR')}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                          paymentMethod === 'KHQR'
                            ? 'border-bento-primary bg-bento-primary/10 text-bento-primary dark:text-bento-primary-dark ring-2 ring-bento-primary/20'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <QrCode className="h-5 w-5 text-rose-500" />
                        KHQR Bakong
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('BANK')}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                          paymentMethod === 'BANK'
                            ? 'border-bento-primary bg-bento-primary/10 text-bento-primary dark:text-bento-primary-dark ring-2 ring-bento-primary/20'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Building2 className="h-5 w-5" />
                        Bank Transfer
                      </button>
                    </div>
                  </div>

                  {paymentMethod === 'CARD' && (
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Stripe Card Gateway</span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                          <span>VISA</span> · <span>MC</span> · <span>AMEX</span>
                        </div>
                      </div>

                      <Input
                        label="Cardholder Name"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Super Admin"
                      />

                      <Input
                        label="Card Number"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4532 4532 4532 8892"
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Expiry (MM/YY)"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="12/28"
                        />
                        <Input
                          label="CVC Code"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          placeholder="888"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'KHQR' && (
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
                      <div className="inline-block p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 shadow-md">
                        <QrCode className="h-40 w-40 text-slate-900 dark:text-white mx-auto" />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Scan to Pay via ABA / Wing KHQR</p>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                          Total Amount: ${grandTotal.toFixed(2)} (៛{grandTotalKHR.toLocaleString()})
                        </p>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'BANK' && (
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                      <p className="font-bold text-slate-800 dark:text-slate-200">ABA Bank Transfer Details:</p>
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl space-y-1 font-mono text-slate-700 dark:text-slate-300 border">
                        <p>Name: <strong className="text-slate-900 dark:text-slate-100">PHARMACY POS SAAS LTD</strong></p>
                        <p>Account: <strong className="text-slate-900 dark:text-slate-100">000 888 999 (USD)</strong></p>
                        <p>Ref ID: <strong className="text-bento-primary">SUB-ORG-{organizationId}</strong></p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Promo Code (e.g. PHARMACY20)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm" onClick={handleApplyCoupon} className="whitespace-nowrap mt-1 font-bold">
                      Apply Promo
                    </Button>
                  </div>
                </div>

                {/* Right Column: Order Summary (5 cols) */}
                <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm border-b border-slate-200 dark:border-slate-700 pb-2 mb-3">
                      Order Summary
                    </h4>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>Plan Selected:</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{checkoutPlan.name} Plan</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>Billing Cycle:</span>
                        <span className="font-semibold">{billingCycle === 'YEARLY' ? '12 Months (20% Off)' : 'Monthly'}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>Base Rate:</span>
                        <span>{formatCurrency(baseMonthly)}/mo</span>
                      </div>
                      {appliedDiscount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Promo Discount (20%):</span>
                          <span>-{formatCurrency(discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>VAT Tax (10%):</span>
                        <span>{formatCurrency(tax)}</span>
                      </div>

                      <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-2 flex justify-between items-baseline">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Total Due:</span>
                        <div className="text-right">
                          <span className="text-2xl font-black text-bento-primary dark:text-slate-100">
                            {formatCurrency(grandTotal)}
                          </span>
                          {currency === 'USD' && <p className="text-[10px] text-slate-400 font-bold">≈ ៛{grandTotalKHR.toLocaleString()}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="primary"
                      className="w-full justify-center gap-2 text-sm font-extrabold py-3 shadow-lg"
                      disabled={isProcessingPayment}
                      onClick={handleConfirmCheckout}
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing Transaction...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" /> Pay {formatCurrency(grandTotal)} & Activate
                        </>
                      )}
                    </Button>
                    <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1 font-medium">
                      <Lock className="h-3 w-3 text-emerald-500" /> 256-bit Encrypted SSL Gateway
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Payment Success Modal Content */
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-md animate-bounce">
                  <CheckCircle className="h-10 w-10" />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Payment Success!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Your subscription has been updated to the <strong>{checkoutPlan.name} Plan</strong>.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border text-xs text-left max-w-md mx-auto space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transaction ID:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{lastTxId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Paid:</span>
                    <span className="font-bold text-emerald-600">${grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Max Branches:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{checkoutPlan.maxBranches} Branches</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Max Users:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{checkoutPlan.maxUsers} Users</span>
                  </div>
                </div>

                <div className="pt-4 flex gap-3 max-w-md mx-auto">
                  <Button
                    variant="outline"
                    className="flex-1 justify-center gap-2 font-bold"
                    onClick={() => handlePrintSubscriptionInvoice()}
                  >
                    <Printer className="h-4 w-4" /> Download / Print Invoice
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1 justify-center font-bold"
                    onClick={() => setCheckoutModalOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* FEATURE COMPARISON MATRIX MODAL */}
      <Modal
        isOpen={showMatrixModal}
        onClose={() => setShowMatrixModal(false)}
        title="Full Plan & Feature Matrix Comparison"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compare Starter, Professional, and Enterprise features across technical and pharmacy management capabilities.
          </p>

          <div className="overflow-x-auto border rounded-2xl border-slate-200 dark:border-slate-800">
            <Table>
              <TableHead>
                <TableRow className="bg-slate-50 dark:bg-slate-800">
                  <TableHeader className="w-2/5">Feature Dimension</TableHeader>
                  <TableHeader>Starter ($29)</TableHeader>
                  <TableHeader className="text-bento-primary">Professional ($79)</TableHeader>
                  <TableHeader>Enterprise ($199)</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {FEATURE_MATRIX.map((row, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50/50 text-xs">
                    <TableCell className="font-bold text-slate-900 dark:text-slate-100">{row.name}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{row.starter}</TableCell>
                    <TableCell className="font-bold text-bento-primary dark:text-bento-primary-dark">{row.pro}</TableCell>
                    <TableCell className="font-bold text-slate-900 dark:text-slate-100">{row.enterprise}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="primary" onClick={() => setShowMatrixModal(false)} className="font-bold">
              Close Comparison
            </Button>
          </div>
        </div>
      </Modal>

      {/* Subscription Manage Modal */}
      <Modal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        title="Manage Subscription Plan"
      >
        {selectedSubPlan && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{selectedSubPlan.planName} Plan</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(selectedSubPlan.status)}`}>
                  {selectedSubPlan.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-slate-600 dark:text-slate-300">
                <div>
                  <p className="text-slate-400">Max Branches</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{selectedSubPlan.maxBranches}</p>
                </div>
                <div>
                  <p className="text-slate-400">Max Users</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{selectedSubPlan.maxUsers}</p>
                </div>
                <div>
                  <p className="text-slate-400">Starts At</p>
                  <p className="font-semibold">{formatDate(selectedSubPlan.startsAt)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Ends At</p>
                  <p className="font-semibold">{formatDate(selectedSubPlan.endsAt)}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="primary"
                className="flex-1 justify-center font-bold"
                onClick={() => {
                  setShowManageModal(false);
                  openCheckoutModal(PLANS[1]);
                }}
              >
                Change Plan
              </Button>
              <Button
                variant="outline"
                className="flex-1 justify-center text-rose-600 hover:text-rose-700 border-rose-200 dark:border-rose-900/50 font-bold flex items-center gap-2"
                disabled={isCancelling}
                onClick={handleCancelSubscription}
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Subscription'
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}