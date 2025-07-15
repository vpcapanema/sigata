import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse, PaginatedResponse } from '@/types';

// Configuração base da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para requests
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('sigata_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor para responses
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expirado ou inválido
          localStorage.removeItem('sigata_token');
          localStorage.removeItem('sigata_user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Métodos genéricos
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.get(url, config);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.post(url, data, config);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.put(url, data, config);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.delete(url, config);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // Upload de arquivos
  async upload<T>(url: string, formData: FormData, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // Métodos para paginação
  async getPaginated<T>(url: string, params?: Record<string, any>): Promise<ApiResponse<PaginatedResponse<T>>> {
    try {
      const response: AxiosResponse<ApiResponse<PaginatedResponse<T>>> = await this.client.get(url, { params });
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // Download de arquivos
  async download(url: string, filename?: string): Promise<void> {
    try {
      const response = await this.client.get(url, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      throw error;
    }
  }

  // Tratamento de erros
  private handleError<T>(error: any): ApiResponse<T> {
    const message = error.response?.data?.message || error.message || 'Erro desconhecido';
    const status = error.response?.status || 500;
    
    console.error('API Error:', {
      status,
      message,
      url: error.config?.url,
      method: error.config?.method,
    });

    return {
      success: false,
      error: message,
      message: `Erro ${status}: ${message}`,
    };
  }

  // Método para verificar conectividade
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  // Método para obter token de autenticação
  setAuthToken(token: string): void {
    localStorage.setItem('sigata_token', token);
  }

  // Método para remover token
  clearAuthToken(): void {
    localStorage.removeItem('sigata_token');
    localStorage.removeItem('sigata_user');
  }

  // Método para verificar se está autenticado
  isAuthenticated(): boolean {
    return !!localStorage.getItem('sigata_token');
  }
}

// Instância única do serviço
export const apiService = new ApiService();
export default apiService;
