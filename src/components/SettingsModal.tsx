import React from 'react';
import { Dialog } from '@headlessui/react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useUserSettings } from '@/contexts/UserSettingsContext';

const currencyOptions = ['USD', 'USDT', 'BTC', 'EUR', 'GBP', 'JPY', 'CNY'];
const themeOptions = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsModal({ open, onClose }) {
  const {
    currency,
    setCurrency,
    theme,
    setTheme,
    notificationsEnabled,
    setNotificationsEnabled,
  } = useUserSettings();

  return (
    <Dialog open={open} onClose={onClose} className="z-50">
      <div className="fixed inset-0 bg-black/60 z-40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-background rounded-xl shadow-xl w-full max-w-md p-6 relative">
          <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600" onClick={onClose}>&times;</button>
          <h2 className="text-2xl font-bold mb-4">Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Currency</label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Theme</label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Theme" />
                </SelectTrigger>
                <SelectContent>
                  {themeOptions.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <label className="font-medium">Enable Notifications</label>
              <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
            </div>
            <div>
              <button
                className="w-full text-left py-3 px-2 rounded-lg hover:bg-[#23262F] transition font-medium flex items-center"
                onClick={() => { window.location.href = '/settings/language'; }}
              >
                🌐 Language
              </button>
            </div>
            <Button className="w-full mt-4" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
} 