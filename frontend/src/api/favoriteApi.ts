import apiClient from './petApi';

export interface FavoriteRequest {
  pet_id: string;
  note?: string;
}

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

export const favoriteApi = {
  // Add pet to favorites
  async addFavorite(petId: string, note?: string): Promise<Favorite> {
    const response = await apiClient.post<{ message: string; favorite: Favorite }>(
      '/matches/favorites',
      { pet_id: petId, note }
    );
    return response.data.favorite;
  },

  // Get user's favorites
  async getFavorites(page: number = 1, limit: number = 20): Promise<FavoritesResponse> {
    try {
      const response = await apiClient.get<FavoritesResponse>('/matches/favorites', {
        params: { page, limit }
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        const authError = new Error('ログインが必要です (401)');
        (authError as any).response = error.response;
        throw authError;
      }
      throw error;
    }
  },

  // Remove pet from favorites
  async removeFavorite(petId: string): Promise<void> {
    await apiClient.delete(`/matches/favorites/${petId}`);
  },

  // Check if pet is favorited
  async isFavorited(petId: string): Promise<boolean> {
    try {
      const response = await this.getFavorites(1, 100);
      return response.favorites.some(fav => fav.pet_id === petId);
    } catch {
      return false;
    }
  },
};

export default favoriteApi;
