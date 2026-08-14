'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authApi.forgotPassword(formData);
      setSuccess(true);
      toast.success('Password reset link sent to your email');
    } catch (error: unknown) {
      console.error('Forgot password error:', error);
      toast.error('Failed to send reset link. Please try again.');
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
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Check Your Email</h1>
            <p className="text-slate-600 mb-6">
              We've sent a password reset link to {formData.email}. Please check your inbox and follow the instructions.
            </p>
            <Button
              type="button"
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Back to Login
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
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Forgot Password</h1>
            <p className="text-slate-600">Enter your email to receive a password reset link</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              icon={<Mail className="h-5 w-5" />}
              required
            />

            <Button type="submit" loading={loading} className="w-full">
              Send Reset Link
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}