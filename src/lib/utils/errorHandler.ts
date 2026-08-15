import { AxiosError } from 'axios';
import { toast } from 'sonner';

/**
 * Centralized error handling for API errors
 * Provides user-friendly error messages and handles common HTTP status codes
 */

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

/**
 * Handle API errors and display appropriate user-friendly messages
 */
export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data as { message?: string; error?: string; details?: unknown } | undefined;
    
    switch (status) {
      case 400:
        const errorMessage = data?.message || data?.error || 'Invalid request. Please check your input.';
        toast.error(errorMessage);
        return { message: errorMessage, status, code: 'BAD_REQUEST' };
      
      case 401:
        toast.error('Session expired. Please log in again.');
        // Clear auth data and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('permissions');
          localStorage.removeItem('organizationId');
          document.cookie = 'isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }
        return { message: 'Unauthorized', status, code: 'UNAUTHORIZED' };
      
      case 403:
        toast.error('Access denied. You do not have permission to perform this action.');
        return { message: 'Access denied', status, code: 'FORBIDDEN' };
      
      case 404:
        toast.error('Resource not found.');
        return { message: 'Not found', status, code: 'NOT_FOUND' };
      
      case 409:
        const conflictMessage = data?.message || data?.error || 'Conflict. This resource already exists.';
        toast.error(conflictMessage);
        return { message: conflictMessage, status, code: 'CONFLICT' };
      
      case 422:
        const validationMessage = data?.message || data?.error || 'Validation failed. Please check your input.';
        toast.error(validationMessage);
        return { message: validationMessage, status, code: 'VALIDATION_ERROR' };
      
      case 429:
        toast.error('Too many requests. Please try again later.');
        return { message: 'Too many requests', status, code: 'RATE_LIMIT' };
      
      case 500:
        toast.error('Server error. Please try again later.');
        return { message: 'Server error', status, code: 'SERVER_ERROR' };
      
      case 502:
        toast.error('Service unavailable. Please try again later.');
        return { message: 'Service unavailable', status, code: 'BAD_GATEWAY' };
      
      case 503:
        toast.error('Service temporarily unavailable. Please try again later.');
        return { message: 'Service unavailable', status, code: 'SERVICE_UNAVAILABLE' };
      
      default:
        const defaultMessage = data?.message || data?.error || 'An unexpected error occurred.';
        toast.error(defaultMessage);
        return { message: defaultMessage, status, code: 'UNKNOWN_ERROR' };
    }
  }
  
  // Handle non-Axios errors
  if (error instanceof Error) {
    toast.error(error.message);
    return { message: error.message, code: 'CLIENT_ERROR' };
  }
  
  // Handle unknown errors
  toast.error('An unexpected error occurred.');
  return { message: 'An unexpected error occurred.', code: 'UNKNOWN_ERROR' };
};

/**
 * Get a user-friendly error message without showing a toast
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    return data?.message || data?.error || 'An error occurred';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return !error.response && !!error.request;
  }
  return false;
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return error.response?.status === 401 || error.response?.status === 403;
  }
  return false;
};

/**
 * Check if error is a validation error
 */
export const isValidationError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return error.response?.status === 422 || error.response?.status === 400;
  }
  return false;
};