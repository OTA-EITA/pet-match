import axios from 'axios';

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:18091';

const authClient = axios.create({
  baseURL: AUTH_BASE_URL,
  timeout: 10000,
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
    console.error('Auth Response Error:', error.response?.data || error.message);
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
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'AuthError';
  }
}

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      const response = await authClient.post('/auth/register', data);
      return response.data;
    } catch (error: any) {
      throw new AuthError(
        error.response?.data?.message || 'Registration failed',
        error.response?.status
      );
    }
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await authClient.post('/auth/login', data);
      return response.data;
    } catch (error: any) {
      throw new AuthError(
        error.response?.data?.message || 'Login failed',
        error.response?.status
      );
    }
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    try {
      const response = await authClient.post('/auth/refresh', {
        refresh_token: refreshToken,
      });
      return response.data;
    } catch (error: any) {
      throw new AuthError(
        error.response?.data?.message || 'Token refresh failed',
        error.response?.status
      );
    }
  },

  verifyToken: async (accessToken: string): Promise<User> => {
    try {
      const response = await authClient.get('/auth/verify', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      return response.data.user;
    } catch (error: any) {
      throw new AuthError(
        error.response?.data?.message || 'Token verification failed',
        error.response?.status
      );
    }
  },

  healthCheck: async () => {
    try {
      const response = await authClient.get('/health');
      return response.data;
    } catch (error: any) {
      throw new AuthError('Auth service unavailable');
    }
  },
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
