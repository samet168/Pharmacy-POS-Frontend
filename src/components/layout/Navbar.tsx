'use client';

import React, { useState } from 'react';
import { Menu, Search, Mic, Scan, Globe, Sun, Moon, LogOut, Settings, User, MoreVertical, Bell } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/lib/stores/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  
  const [languageOpen, setLanguageOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [currentBranch, setCurrentBranch] = useState('Phnom Penh Main Branch');

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('permissions');
    router.push('/login');
  };

  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { open: true } }));
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-20 bg-bento-white dark:bg-bento-sidebar-dark border-b border-bento-gray dark:border-slate-800 z-50">
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

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search products, customers, orders..."
                className="w-full pl-12 pr-32 py-3 bg-bento-bg dark:bg-slate-800 border border-bento-gray dark:border-slate-700 rounded-pill text-bento-primary dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-bento-primary focus:border-transparent transition-all"
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
              className="flex items-center gap-2 px-4 py-2 bg-bento-bg dark:bg-slate-800 border border-bento-gray dark:border-slate-700 rounded-pill hover:bg-bento-gray dark:hover:bg-slate-700 transition-colors"
            >
              <Globe className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-bento-primary dark:text-slate-100">
                {currentLanguage === 'en' ? 'EN' : 'KM'}
              </span>
            </button>
            
            {languageOpen && (
              <div className="absolute top-full right-0 mt-2 w-32 bg-bento-white dark:bg-bento-card-dark border border-bento-gray dark:border-slate-800 rounded-bento shadow-bento p-2">
                <button 
                  className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-bento-bg dark:hover:bg-slate-800 transition-colors text-bento-primary dark:text-slate-100"
                  onClick={() => { setCurrentLanguage('en'); setLanguageOpen(false); }}
                >
                  🇺🇸 English
                </button>
                <button 
                  className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-bento-bg dark:hover:bg-slate-800 transition-colors text-bento-primary dark:text-slate-100"
                  onClick={() => { setCurrentLanguage('km'); setLanguageOpen(false); }}
                >
                  🇰🇭 ខ្មែរ
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-3 bg-bento-bg dark:bg-slate-800 border border-bento-gray dark:border-slate-700 rounded-pill hover:bg-bento-gray dark:hover:bg-slate-700 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-bento-primary dark:text-slate-100" />
            ) : (
              <Moon className="h-5 w-5 text-bento-primary dark:text-slate-100" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-3 bg-bento-bg dark:bg-slate-800 border border-bento-gray dark:border-slate-700 rounded-pill hover:bg-bento-gray dark:hover:bg-slate-700 transition-colors relative"
            >
              <Bell className="h-5 w-5 text-bento-primary dark:text-slate-100" />
              <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-bento-pink rounded-full border-2 border-bento-white dark:border-bento-card-dark"></span>
            </button>
          </div>

          {/* User Profile Badge */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 px-4 py-2 bg-bento-bg dark:bg-slate-800 border border-bento-gray dark:border-slate-700 rounded-pill hover:bg-bento-gray dark:hover:bg-slate-700 transition-colors"
            >
              <div className="h-8 w-8 bg-bento-primary rounded-full flex items-center justify-center text-white font-medium">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-bento-primary dark:text-slate-100">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email || 'user@example.com'}</p>
              </div>
            </button>
            
            {profileOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-bento-white dark:bg-bento-card-dark border border-bento-gray dark:border-slate-800 rounded-bento shadow-bento p-2">
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bento-bg dark:hover:bg-slate-800 transition-colors text-left text-bento-primary dark:text-slate-100">
                  <User className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm">Profile Settings</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bento-bg dark:hover:bg-slate-800 transition-colors text-left text-bento-primary dark:text-slate-100">
                  <Settings className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm">Change Password</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bento-pink hover:text-bento-pink-text transition-colors text-left text-bento-primary dark:text-slate-100"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Action Button */}
          <Button variant="primary" shape="pill" size="md">
            + Quick Sale
          </Button>
        </div>
      </div>
    </nav>
  );
}