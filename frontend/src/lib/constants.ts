/**
 * Application constants
 */

export const PLATFORMS = [
  { value: 'pc', label: 'PC' },
  { value: 'ps4', label: 'PlayStation' },
  { value: 'xbox', label: 'Xbox' },
  { value: 'switch', label: 'Switch' },
] as const;

export const DEFAULT_SETTINGS = {
  platform: 'pc' as const,
  minProfit: 0,
  minMargin: 0,
  watchlist: [],
};

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

