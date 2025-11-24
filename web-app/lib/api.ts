import axios from 'axios';
import { Pet, PetResponse } from '@/types/Pet';
import { tokenStorage } from '@/lib/auth';
import { API_CONFIG } from '@/lib/config';
import { logger } from '@/lib/logger';
import { cache, createCacheKey, withCache } from '@/lib/cache';

const apiClient = axios.create({
  baseURL: API_CONFIG.API_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor with JWT auto-injection and logging
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log API request
    logger.apiRequest(
      config.method?.toUpperCase() || 'UNKNOWN',
      config.url || 'UNKNOWN',
      config.data
    );

    return config;
  },
  (error) => {
    logger.error('Request interceptor error', error);
    return Promise.reject(error);
  }
);

// Response interceptor with automatic token refresh and logging
apiClient.interceptors.response.use(
  (response) => {
    // Log API response
    logger.apiResponse(
      response.config.method?.toUpperCase() || 'UNKNOWN',
      response.config.url || 'UNKNOWN',
      response.status,
      response.data
    );
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log API error
    logger.apiError(
      originalRequest?.method?.toUpperCase() || 'UNKNOWN',
      originalRequest?.url || 'UNKNOWN',
      error
    );

    // Handle 401 Unauthorized - try token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        try {
          logger.info('Attempting token refresh');
          const refreshResponse = await axios.post(
            `${API_CONFIG.AUTH_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`,
            { refresh_token: refreshToken }
          );

          const newAccessToken = refreshResponse.data.access_token;
          tokenStorage.setTokens(newAccessToken, refreshToken);
          logger.info('Token refresh successful');

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);

        } catch (refreshError) {
          logger.error('Token refresh failed', refreshError);
          tokenStorage.clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

export interface PetCreateRequest {
  name: string;
  species: string;
  breed: string;
  ageYears: number;
  ageMonths: number;
  isEstimated: boolean;
  gender: 'male' | 'female';
  size: 'small' | 'medium' | 'large' | 'extra_large';
  color: string;
  personality: string[];
  description: string;
  location: string;
  medicalInfo: {
    vaccinated: boolean;
    neutered: boolean;
    healthIssues: string[];
  };
}

export const petsApi = {
  // Health check
  healthCheck: async () => {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.PETS.HEALTH);
    return response.data;
  },

  // Get all pets (with caching)
  getPets: async (limit = 20, offset = 0): Promise<PetResponse> => {
    const cacheKey = createCacheKey(API_CONFIG.ENDPOINTS.PETS.LIST, { limit, offset });
    return withCache(
      cacheKey,
      async () => {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.PETS.LIST, {
          params: { limit, offset }
        });
        return response.data;
      },
      2 * 60 * 1000 // 2 minutes cache
    );
  },

  // Get single pet (with caching)
  getPet: async (id: string): Promise<Pet> => {
    const cacheKey = createCacheKey(API_CONFIG.ENDPOINTS.PETS.DETAIL(id));
    return withCache(
      cacheKey,
      async () => {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.PETS.DETAIL(id));
        return response.data;
      },
      5 * 60 * 1000 // 5 minutes cache
    );
  },

  // Create new pet
  createPet: async (petData: PetCreateRequest): Promise<Pet> => {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.PETS.LIST, petData);
    // Invalidate pets list cache
    cache.clear();
    return response.data;
  },

  // Get my pets
  getMyPets: async (limit = 20, offset = 0): Promise<PetResponse> => {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.PETS.LIST, {
      params: { limit, offset, owner: 'me' }
    });
    return response.data;
  },

  // Update pet
  updatePet: async (id: string, petData: Partial<PetCreateRequest>): Promise<Pet> => {
    const response = await apiClient.put(API_CONFIG.ENDPOINTS.PETS.DETAIL(id), petData);
    // Invalidate specific pet cache
    cache.delete(createCacheKey(API_CONFIG.ENDPOINTS.PETS.DETAIL(id)));
    return response.data;
  },

  // Delete pet
  deletePet: async (id: string): Promise<void> => {
    await apiClient.delete(API_CONFIG.ENDPOINTS.PETS.DETAIL(id));
    // Invalidate caches
    cache.delete(createCacheKey(API_CONFIG.ENDPOINTS.PETS.DETAIL(id)));
    cache.clear(); // Clear list caches
  },

  // Image management
  images: {
    // Get pet images
    getPetImages: async (petId: string): Promise<{ images: any[] }> => {
      try {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.PETS.IMAGES(petId));
        return response.data;
      } catch (error) {
        // Return empty array if endpoint doesn't exist yet
        console.warn('Pet images endpoint not implemented yet:', error);
        return { images: [] };
      }
    },

    // Upload pet image
    uploadPetImage: async (petId: string, imageFile: File): Promise<any> => {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      try {
        const response = await apiClient.post(
          API_CONFIG.ENDPOINTS.PETS.IMAGE_UPLOAD(petId),
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        return response.data;
      } catch (error) {
        console.error('Image upload failed:', error);
        throw new Error('画像のアップロードに失敗しました');
      }
    },

    // Delete pet image
    deletePetImage: async (petId: string, imageId: string): Promise<void> => {
      try {
        await apiClient.delete(API_CONFIG.ENDPOINTS.PETS.IMAGE_DELETE(petId, imageId));
      } catch (error) {
        console.error('Image delete failed:', error);
        throw new Error('画像の削除に失敗しました');
      }
    },
  },
};

export default apiClient;
