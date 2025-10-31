/**
 * LocalStorage utilities for persisting user settings
 */

import { DEFAULT_SETTINGS } from './constants';
import type { UserSettings } from './types';

const STORAGE_KEY = 'wth-settings';

export function loadSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

export function toggleWatchlist(frameId: string): string[] {
  const settings = loadSettings();
  const watchlist = settings.watchlist || [];
  const index = watchlist.indexOf(frameId);

  const newWatchlist =
    index >= 0 ? watchlist.filter((id) => id !== frameId) : [...watchlist, frameId];

  saveSettings({ ...settings, watchlist: newWatchlist });
  return newWatchlist;
}

export function isWatched(frameId: string): boolean {
  const settings = loadSettings();
  return (settings.watchlist || []).includes(frameId);
}

