import { apiClient } from './client';

export interface UploadResponse {
  url: string;
}

export const uploadsApi = {
  uploadImage: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.upload<UploadResponse>('/uploads/image', formData);
  },
};