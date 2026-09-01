import { apiClient } from './client';

// Dashboard API types based on backend response
export interface DashboardOverview {
  totalProducts: number;
  totalCustomers: number;
  totalDoctors: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalPurchases: number;
  pendingOrders: number;
  lowStockProducts: number;
  todayOrders: number;
  todayRevenue: number;
}

export interface DashboardSales {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  dailySales: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
}

export interface DashboardProducts {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  topSellingProducts: Array<{
    productId: number;
    productName: string;
    quantitySold: number;
    revenue: number;
  }>;
}

export interface DashboardCustomers {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  customersByPeriod: Array<{
    period: string;
    count: number;
  }>;
}

export interface DashboardOrders {
  totalOrders: number;
  pending: number;
  completed: number;
  cancelled: number;
  returned: number;
  todayOrders: number;
}

export interface DashboardLowStock {
  lowStockProducts: Array<{
    productId: number;
    productName: string;
    currentStock: number;
    minimumStock: number;
  }>;
}

export interface DashboardTopProducts {
  topSellingProducts: Array<{
    productId: number;
    productName: string;
    quantitySold: number;
    revenue: number;
  }>;
}

export interface DashboardRecentOrders {
  recentOrders: Array<{
    orderId: number;
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
}

export interface DashboardBranches {
  branchStatistics: Array<{
    branchId: number;
    branchName: string;
    orders: number;
    revenue: number;
    products: number;
    customers: number;
    lowStock: number;
  }>;
}

export const dashboardApi = {
  getOverview: async (branchId?: number, organizationId?: number): Promise<DashboardOverview> => {
    const params: any = {};
    if (branchId) params.branchId = branchId;
    if (organizationId) params.organizationId = organizationId;
    return apiClient.get<DashboardOverview>('/dashboard/overview', params);
  },

  getSales: async (from?: string, to?: string, branchId?: number, organizationId?: number): Promise<DashboardSales> => {
    const params: any = {};
    if (from && to) { params.from = from; params.to = to; }
    if (branchId) params.branchId = branchId;
    if (organizationId) params.organizationId = organizationId;
    return apiClient.get<DashboardSales>('/dashboard/sales', params);
  },

  getProducts: async (branchId?: number, organizationId?: number): Promise<DashboardProducts> => {
    const params: any = {};
    if (branchId) params.branchId = branchId;
    if (organizationId) params.organizationId = organizationId;
    return apiClient.get<DashboardProducts>('/dashboard/products', params);
  },

  getCustomers: async (branchId?: number, organizationId?: number): Promise<DashboardCustomers> => {
    const params: any = {};
    if (branchId) params.branchId = branchId;
    if (organizationId) params.organizationId = organizationId;
    return apiClient.get<DashboardCustomers>('/dashboard/customers', params);
  },

  getOrders: async (branchId?: number, organizationId?: number): Promise<DashboardOrders> => {
    const params: any = {};
    if (branchId) params.branchId = branchId;
    if (organizationId) params.organizationId = organizationId;
    return apiClient.get<DashboardOrders>('/dashboard/orders', params);
  },

  getLowStock: async (branchId?: number, organizationId?: number): Promise<DashboardLowStock> => {
    const params: any = {};
    if (branchId) params.branchId = branchId;
    if (organizationId) params.organizationId = organizationId;
    return apiClient.get<DashboardLowStock>('/dashboard/low-stock', params);
  },

  getTopProducts: async (limit?: number, branchId?: number, organizationId?: number): Promise<DashboardTopProducts> => {
    const params: any = {};
    if (limit) params.limit = limit;
    if (branchId) params.branchId = branchId;
    if (organizationId) params.organizationId = organizationId;
    return apiClient.get<DashboardTopProducts>('/dashboard/top-products', params);
  },

  getRecentOrders: async (limit?: number, branchId?: number, organizationId?: number): Promise<DashboardRecentOrders> => {
    const params: any = {};
    if (limit) params.limit = limit;
    if (branchId) params.branchId = branchId;
    if (organizationId) params.organizationId = organizationId;
    return apiClient.get<DashboardRecentOrders>('/dashboard/recent-orders', params);
  },

  getBranches: async (organizationId?: number): Promise<DashboardBranches> => {
    const params = organizationId ? { organizationId } : undefined;
    return apiClient.get<DashboardBranches>('/dashboard/branches', params);
  },
};