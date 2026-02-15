/**
 * Admin Trading Control Routes
 * API endpoints for managing trade outcomes and user settings
 */

const express = require('express');
const router = express.Router();
const TradingControlService = require('../../services/tradingControlService');
const { authenticateAdmin } = require('../../middleware/auth');
const { auditLog } = require('../../middleware/audit');

const tradingControl = new TradingControlService();

// Middleware to extract client info
const extractClientInfo = (req, res, next) => {
  req.clientInfo = {
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent')
  };
  next();
};

/**
 * GET /api/admin/trading-control/settings
 * Get system-wide trading settings
 */
router.get('/settings', authenticateAdmin, async (req, res) => {
  try {
    const settings = await tradingControl.getSystemSettings();
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error getting system settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system settings'
    });
  }
});

/**
 * PUT /api/admin/trading-control/settings
 * Update system-wide trading settings
 */
router.put('/settings', authenticateAdmin, extractClientInfo, async (req, res) => {
  try {
    const { settings } = req.body;
    const adminId = req.user.id;

    if (!settings) {
      return res.status(400).json({
        success: false,
        error: 'Settings are required'
      });
    }

    // Validate settings
    const validOutcomes = ['win', 'loss', 'random'];
    const requiredFields = ['default_outcome', 'spot_default', 'futures_default', 'options_default', 'arbitrage_default'];
    
    for (const field of requiredFields) {
      if (settings[field] && !validOutcomes.includes(settings[field])) {
        return res.status(400).json({
          success: false,
          error: `Invalid ${field} value`
        });
      }
    }

    if (settings.win_probability !== undefined) {
      if (typeof settings.win_probability !== 'number' || settings.win_probability < 0 || settings.win_probability > 100) {
        return res.status(400).json({
          success: false,
          error: 'Win probability must be between 0 and 100'
        });
      }
    }

    const updatedSettings = await tradingControl.updateSystemSettings(settings, adminId);

    res.json({
      success: true,
      data: updatedSettings,
      message: 'System settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update system settings'
    });
  }
});

/**
 * GET /api/admin/trading-control/users/:userId/outcome
 * Get user's outcome settings
 */
router.get('/users/:userId/outcome', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const outcome = await tradingControl.getUserOutcome(userId);

    res.json({
      success: true,
      data: outcome
    });
  } catch (error) {
    console.error('Error getting user outcome:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user outcome'
    });
  }
});

/**
 * PUT /api/admin/trading-control/users/:userId/outcome
 * Update user's outcome settings
 */
router.put('/users/:userId/outcome', authenticateAdmin, extractClientInfo, async (req, res) => {
  try {
    const { userId } = req.params;
    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({
        success: false,
        error: 'Settings are required'
      });
    }

    // Validate settings
    if (settings.outcome_type && !['win', 'loss', 'default'].includes(settings.outcome_type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid outcome_type value'
      });
    }

    const updatedOutcome = await tradingControl.updateUserOutcome(userId, {
      ...settings,
      ...req.clientInfo
    });

    res.json({
      success: true,
      data: updatedOutcome,
      message: 'User outcome settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating user outcome:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user outcome'
    });
  }
});

/**
 * GET /api/admin/trading-control/users/:userId/windows
 * Get user's active trading windows
 */
router.get('/users/:userId/windows', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const windows = await tradingControl.getUserActiveWindows(userId);

    res.json({
      success: true,
      data: windows
    });
  } catch (error) {
    console.error('Error getting user windows:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user windows'
    });
  }
});

/**
 * POST /api/admin/trading-control/windows
 * Create a new trading window
 */
router.post('/windows', authenticateAdmin, extractClientInfo, async (req, res) => {
  try {
    const windowData = req.body;
    const adminId = req.user.id;

    // Validate required fields
    const requiredFields = ['user_id', 'outcome_type', 'start_time', 'end_time'];
    for (const field of requiredFields) {
      if (!windowData[field]) {
        return res.status(400).json({
          success: false,
          error: `${field} is required`
        });
      }
    }

    // Validate outcome type
    if (!['win', 'loss', 'default'].includes(windowData.outcome_type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid outcome_type value'
      });
    }

    // Validate time range
    const startTime = new Date(windowData.start_time);
    const endTime = new Date(windowData.end_time);
    
    if (endTime <= startTime) {
      return res.status(400).json({
        success: false,
        error: 'End time must be after start time'
      });
    }

    const window = await tradingControl.createTradingWindow({
      ...windowData,
      created_by: adminId,
      ...req.clientInfo
    });

    res.status(201).json({
      success: true,
      data: window,
      message: 'Trading window created successfully'
    });
  } catch (error) {
    console.error('Error creating trading window:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create trading window'
    });
  }
});

/**
 * PUT /api/admin/trading-control/windows/:windowId/deactivate
 * Deactivate a trading window
 */
router.put('/windows/:windowId/deactivate', authenticateAdmin, extractClientInfo, async (req, res) => {
  try {
    const { windowId } = req.params;

    const window = await tradingControl.deactivateTradingWindow(windowId);

    res.json({
      success: true,
      data: window,
      message: 'Trading window deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating trading window:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate trading window'
    });
  }
});

/**
 * GET /api/admin/trading-control/windows
 * Get all active trading windows
 */
router.get('/windows', authenticateAdmin, async (req, res) => {
  try {
    const windows = await tradingControl.getAllActiveWindows();

    res.json({
      success: true,
      data: windows
    });
  } catch (error) {
    console.error('Error getting all windows:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trading windows'
    });
  }
});

/**
 * GET /api/admin/trading-control/outcomes
 * Get all user outcomes
 */
router.get('/outcomes', authenticateAdmin, async (req, res) => {
  try {
    const outcomes = await tradingControl.getAllUserOutcomes();

    res.json({
      success: true,
      data: outcomes
    });
  } catch (error) {
    console.error('Error getting all outcomes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user outcomes'
    });
  }
});

/**
 * POST /api/admin/trading-control/bulk-update
 * Bulk update user outcomes
 */
router.post('/bulk-update', authenticateAdmin, extractClientInfo, async (req, res) => {
  try {
    const { userIds, settings } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'User IDs array is required'
      });
    }

    if (!settings) {
      return res.status(400).json({
        success: false,
        error: 'Settings are required'
      });
    }

    // Validate settings
    if (settings.outcome_type && !['win', 'loss', 'default'].includes(settings.outcome_type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid outcome_type value'
      });
    }

    const updatedOutcomes = await tradingControl.bulkUpdateUserOutcomes(userIds, {
      ...settings,
      ...req.clientInfo
    });

    res.json({
      success: true,
      data: updatedOutcomes,
      message: `Updated ${updatedOutcomes.length} user outcomes successfully`
    });
  } catch (error) {
    console.error('Error bulk updating outcomes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk update user outcomes'
    });
  }
});

/**
 * GET /api/admin/trading-control/audit
 * Get audit log
 */
router.get('/audit', authenticateAdmin, async (req, res) => {
  try {
    const filters = {
      userId: req.query.userId,
      adminId: req.query.adminId,
      action: req.query.action,
      limit: req.query.limit ? parseInt(req.query.limit) : 100
    };

    const auditLog = await tradingControl.getAuditLog(filters);

    res.json({
      success: true,
      data: auditLog
    });
  } catch (error) {
    console.error('Error getting audit log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get audit log'
    });
  }
});

/**
 * GET /api/admin/trading-control/statistics
 * Get trading control statistics
 */
router.get('/statistics', authenticateAdmin, async (req, res) => {
  try {
    const stats = await tradingControl.getTradingStatistics();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
});

/**
 * POST /api/admin/trading-control/check-outcome
 * Check trade outcome for a user (admin testing)
 */
router.post('/check-outcome', authenticateAdmin, async (req, res) => {
  try {
    const { userId, tradeType } = req.body;

    if (!userId || !tradeType) {
      return res.status(400).json({
        success: false,
        error: 'User ID and trade type are required'
      });
    }

    const shouldWin = await tradingControl.checkTradeOutcome(userId, tradeType);
    const currentWindow = await tradingControl.getCurrentActiveWindow(userId);
    const userOutcome = await tradingControl.getUserOutcome(userId);

    res.json({
      success: true,
      data: {
        shouldWin,
        currentWindow,
        userOutcome,
        tradeType
      }
    });
  } catch (error) {
    console.error('Error checking outcome:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check outcome'
    });
  }
});

/**
 * GET /api/admin/trading-control/users/:userId/status
 * Get comprehensive trading status for a user
 */
router.get('/users/:userId/status', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const [userOutcome, activeWindows, currentWindow] = await Promise.all([
      tradingControl.getUserOutcome(userId),
      tradingControl.getUserActiveWindows(userId),
      tradingControl.getCurrentActiveWindow(userId)
    ]);

    // Test outcomes for all trade types
    const tradeTypes = ['spot', 'futures', 'options', 'arbitrage'];
    const outcomes = {};
    
    for (const tradeType of tradeTypes) {
      outcomes[tradeType] = await tradingControl.checkTradeOutcome(userId, tradeType);
    }

    res.json({
      success: true,
      data: {
        userId,
        userOutcome,
        activeWindows,
        currentWindow,
        outcomes
      }
    });
  } catch (error) {
    console.error('Error getting user status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user status'
    });
  }
});

module.exports = router;
