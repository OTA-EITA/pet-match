// API Configuration
export const API_CONFIG = {
  AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:8080',
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  
  TIMEOUT: 10000,
  
  ENDPOINTS: {
    AUTH: {
      REGISTER: '/api/auth/register',
      LOGIN: '/api/auth/login', 
      REFRESH: '/api/auth/refresh',
      VERIFY: '/api/auth/verify',
      HEALTH: '/health'
    },
    
    PETS: {
      LIST: '/api/pets',
      DETAIL: (id: string) => `/api/pets/${id}`,
      IMAGES: (id: string) => `/api/pets/${id}/images`,
      IMAGE_UPLOAD: (id: string) => `/api/pets/${id}/images`,
      IMAGE_DELETE: (id: string, imageId: string) => `/api/pets/${id}/images/${imageId}`,
      HEALTH: '/health'
    },

    // New search and suggestion endpoints
    SEARCH: {
      CATS: '/search/cats',
      CAT_DETAIL: (id: string) => `/search/cats/${id}`,
    },

    SUGGESTIONS: {
      SIMILAR: (catId: string) => `/suggestions/similar/${catId}`,
      NEARBY: '/suggestions/nearby',
      NEW: '/suggestions/new',
    },

    APPLICATIONS: {
      LIST: '/applications',
      DETAIL: (id: string) => `/applications/${id}`,
      STATUS: (id: string) => `/applications/${id}/status`,
      STATS: '/applications/stats',
    },

    FAVORITES: {
      LIST: '/matches/favorites',
      ADD: '/matches/favorites',
      REMOVE: (petId: string) => `/matches/favorites/${petId}`,
    },

    PREFERENCES: {
      GET: '/matches/preferences',
      SET: '/matches/preferences',
      UPDATE: '/matches/preferences',
    },
  },
  
  // Helper methods for image URLs
  buildThumbnailUrl: (path: string): string => {
    if (!path) return '/placeholder-pet.jpg';
    if (path.startsWith('http')) return path;
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${path.startsWith('/') ? path : '/' + path}`;
  },
  
  buildImageUrl: (path: string): string => {
    if (!path) return '/placeholder-pet.jpg';
    if (path.startsWith('http')) return path;
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${path.startsWith('/') ? path : '/' + path}`;
  }
} as const;

export default API_CONFIG;
