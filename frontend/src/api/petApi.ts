import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { Pet, PetResponse } from '../types/Pet';
import { authApi } from './authApi';

// React Nativeでは、実行環境に応じてAPIのベースURLを変更する必要がある
const getApiBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:18081/api';
    }
    // iOS Simulatorまたは実機の場合
    return 'http://192.168.3.22:18081/api';
  }
  return 'https://api.onlycats.example.com/api';
};

const API_BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    console.log('API Request:', config.method?.toUpperCase(), config.url);

    // Get access token from storage
    const token = await authApi.getAccessToken();
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
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    console.error('API Error:', error.response?.status, error.message);

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
        // Try to refresh the token
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
        await authApi.clearAuth();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const petApi = {
  // ペット一覧取得
  async getPets(limit: number = 20, offset: number = 0): Promise<PetResponse> {
    try {
      const response = await apiClient.get<PetResponse>('/pets', {
        params: { limit, offset }
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

  // ヘルスチェック（開発用）
  async healthCheck(): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL.replace('/api/v1', '')}/health`);
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
};

export default apiClient;
