const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.message || `エラー: ${response.status}` };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('API Error:', error);
    return { error: 'ネットワークエラーが発生しました' };
  }
}

// Auth response types
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface AuthResponseData {
  message?: string;
  tokens: AuthTokens;
  user: User;
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const result = await fetchApi<{ data: AuthResponseData; success: boolean }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (result.data?.data) {
      return { data: result.data.data };
    }
    return { error: result.error };
  },

  signup: async (data: SignupData) => {
    const result = await fetchApi<{ data: AuthResponseData; success: boolean }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (result.data?.data) {
      return { data: result.data.data };
    }
    return { error: result.error };
  },

  getProfile: async () => {
    const result = await fetchApi<{ data: { user: User }; success: boolean }>('/api/auth/profile');
    if (result.data?.data?.user) {
      return { data: result.data.data.user };
    }
    return { error: result.error };
  },

  updateProfile: async (data: { name?: string; phone?: string; address?: string }) => {
    const result = await fetchApi<{ data: { user: User }; success: boolean }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (result.data?.data?.user) {
      return { data: result.data.data.user };
    }
    return { error: result.error };
  },

  updatePassword: async (data: { current_password: string; new_password: string }) => {
    return fetchApi<void>('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  logout: async () => {
    return fetchApi<void>('/api/auth/logout', {
      method: 'POST',
    });
  },

  refreshToken: async (refreshToken: string) => {
    return fetchApi<{ data: { tokens: AuthTokens }; success: boolean }>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },
};

// Pets API
export const petsApi = {
  getAll: async (params?: PetSearchParams & { owner?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.species) searchParams.set('species', params.species);
    if (params?.gender) searchParams.set('gender', params.gender);
    if (params?.size) searchParams.set('size', params.size);
    if (params?.breed) searchParams.set('breed', params.breed);
    if (params?.owner) searchParams.set('owner', params.owner);

    const query = searchParams.toString();
    return fetchApi<{ pets: Pet[]; total: number }>(`/api/pets${query ? `?${query}` : ''}`);
  },

  getById: async (id: string) => {
    return fetchApi<Pet>(`/api/pets/${id}`);
  },

  getMyPets: async () => {
    return petsApi.getAll({ owner: 'me' });
  },

  create: async (data: CreatePetData) => {
    return fetchApi<{ message: string; pet: Pet }>('/api/pets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<CreatePetData>) => {
    return fetchApi<{ message: string; pet: Pet }>(`/api/pets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return fetchApi<void>(`/api/pets/${id}`, {
      method: 'DELETE',
    });
  },
};

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  type: 'adopter' | 'shelter' | 'individual';
  created_at: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  type: 'adopter' | 'shelter' | 'individual';
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  gender: 'male' | 'female';
  age_months: number;
  age_info: {
    age_text: string;
    years: number;
    months: number;
  };
  weight?: number;
  size: 'small' | 'medium' | 'large';
  status: 'available' | 'pending' | 'adopted';
  description?: string;
  images: string[];
  personality?: string[];
  medical_info?: {
    vaccinated: boolean;
    neutered: boolean;
    health_notes?: string;
  };
  owner_id: string;
  created_at: string;
}

export interface PetSearchParams {
  limit?: number;
  offset?: number;
  species?: string;
  gender?: string;
  size?: string;
  breed?: string;
  age_min?: number;
  age_max?: number;
}

export interface CreatePetData {
  name: string;
  species: string;
  breed: string;
  gender: 'male' | 'female';
  age_years: number;
  age_months?: number;
  is_age_estimated?: boolean;
  weight?: number;
  size: 'small' | 'medium' | 'large';
  description?: string;
  images?: string[];
  personality?: string[];
  vaccinated?: boolean;
  neutered?: boolean;
  health_issues?: string[];
  location?: string;
}

// Favorite types
export interface Favorite {
  id: string;
  user_id: string;
  pet_id: string;
  note?: string;
  created_at: string;
}

export interface FavoritesResponse {
  favorites: Favorite[];
  total: number;
  page: number;
  limit: number;
}

// Inquiry types
export interface Inquiry {
  id: string;
  user_id: string;
  pet_id: string;
  pet_owner_id: string;
  message: string;
  type: 'question' | 'interview' | 'adoption';
  contact_method: 'email' | 'phone';
  phone?: string;
  status: 'sent' | 'replied' | 'scheduled' | 'completed' | 'rejected';
  reply?: string;
  replied_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInquiryData {
  pet_id: string;
  message: string;
  type: 'question' | 'interview' | 'adoption';
  contact_method: 'email' | 'phone';
  phone?: string;
}

// Favorites API
export const favoritesApi = {
  getAll: async (page: number = 1, limit: number = 20) => {
    return fetchApi<FavoritesResponse>(`/api/matches/favorites?page=${page}&limit=${limit}`);
  },

  add: async (petId: string, note?: string) => {
    return fetchApi<{ message: string; favorite: Favorite }>('/api/matches/favorites', {
      method: 'POST',
      body: JSON.stringify({ pet_id: petId, note }),
    });
  },

  remove: async (petId: string) => {
    return fetchApi<void>(`/api/matches/favorites/${petId}`, {
      method: 'DELETE',
    });
  },

  isFavorited: async (petId: string) => {
    const result = await favoritesApi.getAll(1, 100);
    if (result.data) {
      return result.data.favorites.some(fav => fav.pet_id === petId);
    }
    return false;
  },
};

// Inquiries API
export const inquiriesApi = {
  create: async (data: CreateInquiryData) => {
    return fetchApi<{ inquiry: Inquiry }>('/api/v1/inquiries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAll: async () => {
    return fetchApi<{ inquiries: Inquiry[] }>('/api/v1/inquiries');
  },

  getReceived: async () => {
    return fetchApi<{ inquiries: Inquiry[] }>('/api/v1/inquiries/received');
  },

  getById: async (id: string) => {
    return fetchApi<{ inquiry: Inquiry }>(`/api/v1/inquiries/${id}`);
  },

  updateStatus: async (id: string, status: Inquiry['status']) => {
    return fetchApi<{ inquiry: Inquiry }>(`/api/v1/inquiries/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  reply: async (id: string, reply: string) => {
    return fetchApi<{ inquiry: Inquiry }>(`/api/v1/inquiries/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ reply }),
    });
  },
}
