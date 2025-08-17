// User types
export type UserRole = 'user' | 'shelter' | 'admin';
export type UserStatus = 'active' | 'pending' | 'suspended';

export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  bio?: string;
  profile_image?: string;
  preferences?: UserPreferences;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  preferred_species?: string[];
  preferred_size?: string[];
  preferred_age_range?: {
    min: number;
    max: number;
  };
  max_distance?: number;
  good_with_kids?: boolean;
  good_with_pets?: boolean;
  notifications?: {
    email: boolean;
    push: boolean;
    new_matches: boolean;
    messages: boolean;
  };
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// JWT Token payload
export interface JWTPayload {
  sub: string; // user ID
  email: string;
  role: UserRole;
  exp: number;
  iat: number;
}
