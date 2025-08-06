'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi, tokenStorage, User, AuthError } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, type: 'adopter' | 'shelter') => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = user !== null;

  // Token refresh function
  const refreshAccessToken = async (): Promise<string | null> => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await authApi.refreshToken(refreshToken);
      tokenStorage.setTokens(response.access_token, refreshToken);
      return response.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      tokenStorage.clearTokens();
      return null;
    }
  };

  // Verify and set user from token
  const verifyAndSetUser = async (accessToken: string): Promise<boolean> => {
    try {
      const userData = await authApi.verifyToken(accessToken);
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      // Try to refresh token
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        try {
          const userData = await authApi.verifyToken(newAccessToken);
          setUser(userData);
          return true;
        } catch (refreshError) {
          console.error('Token refresh verification failed:', refreshError);
        }
      }
      tokenStorage.clearTokens();
      return false;
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      
      const accessToken = tokenStorage.getAccessToken();
      if (accessToken) {
        await verifyAndSetUser(accessToken);
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      tokenStorage.setTokens(response.tokens.access_token, response.tokens.refresh_token);
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (
    email: string, 
    password: string, 
    name: string, 
    type: 'adopter' | 'shelter'
  ): Promise<void> => {
    setLoading(true);
    try {
      const response = await authApi.register({ email, password, name, type });
      tokenStorage.setTokens(response.tokens.access_token, response.tokens.refresh_token);
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    tokenStorage.clearTokens();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
