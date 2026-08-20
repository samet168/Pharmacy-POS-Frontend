'use client';

import { useAuthStore } from '@/lib/stores/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Menu, Search, ShoppingBag, X, ChevronUp } from 'lucide-react';

export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, initialize } = useAuthStore();
  const { t, language } = useTranslation();
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(3);
  const [cartTotal, setCartTotal] = useState('៛24,500');
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router, mounted]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('permissions');
    localStorage.removeItem('organizationId');
    document.cookie = 'isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    router.push('/login');
  };

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface md:bg-surface-raised">
      {/* POS Layout for mobile-first cashier mode */}
      <div className="flex flex-col h-screen">
        {/* Top Bar - 48px minimal */}
        <header className="h-12 bg-ink text-white flex items-center justify-between px-4 md:hidden">
          <button className="p-2 hover:bg-white/10 rounded-lg">
            <Menu className="h-5 w-5" />
          </button>
          <div className={`text-sm ${language === 'kh' ? 'font-khmer' : ''}`}>
            <span className="font-medium">{t('pos.branch')} A</span>
            <span className="text-slate-400 ml-2">· {t('pos.cashier')}</span>
          </div>
          <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Search Bar - 56px always visible, thumb-reachable */}
        <div className="px-4 py-3 bg-surface-raised border-b border-pine-dim">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder={t('pos.searchPlaceholder')}
              className={`w-full pl-10 pr-4 py-3 bg-surface border border-pine-dim rounded-pos text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pine min-h-[44px] ${language === 'kh' ? 'font-khmer' : ''}`}
            />
          </div>
        </div>

        {/* Content Area - scrollable */}
        <main className="flex-1 overflow-auto px-4 py-4">
          {children}
        </main>

        {/* Bottom Cart Drawer Handle - 64px persistent */}
        <div className="md:hidden">
          <button
            onClick={() => setCartOpen(!cartOpen)}
            className="w-full h-16 bg-ink text-white flex items-center justify-between px-4 border-t border-white/10"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5" />
              <span className={`font-medium ${language === 'kh' ? 'font-khmer' : ''}`}>{t('pos.cart')} ({cartCount})</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-display font-semibold">{cartTotal}</span>
              <ChevronUp className={`h-5 w-5 transition-transform ${cartOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* Cart Drawer - slide up */}
          {cartOpen && (
            <div className="absolute bottom-16 left-0 right-0 bg-surface-raised border-t border-pine-dim shadow-lg max-h-[60vh] overflow-auto p-4 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-ink">Cart Items</h3>
                <button onClick={() => setCartOpen(false)} className="text-slate-400 hover:text-ink">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {/* Cart items would go here */}
              <div className="text-center text-slate-400 py-8">
                <ShoppingBag className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Cart items will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}