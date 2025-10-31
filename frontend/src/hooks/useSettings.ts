/**
 * Hook for managing user settings with localStorage persistence
 */

import { useEffect, useState } from 'react';
import { loadSettings, saveSettings } from '../lib/storage';
import type { UserSettings } from '../lib/types';

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSettings = (updates: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  return {
    settings,
    updateSettings,
  };
}

