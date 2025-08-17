import axios, { AxiosError } from 'axios';
import { 
  User, 
  AuthResponse, 
  LoginCredentials, 
  RegisterData, 
  ApiResponse, 
  ApiException,
  JWTPayload 
} from '@/types';
import { API_CONFIG } from '@/lib/config';

// Create dedicated auth client
const authClient = axios.create({
  baseURL: API_CONFIG.AUTH_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Enhanced error handling for auth client
authClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Convert axios errors to ApiExceptions
    if (error.response) {
      const data = error.response.data as ApiResponse;
      throw new ApiException(
        error.response.status,
        data?.error || 'AUTH_ERROR',
        data?.message || error.message,
        data?.errors
      );
    }
    
    throw new ApiException(
      0,
      'NETWORK_ERROR',
      'Authentication service unavailable'
    );
  }
);

// Enhanced Auth API with proper typing
export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await authClient.post<ApiResponse<AuthResponse>>(
      API_CONFIG.ENDPOINTS.AUTH.REGISTER, 
      data
    );
    
    if (!response.data.success || !response.data.data) {
      throw new ApiException(
        response.status,
        'REGISTRATION_FAILED',
        response.data.error || 'Registration failed'
      );
    }
    
    return response.data.data;
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await authClient.post<ApiResponse<AuthResponse>>(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN, 
      credentials
    );
    
    if (!response.data.success || !response.data.data) {
      throw new ApiException(
        response.status,
        'LOGIN_FAILED',
        response.data.error || 'Login failed'
      );
    }
    
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      try {
        await authClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        // Continue with logout even if API call fails
        console.warn('Logout API call failed:', error);
      }
    }
    tokenStorage.clearTokens();
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await authClient.post<ApiResponse<AuthResponse>>(
      API_CONFIG.ENDPOINTS.AUTH.REFRESH,
      { refresh_token: refreshToken }
    );
    
    if (!response.data.success || !response.data.data) {
      throw new ApiException(
        response.status,
        'TOKEN_REFRESH_FAILED',
        response.data.error || 'Token refresh failed'
      );
    }
    
    return response.data.data;
  },

  verifyToken: async (accessToken: string): Promise<User> => {
    const response = await authClient.get<ApiResponse<User>>(
      API_CONFIG.ENDPOINTS.AUTH.VERIFY,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    
    if (!response.data.success || !response.data.data) {
      throw new ApiException(
        response.status,
        'TOKEN_VERIFICATION_FAILED',
        response.data.error || 'Token verification failed'
      );
    }
    
    return response.data.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      throw new ApiException(401, 'NO_TOKEN', 'No access token available');
    }
    
    const response = await authClient.get<ApiResponse<User>>(
      API_CONFIG.ENDPOINTS.AUTH.ME,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (!response.data.success || !response.data.data) {
      throw new ApiException(
        response.status,
        'USER_FETCH_FAILED',
        response.data.error || 'Failed to fetch user data'
      );
    }
    
    return response.data.data;
  },

  healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await authClient.get<ApiResponse<{ status: string; timestamp: string }>>(
      API_CONFIG.ENDPOINTS.AUTH.HEALTH
    );
    
    if (!response.data.success || !response.data.data) {
      throw new ApiException(
        response.status,
        'HEALTH_CHECK_FAILED',
        'Auth service health check failed'
      );
    }
    
    return response.data.data;
  },
};

// Token utilities with proper typing
export const tokenUtils = {
  // Decode JWT token (client-side only, no verification)
  decodeJWT: (token: string): JWTPayload | null => {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      
      const decoded = JSON.parse(atob(payload));
      return decoded as JWTPayload;
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return null;
    }
  },

  // Check if token is expired
  isTokenExpired: (token: string): boolean => {
    const payload = tokenUtils.decodeJWT(token);
    if (!payload) return true;
    
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  },

  // Get user info from token
  getUserFromToken: (token: string): Partial<User> | null => {
    const payload = tokenUtils.decodeJWT(token);
    if (!payload) return null;
    
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  },

  // Check if token refresh is needed (expires in next 5 minutes)
  needsRefresh: (token: string): boolean => {
    const payload = tokenUtils.decodeJWT(token);
    if (!payload) return true;
    
    const now = Math.floor(Date.now() / 1000);
    const refreshThreshold = 5 * 60; // 5 minutes
    return payload.exp - now < refreshThreshold;
  },
};

// Enhanced token storage with validation
export const tokenStorage = {
  setTokens: (accessToken: string, refreshToken: string): void => {
    if (typeof window === 'undefined') return;
    
    try {
      // Validate tokens before storing
      if (!accessToken || !refreshToken) {
        throw new Error('Invalid tokens provided');
      }
      
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      
      // Store token expiry for quick checks
      const payload = tokenUtils.decodeJWT(accessToken);
      if (payload) {
        localStorage.setItem('token_expires_at', payload.exp.toString());
      }
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  },

  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  },

  clearTokens: (): void => {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires_at');
  },

  // Check if we have valid tokens
  hasValidTokens: (): boolean => {
    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();
    
    if (!accessToken || !refreshToken) return false;
    
    // Quick expiry check without decoding
    if (typeof window !== 'undefined') {
      const expiresAt = localStorage.getItem('token_expires_at');
      if (expiresAt) {
        const now = Math.floor(Date.now() / 1000);
        if (parseInt(expiresAt) < now) return false;
      }
    }
    
    return true;
  },

  // Get current user from stored token
  getCurrentUserFromStorage: (): Partial<User> | null => {
    const token = tokenStorage.getAccessToken();
    if (!token) return null;
    
    return tokenUtils.getUserFromToken(token);
  },
};

// Development utilities
export const devAuthUtils = {
  // Set development token for testing
  setDevToken: (): void => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return;
    
    // Create a mock JWT-like token for development
    const mockPayload = {
      sub: 'dev-user-123',
      email: 'dev@petmatch.local',
      role: 'user' as const,
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      iat: Math.floor(Date.now() / 1000),
    };
    
    const mockToken = `dev.${btoa(JSON.stringify(mockPayload))}.signature`;
    tokenStorage.setTokens(mockToken, 'dev-refresh-token');
    
    console.log('🔧 Development token set for testing');
  },

  clearDevToken: (): void => {
    tokenStorage.clearTokens();
    console.log('🔧 Development tokens cleared');
  },

  isUsingDevToken: (): boolean => {
    const token = tokenStorage.getAccessToken();
    return token?.startsWith('dev.') ?? false;
  },

  // Mock successful auth response for development
  mockAuthResponse: (): AuthResponse => {
    return {
      user: {
        id: 'dev-user-123',
        email: 'dev@petmatch.local',
        username: 'devuser',
        first_name: 'Dev',
        last_name: 'User',
        role: 'user',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      access_token: 'dev-access-token',
      refresh_token: 'dev-refresh-token',
      expires_in: 3600,
    };
  },
};

// Auth state management helpers
export const authStateHelpers = {
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return tokenStorage.hasValidTokens();
  },

  // Get current user info
  getCurrentUser: (): Partial<User> | null => {
    return tokenStorage.getCurrentUserFromStorage();
  },

  // Check if user has specific role
  hasRole: (role: string): boolean => {
    const user = authStateHelpers.getCurrentUser();
    return user?.role === role;
  },

  // Check if access token needs refresh
  needsTokenRefresh: (): boolean => {
    const token = tokenStorage.getAccessToken();
    if (!token) return false;
    
    return tokenUtils.needsRefresh(token);
  },
};
