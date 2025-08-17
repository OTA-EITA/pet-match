'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  User, 
  AuthState, 
  LoginCredentials, 
  RegisterData, 
  ApiException 
} from '@/types';
import { authApi, tokenStorage, authStateHelpers } from '@/lib/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Set loading state
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  // Set error state
  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  // Set authenticated user
  const setAuthenticatedUser = useCallback((user: User) => {
    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  }, []);

  // Set unauthenticated state
  const setUnauthenticated = useCallback(() => {
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async (): Promise<void> => {
    const accessToken = tokenStorage.getAccessToken();
    if (!accessToken) {
      setUnauthenticated();
      return;
    }

    try {
      setLoading(true);
      const userData = await authApi.getCurrentUser();
      setAuthenticatedUser(userData);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      
      // Try to refresh token and retry
      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        try {
          const authResponse = await authApi.refreshToken(refreshToken);
          tokenStorage.setTokens(authResponse.access_token, authResponse.refresh_token);
          
          const userData = await authApi.getCurrentUser();
          setAuthenticatedUser(userData);
          return;
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }
      
      // Authentication failed completely
      tokenStorage.clearTokens();
      setUnauthenticated();
    }
  }, [setLoading, setAuthenticatedUser, setUnauthenticated]);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    try {
      setLoading(true);
      clearError();
      
      const authResponse = await authApi.login(credentials);
      tokenStorage.setTokens(authResponse.access_token, authResponse.refresh_token);
      setAuthenticatedUser(authResponse.user);
    } catch (error) {
      const errorMessage = error instanceof ApiException 
        ? error.message 
        : 'ログインに失敗しました';
      setError(errorMessage);
      throw error;
    }
  }, [setLoading, clearError, setAuthenticatedUser, setError]);

  // Register function
  const register = useCallback(async (userData: RegisterData): Promise<void> => {
    try {
      setLoading(true);
      clearError();
      
      const authResponse = await authApi.register(userData);
      tokenStorage.setTokens(authResponse.access_token, authResponse.refresh_token);
      setAuthenticatedUser(authResponse.user);
    } catch (error) {
      const errorMessage = error instanceof ApiException 
        ? error.message 
        : '登録に失敗しました';
      setError(errorMessage);
      throw error;
    }
  }, [setLoading, clearError, setAuthenticatedUser, setError]);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      await authApi.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with logout even if API call fails
    } finally {
      tokenStorage.clearTokens();
      setUnauthenticated();
    }
  }, [setLoading, setUnauthenticated]);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      // Check if we have valid tokens
      if (!tokenStorage.hasValidTokens()) {
        setUnauthenticated();
        return;
      }

      // Try to get current user
      await refreshUser();
    };

    initializeAuth();
  }, [refreshUser, setUnauthenticated]);

  // Auto-refresh token when it's about to expire
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const interval = setInterval(async () => {
      const accessToken = tokenStorage.getAccessToken();
      if (accessToken && authStateHelpers.needsTokenRefresh()) {
        const refreshToken = tokenStorage.getRefreshToken();
        if (refreshToken) {
          try {
            const authResponse = await authApi.refreshToken(refreshToken);
            tokenStorage.setTokens(authResponse.access_token, authResponse.refresh_token);
          } catch (error) {
            console.error('Auto token refresh failed:', error);
            await logout();
          }
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [state.isAuthenticated, logout]);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
