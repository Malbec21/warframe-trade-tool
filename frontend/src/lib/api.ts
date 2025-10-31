/**
 * API client for backend communication
 */

import { API_URL } from './constants';
import type { Config, FrameDetail, FrameInfo, Opportunity } from './types';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getHealth(): Promise<{ status: string; time: string }> {
    return this.request('/api/v1/healthz');
  }

  async getConfig(): Promise<Config> {
    return this.request('/api/v1/config');
  }

  async getFrames(): Promise<FrameInfo[]> {
    return this.request('/api/v1/frames');
  }

  async getOpportunities(params?: {
    min_profit?: number;
    min_margin?: number;
    strategy?: string;
    platform?: string;
  }): Promise<Opportunity[]> {
    const searchParams = new URLSearchParams();
    if (params?.min_profit !== undefined) {
      searchParams.append('min_profit', params.min_profit.toString());
    }
    if (params?.min_margin !== undefined) {
      searchParams.append('min_margin', params.min_margin.toString());
    }
    if (params?.strategy) {
      searchParams.append('strategy', params.strategy);
    }
    if (params?.platform) {
      searchParams.append('platform', params.platform);
    }

    const query = searchParams.toString();
    const endpoint = `/api/v1/opportunities${query ? `?${query}` : ''}`;
    return this.request(endpoint);
  }

  async getFrameDetail(frameId: string): Promise<FrameDetail> {
    return this.request(`/api/v1/frames/${frameId}`);
  }
}

export const api = new ApiClient(API_URL);

