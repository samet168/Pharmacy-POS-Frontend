import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';

// Helper to unwrap ApiResponse<T> wrapper from backend
function unwrapApiResponse<T>(data: unknown): T {
  if (
    data &&
    typeof data === 'object' &&
    'data' in data &&
    'success' in data
  ) {
    return (data as { data: T }).data;
  }
  return data as T;
}

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
        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('accessToken')
            : null;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle 401 + token refresh only
    // Do NOT unwrap here — method wrappers (get/post/etc.) handle unwrapping
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken =
              typeof window !== 'undefined'
                ? localStorage.getItem('refreshToken')
                : null;
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            // Use a raw axios instance to avoid interceptor loop
            const refreshRes = await axios.post<{
              success: boolean;
              data: { accessToken: string; refreshToken: string };
            }>(`${API_BASE_URL}/auth/refresh`, { refreshToken });

            const { accessToken, refreshToken: newRefreshToken } =
              refreshRes.data?.data ?? refreshRes.data;

            if (typeof window !== 'undefined') {
              localStorage.setItem('accessToken', accessToken);
              localStorage.setItem('refreshToken', newRefreshToken);
            }

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('permissions');
              window.location.href = '/login';
            }
            return Promise.reject(error);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  public async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.client.get(url, { params });
    return unwrapApiResponse<T>(response.data);
  }

  public async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.post(url, data);
    return unwrapApiResponse<T>(response.data);
  }

  public async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.put(url, data);
    return unwrapApiResponse<T>(response.data);
  }

  public async patch<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.patch(url, data);
    return unwrapApiResponse<T>(response.data);
  }

  public async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete(url);
    return unwrapApiResponse<T>(response.data);
  }

  // Multipart form data upload
  public async upload<T>(url: string, formData: FormData, method: 'POST' | 'PUT' = 'POST'): Promise<T> {
    const response = await this.client.request({
      method,
      url,
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrapApiResponse<T>(response.data);
  }

  public getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
