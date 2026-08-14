import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors, token refresh, and unwrap ApiResponse
    this.client.interceptors.response.use(
      (response) => {
        console.log('API Response:', response.data);
        
        // Unwrap ApiResponse<T> wrapper if present
        if (response.data && typeof response.data === 'object' && 'data' in response.data && 'success' in response.data) {
          console.log('Unwrapping ApiResponse:', response.data.data);
          return response.data.data;
        }
        console.log('No unwrap needed, returning:', response.data);
        return response.data;
      },
      async (error: AxiosError) => {
        console.error('API Error:', error);
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            const response = await this.client.post<{ accessToken: string; refreshToken: string }>(
              '/auth/refresh',
              { refreshToken }
            );

            const { accessToken, refreshToken: newRefreshToken } = response.data;

            if (typeof window !== 'undefined') {
              localStorage.setItem('accessToken', accessToken);
              localStorage.setItem('refreshToken', newRefreshToken);
            }

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed - clear tokens and redirect to login
            if (typeof window !== 'undefined') {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('permissions');
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  public async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  public async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  public async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  public async patch<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  public async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }

  // Multipart form data upload
  public async upload<T>(url: string, formData: FormData): Promise<T> {
    const response = await this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  public getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();