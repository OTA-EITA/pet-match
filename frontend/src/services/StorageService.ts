import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/User';

// Storage keys
const TOKEN_KEY = '@onlycats_access_token';
const REFRESH_TOKEN_KEY = '@onlycats_refresh_token';
const USER_KEY = '@onlycats_user';

/**
 * StorageService handles all local storage operations
 * Separates storage management from API layer
 */
export const StorageService = {
  // Token management
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, accessToken),
      AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    return await AsyncStorage.getItem(TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
    ]);
  },

  // User management
  async saveUser(user: User): Promise<void> {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  async getUser(): Promise<User | null> {
    const userJson = await AsyncStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  },

  async clearUser(): Promise<void> {
    await AsyncStorage.removeItem(USER_KEY);
  },

  // Clear all auth data
  async clearAll(): Promise<void> {
    await Promise.all([
      this.clearTokens(),
      this.clearUser(),
    ]);
  },

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  },
};
