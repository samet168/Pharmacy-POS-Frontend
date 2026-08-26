'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { t, language } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authApi.login(formData);
      
      console.log('Login response:', response);
      
      if (!response) {
        throw new Error('No response received from server');
      }
      
      // Store tokens in localStorage
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('organizationId', response.organizationId.toString());

      // Set a lightweight session cookie so middleware can protect routes
      // (JWT itself stays in localStorage — never sent to the server)
      document.cookie = 'isLoggedIn=true; path=/; SameSite=Lax';

      // Update auth store
      setAuth(response);

      // Fetch user permissions and full user details
      try {
        const meResponse = await authApi.getMe();
        const permissions = meResponse.authorities || [];
        localStorage.setItem('permissions', JSON.stringify(permissions));
        
        // Update auth store with current user data and permissions
        const { setCurrentUser, setPermissions } = useAuthStore.getState();
        setCurrentUser(meResponse);
        setPermissions(permissions);
      } catch (meError) {
        console.error('Failed to fetch user permissions:', meError);
        localStorage.setItem('permissions', JSON.stringify([]));
        const { setPermissions } = useAuthStore.getState();
        setPermissions([]);
      }

      toast.success('Login successful!');

      // Redirect based on role
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      const roleName = response.roleName?.toUpperCase();
      
      if (roleName === 'CASHIER' || roleName === 'PHARMACIST') {
        router.push(redirect && redirect.startsWith('/pos') ? redirect : '/pos/sell');
      } else {
        router.push(redirect && !redirect.startsWith('/pos') ? redirect : '/dashboard');
      }
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-8">
            <div className="text-center mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/pharmacy-logo.png"
                alt="Pharmacy POS Logo"
                className="h-16 w-16 mx-auto mb-3 rounded-2xl object-cover shadow-md border border-slate-200"
              />
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('common.appName')}</h1>
              <p className="text-slate-600">{t('auth.signInToAccount')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/pharmacy-logo.png"
              alt="Pharmacy POS Logo"
              className="h-16 w-16 mx-auto mb-3 rounded-2xl object-cover shadow-md border border-slate-200"
            />
            <h1 className={`text-2xl font-bold text-slate-900 mb-2 ${language === 'kh' ? 'font-khmer' : ''}`}>{t('common.appName')}</h1>
            <p className={`text-slate-600 ${language === 'kh' ? 'font-khmer' : ''}`}>{t('auth.signInToAccount')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label={t('auth.username')}
              name="username"
              type="text"
              placeholder={t('auth.enterUsername')}
              value={formData.username}
              onChange={handleChange}
              icon={<User className="h-5 w-5" />}
              required
            />

            <Input
              label={t('auth.password')}
              name="password"
              type="password"
              placeholder={t('auth.enterPassword')}
              value={formData.password}
              onChange={handleChange}
              icon={<Lock className="h-5 w-5" />}
              showPasswordToggle
              required
            />

            <Button type="submit" loading={loading} className="w-full">
              {t('auth.signIn')}
            </Button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-3 text-sm">
            <button
              type="button"
              onClick={() => router.push('/pin-login')}
              className={`text-primary-600 hover:text-primary-700 font-medium ${language === 'kh' ? 'font-khmer' : ''}`}
            >
              {t('auth.usePinLogin')}
            </button>

            <div className="text-xs text-slate-500">
              Don&apos;t have a pharmacy account?{' '}
              <button
                type="button"
                onClick={() => router.push('/register')}
                className="font-bold text-primary hover:underline"
              >
                Register &amp; Choose Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}