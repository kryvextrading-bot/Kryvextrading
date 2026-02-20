import { OptionsTradingService } from '../services/options-trading-service';

/**
 * Runs every second to check and settle expired options
 */
class OptionExpiryChecker {
  private static instance: OptionExpiryChecker;
  private intervalId: NodeJS.Timeout | null = null;
  private optionsService: OptionsTradingService;

  private constructor() {
    this.optionsService = OptionsTradingService.getInstance();
  }

  static getInstance(): OptionExpiryChecker {
    if (!OptionExpiryChecker.instance) {
      OptionExpiryChecker.instance = new OptionExpiryChecker();
    }
    return OptionExpiryChecker.instance;
  }

  /**
   * Start the expiry checker
   */
  start(): void {
    if (this.intervalId) {
      console.log('⚠️ Option expiry checker already running');
      return;
    }

    console.log('🔍 Starting option expiry checker...');
    
    // Run immediately on start
    this.checkExpiredOptions();
    
    // Then run every second
    this.intervalId = setInterval(() => {
      this.checkExpiredOptions();
    }, 1000);

    console.log('✅ Option expiry checker started');
  }

  /**
   * Stop the expiry checker
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ Option expiry checker stopped');
    }
  }

  /**
   * Check for expired options and settle them
   */
  private async checkExpiredOptions(): Promise<void> {
    try {
      console.log('🔍 Checking expired options...');
      await this.optionsService.checkExpiredOptions();
    } catch (error) {
      console.error('❌ Error in option expiry checker:', error);
    }
  }
}

// Export singleton instance
export const optionExpiryChecker = OptionExpiryChecker.getInstance();

// Auto-start if this module is imported
if (typeof window === 'undefined') {
  // Server-side only
  optionExpiryChecker.start();
}
