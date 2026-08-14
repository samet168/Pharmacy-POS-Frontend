'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, ShoppingCart, LogOut } from 'lucide-react';

export default function SellPage() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems] = useState<{ id: number; name: string; price: number }[]>([]);

  const handleLogout = async () => {
    await authApi.logout();
    logout();
    router.push('/pin-login');
  };

  const handleSearch = async (query: string) => {
    // TODO: Implement product search against backend
    console.log('Searching for:', query);
  };

  const handleAddToCart = (product: { id: number; name: string; price: number }) => {
    // TODO: Implement add to cart logic
    console.log('Adding to cart:', product);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 md:hidden">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900">Sell</h1>
          <button onClick={handleLogout} className="text-slate-600">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="p-4">
        {/* Search bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search products or scan barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchQuery);
                }
              }}
              className="pl-10"
            />
          </div>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-20">
          {/* Placeholder products */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-lg p-3 cursor-pointer hover:border-primary-300 transition-colors"
              onClick={() => console.log('Adding to cart:', { id: i, name: `Product ${i}`, price: 10 })}
            >
              <div className="aspect-square bg-slate-100 rounded mb-2 flex items-center justify-center text-slate-400">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8-4v10" />
                </svg>
              </div>
              <h3 className="font-medium text-slate-900 text-sm mb-1">Product {i}</h3>
              <p className="text-primary-600 font-bold">$10.00</p>
            </div>
          ))}
        </div>

        {/* Cart summary bar (mobile) */}
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-slate-600" />
              <span className="text-slate-600">Cart ({cartItems.length})</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-900">
                ${(cartItems.length * 10).toFixed(2)}
              </span>
              <Button size="sm">View Cart</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}