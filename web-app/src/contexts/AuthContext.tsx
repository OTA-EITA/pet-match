'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User, AuthResponseData } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: { name: string; email: string; password: string; type: 'adopter' | 'shelter' | 'individual' }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Token storage helpers
const saveTokens = (tokens: { access_token: string; refresh_token: string }) => {
  localStorage.setItem('token', tokens.access_token);
  localStorage.setItem('refresh_token', tokens.refresh_token);
};

const clearTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

const saveUser = (user: User) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      setIsInitialized(true);
      return;
    }

    // まずlocalStorageから即座にユーザー情報を読み込む（UX向上）
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        // JSONパースエラーは無視
      }
    }

    // APIで検証
    const result = await authApi.getProfile();
    if (result.data) {
      setUser(result.data);
      saveUser(result.data);
    } else {
      // Token invalid, clear everything
      clearTokens();
      setUser(null);
    }
    setIsLoading(false);
    setIsInitialized(true);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    if (result.data) {
      saveTokens(result.data.tokens);
      saveUser(result.data.user);
      setUser(result.data.user);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const signup = async (data: { name: string; email: string; password: string; type: 'adopter' | 'shelter' | 'individual' }) => {
    const result = await authApi.signup(data);
    if (result.data) {
      saveTokens(result.data.tokens);
      saveUser(result.data.user);
      setUser(result.data.user);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const logout = async () => {
    await authApi.logout();
    clearTokens();
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    saveUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isInitialized,
        login,
        signup,
        logout,
        checkAuth,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
