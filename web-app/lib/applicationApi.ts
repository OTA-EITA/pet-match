import axios from 'axios';
import { API_CONFIG } from './config';

const applicationClient = axios.create({
  baseURL: API_CONFIG.API_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Application {
  id: string;
  user_id: string;
  pet_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  message: string;
  created_at: string;
  updated_at: string;
}

export interface CreateApplicationRequest {
  pet_id: string;
  message: string;
}

export const applicationApi = {
  async createApplication(data: CreateApplicationRequest): Promise<Application> {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await applicationClient.post<{ application: Application }>(
        API_CONFIG.ENDPOINTS.APPLICATIONS.LIST,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data.application;
    } catch (error) {
      console.error('Failed to create application:', error);
      throw error;
    }
  },

  async getApplications(): Promise<Application[]> {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await applicationClient.get<{ applications: Application[] }>(
        API_CONFIG.ENDPOINTS.APPLICATIONS.LIST,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data.applications || [];
    } catch (error) {
      console.error('Failed to get applications:', error);
      throw error;
    }
  },
};
