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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
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
    if (params?.location) searchParams.set('location', params.location);
    if (params?.owner) searchParams.set('owner', params.owner);
    if (params?.age_min) searchParams.set('age_min', params.age_min.toString());
    if (params?.age_max) searchParams.set('age_max', params.age_max.toString());
    if (params?.color) searchParams.set('color', params.color);
    if (params?.vaccinated !== undefined) searchParams.set('vaccinated', params.vaccinated.toString());
    if (params?.neutered !== undefined) searchParams.set('neutered', params.neutered.toString());

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
  type: 'adopter' | 'shelter' | 'individual' | 'admin';
  phone?: string;
  address?: string;
  description?: string;
  website?: string;
  profile_image?: string;
  verified?: boolean;
  created_at: string;
}

export interface PublicProfile {
  id: string;
  name: string;
  type: 'shelter' | 'individual';
  address?: string;
  description?: string;
  website?: string;
  profile_image?: string;
  verified: boolean;
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
  location?: string;
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
  location?: string;
  age_min?: number;
  age_max?: number;
  color?: string;
  vaccinated?: boolean;
  neutered?: boolean;
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
};

// Users API (public profiles)
export const usersApi = {
  getPublicProfile: async (userId: string) => {
    return fetchApi<{ profile: PublicProfile }>(`/api/users/${userId}/profile`);
  },

  getUserPets: async (userId: string) => {
    return fetchApi<{ pets: Pet[]; total: number }>(`/api/users/${userId}/pets`);
  },

  listShelters: async (limit: number = 20, offset: number = 0) => {
    return fetchApi<{ shelters: PublicProfile[]; total: number }>(`/api/shelters?limit=${limit}&offset=${offset}`);
  },
};

// Message types
export interface Message {
  id: string;
  inquiry_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at?: string;
  created_at: string;
}

export interface Conversation {
  inquiry_id: string;
  pet_id: string;
  pet_name: string;
  pet_image: string;
  other_user_id: string;
  other_user_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

// Messages API
export const messagesApi = {
  getConversations: async () => {
    return fetchApi<{ conversations: Conversation[] }>('/api/v1/messages/conversations');
  },

  getUnreadCount: async () => {
    return fetchApi<{ unread_count: number }>('/api/v1/messages/unread-count');
  },

  getMessages: async (inquiryId: string, limit: number = 50, offset: number = 0) => {
    return fetchApi<{ messages: Message[] }>(`/api/v1/messages/${inquiryId}?limit=${limit}&offset=${offset}`);
  },

  sendMessage: async (inquiryId: string, receiverId: string, content: string) => {
    return fetchApi<{ message: Message }>(`/api/v1/messages/${inquiryId}`, {
      method: 'POST',
      body: JSON.stringify({ receiver_id: receiverId, content }),
    });
  },

  markAsRead: async (inquiryId: string) => {
    return fetchApi<void>(`/api/v1/messages/${inquiryId}/read`, {
      method: 'PUT',
    });
  },
};

// Notification types
export type NotificationType = 'new_message' | 'inquiry_created' | 'inquiry_updated' | 'pet_liked' | 'new_review' | 'system_alert';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  reference_id?: string;
  read_at?: string;
  created_at: string;
}

// Notifications API
export const notificationsApi = {
  getAll: async (limit: number = 20, offset: number = 0, unreadOnly: boolean = false) => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (unreadOnly) params.set('unread_only', 'true');
    return fetchApi<{ notifications: Notification[]; total: number }>(`/api/v1/notifications?${params}`);
  },

  getUnreadCount: async () => {
    return fetchApi<{ unread_count: number }>('/api/v1/notifications/unread-count');
  },

  markAsRead: async (notificationId: string) => {
    return fetchApi<void>(`/api/v1/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  },

  markAllAsRead: async () => {
    return fetchApi<void>('/api/v1/notifications/mark-all-read', {
      method: 'PUT',
    });
  },

  delete: async (notificationId: string) => {
    return fetchApi<void>(`/api/v1/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  },
};

// Review types
export interface Review {
  id: string;
  reviewer_id: string;
  target_id: string;
  inquiry_id?: string;
  rating: number;
  title?: string;
  content?: string;
  response?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewSummary {
  total_reviews: number;
  average_rating: number;
  rating_counts: Record<number, number>;
}

export interface CreateReviewData {
  target_id: string;
  inquiry_id?: string;
  rating: number;
  title?: string;
  content?: string;
}

// Reviews API
export const reviewsApi = {
  create: async (data: CreateReviewData) => {
    return fetchApi<{ review: Review }>('/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getById: async (reviewId: string) => {
    return fetchApi<{ review: Review }>(`/api/v1/reviews/${reviewId}`);
  },

  getByTarget: async (targetId: string, limit: number = 20, offset: number = 0) => {
    return fetchApi<{ reviews: Review[]; total: number }>(`/api/v1/shelters/${targetId}/reviews?limit=${limit}&offset=${offset}`);
  },

  getSummary: async (targetId: string) => {
    return fetchApi<{ summary: ReviewSummary }>(`/api/v1/shelters/${targetId}/reviews/summary`);
  },

  getMyReviews: async (limit: number = 20, offset: number = 0) => {
    return fetchApi<{ reviews: Review[]; total: number }>(`/api/v1/reviews/my?limit=${limit}&offset=${offset}`);
  },

  update: async (reviewId: string, data: { rating?: number; title?: string; content?: string }) => {
    return fetchApi<{ review: Review }>(`/api/v1/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  addResponse: async (reviewId: string, response: string) => {
    return fetchApi<{ review: Review }>(`/api/v1/reviews/${reviewId}/response`, {
      method: 'POST',
      body: JSON.stringify({ response }),
    });
  },

  delete: async (reviewId: string) => {
    return fetchApi<void>(`/api/v1/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  },
};

// Admin types
export interface DashboardStats {
  total_users: number;
  total_pets: number;
  total_inquiries: number;
  pending_inquiries: number;
  total_reviews: number;
  active_pets: number;
  adopted_pets: number;
  new_users_today: number;
  new_pets_today: number;
}

// Admin API
export const adminApi = {
  getStats: async () => {
    return fetchApi<{ stats: DashboardStats }>('/api/v1/admin/stats');
  },

  getUsers: async (params?: { type?: string; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    const query = searchParams.toString();
    return fetchApi<{ users: User[]; total: number }>(`/api/v1/admin/users${query ? `?${query}` : ''}`);
  },

  updateUserStatus: async (userId: string, verified: boolean) => {
    return fetchApi<void>(`/api/v1/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ verified }),
    });
  },

  getPets: async (params?: { status?: string; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    const query = searchParams.toString();
    return fetchApi<{ pets: Pet[]; total: number }>(`/api/v1/admin/pets${query ? `?${query}` : ''}`);
  },

  deletePet: async (petId: string) => {
    return fetchApi<void>(`/api/v1/admin/pets/${petId}`, {
      method: 'DELETE',
    });
  },

  getInquiries: async (params?: { status?: string; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    const query = searchParams.toString();
    return fetchApi<{ inquiries: Inquiry[]; total: number }>(`/api/v1/admin/inquiries${query ? `?${query}` : ''}`);
  },

  deleteReview: async (reviewId: string) => {
    return fetchApi<void>(`/api/v1/admin/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  },
};
