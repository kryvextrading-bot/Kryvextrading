/**
 * Trading Control Service
 * Manages trade outcomes and user-specific trading settings
 */

const { supabase } = require('../config/supabase');

class TradingControlService {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Check if a user should win a specific trade
   * @param {string} userId - User ID
   * @param {string} tradeType - Type of trade (spot, futures, options, arbitrage)
   * @returns {Promise<boolean>} - Whether the user should win
   */
  async checkTradeOutcome(userId, tradeType) {
    try {
      const { data, error } = await this.supabase.rpc('check_user_trade_outcome', {
        p_user_id: userId,
        p_trade_type: tradeType
      });

      if (error) {
        console.error('Error checking trade outcome:', error);
        return false; // Default to loss on error
      }

      return data;
    } catch (error) {
      console.error('Error in checkTradeOutcome:', error);
      return false;
    }
  }

  /**
   * Get user's permanent outcome settings
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - User outcome settings
   */
  async getUserOutcome(userId) {
    try {
      const { data, error } = await this.supabase
        .from('trade_outcomes')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user outcome:', error);
      return null;
    }
  }

  /**
   * Update user's outcome settings
   * @param {string} userId - User ID
   * @param {Object} settings - Outcome settings
   * @returns {Promise<Object>} - Updated settings
   */
  async updateUserOutcome(userId, settings) {
    try {
      const { data, error } = await this.supabase
        .from('trade_outcomes')
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Log audit
      await this.logAudit(userId, 'UPDATE_USER_OUTCOME', settings);

      return data;
    } catch (error) {
      console.error('Error updating user outcome:', error);
      throw error;
    }
  }

  /**
   * Get active trading windows for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Active trading windows
   */
  async getUserActiveWindows(userId) {
    try {
      const { data, error } = await this.supabase
        .from('trade_windows')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .gte('end_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user windows:', error);
      return [];
    }
  }

  /**
   * Create a new trading window
   * @param {Object} windowData - Window data
   * @returns {Promise<Object>} - Created window
   */
  async createTradingWindow(windowData) {
    try {
      const { data, error } = await this.supabase
        .from('trade_windows')
        .insert({
          ...windowData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Log audit
      await this.logAudit(windowData.user_id, 'CREATE_TRADE_WINDOW', windowData);

      return data;
    } catch (error) {
      console.error('Error creating trading window:', error);
      throw error;
    }
  }

  /**
   * Deactivate a trading window
   * @param {string} windowId - Window ID
   * @returns {Promise<Object>} - Updated window
   */
  async deactivateTradingWindow(windowId) {
    try {
      const { data, error } = await this.supabase
        .from('trade_windows')
        .update({ 
          active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', windowId)
        .select()
        .single();

      if (error) throw error;

      // Log audit
      await this.logAudit(data.user_id, 'DEACTIVATE_TRADE_WINDOW', { windowId });

      return data;
    } catch (error) {
      console.error('Error deactivating trading window:', error);
      throw error;
    }
  }

  /**
   * Get system-wide trading settings
   * @returns {Promise<Object|null>} - System settings
   */
  async getSystemSettings() {
    try {
      const { data, error } = await this.supabase
        .from('trading_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting system settings:', error);
      return null;
    }
  }

  /**
   * Update system-wide trading settings
   * @param {Object} settings - System settings
   * @param {string} adminId - Admin user ID
   * @returns {Promise<Object>} - Updated settings
   */
  async updateSystemSettings(settings, adminId) {
    try {
      const { data, error } = await this.supabase
        .from('trading_settings')
        .upsert({
          ...settings,
          updated_by: adminId,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Log audit
      await this.logAudit(null, 'UPDATE_SYSTEM_SETTINGS', settings, adminId);

      return data;
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  }

  /**
   * Get all active trading windows (admin function)
   * @returns {Promise<Array>} - All active windows
   */
  async getAllActiveWindows() {
    try {
      const { data, error } = await this.supabase
        .from('trade_windows')
        .select(`
          *,
          user:profiles(email)
        `)
        .eq('active', true)
        .gte('end_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all active windows:', error);
      return [];
    }
  }

  /**
   * Get all user outcomes (admin function)
   * @returns {Promise<Array>} - All user outcomes
   */
  async getAllUserOutcomes() {
    try {
      const { data, error } = await this.supabase
        .from('trade_outcomes')
        .select(`
          *,
          user:profiles(email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all user outcomes:', error);
      return [];
    }
  }

  /**
   * Get audit log
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} - Audit log entries
   */
  async getAuditLog(filters = {}) {
    try {
      let query = this.supabase
        .from('trading_control_audit')
        .select(`
          *,
          user:profiles(email),
          admin:profiles(email)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.adminId) {
        query = query.eq('admin_id', filters.adminId);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting audit log:', error);
      return [];
    }
  }

  /**
   * Log audit entry
   * @param {string} userId - User ID (optional)
   * @param {string} action - Action performed
   * @param {Object} details - Action details
   * @param {string} adminId - Admin ID (optional)
   */
  async logAudit(userId, action, details, adminId = null) {
    try {
      const auditEntry = {
        user_id: userId,
        admin_id: adminId,
        action,
        details,
        ip_address: details.ipAddress || null,
        user_agent: details.userAgent || null,
        created_at: new Date().toISOString()
      };

      const { error } = await this.supabase
        .from('trading_control_audit')
        .insert(auditEntry);

      if (error) {
        console.error('Error logging audit:', error);
      }
    } catch (error) {
      console.error('Error in logAudit:', error);
    }
  }

  /**
   * Get current active window for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Current active window
   */
  async getCurrentActiveWindow(userId) {
    try {
      const now = new Date().toISOString();
      const { data, error } = await this.supabase
        .from('trade_windows')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .lte('start_time', now)
        .gte('end_time', now)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting current active window:', error);
      return null;
    }
  }

  /**
   * Bulk update user outcomes (admin function)
   * @param {Array} userIds - Array of user IDs
   * @param {Object} settings - Settings to apply
   * @returns {Promise<Array>} - Updated outcomes
   */
  async bulkUpdateUserOutcomes(userIds, settings) {
    try {
      const updates = userIds.map(userId => ({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await this.supabase
        .from('trade_outcomes')
        .upsert(updates)
        .select();

      if (error) throw error;

      // Log audit for each user
      for (const userId of userIds) {
        await this.logAudit(userId, 'BULK_UPDATE_USER_OUTCOME', settings);
      }

      return data;
    } catch (error) {
      console.error('Error bulk updating user outcomes:', error);
      throw error;
    }
  }

  /**
   * Get trading statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} - Trading statistics
   */
  async getTradingStatistics(filters = {}) {
    try {
      const stats = {
        totalUsers: 0,
        activeWindows: 0,
        userOutcomes: 0,
        systemSettings: null,
        recentActivity: []
      };

      // Get user count
      const { count: userCount } = await this.supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      stats.totalUsers = userCount || 0;

      // Get active windows count
      const { count: windowCount } = await this.supabase
        .from('trade_windows')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)
        .gte('end_time', new Date().toISOString());
      stats.activeWindows = windowCount || 0;

      // Get user outcomes count
      const { count: outcomeCount } = await this.supabase
        .from('trade_outcomes')
        .select('*', { count: 'exact', head: true })
        .eq('enabled', true);
      stats.userOutcomes = outcomeCount || 0;

      // Get system settings
      stats.systemSettings = await this.getSystemSettings();

      // Get recent activity
      stats.recentActivity = await this.getAuditLog({ limit: 10 });

      return stats;
    } catch (error) {
      console.error('Error getting trading statistics:', error);
      return {
        totalUsers: 0,
        activeWindows: 0,
        userOutcomes: 0,
        systemSettings: null,
        recentActivity: []
      };
    }
  }
}

module.exports = TradingControlService;
