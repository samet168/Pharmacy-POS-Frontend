'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Search, Mic, Scan, Globe, Sun, Moon, LogOut, Settings, User, Bell, ChevronDown } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/lib/stores/authStore';
import { useLanguageStore } from '@/lib/stores/languageStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { user, currentUser, logout } = useAuthStore();
  const { language, setLanguage, toggleLanguage } = useLanguageStore();
  const { t, mounted: translationMounted } = useTranslation();
  const router = useRouter();
  
  const [languageOpen, setLanguageOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Get dynamic user data
  const userName = currentUser?.name || user?.name || 'User';
  const userEmail = currentUser?.username || user?.email || 'user@example.com';
  const userRole = currentUser?.roleName || user?.roleName || 'User';

  // Generate avatar initials from name
  const getInitials = (name: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { open: true } }));
  };

  // Handle language change with font switching
  const handleLanguageChange = (newLang: 'en' | 'kh') => {
    console.log('Language change requested:', newLang);
    setLanguage(newLang);
    setLanguageOpen(false);
    // Font switching is now handled by LanguageProvider
  };

  // Handle Quick Sale navigation
  const handleQuickSale = () => {
    router.push('/pos/sell');
  };

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    console.log('Navbar mounted, current language:', language);
    // Font switching is now handled by LanguageProvider
  }, [language]);

  // Remove the null return to ensure Navbar always renders
  // if (!mounted || !translationMounted) {
  //   return null; // Prevent hydration mismatch
  // }

  console.log('Navbar rendering:', { mounted, translationMounted, language, userName });
  
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
              onClick={() => setLanguageOpen(!languageOpen)}
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

          {/* Notifications */}
          <div className="relative">
            <button
              className="p-3 bg-bento-bg dark:bg-slate-800 border border-bento-gray dark:border-bento-border-dark rounded-pill hover:bg-bento-gray dark:hover:bg-slate-700 transition-colors relative"
            >
              <Bell className="h-5 w-5 text-bento-primary dark:text-bento-text-primary-dark" />
              <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-bento-pink rounded-full border-2 border-bento-white dark:border-bento-card-dark"></span>
            </button>
          </div>

          {/* User Profile Badge */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
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
              <div className="absolute top-full right-0 mt-2 w-64 bg-bento-white dark:bg-bento-card-dark border border-bento-gray dark:border-bento-border-dark rounded-bento shadow-bento p-2">
                {/* User Info Header */}
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

                {/* Profile Actions */}
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