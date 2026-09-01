import { apiClient } from './client';

export interface AppointmentResponse {
  id: number;
  appointmentNumber: string;
  doctorId: number;
  doctorName: string;
  doctorSpecialty: string;
  doctorImage?: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  appointmentDate: string;
  appointmentTime: string;
  type: string;
  status: string;
  symptoms?: string;
  clinicName?: string;
  branchName?: string;
  fee?: number;
  qrCode?: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const appointmentsApi = {
  getAll: async (page = 0, size = 50): Promise<AppointmentResponse[]> => {
    const res = await apiClient.get<PageResponse<AppointmentResponse> | AppointmentResponse[]>(
      `/appointments?page=${page}&size=${size}`
    );
    if (Array.isArray(res)) return res;
    return (res as any)?.content || [];
  },

  getById: async (id: number): Promise<AppointmentResponse> => {
    return apiClient.get<AppointmentResponse>(`/appointments/${id}`);
  },

  updateStatus: async (id: number, status: string): Promise<AppointmentResponse> => {
    return apiClient.put<AppointmentResponse>(`/appointments/${id}/status?status=${status}`);
  },
};
