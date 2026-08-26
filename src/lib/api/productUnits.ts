import { apiClient } from './client';

export interface ProductUnit {
  id: number;
  organizationId: number;
  name: string;
  nameKh?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductUnitRequest {
  organizationId: number;
  name: string;
  nameKh?: string;
}

export type ProductUnitResponse = ProductUnit ;

export interface UnitConversion {
  id: number;
  productId: number;
  baseUnitId: number;
  targetUnitId: number;
  conversionFactor: number;
  createdAt: string;
  updatedAt: string;
}

export interface UnitConversionRequest {
  productId: number;
  baseUnitId: number;
  targetUnitId: number;
  conversionFactor: number;
}

export const productUnitsApi = {
  listAll: async () => {
    return apiClient.get<ProductUnitResponse[]>('/product-units');
  },

  getByOrganization: async (organizationId: number) => {
    return apiClient.get<ProductUnitResponse[]>(`/product-units/organization/${organizationId}`);
  },

  /** GET /product-units/product/:productId — units for a specific product */
  getByProduct: async (productId: number) => {
    return apiClient.get<ProductUnitResponse[]>(`/product-units/product/${productId}`);
  },

  getById: async (id: number) => {
    return apiClient.get<ProductUnitResponse>(`/product-units/${id}`);
  },

  create: async (data: ProductUnitRequest) => {
    return apiClient.post<ProductUnitResponse>('/product-units', data);
  },

  update: async (id: number, data: ProductUnitRequest) => {
    return apiClient.put<ProductUnitResponse>(`/product-units/${id}`, data);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/product-units/${id}`);
  },

  getUnitConversions: async (productId: number) => {
    return apiClient.get<UnitConversion[]>(`/products/${productId}/unit-conversions`);
  },

  createUnitConversion: async (productId: number, data: UnitConversionRequest) => {
    return apiClient.post<UnitConversion>(`/products/${productId}/unit-conversions`, data);
  },
};