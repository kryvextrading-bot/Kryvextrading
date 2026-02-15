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
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { tradingAdminApi, UserWithTrading, TradeWindow, TradingSettings } from '@/services/trading-admin-api';
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
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import ErrorBoundary from '@/components/ErrorBoundary';

// ==================== TYPES ====================
interface ForceWinDialogState {
  open: boolean;
  userId: string | null;
  userName: string;
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
  return user.email[0].toUpperCase();
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

// ==================== MOCK DATA FOR DEMO MODE ====================
const mockUsers: UserWithTrading[] = [
  {
    id: '1',
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'User',
    is_admin: true,
    created_at: new Date().toISOString(),
    trade_outcome: {
      id: '1',
      user_id: '1',
      enabled: true,
      outcome_type: 'win',
      spot_enabled: true,
      futures_enabled: true,
      options_enabled: true,
      arbitrage_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    active_windows: []
  },
  {
    id: '2',
    email: 'user1@example.com',
    first_name: 'Test',
    last_name: 'User',
    is_admin: false,
    created_at: new Date().toISOString(),
    active_windows: [
      {
        id: '1',
        user_id: '2',
        outcome_type: 'loss',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString(),
        spot_enabled: true,
        futures_enabled: false,
        options_enabled: true,
        arbitrage_enabled: false,
        reason: 'Testing window',
        active: true,
        created_at: new Date().toISOString()
      }
    ]
  }
];

const mockSettings: TradingSettings = {
  id: '1',
  default_outcome: 'loss',
  win_probability: 30,
  spot_default: 'loss',
  futures_default: 'loss',
  options_default: 'loss',
  arbitrage_default: 'loss',
  updated_at: new Date().toISOString()
};

const mockAuditLogs = [
  {
    id: '1',
    admin_id: '1',
    admin_email: 'admin@example.com',
    action: 'set_trade_outcome',
    user_id: '1',
    user_email: 'admin@example.com',
    details: { outcomeType: 'win' },
    created_at: new Date().toISOString()
  }
];

// ==================== MAIN COMPONENT ====================
function TradingAdminPanelContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State - start with empty arrays to avoid initialization issues
  const [users, setUsers] = useState<UserWithTrading[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithTrading[]>([]);
  const [settings, setSettings] = useState<TradingSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithTrading | null>(null);
  
  // Dialog States
  const [forceWinDialog, setForceWinDialog] = useState<ForceWinDialogState>({
    open: false,
    userId: null,
    userName: ''
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

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Demo data for fallback
      const demoUsers: UserWithTrading[] = [
        {
          id: '1',
          email: 'admin@example.com',
          first_name: 'Admin',
          last_name: 'User',
          is_admin: true,
          created_at: new Date().toISOString(),
          trade_outcome: {
            id: '1',
            user_id: '1',
            enabled: true,
            outcome_type: 'win' as const,
            spot_enabled: true,
            futures_enabled: true,
            options_enabled: true,
            arbitrage_enabled: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          active_windows: []
        },
        {
          id: '2',
          email: 'user1@example.com',
          first_name: 'Test',
          last_name: 'User',
          is_admin: false,
          created_at: new Date().toISOString(),
          active_windows: [
            {
              id: '1',
              user_id: '2',
              outcome_type: 'loss' as const,
              start_time: new Date().toISOString(),
              end_time: new Date(Date.now() + 3600000).toISOString(),
              spot_enabled: true,
              futures_enabled: false,
              options_enabled: true,
              arbitrage_enabled: false,
              reason: 'Testing window',
              active: true,
              created_at: new Date().toISOString()
            }
          ]
        }
      ];

      const demoSettings: TradingSettings = {
        id: '1',
        default_outcome: 'loss' as const,
        win_probability: 30,
        spot_default: 'loss' as const,
        futures_default: 'loss' as const,
        options_default: 'loss' as const,
        arbitrage_default: 'loss' as const,
        updated_at: new Date().toISOString()
      };

      const demoAuditLogs = [
        {
          id: '1',
          admin_id: '1',
          admin_email: 'admin@example.com',
          action: 'set_trade_outcome',
          user_id: '1',
          user_email: 'admin@example.com',
          details: { outcomeType: 'win' },
          created_at: new Date().toISOString()
        }
      ];
      
      // Set demo data immediately to prevent empty state
      setUsers(demoUsers);
      setFilteredUsers(demoUsers);
      setSettings(demoSettings);
      setAuditLogs(demoAuditLogs);
      setIsDemoMode(true);
      
      // Try real data, but keep demo as fallback
      try {
        const [usersData, settingsData, auditData] = await Promise.all([
          tradingAdminApi.getUsers(),
          tradingAdminApi.getTradingSettings(),
          tradingAdminApi.getAuditLogs(50)
        ]);
        
        if (usersData && usersData.length > 0) {
          setUsers(usersData);
          setFilteredUsers(usersData);
          setIsDemoMode(false);
        }
        
        if (settingsData) {
          setSettings(settingsData);
        }
        
        if (auditData && auditData.length > 0) {
          setAuditLogs(auditData);
        }
        
        toast({
          title: "Connected to Database",
          description: "Using live data",
          variant: "default",
        });
      } catch (dbError) {
        console.log('Database not available, using demo data');
        toast({
          title: "Demo Mode Active",
          description: "Using demo data. Run database setup for full functionality.",
          variant: "default",
        });
      }
      
    } catch (error) {
      console.error('Failed to load trading admin data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Demo Mode Active",
        description: "Using demo data due to connection issues.",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    let subscription: any = null;
    
    const setupSubscription = () => {
      try {
        subscription = tradingAdminApi.subscribeToUserChanges((payload) => {
          console.log('Real-time update:', payload);
          loadData(); // Refresh data on changes
        });
      } catch (error) {
        console.error('Error setting up subscription:', error);
        // Don't crash if subscription fails
      }
    };

    setupSubscription();
    
    return () => {
      try {
        if (subscription && subscription.unsubscribe) {
          subscription.unsubscribe();
        }
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    };
  }, []);

  // Filter users
  useEffect(() => {
    let filtered = users;
    
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase())
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
      await tradingAdminApi.setUserTradeOutcome(
        forceWinDialog.userId,
        'win', // Always win for force win
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
        description: `${forceWinDialog.userName} will now win all trades`,
      });
      
      setForceWinDialog({ open: false, userId: null, userName: '' });
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
      await tradingAdminApi.clearUserTradeOutcome(userId);
      
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
      await tradingAdminApi.createTradeWindow(
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
      await tradingAdminApi.cancelTradeWindow(windowId);
      
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

  // Handle update settings
  const handleUpdateSettings = async (updates: Partial<TradingSettings>) => {
    try {
      const newSettings = await tradingAdminApi.updateTradingSettings(updates);
      setSettings(newSettings);
      
      toast({
        title: "Settings Updated",
        description: "Trading system settings have been updated",
      });
      
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  // If loading, show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-xl">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-[#F0B90B]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-8 h-8 text-[#F0B90B] animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Loading Trading Control</h3>
              <p className="text-gray-400">
                Initializing trading control panel...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If there's a critical error, show error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-xl">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Demo Mode Active</h3>
              <p className="text-gray-400 mb-4">
                {error || 'Database not connected. Using demo data for testing.'}
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={loadData} 
                  className="w-full bg-[#F0B90B] text-black hover:bg-yellow-400"
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/admin/dashboard'}
                  className="w-full border-gray-700"
                >
                  Back to Dashboard
                </Button>
              </div>
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-xs text-amber-400">
                  💡 Run the trading-control-setup.sql script in Supabase to enable full functionality
                </p>
              </div>
              <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-400">
                  🎮 Demo mode shows sample data and UI functionality
                </p>
              </div>
            </CardContent>
          </Card>
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
                  Control user trading outcomes in real-time
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-amber-500/20 text-amber-400">
                <AlertCircle className="w-3 h-3 mr-1" />
                Default outcome: {settings?.default_outcome?.toUpperCase()}
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-400">
                <Zap className="w-3 h-3 mr-1" />
                Win probability: {settings?.win_probability}%
              </Badge>
              {isDemoMode && (
                <Badge className="bg-orange-500/20 text-orange-400">
                  <Info className="w-3 h-3 mr-1" />
                  Demo Mode
                </Badge>
              )}
            </div>
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
                      Set force win/loss for individual users
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
                            <div className="flex items-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                      onClick={() => setForceWinDialog({
                                        open: true,
                                        userId: user.id,
                                        userName: `${user.first_name} ${user.last_name}`
                                      })}
                                    >
                                      <Zap className="w-3 h-3 mr-1" />
                                      Force Win
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>User will win all trades</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                                      onClick={() => setTimeWindowDialog({
                                        ...timeWindowDialog,
                                        open: true,
                                        userId: user.id,
                                        userName: `${user.first_name} ${user.last_name}`
                                      })}
                                    >
                                      <Clock className="w-3 h-3 mr-1" />
                                      Time Window
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Set time-based outcome</TooltipContent>
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
                                        onClick={() => handleClearForceWin(user.id, `${user.first_name} ${user.last_name}`)}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-400">Default Outcome</Label>
                      <Select
                        value={settings?.default_outcome}
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
                          value={[settings?.win_probability || 30]}
                          onValueChange={([value]) => handleUpdateSettings({ win_probability: value })}
                          min={0}
                          max={100}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-white font-mono w-12">{settings?.win_probability}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-400">Spot Default</Label>
                      <Select
                        value={settings?.spot_default}
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
                        value={settings?.futures_default}
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
                        value={settings?.options_default}
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
                        value={settings?.arbitrage_default}
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

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-400 font-medium mb-1">Default Behavior</p>
                      <p className="text-xs text-gray-400">
                        By default, users will lose trades unless explicitly set to win via Force Win or Time Windows.
                        Individual user settings override system defaults.
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
                            <pre className="mt-2 text-xs bg-gray-900/50 p-2 rounded">
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
          <DialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                Force Win for {forceWinDialog.userName}
              </DialogTitle>
              <DialogDescription className="text-gray-500">
                This user will win all trades (spot, futures, options, arbitrage)
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-emerald-400 font-medium mb-1">Force Win Enabled</p>
                    <p className="text-xs text-gray-400">
                      All trades placed by this user will result in wins until disabled.
                      This overrides system defaults and time windows.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setForceWinDialog({ ...forceWinDialog, open: false })}
                className="border-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleForceOutcome}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                Enable Force Win
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
                  <Label className="text-gray-400">Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={timeWindowDialog.startTime}
                    onChange={(e) => setTimeWindowDialog({ ...timeWindowDialog, startTime: e.target.value })}
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-400">End Time</Label>
                  <Input
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
      </div>
    </div>
  );
}

// Temporary simple version to isolate the issue
import TradingAdminSimple from './TradingAdminSimple';

export default TradingAdminSimple;