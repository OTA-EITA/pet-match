import { AppConfig } from '@/types';

// Environment validation
const requiredEnvVars = [
  'NEXT_PUBLIC_API_URL',
] as const;

const validateEnvironment = (): void => {
  const missing = requiredEnvVars.filter(
    varName => !process.env[varName]
  );
  
  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`);
  }
};

// Call validation in development
if (process.env.NODE_ENV === 'development') {
  validateEnvironment();
}

// App configuration with proper typing
export const APP_CONFIG: AppConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  appName: 'PetMatch',
  version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  environment: (process.env.NODE_ENV as AppConfig['environment']) || 'development',
  features: {
    chat: process.env.NEXT_PUBLIC_ENABLE_CHAT === 'true',
    notifications: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true',
    geolocation: process.env.NEXT_PUBLIC_ENABLE_GEOLOCATION === 'true',
    fileUpload: true,
  },
};

// API Configuration
export const API_CONFIG = {
  AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL || APP_CONFIG.apiUrl,
  API_URL: APP_CONFIG.apiUrl,
  
  TIMEOUT: 10000,
  
  ENDPOINTS: {
    AUTH: {
      REGISTER: '/api/auth/register',
      LOGIN: '/api/auth/login', 
      LOGOUT: '/api/auth/logout',
      REFRESH: '/api/auth/refresh',
      VERIFY: '/api/auth/verify',
      ME: '/api/auth/me',
      HEALTH: '/health'
    },
    
    PETS: {
      LIST: '/api/pets',
      DETAIL: (id: string) => `/api/pets/${id}`,
      SEARCH: '/api/pets/search',
      IMAGES: (id: string) => `/api/pets/${id}/images`,
      IMAGE_UPLOAD: (id: string) => `/api/pets/${id}/images`,
      IMAGE_DELETE: (id: string, imageId: string) => `/api/pets/${id}/images/${imageId}`,
      HEALTH: '/health'
    },
    
    USERS: {
      LIST: '/api/users',
      DETAIL: (id: string) => `/api/users/${id}`,
      ME: '/api/users/me',
      UPLOAD_AVATAR: '/api/users/me/avatar',
    },
    
    MATCHES: {
      LIST: '/api/matches',
      DETAIL: (id: string) => `/api/matches/${id}`,
      CREATE: '/api/matches',
      FAVORITES: '/api/matches/favorites',
    },
    
    CHAT: {
      ROOMS: '/api/chat/rooms',
      MESSAGES: (roomId: string) => `/api/chat/rooms/${roomId}/messages`,
      WEBSOCKET: '/ws/chat',
    },
    
    FILES: {
      UPLOAD: '/api/files/upload',
      DELETE: (id: string) => `/api/files/${id}`,
    },
  },
  
  // Helper methods for image URLs
  buildThumbnailUrl: (path?: string | null): string => {
    if (!path) return '/images/placeholder-pet.jpg';
    if (path.startsWith('http')) return path;
    return `${APP_CONFIG.apiUrl}${path.startsWith('/') ? path : '/' + path}`;
  },
  
  buildImageUrl: (path?: string | null): string => {
    if (!path) return '/images/placeholder-pet.jpg';
    if (path.startsWith('http')) return path;
    return `${APP_CONFIG.apiUrl}${path.startsWith('/') ? path : '/' + path}`;
  },
  
  // File upload constraints
  FILE_UPLOAD: {
    MAX_SIZE: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '5242880'), // 5MB
    ALLOWED_TYPES: (process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp').split(','),
    MAX_FILES: 10,
  },
} as const;

// Client-side configuration
export const CLIENT_CONFIG = {
  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },
  
  // Search configuration
  SEARCH: {
    DEBOUNCE_MS: 300,
    MIN_QUERY_LENGTH: 2,
  },
  
  // UI configuration
  UI: {
    TOAST_DURATION: 5000,
    MODAL_ANIMATION_DURATION: 200,
    LOADING_DELAY: 300,
  },
  
  // Geolocation
  GEOLOCATION: {
    DEFAULT_RADIUS: 50, // km
    MAX_RADIUS: 500,
    TIMEOUT: 10000,
  },
  
  // WebSocket
  WEBSOCKET: {
    RECONNECT_INTERVAL: 5000,
    MAX_RECONNECT_ATTEMPTS: 5,
    HEARTBEAT_INTERVAL: 30000,
  },
} as const;

// Feature flags
export const FEATURES = {
  ENABLE_CHAT: APP_CONFIG.features.chat,
  ENABLE_NOTIFICATIONS: APP_CONFIG.features.notifications,
  ENABLE_GEOLOCATION: APP_CONFIG.features.geolocation,
  ENABLE_FILE_UPLOAD: APP_CONFIG.features.fileUpload,
  ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_GA_ID !== undefined,
  ENABLE_ERROR_REPORTING: process.env.NEXT_PUBLIC_SENTRY_DSN !== undefined,
} as const;

export default API_CONFIG;
