/**
 * Type definitions for the application
 */

export interface PartPrice {
  name: string;
  price: number;
  source: string;
  seller: string;
}

export interface Opportunity {
  frame_id: string;
  frame_name: string;
  platform: string;
  strategy: string;
  parts: PartPrice[];
  full_set_price: number;
  profit_plat: number;
  profit_margin: number;
  last_updated: string;
  item_type: 'warframe' | 'weapon';
  seller: string;
}

export interface FrameInfo {
  id: string;
  name: string;
  parts: string[];
  is_prime: boolean;
  enabled: boolean;
  item_type: 'warframe' | 'weapon';
}

export interface Config {
  platform: string;
  strategy: string;
  min_profit: number;
  min_margin: number;
  refresh_interval: number;
}

export interface Snapshot {
  timestamp: string;
  set_price: number;
  strategy: string;
}

export interface FrameDetail {
  frame: FrameInfo;
  current_opportunity: Opportunity | null;
  snapshots: Snapshot[];
}

export type Strategy = 'conservative' | 'balanced' | 'aggressive';
export type Platform = 'pc' | 'ps4' | 'xbox' | 'switch';

export interface WebSocketMessage {
  type: 'market_update' | 'opportunity_alert' | 'set_config';
  opportunities?: Opportunity[];
  opportunity?: Opportunity;
  reason?: string;
  timestamp?: string;
}

export interface UserSettings {
  platform: Platform;
  strategy: Strategy;
  minProfit: number;
  minMargin: number;
  watchlist: string[];
}

