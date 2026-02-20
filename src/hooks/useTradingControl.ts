import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import tradingControlApi, { TradeOutcome, TradeWindow, SystemSettings } from '@/services/tradingControlApi';
import { supabase } from '@/lib/supabase';

export function useTradingControl() {
  const { user } = useAuth();
  const [userOutcome, setUserOutcome] = useState<TradeOutcome | null>(null);
  const [activeWindows, setActiveWindows] = useState<TradeWindow[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<string>('');

  // Load all trading control data
  const loadControls = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const [outcome, windows, settings] = await Promise.all([
        tradingControlApi.getUserOutcome(user.id),
        tradingControlApi.getUserWindows(user.id),
        tradingControlApi.getSystemSettings()
      ]);

      setUserOutcome(outcome);
      setActiveWindows(windows);
      setSystemSettings(settings);
    } catch (error) {
      console.error('Failed to load trading controls:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Check if user should win a specific trade
  const shouldWin = useCallback(async (tradeType: string): Promise<boolean> => {
    if (!user?.id) return false;
    return tradingControlApi.checkTradeOutcome(user.id, tradeType);
  }, [user?.id]);

  // Get current active window
  const getActiveWindow = useCallback((): TradeWindow | undefined => {
    const now = new Date();
    return activeWindows.find(w => {
      const start = new Date(w.start_time);
      const end = new Date(w.end_time);
      return now >= start && now <= end;
    });
  }, [activeWindows]);

  // Update countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const activeWindow = getActiveWindow();
      if (!activeWindow) {
        setCountdown('');
        return;
      }

      const now = new Date();
      const end = new Date(activeWindow.end_time);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setCountdown(`${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [getActiveWindow]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    loadControls();

    const subscription = supabase
      .channel('trading-controls')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trade_outcomes',
          filter: `user_id=eq.${user.id}` 
        },
        loadControls
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trade_windows',
          filter: `user_id=eq.${user.id}` 
        },
        loadControls
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, loadControls]);

  return {
    userOutcome,
    activeWindows,
    systemSettings,
    loading,
    countdown,
    shouldWin,
    getActiveWindow,
    reload: loadControls
  };
}
