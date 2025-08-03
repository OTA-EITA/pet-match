import axios from 'axios';
import { Pet, PetResponse } from '../types/Pet';

// API Gateway経由でアクセス
// const API_BASE_URL = 'http://localhost:8080/api/v1';  // デフォルト
const API_BASE_URL = 'http://localhost:18081/api/v1';  // port-forward用

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター（将来的な認証用）
apiClient.interceptors.request.use(
  (config) => {
    // 開発用: DEV_TOKENを追加
    // config.headers.Authorization = 'Bearer DEV_TOKEN';
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.message);
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
