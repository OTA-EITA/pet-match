import axios from 'axios';
import { Pet, PetResponse } from '@/types/Pet';
import { tokenStorage } from '@/lib/auth';
import { API_CONFIG } from '@/lib/config';

const apiClient = axios.create({
  baseURL: API_CONFIG.API_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor with JWT auto-injection
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with automatic token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized - try token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(
            `${API_CONFIG.AUTH_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`,
            { refresh_token: refreshToken }
          );
          
          const newAccessToken = refreshResponse.data.access_token;
          tokenStorage.setTokens(newAccessToken, refreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
          
        } catch (refreshError) {
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

export const petApi = {
  // Health check
  healthCheck: async () => {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.PETS.HEALTH);
    return response.data;
  },

  // Get all pets
  getPets: async (limit = 20, offset = 0): Promise<PetResponse> => {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.PETS.LIST, {
      params: { limit, offset }
    });
    return response.data;
  },

  // Get single pet
  getPet: async (id: string): Promise<Pet> => {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.PETS.DETAIL(id));
    return response.data;
  },

  // Create new pet
  createPet: async (petData: PetCreateRequest): Promise<Pet> => {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.PETS.LIST, petData);
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
    return response.data;
  },

  // Delete pet
  deletePet: async (id: string): Promise<void> => {
    await apiClient.delete(API_CONFIG.ENDPOINTS.PETS.DETAIL(id));
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
