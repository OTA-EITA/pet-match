import axios from 'axios';
import { API_CONFIG } from '../config/api';
import { StorageService } from '../services/StorageService';

const inquiryClient = axios.create(API_CONFIG);

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

export interface UpdateInquiryStatusRequest {
  status: 'sent' | 'replied' | 'scheduled' | 'completed' | 'rejected';
}

export interface ReplyInquiryRequest {
  reply: string;
}

export interface CreateInquiryRequest {
  pet_id: string;
  message: string;
  type: 'question' | 'interview' | 'adoption';
  contact_method: 'email' | 'phone';
  phone?: string;
}

export const inquiryApi = {
  async createInquiry(data: CreateInquiryRequest): Promise<Inquiry> {
    try {
      const token = await StorageService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await inquiryClient.post<{ inquiry: Inquiry }>('/v1/inquiries', data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data.inquiry;
    } catch (error) {
      console.error('Failed to create inquiry:', error);
      throw error;
    }
  },

  async getInquiries(): Promise<Inquiry[]> {
    try {
      const token = await StorageService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await inquiryClient.get<{ inquiries: Inquiry[] }>('/v1/inquiries', {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data.inquiries || [];
    } catch (error) {
      console.error('Failed to get inquiries:', error);
      throw error;
    }
  },

  async getReceivedInquiries(): Promise<Inquiry[]> {
    try {
      const token = await StorageService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await inquiryClient.get<{ inquiries: Inquiry[] }>('/v1/inquiries/received', {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data.inquiries || [];
    } catch (error) {
      console.error('Failed to get received inquiries:', error);
      throw error;
    }
  },

  async getInquiry(id: string): Promise<Inquiry> {
    try {
      const token = await StorageService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await inquiryClient.get<{ inquiry: Inquiry }>(`/v1/inquiries/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data.inquiry;
    } catch (error) {
      console.error('Failed to get inquiry:', error);
      throw error;
    }
  },

  async updateInquiryStatus(id: string, status: UpdateInquiryStatusRequest['status']): Promise<Inquiry> {
    try {
      const token = await StorageService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await inquiryClient.put<{ inquiry: Inquiry }>(
        `/v1/inquiries/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return response.data.inquiry;
    } catch (error) {
      console.error('Failed to update inquiry status:', error);
      throw error;
    }
  },

  async replyToInquiry(id: string, reply: string): Promise<Inquiry> {
    try {
      const token = await StorageService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await inquiryClient.post<{ inquiry: Inquiry }>(
        `/v1/inquiries/${id}/reply`,
        { reply },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return response.data.inquiry;
    } catch (error) {
      console.error('Failed to reply to inquiry:', error);
      throw error;
    }
  },
};
