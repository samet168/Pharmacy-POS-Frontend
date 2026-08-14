'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authApi.login(formData);
      
      console.log('Login response:', response);
      
      if (!response) {
        throw new Error('No response received from server');
      }
      
      // Store tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('organizationId', response.organizationId.toString());
      
      // Update auth store
      setAuth(response);
      
      // Fetch user permissions (with error handling)
      try {
        const meResponse = await authApi.getMe();
        const permissions = meResponse.authorities || [];
        localStorage.setItem('permissions', JSON.stringify(permissions));
      } catch (meError) {
        console.error('Failed to fetch user permissions:', meError);
        // Store default permissions if /me endpoint fails
        localStorage.setItem('permissions', JSON.stringify([]));
      }
      
      toast.success('Login successful!');
      
      // Redirect based on role
      if (response.roleName === 'Cashier' || response.roleName === 'Pharmacist') {
        router.push('/pos/sell');
      } else {
        router.push('/dashboard');
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Pharmacy POS</h1>
            <p className="text-slate-600">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Username"
              name="username"
              type="text"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
              icon={<User className="h-5 w-5" />}
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              icon={<Lock className="h-5 w-5" />}
              showPasswordToggle
              required
            />

            <Button type="submit" loading={loading} className="w-full">
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push('/pin-login')}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Use PIN Login (POS Terminal)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}