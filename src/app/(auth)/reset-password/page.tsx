'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [formData, setFormData] = useState({
    token,
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword({
        token: formData.token,
        newPassword: formData.newPassword,
      });
      setSuccess(true);
      toast.success('Password reset successfully');
    } catch (error: unknown) {
      console.error('Reset password error:', error);
      toast.error('Failed to reset password. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Password Reset Successful</h1>
            <p className="text-slate-600 mb-6">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <Button
              type="button"
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-8 text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Reset Link</h1>
            <p className="text-slate-600 mb-6">
              The password reset link is invalid or missing. Please request a new reset link.
            </p>
            <Button
              type="button"
              onClick={() => router.push('/forgot-password')}
              className="w-full"
            >
              Request New Link
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-8">
          <div className="mb-6">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="flex items-center text-slate-600 hover:text-slate-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </button>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Reset Password</h1>
            <p className="text-slate-600">Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="New Password"
              name="newPassword"
              type="password"
              placeholder="Enter new password"
              value={formData.newPassword}
              onChange={handleChange}
              icon={<Lock className="h-5 w-5" />}
              showPasswordToggle
              required
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={handleChange}
              icon={<Lock className="h-5 w-5" />}
              showPasswordToggle
              required
            />

            <Button type="submit" loading={loading} className="w-full">
              Reset Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}