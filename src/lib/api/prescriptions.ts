import { apiClient } from './client';

export interface Prescription {
  id: number;
  customerId: number;
  doctorId: number;
  prescriptionDate: string;
  diagnosis?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionRequest {
  customerId: number;
  doctorId: number;
  prescriptionDate: string;
  diagnosis?: string;
  notes?: string;
}

export interface PrescriptionResponse extends Prescription {}

export interface PrescriptionItem {
  id: number;
  prescriptionId: number;
  productId: number;
  dosage?: string;
  frequency?: string;
  duration?: string;
  notes?: string;
}

export interface PrescriptionCheckAllergiesRequest {
  customerId: number;
  productIds: number[];
}

export interface PrescriptionCheckAllergiesResponse {
  hasAllergies: boolean;
  allergies: string[];
}

export const prescriptionsApi = {
  listAll: async () => {
    return apiClient.get<PrescriptionResponse[]>('/prescriptions');
  },

  getByDoctor: async (doctorId: number) => {
    return apiClient.get<PrescriptionResponse[]>(`/prescriptions/doctor/${doctorId}`);
  },

  getByCustomer: async (customerId: number) => {
    return apiClient.get<PrescriptionResponse[]>(`/prescriptions/customer/${customerId}`);
  },

  getById: async (id: number) => {
    return apiClient.get<PrescriptionResponse>(`/prescriptions/${id}`);
  },

  create: async (data: PrescriptionRequest) => {
    return apiClient.post<PrescriptionResponse>('/prescriptions', data);
  },

  update: async (id: number, data: PrescriptionRequest) => {
    return apiClient.put<PrescriptionResponse>(`/prescriptions/${id}`, data);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/prescriptions/${id}`);
  },

  checkAllergies: async (data: PrescriptionCheckAllergiesRequest): Promise<PrescriptionCheckAllergiesResponse> => {
    return apiClient.post<PrescriptionCheckAllergiesResponse>('/prescriptions/check-allergies', data);
  },
};