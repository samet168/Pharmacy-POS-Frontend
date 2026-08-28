'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Lock, Sparkles, Crown, Zap, Check, ArrowRight, ShieldCheck, QrCode, CreditCard, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { subscriptionPlansApi } from '@/lib/api/subscriptionPlans';

const GOOGLE_CLIENT_ID = '1015295193209-pqllnd3a5d5m1m11nu4hvkvfdpbapm87.apps.googleusercontent.com';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement | null, options: any) => void;
          prompt: () => void;
        };
        oauth2: {
          initTokenClient: (config: any) => {
            requestAccessToken: (overrideConfig?: any) => void;
          };
        };
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { t, language } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [gsiLoaded, setGsiLoaded] = useState(false);

  // Mandatory Subscription Plan Selection for Google users
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [pendingGoogleAuth, setPendingGoogleAuth] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<'Starter' | 'Professional' | 'Enterprise'>('Professional');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('YEARLY');
  const [paymentMethod, setPaymentMethod] = useState<'TRIAL' | 'KHQR' | 'CARD'>('TRIAL');
  const [activatingPlan, setActivatingPlan] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Post-login redirect logic
  const handleLoginSuccess = useCallback(async (response: any) => {
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('organizationId', response.organizationId?.toString() || '1');

    document.cookie = 'isLoggedIn=true; path=/; SameSite=Lax';

    setAuth(response);

    try {
      const meResponse = await authApi.getMe();
      const permissions = meResponse.authorities || [];
      localStorage.setItem('permissions', JSON.stringify(permissions));
      
      const { setCurrentUser, setPermissions } = useAuthStore.getState();
      setCurrentUser(meResponse);
      setPermissions(permissions);
    } catch (meError) {
      console.error('Failed to fetch user permissions:', meError);
      localStorage.setItem('permissions', JSON.stringify([]));
      const { setPermissions } = useAuthStore.getState();
      setPermissions([]);
    }

    toast.success(language === 'kh' ? 'ចូលប្រព័ន្ធបានជោគជ័យ!' : 'Login successful!');

    const redirect = new URLSearchParams(window.location.search).get('redirect');
    const roleName = response.roleName?.toUpperCase();
    
    if (roleName === 'CASHIER' || roleName === 'PHARMACIST') {
      router.push(redirect && redirect.startsWith('/pos') ? redirect : '/orders/new');
    } else {
      router.push(redirect && !redirect.startsWith('/pos') ? redirect : '/dashboard');
    }
  }, [language, router, setAuth]);

  // Handle Google OAuth Credential JWT response
  const handleGoogleCredentialResponse = useCallback(async (response: { credential: string }) => {
    try {
      setGoogleLoading(true);
      const token = response.credential;
      if (!token) throw new Error('No credential token received from Google');

      // Decode Google JWT payload safely
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);

      const res = await authApi.loginWithGoogle({
        email: payload.email,
        name: payload.name || payload.given_name || payload.email.split('@')[0],
        picture: payload.picture,
        googleId: payload.sub,
        idToken: token,
      });

      // If user is newly registered or needs plan selection, open Plan Modal immediately!
      if (res.isNewUser || !res.hasActiveSubscription) {
        setPendingGoogleAuth(res);
        setShowPlanModal(true);
        toast.info(language === 'kh' ? 'សូមជ្រើសរើស Subscription Plan របស់អ្នកដើម្បីចាប់ផ្តើម' : 'Please select your Subscription Plan to activate your account');
      } else {
        await handleLoginSuccess(res);
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      toast.error(error.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }, [handleLoginSuccess, language]);

  // Direct Google OAuth Redirect (Eliminates popup blockers completely)
  const triggerGoogleOAuthRedirect = useCallback(() => {
    const redirectUri = typeof window !== 'undefined' ? window.location.origin + '/login' : 'https://pharmacy-pos-frontend-eight.vercel.app/login';
    const targetUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token%20id_token&scope=openid%20email%20profile&nonce=${Date.now()}&prompt=select_account`;
    window.location.href = targetUrl;
  }, []);

  // Direct User Click Handler for Google Login (Full-page OAuth redirect)
  const handleCustomGoogleLogin = useCallback(() => {
    setGoogleLoading(true);
    triggerGoogleOAuthRedirect();
  }, [triggerGoogleOAuthRedirect]);

  // Handle Google OAuth Redirect Response (#id_token=... or #access_token=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash;
    if (hash && (hash.includes('id_token=') || hash.includes('access_token='))) {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const idToken = params.get('id_token');
      const accessToken = params.get('access_token');

      // Clean URL fragment
      window.history.replaceState(null, '', window.location.pathname + window.location.search);

      if (idToken) {
        handleGoogleCredentialResponse({ credential: idToken });
      } else if (accessToken) {
        setGoogleLoading(true);
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
          .then((res) => res.json())
          .then((userInfo) => {
            if (userInfo.email) {
              return authApi.loginWithGoogle({
                email: userInfo.email,
                name: userInfo.name || userInfo.given_name || userInfo.email.split('@')[0],
                picture: userInfo.picture,
                googleId: userInfo.sub,
              });
            } else {
              throw new Error('Could not retrieve Google profile email');
            }
          })
          .then((res) => {
            if (res.isNewUser || !res.hasActiveSubscription) {
              setPendingGoogleAuth(res);
              setShowPlanModal(true);
            } else {
              handleLoginSuccess(res);
            }
          })
          .catch((err) => {
            toast.error(err.message || 'Google Login failed');
          })
          .finally(() => setGoogleLoading(false));
      }
    }
  }, [handleGoogleCredentialResponse, handleLoginSuccess]);

  // Initialize Google Identity Services SDK with redirect mode
  const initGoogleAuth = useCallback(() => {
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          ux_mode: 'redirect',
          login_uri: typeof window !== 'undefined' ? window.location.origin + '/login' : 'https://pharmacy-pos-frontend-eight.vercel.app/login',
        });
      } catch (err) {
        console.warn('Google GSI initialization notice:', err);
      }
    }
  }, [handleGoogleCredentialResponse]);

  useEffect(() => {
    if (gsiLoaded && mounted) {
      initGoogleAuth();
    }
  }, [gsiLoaded, mounted, initGoogleAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authApi.login(formData);
      if (!response) {
        throw new Error('No response received from server');
      }
      await handleLoginSuccess(response);
    } catch (error: unknown) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        toast.error(`Login failed: ${error.message}`);
      } else {
        toast.error('Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPlan = async () => {
    if (!pendingGoogleAuth) return;
    try {
      setActivatingPlan(true);
      try {
        await subscriptionPlansApi.checkout({
          organizationId: pendingGoogleAuth.organizationId,
          planName: selectedPlan + ' Plan',
          billingCycle,
          paymentMethod,
        });
      } catch (checkoutErr) {
        console.warn('Subscription checkout notice:', checkoutErr);
      }

      toast.success(language === 'kh' ? 'គម្រោងរបស់អ្នកត្រូវបានធ្វើសកម្មភាពជោគជ័យ!' : 'Subscription activated successfully!');
      setShowPlanModal(false);
      await handleLoginSuccess(pendingGoogleAuth);
    } catch (err: any) {
      toast.error(err.message || 'Failed to activate plan');
    } finally {
      setActivatingPlan(false);
    }
  };

  const PLANS = [
    {
      id: 'Starter' as const,
      name: 'Starter Cloud',
      monthlyPrice: 19,
      yearlyPrice: 15,
      maxBranches: 1,
      maxUsers: 3,
      icon: Zap,
      color: 'from-blue-500 to-cyan-500',
      description: 'Ideal for independent small clinics & community drugstores',
      features: ['1 Branch Node', '3 Staff Accounts', 'POS & Barcode Scanner', 'Standard Receipts', 'Basic Inventory'],
    },
    {
      id: 'Professional' as const,
      name: 'Professional Pro',
      monthlyPrice: 49,
      yearlyPrice: 39,
      maxBranches: 5,
      maxUsers: 15,
      badge: 'POPULAR CHOICE',
      icon: Sparkles,
      color: 'from-[#04649C] to-[#24A4EC]',
      description: 'Comprehensive solution for growing multi-counter pharmacies',
      features: ['5 Branch Nodes', '15 Staff Accounts', 'Smart Batch & Expiry Alerts', 'Bakong KHQR Payments', 'Profit & Tax Analytics'],
    },
    {
      id: 'Enterprise' as const,
      name: 'Enterprise Network',
      monthlyPrice: 99,
      yearlyPrice: 79,
      maxBranches: 50,
      maxUsers: 100,
      badge: 'MAX POWER',
      icon: Crown,
      color: 'from-amber-500 to-orange-500',
      description: 'Large pharmacy chains, hospital networks & franchises',
      features: ['Unlimited Branches', 'Unlimited Staff Accounts', 'Multi-Warehouse Transfers', 'Custom User Roles', '24/7 Dedicated Priority Support'],
    },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGsiLoaded(true)}
      />

      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-8 transition-colors">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xl p-8 transition-all">
            
            {/* Header */}
            <div className="text-center mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/pharmacy-logo.png"
                alt="Pharmacy POS Logo"
                className="h-20 w-20 mx-auto mb-3.5 rounded-3xl object-cover shadow-xl border border-slate-200 dark:border-slate-700 bg-white p-1"
              />
              <h1 className={`text-2xl font-black text-[#04649C] dark:text-[#24A4EC] tracking-tight ${language === 'kh' ? 'font-khmer' : ''}`}>
                {t('common.appName')}
              </h1>
              <p className={`text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 ${language === 'kh' ? 'font-khmer' : ''}`}>
                {language === 'kh' ? 'សូមចូលប្រើប្រាស់គណនីរបស់អ្នក' : t('auth.signInToAccount')}
              </p>
            </div>

            {/* Google Sign-In Section */}
            <div className="space-y-3 mb-6">
              {/* Primary Custom Google Sign-In Button (Bypasses popup blocker via direct click & OAuth redirect) */}
              <button
                type="button"
                disabled={googleLoading}
                onClick={handleCustomGoogleLogin}
                className="w-full py-3 px-4 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-full font-bold text-xs shadow-sm flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-[0.99]"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>{googleLoading ? (language === 'kh' ? 'កំពុងភ្ជាប់ Google...' : 'Connecting Google...') : (language === 'kh' ? 'បន្តជាមួយ Google (Continue with Google)' : 'Continue with Google')}</span>
              </button>

              {/* Native Google Identity rendered button container */}
              <div id="googleSignInBtn" className="w-full flex justify-center min-h-[0px] overflow-hidden hidden"></div>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-bold tracking-wider">
                    {language === 'kh' ? 'ឬចូលដោយឈ្មោះអ្នកប្រើ' : 'Or with credentials'}
                  </span>
                </div>
              </div>
            </div>

            {/* Standard Username/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t('auth.username')}
                name="username"
                type="text"
                placeholder={t('auth.enterUsername')}
                value={formData.username}
                onChange={handleChange}
                icon={<User className="h-4 w-4" />}
                required
              />

              <Input
                label={t('auth.password')}
                name="password"
                type="password"
                placeholder={t('auth.enterPassword')}
                value={formData.password}
                onChange={handleChange}
                icon={<Lock className="h-4 w-4" />}
                showPasswordToggle
                required
              />

              <Button type="submit" loading={loading} className="w-full py-2.5 rounded-full font-bold bg-[#04649C] hover:bg-[#035382] text-white">
                {t('auth.signIn')}
              </Button>
            </form>

            {/* Alternative Actions */}
            <div className="mt-6 flex flex-col items-center gap-3 text-xs">
              <button
                type="button"
                onClick={() => router.push('/pin-login')}
                className={`text-[#04649C] dark:text-[#24A4EC] hover:underline font-bold ${language === 'kh' ? 'font-khmer' : ''}`}
              >
                ⚡ {t('auth.usePinLogin')}
              </button>

              <div className="text-slate-500 dark:text-slate-400">
                {language === 'kh' ? 'មិនទាន់មានគណនីឱសថស្ថានមែនទេ? ' : "Don't have a pharmacy account? "}
                <button
                  type="button"
                  onClick={() => router.push('/register')}
                  className="font-black text-[#04649C] dark:text-[#24A4EC] hover:underline"
                >
                  {language === 'kh' ? 'ចុះឈ្មោះ និងជ្រើសរើសគម្រោង' : 'Register & Choose Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MANDATORY CHOOSE SUBSCRIPTION PLAN MODAL FOR GOOGLE USERS */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-2xl space-y-6 text-white max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="text-center space-y-1.5 border-b border-slate-800 pb-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Google Account Connected Successfully</span>
              </div>
              <h2 className={`text-2xl font-black tracking-tight text-white ${language === 'kh' ? 'font-khmer' : ''}`}>
                {language === 'kh' ? 'ជ្រើសរើសគម្រោងជាវ (Choose Subscription Plan)' : 'Choose Your Subscription Plan'}
              </h2>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                {language === 'kh'
                  ? 'សូមជ្រើសរើសកញ្ចប់សេវាឱសថស្ថានរបស់អ្នក ដើម្បីធ្វើសកម្មភាពគណនី និងចាប់ផ្តើមដំណើរការ POS'
                  : 'Please select your desired pharmacy plan to activate your account and start your cloud POS.'}
              </p>

              {/* Monthly / Yearly Toggle */}
              <div className="pt-3 flex items-center justify-center gap-3">
                <span className={`text-xs font-bold ${billingCycle === 'MONTHLY' ? 'text-white' : 'text-slate-400'}`}>
                  Monthly
                </span>
                <button
                  type="button"
                  onClick={() => setBillingCycle(b => b === 'MONTHLY' ? 'YEARLY' : 'MONTHLY')}
                  className="w-12 h-6 rounded-full bg-slate-800 p-1 relative transition-colors"
                >
                  <div className={`w-4 h-4 rounded-full bg-[#24A4EC] transition-transform duration-200 ${billingCycle === 'YEARLY' ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold ${billingCycle === 'YEARLY' ? 'text-white' : 'text-slate-400'}`}>
                    Yearly Billing
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/30">
                    Save 20%
                  </span>
                </div>
              </div>
            </div>

            {/* Plan Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                const price = billingCycle === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice;

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-b from-[#04649C]/20 to-slate-900 border-[#24A4EC] ring-2 ring-[#24A4EC]/30 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-750 hover:bg-slate-950'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[9px] font-black tracking-wider uppercase shadow-xs">
                        {plan.badge}
                      </span>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${plan.color} text-white shadow-xs`}>
                          <plan.icon className="h-4 w-4" />
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#24A4EC] bg-[#24A4EC] text-slate-950' : 'border-slate-700'
                        }`}>
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-black text-white">{plan.name}</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{plan.description}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-800">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-white">${price}</span>
                          <span className="text-xs text-slate-400">/month</span>
                        </div>
                      </div>

                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-[11px]">
                            <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payment & Mode Options */}
            <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300">Choose Activation Method:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'TRIAL' as const, label: '14-Day Free Trial', desc: 'Instant access, no card needed', icon: Sparkles },
                  { id: 'KHQR' as const, label: 'Bakong KHQR', desc: 'Scan with any Banking App', icon: QrCode },
                  { id: 'CARD' as const, label: 'Credit / Debit Card', desc: 'Visa, Mastercard & UnionPay', icon: CreditCard },
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      paymentMethod === m.id
                        ? 'bg-[#04649C]/20 border-[#24A4EC] text-white shadow-xs'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <m.icon className={`h-4 w-4 mt-0.5 shrink-0 ${paymentMethod === m.id ? 'text-[#24A4EC]' : 'text-slate-400'}`} />
                    <div>
                      <div className="text-xs font-bold text-white">{m.label}</div>
                      <div className="text-[10px] text-slate-400">{m.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* KHQR Mini Card Preview */}
              {paymentMethod === 'KHQR' && (
                <div className="p-3.5 bg-gradient-to-b from-rose-950/40 to-slate-900 rounded-xl border border-rose-500/30 flex items-center justify-between gap-4 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-xs shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=BAKONG-KHQR-PHARMACY-SUB"
                        alt="KHQR"
                        className="h-12 w-12 object-contain"
                      />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-rose-300">Bakong KHQR Ready</h5>
                      <p className="text-[10px] text-slate-400">Scan via ABA, ACLEDA, Sathapana, Canadia or any KHQR Bank</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 shrink-0">
                    Auto-Verified
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Plan Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                loading={activatingPlan}
                onClick={handleConfirmPlan}
                className="w-full py-3 bg-gradient-to-r from-[#04649C] to-[#24A4EC] hover:from-[#035382] hover:to-[#1e8fd4] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-[#04649C]/30 flex items-center justify-center gap-2"
              >
                <span>{language === 'kh' ? 'ធ្វើសកម្មភាពគម្រោង និងចូលដំណើរការ POS' : 'Activate Subscription & Launch POS'}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}