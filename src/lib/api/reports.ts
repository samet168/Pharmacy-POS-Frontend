import { apiClient } from './client';

export interface SalesReportRequest {
  organizationId: number;
  branchId?: number;
  from?: string; // ISO format date (YYYY-MM-DD)
  to?: string;
}

export interface ProductReportRequest {
  organizationId: number;
  branchId?: number;
  from?: string;
  to?: string;
}

export interface CustomerReportRequest {
  organizationId: number;
  branchId?: number;
  from?: string;
  to?: string;
}

export interface PurchaseReportRequest {
  organizationId: number;
  branchId?: number;
  from?: string;
  to?: string;
}

export interface InventoryReportRequest {
  organizationId: number;
  branchId?: number;
}

export interface PaymentMethodBreakdown {
  paymentMethod: string;
  amount: number;
  count: number;
  percentage?: number;
}

export interface DailySales {
  date: string;
  revenue: number;
  orders: number;
  customers?: number;
}

export interface BranchSales {
  branchId: number;
  branchName: string;
  revenue: number;
  orders: number;
}

export interface ProductSales {
  productId: number;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface SalesReportResponse {
  totalSales?: number;
  totalRevenue: number;
  totalDiscount?: number;
  totalTax?: number;
  netSales?: number;
  averageOrderValue: number;
  totalOrders: number;
  refundedOrders?: number;
  paymentMethodBreakdown?: PaymentMethodBreakdown[];
  dailySales?: DailySales[];
  branchSales?: BranchSales[];
  topProducts?: ProductSales[];
}

export interface TopSellingProduct {
  productId: number;
  productName: string;
  sku: string;
  quantitySold: number;
  revenue: number;
  profit: number;
}

export interface LowStockProduct {
  productId: number;
  productName: string;
  sku: string;
  currentStock: number;
  minimumStock: number;
  reorderLevel: number;
}

export interface ExpiringProduct {
  productId: number;
  productName: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  daysUntilExpiry: number;
}

export interface ProductReportResponse {
  totalProducts?: number;
  activeProducts?: number;
  inactiveProducts?: number;
  lowStockProducts?: number;
  outOfStockProducts?: number;
  nearExpiryProducts?: number;
  expiredProducts?: number;
  topSellingProducts?: TopSellingProduct[];
  lowStockProductsList?: LowStockProduct[];
  expiringProductsList?: ExpiringProduct[];
}

export interface TopCustomer {
  customerId: number;
  customerName: string;
  phone: string;
  totalSpending: number;
  orderCount: number;
  averageOrderValue: number;
}

export interface CustomerSpendingByPeriod {
  period: string;
  customerCount: number;
  totalSpending: number;
}

export interface CustomerReportResponse {
  totalCustomers?: number;
  newCustomers?: number;
  returningCustomers?: number;
  totalSpending?: number;
  averageSpending?: number;
  topCustomers?: TopCustomer[];
  spendingByPeriod?: CustomerSpendingByPeriod[];
}

export interface SupplierPurchase {
  supplierId: number;
  supplierName: string;
  totalValue: number;
  orderCount: number;
}

export interface PurchaseByStatus {
  status: string;
  count: number;
  value: number;
}

export interface PurchaseReportResponse {
  totalPurchaseOrders?: number;
  totalPurchaseValue?: number;
  receivedValue?: number;
  outstandingValue?: number;
  pendingOrders?: number;
  completedOrders?: number;
  cancelledOrders?: number;
  supplierPurchases?: SupplierPurchase[];
  purchasesByStatus?: PurchaseByStatus[];
}

export interface BranchStock {
  branchId: number;
  branchName: string;
  stockValue: number;
  totalProducts: number;
  lowStockCount: number;
}

export interface CategoryStock {
  categoryId: number;
  categoryName: string;
  stockValue: number;
  productCount: number;
}

export interface StockMovementSummary {
  movementType: string;
  count: number;
  quantity: number;
}

export interface InventoryReportResponse {
  totalStockValue?: number;
  totalStockQuantity?: number;
  lowStockCount?: number;
  outOfStockCount?: number;
  expiringCount?: number;
  expiredCount?: number;
  branchStocks?: BranchStock[];
  categoryStocks?: CategoryStock[];
  stockMovementSummary?: StockMovementSummary[];
}

export const reportsApi = {
  getSalesReport: async (params: SalesReportRequest) => {
    return apiClient.get<SalesReportResponse>('/reports/sales', params as any);
  },
  getProductReport: async (params: ProductReportRequest) => {
    return apiClient.get<ProductReportResponse>('/reports/products', params as any);
  },
  getCustomerReport: async (params: CustomerReportRequest) => {
    return apiClient.get<CustomerReportResponse>('/reports/customers', params as any);
  },
  getPurchaseReport: async (params: PurchaseReportRequest) => {
    return apiClient.get<PurchaseReportResponse>('/reports/purchases', params as any);
  },
  getInventoryReport: async (params: InventoryReportRequest) => {
    return apiClient.get<InventoryReportResponse>('/reports/inventory', params as any);
  }
};
