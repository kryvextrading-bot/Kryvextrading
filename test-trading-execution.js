/**
 * Test Trading Execution
 * Simple test to verify trade execution with admin controls
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Mock trading control data
let forceWin = false; // Admin can set this to true/false

// Mock trading outcome function
function checkTradeOutcome(userId, tradeType) {
  console.log(`🎯 Checking trade outcome for user ${userId}, type: ${tradeType}`);
  console.log(`📊 Current force win setting: ${forceWin}`);
  
  // In real system, this would check database for user settings
  // For now, just return the global forceWin setting
  return forceWin;
}

// Mock wallet service
const walletService = {
  lockBalance: async ({ userId, amount }) => {
    console.log(`💰 Locked $${amount} for user ${userId}`);
    return true;
  },
  addBalance: async ({ userId, amount }) => {
    console.log(`💰 Added $${amount} to user ${userId}`);
    return true;
  }
};

// Mock trading service
const tradingService = {
  createSpotOrder: async (orderData) => {
    console.log(`📈 Created spot order:`, orderData);
    return { id: `order-${Date.now()}`, ...orderData };
  }
};

// Trading routes with outcome control
app.post('/api/trading/spot', async (req, res) => {
  try {
    console.log('🚀 Spot trade request received:', req.body);
    
    const { pair, side, type, amount, price, total } = req.body;
    const userId = '1'; // Mock user ID

    // Check if trade should win based on admin control
    const shouldWin = checkTradeOutcome(userId, 'spot');
    console.log(`🎲 Trade outcome determined: ${shouldWin ? 'WIN' : 'LOSS'}`);

    // Create the order
    const order = await tradingService.createSpotOrder({
      userId,
      pair,
      side,
      type,
      amount: parseFloat(amount),
      price: parseFloat(price),
      total: parseFloat(total),
      metadata: {
        shouldWin,
        outcome: shouldWin ? 'win' : 'loss',
        timestamp: Date.now()
      }
    });

    // Lock balance first
    await walletService.lockBalance({
      userId,
      amount: parseFloat(total),
      reference: `spot-order-${order.id}`
    });

    // Calculate profit/loss based on outcome
    const profit = shouldWin ? parseFloat(total) * 0.05 : -parseFloat(total);

    // Update wallet based on outcome
    if (shouldWin) {
      await walletService.addBalance({
        userId,
        amount: parseFloat(total) + profit,
        reference: order.id,
        type: 'trade_settlement'
      });
    }

    console.log(`✅ Trade executed - Result: ${shouldWin ? 'WIN' : 'LOSS'}, PnL: $${profit}`);

    // Return response with enforced outcome
    res.json({
      success: true,
      trade: {
        id: order.id,
        pair,
        side,
        type,
        amount: parseFloat(amount),
        price: parseFloat(price),
        total: parseFloat(total),
        status: 'completed',
        outcome: shouldWin ? 'win' : 'loss',
        pnl: profit,
        message: shouldWin ? 'Trade completed successfully' : 'Trade resulted in loss',
        metadata: {
          shouldWin,
          timestamp: Date.now()
        }
      }
    });

  } catch (error) {
    console.error('❌ Spot trade error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute spot trade',
      details: error.message
    });
  }
});

// Admin control endpoint
app.post('/api/admin/force-win', (req, res) => {
  const { enabled } = req.body;
  forceWin = enabled;
  console.log(`👑 Admin set force win to: ${enabled}`);
  res.json({
    success: true,
    message: `Force win ${enabled ? 'enabled' : 'disabled'}`,
    forceWin
  });
});

// Get current settings
app.get('/api/admin/settings', (req, res) => {
  res.json({
    forceWin,
    message: forceWin ? 'All trades will win' : 'All trades will lose'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Trading execution test server is running',
    forceWin,
    timestamp: new Date().toISOString()
  });
});

// Options profit percentages by duration (in seconds) - Based on UI requirements
const OPTIONS_PROFIT_RATES = {
  60: 115,   // 15% profit for 60s (100 + 15)
  120: 118,  // 18% profit for 120s (100 + 18)  
  240: 122,  // 22% profit for 240s (100 + 22)
  360: 125,  // 25% profit for 360s (100 + 25)
  600: 130   // 30% profit for 600s (estimated based on pattern)
};

// Options trading endpoint
app.post('/api/trading/options', async (req, res) => {
  try {
    console.log('🚀 Options trade request received:', req.body);
    
    const { pair, direction, amount, timeFrame, payout } = req.body;
    const userId = '1'; // Mock user ID

    // Check if trade should win based on admin control
    const shouldWin = checkTradeOutcome(userId, 'options');
    console.log(`🎲 Options outcome determined: ${shouldWin ? 'WIN' : 'LOSS'}`);

    // Calculate correct profit based on timeFrame
    const profitRate = OPTIONS_PROFIT_RATES[timeFrame] || 115;
    const profitPercentage = profitRate - 100; // Actual profit percentage
    const actualPayout = shouldWin ? amount * (profitRate / 100) : 0;
    const profit = shouldWin ? actualPayout - amount : -amount;

    console.log(`💰 Options profit calculation:`, {
      timeFrame,
      profitRate,
      profitPercentage,
      amount,
      actualPayout,
      profit,
      shouldWin
    });

    // Create the option
    const option = {
      id: `option-${Date.now()}`,
      pair,
      direction,
      amount: parseFloat(amount),
      timeFrame: parseInt(timeFrame),
      payout: actualPayout,
      expiresAt: Date.now() + (parseInt(timeFrame) * 1000),
      metadata: {
        shouldWin,
        outcome: shouldWin ? 'win' : 'loss',
        profitRate,
        profitPercentage,
        timestamp: Date.now()
      }
    };

    // Lock premium first
    await walletService.lockBalance({
      userId,
      amount: parseFloat(amount),
      reference: `option-${option.id}`
    });

    // Update wallet based on outcome
    if (shouldWin) {
      await walletService.addBalance({
        userId,
        amount: actualPayout,
        reference: option.id,
        type: 'option_settlement'
      });
    }

    console.log(`✅ Options trade executed - Result: ${shouldWin ? 'WIN' : 'LOSS'}, Payout: $${actualPayout}, Profit: $${profit}`);

    // Return response with enforced outcome
    res.json({
      success: true,
      trade: {
        id: option.id,
        pair,
        direction,
        amount: parseFloat(amount),
        timeFrame: parseInt(timeFrame),
        payout: actualPayout,
        expiresAt: option.expiresAt,
        status: 'completed',
        outcome: shouldWin ? 'win' : 'loss',
        pnl: profit,
        message: shouldWin ? `Option won! +${profitPercentage}% profit` : 'Option lost',
        metadata: {
          shouldWin,
          profitRate,
          profitPercentage,
          timestamp: Date.now()
        }
      }
    });

  } catch (error) {
    console.error('❌ Options trade error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute options trade',
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Trading Test Server running on http://localhost:${PORT}`);
  console.log(`📊 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`👑 Admin control: POST http://localhost:${PORT}/api/admin/force-win`);
  console.log(`💰 Trading endpoint: POST http://localhost:${PORT}/api/trading/spot`);
  console.log(`💰 Options trading endpoint: POST http://localhost:${PORT}/api/trading/options`);
  console.log(`\n🎮 Current force win setting: ${forceWin ? 'ENABLED (all trades win)' : 'DISABLED (all trades lose)'}`);
});
