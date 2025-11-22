import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

const authClient = axios.create(API_CONFIG);

// Storage keys
const TOKEN_KEY = '@onlycats_access_token';
const REFRESH_TOKEN_KEY = '@onlycats_refresh_token';
const USER_KEY = '@onlycats_user';

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
      await this.saveTokens(response.data.tokens.access_token, response.data.tokens.refresh_token);
      await this.saveUser(response.data.user);
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
      await this.saveTokens(response.data.tokens.access_token, response.data.tokens.refresh_token);
      await this.saveUser(response.data.user);
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  // Refresh Token
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authClient.post<{ access_token: string }>('/auth/refresh', {
        refresh_token: refreshToken,
      });

      await AsyncStorage.setItem(TOKEN_KEY, response.data.access_token);
      return response.data.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.clearAuth();
      throw error;
    }
  },

  // Logout
  async logout(): Promise<void> {
    try {
      const token = await this.getAccessToken();
      if (token) {
        await authClient.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      await this.clearAuth();
    }
  },

  // Get Profile
  async getProfile(): Promise<User> {
    try {
      const token = await this.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await authClient.get<{ user: User }>('/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      await this.saveUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      throw error;
    }
  },

  // Update Profile
  async updateProfile(data: { name?: string; phone?: string; address?: string }): Promise<User> {
    try {
      const token = await this.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await authClient.put<{ user: User }>('/auth/profile', data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await this.saveUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },

  // Update Password
  async updatePassword(data: { current_password: string; new_password: string }): Promise<void> {
    try {
      const token = await this.getAccessToken();
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

  // Token management
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await AsyncStorage.multiSet([
      [TOKEN_KEY, accessToken],
      [REFRESH_TOKEN_KEY, refreshToken],
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    return await AsyncStorage.getItem(TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  },

  // User management
  async saveUser(user: User): Promise<void> {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  async getUser(): Promise<User | null> {
    const userStr = await AsyncStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  // Clear all auth data
  async clearAuth(): Promise<void> {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
  },

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  },
};

export default authApi;
