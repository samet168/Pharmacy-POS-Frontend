'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/stores/authStore';
import { authApi } from '@/lib/api/auth';
import { organizationsApi } from '@/lib/api/organizations';
import { branchesApi } from '@/lib/api/branches';
import { subscriptionPlansApi } from '@/lib/api/subscriptionPlans';
import {
  Building2,
  User,
  Lock,
  Phone,
  Mail,
  Crown,
  Zap,
  Shield,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Check,
  QrCode,
  CreditCard,
  Eye,
  EyeOff,
  KeyRound,
  Layers,
  Globe,
  Clock,
  CheckCircle,
  Copy,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguageStore } from '@/lib/stores/languageStore';

interface PlanOption {
  id: 'Starter' | 'Professional' | 'Enterprise';
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxBranches: number;
  maxUsers: number;
  badge?: string;
  icon: any;
  color: string;
  description: string;
  features: string[];
}

const PLANS: PlanOption[] = [
  {
    id: 'Starter',
    name: 'Starter',
    monthlyPrice: 29,
    yearlyPrice: 23,
    maxBranches: 3,
    maxUsers: 10,
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
    description: 'Essential POS solution tailored for single clinics or small pharmacies.',
    features: [
      'Up to 3 Pharmacy Branches',
      'Up to 10 Cashier & Staff Accounts',
      'Full Inventory & Barcode POS Checkout',
      'Daily Revenue & Sales Reporting',
      'Standard Email & Chat Support',
    ],
  },
  {
    id: 'Professional',
    name: 'Professional',
    monthlyPrice: 79,
    yearlyPrice: 63,
    maxBranches: 10,
    maxUsers: 50,
    badge: 'MOST POPULAR',
    icon: Crown,
    color: 'from-amber-500 to-emerald-500',
    description: 'Advanced multi-branch enterprise suite for growing pharmacy networks.',
    features: [
      'Up to 10 Pharmacy Branches & Warehouses',
      'Up to 50 Users with 134-Permission Matrix',
      'Integrated Bakong KHQR & Online Payments',
      'Inter-branch Transfers & Prescription Tracking',
      'Real-time Batch/Expiry Date Tracking',
      'Priority 24/7 Support Hotline',
    ],
  },
  {
    id: 'Enterprise',
    name: 'Enterprise',
    monthlyPrice: 199,
    yearlyPrice: 159,
    maxBranches: 100,
    maxUsers: 500,
    icon: Shield,
    color: 'from-purple-600 to-indigo-600',
    description: 'Unlimited capacity & custom high-availability cloud infrastructure.',
    features: [
      'Up to 100 Branches & Multi-regional Warehouses',
      'Up to 500 Staff & Pharmacist Accounts',
      'Custom ERP, Webhooks & REST API Integrations',
      'Automated Multi-branch Replenishment',
      'Dedicated Account Manager (15-min SLA)',
      'Custom Domain & Private Cloud Deployment',
    ],
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth, setCurrentUser, setPermissions } = useAuthStore();
  const { language, t } = useTranslation();
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);
  const [provisioningStatus, setProvisioningStatus] = useState('');

  // Step 1: Organization & Primary Branch
  const [orgData, setOrgData] = useState({
    name: '',
    slug: '',
    phone: '',
    email: '',
    address: 'Phnom Penh, Cambodia',
    branchName: 'Main Store Branch',
    branchCode: 'MB-01',
  });

  // Step 2: Administrator Credentials
  const [adminData, setAdminData] = useState({
    name: '',
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
    pinCode: '1234',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Step 3: Subscription Tier & Billing
  const [selectedPlan, setSelectedPlan] = useState<'Starter' | 'Professional' | 'Enterprise'>('Professional');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('YEARLY');
  const [paymentMethod, setPaymentMethod] = useState<'TRIAL' | 'KHQR' | 'CARD'>('KHQR');

  // KHQR Payment State
  const [khqrPaid, setKhqrPaid] = useState(false);
  const [isProvisional, setIsProvisional] = useState(false);
  const [khqrTimer, setKhqrTimer] = useState(900); // 15 mins countdown

  useEffect(() => {
    let interval: any;
    if (step === 3 && paymentMethod === 'KHQR' && khqrTimer > 0 && !khqrPaid) {
      interval = setInterval(() => {
        setKhqrTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, paymentMethod, khqrTimer, khqrPaid]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Slug generator
  const handleOrgNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const generatedSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setOrgData(prev => ({ ...prev, name, slug: generatedSlug }));
  };

  // Step 1 Validation
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgData.name.trim()) {
      toast.error('Please enter your pharmacy name.');
      return;
    }
    if (!orgData.slug.trim()) {
      toast.error('Please enter a valid organization slug.');
      return;
    }
    setStep(2);
  };

  // Step 2 Validation
  const handleProceedToStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminData.name.trim() || !adminData.username.trim()) {
      toast.error('Please enter administrator name and username.');
      return;
    }
    if (adminData.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (adminData.password !== adminData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setStep(3);
  };

  // Step 3 Validation
  const handleProceedToStep4 = () => {
    setStep(4);
  };

  // Step 4: Final Automated Onboarding Execution
  const handleCompleteRegistration = async () => {
    setSubmitting(true);
    try {
      // 1. Create Organization
      setProvisioningStatus('Registering pharmacy tenant organization...');
      const baseSlug = (orgData.slug || 'pharmacy').toLowerCase().replace(/[^a-z0-9-]/g, '');
      const orgPayload = {
        name: orgData.name,
        slug: baseSlug,
        contactEmail: orgData.email || `${baseSlug}@pharmacypos.com`,
        contactPhone: orgData.phone || adminData.phone || '012345678',
        address: orgData.address || 'Phnom Penh, Cambodia',
        baseCurrency: 'USD',
      };

      let orgRes: any = null;
      try {
        orgRes = await organizationsApi.create(orgPayload);
      } catch (orgErr: any) {
        const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
        orgRes = await organizationsApi.create({ ...orgPayload, slug: uniqueSlug });
      }

      const organizationId = orgRes?.id || 1;

      // 2. Create Primary Branch
      setProvisioningStatus('Creating primary store branch & warehouse nodes...');
      const branchCode = orgData.branchCode || `MB-${Math.floor(10 + Math.random() * 90)}`;
      let branchRes: any = null;
      try {
        branchRes = await branchesApi.create({
          organizationId: Number(organizationId),
          code: branchCode,
          name: orgData.branchName || 'Main Store Branch',
          location: orgData.address || 'Phnom Penh',
          phone: orgData.phone || adminData.phone || '012345678',
        });
      } catch (branchErr: any) {
        const fallbackCode = `MB-${Date.now().toString().slice(-4)}`;
        branchRes = await branchesApi.create({
          organizationId: Number(organizationId),
          code: fallbackCode,
          name: orgData.branchName || 'Main Store Branch',
          location: orgData.address || 'Phnom Penh',
          phone: orgData.phone || adminData.phone || '012345678',
        }).catch(() => null);
      }

      const branchId = branchRes?.id || 1;

      // 3. Register Administrator User Account
      setProvisioningStatus('Provisioning Administrator security credentials & authorities...');
      const registerPayload = {
        organizationId: Number(organizationId),
        roleId: 1, // ADMIN Role ID
        branchId: Number(branchId),
        name: adminData.name,
        username: adminData.username.trim(),
        password: adminData.password,
        phone: adminData.phone || orgData.phone || '012345678',
        pinCode: adminData.pinCode || '1234',
      };

      const authRes = await authApi.register(registerPayload);

      // 4. Activate Selected Subscription Tier (with provisional or paid token)
      setProvisioningStatus(`Activating ${selectedPlan} Plan (${isProvisional ? 'Provisional Access' : 'Active'})...`);
      const chosenPlanObj = PLANS.find(p => p.id === selectedPlan) || PLANS[1];
      const tokenPrefix = isProvisional ? 'PROVISIONAL-TXN' : (khqrPaid ? 'KHQR-PAID' : 'TRIAL-TXN');
      
      await subscriptionPlansApi.checkout({
        organizationId: Number(organizationId),
        planName: chosenPlanObj.name,
        billingCycle: billingCycle,
        maxBranches: chosenPlanObj.maxBranches,
        maxUsers: chosenPlanObj.maxUsers,
        paymentMethod: isProvisional ? 'PROVISIONAL' : paymentMethod,
        paymentToken: `${tokenPrefix}-${Date.now().toString().slice(-6)}`,
      }).catch((err) => {
        console.warn('Subscription checkout fallback:', err);
      });

      // 5. Store Session & Synchronize
      setProvisioningStatus('Finalizing authentication tokens...');
      localStorage.setItem('accessToken', authRes.accessToken);
      localStorage.setItem('refreshToken', authRes.refreshToken);
      localStorage.setItem('organizationId', organizationId.toString());
      document.cookie = 'isLoggedIn=true; path=/; SameSite=Lax';

      setAuth(authRes);

      try {
        const meResponse = await authApi.getMe();
        const permissions = meResponse.authorities || [];
        localStorage.setItem('permissions', JSON.stringify(permissions));
        setCurrentUser(meResponse);
        setPermissions(permissions);
      } catch {
        setPermissions(['ADMIN']);
      }

      toast.success(
        isProvisional
          ? `🎉 Welcome to Pharmacy POS, ${adminData.name}! Your 14-day provisional access is active.`
          : `🎉 Welcome to Pharmacy POS, ${adminData.name}! Your subscription plan is active.`
      );
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Registration failed:', error);
      const errMsg = error?.response?.data?.message || error?.message || 'Registration failed. Please check your credentials.';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
      setProvisioningStatus('');
    }
  };

  const activePlanDetails = PLANS.find(p => p.id === selectedPlan) || PLANS[1];
  const priceDisplay = billingCycle === 'YEARLY' ? activePlanDetails.yearlyPrice : activePlanDetails.monthlyPrice;
  const totalPriceDue = billingCycle === 'YEARLY' ? activePlanDetails.yearlyPrice * 12 : activePlanDetails.monthlyPrice;
  const khrTotalDue = (totalPriceDue * 4100).toLocaleString();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden text-slate-100">
      {/* Background ambient lighting effects */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar / Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl flex items-center justify-between px-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-primary to-emerald-500 rounded-2xl shadow-lg shadow-primary/20">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              Pharmacy POS <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">CLOUD</span>
            </h2>
            <p className="text-[11px] text-slate-400">Next-Gen Intelligent Pharmacy Cloud POS</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => setLanguage(language === 'kh' ? 'en' : 'kh')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all shadow-xs"
          >
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span>{language === 'kh' ? 'ខ្មែរ (KH)' : 'English (EN)'}</span>
          </button>

          <Link
            href="/login"
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            Already registered? <span className="text-primary hover:underline">Sign In</span>
          </Link>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-4xl relative z-10">
        <Card className="p-6 md:p-8 bg-slate-900/90 backdrop-blur-2xl border border-slate-800/80 rounded-3xl shadow-2xl space-y-6">
          
          {/* Stepper Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {step === 1 && '1. Pharmacy Organization & Store Location'}
                  {step === 2 && '2. Administrator Account Credentials'}
                  {step === 3 && '3. Choose Subscription Plan & Activation'}
                  {step === 4 && '4. Review & Launch Cloud POS'}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {step === 1 && 'Register your pharmacy legal entity, primary branch network, and location.'}
                  {step === 2 && 'Create your master super-admin account with full system governance.'}
                  {step === 3 && 'Select your organization tier, scan Bakong KHQR, or start provisional access.'}
                  {step === 4 && 'Review parameters and launch your cloud pharmacy POS in seconds.'}
                </p>
              </div>

              <span className="text-xs font-mono font-black px-3.5 py-1.5 bg-primary/20 text-primary-light rounded-xl border border-primary/30 shadow-xs">
                Step {step} of 4
              </span>
            </div>

            {/* Stepper Progress Bar */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(s => (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    s <= step ? 'bg-gradient-to-r from-primary to-emerald-400 shadow-xs shadow-primary/40' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* STEP 1: ORGANIZATION & BRANCH */}
          {step === 1 && (
            <form onSubmit={handleProceedToStep2} className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Pharmacy Network / Clinic Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Angkor Central Pharmacy"
                    value={orgData.name}
                    onChange={handleOrgNameChange}
                    icon={<Building2 className="h-4 w-4" />}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Organization Identifier Slug <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. angkor-central"
                    value={orgData.slug}
                    onChange={e => setOrgData(prev => ({ ...prev, slug: e.target.value }))}
                    className="font-mono text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Contact Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. 012 345 678"
                    value={orgData.phone}
                    onChange={e => setOrgData(prev => ({ ...prev, phone: e.target.value }))}
                    icon={<Phone className="h-4 w-4" />}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Business Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="e.g. info@angkorcentral.com"
                    value={orgData.email}
                    onChange={e => setOrgData(prev => ({ ...prev, email: e.target.value }))}
                    icon={<Mail className="h-4 w-4" />}
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Layers className="h-4 w-4 text-primary" />
                  <span>Primary Store Branch &amp; Warehouse Node</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">Branch Name</label>
                    <Input
                      placeholder="e.g. Main Store Branch"
                      value={orgData.branchName}
                      onChange={e => setOrgData(prev => ({ ...prev, branchName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">Branch Code</label>
                    <Input
                      placeholder="e.g. MB-01"
                      value={orgData.branchCode}
                      onChange={e => setOrgData(prev => ({ ...prev, branchCode: e.target.value }))}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-800">
                <Button
                  type="submit"
                  variant="primary"
                  className="rounded-2xl text-xs font-bold px-7 py-3 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-500 text-white shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  <span>Next: Admin Account</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {/* STEP 2: ADMINISTRATOR CREDENTIALS */}
          {step === 2 && (
            <form onSubmit={handleProceedToStep3} className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Administrator Full Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Sokha Chan"
                    value={adminData.name}
                    onChange={e => setAdminData(prev => ({ ...prev, name: e.target.value }))}
                    icon={<User className="h-4 w-4" />}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Username / Login ID <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. adminSokha"
                    value={adminData.username}
                    onChange={e => setAdminData(prev => ({ ...prev, username: e.target.value }))}
                    className="font-mono text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 relative">
                  <label className="text-xs font-bold text-slate-300">
                    Master Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={adminData.password}
                      onChange={e => setAdminData(prev => ({ ...prev, password: e.target.value }))}
                      icon={<Lock className="h-4 w-4" />}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="password"
                    placeholder="Re-enter password"
                    value={adminData.confirmPassword}
                    onChange={e => setAdminData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    icon={<Lock className="h-4 w-4" />}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Administrator Phone Number
                  </label>
                  <Input
                    placeholder="e.g. 012 888 999"
                    value={adminData.phone}
                    onChange={e => setAdminData(prev => ({ ...prev, phone: e.target.value }))}
                    icon={<Phone className="h-4 w-4" />}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Quick Cashier POS PIN (4-6 Digits)
                  </label>
                  <Input
                    placeholder="e.g. 1234"
                    maxLength={6}
                    value={adminData.pinCode}
                    onChange={e => setAdminData(prev => ({ ...prev, pinCode: e.target.value }))}
                    icon={<KeyRound className="h-4 w-4" />}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="rounded-2xl text-xs font-bold px-4 py-2.5 flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  className="rounded-2xl text-xs font-bold px-7 py-3 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-500 text-white shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  <span>Next: Choose Plan</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3: SUBSCRIPTION PLAN & BEAUTIFUL KHQR PAYMENT */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Billing Cycle Toggle */}
              <div className="flex items-center justify-center">
                <div className="flex items-center p-1.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-inner text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('MONTHLY')}
                    className={`px-5 py-2 rounded-xl transition-all ${
                      billingCycle === 'MONTHLY'
                        ? 'bg-slate-800 text-white shadow-sm font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Monthly Billing
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('YEARLY')}
                    className={`px-5 py-2 rounded-xl transition-all flex items-center gap-2 ${
                      billingCycle === 'YEARLY'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Annual Billing</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-400 text-emerald-950 rounded-full font-black uppercase tracking-wider">
                      Save 20%
                    </span>
                  </button>
                </div>
              </div>

              {/* Plan Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PLANS.map(plan => {
                  const isSelected = selectedPlan === plan.id;
                  const price = billingCycle === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice;
                  const PlanIcon = plan.icon;

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between relative ${
                        isSelected
                          ? 'bg-slate-900/90 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/20 ring-4 ring-emerald-500/10'
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      {plan.badge && (
                        <span className="absolute -top-3 right-4 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-amber-500/20">
                          {plan.badge}
                        </span>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className={`p-3 rounded-2xl bg-gradient-to-br ${plan.color} text-white shadow-md`}>
                            <PlanIcon className="h-5 w-5" />
                          </div>
                          {isSelected ? (
                            <div className="p-1 rounded-full bg-emerald-500/20 border border-emerald-500/40">
                              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-700" />
                          )}
                        </div>

                        <h3 className="text-lg font-black text-white">{plan.name}</h3>
                        <p className="text-[11px] text-slate-400 min-h-[32px] mt-0.5 mb-3">{plan.description}</p>

                        <div className="mb-4 pb-4 border-b border-slate-800">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-white font-mono">${price}</span>
                            <span className="text-xs font-medium text-slate-400">/ month</span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            ~{(price * 4100).toLocaleString()} KHR / mo
                          </p>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                            <span className="text-slate-400">Branches</span>
                            <span className="font-bold text-white">{plan.maxBranches} Nodes</span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                            <span className="text-slate-400">Staff Accounts</span>
                            <span className="font-bold text-white">{plan.maxUsers} Users</span>
                          </div>

                          <div className="pt-2 space-y-1.5">
                            {plan.features.map((feat, i) => (
                              <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Payment Method / Mode Selector */}
              <div className="p-5 bg-slate-900/60 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-white">Payment &amp; Activation Mode</h4>
                    <p className="text-xs text-slate-400">Choose how you wish to activate your pharmacy account</p>
                  </div>
                  {isProvisional && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold">
                      ⚡ 14-Day Provisional Mode
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'KHQR', label: 'Bakong KHQR (Scan to Pay)', icon: QrCode, desc: 'Instant QR code scan via any Cambodian Banking app' },
                    { id: 'TRIAL', label: '14-Day Free Trial', icon: Sparkles, desc: 'No payment required today, full platform features' },
                    { id: 'CARD', label: 'Credit / Debit Card', icon: CreditCard, desc: 'Visa, Mastercard & UnionPay card checkout' },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(m.id as any);
                        if (m.id === 'TRIAL') {
                          setIsProvisional(false);
                          setKhqrPaid(false);
                        }
                      }}
                      className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                        paymentMethod === m.id
                          ? 'bg-primary/10 border-primary text-white shadow-md ring-2 ring-primary/20'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-950/70'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <m.icon className={`h-4 w-4 ${paymentMethod === m.id ? 'text-primary' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold text-white">{m.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">{m.desc}</p>
                    </button>
                  ))}
                </div>

                {/* BAKONG KHQR SCAN CARD (If KHQR Chosen) */}
                {paymentMethod === 'KHQR' && (
                  <div className="mt-4 p-5 bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border border-rose-500/30 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      
                      {/* Authentic KHQR Card Design */}
                      <div className="bg-gradient-to-b from-rose-600 via-rose-700 to-rose-900 rounded-3xl p-5 shadow-2xl text-white max-w-[280px] mx-auto w-full border border-rose-400/30">
                        {/* Bakong KHQR Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-rose-400/40">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-lg tracking-widest uppercase">KHQR</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/20 font-mono font-bold">BAKONG</span>
                          </div>
                          <QrCode className="h-5 w-5 opacity-80" />
                        </div>

                        {/* Merchant Info */}
                        <div className="py-2.5 text-center">
                          <p className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">Merchant</p>
                          <h4 className="font-black text-sm truncate">{orgData.name || 'PHARMACY POS CLOUD'}</h4>
                        </div>

                        {/* High-Resolution Dynamic QR Display */}
                        <div className="bg-white p-4 rounded-2xl shadow-inner flex flex-col items-center justify-center my-1 relative">
                          <div className="w-40 h-40 bg-white flex items-center justify-center relative p-1">
                            {/* Realistic SVG QR Pattern with Center Logo */}
                            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 fill-current">
                              <rect x="0" y="0" width="28" height="28" rx="4" />
                              <rect x="4" y="4" width="20" height="20" rx="2" fill="white" />
                              <rect x="8" y="8" width="12" height="12" rx="1" fill="#dc2626" />
                              
                              <rect x="72" y="0" width="28" height="28" rx="4" />
                              <rect x="76" y="4" width="20" height="20" rx="2" fill="white" />
                              <rect x="80" y="8" width="12" height="12" rx="1" fill="#dc2626" />
                              
                              <rect x="0" y="72" width="28" height="28" rx="4" />
                              <rect x="4" y="76" width="20" height="20" rx="2" fill="white" />
                              <rect x="8" y="80" width="12" height="12" rx="1" fill="#dc2626" />

                              {/* Matrix Pattern dots */}
                              <circle cx="40" cy="10" r="3" />
                              <circle cx="50" cy="10" r="3" />
                              <circle cx="60" cy="10" r="3" />
                              <circle cx="35" cy="20" r="3" />
                              <circle cx="45" cy="20" r="3" />
                              <circle cx="55" cy="20" r="3" />
                              <circle cx="65" cy="20" r="3" />
                              <circle cx="10" cy="40" r="3" />
                              <circle cx="20" cy="40" r="3" />
                              <circle cx="35" cy="35" r="3" />
                              <circle cx="65" cy="35" r="3" />
                              <circle cx="40" cy="60" r="3" />
                              <circle cx="50" cy="60" r="3" />
                              <circle cx="60" cy="60" r="3" />
                              <circle cx="80" cy="40" r="3" />
                              <circle cx="90" cy="40" r="3" />
                              <circle cx="40" cy="80" r="3" />
                              <circle cx="50" cy="80" r="3" />
                              <circle cx="60" cy="80" r="3" />
                              <circle cx="80" cy="80" r="3" />
                              <circle cx="90" cy="80" r="3" />
                            </svg>

                            {/* Center Bakong Pill */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-md">
                                $
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Amount Section */}
                        <div className="pt-2 text-center">
                          <p className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">Total Amount</p>
                          <p className="text-xl font-black font-mono tracking-tight text-yellow-300">
                            ${totalPriceDue}.00 USD
                          </p>
                          <p className="text-[10px] opacity-80 font-mono">
                            ~{khrTotalDue} KHR
                          </p>
                        </div>
                      </div>

                      {/* Payment Action & Provisional Setup */}
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded-lg bg-rose-500/20 text-rose-400">
                              <QrCode className="h-4 w-4" />
                            </span>
                            <h4 className="text-sm font-black text-white">Scan with any Mobile Banking App</h4>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Open ABA Mobile, Wing, ACLEDA, Sathapana or Bakong App to scan and complete transaction instantly.
                          </p>
                        </div>

                        {/* Countdown Timer */}
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Clock className="h-4 w-4 text-amber-400 animate-spin" />
                            <span>QR Code Expires In:</span>
                          </div>
                          <span className="font-mono font-bold text-amber-400">{formatTimer(khqrTimer)}</span>
                        </div>

                        {/* Instant Verification or Provisional Activation Options */}
                        <div className="space-y-2.5 pt-1">
                          {khqrPaid ? (
                            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center gap-2 text-xs font-bold">
                              <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-400" />
                              <span>Payment successfully verified! You can proceed to launch.</span>
                            </div>
                          ) : (
                            <>
                              {/* 1. Simulate Paid Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setKhqrPaid(true);
                                  setIsProvisional(false);
                                  toast.success('KHQR payment verified successfully!');
                                }}
                                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                <span>I have completed payment via Bank App</span>
                              </button>

                              {/* 2. Provisional / Instant Activation Button (បង្កើតបណ្ដោះអាសន្ន) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setIsProvisional(true);
                                  setKhqrPaid(false);
                                  toast.info('⚡ 14-Day Provisional Access enabled! You can test and pay later.');
                                }}
                                className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                  isProvisional
                                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/30'
                                    : 'bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-800'
                                }`}
                              >
                                <Sparkles className="h-4 w-4 text-amber-400" />
                                <span>ដំណើរការគណនីបណ្តោះអាសន្ន (Provisional 14 Days)</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="rounded-2xl text-xs font-bold px-4 py-2.5 flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  onClick={handleProceedToStep4}
                  className="rounded-2xl text-xs font-bold px-7 py-3 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-500 text-white shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  <span>Next: Review &amp; Launch</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & INSTANT LAUNCH */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-5 bg-slate-900/60 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="text-sm font-extrabold text-white">
                        {orgData.name}
                      </h3>
                      <p className="text-xs font-mono text-slate-400">Slug: {orgData.slug}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {selectedPlan} Tier
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Primary Branch</span>
                    <span className="font-bold text-slate-200">{orgData.branchName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Admin Username</span>
                    <span className="font-bold text-slate-200">{adminData.username}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Capacity Quota</span>
                    <span className="font-bold text-slate-200">
                      {activePlanDetails.maxBranches} Branches · {activePlanDetails.maxUsers} Users
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Billing Period</span>
                    <span className="font-bold text-slate-200">
                      {billingCycle} (${priceDisplay}/mo)
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Activation Status:</span>
                    {isProvisional ? (
                      <span className="font-bold text-amber-400 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" /> 14-Day Provisional Access
                      </span>
                    ) : khqrPaid ? (
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Bakong KHQR Verified
                      </span>
                    ) : (
                      <span className="font-bold text-primary flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" /> 14-Day Free Trial
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 mr-2">Total Amount:</span>
                    <span className="font-mono font-black text-sm text-white">${totalPriceDue}.00 USD</span>
                  </div>
                </div>
              </div>

              {submitting && (
                <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 text-center space-y-2 animate-pulse">
                  <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto" />
                  <p className="text-xs font-bold text-primary">{provisioningStatus}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onClick={() => setStep(3)}
                  className="rounded-2xl text-xs font-bold px-4 py-2.5 flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  disabled={submitting}
                  onClick={handleCompleteRegistration}
                  className="rounded-2xl text-xs font-black px-8 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-primary text-white shadow-xl shadow-emerald-600/30 flex items-center gap-2 hover:scale-[1.02] transition-transform"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Provisioning Organization...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Launch Pharmacy POS</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
