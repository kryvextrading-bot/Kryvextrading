import { supabase } from '@/lib/supabase';

export interface PricePoint {
  price: number;
  volume: number;
  timestamp: Date;
}

export class PriceCacheService {
  private static instance: PriceCacheService;
  private cache: Map<string, PricePoint[]> = new Map();
  private maxCacheSize: number = 300; // Keep last 300 candles (5 minutes at 1s intervals)

  private constructor() {
    // Start cleanup interval
    setInterval(() => this.cleanup(), 60 * 60 * 1000); // Every hour
  }

  static getInstance(): PriceCacheService {
    if (!PriceCacheService.instance) {
      PriceCacheService.instance = new PriceCacheService();
    }
    return PriceCacheService.instance;
  }

  /**
   * Cache a price point
   */
  async cachePrice(pairId: string, price: number, volume?: number): Promise<void> {
    const pricePoint: PricePoint = {
      price,
      volume: volume || 0,
      timestamp: new Date()
    };

    // Update in-memory cache
    if (!this.cache.has(pairId)) {
      this.cache.set(pairId, []);
    }
    
    const pairCache = this.cache.get(pairId)!;
    pairCache.push(pricePoint);
    
    // Keep only last N items
    if (pairCache.length > this.maxCacheSize) {
      pairCache.shift();
    }

    // Persist to database (async, don't await)
    supabase
      .from('price_cache')
      .insert({
        pair_id: pairId,
        price,
        volume: volume || 0,
        timestamp: new Date().toISOString()
      })
      .then(({ error }) => {
        if (error) {
          console.error('Failed to cache price to DB:', error);
        }
      });
  }

  /**
   * Get price at specific timestamp
   */
  async getPriceAt(pairId: string, timestamp: Date): Promise<number | null> {
    // Check memory cache first
    const pairCache = this.cache.get(pairId);
    if (pairCache) {
      // Find closest price within 1 second tolerance
      const targetTime = timestamp.getTime();
      const closest = pairCache.reduce((prev, curr) => {
        const prevDiff = Math.abs(prev.timestamp.getTime() - targetTime);
        const currDiff = Math.abs(curr.timestamp.getTime() - targetTime);
        return prevDiff < currDiff ? prev : curr;
      });

      if (Math.abs(closest.timestamp.getTime() - targetTime) <= 1000) {
        return closest.price;
      }
    }

    // Fallback to database query
    const { data: dbPrice, error } = await supabase
      .from('price_cache')
      .select('price')
      .eq('pair_id', pairId)
      .gte('timestamp', new Date(timestamp.getTime() - 1000).toISOString())
      .lte('timestamp', new Date(timestamp.getTime() + 1000).toISOString())
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error || !dbPrice) {
      return null;
    }

    return Number(dbPrice.price);
  }

  /**
   * Get last known price for a pair
   */
  async getLastPrice(pairId: string): Promise<number | null> {
    // Check memory cache first
    const pairCache = this.cache.get(pairId);
    if (pairCache && pairCache.length > 0) {
      return pairCache[pairCache.length - 1].price;
    }

    // Fallback to database
    const { data: dbPrice, error } = await supabase
      .from('price_cache')
      .select('price')
      .eq('pair_id', pairId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error || !dbPrice) {
      return null;
    }

    return Number(dbPrice.price);
  }

  /**
   * Get price history for a time range
   */
  async getPriceHistory(pairId: string, from: Date, to: Date): Promise<PricePoint[]> {
    const { data: dbPrices, error } = await supabase
      .from('price_cache')
      .select('price, volume, timestamp')
      .eq('pair_id', pairId)
      .gte('timestamp', from.toISOString())
      .lte('timestamp', to.toISOString())
      .order('timestamp', { ascending: true });

    if (error || !dbPrices) {
      return [];
    }

    return dbPrices.map(p => ({
      price: Number(p.price),
      volume: Number(p.volume) || 0,
      timestamp: new Date(p.timestamp)
    }));
  }

  /**
   * Clean up old cache entries
   */
  async cleanup(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    const { error } = await supabase
      .from('price_cache')
      .delete()
      .lt('timestamp', cutoff.toISOString());

    if (error) {
      console.error('Failed to cleanup old price cache:', error);
    }
  }
}
