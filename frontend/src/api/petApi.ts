import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Pet, PetResponse } from '../types/Pet';
import { StorageService } from '../services/StorageService';
import { API_CONFIG } from '../config/api';

// Import only the refreshToken function from authApi to avoid circular dependency issues
const getAuthApi = () => import('./authApi').then(m => m.authApi);

const apiClient = axios.create(API_CONFIG);

// Track if we're currently refreshing the token to avoid multiple refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// リクエストインターセプター - 認証トークンを自動で追加
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await StorageService.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター - 401エラー時に自動でトークンをリフレッシュ
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 Unauthorized and we haven't retried yet
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token using dynamic import to avoid circular dependency
        const authApi = await getAuthApi();
        const newToken = await authApi.refreshToken();
        processQueue(null, newToken);

        // Retry the original request with the new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        // Token refresh failed - user needs to login again
        await StorageService.clearAll();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export interface PetSearchParams {
  limit?: number;
  offset?: number;
  species?: string;
  breed?: string;
  gender?: 'male' | 'female';
  size?: 'small' | 'medium' | 'large';
  age_min?: number;
  age_max?: number;
  search?: string;
  owner?: string; // 'me' for own pets
}

export interface PetCreateRequest {
  name: string;
  species: string;
  breed: string;
  age_years: number;
  age_months?: number;
  is_age_estimated?: boolean;
  gender: 'male' | 'female';
  size?: 'small' | 'medium' | 'large';
  weight?: number; // 体重 (kg)
  color?: string;
  personality?: string[];
  vaccinated?: boolean;
  neutered?: boolean;
  health_issues?: string[];
  location?: string;
  images?: string[];
  description?: string;
}

export interface PetUpdateRequest {
  name?: string;
  species?: string;
  breed?: string;
  age_years?: number;
  age_months?: number;
  is_age_estimated?: boolean;
  gender?: 'male' | 'female';
  size?: 'small' | 'medium' | 'large';
  weight?: number; // 体重 (kg)
  color?: string;
  personality?: string[];
  vaccinated?: boolean;
  neutered?: boolean;
  health_issues?: string[];
  location?: string;
  images?: string[];
  description?: string;
  status?: 'available' | 'adopted' | 'pending';
}

export const petApi = {
  // ペット一覧取得
  async getPets(params?: PetSearchParams): Promise<PetResponse> {
    try {
      const searchParams: any = {
        limit: params?.limit || 20,
        offset: params?.offset || 0,
      };

      // Add optional filter parameters
      if (params?.species) searchParams.species = params.species;
      if (params?.breed) searchParams.breed = params.breed;
      if (params?.gender) searchParams.gender = params.gender;
      if (params?.size) searchParams.size = params.size;
      if (params?.age_min !== undefined) searchParams.age_min = params.age_min;
      if (params?.age_max !== undefined) searchParams.age_max = params.age_max;
      if (params?.owner) searchParams.owner = params.owner;

      const response = await apiClient.get<PetResponse>('/pets', {
        params: searchParams
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch pets:', error);
      throw error;
    }
  },

  // ペット詳細取得
  async getPet(id: string): Promise<Pet> {
    try {
      const response = await apiClient.get<Pet>(`/pets/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch pet ${id}:`, error);
      throw error;
    }
  },

  // 自分のペット一覧取得
  async getMyPets(): Promise<PetResponse> {
    return this.getPets({ owner: 'me' });
  },

  // ペット登録
  async createPet(data: PetCreateRequest): Promise<Pet> {
    try {
      const response = await apiClient.post<{ message: string; pet: Pet }>('/pets', data);
      return response.data.pet;
    } catch (error) {
      console.error('Failed to create pet:', error);
      throw error;
    }
  },

  // ペット更新
  async updatePet(id: string, data: PetUpdateRequest): Promise<Pet> {
    try {
      const response = await apiClient.put<{ message: string; pet: Pet }>(`/pets/${id}`, data);
      return response.data.pet;
    } catch (error) {
      console.error(`Failed to update pet ${id}:`, error);
      throw error;
    }
  },

  // ペット削除
  async deletePet(id: string): Promise<void> {
    try {
      await apiClient.delete(`/pets/${id}`);
    } catch (error) {
      console.error(`Failed to delete pet ${id}:`, error);
      throw error;
    }
  },

  // ヘルスチェック（開発用）
  async healthCheck(): Promise<any> {
    try {
      const response = await axios.get(`${API_CONFIG.baseURL.replace('/api', '')}/health`);
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
};

export default apiClient;
