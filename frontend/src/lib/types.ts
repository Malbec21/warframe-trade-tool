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
  min_profit: number;
  min_margin: number;
  refresh_interval: number;
}

export interface Snapshot {
  timestamp: string;
  set_price: number;
}

export interface FrameDetail {
  frame: FrameInfo;
  current_opportunity: Opportunity | null;
  snapshots: Snapshot[];
}

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
  minProfit: number;
  minMargin: number;
  watchlist: string[];
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  is_active: boolean;
}

// ============================================================================
// Trade Session Types
// ============================================================================

export interface TradePart {
  id: number;
  part_name: string;
  purchase_price: number;
  purchase_date: string;
  notes?: string;
}

export interface TradeSession {
  id: number;
  user_id: number;
  item_id: string;
  item_name: string;
  item_type: string;
  set_sell_price?: number;
  total_cost: number;
  profit?: number;
  status: 'in_progress' | 'completed';
  created_at: string;
  completed_at?: string;
  parts: TradePart[];
}

export interface TradeSessionCreate {
  item_id: string;
  item_name: string;
  item_type?: string;
}

export interface TradePartCreate {
  part_name: string;
  purchase_price: number;
  purchase_date?: string;
  notes?: string;
}

// ============================================================================
// Price History Types
// ============================================================================

export interface PriceHistoryPoint {
  item_id: string;
  part_name: string;
  price: number;
  seller: string;
  platform: string;
  timestamp: string;
}

export interface PriceHistorySummary {
  part_name: string;
  current_price: number;
  lowest_48h: number;
  highest_48h: number;
  average_48h: number;
  price_trend: 'up' | 'down' | 'stable';
  history: PriceHistoryPoint[];
}

