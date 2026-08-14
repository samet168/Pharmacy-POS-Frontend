'use client';

import { useState } from 'react';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Lock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ChangePasswordFormProps {
  onSuccess?: () => void;
}

export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
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

    if (formData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await authApi.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      setSuccess(true);
      toast.success('Password changed successfully');
      setTimeout(() => {
        setSuccess(false);
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        onSuccess?.();
      }, 2000);
    } catch (error: unknown) {
      console.error('Change password error:', error);
      toast.error('Failed to change password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Password Changed Successfully</h3>
        <p className="text-slate-600 text-sm">All other devices have been logged out.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Current Password"
        name="currentPassword"
        type="password"
        placeholder="Enter current password"
        value={formData.currentPassword}
        onChange={handleChange}
        icon={<Lock className="h-5 w-5" />}
        showPasswordToggle
        required
      />

      <Input
        label="New Password"
        name="newPassword"
        type="password"
        placeholder="Enter new password (min 6 characters)"
        value={formData.newPassword}
        onChange={handleChange}
        icon={<Lock className="h-5 w-5" />}
        showPasswordToggle
        required
      />

      <Input
        label="Confirm New Password"
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
        Change Password
      </Button>
    </form>
  );
}