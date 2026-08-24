'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { authApi } from '@/lib/api/auth';
import { productsApi, type Product } from '@/lib/api/products';
import { ordersApi, type CheckoutRequest, type CheckoutItem, type CheckoutPayment } from '@/lib/api/orders';
import { productUnitsApi, type ProductUnit } from '@/lib/api/productUnits';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SafeImage } from '@/components/ui/SafeImage';
import {
  Search,
  ShoppingCart,
  LogOut,
  Plus,
  Minus,
  Trash2,
  Package,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CartItem {
  productId: number;
  name: string;
  unitId: number;
  unitName: string;
  unitPrice: number;
  quantity: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SellPage() {
  const router = useRouter();
  const { user, logout, branchIds } = useAuthStore();
  const branchId = branchIds?.[0] ?? 1;
  const orgId = user?.organizationId ?? 1;

  const getCleanImageUrl = (url?: string): string | null => {
    if (!url) return null;
    // Fix Cloudinary URL by replacing /raw/upload/ with /image/upload/
    return url.replace('/raw/upload/', '/image/upload/');
  };

  // Product search state
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [units, setUnits] = useState<ProductUnit[]>([]);

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to load cart:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Checkout state
  const [checkingOut, setCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'KHQR' | 'CARD'>('CASH');
  const [amountPaid, setAmountPaid] = useState('');
  const [showPayment, setShowPayment] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // Load initial products + units on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    loadInitialProducts();
    loadUnits();
  }, []);

  const loadInitialProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await productsApi.listAll(0, 50);
      const list = response?.content ?? [];
      setProducts(list.filter((p) => p.isActive));
    } catch (err) {
      console.error('Failed to load products:', err);
      toast.error('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadUnits = async () => {
    try {
      const data = await productUnitsApi.listAll();
      setUnits(Array.isArray(data) ? data : []);
    } catch {
      // Non-critical — units may be empty
    }
  };

  // ---------------------------------------------------------------------------
  // Search with debounce
  // ---------------------------------------------------------------------------
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!q.trim()) {
      loadInitialProducts();
      return;
    }

    searchTimeout.current = setTimeout(() => {
      searchProducts(q.trim());
    }, 350);
  };

  const searchProducts = async (query: string) => {
    setLoadingProducts(true);
    try {
      // Backend search: filter by brandName containing query
      const orgId = user?.organizationId ?? parseInt(localStorage.getItem('organizationId') ?? '1');
      const response = await productsApi.getByOrganization(orgId, 0, 100);
      const list = response?.content ?? [];
      const filtered = list.filter(
        (p) =>
          p.isActive &&
          (p.brandName?.toLowerCase().includes(query.toLowerCase()) ||
            p.sku?.toLowerCase().includes(query.toLowerCase()))
      );
      setProducts(filtered);
    } catch {
      toast.error('Search failed');
    } finally {
      setLoadingProducts(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Cart helpers
  // ---------------------------------------------------------------------------
  const getDefaultUnit = (productId: number): { unitId: number; unitName: string } => {
    const unit = units[0];
    return unit ? { unitId: unit.id, unitName: unit.name } : { unitId: 1, unitName: 'pcs' };
  };

  const handleAddToCart = (product: Product) => {
    const { unitId, unitName } = getDefaultUnit(product.id);
    setCartItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id && i.unitId === unitId);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id && i.unitId === unitId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.brandName,
          unitId,
          unitName,
          unitPrice: 0, // price from branch inventory — set to 0, cashier can adjust
          quantity: 1,
        },
      ];
    });
    toast.success(`${product.brandName} added to cart`);
  };

  const handleQtyChange = (productId: number, unitId: number, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((i) =>
          i.productId === productId && i.unitId === unitId
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const handleRemoveItem = (productId: number, unitId: number) => {
    setCartItems((prev) => prev.filter((i) => !(i.productId === productId && i.unitId === unitId)));
  };

  const handlePriceChange = (productId: number, unitId: number, price: string) => {
    const val = parseFloat(price) || 0;
    setCartItems((prev) =>
      prev.map((i) =>
        i.productId === productId && i.unitId === unitId ? { ...i, unitPrice: val } : i
      )
    );
  };

  const cartTotal = cartItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const handleLogout = async () => {
    await authApi.logout();
    logout();
    router.push('/login');
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const paid = parseFloat(amountPaid) || 0;
    if (paid < cartTotal) {
      toast.error('Amount paid is less than total');
      return;
    }

    if (!user) {
      toast.error('Not authenticated');
      router.push('/login');
      return;
    }

    setCheckingOut(true);
    try {
      const items: CheckoutItem[] = cartItems.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitId: i.unitId || 0,
        unitPrice: i.unitPrice,
      }));

      const payments: CheckoutPayment[] = [
        {
          orderId: 0,
          paymentMethod,
          amountPaid: paid,
          currency: 'USD',
          exchangeRateUsed: 1,
        },
      ];

      const request: CheckoutRequest = {
        organizationId: orgId,
        branchId,
        userId: user.userId,
        items,
        payments,
      };

      const result = await ordersApi.checkout(request);

      toast.success(`Order #${result.order.invoiceNumber ?? result.order.id} completed!`);
      setCartItems([]);
      setAmountPaid('');
      setShowPayment(false);
      setCartOpen(false);
      router.push('/orders');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Checkout failed. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 md:hidden">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900">Sell</h1>
          <button onClick={handleLogout} className="text-slate-600 hover:text-red-500 transition-colors">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="p-4 pb-36">
        {/* Search bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Product grid */}
        {loadingProducts ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400">
            <Package className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => handleAddToCart(product)}
                className="bg-white border border-slate-200 rounded-lg p-3 text-left hover:border-primary-400 hover:shadow-md transition-all active:scale-95"
              >
                <SafeImage
                  src={product.imageUrl}
                  alt={product.brandName}
                  className="w-full aspect-square object-cover rounded mb-2"
                  fallback={
                    <div className="w-full aspect-square bg-slate-100 rounded mb-2 flex items-center justify-center">
                      <Package className="h-8 w-8 text-slate-300" />
                    </div>
                  }
                />
                <h3 className="font-medium text-slate-900 text-sm leading-tight mb-1 line-clamp-2">
                  {product.brandName}
                </h3>
                {product.sku && (
                  <p className="text-xs text-slate-400 font-mono">{product.sku}</p>
                )}
                {product.requiresPrescription && (
                  <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-700 rounded px-1">
                    Rx
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Cart panel (slides up on mobile, fixed sidebar on lg)              */}
      {/* ------------------------------------------------------------------ */}

      {/* Cart toggle bar — mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <button
          onClick={() => setCartOpen((v) => !v)}
          className="w-full h-14 bg-primary-700 text-white flex items-center justify-between px-5 shadow-lg"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <span className="font-semibold">Cart ({cartCount})</span>
          </div>
          <span className="font-bold text-lg">${cartTotal.toFixed(2)}</span>
        </button>

        {/* Cart drawer */}
        {cartOpen && (
          <div className="bg-white border-t border-slate-200 max-h-[70vh] overflow-y-auto shadow-2xl">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Cart Items</h3>
                <button
                  onClick={() => setCartItems([])}
                  className="text-xs text-red-500 hover:underline"
                >
                  Clear all
                </button>
              </div>

              {cartItems.length === 0 ? (
                <div className="text-center text-slate-400 py-6">
                  <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Cart is empty</p>
                </div>
              ) : (
                <>
                  {cartItems.map((item) => (
                    <div
                      key={`${item.productId}-${item.unitId}`}
                      className="flex items-start gap-3 border-b border-slate-100 pb-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                        <p className="text-xs text-slate-400">{item.unitName}</p>
                        {/* Editable unit price */}
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-slate-500">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice || ''}
                            onChange={(e) =>
                              handlePriceChange(item.productId, item.unitId, e.target.value)
                            }
                            placeholder="0.00"
                            className="w-20 text-sm border border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                          <span className="text-xs text-slate-400">/ unit</span>
                        </div>
                      </div>

                      {/* Qty controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleQtyChange(item.productId, item.unitId, -1)}
                          className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => handleQtyChange(item.productId, item.unitId, 1)}
                          className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.productId, item.unitId)}
                          className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 ml-1 transition-colors"
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="flex justify-between font-bold text-slate-900 pt-1">
                    <span>Total</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>

                  {/* Payment section */}
                  {!showPayment ? (
                    <Button
                      className="w-full"
                      onClick={() => setShowPayment(true)}
                      disabled={cartItems.length === 0}
                    >
                      Proceed to Payment
                    </Button>
                  ) : (
                    <div className="space-y-3 border-t border-slate-100 pt-3">
                      {/* Payment method */}
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">
                          Payment Method
                        </label>
                        <div className="flex gap-2">
                          {(['CASH', 'KHQR', 'CARD'] as const).map((m) => (
                            <button
                              key={m}
                              onClick={() => setPaymentMethod(m)}
                              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                paymentMethod === m
                                  ? 'bg-primary-700 text-white border-primary-700'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Amount paid */}
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">
                          Amount Paid ($)
                        </label>
                        <input
                          type="number"
                          min={cartTotal}
                          step="0.01"
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(e.target.value)}
                          placeholder={cartTotal.toFixed(2)}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        {amountPaid && parseFloat(amountPaid) >= cartTotal && (
                          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Change: ${(parseFloat(amountPaid) - cartTotal).toFixed(2)}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setShowPayment(false)}
                        >
                          Back
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={handleCheckout}
                          loading={checkingOut}
                          disabled={!amountPaid || parseFloat(amountPaid) < cartTotal}
                        >
                          Confirm
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
