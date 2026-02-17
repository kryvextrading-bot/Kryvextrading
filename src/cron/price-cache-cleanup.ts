import { PriceCacheService } from '../services/price-cache-service';

/**
 * Runs daily to clean old price cache
 */
class PriceCacheCleanup {
  private static instance: PriceCacheCleanup;
  private intervalId: NodeJS.Timeout | null = null;
  private priceCache: PriceCacheService;

  private constructor() {
    this.priceCache = PriceCacheService.getInstance();
  }

  static getInstance(): PriceCacheCleanup {
    if (!PriceCacheCleanup.instance) {
      PriceCacheCleanup.instance = new PriceCacheCleanup();
    }
    return PriceCacheCleanup.instance;
  }

  /**
   * Start the price cache cleanup
   */
  start(): void {
    if (this.intervalId) {
      console.log('⚠️ Price cache cleanup already running');
      return;
    }

    console.log('🧹 Starting price cache cleanup...');
    
    // Run immediately on start
    this.cleanup();
    
    // Then run daily (24 hours = 86,400,000 milliseconds)
    this.intervalId = setInterval(() => {
      this.cleanup();
    }, 24 * 60 * 60 * 1000);

    console.log('✅ Price cache cleanup started');
  }

  /**
   * Stop the price cache cleanup
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ Price cache cleanup stopped');
    }
  }

  /**
   * Clean up old cache entries
   */
  private async cleanup(): Promise<void> {
    try {
      console.log('🧹 Cleaning old price cache...');
      await this.priceCache.cleanup();
      console.log('✅ Price cache cleanup completed');
    } catch (error) {
      console.error('❌ Error in price cache cleanup:', error);
    }
  }
}

// Export singleton instance
export const priceCacheCleanup = PriceCacheCleanup.getInstance();

// Auto-start if this module is imported
if (typeof window === 'undefined') {
  // Server-side only
  priceCacheCleanup.start();
}
