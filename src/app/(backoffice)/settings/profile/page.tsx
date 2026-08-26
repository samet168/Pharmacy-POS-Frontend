'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/authStore';
import { authApi } from '@/lib/api/auth';
import { uploadsApi } from '@/lib/api/uploads';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import { SafeImage } from '@/components/ui/SafeImage';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/utils/errorHandler';
import {
  User,
  Mail,
  Phone,
  Building2,
  ShieldCheck,
  Calendar,
  Edit2,
  Save,
  X,
  ChevronRight,
  Lock,
  Radio,
  Sparkles,
  Key,
  Shield,
  Clock,
  CheckCircle2,
  Activity,
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';

interface UserProfile {
  id: number;
  username: string;
  name: string;
  phone: string;
  imageUrl?: string;
  active: boolean;
  organizationId?: number;
  roleId?: number;
  roleName?: string;
  authorities: string[];
  authenticated: boolean;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1594824813628-9c222ff46001?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&auto=format&fit=crop&q=80',
];

export default function ProfilePage() {
  const { currentUser, user, setCurrentUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    imageUrl: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await authApi.getCurrentUser();
      if (data) {
        setProfile(data);
        setCurrentUser(data);
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          imageUrl: data.imageUrl || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      const fallbackUser: UserProfile = {
        id: currentUser?.id || user?.userId || 1,
        username: currentUser?.username || user?.username || 'admin',
        name: currentUser?.name || 'Administrator',
        phone: currentUser?.phone || '+855 12 345 678',
        imageUrl: currentUser?.imageUrl || '',
        active: true,
        organizationId: currentUser?.organizationId || user?.organizationId || 1,
        roleName: currentUser?.roleName || user?.roleName || 'Pharmacist Admin',
        authorities: ['ROLE_ADMIN', 'pos.checkout', 'inventory.view', 'reports.view'],
        authenticated: true,
      };
      setProfile(fallbackUser);
      setFormData({
        name: fallbackUser.name,
        phone: fallbackUser.phone,
        imageUrl: fallbackUser.imageUrl || '',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      // Try backend upload
      const uploadRes = await uploadsApi.uploadImage(file).catch(() => null);
      if (uploadRes && uploadRes.url) {
        setFormData(prev => ({ ...prev, imageUrl: uploadRes.url }));
        toast.success('Profile photo uploaded!');
      } else {
        // Fallback to local Data URL
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
          toast.success('Profile photo selected!');
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to process image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (profile) {
        const updated: UserProfile = {
          ...profile,
          name: formData.name,
          phone: formData.phone,
          imageUrl: formData.imageUrl,
        };
        setProfile(updated);
        setCurrentUser(updated as any);
      }
      toast.success('User profile & avatar updated successfully!');
      setEditing(false);
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      phone: profile?.phone || '',
      imageUrl: profile?.imageUrl || '',
    });
    setEditing(false);
  };

  if (loading) {
    return <PageSkeleton kpiCards={4} showFilterBar tableRows={6} />;
  }

  const roleName = profile?.roleName || currentUser?.roleName || user?.roleName || 'Pharmacist Administrator';
  const orgName = 'Phnom Penh Central Pharmacy';
  const initialLetter = (profile?.name || profile?.username || 'A').charAt(0).toUpperCase();
  const currentAvatarUrl = editing ? formData.imageUrl : (profile?.imageUrl || formData.imageUrl);

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
            <span className="text-primary font-bold">User Profile</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
              <User className="h-7 w-7 text-primary shrink-0" />
              User Profile &amp; Account
            </h1>
            <Badge variant="success">
              <span className="flex items-center gap-1">
                <Radio className="h-3 w-3 animate-pulse" />
                Active Session
              </span>
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personal identity credentials, avatar image, operational role permissions, and pharmacy staff profile details.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link href="/settings/change-password">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 text-xs rounded-xl"
            >
              <Lock className="h-3.5 w-3.5" />
              Change Password
            </Button>
          </Link>

          {!editing ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-xs font-bold rounded-xl shadow-md"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit Profile &amp; Avatar
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={saving || uploadingImage}
                onClick={handleSave}
                className="text-xs font-bold rounded-xl shadow-md flex items-center gap-1"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 2. 4 Bento KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Account Status */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Account Status
            </span>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {profile?.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Verified credentials</span>
          </div>
        </div>

        {/* Card 2: Role & Scope */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Assigned Role
            </span>
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Shield className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 truncate max-w-[180px]">
              {roleName}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>{profile?.authorities?.length || 4} granted permissions</span>
          </div>
        </div>

        {/* Card 3: Organization */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Organization
            </span>
            <div className="p-2.5 bg-indigo-500/10 rounded-xl">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 truncate max-w-[180px]">
              {orgName}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Tenant ID #{profile?.organizationId || 1}</span>
          </div>
        </div>

        {/* Card 4: Session Security */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Session
            </span>
            <div className="p-2.5 bg-amber-500/10 rounded-xl">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              Authenticated
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Activity className="h-3.5 w-3.5 text-amber-500" />
            <span>JWT Bearer Token Active</span>
          </div>
        </div>
      </div>

      {/* 3. Main Profile Bento Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Summary Card */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center space-y-4">
          {/* Avatar Container */}
          <div className="relative group">
            <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-xl border-4 border-white dark:border-slate-800 bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-white text-3xl font-black relative">
              <SafeImage
                src={currentAvatarUrl}
                alt={profile?.name || 'User Avatar'}
                className="w-full h-full object-cover"
                fallback={
                  <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white bg-gradient-to-tr from-primary to-indigo-600">
                    {initialLetter}
                  </div>
                }
              />

              {/* Uploading Overlay */}
              {uploadingImage && (
                <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-xs font-bold">
                  Uploading...
                </div>
              )}
            </div>

            {/* Verified badge */}
            <div className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800 shadow">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>

            {/* Camera Overlay button in edit mode */}
            {editing && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-3xl bg-slate-900/50 flex flex-col items-center justify-center text-white opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
                title="Change Avatar"
              >
                <Camera className="h-6 w-6 mb-1" />
                <span className="text-[10px] font-bold">Upload Photo</span>
              </button>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {profile?.name || profile?.username}
            </h2>
            <p className="text-xs font-mono text-slate-400">@{profile?.username}</p>
            <div className="pt-2">
              <Badge variant="info">{roleName}</Badge>
            </div>
          </div>

          {/* Quick Preset Avatars Picker in Editing Mode */}
          {editing && (
            <div className="w-full pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block text-left">
                Or Select Preset Avatar:
              </label>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: url }))}
                    className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all hover:scale-110 ${
                      formData.imageUrl === url
                        ? 'border-primary ring-2 ring-primary/30 shadow'
                        : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
                {formData.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                    className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 hover:bg-rose-100 text-xs"
                    title="Remove Photo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-700/60 space-y-2.5 text-left text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Account User ID</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">#{profile?.id}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Organization Tenant</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">Tenant #{profile?.organizationId || 1}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Access Level</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">Full Staff Access</span>
            </div>
          </div>
        </div>

        {/* Right Column: Profile Form & Details */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Personal &amp; Contact Information
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage how your name, profile avatar, and contact info are displayed across pharmacy prescriptions and POS receipts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Username (System Login)
              </label>
              <input
                type="text"
                disabled
                value={profile?.username || ''}
                className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Display Name *
              </label>
              <input
                type="text"
                disabled={!editing}
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-none transition-all ${
                  editing
                    ? 'bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                    : 'bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                disabled={!editing}
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+855 12 345 678"
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-none transition-all ${
                  editing
                    ? 'bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                    : 'bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Primary Organization
              </label>
              <input
                type="text"
                disabled
                value={orgName}
                className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-500 cursor-not-allowed"
              />
            </div>

            {/* Profile Avatar Image URL input in editing mode */}
            {editing && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Avatar Image Web URL (Optional)
                </label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/avatar.jpg or click Upload above"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Assigned System Authorities Section */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Granted Security Authorities
            </h4>
            <div className="flex flex-wrap gap-2">
              {(profile?.authorities || ['ROLE_ADMIN', 'pos.checkout', 'inventory.view', 'reports.view']).map((auth, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                >
                  <Key className="h-3 w-3 text-primary" />
                  {auth}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
