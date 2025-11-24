import axios from 'axios';
import { API_CONFIG } from './config';
import { Pet } from '@/types/Pet';

const favoritesClient = axios.create({
  baseURL: API_CONFIG.API_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface FavoriteResponse {
  favorites: Pet[];
}

export const favoritesApi = {
  async getFavorites(): Promise<Pet[]> {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await favoritesClient.get<FavoriteResponse>(
        API_CONFIG.ENDPOINTS.FAVORITES.LIST,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data.favorites || [];
    } catch (error) {
      console.error('Failed to get favorites:', error);
      throw error;
    }
  },

  async addFavorite(petId: string): Promise<void> {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token available');
      }

      await favoritesClient.post(
        API_CONFIG.ENDPOINTS.FAVORITES.ADD,
        { pet_id: petId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      console.error('Failed to add favorite:', error);
      throw error;
    }
  },

  async removeFavorite(petId: string): Promise<void> {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token available');
      }

      await favoritesClient.delete(
        API_CONFIG.ENDPOINTS.FAVORITES.REMOVE(petId),
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      throw error;
    }
  },
};
