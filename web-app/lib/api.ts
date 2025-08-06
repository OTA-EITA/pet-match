import axios from 'axios';
import { Pet, PetResponse } from '@/types/Pet';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:18081';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status}`, response.data);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface UploadedImage {
  id: string;
  pet_id: string;
  file_name: string;
  original_url: string;
  thumbnail_url: string;
  file_size: number;
  mime_type: string;
  width: number;
  height: number;
  is_main: boolean;
  uploaded_at: string;
}

export interface ImageUploadResponse {
  image: UploadedImage;
  message: string;
}

export interface ImagesListResponse {
  images: UploadedImage[];
  total: number;
}

export const petApi = {
  // Health check
  healthCheck: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Get all pets
  getPets: async (limit = 20, offset = 0): Promise<PetResponse> => {
    const response = await apiClient.get('/pets', {
      params: { limit, offset }
    });
    return response.data;
  },

  // Get single pet
  getPet: async (id: string): Promise<Pet> => {
    const response = await apiClient.get(`/pets/${id}`);
    return response.data;
  },

  // Search pets
  searchPets: async (query: string, limit = 20, offset = 0): Promise<PetResponse> => {
    const response = await apiClient.get('/pets/search', {
      params: { q: query, limit, offset }
    });
    return response.data;
  },

  // Image-related APIs
  images: {
    // Get pet images
    getPetImages: async (petId: string): Promise<ImagesListResponse> => {
      const response = await apiClient.get(`/pets/${petId}/images`);
      return response.data;
    },

    // Upload pet image
    uploadPetImage: async (petId: string, file: File, isMain: boolean = false): Promise<ImageUploadResponse> => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('is_main', isMain.toString());

      const response = await apiClient.post(`/pets/${petId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': 'Bearer DEV_TOKEN', // Fixed: Use DEV_TOKEN
        },
      });
      return response.data;
    },

    // Delete pet image
    deletePetImage: async (petId: string, imageId: string): Promise<void> => {
      await apiClient.delete(`/pets/${petId}/images/${imageId}`, {
        headers: {
          'Authorization': 'Bearer DEV_TOKEN', // Fixed: Use DEV_TOKEN
        },
      });
    },
  }
};

export default apiClient;
