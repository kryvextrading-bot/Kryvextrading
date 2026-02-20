import { supabase } from '@/lib/supabase';
import { OptionsTradingService } from '@/services/options-trading-service';

const optionsService = OptionsTradingService.getInstance();

// Validation schemas
const createOptionSchema = {
  pairId: (value: string) => {
    if (!value || typeof value !== 'string') {
      throw new Error('Pair ID is required');
    }
    return true;
  },
  direction: (value: string) => {
    if (!['UP', 'DOWN'].includes(value)) {
      throw new Error('Direction must be UP or DOWN');
    }
    return true;
  },
  stake: (value: number) => {
    if (!value || value <= 0) {
      throw new Error('Stake must be positive');
    }
    return true;
  },
  duration: (value: number) => {
    if (!value || value < 60 || value > 600) {
      throw new Error('Duration must be between 60 and 600 seconds');
    }
    return true;
  },
  fluctuationRange: (value: number) => {
    if (!value || value <= 0) {
      throw new Error('Fluctuation range must be positive');
    }
    return true;
  },
  payoutRate: (value: number) => {
    if (!value || value <= 0) {
      throw new Error('Payout rate must be positive');
    }
    return true;
  }
};

const scheduleOptionSchema = {
  ...createOptionSchema,
  scheduledTime: (value: string) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid scheduled time format');
    }
    return true;
  }
};

/**
 * Get current price for a pair (from cache or external API)
 */
async function getCurrentPrice(pairId: string): Promise<number> {
  try {
    // Try to get from price cache first
    const { data: priceData } = await supabase
      .from('price_cache')
      .select('price')
      .eq('pair_id', pairId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (priceData) {
      return Number(priceData.price);
    }

    // Fallback to mock price for demo
    const mockPrices: Record<string, number> = {
      'XAUUSDT': 4909.35,
      'BTCUSDT': 67000,
      'ETHUSDT': 3500
    };

    return mockPrices[pairId] || 4909.35;
  } catch (error) {
    console.error('Error getting current price:', error);
    return 4909.35; // Fallback price
  }
}

/**
 * Create and execute an option order immediately
 */
export async function createOptionOrder(req: any, res: any) {
  try {
    const { pairId, direction, stake, duration, fluctuationRange, payoutRate } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Validate input
    Object.entries(createOptionSchema).forEach(([field, validator]) => {
      try {
        validator(req.body[field]);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          error: `${field}: ${error.message}`
        });
      }
    });

    // Get current price
    const currentPrice = await getCurrentPrice(pairId);
    
    const order = await optionsService.createOptionOrder({
      userId,
      pairId,
      direction,
      stake,
      duration,
      fluctuationRange,
      payoutRate,
      entryPrice: currentPrice
    });

    res.json({
      success: true,
      data: order
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Schedule an option trade for future execution
 */
export async function scheduleOptionTrade(req: any, res: any) {
  try {
    const { pairId, direction, stake, duration, fluctuationRange, payoutRate, scheduledTime } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Validate input
    Object.entries(scheduleOptionSchema).forEach(([field, validator]) => {
      try {
        validator(req.body[field]);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          error: `${field}: ${error.message}`
        });
      }
    });

    const scheduledTrade = await optionsService.scheduleOptionTrade({
      userId,
      pairId,
      direction,
      stake,
      duration,
      fluctuationRange,
      payoutRate,
      scheduledTime: new Date(scheduledTime)
    });

    res.json({
      success: true,
      data: scheduledTrade
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Cancel a scheduled trade
 */
export async function cancelScheduledTrade(req: any, res: any) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    await optionsService.cancelScheduledTrade(id, userId);

    res.json({
      success: true,
      message: 'Scheduled trade cancelled'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Get user's active options
 */
export async function getUserActiveOptions(req: any, res: any) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const orders = await optionsService.getUserActiveOptions(userId);

    res.json({
      success: true,
      data: orders
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Get user's completed options
 */
export async function getUserCompletedOptions(req: any, res: any) {
  try {
    const userId = req.user?.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const orders = await optionsService.getUserCompletedOptions(userId, limit);

    res.json({
      success: true,
      data: orders
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Get user's scheduled trades
 */
export async function getUserScheduledTrades(req: any, res: any) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const trades = await optionsService.getUserScheduledTrades(userId);

    res.json({
      success: true,
      data: trades
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Get available fluctuation ranges for a duration
 */
export async function getFluctuationRanges(req: any, res: any) {
  try {
    const duration = parseInt(req.params.duration);
    
    const ranges = {
      60: [{ label: 'UP > 0.01%', value: 0.01, payout: 0.176 }],
      120: [{ label: 'UP > 0.01%', value: 0.01, payout: 0.176 }],
      240: [{ label: 'UP > 0.05%', value: 0.05, payout: 0.328 }],
      360: [{ label: 'UP > 0.1%', value: 0.1, payout: 0.439 }],
      600: [
        { label: 'UP > 0.5%', value: 0.5, payout: 0.516 },
        { label: 'UP > 0.8%', value: 0.8, payout: 0.75 }
      ]
    };

    res.json({
      success: true,
      data: ranges[duration as keyof typeof ranges] || []
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Get purchase range for a duration
 */
export async function getPurchaseRange(req: any, res: any) {
  try {
    const duration = parseInt(req.params.duration);
    
    const ranges = {
      60: { min: 100, max: 50000 },
      120: { min: 10000, max: 300000 },
      240: { min: 30000, max: 500000 },
      360: { min: 50000, max: 1000000 },
      600: { min: 100000, max: 9999999 }
    };

    res.json({
      success: true,
      data: ranges[duration as keyof typeof ranges] || { min: 100, max: 50000 }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}
