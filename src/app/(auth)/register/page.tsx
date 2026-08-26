'use client';

import { useState } from 'react';
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
  MapPin,
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
  Globe
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
    description: 'Essential POS solution tailored for single clinics or small pharmacies.',
    features: [
      'Up to 3 Pharmacy Branches',
      'Up to 10 Cashier / Staff Accounts',
      'Basic Inventory & POS Checkout',
      'Daily Revenue & Sales Reporting',
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
    description: 'Advanced multi-branch enterprise suite for growing pharmacy networks.',
    features: [
      'Up to 10 Pharmacy Branches',
      'Up to 50 Users with 134-Permission Matrix',
      'Bakong KHQR & Online Payment Gateway',
      'Inter-branch Transfers & Prescription Tracking',
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
    description: 'Unlimited capacity & custom high-availability cloud infrastructure.',
    features: [
      'Up to 100 Branches & Warehouses',
      'Up to 500 Staff Accounts',
      'Custom ERP, Webhooks & REST API Access',
      'Dedicated Account Manager (15m SLA)',
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
    branchName: 'Main Branch',
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
  const [paymentMethod, setPaymentMethod] = useState<'TRIAL' | 'KHQR' | 'CARD'>('TRIAL');

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
      // 1. Create Organization (with duplicate slug auto-resolution)
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
        // If 409 Conflict, append unique suffix and retry
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
        // Fallback with unique code
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
      setProvisioningStatus('Provisioning Administrator security credentials & 134-permission matrix...');
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

      // 4. Activate Selected Subscription Tier
      setProvisioningStatus(`Activating ${selectedPlan} Plan subscription tier...`);
      const chosenPlanObj = PLANS.find(p => p.id === selectedPlan) || PLANS[1];
      await subscriptionPlansApi.checkout({
        organizationId: Number(organizationId),
        planName: chosenPlanObj.name,
        billingCycle: billingCycle,
        maxBranches: chosenPlanObj.maxBranches,
        maxUsers: chosenPlanObj.maxUsers,
        paymentMethod: paymentMethod,
        paymentToken: `TXN-REG-${Date.now().toString().slice(-6)}`,
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
        // Default admin permissions
        setPermissions(['ADMIN']);
      }

      toast.success(`Welcome to Pharmacy POS, ${adminData.name}! Your organization is ready.`);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar / Language Switcher */}
      <div className="sm:mx-auto sm:w-full sm:max-w-3xl flex items-center justify-between px-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/20 rounded-2xl border border-primary/30">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Pharmacy POS</h2>
            <p className="text-[11px] text-slate-400">Enterprise Cloud Pharmacy Network</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'kh' ? 'en' : 'kh')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white"
          >
            <Globe className="h-3.5 w-3.5" />
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

      <div className="sm:mx-auto sm:w-full sm:max-w-3xl">
        <Card className="p-6 md:p-8 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/80 rounded-3xl shadow-2xl space-y-6">
          {/* Stepper Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {step === 1 && '1. Pharmacy Organization & Primary Branch'}
                  {step === 2 && '2. Administrator Account Credentials'}
                  {step === 3 && '3. SaaS Subscription Plan & Capacity'}
                  {step === 4 && '4. Review & Instant Provisioning'}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {step === 1 && 'Register your pharmacy legal entity, branch network, and location details.'}
                  {step === 2 && 'Create your master super-admin account with full system governance.'}
                  {step === 3 && 'Select your organization scale and active capacity quota.'}
                  {step === 4 && 'Review parameters and launch your cloud pharmacy POS in seconds.'}
                </p>
              </div>

              <span className="text-xs font-mono font-black px-3 py-1 bg-primary/10 text-primary rounded-xl border border-primary/20">
                Step {step} of 4
              </span>
            </div>

            {/* Stepper Progress Bar */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(s => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s <= step ? 'bg-primary' : 'bg-slate-100 dark:bg-slate-700'
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
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
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
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
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
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
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
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
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

              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Layers className="h-4 w-4 text-primary" />
                  <span>Primary Store Branch &amp; Warehouse Node</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    label="Primary Branch Name"
                    placeholder="e.g. Main Branch - Norodom Blvd"
                    value={orgData.branchName}
                    onChange={e => setOrgData(prev => ({ ...prev, branchName: e.target.value }))}
                    required
                  />
                  <Input
                    label="Branch Code"
                    placeholder="e.g. MB-01"
                    value={orgData.branchCode}
                    onChange={e => setOrgData(prev => ({ ...prev, branchCode: e.target.value }))}
                    className="font-mono"
                    required
                  />
                </div>

                <Input
                  label="Store Location & Address"
                  placeholder="e.g. #128, Norodom Blvd, Daun Penh, Phnom Penh"
                  value={orgData.address}
                  onChange={e => setOrgData(prev => ({ ...prev, address: e.target.value }))}
                  icon={<MapPin className="h-4 w-4" />}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="rounded-2xl text-xs font-bold px-6 py-2.5 flex items-center gap-2"
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
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Administrator Full Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Dr. Sokha Meas"
                    value={adminData.name}
                    onChange={e => setAdminData(prev => ({ ...prev, name: e.target.value }))}
                    icon={<User className="h-4 w-4" />}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Username / Login Identifier <span className="text-rose-500">*</span>
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
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Confirm Master Password <span className="text-rose-500">*</span>
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
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mobile Phone Number
                  </label>
                  <Input
                    placeholder="e.g. 012 888 999"
                    value={adminData.phone}
                    onChange={e => setAdminData(prev => ({ ...prev, phone: e.target.value }))}
                    icon={<Phone className="h-4 w-4" />}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Quick Cashier POS PIN (4 Digits)
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

              <div className="flex items-center justify-between pt-2">
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
                  className="rounded-2xl text-xs font-bold px-6 py-2.5 flex items-center gap-2"
                >
                  <span>Next: Select Plan</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3: SUBSCRIPTION TIER */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Billing Cycle Toggle */}
              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-700/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('MONTHLY')}
                    className={`px-4 py-1.5 rounded-xl transition-all ${
                      billingCycle === 'MONTHLY'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    Monthly Billing
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('YEARLY')}
                    className={`px-4 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                      billingCycle === 'YEARLY'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <span>Annual Billing</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-emerald-400 text-emerald-950 rounded-md font-extrabold uppercase">
                      Save 20%
                    </span>
                  </button>
                </div>
              </div>

              {/* Plan Cards */}
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
                          ? 'bg-white dark:bg-slate-800 border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-4 ring-emerald-500/10 dark:ring-emerald-500/20'
                          : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700/60 hover:border-slate-300'
                      }`}
                    >
                      {plan.badge && (
                        <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs">
                          {plan.badge}
                        </span>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                            <PlanIcon className="h-5 w-5" />
                          </div>
                          {isSelected ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600" />
                          )}
                        </div>

                        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">{plan.name}</h3>
                        <p className="text-[11px] text-slate-400 mb-3">{plan.description}</p>

                        <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mb-4">
                          ${price} <span className="text-xs font-normal text-slate-400">/mo</span>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                            <Building2 className="h-3.5 w-3.5 text-primary" />
                            <span>{plan.maxBranches} Store Branches</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                            <User className="h-3.5 w-3.5 text-purple-500" />
                            <span>{plan.maxUsers} Staff Accounts</span>
                          </div>
                          {plan.features.map((feat, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-[11px] pt-1">
                              <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Payment Mode Selector */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Activation Mode
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                  {[
                    { id: 'TRIAL', label: '14-Day Free Trial', icon: Sparkles },
                    { id: 'KHQR', label: 'Bakong KHQR', icon: QrCode },
                    { id: 'CARD', label: 'Credit / Debit Card', icon: CreditCard },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                        paymentMethod === m.id
                          ? 'bg-primary/10 border-primary text-primary shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <m.icon className="h-4 w-4" />
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
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
                  className="rounded-2xl text-xs font-bold px-6 py-2.5 flex items-center gap-2"
                >
                  <span>Next: Review &amp; Launch</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & INSTANT PROVISIONING */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-slate-100 dark:border-slate-700/60 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                        {orgData.name}
                      </h3>
                      <p className="text-xs font-mono text-slate-400">Slug: {orgData.slug}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    {selectedPlan} Tier
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Primary Branch</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{orgData.branchName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Admin Username</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{adminData.username}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Capacity Quota</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {activePlanDetails.maxBranches} Branches · {activePlanDetails.maxUsers} Users
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Billing Period</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {billingCycle} (${priceDisplay}/mo)
                    </span>
                  </div>
                </div>
              </div>

              {submitting && (
                <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 text-center space-y-2 animate-pulse">
                  <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto" />
                  <p className="text-xs font-bold text-primary">{provisioningStatus}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
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
                  className="rounded-2xl text-xs font-black px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl shadow-emerald-600/25 flex items-center gap-2"
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
