import axios from 'axios';
import { API_CONFIG } from '@/lib/config';

const authClient = axios.create({
  baseURL: API_CONFIG.AUTH_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

authClient.interceptors.request.use(
  (config) => {
    console.log(`Auth Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Auth Request Error:', error);
    return Promise.reject(error);
  }
);

authClient.interceptors.response.use(
  (response) => {
    console.log(`Auth Response: ${response.status}`, response.data);
    return response;
  },
  (error) => {
    // Only log errors in production or if not a network error
    if (process.env.NODE_ENV !== 'development' || error.response) {
      console.error('Auth Response Error:', error.response?.data || error.message);
    } else {
      // In development with network errors, just log a simple message
      console.warn('🔧 Auth service unavailable (development mode)');
    }
    return Promise.reject(error);
  }
);

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  type: 'adopter' | 'shelter' | 'individual';
  phone?: string;
  address?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: {
    id: string;
    email: string;
    name: string;
    type: string;
    phone?: string;
    address?: string;
    verified: boolean;
    created_at: string;
    updated_at: string;
  };
  tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}

export interface RefreshTokenResponse {
  access_token: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  type: string;
  phone?: string;
  address?: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export class AuthError extends Error {
  constructor(message: string, public statusCode?: number, public path?: string) {
    super(message);
    this.name = 'AuthError';
  }
}

// API Gateway unified error response interface
export interface APIErrorResponse {
  error: string;
  message: string;
  path?: string;
  timestamp?: string;
}

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      console.log('🔍 Registration attempt:', {
        email: data.email,
        name: data.name,
        type: data.type,
        url: `${API_CONFIG.AUTH_URL}${API_CONFIG.ENDPOINTS.AUTH.REGISTER}`
      });
      
      const response = await authClient.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, data);
      console.log('✅ Registration successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Registration failed:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });
      
      const errorData: APIErrorResponse = error.response?.data;
      throw new AuthError(
        errorData?.message || 'Registration failed',
        error.response?.status,
        errorData?.path
      );
    }
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await authClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, data);
      return response.data;
    } catch (error: any) {
      const errorData: APIErrorResponse = error.response?.data;
      throw new AuthError(
        errorData?.message || 'Login failed',
        error.response?.status,
        errorData?.path
      );
    }
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    try {
      const response = await authClient.post(API_CONFIG.ENDPOINTS.AUTH.REFRESH, {
        refresh_token: refreshToken,
      });
      return response.data;
    } catch (error: any) {
      const errorData: APIErrorResponse = error.response?.data;
      throw new AuthError(
        errorData?.message || 'Token refresh failed',
        error.response?.status,
        errorData?.path
      );
    }
  },

  verifyToken: async (accessToken: string): Promise<User> => {
    try {
      const response = await authClient.get(API_CONFIG.ENDPOINTS.AUTH.VERIFY, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      return response.data.user;
    } catch (error: any) {
      const errorData: APIErrorResponse = error.response?.data;
      throw new AuthError(
        errorData?.message || 'Token verification failed',
        error.response?.status,
        errorData?.path
      );
    }
  },

  healthCheck: async () => {
    try {
      const response = await authClient.get(API_CONFIG.ENDPOINTS.AUTH.HEALTH);
      return response.data;
    } catch (error: any) {
      throw new AuthError('Auth service unavailable');
    }
  },
};

// Development token utilities
export const devTokenUtils = {
  // For development testing, use API Gateway's DEV_TOKEN
  setDevToken: () => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      localStorage.setItem('access_token', 'DEV_TOKEN');
      console.log('🔧 Development token set for testing');
    }
  },

  clearDevToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      console.log('🔧 Development tokens cleared');
    }
  },

  isUsingDevToken: (): boolean => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token') === 'DEV_TOKEN';
    }
    return false;
  }
};

// Token storage utilities
export const tokenStorage = {
  setTokens: (accessToken: string, refreshToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
    }
  },

  getAccessToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  },

  getRefreshToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  },

  clearTokens: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },
};
