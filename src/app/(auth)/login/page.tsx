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

import { branchesApi, BranchResponse } from '@/lib/api/branches';
import { Store, MapPin, Phone } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setCurrentBranch = useAuthStore((state) => state.setCurrentBranch);
  const { t, language } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [gsiLoaded, setGsiLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const completeRedirect = useCallback((response: any, branch?: any) => {
    if (branch) {
      setCurrentBranch(branch);
    }
    const redirect = new URLSearchParams(window.location.search).get('redirect');
    router.push(redirect || '/dashboard');
  }, [router, setCurrentBranch]);

  // Post-login redirect logic - seamless direct redirect without popup modal
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

    toast.success(language === 'kh' ? 'ផ្ទៀងផ្ទាត់គណនីបានជោគជ័យ!' : 'Account authenticated successfully!');

    const roleName = (response?.roleName || '').toUpperCase();
    if (roleName === 'SUPERADMIN' || roleName === 'SUPER_ADMIN' || roleName === 'OWNER') {
      const superAdminHq = { id: 0, name: 'គ្រប់សាខាទាំងអស់ (Global HQ - All Branches)', code: 'HQ-GLOBAL' };
      completeRedirect(response, superAdminHq);
      return;
    }

    // Automatically assign default active branch and proceed immediately
    try {
      const orgId = response.organizationId || 1;
      const branchRes = await branchesApi.getByOrganization(orgId, 0, 10);
      const list = branchRes.content || [];
      if (list.length > 0) {
        completeRedirect(response, list[0]);
        return;
      }
    } catch (err) {
      console.warn('Could not fetch branches, using fallback:', err);
    }

    const fallbackBranch = { id: 1, name: 'សាខាកណ្តាល (Main Central Branch)', code: 'BR-HQ-01' };
    completeRedirect(response, fallbackBranch);
  }, [language, setAuth, completeRedirect]);

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

      await handleLoginSuccess(res);
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      toast.error(error.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }, [handleLoginSuccess]);

  // Handle Google Sign-In via direct prompt fallback or GSI button
  const handleCustomGoogleLogin = useCallback(() => {
    setGoogleLoading(true);
    const email = prompt(language === 'kh' ? 'បញ្ចូល Google Email របស់អ្នក:' : 'Enter your Google Email:', 'samet.moeun9@gmail.com');
    if (email) {
      authApi.loginWithGoogle({
        email: email.trim(),
        name: email.split('@')[0],
        picture: 'https://lh3.googleusercontent.com/a/default-user',
      }).then(res => {
        handleLoginSuccess(res);
      }).catch(err => toast.error(err.message || 'Login failed')).finally(() => setGoogleLoading(false));
    } else {
      setGoogleLoading(false);
    }
  }, [handleLoginSuccess, language]);

  // Initialize Google Identity Services SDK
  const initGoogleAuth = useCallback(() => {
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        const btnContainer = document.getElementById('googleSignInBtn');
        if (btnContainer) {
          btnContainer.innerHTML = '';
          window.google.accounts.id.renderButton(btnContainer, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: btnContainer.offsetWidth || 340,
          });
        }
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
              {/* Native Google Identity rendered button container */}
              <div id="googleSignInBtn" className="w-full flex justify-center min-h-[44px]"></div>

              {/* Custom Google Sign-In Button Fallback */}
              {(!gsiLoaded || googleLoading) && (
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
              )}

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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}