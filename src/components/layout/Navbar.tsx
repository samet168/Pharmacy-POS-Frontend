'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Menu, Search, Mic, Scan, Globe, Sun, Moon, LogOut, Settings, User, Bell, ChevronDown, CheckCircle, AlertTriangle, Info, X, ExternalLink, CheckCheck } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/lib/stores/authStore';
import { useLanguageStore } from '@/lib/stores/languageStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const SAMPLE_HEADER_NOTIFICATIONS = [
  {
    id: '1',
    type: 'WARNING',
    title: 'Low Stock Alert',
    message: 'Amoxicillin 250mg is low on stock (18 units left).',
    read: false,
    time: '25m ago',
  },
  {
    id: '2',
    type: 'SUCCESS',
    title: 'POS Shift Reconciled',
    message: 'Shift #102 closed with $0.00 cash variance.',
    read: false,
    time: '2h ago',
  },
  {
    id: '3',
    type: 'WARNING',
    title: 'Medication Expiry Warning',
    message: 'Ibuprofen 400mg (BAT-2026-04) expires in 30 days.',
    read: true,
    time: '6h ago',
  },
  {
    id: '4',
    type: 'INFO',
    title: 'System Cloud Backup',
    message: 'PostgreSQL database backup completed to Neon Cloud.',
    read: true,
    time: '1d ago',
  },
];
import { notificationsApi, NotificationResponse } from '@/lib/api/notifications';

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { user, currentUser, logout } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();
  const { t } = useTranslation();
  const router = useRouter();
  
  const [languageOpen, setLanguageOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      const userId = currentUser?.id || (user as any)?.userId || (user as any)?.id || 1;
      const orgId = currentUser?.organizationId || user?.organizationId || 1;

      try {
        const [userRes, orgRes] = await Promise.allSettled([
          notificationsApi.getUserNotifications(userId, 0, 10),
          notificationsApi.getOrganizationNotifications(orgId, 0, 10)
        ]);

        const itemsMap = new Map<number, NotificationResponse>();

        if (userRes.status === 'fulfilled' && userRes.value?.content) {
          userRes.value.content.forEach(item => itemsMap.set(item.id, item));
        }

        if (orgRes.status === 'fulfilled' && orgRes.value?.content) {
          orgRes.value.content.forEach(item => itemsMap.set(item.id, item));
        }

        const combined = Array.from(itemsMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setNotifications(combined);
        setUnreadCount(combined.filter(n => !n.read).length);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    };

    fetchNotifications();
  }, [currentUser?.id, (user as any)?.userId, user?.id, currentUser?.organizationId, user?.organizationId]);

  // Get dynamic user data
  const userName = currentUser?.name || user?.name || 'User';
  const userEmail = currentUser?.username || user?.email || 'user@example.com';
  const userRole = currentUser?.roleName || user?.roleName || 'User';

  const getInitials = (name: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { open: true } }));
  };

  const handleLanguageChange = (newLang: 'en' | 'kh') => {
    setLanguage(newLang);
    setLanguageOpen(false);
  };

  const markAllRead = async () => {
    const userId = currentUser?.id || user?.id;
    if (!userId) return;
    try {
      await notificationsApi.markAllAsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark notifications as read');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-bento-primary shrink-0" />;
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-20 bg-bento-white dark:bg-bento-card-dark border-b border-bento-gray dark:border-bento-border-dark z-50">
      <div className="flex items-center justify-between h-full px-8">
        {/* Left Side */}
        <div className="flex items-center gap-4 flex-1">
          {/* Mobile Hamburger Menu */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-3 bg-bento-bg dark:bg-slate-800 border border-bento-gray dark:border-slate-700 rounded-pill hover:bg-bento-gray dark:hover:bg-slate-700 transition-colors"
          >
            <Menu className="h-5 w-5 text-bento-primary dark:text-slate-100" />
          </button>

          {/* Logo / Brand Name */}
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-gradient-to-br from-bento-primary to-bento-primary-dark rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
              P
            </div>
            <h1 className={`text-xl font-bold text-bento-primary dark:text-bento-text-primary-dark ${language === 'kh' ? 'font-khmer' : ''}`}>
              {t('navbar.appName')}
            </h1>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl ml-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder={t('navbar.searchPlaceholder')}
                className={`w-full pl-12 pr-32 py-3 bg-bento-bg dark:bg-slate-800 border border-bento-gray dark:border-bento-border-dark rounded-pill text-bento-primary dark:text-bento-text-primary-dark placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-bento-primary focus:border-transparent transition-all ${language === 'kh' ? 'font-khmer' : ''}`}
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                <button className="p-2 hover:bg-bento-gray dark:hover:bg-slate-700 rounded-full transition-colors">
                  <Mic className="h-4 w-4 text-slate-400" />
                </button>
                <button className="p-2 hover:bg-bento-gray dark:hover:bg-slate-700 rounded-full transition-colors">
                  <Scan className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4 ml-8">
          {/* Language Selector Capsule */}
          <div className="relative">
            <button
              onClick={() => { setLanguageOpen(!languageOpen); setProfileOpen(false); setNotificationsOpen(false); }}
              className="flex items-center gap-2 px-4 py-2 bg-bento-bg dark:bg-slate-800 border border-bento-gray dark:border-bento-border-dark rounded-pill hover:bg-bento-gray dark:hover:bg-slate-700 transition-colors"
            >
              <Globe className="h-4 w-4 text-slate-500" />
              <span className={`text-sm font-medium text-bento-primary dark:text-bento-text-primary-dark ${language === 'kh' ? 'font-khmer' : ''}`}>
                {language === 'en' ? 'EN' : 'KH'}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
            
            {languageOpen && (
              <div className="absolute top-full right-0 mt-2 w-40 bg-bento-white dark:bg-bento-card-dark border border-bento-gray dark:border-bento-border-dark rounded-bento shadow-bento p-2 z-50">
                <button 
                  className={`w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-bento-bg dark:hover:bg-slate-800 transition-colors text-bento-primary dark:text-bento-text-primary-dark ${language === 'en' ? 'bg-bento-bg dark:bg-slate-800' : ''}`}
                  onClick={() => handleLanguageChange('en')}
                >
                  {t('navbar.english')}
                </button>
                <button 
                  className={`w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-bento-bg dark:hover:bg-slate-800 transition-colors text-bento-primary dark:text-bento-text-primary-dark ${language === 'kh' ? 'font-khmer bg-bento-bg dark:bg-slate-800' : ''}`}
                  onClick={() => handleLanguageChange('kh')}
                >
                  {t('navbar.khmer')}
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-3 bg-bento-bg dark:bg-slate-800 border border-bento-gray dark:border-bento-border-dark rounded-pill hover:bg-bento-gray dark:hover:bg-slate-700 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-bento-primary dark:text-bento-text-primary-dark" />
            ) : (
              <Moon className="h-5 w-5 text-bento-primary" />
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); setLanguageOpen(false); }}
              className="p-3 bg-bento-bg dark:bg-slate-800 border border-bento-gray dark:border-bento-border-dark rounded-pill hover:bg-bento-gray dark:hover:bg-slate-700 transition-colors relative"
              title="Notifications"
            >
              <Bell className="h-5 w-5 text-bento-primary dark:text-bento-text-primary-dark" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-3 w-3 bg-rose-500 rounded-full border-2 border-bento-white dark:border-bento-card-dark animate-pulse"></span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-bento-white dark:bg-bento-card-dark border border-bento-gray dark:border-bento-border-dark rounded-2xl shadow-xl p-3 z-50 space-y-2">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full">
                        {unreadCount} NEW
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-bento-primary dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1">
                      <CheckCheck className="h-3.5 w-3.5" /> Read All
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.map((item) => (
                    <div key={item.id} className={`p-3 flex items-start gap-3 rounded-xl transition-colors ${!item.read ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                      {getIcon(item.type)}
                      <div className="space-y-0.5 flex-1">
                        <div className="flex justify-between items-center">
                          <p className="font-bold text-xs text-slate-900 dark:text-slate-100">{item.title}</p>
                          <span className="text-[10px] text-slate-400">{item.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">{item.message}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <button
                    onClick={() => { router.push('/notifications'); setNotificationsOpen(false); }}
                    className="text-xs font-bold text-bento-primary dark:text-indigo-400 hover:underline inline-flex items-center gap-1 py-1"
                  >
                    View All Notifications <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Badge */}
          <div className="relative">
            <button
              onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); setLanguageOpen(false); }}
              className="flex items-center gap-3 px-4 py-2 bg-bento-bg dark:bg-slate-800 border border-bento-gray dark:border-bento-border-dark rounded-pill hover:bg-bento-gray dark:hover:bg-slate-700 transition-all hover:shadow-md"
            >
              <div className="h-9 w-9 bg-gradient-to-br from-bento-primary to-bento-primary-dark rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {getInitials(userName)}
              </div>
              <div className="text-left hidden sm:block">
                <p className={`text-sm font-semibold text-bento-primary dark:text-bento-text-primary-dark ${language === 'kh' ? 'font-khmer' : ''}`}>
                  {userName}
                </p>
                <p className="text-xs text-slate-500 dark:text-bento-text-secondary-dark">{userEmail}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            
            {profileOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-bento-white dark:bg-bento-card-dark border border-bento-gray dark:border-bento-border-dark rounded-bento shadow-bento p-2 z-50">
                <div className="px-3 py-4 border-b border-bento-gray dark:border-bento-border-dark mb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-bento-primary to-bento-primary-dark rounded-full flex items-center justify-center text-white font-semibold">
                      {getInitials(userName)}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold text-bento-primary dark:text-bento-text-primary-dark ${language === 'kh' ? 'font-khmer' : ''}`}>
                        {userName}
                      </p>
                      <span className="inline-block px-2 py-0.5 text-xs font-medium bg-bento-primary/10 text-bento-primary dark:text-bento-primary-dark rounded-full">
                        {userRole}
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => { router.push('/settings/profile'); setProfileOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bento-bg dark:hover:bg-slate-800 transition-colors text-left text-bento-primary dark:text-bento-text-primary-dark"
                >
                  <User className="h-4 w-4 text-slate-500 dark:text-bento-text-muted-dark" />
                  <span className={`text-sm ${language === 'kh' ? 'font-khmer' : ''}`}>{t('navbar.profileSettings')}</span>
                </button>
                
                <button 
                  onClick={() => { router.push('/settings/change-password'); setProfileOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bento-bg dark:hover:bg-slate-800 transition-colors text-left text-bento-primary dark:text-bento-text-primary-dark"
                >
                  <Settings className="h-4 w-4 text-slate-500 dark:text-bento-text-muted-dark" />
                  <span className={`text-sm ${language === 'kh' ? 'font-khmer' : ''}`}>{t('navbar.changePassword')}</span>
                </button>

                <div className="my-2 border-t border-bento-gray dark:border-bento-border-dark"></div>

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bento-pink hover:text-bento-pink-text transition-colors text-left text-bento-primary dark:text-bento-text-primary-dark"
                >
                  <LogOut className="h-4 w-4" />
                  <span className={`text-sm font-medium ${language === 'kh' ? 'font-khmer' : ''}`}>{t('navbar.logout')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}