'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { authApi } from '@/lib/api/auth';
import { productsApi, type Product } from '@/lib/api/products';
import { categoriesApi, type Category } from '@/lib/api/categories';
import { customersApi, type Customer } from '@/lib/api/customers';
import { ordersApi, type CheckoutRequest, type CheckoutItem, type CheckoutPayment } from '@/lib/api/orders';
import { productUnitsApi, type ProductUnit } from '@/lib/api/productUnits';
import { SafeImage } from '@/components/ui/SafeImage';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Package,
  Loader2,
  CheckCircle2,
  Barcode,
  User,
  CreditCard,
  QrCode,
  DollarSign,
  Receipt,
  ArrowLeft,
  Maximize2,
  Minimize2,
  RefreshCw,
  Percent,
  X,
  AlertCircle,
  Tag,
  ShieldAlert,
  Sparkles,
  Layers,
  HeartPulse,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CartItem {
  productId: number;
  name: string;
  sku?: string;
  unitId: number;
  unitName: string;
  unitPrice: number;
  costPrice?: number;
  quantity: number;
  imageUrl?: string;
  requiresPrescription?: boolean;
}

export default function SellPage() {
  const router = useRouter();
  const { user, currentUser, logout, branchIds } = useAuthStore();
  const branchId = branchIds?.[0] ?? 1;
  const orgId = currentUser?.organizationId || user?.organizationId || 1;

  // Real-time Clock
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Products & Categories & Customers state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'ALL'>('ALL');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cart & Customer state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState('');

  // Discount & Tax state
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0);

  // Checkout modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'KHQR' | 'CARD'>('CASH');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [paymentCurrency, setPaymentCurrency] = useState<'USD' | 'KHR'>('USD');
  const [checkingOut, setCheckingOut] = useState(false);
  const [lastOrderSuccess, setLastOrderSuccess] = useState<any | null>(null);

  // Mobile cart drawer
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const exchangeRate = 4100; // 1 USD = 4,100 KHR

  // Load cart from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('pos_cart');
      if (savedCart) setCartItems(JSON.parse(savedCart));
    } catch {}
  }, []);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('pos_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Load Data
  const loadInitialData = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const [prodsRes, catsRes, custsRes, unitsRes] = await Promise.allSettled([
        productsApi.getByOrganization(orgId, 0, 150),
        categoriesApi.getByOrganization(orgId, 0, 100),
        customersApi.getByOrganization(orgId, 0, 100),
        productUnitsApi.listAll(),
      ]);

      if (prodsRes.status === 'fulfilled') {
        const list = Array.isArray(prodsRes.value)
          ? prodsRes.value
          : (prodsRes.value as any)?.content || [];
        setProducts(list.filter((p: Product) => p.isActive));
      }

      if (catsRes.status === 'fulfilled') {
        const list = Array.isArray(catsRes.value)
          ? catsRes.value
          : (catsRes.value as any)?.content || [];
        setCategories(list);
      }

      if (custsRes.status === 'fulfilled') {
        const list = Array.isArray(custsRes.value)
          ? custsRes.value
          : (custsRes.value as any)?.content || [];
        setCustomers(list);
      }

      if (unitsRes.status === 'fulfilled') {
        setUnits(Array.isArray(unitsRes.value) ? unitsRes.value : []);
      }
    } catch (err) {
      console.error('Failed to load POS data:', err);
      toast.error('Failed to load catalog');
    } finally {
      setLoadingProducts(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Search logic
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      if (!q.trim()) {
        loadInitialData();
        return;
      }
      try {
        setLoadingProducts(true);
        const res = await productsApi.getByOrganization(orgId, 0, 200);
        const list = Array.isArray(res) ? res : (res as any)?.content || [];
        const lowerQ = q.trim().toLowerCase();
        const filtered = list.filter(
          (p: Product) =>
            p.isActive &&
            (p.brandName?.toLowerCase().includes(lowerQ) ||
              p.genericName?.toLowerCase().includes(lowerQ) ||
              p.sku?.toLowerCase().includes(lowerQ) ||
              p.barcode?.toLowerCase().includes(lowerQ))
        );
        setProducts(filtered);

        // Auto-add if exact barcode scan match
        const exactBarcodeMatch = filtered.find(
          (p: Product) => p.barcode?.toLowerCase() === lowerQ || p.sku?.toLowerCase() === lowerQ
        );
        if (exactBarcodeMatch && filtered.length === 1) {
          handleAddToCart(exactBarcodeMatch);
          setSearchQuery('');
        }
      } catch {
      } finally {
        setLoadingProducts(false);
      }
    }, 250);
  };

  // Filtered Products by Category
  const displayedProducts = useMemo(() => {
    if (selectedCategory === 'ALL') return products;
    return products.filter((p) => p.categoryId === selectedCategory);
  }, [products, selectedCategory]);

  // Cart operations
  const handleAddToCart = (product: Product) => {
    const defaultUnit = units[0] || { id: 1, name: 'Unit' };
    const price = product.sellingPrice || 1.0;

    setCartItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.productId === product.id);
      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += 1;
        return copy;
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.brandName,
          sku: product.sku,
          unitId: defaultUnit.id,
          unitName: defaultUnit.name,
          unitPrice: price,
          costPrice: product.costPrice,
          quantity: 1,
          imageUrl: product.imageUrl,
          requiresPrescription: product.requiresPrescription,
        },
      ];
    });
    toast.success(`Added ${product.brandName}`);
  };

  const handleQtyChange = (productId: number, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const handlePriceChange = (productId: number, newPrice: string) => {
    const val = parseFloat(newPrice) || 0;
    setCartItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, unitPrice: val } : i))
    );
  };

  const handleRemoveItem = (productId: number) => {
    setCartItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
    setDiscountPercent(0);
    toast.info('Cart cleared');
  };

  // Financial Calculations
  const rawSubtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    return (rawSubtotal * discountPercent) / 100;
  }, [rawSubtotal, discountPercent]);

  const taxableAmount = Math.max(0, rawSubtotal - discountAmount);
  const taxAmount = (taxableAmount * taxPercent) / 100;
  const grandTotalUSD = Math.max(0, taxableAmount + taxAmount);
  const grandTotalKHR = Math.round(grandTotalUSD * exchangeRate);

  const totalItemsCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  // Payment Calculations
  const parsedPaidUSD = useMemo(() => {
    const val = parseFloat(amountPaid) || 0;
    if (paymentCurrency === 'KHR') {
      return val / exchangeRate;
    }
    return val;
  }, [amountPaid, paymentCurrency]);

  const changeAmountUSD = Math.max(0, parsedPaidUSD - grandTotalUSD);
  const changeAmountKHR = Math.round(changeAmountUSD * exchangeRate);

  const isPaymentValid = parsedPaidUSD >= grandTotalUSD && grandTotalUSD > 0;

  // Quick Preset Cash buttons
  const setExactCash = () => {
    if (paymentCurrency === 'USD') {
      setAmountPaid(grandTotalUSD.toFixed(2));
    } else {
      setAmountPaid(grandTotalKHR.toString());
    }
  };

  const addPresetCash = (val: number) => {
    setPaymentCurrency('USD');
    setAmountPaid(val.toString());
  };

  const addPresetKHR = (val: number) => {
    setPaymentCurrency('KHR');
    setAmountPaid(val.toString());
  };

  // Process Checkout
  const handleCompleteCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    if (!isPaymentValid) {
      toast.error('Amount paid is insufficient');
      return;
    }

    setCheckingOut(true);
    try {
      const items: CheckoutItem[] = cartItems.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitId: i.unitId || 1,
        unitPrice: i.unitPrice,
      }));

      const payments: CheckoutPayment[] = [
        {
          orderId: 0,
          paymentMethod,
          amountPaid: parsedPaidUSD,
          currency: 'USD',
          exchangeRateUsed: exchangeRate,
        },
      ];

      const request: CheckoutRequest = {
        organizationId: orgId,
        branchId,
        userId: user?.userId || currentUser?.id || 1,
        customerId: selectedCustomerId || undefined,
        items,
        payments,
      };

      const result = await ordersApi.checkout(request);

      setLastOrderSuccess(result.order);
      setCartItems([]);
      setAmountPaid('');
      setShowPaymentModal(false);
      setMobileCartOpen(false);
      toast.success(`Sale Complete! Invoice #${result.order.invoiceNumber || result.order.id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Checkout failed. Please try again.';
      toast.error(msg);
    } finally {
      setCheckingOut(false);
    }
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans select-none">
      {/* ------------------------------------------------------------------ */}
      {/* 1. TOP BAR — Modern Pharmacy Header & Shift Status                 */}
      {/* ------------------------------------------------------------------ */}
      <header className="h-16 px-4 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center justify-center h-10 w-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/50"
            title="Back to Backoffice"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">PHARMACY POS</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  LIVE TERMINAL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Register #{branchId} • {user?.username || 'Pharmacist'}
              </p>
            </div>
          </div>
        </div>

        {/* Center Live Clock */}
        <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/40 text-xs font-medium text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{currentTime}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">1 USD = 4,100 KHR</span>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="hidden sm:flex items-center justify-center h-10 w-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/50"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          <button
            onClick={() => loadInitialData()}
            className="flex items-center justify-center h-10 w-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/50"
            title="Refresh Catalog"
          >
            <RefreshCw className={`h-4 w-4 ${loadingProducts ? 'animate-spin' : ''}`} />
          </button>

          {/* Mobile Cart Button */}
          <button
            onClick={() => setMobileCartOpen(true)}
            className="lg:hidden relative flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>${grandTotalUSD.toFixed(2)}</span>
            {totalItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 2. MAIN WORKSPACE — Dual Panel Layout                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ================================================================ */}
        {/* LEFT PANEL: Medicine Catalog & Quick Categories (65% width)      */}
        {/* ================================================================ */}
        <section className="flex-1 flex flex-col min-w-0 bg-slate-950 border-r border-slate-800/80">
          {/* Search & Barcode Bar */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Scan Barcode, SKU, or search medicine by Brand / Generic name..."
                className="w-full pl-11 pr-10 py-3 rounded-xl bg-slate-900 border border-slate-700/60 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-inner"
              />
              {searchQuery ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    loadInitialData();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                  <Barcode className="h-3 w-3" />
                  <span>SCAN</span>
                </div>
              )}
            </div>
          </div>

          {/* Category Tabs Scrollbar */}
          <div className="px-4 py-2.5 border-b border-slate-800/60 bg-slate-900/20 overflow-x-auto no-scrollbar flex items-center gap-2">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === 'ALL'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>All Medicines ({products.length})</span>
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = products.filter((p) => p.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Tag className="h-3 w-3 opacity-70" />
                  <span>{cat.name}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            {loadingProducts ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                <p className="text-sm">Loading medicine catalog...</p>
              </div>
            ) : displayedProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 py-12">
                <Package className="h-16 w-16 stroke-1 opacity-40 text-slate-400" />
                <h3 className="text-base font-semibold text-slate-300">No medicines found</h3>
                <p className="text-xs text-slate-500 max-w-sm text-center">
                  Try searching for a different keyword or check if medicines are registered in the Backoffice.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
                {displayedProducts.map((p) => {
                  const inCartItem = cartItems.find((i) => i.productId === p.id);
                  const price = p.sellingPrice || 1.0;
                  const priceKHR = Math.round(price * exchangeRate);

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleAddToCart(p)}
                      className={`group relative flex flex-col justify-between rounded-2xl p-3 bg-slate-900/70 hover:bg-slate-900 border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] ${
                        inCartItem
                          ? 'border-emerald-500/80 ring-2 ring-emerald-500/20'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-1 mb-2">
                        {p.requiresPrescription ? (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <ShieldAlert className="h-2.5 w-2.5" />
                            Rx
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-800 text-slate-400">
                            OTC
                          </span>
                        )}

                        {inCartItem && (
                          <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-500 text-slate-950 shadow-sm animate-fade-in">
                            {inCartItem.quantity} in cart
                          </span>
                        )}
                      </div>

                      {/* Image / Thumbnail */}
                      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 mb-2.5 flex items-center justify-center border border-slate-800/60">
                        {p.imageUrl ? (
                          <SafeImage
                            src={p.imageUrl}
                            alt={p.brandName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            fallback={
                              <div className="flex flex-col items-center justify-center text-slate-600">
                                <Package className="h-8 w-8" />
                              </div>
                            }
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-600">
                            <Package className="h-8 w-8 group-hover:text-emerald-400/80 transition-colors" />
                          </div>
                        )}
                      </div>

                      {/* Info & Title */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-semibold text-sm text-slate-100 line-clamp-2 leading-snug group-hover:text-emerald-400 transition-colors">
                            {p.brandName}
                          </h4>
                          {p.genericName && (
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                              {p.genericName}
                            </p>
                          )}
                          {p.sku && (
                            <p className="text-[10px] font-mono text-slate-500 mt-1">
                              {p.sku}
                            </p>
                          )}
                        </div>

                        {/* Price & Add Action */}
                        <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                          <div>
                            <div className="text-base font-bold text-emerald-400 leading-none">
                              ${price.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {priceKHR.toLocaleString()} ៛
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(p);
                            }}
                            className="h-8 w-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 flex items-center justify-center transition-all border border-emerald-500/20 group-hover:border-emerald-500"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ================================================================ */}
        {/* RIGHT PANEL: Modern POS Register & Cashier Panel (35% width)     */}
        {/* ================================================================ */}
        <aside className="hidden lg:flex w-[420px] xl:w-[460px] flex-col bg-slate-900 border-l border-slate-800 shadow-2xl z-10 shrink-0">
          {/* Register Top: Customer Selector & Clear */}
          <div className="p-4 border-b border-slate-800 bg-slate-900 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Current Order</h3>
                <span className="px-2 py-0.5 text-xs font-bold bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                  {totalItemsCount} items
                </span>
              </div>

              {cartItems.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="text-xs text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 font-medium transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Customer Pill Selector */}
            <div className="relative">
              <button
                onClick={() => setCustomerSearchOpen(!customerSearchOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 text-xs text-left transition-all"
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div className="truncate">
                    {selectedCustomer ? (
                      <span className="font-semibold text-white">
                        {selectedCustomer.name} {selectedCustomer.phone ? `(${selectedCustomer.phone})` : ''}
                      </span>
                    ) : (
                      <span className="text-slate-400">Walk-in Customer (General)</span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold uppercase">Change</span>
              </button>

              {/* Customer Dropdown */}
              {customerSearchOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={customerQuery}
                      onChange={(e) => setCustomerQuery(e.target.value)}
                      placeholder="Search patient / phone..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                    <button
                      onClick={() => {
                        setSelectedCustomerId(null);
                        setCustomerSearchOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-300 flex items-center justify-between"
                    >
                      <span>Walk-in Customer (General)</span>
                      {!selectedCustomerId && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                    </button>
                    {customers
                      .filter(
                        (c) =>
                          c.name.toLowerCase().includes(customerQuery.toLowerCase()) ||
                          (c.phone && c.phone.includes(customerQuery))
                      )
                      .map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomerId(c.id);
                            setCustomerSearchOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-300 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium text-white">{c.name}</p>
                            {c.phone && <p className="text-[10px] text-slate-500">{c.phone}</p>}
                          </div>
                          {selectedCustomerId === c.id && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Register Body: Cart Items List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2.5 custom-scrollbar bg-slate-950/30">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 py-12">
                <div className="h-16 w-16 rounded-full bg-slate-900 flex items-center justify-center text-slate-600 border border-slate-800">
                  <ShoppingCart className="h-7 w-7" />
                </div>
                <p className="text-sm font-medium text-slate-400">Cart is currently empty</p>
                <p className="text-xs text-slate-600 text-center max-w-[200px]">
                  Click on any medicine from the catalog or scan barcode to add items.
                </p>
              </div>
            ) : (
              cartItems.map((item) => {
                const itemTotal = item.unitPrice * item.quantity;
                return (
                  <div
                    key={`${item.productId}-${item.unitId}`}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-2 hover:border-slate-700/80 transition-all shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-slate-100 truncate">{item.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-400 font-mono">{item.sku || 'MED'}</span>
                          {item.requiresPrescription && (
                            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1 rounded">
                              Rx
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => handleRemoveItem(item.productId)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Price & Quantity Controls */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                      {/* Price per unit input */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice || ''}
                          onChange={(e) => handlePriceChange(item.productId, e.target.value)}
                          className="w-16 px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <span className="text-[10px] text-slate-500">/{item.unitName}</span>
                      </div>

                      {/* Stepper */}
                      <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                        <button
                          onClick={() => handleQtyChange(item.productId, -1)}
                          className="h-6 w-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold font-mono text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQtyChange(item.productId, 1)}
                          className="h-6 w-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="text-right">
                        <span className="text-sm font-bold text-emerald-400 font-mono">
                          ${itemTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Register Footer: Totals & Checkout Button */}
          <div className="p-4 border-t border-slate-800 bg-slate-900 space-y-3">
            {/* Subtotal & Discounts */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono text-slate-200">${rawSubtotal.toFixed(2)}</span>
              </div>

              {/* Discount Input */}
              <div className="flex items-center justify-between text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5 text-amber-400" />
                  <span>Discount</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent || ''}
                    onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                    placeholder="0"
                    className="w-12 px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-right text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span>%</span>
                  {discountAmount > 0 && (
                    <span className="text-amber-400 font-mono ml-1">(-${discountAmount.toFixed(2)})</span>
                  )}
                </div>
              </div>

              {/* Grand Total Bar */}
              <div className="pt-2 border-t border-slate-800 flex items-baseline justify-between">
                <div>
                  <span className="text-sm font-bold text-white uppercase tracking-wider">Total Due</span>
                  <div className="text-xs text-slate-500 font-mono">
                    {grandTotalKHR.toLocaleString()} ៛ KHR
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                    ${grandTotalUSD.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <button
              disabled={cartItems.length === 0}
              onClick={() => {
                setAmountPaid(grandTotalUSD.toFixed(2));
                setPaymentCurrency('USD');
                setShowPaymentModal(true);
              }}
              className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all ${
                cartItems.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20 active:scale-[0.99]'
              }`}
            >
              <Receipt className="h-5 w-5" />
              <span>COLLECT PAYMENT (${grandTotalUSD.toFixed(2)})</span>
            </button>
          </div>
        </aside>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. PAYMENT & CASH REGISTER MODAL                                   */}
      {/* ------------------------------------------------------------------ */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Complete Transaction</h3>
                  <p className="text-xs text-slate-400">Select payment method and enter received cash</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="h-8 w-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
              {/* Payment Methods */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setPaymentMethod('CASH')}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                      paymentMethod === 'CASH'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <DollarSign className="h-6 w-6" />
                    <span className="text-xs">Cash (សាច់ប្រាក់)</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('KHQR')}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                      paymentMethod === 'KHQR'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <QrCode className="h-6 w-6" />
                    <span className="text-xs">Bakong KHQR</span>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                      paymentMethod === 'CARD'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <CreditCard className="h-6 w-6" />
                    <span className="text-xs">Card (Visa/Master)</span>
                  </button>
                </div>
              </div>

              {/* Total Due Display */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Total Amount Due</span>
                  <div className="text-sm font-mono text-slate-400">
                    {grandTotalKHR.toLocaleString()} ៛ KHR
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  ${grandTotalUSD.toFixed(2)}
                </div>
              </div>

              {/* Amount Received Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Amount Received
                  </label>
                  <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                    <button
                      onClick={() => {
                        setPaymentCurrency('USD');
                        setAmountPaid(grandTotalUSD.toFixed(2));
                      }}
                      className={`px-2.5 py-0.5 rounded text-xs font-bold transition-all ${
                        paymentCurrency === 'USD' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                      }`}
                    >
                      USD ($)
                    </button>
                    <button
                      onClick={() => {
                        setPaymentCurrency('KHR');
                        setAmountPaid(grandTotalKHR.toString());
                      }}
                      className={`px-2.5 py-0.5 rounded text-xs font-bold transition-all ${
                        paymentCurrency === 'KHR' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                      }`}
                    >
                      KHR (៛)
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-500 font-mono">
                    {paymentCurrency === 'USD' ? '$' : '៛'}
                  </span>
                  <input
                    type="number"
                    step={paymentCurrency === 'USD' ? '0.01' : '100'}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="w-full pl-10 pr-24 py-3.5 rounded-2xl bg-slate-950 border border-slate-700 text-2xl font-black font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={setExactCash}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 border border-slate-700 transition-colors"
                  >
                    EXACT
                  </button>
                </div>

                {/* Cash Presets */}
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {paymentCurrency === 'USD' ? (
                    <>
                      {[5, 10, 20, 50, 100].map((val) => (
                        <button
                          key={val}
                          onClick={() => addPresetCash(val)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold font-mono text-slate-200 border border-slate-700 transition-colors"
                        >
                          +${val}
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      {[10000, 20000, 40000, 50000, 100000].map((val) => (
                        <button
                          key={val}
                          onClick={() => addPresetKHR(val)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold font-mono text-slate-200 border border-slate-700 transition-colors"
                        >
                          +{(val / 1000).toFixed(0)}k ៛
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Change Return Calculation */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                  isPaymentValid
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                }`}
              >
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider block">
                    {isPaymentValid ? 'Change Return (ប្រាក់អាប់)' : 'Insufficient Amount (ខ្វះ)'}
                  </span>
                  <div className="text-sm font-mono opacity-80 mt-0.5">
                    {changeAmountKHR.toLocaleString()} ៛ KHR
                  </div>
                </div>
                <div className="text-2xl font-black font-mono">
                  ${changeAmountUSD.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-5 border-t border-slate-800 bg-slate-900/60 flex items-center gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors border border-slate-700"
              >
                Back to Cart
              </button>

              <button
                disabled={!isPaymentValid || checkingOut}
                onClick={handleCompleteCheckout}
                className={`flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                  !isPaymentValid || checkingOut
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20 active:scale-[0.99]'
                }`}
              >
                {checkingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing Sale...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm & Print Receipt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 4. SUCCESS RECEIPT MODAL                                           */}
      {/* ------------------------------------------------------------------ */}
      {lastOrderSuccess && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 flex flex-col items-center text-center animate-in zoom-in-95">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <h3 className="text-xl font-bold text-white mb-1">Sale Completed!</h3>
            <p className="text-xs text-slate-400 mb-4">
              Invoice #{lastOrderSuccess.invoiceNumber || lastOrderSuccess.id}
            </p>

            <div className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2 mb-6 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Total Amount:</span>
                <span className="text-emerald-400 font-bold">
                  ${(lastOrderSuccess.totalAmount || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Date & Time:</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Status:</span>
                <span className="text-emerald-400 uppercase font-semibold">PAID</span>
              </div>
            </div>

            <div className="w-full flex gap-3">
              <button
                onClick={() => setLastOrderSuccess(null)}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all"
              >
                New Sale (បន្ទាប់)
              </button>
              <button
                onClick={() => router.push('/orders')}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all border border-slate-700"
              >
                View Orders
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
