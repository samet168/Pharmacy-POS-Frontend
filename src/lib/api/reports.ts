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

// These are simplified response types. We will adjust based on actual data
export interface SalesReportResponse {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  paymentMethods: any[];
  dailySales: any[];
}

export const reportsApi = {
  getSalesReport: async (params: SalesReportRequest) => {
    return apiClient.get<SalesReportResponse>('/reports/sales', params as any);
  },
  getProductReport: async (params: ProductReportRequest) => {
    return apiClient.get<any>('/reports/products', params as any);
  },
  getCustomerReport: async (params: CustomerReportRequest) => {
    return apiClient.get<any>('/reports/customers', params as any);
  },
  getPurchaseReport: async (params: PurchaseReportRequest) => {
    return apiClient.get<any>('/reports/purchases', params as any);
  },
  getInventoryReport: async (params: InventoryReportRequest) => {
    return apiClient.get<any>('/reports/inventory', params as any);
  }
};
