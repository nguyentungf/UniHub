import { create } from 'zustand';
import { UserSettings } from '@/types';
import { settingsRepository, dataAccessLayer } from '@/lib/storage/dal';
import { DatabaseMode, getDatabaseMode } from '@/lib/storage/db';

export interface SettingsState {
  settings: UserSettings;
  databaseMode: DatabaseMode;
  loadSettings: () => void;
  updateSettings: (updates: Partial<UserSettings>) => UserSettings;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  switchDatabaseMode: (mode: DatabaseMode) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: settingsRepository.get(),
  databaseMode: getDatabaseMode(),

  loadSettings: () => {
    const fresh = settingsRepository.get();
    set({ settings: fresh, databaseMode: getDatabaseMode() });
  },

  switchDatabaseMode: async (mode: DatabaseMode) => {
    await dataAccessLayer.switchDatabaseMode(mode);
    set({ databaseMode: mode, settings: settingsRepository.get() });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  },

  updateSettings: (updates: Partial<UserSettings>) => {
    const current = get().settings;
    const updated = { ...current, ...updates };
    set({ settings: updated });
    settingsRepository.save(updated);
    return updated;
  },

  setTheme: (theme: 'light' | 'dark' | 'system') => {
    const updated = get().updateSettings({ theme });
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (theme === 'dark' || (theme === 'system' && prefersDark)) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  },
}));
