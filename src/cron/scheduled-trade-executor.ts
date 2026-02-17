import { OptionsTradingService } from '../services/options-trading-service';

/**
 * Runs every second to execute scheduled trades
 */
class ScheduledTradeExecutor {
  private static instance: ScheduledTradeExecutor;
  private intervalId: NodeJS.Timeout | null = null;
  private optionsService: OptionsTradingService;

  private constructor() {
    this.optionsService = OptionsTradingService.getInstance();
  }

  static getInstance(): ScheduledTradeExecutor {
    if (!ScheduledTradeExecutor.instance) {
      ScheduledTradeExecutor.instance = new ScheduledTradeExecutor();
    }
    return ScheduledTradeExecutor.instance;
  }

  /**
   * Start the scheduled trade executor
   */
  start(): void {
    if (this.intervalId) {
      console.log('⚠️ Scheduled trade executor already running');
      return;
    }

    console.log('⏰ Starting scheduled trade executor...');
    
    // Run immediately on start
    this.executeScheduledTrades();
    
    // Then run every second
    this.intervalId = setInterval(() => {
      this.executeScheduledTrades();
    }, 1000);

    console.log('✅ Scheduled trade executor started');
  }

  /**
   * Stop the scheduled trade executor
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ Scheduled trade executor stopped');
    }
  }

  /**
   * Execute scheduled trades that are due
   */
  private async executeScheduledTrades(): Promise<void> {
    try {
      console.log('⏰ Executing scheduled trades...');
      await this.optionsService.executeScheduledTrades();
    } catch (error) {
      console.error('❌ Error in scheduled trade executor:', error);
    }
  }
}

// Export singleton instance
export const scheduledTradeExecutor = ScheduledTradeExecutor.getInstance();

// Auto-start if this module is imported
if (typeof window === 'undefined') {
  // Server-side only
  scheduledTradeExecutor.start();
}
