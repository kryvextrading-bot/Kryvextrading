import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserSettings {
  currency: string;
  setCurrency: (c: string) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (t: 'light' | 'dark' | 'system') => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (v: boolean) => void;
}

const UserSettingsContext = createContext<UserSettings | undefined>(undefined);

const SETTINGS_KEY = 'userSettings';

export const UserSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState('USD');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.currency) setCurrency(parsed.currency);
        if (parsed.theme) setTheme(parsed.theme);
        if (typeof parsed.notificationsEnabled === 'boolean') setNotificationsEnabled(parsed.notificationsEnabled);
      } catch {}
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ currency, theme, notificationsEnabled }));
  }, [currency, theme, notificationsEnabled]);

  return (
    <UserSettingsContext.Provider value={{ currency, setCurrency, theme, setTheme, notificationsEnabled, setNotificationsEnabled }}>
      {children}
    </UserSettingsContext.Provider>
  );
};

export function useUserSettings() {
  const ctx = useContext(UserSettingsContext);
  if (!ctx) throw new Error('useUserSettings must be used within a UserSettingsProvider');
  return ctx;
} 