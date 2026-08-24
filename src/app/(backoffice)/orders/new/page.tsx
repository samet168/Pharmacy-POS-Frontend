'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { productsApi, type Product } from '@/lib/api/products';
import { customersApi, type Customer } from '@/lib/api/customers';
import { categoriesApi, type Category } from '@/lib/api/categories';
import { productBatchesApi, type ProductBatch } from '@/lib/api/productBatches';
import { ordersApi, type CheckoutRequest, type CheckoutItem, type CheckoutPayment } from '@/lib/api/orders';
import { productUnitsApi } from '@/lib/api/productUnits';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { SafeImage } from '@/components/ui/SafeImage';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Package,
  Loader2,
  User,
  Search,
  DollarSign,
  QrCode,
  Smartphone,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  X,
  Upload,
  Camera,
  Pill,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

interface CartItem {
  productId: number;
  product: Product;
  quantity: number;
  unitId: number;
  unitPrice: number;
  dosageInstruction?: string;
}

export default function NewOrderPage() {
  const router = useRouter();
  const { user, branchIds: storeBranchIds } = useAuthStore();
  const branchId = storeBranchIds?.[0] || 1;
  const orgId = user?.organizationId || 1;
  
  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [productBatches, setProductBatches] = useState<ProductBatch[]>([]);
  const [productBatchesLoading, setProductBatchesLoading] = useState(false);
  const [productsError, setProductsError] = useState(false);
  const [categoriesError, setCategoriesError] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const handleImageError = (productId: number) => {
    setImageErrors(prev => new Set(prev).add(productId));
  };
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showPrescriptionField, setShowPrescriptionField] = useState(false);
  const [prescriptionImage, setPrescriptionImage] = useState<File | null>(null);
  const [prescriptionPreview, setPrescriptionPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Order state - matching backend DTO structure
  const [formData, setFormData] = useState({
    shiftId: '',
    prescriptionUrl: '',
    paymentMethod: 'CASH' as 'CASH' | 'KHQR' | 'CARD' | 'WALLET',
    amountPaid: '',
    notes: '',
  });
  
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadProductBatches();
    loadCustomers();
  }, []);

  const loadProducts = async () => {
    setProductsLoading(true);
    setProductsError(false);
    try {
      const response = await productsApi.getByOrganization(orgId, 0, 50);
      const list = Array.isArray(response) ? response : (response?.content ?? []);
      // Show all products regardless of active status
      setProducts(list);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProductsError(true);
      toast.error('Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  };

  const loadCustomers = async () => {
    setCustomersLoading(true);
    try {
      const response = await customersApi.getByOrganization(orgId, 0, 100);
      const list = Array.isArray(response) ? response : (response?.content ?? []);
      setCustomers(list);
    } catch (error) {
      console.error('Failed to load customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setCustomersLoading(false);
    }
  };

  const loadCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError(false);
    try {
      const response = await categoriesApi.getByOrganization(orgId, 0, 100);
      const list = Array.isArray(response) ? response : (response?.content ?? []);
      setCategories(list.filter((c) => c.active));
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategoriesError(true);
      toast.error('Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadProductBatches = async () => {
    setProductBatchesLoading(true);
    try {
      const response = await productBatchesApi.getByBranch(branchId);
      setProductBatches(response);
    } catch (error) {
      console.error('Failed to load product batches:', error);
      // Don't show error toast as this is not critical
    } finally {
      setProductBatchesLoading(false);
    }
  };

  const filteredProducts = products.filter(product => 
    product.brandName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  ).filter(product => {
    if (selectedCategory === null) return true;
    return product.categoryId === selectedCategory;
  });

  const getProductStock = (productId: number): number => {
    // If product batches aren't loaded, assume product is in stock for demo purposes
    if (productBatches.length === 0) {
      return 10; // Default stock for demo when API fails
    }
    const batches = productBatches.filter(batch => batch.productId === productId);
    return batches.reduce((total, batch) => total + batch.quantityRemaining, 0);
  };

  const getProductCategoryName = (categoryId?: number): string => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Uncategorized';
  };

  const getCleanImageUrl = (url?: string): string | null => {
    if (!url) return null;
    // Fix Cloudinary URL by replacing /raw/upload/ with /image/upload/
    return url.replace('/raw/upload/', '/image/upload/');
  };

  const getProductPrice = (product: Product): number => {
    // Generate a mock price based on product ID for demonstration
    // In production, this would come from product pricing data or a separate prices API
    const basePrice = (product.id % 50) + 5; // Generate reasonable mock prices
    return parseFloat(basePrice.toFixed(2));
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: Product) => {
    const stock = getProductStock(product.id);
    const currentCartItem = cartItems.find(item => item.productId === product.id);
    const currentQuantity = currentCartItem?.quantity || 0;

    // Stock validation - skip if we don't have batch data (for development)
    if (productBatches.length > 0) {
      if (stock <= 0) {
        toast.error(`${product.brandName} is out of stock`);
        return;
      }

      if (currentQuantity >= stock) {
        toast.error(`Only ${stock} units available for ${product.brandName}`);
        return;
      }
    }

    if (currentCartItem) {
      setCartItems(cartItems.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      // Load product units for this product to get the correct unitId
      productUnitsApi.getByProduct(product.id).then((units) => {
        const baseUnit = Array.isArray(units) ? units.find((u: any) => u.isBaseUnit) || units[0] : null;
        const unitId = baseUnit?.id ?? null; // null = let backend resolve
        setCartItems(prev => [...prev, {
          productId: product.id,
          product,
          quantity: 1,
          unitId: unitId as unknown as number,
          unitPrice: getProductPrice(product),
          dosageInstruction: ''
        }]);
      }).catch(() => {
        // If unit load fails, add with null unitId — backend will fallback to base unit
        setCartItems(prev => [...prev, {
          productId: product.id,
          product,
          quantity: 1,
          unitId: null as unknown as number,
          unitPrice: getProductPrice(product),
          dosageInstruction: ''
        }]);
      });
    }
    toast.success(`${product.brandName} added to cart`);
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCartItems(cartItems.map(item => {
      if (item.productId === productId) {
        const stock = getProductStock(productId);
        const newQuantity = Math.max(1, item.quantity + delta);

        // Stock validation - skip if we don't have batch data (for development)
        if (productBatches.length > 0 && newQuantity > stock) {
          toast.error(`Only ${stock} units available`);
          return item; // Don't update if exceeds stock
        }

        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  // Price is now auto-set from product data, no manual update needed

  const updateDosageInstruction = (productId: number, instruction: string) => {
    setCartItems(cartItems.map(item => 
      item.productId === productId 
        ? { ...item, dosageInstruction: instruction }
        : item
    ));
  };

  const removeFromCart = (productId: number) => {
    setCartItems(cartItems.filter(item => item.productId !== productId));
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDropdown(false);
    setSearchQuery('');
  };

  const handleQuickCash = (amount: number) => {
    setFormData({ ...formData, amountPaid: amount.toString() });
  };

  const handleExactAmount = () => {
    setFormData({ ...formData, amountPaid: grandTotal.toFixed(2) });
  };

  // Prescription Image Upload Functions
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size must be less than 5MB');
      return;
    }

    setPrescriptionImage(file);
    setPrescriptionPreview(URL.createObjectURL(file));
    
    // For now, we'll use a placeholder URL since we don't have actual file upload
    // In production, this would upload to Cloudinary or your server
    setFormData({ ...formData, prescriptionUrl: `prescription-${Date.now()}.jpg` });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemovePrescription = () => {
    setPrescriptionImage(null);
    setPrescriptionPreview('');
    setFormData({ ...formData, prescriptionUrl: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== null;

  // Calculations - simple POS workflow
  const subtotal = cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const discountAmount = 0; // No e-commerce discount
  const taxAmount = 0; // No tax calculation
  const grandTotal = subtotal - discountAmount + taxAmount;
  const paidAmount = formData.amountPaid ? parseFloat(formData.amountPaid) : 0;
  const changeAmount = paidAmount - grandTotal;
  const isAmountSufficient = paidAmount >= grandTotal;

  const getSubmitDisabledReason = (): string | null => {
    if (processing) return 'Processing order...';
    if (cartItems.length === 0) return 'Cart is empty — add items to complete order';
    if (!formData.amountPaid || formData.amountPaid === '') return 'Enter the amount paid above';
    if (Number(formData.amountPaid) < Number(grandTotal))
      return `Insufficient payment — need at least $${grandTotal.toFixed(2)}`;
    return null;
  };

  const handleCheckout = async () => {
    // Log validation state for debugging
    console.log('Checkout validation:', {
      cartItemsLength: cartItems.length,
      amountPaid: formData.amountPaid,
      paidAmount: Number(formData.amountPaid),
      grandTotal: Number(grandTotal),
      isAmountSufficient: Number(formData.amountPaid) >= Number(grandTotal),
      customerId: selectedCustomer?.id || 1
    });

    if (cartItems.length === 0) {
      toast.error('Cart is empty - please add items to complete order');
      return;
    }

    if (!formData.amountPaid) {
      toast.error('Please enter amount paid');
      return;
    }

    if (Number(formData.amountPaid) < Number(grandTotal)) {
      toast.error(`Insufficient payment. Please pay at least $${grandTotal.toFixed(2)}`);
      return;
    }

    if (!user) {
      toast.error('Not authenticated');
      router.push('/login');
      return;
    }



    setProcessing(true);
    try {

      // Generate unique identifiers
      const clientUuid = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const invoiceNumber = `INV-${branchId}-${Date.now()}`;

      const items: CheckoutItem[] = cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitId: item.unitId || 0, // 0 = let backend resolve base unit
        unitPrice: item.unitPrice,
        dosageInstruction: item.dosageInstruction,
      }));

      const payments: CheckoutPayment[] = [
        {
          orderId: 0, // server sets this
          paymentMethod: formData.paymentMethod,
          amountPaid: paidAmount,
          currency: 'USD',
        },
      ];

      const request: CheckoutRequest = {
        organizationId: orgId,
        branchId,
        deviceId: 1, // Default device
        userId: user?.userId || 1,
        customerId: selectedCustomer?.id || 1, // Default to walk-in customer ID = 1 if none selected
        shiftId: formData.shiftId ? parseInt(formData.shiftId) : undefined,
        prescriptionId: undefined, // Let backend handle prescription validation
        prescriptionUrl: formData.prescriptionUrl,
        items,
        payments,
        invoiceNumber,
        clientUuid,
      };

      const result = await ordersApi.checkout(request);
      toast.success(`Order #${result.order.invoiceNumber ?? result.order.id} completed!`);
      
      // Clear cart and redirect
      setCartItems([]);
      setSelectedCustomer(null);
      setPrescriptionImage(null);
      setPrescriptionPreview('');
      setFormData({
        shiftId: '',
        prescriptionUrl: '',
        paymentMethod: 'CASH',
        amountPaid: '',
        notes: '',
      });
      
      router.push('/orders');
    } catch (error: any) {
      console.error('Checkout failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Checkout failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            New Order
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 ml-11">Create a new pharmacy order</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Cart */}
          <div className="lg:col-span-8">
            <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm">
              {/* Product Search & Category Filter */}
              <div className="mb-6 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search products by name, SKU, or barcode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                      selectedCategory === null
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Package className="h-4 w-4" />
                    All Products
                  </button>
                  {categoriesLoading ? (
                    <div className="flex items-center gap-2 px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      <span className="text-sm text-slate-400">Loading...</span>
                    </div>
                  ) : categoriesError ? (
                    <button
                      onClick={loadCategories}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                    >
                      <AlertCircle className="h-4 w-4" />
                      Retry Categories
                    </button>
                  ) : categories.length === 0 ? (
                    <span className="text-sm text-slate-400">No categories available</span>
                  ) : (
                    categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                          selectedCategory === category.id
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Pill className="h-4 w-4" />
                        {category.name}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Products Grid */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Available Products
                    <span className="text-xs text-slate-400 font-normal">({filteredProducts.length})</span>
                  </h3>
                  {productsError && (
                    <button
                      onClick={loadProducts}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium flex items-center gap-1"
                    >
                      <Loader2 className="h-3 w-3" />
                      Retry
                    </button>
                  )}
                </div>
                
                {productsLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 animate-pulse">
                        <div className="w-full aspect-square bg-slate-200 dark:bg-slate-700 rounded-lg mb-3"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                ) : productsError ? (
                  <div className="text-center py-12 bg-red-50 dark:bg-red-950/30 rounded-xl border-2 border-dashed border-red-200 dark:border-red-800">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-500" />
                    <p className="text-red-600 dark:text-red-400 font-medium">Failed to load products</p>
                    <button
                      onClick={loadProducts}
                      className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <Package className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No products found</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Try adjusting your search or category filter</p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="mt-3 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm font-medium"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map((product) => {
                      const stock = getProductStock(product.id);
                      const cartQuantity = cartItems.find(item => item.productId === product.id)?.quantity || 0;
                      // Only mark as out of stock if we have batch data and stock is truly 0
                      const isOutOfStock = productBatches.length > 0 && stock <= 0;
                      const categoryName = getProductCategoryName(product.categoryId);
                      
                      return (
                        <button
                          key={product.id}
                          onClick={() => !isOutOfStock && addToCart(product)}
                          disabled={isOutOfStock}
                          className={`group bg-white dark:bg-slate-800 border-2 rounded-xl p-4 text-left transition-all active:scale-95 relative overflow-hidden ${
                            isOutOfStock
                              ? 'border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed'
                              : 'border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer'
                          }`}
                        >
                          {/* Cart Quantity Badge */}
                          {cartQuantity > 0 && (
                            <div className="absolute top-2 left-2 bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md z-10 flex items-center gap-1">
                              <ShoppingCart className="h-3 w-3" />
                              {cartQuantity}
                            </div>
                          )}

                          {/* Stock Status Badge */}
                          <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full z-10 ${
                            productBatches.length === 0
                              ? 'bg-blue-500 text-white'
                              : isOutOfStock
                              ? 'bg-red-500 text-white'
                              : stock <= 5
                              ? 'bg-amber-500 text-white'
                              : 'bg-emerald-500 text-white'
                          }`}>
                            {productBatches.length === 0
                              ? 'Stock: N/A'
                              : isOutOfStock
                              ? 'Out of Stock'
                              : `Stock: ${stock}`}
                          </div>

                          {/* Product Image */}
                          <div className="w-full aspect-square bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                            <SafeImage
                              src={product.imageUrl}
                              alt={product.brandName}
                              className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                              fallback={<Package className="h-10 w-10 text-slate-300 dark:text-slate-600" />}
                            />
                            {product.requiresPrescription && (
                              <div className="absolute bottom-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                Rx
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="space-y-1">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {product.brandName}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {categoryName}
                            </p>
                            <div className="flex items-center justify-between">
                              {product.sku && (
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{product.sku}</p>
                              )}
                              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                ${getProductPrice(product).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cart Items */}
              {cartItems.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Cart Items ({cartItems.length})
                  </h3>
                  {cartItems.map((item) => (
                    <div key={item.productId} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-emerald-500/50 transition-colors">
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                          <SafeImage
                            src={item.product.imageUrl}
                            alt={item.product.brandName}
                            className="w-full h-full object-cover rounded-lg"
                            fallback={<Package className="h-8 w-8 text-slate-300 dark:text-slate-600" />}
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1">
                                {item.product.brandName}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                SKU: {item.product.sku || 'N/A'}
                              </p>
                              {item.product.requiresPrescription && (
                                <span className="inline-flex items-center text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded px-2 py-0.5">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Rx Required
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          
                          {/* Dosage Instruction */}
                          <div className="mt-3">
                            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                              Dosage Instruction
                            </label>
                            <input
                              type="text"
                              value={item.dosageInstruction || ''}
                              onChange={(e) => updateDosageInstruction(item.productId, e.target.value)}
                              className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                              placeholder="Enter dosage instruction..."
                            />
                          </div>
                        </div>

                        {/* Quantity and Price Controls */}
                        <div className="flex flex-col items-end gap-3">
                          {/* Quantity Controller */}
                          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
                            <button
                              onClick={() => updateQuantity(item.productId, -1)}
                              className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-10 text-center font-semibold text-slate-900 dark:text-slate-100">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, 1)}
                              className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Price Display */}
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-slate-500 font-medium">$</span>
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {item.unitPrice.toFixed(2)}
                            </span>
                          </div>

                          {/* Subtotal */}
                          <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            ${(item.unitPrice * item.quantity).toFixed(2)}
                          </div>

                          {/* Stock Warning */}
                          {getProductStock(item.productId) <= 5 && getProductStock(item.productId) > 0 && (
                            <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Low stock
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cartItems.length === 0 && (
                <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <ShoppingCart className="h-20 w-20 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Your cart is empty</h3>
                  <p className="text-slate-500 dark:text-slate-400">Add products from the selection above to get started</p>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-4 space-y-4">
            {/* Customer Information */}
            <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Customer Information
              </h3>
              
              {/* Customer Selector */}
              <div className="mb-4">
                <label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">Customer</label>
                <div className="relative">
                  <button
                    onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                    className="w-full flex items-center justify-between px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-left bg-white dark:bg-slate-800 hover:border-emerald-500 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        selectedCustomer 
                          ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                          : 'bg-slate-100 dark:bg-slate-700'
                      }`}>
                        <User className={`h-4 w-4 ${
                          selectedCustomer 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-slate-500'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {selectedCustomer?.name || 'Walk-in Customer'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {selectedCustomer?.phone || 'No customer assigned'}
                        </p>
                      </div>
                    </div>
                    {showCustomerDropdown ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                  
                  {showCustomerDropdown && (
                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                      <div className="p-2">
                        <input
                          type="text"
                          placeholder="Search customers..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="p-2">
                        <button
                          onClick={() => {
                            setSelectedCustomer(null);
                            setShowCustomerDropdown(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                            <User className="h-4 w-4 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">Walk-in Customer</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">No customer assigned</p>
                          </div>
                        </button>
                        {filteredCustomers.map((customer) => (
                          <button
                            key={customer.id}
                            onClick={() => selectCustomer(customer)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                              <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">{customer.name}</p>
                              {customer.phone && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">{customer.phone}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Shift Badge */}
              {formData.shiftId && (
                <div className="mb-4">
                  <label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">Current Shift</label>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium">
                    <Calendar className="h-4 w-4" />
                    Shift #{formData.shiftId}
                  </div>
                </div>
              )}

              {/* Prescription Toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPrescriptionField}
                    onChange={(e) => setShowPrescriptionField(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Include Prescription Photo (Optional)
                  </span>
                </label>
                
                {showPrescriptionField && (
                  <div className="mt-4">
                    {prescriptionPreview ? (
                      // Image Preview with Remove Option
                      <div className="relative">
                        <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-emerald-500">
                          <img
                            src={prescriptionPreview}
                            alt="Prescription preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={handleRemovePrescription}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                          Prescription image ready for upload
                        </p>
                      </div>
                    ) : (
                      // Drag & Drop Upload Area
                      <div
                        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                          dragActive
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                            : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <input
                          type="file"
                          id="prescription-upload"
                          className="hidden"
                          accept="image/*"
                          capture="environment"
                          onChange={handleInputChange}
                        />
                        <label
                          htmlFor="prescription-upload"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                            <Upload className="h-8 w-8 text-slate-400" />
                          </div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Upload Prescription Photo
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            Drag & drop or click to select
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                            <Camera className="h-3 w-3" />
                            <span>Supports camera capture</span>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Order Summary */}
            <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Order Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Subtotal ({cartItems.length} items)</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Discount</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">-${discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Tax</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-slate-100">Grand Total</span>
                    <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      ${grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method Grid */}
              <div className="space-y-3">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Payment Method</span>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { method: 'CASH' as const, icon: DollarSign, label: 'Cash' },
                    { method: 'KHQR' as const, icon: QrCode, label: 'KHQR' },
                    { method: 'CARD' as const, icon: CreditCard, label: 'Card' },
                    { method: 'WALLET' as const, icon: Smartphone, label: 'Wallet' },
                  ].map(({ method, icon: Icon, label }) => (
                    <button
                      key={method}
                      onClick={() => setFormData({ ...formData, paymentMethod: method })}
                      className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl transition-all ${
                        formData.paymentMethod === method
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-md'
                          : 'border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className={`h-6 w-6 ${
                        formData.paymentMethod === method 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-slate-500 dark:text-slate-400'
                      }`} />
                      <span className={`text-sm font-medium ${
                        formData.paymentMethod === method 
                          ? 'text-emerald-700 dark:text-emerald-300' 
                          : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Paid */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 block">
                  Amount Paid
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-lg">$</span>
                  <input
                    type="number"
                    min={grandTotal}
                    step="0.01"
                    value={formData.amountPaid}
                    onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                    placeholder={grandTotal.toFixed(2)}
                    className="w-full pl-10 pr-4 py-4 text-2xl font-bold border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
                
                {/* Quick Cash Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 20, 50].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleQuickCash(amount)}
                      className="py-2 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                    >
                      +${amount}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleExactAmount}
                  className="w-full py-2 text-sm font-medium rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                >
                  Exact Amount (${grandTotal.toFixed(2)})
                </button>
              </div>

              {/* Change Display */}
              {formData.amountPaid && (
                <div className={`p-4 rounded-xl border-2 ${
                  isAmountSufficient
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500'
                    : 'bg-red-50 dark:bg-red-950/30 border-red-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isAmountSufficient ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {isAmountSufficient ? 'Change Return' : 'Insufficient Amount'}
                      </span>
                    </div>
                    <span className={`text-2xl font-bold ${
                      isAmountSufficient 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      ${Math.abs(changeAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any additional notes..."
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                  rows={2}
                />
              </div>

              {/* Checkout Button */}
              {(() => {
                const reason = getSubmitDisabledReason();
                const isDisabled = !!reason;
                return (
                  <>
                    <Button
                      className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all text-lg ${
                        isDisabled
                          ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-60'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20'
                      }`}
                      onClick={() => {
                        if (isDisabled) {
                          // Show exact reason as toast so cashier knows what's blocking
                          toast.warning(reason!);
                          console.log('Submit disabled reason:', {
                            cartEmpty: cartItems.length === 0,
                            amountPaid: formData.amountPaid,
                            grandTotal,
                            reason,
                          });
                          return;
                        }
                        handleCheckout();
                      }}
                      loading={processing}
                      disabled={false} // Always clickable — validation feedback via toast
                    >
                      {processing ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          COMPLETE ORDER
                        </>
                      )}
                    </Button>

                    {/* Inline warning under button so cashier always sees why */}
                    {reason && !processing && (
                      <div className="flex items-center justify-center gap-1.5 mt-2 text-sm text-amber-600 dark:text-amber-400">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{reason}</span>
                      </div>
                    )}
                  </>
                );
              })()}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}