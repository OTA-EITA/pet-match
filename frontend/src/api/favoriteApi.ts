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
    try {
      const response = await apiClient.post<{ message: string; favorite: Favorite }>(
        '/matches/favorites',
        { pet_id: petId, note }
      );
      console.log('Favorite added:', response.data);
      return response.data.favorite;
    } catch (error) {
      console.error('Failed to add favorite:', error);
      throw error;
    }
  },

  // Get user's favorites
  async getFavorites(page: number = 1, limit: number = 20): Promise<FavoritesResponse> {
    try {
      const response = await apiClient.get<FavoritesResponse>('/matches/favorites', {
        params: { page, limit }
      });
      console.log('Favorites fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      throw error;
    }
  },

  // Remove pet from favorites
  async removeFavorite(petId: string): Promise<void> {
    try {
      await apiClient.delete(`/matches/favorites/${petId}`);
      console.log('Favorite removed:', petId);
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      throw error;
    }
  },

  // Check if pet is favorited
  async isFavorited(petId: string): Promise<boolean> {
    try {
      const response = await this.getFavorites(1, 100); // Get first 100 favorites
      return response.favorites.some(fav => fav.pet_id === petId);
    } catch (error) {
      console.error('Failed to check if favorited:', error);
      return false;
    }
  },
};

export default favoriteApi;
