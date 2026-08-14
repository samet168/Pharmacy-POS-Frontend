import { apiClient } from './client';

export interface Product {
  id: number;
  organizationId: number;
  categoryId?: number;
  defaultSupplierId?: number;
  name: string;
  nameKh?: string;
  genericName?: string;
  barcode?: string;
  description?: string;
  costPrice: number;
  sellingPrice: number;
  controlledSubstance: boolean;
  active: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRequest {
  organizationId: number;
  categoryId?: number;
  defaultSupplierId?: number;
  name: string;
  nameKh?: string;
  genericName?: string;
  barcode?: string;
  description?: string;
  costPrice: number;
  sellingPrice: number;
  controlledSubstance: boolean;
  active: boolean;
  imageUrl?: string;
}

export interface ProductResponse extends Product {}

export const productsApi = {
  listAll: async () => {
    return apiClient.get<ProductResponse[]>('/products');
  },

  getByOrganization: async (organizationId: number) => {
    return apiClient.get<ProductResponse[]>(`/products/organization/${organizationId}`);
  },

  getById: async (id: number) => {
    return apiClient.get<ProductResponse>(`/products/${id}`);
  },

  create: async (data: ProductRequest) => {
    return apiClient.post<ProductResponse>('/products', data);
  },

  update: async (id: number, data: ProductRequest) => {
    return apiClient.put<ProductResponse>(`/products/${id}`, data);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/products/${id}`);
  },
};