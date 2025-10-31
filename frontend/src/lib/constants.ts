/**
 * Application constants
 */

export const STRATEGIES = [
  {
    value: 'conservative',
    label: 'Conservative',
    description: 'Median sell orders / Highest buy order',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: '35th percentile sell / Median sell for set',
  },
  {
    value: 'aggressive',
    label: 'Aggressive',
    description: '20th percentile sell / 65th percentile sell',
  },
] as const;

export const PLATFORMS = [
  { value: 'pc', label: 'PC' },
  { value: 'ps4', label: 'PlayStation' },
  { value: 'xbox', label: 'Xbox' },
  { value: 'switch', label: 'Switch' },
] as const;

export const DEFAULT_SETTINGS = {
  platform: 'pc' as const, // warframe.market only has PC data
  strategy: 'balanced' as const,
  minProfit: 0,
  minMargin: 0,
  watchlist: [],
};

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

