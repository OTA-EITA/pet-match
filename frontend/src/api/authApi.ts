import axios from 'axios';
import { API_CONFIG } from '../config/api';
import { StorageService } from '../services/StorageService';

const authClient = axios.create(API_CONFIG);

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  type: 'adopter' | 'shelter'; // User type: adopter or shelter
}

export interface AuthResponse {
  tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  user: User;
}

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export const authApi = {
  // Register
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      console.log('🔍 DEBUG: Registration data being sent:', JSON.stringify(data));
      const response = await authClient.post<AuthResponse>('/auth/register', data);
      console.log('✅ DEBUG: Registration response received:', JSON.stringify(response.data));
      await StorageService.saveTokens(response.data.tokens.access_token, response.data.tokens.refresh_token);
      await StorageService.saveUser(response.data.user);
      return response.data;
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      console.error('❌ Error response data:', JSON.stringify(error.response?.data));
      console.error('❌ Error response status:', error.response?.status);
      throw error;
    }
  },

  // Login
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await authClient.post<AuthResponse>('/auth/login', data);
      await StorageService.saveTokens(response.data.tokens.access_token, response.data.tokens.refresh_token);
      await StorageService.saveUser(response.data.user);
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  // Refresh Token
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = await StorageService.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authClient.post<{ access_token: string }>('/auth/refresh', {
        refresh_token: refreshToken,
      });

      await StorageService.saveTokens(response.data.access_token, refreshToken);
      return response.data.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await StorageService.clearAll();
      throw error;
    }
  },

  // Logout
  async logout(): Promise<void> {
    try {
      const token = await StorageService.getAccessToken();
      if (token) {
        await authClient.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      await StorageService.clearAll();
    }
  },

  // Get Profile
  async getProfile(): Promise<User> {
    try {
      const token = await StorageService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await authClient.get<{ user: User }>('/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      await StorageService.saveUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      throw error;
    }
  },

  // Update Profile
  async updateProfile(data: { name?: string; phone?: string; address?: string }): Promise<User> {
    try {
      const token = await StorageService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await authClient.put<{ user: User }>('/auth/profile', data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await StorageService.saveUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },

  // Update Password
  async updatePassword(data: { current_password: string; new_password: string }): Promise<void> {
    try {
      const token = await StorageService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      await authClient.put('/auth/password', data, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Failed to update password:', error);
      throw error;
    }
  },
};

export default authApi;
