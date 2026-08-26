'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function PinLoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [formData, setFormData] = useState({
    pinCode: '',
    branchId: 1, // Default branch, should be selectable in production
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate or retrieve device UUID
      let deviceUuid = localStorage.getItem('deviceUuid');
      if (!deviceUuid) {
        deviceUuid = crypto.randomUUID();
        localStorage.setItem('deviceUuid', deviceUuid);
      }

      const response = await authApi.pinLogin({
        ...formData,
        deviceUuid,
      });
      
      // Store tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      // Update auth store
      setAuth(response);
      
      // Fetch user permissions
      const meResponse = await authApi.getMe();
      const permissions = meResponse.authorities || [];
      
      // Store permissions
      localStorage.setItem('permissions', JSON.stringify(permissions));
      
      toast.success('PIN Login successful!');
      
      // Redirect to POS new order screen
      router.push('/orders/new');
    } catch (error: unknown) {
      console.error('PIN login error:', error);
      toast.error('PIN login failed. Please check your PIN and branch.');
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
            <p className="text-slate-600">PIN Login - POS Terminal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="PIN Code"
              name="pinCode"
              type="password"
              placeholder="Enter your 4-digit PIN"
              value={formData.pinCode}
              onChange={handleChange}
              icon={<Lock className="h-5 w-5" />}
              showPasswordToggle
              maxLength={4}
              required
            />

            <Input
              label="Branch ID"
              name="branchId"
              type="number"
              value={formData.branchId}
              onChange={handleChange}
              required
            />

            <Button type="submit" loading={loading} className="w-full">
              Login with PIN
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Back to Username/Password Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}