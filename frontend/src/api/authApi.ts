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

export interface AuthResponseData {
  message?: string;
  tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  user: User;
}

export interface AuthResponse {
  data: AuthResponseData;
  success: boolean;
  request_id?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export const authApi = {
  // Register
  async register(data: RegisterRequest): Promise<AuthResponseData> {
    const response = await authClient.post<AuthResponse>('/auth/register', data);
    const authData = response.data.data;
    await StorageService.saveTokens(authData.tokens.access_token, authData.tokens.refresh_token);
    await StorageService.saveUser(authData.user);
    return authData;
  },

  // Login
  async login(data: LoginRequest): Promise<AuthResponseData> {
    const response = await authClient.post<AuthResponse>('/auth/login', data);
    const authData = response.data.data;
    await StorageService.saveTokens(authData.tokens.access_token, authData.tokens.refresh_token);
    await StorageService.saveUser(authData.user);
    return authData;
  },

  // Refresh Token
  async refreshToken(): Promise<string> {
    try {
      const currentRefreshToken = await StorageService.getRefreshToken();
      if (!currentRefreshToken) {
        throw new Error('No refresh token available');
      }

      interface RefreshResponse {
        data: {
          tokens: {
            access_token: string;
            refresh_token: string;
            expires_in: number;
          };
        };
        success: boolean;
      }

      const response = await authClient.post<RefreshResponse>('/auth/refresh', {
        refresh_token: currentRefreshToken,
      });

      const { access_token, refresh_token } = response.data.data.tokens;
      await StorageService.saveTokens(access_token, refresh_token);
      return access_token;
    } catch (error) {
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

      interface ProfileResponse {
        data: {
          user: User;
        };
        success: boolean;
      }

      const response = await authClient.get<ProfileResponse>('/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const user = response.data.data.user;
      await StorageService.saveUser(user);
      return user;
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

      interface ProfileResponse {
        data: {
          user: User;
        };
        success: boolean;
      }

      const response = await authClient.put<ProfileResponse>('/auth/profile', data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const user = response.data.data.user;
      await StorageService.saveUser(user);
      return user;
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
