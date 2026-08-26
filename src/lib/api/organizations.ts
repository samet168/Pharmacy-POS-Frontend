import { apiClient } from './client';

export interface Organization {
  id: number;
  name: string;
  slug: string;
  licenseNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  logoUrl?: string;
  baseCurrency: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationRequest {
  name: string;
  slug: string;
  licenseNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  logoUrl?: string;
  baseCurrency: string;
}

export type OrganizationResponse = Organization ;

export const organizationsApi = {
  listAll: async () => {
    return apiClient.get<OrganizationResponse[]>('/organizations');
  },

  getBySlug: async (slug: string) => {
    return apiClient.get<OrganizationResponse>(`/organizations/slug/${slug}`);
  },

  getById: async (id: number) => {
    return apiClient.get<OrganizationResponse>(`/organizations/${id}`);
  },

  create: async (data: OrganizationRequest) => {
    return apiClient.post<OrganizationResponse>('/organizations', data);
  },

  update: async (id: number, data: OrganizationRequest) => {
    return apiClient.put<OrganizationResponse>(`/organizations/${id}`, data);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/organizations/${id}`);
  },
};