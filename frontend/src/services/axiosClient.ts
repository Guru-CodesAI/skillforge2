import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { supabase } from './supabase';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
});

// Request interceptor – attach JWT from Supabase session
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    // Security: Strip dangerous characters from query params
    if (config.params) {
      const sanitized: Record<string, string> = {};
      for (const [key, value] of Object.entries(config.params)) {
        if (typeof value === 'string') {
          sanitized[key] = value.replace(/[<>"'`]/g, '');
        } else {
          sanitized[key] = String(value);
        }
      }
      config.params = sanitized;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ detail?: string; message?: string }>) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail || error.response?.data?.message;

    switch (status) {
      case 401:
        // Try to refresh session
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          await supabase.auth.signOut();
          window.location.href = '/login?expired=true';
          return Promise.reject(new Error('Session expired. Please log in again.'));
        }
        // Retry original request
        return api.request(error.config!);

      case 403:
        toast.error('Access denied. Insufficient permissions.');
        break;

      case 404:
        // Don't toast 404s globally
        break;

      case 422:
        toast.error(detail || 'Validation error. Please check your inputs.');
        break;

      case 429:
        toast.error('Too many requests. Please slow down.');
        break;

      case 500:
        toast.error('Server error. Our team has been notified.');
        break;

      default:
        if (!error.response) {
          toast.error('Network error. Please check your connection.');
        }
        break;
    }

    return Promise.reject(error);
  }
);

export default api;

// Typed API helpers
export const apiClient = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    api.get<T>(url, { params }),

  post: <T>(url: string, data?: unknown) =>
    api.post<T>(url, data),

  patch: <T>(url: string, data?: unknown) =>
    api.patch<T>(url, data),

  put: <T>(url: string, data?: unknown) =>
    api.put<T>(url, data),

  delete: <T>(url: string) =>
    api.delete<T>(url),
};
