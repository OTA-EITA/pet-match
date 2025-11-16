import apiClient from './api';
import { API_CONFIG } from './config';

// Search query parameters
export interface SearchQuery {
  species?: string;
  breeds?: string[];
  age_min?: number;
  age_max?: number;
  gender?: 'male' | 'female';
  size?: 'small' | 'medium' | 'large';
  location?: {
    latitude: number;
    longitude: number;
  };
  max_radius?: number;
  good_with_kids?: boolean;
  good_with_pets?: boolean;
  special_needs?: boolean;
  available?: boolean;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'age' | 'distance';
  sort_order?: 'asc' | 'desc';
}

export interface SearchResponse {
  cats: any[];
  total: number;
  page: number;
  limit: number;
  filters?: SearchQuery;
}

export interface SuggestionResponse {
  cats: any[];
  type: 'similar' | 'nearby' | 'new';
  total: number;
  limit: number;
}

export interface ApplicationRequest {
  cat_id: string;
  organization_id: string;
  message: string;
  user_info: {
    experience: 'beginner' | 'intermediate' | 'advanced';
    housing_type: string;
    has_yard: boolean;
    has_other_pets: boolean;
    has_children: boolean;
    children_ages?: number[];
  };
}

export interface Application {
  id: string;
  user_id: string;
  cat_id: string;
  organization_id: string;
  status: string;
  message: string;
  user_info: any;
  created_at: string;
  updated_at: string;
  responded_at?: string;
  response_note?: string;
}

// Search API
export const searchApi = {
  // Search cats
  searchCats: async (query: SearchQuery): Promise<SearchResponse> => {
    const params = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v.toString()));
        } else if (typeof value === 'object') {
          // Skip complex objects for now (location will be handled separately)
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await apiClient.get(
      `${API_CONFIG.ENDPOINTS.SEARCH.CATS}?${params.toString()}`
    );
    return response.data;
  },

  // Get cat detail
  getCatDetail: async (id: string): Promise<any> => {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.SEARCH.CAT_DETAIL(id));
    return response.data;
  },
};

// Suggestion API
export const suggestionApi = {
  // Get similar cats
  getSimilarCats: async (catId: string, limit = 10): Promise<SuggestionResponse> => {
    const response = await apiClient.get(
      `${API_CONFIG.ENDPOINTS.SUGGESTIONS.SIMILAR(catId)}?limit=${limit}`
    );
    return response.data;
  },

  // Get nearby cats
  getNearbyCats: async (latitude: number, longitude: number, limit = 10): Promise<SuggestionResponse> => {
    const response = await apiClient.get(
      `${API_CONFIG.ENDPOINTS.SUGGESTIONS.NEARBY}?latitude=${latitude}&longitude=${longitude}&limit=${limit}`
    );
    return response.data;
  },

  // Get new cats
  getNewCats: async (limit = 10): Promise<SuggestionResponse> => {
    const response = await apiClient.get(
      `${API_CONFIG.ENDPOINTS.SUGGESTIONS.NEW}?limit=${limit}`
    );
    return response.data;
  },
};

// Application API
export const applicationApi = {
  // Create application
  createApplication: async (request: ApplicationRequest): Promise<Application> => {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.APPLICATIONS.LIST, request);
    return response.data;
  },

  // Get my applications
  getMyApplications: async (page = 1, limit = 20, status?: string): Promise<any> => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (status) params.append('status', status);

    const response = await apiClient.get(
      `${API_CONFIG.ENDPOINTS.APPLICATIONS.LIST}?${params.toString()}`
    );
    return response.data;
  },

  // Get application detail
  getApplication: async (id: string): Promise<any> => {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.APPLICATIONS.DETAIL(id));
    return response.data;
  },

  // Update application status (cancel only)
  updateApplicationStatus: async (id: string, status: string, note?: string): Promise<void> => {
    await apiClient.put(API_CONFIG.ENDPOINTS.APPLICATIONS.STATUS(id), { status, response_note: note });
  },

  // Cancel application
  cancelApplication: async (id: string): Promise<void> => {
    await apiClient.delete(API_CONFIG.ENDPOINTS.APPLICATIONS.DETAIL(id));
  },

  // Get application stats
  getApplicationStats: async (): Promise<any> => {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.APPLICATIONS.STATS);
    return response.data;
  },
};

// Favorites API
export const favoritesApi = {
  // Get favorites
  getFavorites: async (page = 1, limit = 20): Promise<any> => {
    const response = await apiClient.get(
      `${API_CONFIG.ENDPOINTS.FAVORITES.LIST}?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Add favorite
  addFavorite: async (petId: string, note?: string): Promise<void> => {
    await apiClient.post(API_CONFIG.ENDPOINTS.FAVORITES.ADD, { pet_id: petId, note });
  },

  // Remove favorite
  removeFavorite: async (petId: string): Promise<void> => {
    await apiClient.delete(API_CONFIG.ENDPOINTS.FAVORITES.REMOVE(petId));
  },
};

// Preferences API
export const preferencesApi = {
  // Get preferences
  getPreferences: async (): Promise<any> => {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.PREFERENCES.GET);
    return response.data;
  },

  // Set preferences
  setPreferences: async (preferences: any): Promise<any> => {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.PREFERENCES.SET, preferences);
    return response.data;
  },

  // Update preferences
  updatePreferences: async (preferences: any): Promise<any> => {
    const response = await apiClient.put(API_CONFIG.ENDPOINTS.PREFERENCES.UPDATE, preferences);
    return response.data;
  },
};
