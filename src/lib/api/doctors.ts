import { apiClient } from './client';

export interface Doctor {
  id: number;
  organizationId: number;
  name: string;
  specialization?: string;
  phone?: string;
  email?: string;
  address?: string;
  licenseNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorRequest {
  organizationId: number;
  name: string;
  specialization?: string;
  phone?: string;
  email?: string;
  address?: string;
  licenseNumber?: string;
}

export interface DoctorResponse extends Doctor {}

export const doctorsApi = {
  listAll: async () => {
    return apiClient.get<DoctorResponse[]>('/doctors');
  },

  search: async (query: string) => {
    return apiClient.get<DoctorResponse[]>('/doctors/search', {
      params: { q: query }
    });
  },

  getById: async (id: number) => {
    return apiClient.get<DoctorResponse>(`/doctors/${id}`);
  },

  create: async (data: DoctorRequest) => {
    return apiClient.post<DoctorResponse>('/doctors', data);
  },

  update: async (id: number, data: DoctorRequest) => {
    return apiClient.put<DoctorResponse>(`/doctors/${id}`, data);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/doctors/${id}`);
  },
};