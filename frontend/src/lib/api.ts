/**
 * API client for backend communication
 */

import { API_URL } from './constants';
import type { Config, FrameDetail, FrameInfo, Opportunity, User, TradeSession, TradeSessionCreate, TradePartCreate, PriceHistorySummary } from './types';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Load token from localStorage
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    // Add auth token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} ${error}`);
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

  async getFrameDetails(frameId: string): Promise<any> {
    return this.request(`/api/v1/frames/${frameId}`);
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

  // ============================================================================
  // Authentication
  // ============================================================================

  async signup(username: string, email: string, password: string): Promise<{ access_token: string; user: User }> {
    return this.request('/api/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  async login(username: string, password: string): Promise<{ access_token: string; user: User }> {
    return this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  // ============================================================================
  // Trade Sessions
  // ============================================================================

  async createTradeSession(data: TradeSessionCreate): Promise<TradeSession> {
    return this.request('/api/v1/trades', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addPartToSession(sessionId: number, part: TradePartCreate): Promise<any> {
    return this.request(`/api/v1/trades/${sessionId}/parts`, {
      method: 'POST',
      body: JSON.stringify(part),
    });
  }

  async updateTradeSession(sessionId: number, data: { set_sell_price?: number; status?: string }): Promise<TradeSession> {
    return this.request(`/api/v1/trades/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getTradeSession(sessionId: number): Promise<TradeSession> {
    return this.request(`/api/v1/trades/${sessionId}`);
  }

  async listTradeSessions(params?: { status_filter?: string; days?: number }): Promise<{
    sessions: TradeSession[];
    total_sessions: number;
    total_profit: number;
    completed_sessions: number;
    in_progress_sessions: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.status_filter) {
      searchParams.append('status_filter', params.status_filter);
    }
    if (params?.days !== undefined) {
      searchParams.append('days', params.days.toString());
    }

    const query = searchParams.toString();
    const endpoint = `/api/v1/trades${query ? `?${query}` : ''}`;
    return this.request(endpoint);
  }

  async deleteTradeSession(sessionId: number): Promise<void> {
    await fetch(`${this.baseUrl}/api/v1/trades/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });
  }

  // ============================================================================
  // Price History
  // ============================================================================

  async getPriceHistory(itemId: string, platform: string = 'pc', hours: number = 48): Promise<PriceHistorySummary[]> {
    const searchParams = new URLSearchParams({ platform, hours: hours.toString() });
    return this.request(`/api/v1/prices/history/${itemId}?${searchParams.toString()}`);
  }

  async getLowestPrices(itemId: string, platform: string = 'pc', hours: number = 48): Promise<Record<string, number>> {
    const searchParams = new URLSearchParams({ platform, hours: hours.toString() });
    return this.request(`/api/v1/prices/lowest/${itemId}?${searchParams.toString()}`);
  }
}

export const api = new ApiClient(API_URL);

