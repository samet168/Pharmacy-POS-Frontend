'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/utils/errorHandler';
import { authApi } from '@/lib/api/auth';
import { Shield, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    } else if (formData.currentPassword.length < 6) {
      newErrors.currentPassword = 'Current password must be at least 6 characters';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters';
    } else if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await authApi.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      toast.success('Password changed successfully. Please log in again.');

      // Clear auth data and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('permissions');
        localStorage.removeItem('organizationId');
        document.cookie = 'isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      }

      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: 'None', color: 'bg-slate-200' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const levels = [
      { strength: 0, label: 'None', color: 'bg-slate-200' },
      { strength: 1, label: 'Weak', color: 'bg-red-500' },
      { strength: 2, label: 'Fair', color: 'bg-orange-500' },
      { strength: 3, label: 'Good', color: 'bg-yellow-500' },
      { strength: 4, label: 'Strong', color: 'bg-green-500' },
      { strength: 5, label: 'Very Strong', color: 'bg-green-600' },
    ];

    return levels[Math.min(strength, 5)];
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-bento-primary dark:text-slate-100">
          Change Password
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Update your password to keep your account secure
        </p>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Current Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                placeholder="Enter current password"
                className="pl-10 pr-10"
                error={errors.currentPassword}
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="Enter new password"
                className="pl-10 pr-10"
                error={errors.newPassword}
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.newPassword}</p>
            )}
            
            {/* Password Strength Indicator */}
            {formData.newPassword && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Password strength</span>
                  <span className={`text-xs font-medium ${
                    passwordStrength.strength >= 3 ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                    style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Password Requirements */}
            <div className="mt-3 space-y-1">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Password requirements:</p>
              <div className="flex items-center gap-2 text-xs">
                {formData.newPassword.length >= 8 ? (
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-slate-400" />
                )}
                <span className={formData.newPassword.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}>
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {/[a-z]/.test(formData.newPassword) && /[A-Z]/.test(formData.newPassword) ? (
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-slate-400" />
                )}
                <span className={/[a-z]/.test(formData.newPassword) && /[A-Z]/.test(formData.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}>
                  Upper and lowercase letters
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {/\d/.test(formData.newPassword) ? (
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-slate-400" />
                )}
                <span className={/\d/.test(formData.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}>
                  At least one number
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {/[^a-zA-Z0-9]/.test(formData.newPassword) ? (
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-slate-400" />
                )}
                <span className={/[^a-zA-Z0-9]/.test(formData.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}>
                  At least one special character
                </span>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                className="pl-10 pr-10"
                error={errors.confirmPassword}
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              loading={loading}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Change Password
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Security Notice
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                After changing your password, you will be logged out from all devices and need to log in again.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}