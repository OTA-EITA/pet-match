import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  Pet,
  PetResponse,
  PetFormData,
  PetSearchParams,
  User,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  ApiResponse,
  ApiException,
  FileUploadResponse,
} from '@/types';
import { tokenStorage } from '@/lib/auth';
import { API_CONFIG } from '@/lib/config';

// Create typed axios instance
const apiClient = axios.create({
  baseURL: API_CONFIG.API_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Generic API response handler
const handleApiResponse = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  if (!response.data.success) {
    throw new ApiException(
      response.status,
      'API_ERROR',
      response.data.error || 'Unknown error',
      response.data.errors
    );
  }
  
  if (!response.data.data) {
    throw new ApiException(
      response.status,
      'NO_DATA',
      'No data in response'
    );
  }
  
  return response.data.data;
};

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
          const refreshResponse = await axios.post<ApiResponse<AuthResponse>>(
            `${API_CONFIG.AUTH_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`,
            { refresh_token: refreshToken }
          );
          
          if (refreshResponse.data.success && refreshResponse.data.data) {
            const { access_token } = refreshResponse.data.data;
            tokenStorage.setTokens(access_token, refreshToken);
            
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return apiClient(originalRequest);
          }
          
        } catch (refreshError) {
          tokenStorage.clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
      }
    }
    
    // Convert axios errors to ApiExceptions
    if (error.response) {
      throw new ApiException(
        error.response.status,
        error.response.data?.code || 'HTTP_ERROR',
        error.response.data?.message || error.message,
        error.response.data?.errors
      );
    }
    
    throw new ApiException(
      0,
      'NETWORK_ERROR',
      'Network connection failed'
    );
  }
);

// Pet API endpoints
export const petApi = {
  // Health check
  healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await apiClient.get<ApiResponse<{ status: string; timestamp: string }>>(
      API_CONFIG.ENDPOINTS.PETS.HEALTH
    );
    return handleApiResponse(response);
  },

  // Get all pets with search/filter
  getPets: async (params: PetSearchParams & { limit?: number; offset?: number } = {}): Promise<PetResponse> => {
    const { limit = 20, offset = 0, ...searchParams } = params;
    const response = await apiClient.get<ApiResponse<PetResponse>>(
      API_CONFIG.ENDPOINTS.PETS.LIST,
      {
        params: { limit, offset, ...searchParams }
      }
    );
    return handleApiResponse(response);
  },

  // Get single pet
  getPet: async (id: string): Promise<Pet> => {
    const response = await apiClient.get<ApiResponse<Pet>>(
      API_CONFIG.ENDPOINTS.PETS.DETAIL(id)
    );
    return handleApiResponse(response);
  },

  // Create new pet
  createPet: async (petData: PetFormData): Promise<Pet> => {
    const response = await apiClient.post<ApiResponse<Pet>>(
      API_CONFIG.ENDPOINTS.PETS.LIST,
      petData
    );
    return handleApiResponse(response);
  },

  // Update pet
  updatePet: async (id: string, petData: Partial<PetFormData>): Promise<Pet> => {
    const response = await apiClient.put<ApiResponse<Pet>>(
      API_CONFIG.ENDPOINTS.PETS.DETAIL(id),
      petData
    );
    return handleApiResponse(response);
  },

  // Delete pet
  deletePet: async (id: string): Promise<void> => {
    await apiClient.delete(API_CONFIG.ENDPOINTS.PETS.DETAIL(id));
  },

  // Get my pets
  getMyPets: async (limit = 20, offset = 0): Promise<PetResponse> => {
    const response = await apiClient.get<ApiResponse<PetResponse>>(
      API_CONFIG.ENDPOINTS.PETS.LIST,
      {
        params: { limit, offset, owner: 'me' }
      }
    );
    return handleApiResponse(response);
  },

  // Image management
  images: {
    // Get pet images
    getPetImages: async (petId: string): Promise<string[]> => {
      try {
        const response = await apiClient.get<ApiResponse<{ images: string[] }>>(
          API_CONFIG.ENDPOINTS.PETS.IMAGES(petId)
        );
        return handleApiResponse(response).images;
      } catch (error) {
        if (error instanceof ApiException && error.status === 404) {
          return [];
        }
        throw error;
      }
    },

    // Upload pet image
    uploadPetImage: async (petId: string, imageFile: File): Promise<FileUploadResponse> => {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await apiClient.post<ApiResponse<FileUploadResponse>>(
        API_CONFIG.ENDPOINTS.PETS.IMAGE_UPLOAD(petId),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return handleApiResponse(response);
    },

    // Delete pet image
    deletePetImage: async (petId: string, imageId: string): Promise<void> => {
      await apiClient.delete(API_CONFIG.ENDPOINTS.PETS.IMAGE_DELETE(petId, imageId));
    },
  },
};

// Auth API endpoints
export const authApi = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    return handleApiResponse(response);
  },

  // Register
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_CONFIG.ENDPOINTS.AUTH.REGISTER,
      userData
    );
    return handleApiResponse(response);
  },

  // Logout
  logout: async (): Promise<void> => {
    await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_CONFIG.ENDPOINTS.AUTH.REFRESH,
      { refresh_token: refreshToken }
    );
    return handleApiResponse(response);
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>(
      API_CONFIG.ENDPOINTS.AUTH.ME
    );
    return handleApiResponse(response);
  },
};

// User API endpoints
export const userApi = {
  // Get user profile
  getProfile: async (userId?: string): Promise<User> => {
    const endpoint = userId 
      ? API_CONFIG.ENDPOINTS.USERS.DETAIL(userId)
      : API_CONFIG.ENDPOINTS.USERS.ME;
    
    const response = await apiClient.get<ApiResponse<User>>(endpoint);
    return handleApiResponse(response);
  },

  // Update profile
  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await apiClient.put<ApiResponse<User>>(
      API_CONFIG.ENDPOINTS.USERS.ME,
      userData
    );
    return handleApiResponse(response);
  },

  // Upload profile image
  uploadProfileImage: async (imageFile: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await apiClient.post<ApiResponse<FileUploadResponse>>(
      API_CONFIG.ENDPOINTS.USERS.UPLOAD_AVATAR,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return handleApiResponse(response);
  },
};

// Generic request function for custom endpoints
export const makeApiRequest = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await apiClient.request<ApiResponse<T>>({
    method,
    url,
    data,
    ...config,
  });
  return handleApiResponse(response);
};

export default apiClient;
