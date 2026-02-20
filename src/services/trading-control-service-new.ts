import { supabase } from '@/lib/supabase';

export interface TradingWindow {
  id: string;
  outcomeType: 'win' | 'loss' | 'random';
  winRate: number;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
}

export class TradingControlService {
  private static instance: TradingControlService;
  private activeWindows: Map<string, TradingWindow> = new Map();

  private constructor() {
    // Refresh active windows every minute
    setInterval(() => this.refreshActiveWindows(), 60 * 1000);
    this.refreshActiveWindows();
  }

  static getInstance(): TradingControlService {
    if (!TradingControlService.instance) {
      TradingControlService.instance = new TradingControlService();
    }
    return TradingControlService.instance;
  }

  /**
   * Refresh active windows from database
   */
  private async refreshActiveWindows(): Promise<void> {
    const now = new Date().toISOString();
    const { data: windows, error } = await supabase
      .from('trading_windows')
      .select('*')
      .eq('is_active', true)
      .lte('start_time', now)
      .gte('end_time', now);

    if (error) {
      console.error('Error fetching trading windows:', error);
      return;
    }

    this.activeWindows.clear();
    windows.forEach(window => {
      this.activeWindows.set(window.id, {
        id: window.id,
        outcomeType: window.outcome_type as any,
        winRate: Number(window.win_rate),
        startTime: new Date(window.start_time),
        endTime: new Date(window.end_time),
        isActive: window.is_active
      });
    });
  }

  /**
   * Determine if a user should win a trade
   */
  async shouldUserWin(userId: string, tradeType: string): Promise<boolean> {
    // Check for active windows
    if (this.activeWindows.size === 0) {
      // Default behavior - 60% win rate
      return Math.random() < 0.6;
    }

    // Use the most restrictive window
    const windows = Array.from(this.activeWindows.values());
    
    for (const window of windows) {
      switch (window.outcomeType) {
        case 'win':
          return true;
        case 'loss':
          return false;
        case 'random':
          return Math.random() < (window.winRate / 100);
      }
    }

    // Default fallback
    return Math.random() < 0.6;
  }

  /**
   * Create a new trading window (admin only)
   */
  async createTradingWindow(data: {
    outcomeType: 'win' | 'loss' | 'random';
    winRate?: number;
    startTime: Date;
    endTime: Date;
    description?: string;
    createdBy: string;
  }): Promise<TradingWindow> {
    const { data: window, error } = await supabase
      .from('trading_windows')
      .insert({
        outcome_type: data.outcomeType,
        win_rate: data.winRate,
        start_time: data.startTime.toISOString(),
        end_time: data.endTime.toISOString(),
        description: data.description,
        created_by: data.createdBy,
        is_active: true
      })
      .select()
      .single();

    if (error || !window) {
      throw new Error('Failed to create trading window');
    }

    await this.refreshActiveWindows();
    
    return {
      id: window.id,
      outcomeType: window.outcome_type as any,
      winRate: Number(window.win_rate),
      startTime: new Date(window.start_time),
      endTime: new Date(window.end_time),
      isActive: window.is_active
    };
  }

  /**
   * Get active windows
   */
  getActiveWindows(): TradingWindow[] {
    return Array.from(this.activeWindows.values());
  }

  /**
   * Get countdown to next window change
   */
  getNextWindowChange(): number | null {
    const now = Date.now();
    const windows = Array.from(this.activeWindows.values());
    
    if (windows.length === 0) {
      return null;
    }

    const nextEnd = Math.min(...windows.map(w => w.endTime.getTime()));
    return Math.max(0, nextEnd - now);
  }
}
