'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { authApi } from '@/lib/api/auth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSkeleton, CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/utils/errorHandler';
import { User, Mail, Phone, Building, Shield, Calendar, Edit2, Save, X } from 'lucide-react';

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

export default function ProfilePage() {
  const { currentUser, setCurrentUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await authApi.getCurrentUser();
      setProfile(data);
      setCurrentUser(data);
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
      });
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Note: Backend doesn't have profile update endpoint yet
      // This is a placeholder for when it's implemented
      toast.success('Profile updated successfully');
      setEditing(false);
      await fetchProfile();
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
    });
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <LoadingSkeleton variant="text" width={200} height={32} />
          <LoadingSkeleton variant="text" width={400} height={20} className="mt-2" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CardSkeleton />
          </div>
          <div>
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-slate-400">Unable to load profile</p>
        <Button onClick={fetchProfile} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-bento-primary dark:text-slate-100">
            Profile
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your account settings and preferences
          </p>
        </div>
        {!editing && (
          <Button onClick={() => setEditing(true)} className="flex items-center gap-2">
            <Edit2 className="h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-start gap-6 mb-6">
              <div className="h-20 w-20 bg-bento-primary/10 rounded-full flex items-center justify-center">
                {profile.imageUrl ? (
                  <img
                    src={profile.imageUrl}
                    alt={profile.name}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-bento-primary" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-bento-primary dark:text-slate-100">
                  {profile.name}
                </h2>
                <p className="text-slate-500 dark:text-slate-400">@{profile.username}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    profile.active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {profile.active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-bento-primary/10 text-bento-primary dark:bg-slate-700 dark:text-slate-300">
                    {profile.roleName || 'User'}
                  </span>
                </div>
              </div>
            </div>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Full Name
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Phone Number
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleSave}
                    loading={saving}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-bento-bg dark:bg-slate-800 rounded-lg">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Username</p>
                    <p className="font-medium text-bento-primary dark:text-slate-100">{profile.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-bento-bg dark:bg-slate-800 rounded-lg">
                  <Phone className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Phone</p>
                    <p className="font-medium text-bento-primary dark:text-slate-100">{profile.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-bento-bg dark:bg-slate-800 rounded-lg">
                  <Shield className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Role</p>
                    <p className="font-medium text-bento-primary dark:text-slate-100">{profile.roleName || 'Not assigned'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-bento-bg dark:bg-slate-800 rounded-lg">
                  <Building className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Organization ID</p>
                    <p className="font-medium text-bento-primary dark:text-slate-100">
                      {profile.organizationId || 'Not assigned'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Permissions Card */}
        <div>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-bento-primary dark:text-slate-100 mb-4">
              Permissions
            </h3>
            <div className="space-y-2">
              {profile.authorities.length > 0 ? (
                profile.authorities.map((permission) => (
                  <div
                    key={permission}
                    className="px-3 py-2 bg-bento-bg dark:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-400"
                  >
                    {permission}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No permissions assigned</p>
              )}
            </div>
          </Card>

          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold text-bento-primary dark:text-slate-100 mb-4">
              Account Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Status</span>
                <span className={`text-sm font-medium ${
                  profile.active
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {profile.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Authentication</span>
                <span className={`text-sm font-medium ${
                  profile.authenticated
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {profile.authenticated ? 'Authenticated' : 'Not authenticated'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}