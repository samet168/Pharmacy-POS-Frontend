import { apiClient } from './client';
import { PageResponse } from '@/types/api';

// Matches backend DoctorResponse exactly
export interface Doctor {
  id: number;
  name: string;
  licenseNumber?: string;
  phone?: string;
  imageUrl?: string;
  clinicName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorRequest {
  name: string;
  licenseNumber?: string;
  phone?: string;
  imageUrl?: string;
  clinicName?: string;
}

export interface DoctorResponse extends Doctor {}

export const doctorsApi = {
  listAll: async (page = 0, size = 100) => {
    return apiClient.get<PageResponse<DoctorResponse>>('/doctors', { page, size });
  },

  search: async (name: string, page = 0, size = 100) => {
    return apiClient.get<PageResponse<DoctorResponse>>('/doctors/search', {
      name,
      page,
      size,
    });
  },

  getById: async (id: number) => {
    return apiClient.get<DoctorResponse>(`/doctors/${id}`);
  },

  /** POST /doctors — multipart form data required by backend */
  create: async (data: DoctorRequest, imageFile?: File) => {
    const form = new FormData();
    form.append('doctor', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (imageFile) form.append('file', imageFile);
    return apiClient.upload<DoctorResponse>('/doctors', form);
  },

  /** PUT /doctors/:id — multipart form data required by backend */
  update: async (id: number, data: DoctorRequest, imageFile?: File) => {
    const form = new FormData();
    form.append('doctor', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (imageFile) form.append('file', imageFile);
    return apiClient.upload<DoctorResponse>(`/doctors/${id}`, form, 'PUT');
  },

  delete: async (id: number) => {
    await apiClient.delete(`/doctors/${id}`);
  },
};