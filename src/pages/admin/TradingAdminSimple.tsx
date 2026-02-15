// src/pages/admin/TradingAdminPanel.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, addMinutes, parseISO } from 'date-fns';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Calendar,
  Zap,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Download,
  Eye,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Activity,
  Award,
  Medal,
  Crown,
  Sparkles,
  Flame,
  Droplet,
  Wind,
  Sun,
  Moon,
  Settings,
  History,
  UserCheck,
  UserX,
  Ban,
  Lock,
  Unlock,
  Copy,
  ExternalLink,
  Info,
  Plus,
  Minus,
  Target,
  DollarSign,
  Percent,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  BarChart3,
  PieChart,
  LineChart,
  Gift,
  Star,
  Flag,
  Rocket,
  ZapOff,
  EyeOff,
  RefreshCcw,
  HelpCircle
} from 'lucide-react';
import { useToast, toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

// ==================== TYPES ====================
interface TradeOutcome {
  id: string;
  user_id: string;
  enabled: boolean;
  outcome_type: 'win' | 'loss' | 'default';
  spot_enabled: boolean;
  futures_enabled: boolean;
  options_enabled: boolean;
  arbitrage_enabled: boolean;
  
  // P&L Target fields for each trading type
  spot_target_profit?: number;
  spot_target_loss?: number;
  spot_target_reason?: string;
  spot_current_pnl?: number;
  spot_target_achieved?: boolean;
  
  futures_target_profit?: number;
  futures_target_loss?: number;
  futures_target_reason?: string;
  futures_current_pnl?: number;
  futures_target_achieved?: boolean;
  
  options_target_profit?: number;
  options_target_loss?: number;
  options_target_reason?: string;
  options_current_pnl?: number;
  options_target_achieved?: boolean;
  
  arbitrage_target_profit?: number;
  arbitrage_target_loss?: number;
  arbitrage_target_reason?: string;
  arbitrage_current_pnl?: number;
  arbitrage_target_achieved?: boolean;
  
  created_at: string;
  updated_at: string;
}

interface TradeWindow {
  id: string;
  user_id: string;
  outcome_type: 'win' | 'loss' | 'default';
  start_time: string;
  end_time: string;
  spot_enabled: boolean;
  futures_enabled: boolean;
  options_enabled: boolean;
  arbitrage_enabled: boolean;
  reason?: string;
  active: boolean;
  created_at: string;
}

interface TradingSettings {
  id: string;
  default_outcome: 'win' | 'loss' | 'random';
  win_probability: number;
  spot_default: 'win' | 'loss' | 'random';
  futures_default: 'win' | 'loss' | 'random';
  options_default: 'win' | 'loss' | 'random';
  arbitrage_default: 'win' | 'loss' | 'random';
  updated_at: string;
}

interface AuditLog {
  id: string;
  admin_id: string;
  admin_email?: string;
  action: string;
  user_id?: string;
  user_email?: string;
  details: any;
  created_at: string;
}

interface UserWithTrading {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
  created_at: string;
  trade_outcome?: TradeOutcome;
  active_windows?: TradeWindow[];
}

// ==================== DIALOG STATE TYPES ====================
interface ForceWinDialogState {
  open: boolean;
  userId: string | null;
  userName: string;
  startTime: string;
  endTime: string;
  hasTimeFrame: boolean;
}

interface TimeWindowDialogState {
  open: boolean;
  userId: string | null;
  userName: string;
  startTime: string;
  endTime: string;
  outcomeType: 'win' | 'loss' | 'default';
  spot: boolean;
  futures: boolean;
  options: boolean;
  arbitrage: boolean;
  reason: string;
}

interface PnLTargetDialogState {
  open: boolean;
  userId: string | null;
  userName: string;
  tradeType: 'spot' | 'futures' | 'options' | 'arbitrage';
  targetProfit: number;
  targetLoss: number;
  reason: string;
}

// ==================== ANIMATION VARIANTS ====================
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
};

// ==================== HELPER FUNCTIONS ====================
const addHours = (date: Date, hours: number) => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

const formatDate = (date: string) => {
  return format(parseISO(date), 'MMM dd, yyyy HH:mm');
};

const formatTime = (date: string) => {
  return format(parseISO(date), 'HH:mm');
};

const getInitials = (user: UserWithTrading) => {
  if (user.first_name && user.last_name) {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  }
  return user.email?.[0]?.toUpperCase() || 'U';
};

const getOutcomeBadge = (outcome: string) => {
  switch (outcome) {
    case 'win':
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">WIN</Badge>;
    case 'loss':
      return <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">LOSS</Badge>;
    case 'default':
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">DEFAULT</Badge>;
    default:
      return null;
  }
};

const getTradeTypeIcon = (type: string) => {
  switch (type) {
    case 'spot': return <BarChart3 className="w-4 h-4" />;
    case 'futures': return <TrendingUpIcon className="w-4 h-4" />;
    case 'options': return <PieChart className="w-4 h-4" />;
    case 'arbitrage': return <Zap className="w-4 h-4" />;
    default: return <Activity className="w-4 h-4" />;
  }
};

const getTradeTypeColor = (type: string) => {
  switch (type) {
    case 'spot': return 'text-blue-400 bg-blue-500/20';
    case 'futures': return 'text-purple-400 bg-purple-500/20';
    case 'options': return 'text-green-400 bg-green-500/20';
    case 'arbitrage': return 'text-yellow-400 bg-yellow-500/20';
    default: return 'text-gray-400 bg-gray-500/20';
  }
};

// ==================== API FUNCTIONS ====================
const tradingApi = {
  // Get all users with their trading settings
  async getUsers(): Promise<UserWithTrading[]> {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get trade outcomes for all users
    const { data: outcomes, error: outcomesError } = await supabase
      .from('trade_outcomes')
      .select('*');

    if (outcomesError) throw outcomesError;

    // Get active trade windows
    const { data: windows, error: windowsError } = await supabase
      .from('trade_windows')
      .select('*')
      .eq('active', true)
      .gte('end_time', new Date().toISOString());

    if (windowsError) throw windowsError;

    // Merge data
    return users.map(user => ({
      ...user,
      trade_outcome: outcomes?.find(o => o.user_id === user.id),
      active_windows: windows?.filter(w => w.user_id === user.id) || []
    }));
  },

  // Set user trade outcome
  async setUserTradeOutcome(
    userId: string,
    outcomeType: 'win' | 'loss' | 'default',
    enabled: boolean = true,
    options: {
      spot?: boolean;
      futures?: boolean;
      options?: boolean;
      arbitrage?: boolean;
    } = {}
  ): Promise<TradeOutcome> {
    const { data: existing } = await supabase
      .from('trade_outcomes')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const outcomeData = {
      user_id: userId,
      outcome_type: outcomeType,
      enabled,
      spot_enabled: options.spot ?? true,
      futures_enabled: options.futures ?? true,
      options_enabled: options.options ?? true,
      arbitrage_enabled: options.arbitrage ?? true,
      updated_at: new Date().toISOString()
    };

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('trade_outcomes')
        .update(outcomeData)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('trade_outcomes')
        .insert({
          ...outcomeData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    return result;
  },

  // Set P&L target for specific trade type
  async setPnLTarget(
    userId: string,
    tradeType: 'spot' | 'futures' | 'options' | 'arbitrage',
    targetProfit: number,
    targetLoss: number,
    reason: string
  ): Promise<void> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    updateData[`${tradeType}_target_profit`] = targetProfit;
    updateData[`${tradeType}_target_loss`] = targetLoss;
    updateData[`${tradeType}_target_reason`] = reason;
    updateData[`${tradeType}_target_achieved`] = false;
    
    // Reset current P&L when setting new target
    updateData[`${tradeType}_current_pnl`] = 0;

    const { error } = await supabase
      .from('trade_outcomes')
      .upsert({
        user_id: userId,
        ...updateData
      }, { onConflict: 'user_id' });

    if (error) throw error;
  },

  // Clear P&L target for specific trade type
  async clearPnLTarget(userId: string, tradeType: 'spot' | 'futures' | 'options' | 'arbitrage'): Promise<void> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    updateData[`${tradeType}_target_profit`] = null;
    updateData[`${tradeType}_target_loss`] = null;
    updateData[`${tradeType}_target_reason`] = null;
    updateData[`${tradeType}_target_achieved`] = null;
    updateData[`${tradeType}_current_pnl`] = null;

    const { error } = await supabase
      .from('trade_outcomes')
      .update(updateData)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Update current P&L for a user's trade type (called by trading system)
  async updateCurrentPnL(
    userId: string,
    tradeType: 'spot' | 'futures' | 'options' | 'arbitrage',
    pnlChange: number
  ): Promise<{ targetAchieved: boolean; targetType: 'profit' | 'loss' | null }> {
    // First get current values
    const { data: outcome, error: fetchError } = await supabase
      .from('trade_outcomes')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError || !outcome) return { targetAchieved: false, targetType: null };

    const currentField = `${tradeType}_current_pnl`;
    const targetProfitField = `${tradeType}_target_profit`;
    const targetLossField = `${tradeType}_target_loss`;
    const achievedField = `${tradeType}_target_achieved`;

    const currentPnl = (outcome[currentField] || 0) + pnlChange;
    const targetProfit = outcome[targetProfitField];
    const targetLoss = outcome[targetLossField];
    const alreadyAchieved = outcome[achievedField];

    let targetAchieved = false;
    let targetType: 'profit' | 'loss' | null = null;

    // Check if target achieved
    if (!alreadyAchieved) {
      if (targetProfit !== null && currentPnl >= targetProfit) {
        targetAchieved = true;
        targetType = 'profit';
      } else if (targetLoss !== null && currentPnl <= targetLoss) {
        targetAchieved = true;
        targetType = 'loss';
      }
    }

    // Update the database
    const { error: updateError } = await supabase
      .from('trade_outcomes')
      .update({
        [currentField]: currentPnl,
        [achievedField]: targetAchieved || alreadyAchieved,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    return { targetAchieved, targetType };
  },

  // Clear user trade outcome
  async clearUserTradeOutcome(userId: string): Promise<void> {
    const { error } = await supabase
      .from('trade_outcomes')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Create trade window
  async createTradeWindow(
    userId: string,
    outcomeType: 'win' | 'loss' | 'default',
    startTime: string,
    endTime: string,
    options: {
      spot?: boolean;
      futures?: boolean;
      options?: boolean;
      arbitrage?: boolean;
      reason?: string;
    } = {}
  ): Promise<TradeWindow> {
    const { data, error } = await supabase
      .from('trade_windows')
      .insert({
        user_id: userId,
        outcome_type: outcomeType,
        start_time: startTime,
        end_time: endTime,
        spot_enabled: options.spot ?? true,
        futures_enabled: options.futures ?? true,
        options_enabled: options.options ?? true,
        arbitrage_enabled: options.arbitrage ?? true,
        reason: options.reason,
        active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Cancel trade window
  async cancelTradeWindow(windowId: string): Promise<void> {
    const { error } = await supabase
      .from('trade_windows')
      .update({ active: false })
      .eq('id', windowId);

    if (error) throw error;
  },

  // Get trading settings
  async getTradingSettings(): Promise<TradingSettings> {
    const { data, error } = await supabase
      .from('trading_settings')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code === 'PGRST116') {
      // No settings found, return default
      return {
        id: 'default',
        default_outcome: 'loss',
        win_probability: 30,
        spot_default: 'loss',
        futures_default: 'loss',
        options_default: 'loss',
        arbitrage_default: 'loss',
        updated_at: new Date().toISOString()
      };
    }

    if (error) throw error;
    return data;
  },

  // Update trading settings
  async updateTradingSettings(settings: Partial<TradingSettings>): Promise<TradingSettings> {
    const { data: existing } = await supabase
      .from('trading_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    const { data: { user } } = await supabase.auth.getUser();

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('trading_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('trading_settings')
        .insert({
          ...settings,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    return result;
  },

  // Get audit logs
  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('trading_admin_audit')
      .select(`
        *,
        admin:admin_id (email),
        user:user_id (email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(log => ({
      ...log,
      admin_email: log.admin?.email,
      user_email: log.user?.email
    }));
  },

  // Subscribe to real-time changes
  subscribeToUserChanges(callback: (payload: any) => void) {
    return supabase
      .channel('trading-admin-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trade_outcomes' },
        callback
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trade_windows' },
        callback
      )
      .subscribe();
  }
};

// ==================== P&L TARGET DIALOG COMPONENT ====================
const PnLTargetDialog: React.FC<{
  open: boolean;
  userId: string | null;
  userName: string;
  tradeType: 'spot' | 'futures' | 'options' | 'arbitrage';
  targetProfit: number;
  targetLoss: number;
  reason: string;
  onOpenChange: (open: boolean) => void;
  onSetTarget: (userId: string, tradeType: 'spot' | 'futures' | 'options' | 'arbitrage', targetProfit: number, targetLoss: number, reason: string) => void;
}> = ({
  open,
  userId,
  userName,
  tradeType,
  targetProfit,
  targetLoss,
  reason,
  onOpenChange,
  onSetTarget
}) => {
  const [localTargetProfit, setLocalTargetProfit] = useState(targetProfit);
  const [localTargetLoss, setLocalTargetLoss] = useState(targetLoss);
  const [localReason, setLocalReason] = useState(reason);

  // Reset local state when dialog opens with new values
  useEffect(() => {
    if (open) {
      setLocalTargetProfit(targetProfit);
      setLocalTargetLoss(targetLoss);
      setLocalReason(reason);
    }
  }, [open, targetProfit, targetLoss, reason]);

  const handleSetTarget = () => {
    if (!userId) return;

    onSetTarget(userId, tradeType, localTargetProfit, localTargetLoss, localReason);
  };

  const tradeTypeNames = {
    spot: 'Spot',
    futures: 'Futures',
    options: 'Options',
    arbitrage: 'Arbitrage'
  };

  const tradeTypeColors = {
    spot: 'blue',
    futures: 'purple',
    options: 'green',
    arbitrage: 'yellow'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 text-white max-w-md mx-auto p-6 space-y-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-${tradeTypeColors[tradeType]}-500/20`}>
              {getTradeTypeIcon(tradeType)}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">
                Set {tradeTypeNames[tradeType]} P&L Target
              </DialogTitle>
              <DialogDescription className="text-gray-300 mt-1">
                Set profit/loss targets for {userName}'s {tradeTypeNames[tradeType]} trading
              </DialogDescription>
            </div>
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </DialogHeader>
        
        <div className="space-y-5 py-2">
          {/* Profit Target Section */}
          <div className="space-y-3 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <Label className="text-emerald-400 font-medium">Profit Target</Label>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <Input
                type="number"
                value={localTargetProfit}
                onChange={(e) => setLocalTargetProfit(parseFloat(e.target.value) || 0)}
                className="flex-1 bg-gray-800/50 border-gray-700 text-white focus:border-emerald-500"
                placeholder="1000"
              />
            </div>
            <p className="text-xs text-gray-400">
              User will be notified when P&L reaches this profit target
            </p>
          </div>

          {/* Loss Target Section */}
          <div className="space-y-3 p-4 bg-rose-500/10 rounded-lg border border-rose-500/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-rose-400" />
              </div>
              <Label className="text-rose-400 font-medium">Loss Target</Label>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-rose-400" />
              <Input
                type="number"
                value={localTargetLoss}
                onChange={(e) => setLocalTargetLoss(parseFloat(e.target.value) || 0)}
                className="flex-1 bg-gray-800/50 border-gray-700 text-white focus:border-rose-500"
                placeholder="-500"
              />
            </div>
            <p className="text-xs text-gray-400">
              User will be notified when P&L reaches this loss target
            </p>
          </div>

          {/* Quick preset buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-gray-700 hover:bg-gray-700 text-xs"
              onClick={() => {
                setLocalTargetProfit(100);
                setLocalTargetLoss(-50);
              }}
            >
              Small
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-gray-700 hover:bg-gray-700 text-xs"
              onClick={() => {
                setLocalTargetProfit(1000);
                setLocalTargetLoss(-500);
              }}
            >
              Medium
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-gray-700 hover:bg-gray-700 text-xs"
              onClick={() => {
                setLocalTargetProfit(10000);
                setLocalTargetLoss(-5000);
              }}
            >
              Large
            </Button>
          </div>

          {/* Reason Section */}
          <div className="space-y-2">
            <Label className="text-gray-400">Reason (Optional)</Label>
            <Textarea
              value={localReason}
              onChange={(e) => setLocalReason(e.target.value)}
              className="bg-gray-800/50 border-gray-700 text-white"
              placeholder="Why is this target being set?"
              rows={3}
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300">
                When the P&L target is reached, the user will be notified and you can review the performance.
                Targets can be adjusted at any time.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-700 hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSetTarget}
            className={`bg-${tradeTypeColors[tradeType]}-600 hover:bg-${tradeTypeColors[tradeType]}-700 text-white`}
          >
            Set Target
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ==================== MAIN COMPONENT ====================
export default function TradingAdminPanel() {
  const { user } = useAuth();
  
  // State
  const [users, setUsers] = useState<UserWithTrading[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithTrading[]>([]);
  const [settings, setSettings] = useState<TradingSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [selectedUser, setSelectedUser] = useState<UserWithTrading | null>(null);
  
  // Dialog States
  const [forceWinDialog, setForceWinDialog] = useState<ForceWinDialogState>({
    open: false,
    userId: null,
    userName: '',
    startTime: format(new Date(), "yyyy-MM-dd'T'HH:00"),
    endTime: format(addMinutes(new Date(), 5), "yyyy-MM-dd'T'HH:05"),
    hasTimeFrame: false
  });
  
  const [timeWindowDialog, setTimeWindowDialog] = useState<TimeWindowDialogState>({
    open: false,
    userId: null,
    userName: '',
    startTime: format(new Date(), "yyyy-MM-dd'T'HH:00"),
    endTime: format(addMinutes(new Date(), 5), "yyyy-MM-dd'T'HH:05"),
    outcomeType: 'win',
    spot: true,
    futures: true,
    options: true,
    arbitrage: true,
    reason: ''
  });

  const [pnlTargetDialog, setPnLTargetDialog] = useState<PnLTargetDialogState>({
    open: false,
    userId: null,
    userName: '',
    tradeType: 'futures',
    targetProfit: 1000,
    targetLoss: -500,
    reason: ''
  });

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [usersData, settingsData, auditData] = await Promise.all([
        tradingApi.getUsers().catch(() => []),
        tradingApi.getTradingSettings().catch(() => null),
        tradingApi.getAuditLogs(50).catch(() => [])
      ]);
      
      setUsers(usersData);
      setFilteredUsers(usersData);
      setSettings(settingsData);
      setAuditLogs(auditData);
      
    } catch (error) {
      console.error('Failed to load trading admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load trading admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set up real-time subscription
  useEffect(() => {
    const subscription = tradingApi.subscribeToUserChanges((payload) => {
      console.log('Real-time update:', payload);
      loadData(); // Refresh data on changes
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadData]);

  // Filter users
  useEffect(() => {
    let filtered = users;
    
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast({
      title: "Data Refreshed",
      description: "Trading admin data has been updated",
    });
  };

  // Handle force win/loss for user
  const handleForceOutcome = async () => {
    if (!forceWinDialog.userId) return;
    
    try {
      if (forceWinDialog.hasTimeFrame) {
        // Create a time window instead of permanent force win
        await tradingApi.createTradeWindow(
          forceWinDialog.userId,
          'win',
          new Date(forceWinDialog.startTime).toISOString(),
          new Date(forceWinDialog.endTime).toISOString(),
          {
            spot: true,
            futures: true,
            options: true,
            arbitrage: true,
            reason: 'Force win via admin panel'
          }
        );
      
        toast({
          title: "Time Window Created",
          description: `${forceWinDialog.userName} will win all trades from ${formatTime(forceWinDialog.startTime)} to ${formatTime(forceWinDialog.endTime)}`,
        });
      } else {
        // Set permanent force win
        await tradingApi.setUserTradeOutcome(
          forceWinDialog.userId,
          'win',
          true,
          {
            spot: true,
            futures: true,
            options: true,
            arbitrage: true
          }
        );
      
        toast({
          title: "Force Win Enabled",
          description: `${forceWinDialog.userName} will now win all trades permanently`,
        });
      }
    
    setForceWinDialog({ 
      open: false, 
      userId: null, 
      userName: '',
      startTime: format(new Date(), "yyyy-MM-dd'T'HH:00"),
      endTime: format(addMinutes(new Date(), 5), "yyyy-MM-dd'T'HH:05"),
      hasTimeFrame: false
    });
    
    loadData(); // Refresh data
    
  } catch (error) {
    console.error('Failed to set force win:', error);
    toast({
      title: "Error",
      description: "Failed to set force win",
      variant: "destructive",
    });
  }
};

  // Handle clear force win
  const handleClearForceWin = async (userId: string, userName: string) => {
    try {
      await tradingApi.clearUserTradeOutcome(userId);
      
      toast({
        title: "Force Win Cleared",
        description: `${userName} will now use default trading outcomes`,
      });
      
      loadData(); // Refresh data
      
    } catch (error) {
      console.error('Failed to clear force win:', error);
      toast({
        title: "Error",
        description: "Failed to clear force win",
        variant: "destructive",
      });
    }
  };

  // Handle create time window
  const handleCreateTimeWindow = async () => {
    if (!timeWindowDialog.userId) return;
    
    try {
      await tradingApi.createTradeWindow(
        timeWindowDialog.userId,
        timeWindowDialog.outcomeType,
        new Date(timeWindowDialog.startTime).toISOString(),
        new Date(timeWindowDialog.endTime).toISOString(),
        {
          spot: timeWindowDialog.spot,
          futures: timeWindowDialog.futures,
          options: timeWindowDialog.options,
          arbitrage: timeWindowDialog.arbitrage,
          reason: timeWindowDialog.reason
        }
      );
      
      toast({
        title: "Time Window Created",
        description: `${timeWindowDialog.userName} will ${timeWindowDialog.outcomeType} trades from ${formatTime(timeWindowDialog.startTime)} to ${formatTime(timeWindowDialog.endTime)}`,
      });
      
      setTimeWindowDialog({
        open: false,
        userId: null,
        userName: '',
        startTime: format(new Date(), "yyyy-MM-dd'T'HH:00"),
        endTime: format(addMinutes(new Date(), 5), "yyyy-MM-dd'T'HH:05"),
        outcomeType: 'win',
        spot: true,
        futures: true,
        options: true,
        arbitrage: true,
        reason: ''
      });
      
      loadData(); // Refresh data
      
    } catch (error) {
      console.error('Failed to create time window:', error);
      toast({
        title: "Error",
        description: "Failed to create time window",
        variant: "destructive",
      });
    }
  };

  // Handle cancel time window
  const handleCancelTimeWindow = async (windowId: string) => {
    try {
      await tradingApi.cancelTradeWindow(windowId);
      
      toast({
        title: "Time Window Cancelled",
        description: "The time window has been cancelled",
      });
      
      loadData(); // Refresh data
      
    } catch (error) {
      console.error('Failed to cancel time window:', error);
      toast({
        title: "Error",
        description: "Failed to cancel time window",
        variant: "destructive",
      });
    }
  };

  // Handle P&L target setting
  const handleSetPnLTarget = async (
    userId: string,
    tradeType: 'spot' | 'futures' | 'options' | 'arbitrage',
    targetProfit: number,
    targetLoss: number,
    reason: string
  ) => {
    try {
      await tradingApi.setPnLTarget(userId, tradeType, targetProfit, targetLoss, reason);
      
      toast({
        title: "P&L Target Set",
        description: `${tradeType.charAt(0).toUpperCase() + tradeType.slice(1)} P&L target set successfully`,
      });
      
      setPnLTargetDialog({ ...pnlTargetDialog, open: false });
      loadData(); // Refresh data
      
    } catch (error) {
      console.error('Failed to set P&L target:', error);
      toast({
        title: "Error",
        description: "Failed to set P&L target",
        variant: "destructive",
      });
    }
  };

  // Handle clear P&L target
  const handleClearPnLTarget = async (userId: string, tradeType: 'spot' | 'futures' | 'options' | 'arbitrage') => {
    try {
      await tradingApi.clearPnLTarget(userId, tradeType);
      
      toast({
        title: "P&L Target Cleared",
        description: `${tradeType.charAt(0).toUpperCase() + tradeType.slice(1)} P&L target cleared`,
      });
      
      loadData(); // Refresh data
      
    } catch (error) {
      console.error('Failed to clear P&L target:', error);
      toast({
        title: "Error",
        description: "Failed to clear P&L target",
        variant: "destructive",
      });
    }
  };

  // Handle update settings
  const handleUpdateSettings = async (updates: Partial<TradingSettings>) => {
    if (!settings) return;

    try {
      const updated = await tradingApi.updateTradingSettings(updates);
      setSettings(updated);
      
      toast({
        title: "Settings Updated",
        description: "Trading system settings have been updated",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#F0B90B] mx-auto mb-4" />
          <p className="text-gray-500">Loading trading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#F0B90B]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-10 h-10 bg-gradient-to-br from-[#F0B90B] to-[#d4a10b] rounded-xl flex items-center justify-center"
              >
                <TrendingUp className="w-5 h-5 text-black" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Trading Control Panel
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Control user trading outcomes and P&L targets in real-time
                </p>
              </div>
            </div>
            {settings && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className="bg-amber-500/20 text-amber-400">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Default: {settings.default_outcome?.toUpperCase()}
                </Badge>
                <Badge className="bg-blue-500/20 text-blue-400">
                  <Zap className="w-3 h-3 mr-1" />
                  Win probability: {settings.win_probability}%
                </Badge>
                <Badge className="bg-purple-500/20 text-purple-400">
                  <Target className="w-3 h-3 mr-1" />
                  P&L Targets Active
                </Badge>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="border-gray-700 hover:bg-gray-800"
                  >
                    <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh data</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </motion.div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-800/50 border border-gray-700/50 p-1">
            <TabsTrigger value="users" className="data-[state=active]:bg-gray-700">
              <Users className="w-4 h-4 mr-2" />
              User Control
            </TabsTrigger>
            <TabsTrigger value="windows" className="data-[state=active]:bg-gray-700">
              <Clock className="w-4 h-4 mr-2" />
              Active Windows
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gray-700">
              <Settings className="w-4 h-4 mr-2" />
              System Settings
            </TabsTrigger>
            <TabsTrigger value="audit" className="data-[state=active]:bg-gray-700">
              <History className="w-4 h-4 mr-2" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          {/* Users Tab - Main Control Panel */}
          <TabsContent value="users" className="space-y-6">
            {/* Search */}
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search users by name, email, or ID..."
                    className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-600"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">User Trading Control</CardTitle>
                    <CardDescription className="text-gray-500">
                      Set force win/loss and P&L targets for individual users
                    </CardDescription>
                  </div>
                  <Badge className="bg-[#F0B90B]/20 text-[#F0B90B]">
                    {filteredUsers.length} users
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700 hover:bg-transparent">
                        <TableHead className="text-gray-500">User</TableHead>
                        <TableHead className="text-gray-500">Current Outcome</TableHead>
                        <TableHead className="text-gray-500">P&L Targets</TableHead>
                        <TableHead className="text-gray-500">Active Windows</TableHead>
                        <TableHead className="text-gray-500">Status</TableHead>
                        <TableHead className="text-gray-500">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id} className="border-gray-700 hover:bg-gray-800/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-gradient-to-br from-[#F0B90B] to-[#d4a10b] text-black text-xs">
                                  {getInitials(user)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {user.first_name} {user.last_name}
                                </p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.trade_outcome?.enabled ? (
                              <div className="space-y-1">
                                {getOutcomeBadge(user.trade_outcome.outcome_type)}
                                <div className="text-xs text-gray-500">
                                  Spot: {user.trade_outcome.spot_enabled ? '✅' : '❌'} |
                                  Futures: {user.trade_outcome.futures_enabled ? '✅' : '❌'} |
                                  Options: {user.trade_outcome.options_enabled ? '✅' : '❌'} |
                                  Arb: {user.trade_outcome.arbitrage_enabled ? '✅' : '❌'}
                                </div>
                              </div>
                            ) : (
                              <Badge className="bg-gray-500/20 text-gray-400">Default</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              {/* Spot P&L Target */}
                              {user.trade_outcome?.spot_target_profit !== null && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Badge className="bg-blue-500/20 text-blue-400 border-0 px-1 py-0">
                                    Spot
                                  </Badge>
                                  <span className="text-green-400">+{user.trade_outcome?.spot_target_profit}</span>
                                  <span className="text-gray-500">/</span>
                                  <span className="text-red-400">{user.trade_outcome?.spot_target_loss}</span>
                                  {user.trade_outcome?.spot_current_pnl !== undefined && (
                                    <span className={`ml-1 ${(user.trade_outcome?.spot_current_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                      ({user.trade_outcome?.spot_current_pnl >= 0 ? '+' : ''}{user.trade_outcome?.spot_current_pnl})
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {/* Futures P&L Target */}
                              {user.trade_outcome?.futures_target_profit !== null && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Badge className="bg-purple-500/20 text-purple-400 border-0 px-1 py-0">
                                    Futures
                                  </Badge>
                                  <span className="text-green-400">+{user.trade_outcome?.futures_target_profit}</span>
                                  <span className="text-gray-500">/</span>
                                  <span className="text-red-400">{user.trade_outcome?.futures_target_loss}</span>
                                  {user.trade_outcome?.futures_current_pnl !== undefined && (
                                    <span className={`ml-1 ${(user.trade_outcome?.futures_current_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                      ({user.trade_outcome?.futures_current_pnl >= 0 ? '+' : ''}{user.trade_outcome?.futures_current_pnl})
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {/* Options P&L Target */}
                              {user.trade_outcome?.options_target_profit !== null && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Badge className="bg-green-500/20 text-green-400 border-0 px-1 py-0">
                                    Options
                                  </Badge>
                                  <span className="text-green-400">+{user.trade_outcome?.options_target_profit}</span>
                                  <span className="text-gray-500">/</span>
                                  <span className="text-red-400">{user.trade_outcome?.options_target_loss}</span>
                                  {user.trade_outcome?.options_current_pnl !== undefined && (
                                    <span className={`ml-1 ${(user.trade_outcome?.options_current_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                      ({user.trade_outcome?.options_current_pnl >= 0 ? '+' : ''}{user.trade_outcome?.options_current_pnl})
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {/* Arbitrage P&L Target */}
                              {user.trade_outcome?.arbitrage_target_profit !== null && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Badge className="bg-yellow-500/20 text-yellow-400 border-0 px-1 py-0">
                                    Arbitrage
                                  </Badge>
                                  <span className="text-green-400">+{user.trade_outcome?.arbitrage_target_profit}</span>
                                  <span className="text-gray-500">/</span>
                                  <span className="text-red-400">{user.trade_outcome?.arbitrage_target_loss}</span>
                                  {user.trade_outcome?.arbitrage_current_pnl !== undefined && (
                                    <span className={`ml-1 ${(user.trade_outcome?.arbitrage_current_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                      ({user.trade_outcome?.arbitrage_current_pnl >= 0 ? '+' : ''}{user.trade_outcome?.arbitrage_current_pnl})
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {!user.trade_outcome?.spot_target_profit && 
                               !user.trade_outcome?.futures_target_profit && 
                               !user.trade_outcome?.options_target_profit && 
                               !user.trade_outcome?.arbitrage_target_profit && (
                                <span className="text-xs text-gray-500">No targets set</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.active_windows && user.active_windows.length > 0 ? (
                              <div className="space-y-1">
                                {user.active_windows.map(window => (
                                  <div key={window.id} className="flex items-center gap-2">
                                    <Badge className={
                                      window.outcome_type === 'win' 
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : window.outcome_type === 'loss'
                                        ? 'bg-rose-500/20 text-rose-400'
                                        : 'bg-gray-500/20 text-gray-400'
                                    }>
                                      {window.outcome_type.toUpperCase()}
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                      {formatTime(window.start_time)}-{formatTime(window.end_time)}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={() => handleCancelTimeWindow(window.id)}
                                    >
                                      <XCircle className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">None</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={user.is_admin ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}>
                              {user.is_admin ? 'Admin' : 'User'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Force Win Button */}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setForceWinDialog({
                                        open: true,
                                        userId: user.id,
                                        userName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                                        startTime: format(new Date(), "yyyy-MM-dd'T'HH:00"),
                                        endTime: format(addMinutes(new Date(), 5), "yyyy-MM-dd'T'HH:05"),
                                        hasTimeFrame: false
                                      })}
                                    >
                                      <Zap className="w-3 h-3 mr-1" />
                                      Force Win
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>User will win all trades</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              {/* Time Window Button */}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setTimeWindowDialog({
                                        ...timeWindowDialog,
                                        open: true,
                                        userId: user.id,
                                        userName: `${user.first_name || ''} ${user.last_name || ''}`.trim()
                                      })}
                                    >
                                      <Clock className="w-3 h-3 mr-1" />
                                      Window
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Set time-based outcome</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              {/* P&L Target Buttons - One for each trade type */}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-blue-500/30 hover:bg-blue-500/10"
                                      onClick={() => setPnLTargetDialog({
                                        open: true,
                                        userId: user.id,
                                        userName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                                        tradeType: 'spot',
                                        targetProfit: user.trade_outcome?.spot_target_profit || 1000,
                                        targetLoss: user.trade_outcome?.spot_target_loss || -500,
                                        reason: user.trade_outcome?.spot_target_reason || ''
                                      })}
                                    >
                                      <BarChart3 className="w-3 h-3 mr-1 text-blue-400" />
                                      Spot
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Set spot trading P&L target</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-purple-500/30 hover:bg-purple-500/10"
                                      onClick={() => setPnLTargetDialog({
                                        open: true,
                                        userId: user.id,
                                        userName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                                        tradeType: 'futures',
                                        targetProfit: user.trade_outcome?.futures_target_profit || 1000,
                                        targetLoss: user.trade_outcome?.futures_target_loss || -500,
                                        reason: user.trade_outcome?.futures_target_reason || ''
                                      })}
                                    >
                                      <TrendingUpIcon className="w-3 h-3 mr-1 text-purple-400" />
                                      Futures
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Set futures trading P&L target</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-green-500/30 hover:bg-green-500/10"
                                      onClick={() => setPnLTargetDialog({
                                        open: true,
                                        userId: user.id,
                                        userName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                                        tradeType: 'options',
                                        targetProfit: user.trade_outcome?.options_target_profit || 1000,
                                        targetLoss: user.trade_outcome?.options_target_loss || -500,
                                        reason: user.trade_outcome?.options_target_reason || ''
                                      })}
                                    >
                                      <PieChart className="w-3 h-3 mr-1 text-green-400" />
                                      Options
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Set options trading P&L target</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-yellow-500/30 hover:bg-yellow-500/10"
                                      onClick={() => setPnLTargetDialog({
                                        open: true,
                                        userId: user.id,
                                        userName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                                        tradeType: 'arbitrage',
                                        targetProfit: user.trade_outcome?.arbitrage_target_profit || 1000,
                                        targetLoss: user.trade_outcome?.arbitrage_target_loss || -500,
                                        reason: user.trade_outcome?.arbitrage_target_reason || ''
                                      })}
                                    >
                                      <Zap className="w-3 h-3 mr-1 text-yellow-400" />
                                      Arbitrage
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Set arbitrage P&L target</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              {user.trade_outcome?.enabled && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 text-rose-400"
                                        onClick={() => handleClearForceWin(user.id, `${user.first_name || ''} ${user.last_name || ''}`.trim())}
                                      >
                                        <Ban className="w-3 h-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Clear force win</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Windows Tab */}
          <TabsContent value="windows" className="space-y-6">
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Active Time Windows</CardTitle>
                <CardDescription className="text-gray-500">
                  Currently active time-based trading controls
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.filter(u => u.active_windows && u.active_windows.length > 0).length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500">No active time windows</p>
                    </div>
                  ) : (
                    users.filter(u => u.active_windows && u.active_windows.length > 0).map(user => (
                      <div key={user.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {getInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-white">
                            {user.first_name} {user.last_name}
                          </span>
                        </div>
                        {user.active_windows?.map(window => (
                          <Card key={window.id} className="bg-gray-800/50 border-gray-700 ml-8">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    {getOutcomeBadge(window.outcome_type)}
                                    <span className="text-xs text-gray-500">
                                      {formatDate(window.start_time)} - {formatDate(window.end_time)}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Spot: {window.spot_enabled ? '✅' : '❌'} |
                                    Futures: {window.futures_enabled ? '✅' : '❌'} |
                                    Options: {window.options_enabled ? '✅' : '❌'} |
                                    Arb: {window.arbitrage_enabled ? '✅' : '❌'}
                                  </div>
                                  {window.reason && (
                                    <p className="text-xs text-gray-500">Reason: {window.reason}</p>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-rose-400"
                                  onClick={() => handleCancelTimeWindow(window.id)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Trading System Settings</CardTitle>
                <CardDescription className="text-gray-500">
                  Configure default trading outcomes for all users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settings && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-400">Default Outcome</Label>
                        <Select
                          value={settings.default_outcome}
                          onValueChange={(value: 'win' | 'loss' | 'random') => 
                            handleUpdateSettings({ default_outcome: value })
                          }
                        >
                          <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="win">Always Win</SelectItem>
                            <SelectItem value="loss">Always Lose</SelectItem>
                            <SelectItem value="random">Random</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-gray-400">Win Probability (for Random)</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[settings.win_probability || 30]}
                            onValueChange={([value]) => handleUpdateSettings({ win_probability: value })}
                            min={0}
                            max={100}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-white font-mono w-12">{settings.win_probability}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-400">Spot Default</Label>
                        <Select
                          value={settings.spot_default}
                          onValueChange={(value: 'win' | 'loss' | 'random') => 
                            handleUpdateSettings({ spot_default: value })
                          }
                        >
                          <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="win">Always Win</SelectItem>
                            <SelectItem value="loss">Always Lose</SelectItem>
                            <SelectItem value="random">Random</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-gray-400">Futures Default</Label>
                        <Select
                          value={settings.futures_default}
                          onValueChange={(value: 'win' | 'loss' | 'random') => 
                            handleUpdateSettings({ futures_default: value })
                          }
                        >
                          <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="win">Always Win</SelectItem>
                            <SelectItem value="loss">Always Lose</SelectItem>
                            <SelectItem value="random">Random</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-gray-400">Options Default</Label>
                        <Select
                          value={settings.options_default}
                          onValueChange={(value: 'win' | 'loss' | 'random') => 
                            handleUpdateSettings({ options_default: value })
                          }
                        >
                          <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="win">Always Win</SelectItem>
                            <SelectItem value="loss">Always Lose</SelectItem>
                            <SelectItem value="random">Random</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-gray-400">Arbitrage Default</Label>
                        <Select
                          value={settings.arbitrage_default}
                          onValueChange={(value: 'win' | 'loss' | 'random') => 
                            handleUpdateSettings({ arbitrage_default: value })
                          }
                        >
                          <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="win">Always Win</SelectItem>
                            <SelectItem value="loss">Always Lose</SelectItem>
                            <SelectItem value="random">Random</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-400 font-medium mb-1">Default Behavior</p>
                      <p className="text-xs text-gray-400">
                        By default, users will lose trades unless explicitly set to win via Force Win or Time Windows.
                        Individual user settings override system defaults. P&L targets can be set per trading type.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit" className="space-y-6">
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Admin Action Log</CardTitle>
                <CardDescription className="text-gray-500">
                  Recent admin actions on trading controls
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditLogs.length === 0 ? (
                    <div className="text-center py-8">
                      <History className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500">No audit logs yet</p>
                    </div>
                  ) : (
                    auditLogs.map((log, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg">
                        <div className="p-1.5 bg-[#F0B90B]/20 rounded-lg">
                          <Activity className="w-3 h-3 text-[#F0B90B]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white">{log.action}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <span>By: {log.admin_email}</span>
                            {log.user_email && <span>• User: {log.user_email}</span>}
                            <span>• {formatDate(log.created_at)}</span>
                          </div>
                          {log.details && (
                            <pre className="mt-2 text-xs bg-gray-900/50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Force Win Dialog */}
        <Dialog open={forceWinDialog.open} onOpenChange={(open) => setForceWinDialog({ ...forceWinDialog, open })}>
          <DialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                Force Win for {forceWinDialog.userName}
              </DialogTitle>
              <DialogDescription className="text-gray-500">
                This user will win all trades during the specified time period
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Enable Time Frame Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#F0B90B]" />
                  <span className="text-sm text-white">Enable Time Frame</span>
                </div>
                <Switch
                  checked={forceWinDialog.hasTimeFrame}
                  onCheckedChange={(checked) => setForceWinDialog({ ...forceWinDialog, hasTimeFrame: checked })}
                />
              </div>

              {/* Time Frame Inputs - Only show if enabled */}
              {forceWinDialog.hasTimeFrame && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="forceWinStartTime" className="text-gray-400">Start Time</Label>
                      <Input
                        id="forceWinStartTime"
                        type="datetime-local"
                        value={forceWinDialog.startTime}
                        onChange={(e) => setForceWinDialog({ ...forceWinDialog, startTime: e.target.value })}
                        className="bg-gray-800/50 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="forceWinEndTime" className="text-gray-400">End Time</Label>
                      <Input
                        id="forceWinEndTime"
                        type="datetime-local"
                        value={forceWinDialog.endTime}
                        onChange={(e) => setForceWinDialog({ ...forceWinDialog, endTime: e.target.value })}
                        className="bg-gray-800/50 border-gray-700 text-white"
                      />
                    </div>
                  </div>

                  {/* Quick time presets */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-gray-700 text-xs"
                      onClick={() => {
                        const start = new Date();
                        const end = addMinutes(start, 5);
                        setForceWinDialog({
                          ...forceWinDialog,
                          startTime: format(start, "yyyy-MM-dd'T'HH:00"),
                          endTime: format(end, "yyyy-MM-dd'T'HH:05")
                        });
                      }}
                    >
                      5 min
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-gray-700 text-xs"
                      onClick={() => {
                        const start = new Date();
                        const end = addMinutes(start, 15);
                        setForceWinDialog({
                          ...forceWinDialog,
                          startTime: format(start, "yyyy-MM-dd'T'HH:00"),
                          endTime: format(end, "yyyy-MM-dd'T'HH:15")
                        });
                      }}
                    >
                      15 min
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-gray-700 text-xs"
                      onClick={() => {
                        const start = new Date();
                        const end = addMinutes(start, 30);
                        setForceWinDialog({
                          ...forceWinDialog,
                          startTime: format(start, "yyyy-MM-dd'T'HH:00"),
                          endTime: format(end, "yyyy-MM-dd'T'HH:30")
                        });
                      }}
                    >
                      30 min
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-gray-700 text-xs"
                      onClick={() => {
                        const start = new Date();
                        const end = addHours(start, 1);
                        setForceWinDialog({
                          ...forceWinDialog,
                          startTime: format(start, "yyyy-MM-dd'T'HH:00"),
                          endTime: format(end, "yyyy-MM-dd'T'HH:00")
                        });
                      }}
                    >
                      1 hour
                    </Button>
                  </div>
                </>
              )}

              {/* Info message */}
              <div className={cn(
                "p-3 rounded-lg border",
                forceWinDialog.hasTimeFrame 
                  ? "bg-amber-500/10 border-amber-500/30" 
                  : "bg-emerald-500/10 border-emerald-500/30"
              )}>
                <div className="flex items-start gap-3">
                  {forceWinDialog.hasTimeFrame ? (
                    <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <Zap className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={cn(
                      "text-sm font-medium mb-1",
                      forceWinDialog.hasTimeFrame ? "text-amber-400" : "text-emerald-400"
                    )}>
                      {forceWinDialog.hasTimeFrame ? "Time-Limited Force Win" : "Permanent Force Win"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {forceWinDialog.hasTimeFrame 
                        ? `User will win all trades from ${formatTime(forceWinDialog.startTime)} to ${formatTime(forceWinDialog.endTime)}` 
                        : "User will win all trades indefinitely until manually disabled"
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setForceWinDialog({ 
                  open: false, 
                  userId: null, 
                  userName: '',
                  startTime: format(new Date(), "yyyy-MM-dd'T'HH:00"),
                  endTime: format(addMinutes(new Date(), 5), "yyyy-MM-dd'T'HH:05"),
                  hasTimeFrame: false
                })}
                className="border-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleForceOutcome}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                {forceWinDialog.hasTimeFrame ? 'Create Time Window' : 'Enable Force Win'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Time Window Dialog */}
        <Dialog open={timeWindowDialog.open} onOpenChange={(open) => setTimeWindowDialog({ ...timeWindowDialog, open })}>
          <DialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#F0B90B]" />
                Time Window for {timeWindowDialog.userName}
              </DialogTitle>
              <DialogDescription className="text-gray-500">
                Set a time period for forced outcomes
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label className="text-gray-400">Outcome</Label>
                <Select
                  value={timeWindowDialog.outcomeType}
                  onValueChange={(value: any) => setTimeWindowDialog({ ...timeWindowDialog, outcomeType: value })}
                >
                  <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="win">Win</SelectItem>
                    <SelectItem value="loss">Loss</SelectItem>
                    <SelectItem value="default">Default</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime" className="text-gray-400">Start Time</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={timeWindowDialog.startTime}
                    onChange={(e) => setTimeWindowDialog({ ...timeWindowDialog, startTime: e.target.value })}
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="endTime" className="text-gray-400">End Time</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={timeWindowDialog.endTime}
                    onChange={(e) => setTimeWindowDialog({ ...timeWindowDialog, endTime: e.target.value })}
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-400 mb-2 block">Apply to</Label>
                <div className="space-y-2">
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Spot Trading</span>
                    <Switch
                      checked={timeWindowDialog.spot}
                      onCheckedChange={(checked) => setTimeWindowDialog({ ...timeWindowDialog, spot: checked })}
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Futures Trading</span>
                    <Switch
                      checked={timeWindowDialog.futures}
                      onCheckedChange={(checked) => setTimeWindowDialog({ ...timeWindowDialog, futures: checked })}
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Options Trading</span>
                    <Switch
                      checked={timeWindowDialog.options}
                      onCheckedChange={(checked) => setTimeWindowDialog({ ...timeWindowDialog, options: checked })}
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Arbitrage</span>
                    <Switch
                      checked={timeWindowDialog.arbitrage}
                      onCheckedChange={(checked) => setTimeWindowDialog({ ...timeWindowDialog, arbitrage: checked })}
                    />
                  </label>
                </div>
              </div>

              <div>
                <Label className="text-gray-400">Reason (Optional)</Label>
                <Textarea
                  value={timeWindowDialog.reason}
                  onChange={(e) => setTimeWindowDialog({ ...timeWindowDialog, reason: e.target.value })}
                  placeholder="Why is this window being created?"
                  className="bg-gray-800/50 border-gray-700 text-white"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setTimeWindowDialog({ ...timeWindowDialog, open: false })}
                className="border-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTimeWindow}
                className="bg-[#F0B90B] text-black hover:bg-yellow-400"
              >
                Create Window
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* P&L Target Dialog */}
        <PnLTargetDialog
          open={pnlTargetDialog.open}
          userId={pnlTargetDialog.userId}
          userName={pnlTargetDialog.userName}
          tradeType={pnlTargetDialog.tradeType}
          targetProfit={pnlTargetDialog.targetProfit}
          targetLoss={pnlTargetDialog.targetLoss}
          reason={pnlTargetDialog.reason}
          onOpenChange={(open) => setPnLTargetDialog({ ...pnlTargetDialog, open })}
          onSetTarget={handleSetPnLTarget}
        />
      </div>
    </div>
  );
}