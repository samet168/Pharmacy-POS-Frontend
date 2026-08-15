import { apiClient } from './client';
import { PageResponse } from '@/types/api';

// Matches backend ProductResponse exactly
export interface Product {
  id: number;
  organizationId: number;
  sku: string;
  brandName: string;          // backend field name
  genericNameId?: number;
  categoryId?: number;
  defaultSupplierId?: number;
  requiresPrescription: boolean;
  isControlledSubstance: boolean;
  imageUrl?: string;
  minStockAlert: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRequest {
  organizationId: number;
  categoryId?: number;
  defaultSupplierId?: number;
  brandName: string;
  sku?: string;
  requiresPrescription?: boolean;
  isControlledSubstance?: boolean;
  minStockAlert?: number;
  imageUrl?: string;
}

export type ProductResponse = Product;

export const productsApi = {
  /** GET /products — returns paginated list */
  listAll: async (page = 0, size = 100) => {
    return apiClient.get<PageResponse<ProductResponse>>('/products', { page, size });
  },

  /** GET /products/organization/:id — returns paginated list */
  getByOrganization: async (organizationId: number, page = 0, size = 100) => {
    return apiClient.get<PageResponse<ProductResponse>>(
      `/products/organization/${organizationId}`,
      { page, size }
    );
  },

  getById: async (id: number) => {
    return apiClient.get<ProductResponse>(`/products/${id}`);
  },

  /** POST /products — multipart form data required by backend */
  create: async (data: ProductRequest, imageFile?: File) => {
    const form = new FormData();
    form.append('product', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (imageFile) form.append('file', imageFile);
    return apiClient.upload<ProductResponse>('/products', form);
  },

  /** PUT /products/:id — multipart form data required by backend */
  update: async (id: number, data: ProductRequest, imageFile?: File) => {
    const form = new FormData();
    form.append('product', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (imageFile) form.append('file', imageFile);
    return apiClient.upload<ProductResponse>(`/products/${id}`, form, 'PUT');
  },

  delete: async (id: number) => {
    await apiClient.delete(`/products/${id}`);
  },
};
