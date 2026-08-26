'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/utils/errorHandler';
import { authApi } from '@/lib/api/auth';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Key,
  Shield,
  Clock,
  Radio,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';

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

      toast.success('Password changed successfully! Please log in again.');

      // Clear auth data and redirect
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
    if (!password) return { strength: 0, label: 'None', color: 'bg-slate-200 dark:bg-slate-700', percent: 0 };

    let score = 0;
    if (password.length >= 6) score += 20;
    if (password.length >= 10) score += 20;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 20;
    if (/\d/.test(password)) score += 20;
    if (/[^a-zA-Z0-9]/.test(password)) score += 20;

    if (score <= 40) return { strength: 1, label: 'Weak', color: 'bg-rose-500', percent: score };
    if (score <= 80) return { strength: 2, label: 'Good', color: 'bg-amber-500', percent: score };
    return { strength: 3, label: 'Strong', color: 'bg-emerald-500', percent: score };
  };

  const strength = getPasswordStrength(formData.newPassword);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* 1. Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <Link href="/settings" className="hover:text-primary transition-colors">
              Settings
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-primary font-bold">Change Password</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
              <Lock className="h-7 w-7 text-primary shrink-0" />
              Account Security &amp; Password
            </h1>
            <Badge variant="success">
              <span className="flex items-center gap-1">
                <Radio className="h-3 w-3 animate-pulse" />
                Encrypted Credentials
              </span>
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Update your authentication password to protect sensitive pharmacy prescriptions and financial checkout operations.
          </p>
        </div>
      </div>

      {/* 2. 4 Bento KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Password Strength */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Password Strength
            </span>
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Key className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {strength.label}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>{strength.percent}% security score</span>
          </div>
        </div>

        {/* Card 2: Credential Standard */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Hashing Algorithm
            </span>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              BCrypt-12
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Salted password storage</span>
          </div>
        </div>

        {/* Card 3: Token Invalidation */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Session Handling
            </span>
            <div className="p-2.5 bg-indigo-500/10 rounded-xl">
              <Shield className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-primary">
              Auto Logout
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Invalidates current session</span>
          </div>
        </div>

        {/* Card 4: Last Rotation */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Policy Standard
            </span>
            <div className="p-2.5 bg-amber-500/10 rounded-xl">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              90 Days
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Recommended rotation cycle</span>
          </div>
        </div>
      </div>

      {/* 3. Main Form & Guidelines Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Password Update Form */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Current Password *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
                  placeholder="Enter your current password"
                  className={`w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/60 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    errors.currentPassword
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-slate-200 dark:border-slate-700 focus:border-primary'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.currentPassword}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="At least 6 characters"
                  className={`w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/60 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    errors.newPassword
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-slate-200 dark:border-slate-700 focus:border-primary'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.newPassword}
                </p>
              )}

              {/* Password Strength Progress */}
              {formData.newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-slate-400 uppercase">Strength</span>
                    <span className={strength.strength === 3 ? 'text-emerald-500' : strength.strength === 2 ? 'text-amber-500' : 'text-rose-500'}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all duration-300`}
                      style={{ width: `${strength.percent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Re-enter your new password"
                  className={`w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/60 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    errors.confirmPassword
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-slate-200 dark:border-slate-700 focus:border-primary'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
              <Link href="/settings/profile">
                <Button variant="outline" size="sm" className="text-xs rounded-xl">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={loading}
                className="text-xs font-bold rounded-xl shadow-md"
              >
                {loading ? 'Updating Credentials...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column: Security Checklist */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Security Recommendations
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { label: 'Minimum 6 characters (8+ recommended)', met: formData.newPassword.length >= 6 },
              { label: 'Includes uppercase & lowercase letters', met: /[a-z]/.test(formData.newPassword) && /[A-Z]/.test(formData.newPassword) },
              { label: 'Includes at least one number (0-9)', met: /\d/.test(formData.newPassword) },
              { label: 'Includes special character (!@#$%)', met: /[^a-zA-Z0-9]/.test(formData.newPassword) },
              { label: 'Different from current password', met: formData.newPassword && formData.newPassword !== formData.currentPassword },
            ].map((rule, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className={`p-0.5 rounded-full mt-0.5 ${rule.met ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                  <Check className="h-3 w-3" />
                </div>
                <span className={rule.met ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-slate-400'}>
                  {rule.label}
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>Security Notice:</strong> Changing your password will require you to log back in with your new credentials on this terminal.
          </div>
        </div>
      </div>
    </div>
  );
}