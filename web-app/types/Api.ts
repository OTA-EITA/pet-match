// Generic API response structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: {
    total?: number;
    page?: number;
    per_page?: number;
    last_page?: number;
  };
}

// API Error types
export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, unknown>;
}

export class ApiException extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// API Client configuration
export interface ApiConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

// File upload types
export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mime_type: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Pagination
export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

// Search and filter types
export interface SearchParams {
  q?: string;
  filters?: Record<string, unknown>;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Common status types
export type EntityStatus = 'active' | 'inactive' | 'pending' | 'deleted';

// Timestamp fields
export interface TimestampFields {
  created_at: string;
  updated_at: string;
}

// Audit fields
export interface AuditFields extends TimestampFields {
  created_by?: string;
  updated_by?: string;
  deleted_at?: string;
  deleted_by?: string;
}
