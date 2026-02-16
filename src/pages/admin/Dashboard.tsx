import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp } from '@/components/icons/TrendingUp';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, BarChart, Bar, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart, Scatter
} from 'recharts';
import {
  Users, Shield, DollarSign, TrendingDown, Settings, Activity,
  AlertTriangle, CheckCircle, XCircle, Clock, Download, Filter,
  Search, Plus, Edit, Trash2, Save, RefreshCw, Eye, EyeOff,
  Home, Briefcase, CreditCard, Globe, Lock, UserCheck,
  Bell, Calendar, FileText, BarChart3, PieChart as PieChartIcon,
  ArrowUp, ArrowDown, ChevronRight, ChevronLeft, MoreHorizontal,
  Smartphone, Database, Cloud, Server, Cpu, Wifi, WifiOff, HardDrive,
  Zap, Copy, Upload, Download as DownloadIcon, Mail, MessageSquare,
  Phone, Headphones, Book, HelpCircle, Key, Fingerprint,
  ShieldAlert, ShieldCheck, AlertOctagon, Flag, Award, Star,
  Coffee, Moon, Sun, Monitor, Battery, Wind, Compass, Wallet,
  LayoutDashboard, Users2, LineChart as LineChartIcon, PieChart as PieChartIcon2,
  BarChart2, Activity as ActivityIcon,
  AlertCircle, CheckCircle2, XCircle as XCircleIcon, Info,
  Maximize2, Minimize2, RefreshCcw, DownloadCloud, UploadCloud,
  Grid, List, ChevronUp, ChevronDown, ArrowUpRight, ArrowDownRight,
  Circle, CircleDot, CircleDashed, CircleOff, CircleSlash,
  Sparkles, Rocket, Target, Medal, Crown, Gem, Diamond,
  Wind as WindIcon, Waves, ZapOff, Zap as ZapIcon, Flame,
  Snowflake, CloudLightning, CloudRain, CloudSnow, CloudSun,
  Sun as SunIcon, Moon as MoonIcon, Sunrise, Sunset,
  Clock as ClockIcon, Hourglass, Timer, AlarmClock,
  Calendar as CalendarIcon, CalendarDays, CalendarRange,
  MapPin, Map, Navigation, Compass as CompassIcon,
  Layers, Box, Package, Archive, Folder, FolderOpen,
  File, FilePlus, FileMinus, FileCheck, FileWarning,
  Image, Video, Music, Camera, Video as VideoIcon,
  MessageCircle, Heart, Share2, ThumbsUp, ThumbsDown,
  Award as AwardIcon, Trophy, Target as TargetIcon,
  Flag as FlagIcon, Bookmark, BookmarkCheck,
  Bell as BellIcon, BellOff, BellRing,
  Volume2, VolumeX, Mic, MicOff,
  Wifi as WifiIcon, WifiOff as WifiOffIcon, Bluetooth,
  Battery as BatteryIcon, BatteryCharging, BatteryWarning,
  Printer, Scan, QrCode, Barcode,
  Link, Link2Off, ExternalLink, Share,
  Repeat, Shuffle, Play, Pause, Stop,
  Volume1, Volume, VolumeX as VolumeXIcon,
  Maximize, Minimize, Move, RotateCw,
  Trash, Archive as ArchiveIcon, Undo, Redo,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import UserManagement from './UserManagementEnhanced';
import InvestmentAdminPanel from './InvestmentAdmin';
import TradingAdminPanel from './TradingAdmin';
import SimpleTransactionManagement from './SimpleTransactionManagement';
import { SystemSettings } from './SystemSettings';
import RolePermissions from './RolePermissions';
import WalletManagement from './WalletManagement';
import { createMockWebSocket } from '@/services/websocket';
import { cn } from '@/lib/utils';
import { apiService } from '@/services/api';

// ==================== ANIMATION VARIANTS ====================
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const fadeInScale = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 }
};

const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const pulseAnimation = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// ==================== ADMIN SECTIONS ====================
const adminSections = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, color: 'from-blue-500 to-cyan-500' },
  { key: 'users', label: 'User Management', icon: Users2, color: 'from-purple-500 to-pink-500' },
  { key: 'wallet', label: 'Wallet Management', icon: Wallet, color: 'from-emerald-500 to-teal-500' },
  { key: 'finance', label: 'Financial', icon: DollarSign, color: 'from-green-500 to-emerald-500' },
  { key: 'trading', label: 'Trading', icon: TrendingUp, color: 'from-blue-500 to-indigo-500' },
  { key: 'trading-control', label: 'Trading Control', icon: Zap, color: 'from-amber-500 to-yellow-500' },
  { key: 'investment', label: 'Investment', icon: Target, color: 'from-orange-500 to-red-500' },
  { key: 'platform', label: 'Platform', icon: Settings, color: 'from-gray-500 to-slate-500' },
  { key: 'security', label: 'Security', icon: Shield, color: 'from-red-500 to-rose-500' },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, color: 'from-violet-500 to-purple-500' },
];

// ==================== COLORS ====================
const COLORS = {
  primary: '#F0B90B',
  primaryDark: '#d4a10b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
  background: '#0B0E11',
  card: '#1E2329',
  border: '#2B3139',
  text: '#EAECEF',
  textSecondary: '#848E9C',
  textMuted: '#5E6673',
};

const PIE_COLORS = ['#F0B90B', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444'];
const CHART_GRADIENTS = {
  primary: ['#F0B90B', '#d4a10b'],
  success: ['#10b981', '#059669'],
  info: ['#3b82f6', '#2563eb'],
  purple: ['#8b5cf6', '#7c3aed'],
};

// ==================== STATS CARD ====================
const StatsCard = ({ title, value, icon: Icon, change, changeType, subtitle, trend, trendValue, color = 'primary' }: any) => {
  const getGradient = () => {
    switch (color) {
      case 'primary': return 'from-[#F0B90B] to-[#d4a10b]';
      case 'success': return 'from-emerald-500 to-green-600';
      case 'danger': return 'from-rose-500 to-red-600';
      case 'info': return 'from-blue-500 to-cyan-600';
      case 'warning': return 'from-orange-500 to-amber-600';
      case 'purple': return 'from-purple-500 to-violet-600';
      default: return 'from-[#F0B90B] to-[#d4a10b]';
    }
  };

  // Don't render if no value is provided
  if (!value) {
    return null;
  }

  return (
    <motion.div
      variants={fadeInScale}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative group"
    >
      <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-bold text-white mt-1"
              >
                {value}
              </motion.p>
            </div>
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.1 }}
              className={cn(
                "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center",
                getGradient()
              )}
            >
              <Icon className="w-6 h-6 text-white" />
            </motion.div>
          </div>
          
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          
          {(change !== undefined || trend) && (
            <div className="flex items-center gap-3 mt-4">
              {change !== undefined && (
                <div className={cn(
                  "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                  changeType === 'positive' ? 'bg-emerald-500/20 text-emerald-400' :
                  changeType === 'negative' ? 'bg-rose-500/20 text-rose-400' :
                  'bg-[#F0B90B]/20 text-[#F0B90B]'
                )}>
                  {changeType === 'positive' && <ArrowUp className="w-3 h-3" />}
                  {changeType === 'negative' && <ArrowDown className="w-3 h-3" />}
                  <span>{change}</span>
                </div>
              )}
              
              {trend && (
                <div className={cn(
                  "flex items-center gap-1 text-xs",
                  trend === 'up' ? 'text-emerald-400' :
                  trend === 'down' ? 'text-rose-400' :
                  'text-[#F0B90B]'
                )}>
                  {trend === 'up' && <TrendingUp className="w-3 h-3" />}
                  {trend === 'down' && <TrendingDown className="w-3 h-3" />}
                  <span>{trendValue}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/5 to-transparent rounded-full blur-2xl" />
      </Card>
    </motion.div>
  );
};

// ==================== NOTIFICATION CARD ====================
const NotificationCard = ({ notification, onDismiss }: any) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success': return CheckCircle2;
      case 'warning': return AlertTriangle;
      case 'error': return XCircleIcon;
      case 'info': return Info;
      default: return Bell;
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case 'success': return 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 text-emerald-400';
      case 'warning': return 'from-orange-500/20 to-orange-600/5 border-orange-500/30 text-orange-400';
      case 'error': return 'from-rose-500/20 to-rose-600/5 border-rose-500/30 text-rose-400';
      default: return 'from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-400';
    }
  };

  const Icon = getIcon();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "relative overflow-hidden rounded-lg border bg-gradient-to-r p-4",
        getColors()
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium mb-1">{notification.title}</p>
          <p className="text-xs opacity-90 mb-2">{notification.message}</p>
          <div className="flex items-center gap-2 text-xs opacity-75">
            <ClockIcon className="w-3 h-3" />
            <span>{new Date(notification.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
        {onDismiss && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 rounded-full hover:bg-white/10"
            onClick={() => onDismiss(notification.id)}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
      
      {/* Progress bar for auto-dismiss */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 5, ease: 'linear' }}
        className="absolute bottom-0 left-0 h-0.5 bg-current opacity-30"
      />
    </motion.div>
  );
};

// ==================== QUICK ACTION CARD ====================
const QuickActionCard = ({ icon: Icon, title, description, onClick, color = 'primary' }: any) => {
  const getGradient = () => {
    switch (color) {
      case 'primary': return 'from-[#F0B90B] to-[#d4a10b]';
      case 'success': return 'from-emerald-500 to-green-600';
      case 'danger': return 'from-rose-500 to-red-600';
      case 'info': return 'from-blue-500 to-cyan-600';
      case 'warning': return 'from-orange-500 to-amber-600';
      case 'purple': return 'from-purple-500 to-violet-600';
      default: return 'from-[#F0B90B] to-[#d4a10b]';
    }
  };

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/30 backdrop-blur-xl hover:border-gray-600/50 transition-all overflow-hidden group">
        <div className="p-5">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center group-hover:scale-110 transition-transform",
              getGradient()
            )}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-white mb-1">{title}</h3>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// ==================== CHART CARD ====================
const ChartCard = ({ title, subtitle, children, action, className }: any) => {
  return (
    <motion.div variants={fadeInUp}>
      <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/30 backdrop-blur-xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
            {action && (
              <div className="flex items-center gap-2">
                {action}
              </div>
            )}
          </div>
          <div className={className}>
            {children}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// ==================== STATUS BADGE ====================
const StatusBadge = ({ status, type = 'default', size = 'md' }: any) => {
  const getConfig = () => {
    switch (type) {
      case 'system':
        return status === 'healthy' 
          ? { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 }
          : status === 'warning'
          ? { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: AlertTriangle }
          : { color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: XCircleIcon };
      case 'user':
        return status === 'active'
          ? { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: UserCheck }
          : status === 'pending'
          ? { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: Clock }
          : { color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: UserMinus };
      default:
        return { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Circle };
    }
  };

  const config = getConfig();
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        sizeClasses,
        config.color
      )}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      <span className="capitalize">{status}</span>
    </motion.div>
  );
};

// ==================== METRIC PROGRESS ====================
const MetricProgress = ({ label, value, max = 100, color = 'primary', showValue = true }: any) => {
  const percentage = (value / max) * 100;
  
  const getColor = () => {
    switch (color) {
      case 'primary': return 'bg-[#F0B90B]';
      case 'success': return 'bg-emerald-500';
      case 'danger': return 'bg-rose-500';
      case 'info': return 'bg-blue-500';
      case 'warning': return 'bg-orange-500';
      case 'purple': return 'bg-purple-500';
      default: return 'bg-[#F0B90B]';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">{label}</span>
        {showValue && <span className="text-white font-medium">{value}</span>}
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay: 0.2 }}
          className={cn("h-full rounded-full", getColor())}
        />
      </div>
    </div>
  );
};

// ==================== MAIN ADMIN DASHBOARD ====================
export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Real-time updates
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [wsConnection, setWsConnection] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [notifications, setNotifications] = useState<any[]>([]);
  const wsReconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Chart data
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [transactionData, setTransactionData] = useState<any[]>([]);
  const [userDistribution, setUserDistribution] = useState<any[]>([]);

  // WebSocket connection for real-time updates
  const connectWebSocket = useCallback(() => {
    if (!liveUpdates) return;

    try {
      console.log('🔌 Connecting to WebSocket...');
      const ws = createMockWebSocket('ws://supabase-realtime/admin/dashboard');
      
      ws.addEventListener('open', () => {
        console.log('✅ Admin Dashboard WebSocket connected');
        wsReconnectAttempts.current = 0;
        toast({
          title: "Live Updates Active",
          description: "Real-time dashboard monitoring enabled",
        });
      });

      ws.addEventListener('message', (event) => {
        try {
          // Comprehensive message validation
          if (!event.data) {
            console.warn('⚠️ Received null/undefined WebSocket message, skipping...');
            return;
          }

          if (typeof event.data !== 'string') {
            console.warn('⚠️ Received non-string WebSocket message, skipping...', typeof event.data);
            return;
          }

          if (event.data.trim() === '' || event.data === '{}') {
            console.warn('⚠️ Received empty WebSocket message, skipping...');
            return;
          }

          // Log raw message for debugging
          console.log('🔍 Raw WebSocket message:', event.data);

          const message = JSON.parse(event.data);
          
          // Validate message structure
          if (!message || typeof message !== 'object') {
            console.warn('⚠️ Received invalid message object, skipping...', message);
            return;
          }

          if (!message.type) {
            console.warn('⚠️ Received message without type, skipping...', message);
            return;
          }

          setLastUpdate(new Date());
          console.log('📨 WebSocket message received:', message.type);

          switch (message.type) {
            case 'stats_update':
              setStats(message.data);
              updateChartData(message.data);
              break;
            case 'new_user':
              setUsers(prev => [message.data, ...prev]);
              setNotifications(prev => [{
                id: Date.now().toString(),
                type: 'info',
                title: 'New User Registered',
                message: `${message.data.firstName} ${message.data.lastName} has joined the platform`,
                timestamp: new Date().toISOString()
              }, ...prev.slice(0, 4)]);
              break;
            case 'security_alert':
              setSecurityEvents(prev => [message.data, ...prev.slice(0, 9)]);
              setNotifications(prev => [{
                id: Date.now().toString(),
                type: message.data.severity || 'info',
                title: 'Security Alert',
                message: message.data.message,
                timestamp: new Date().toISOString()
              }, ...prev.slice(0, 4)]);
              break;
            case 'system_alert':
              setNotifications(prev => [{
                id: Date.now().toString(),
                type: message.data.severity || 'info',
                title: 'System Alert',
                message: message.data.message,
                timestamp: new Date().toISOString()
              }, ...prev.slice(0, 4)]);
              break;
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          console.error('Raw message data:', event.data);
        }
      });

      ws.addEventListener('error', (error) => {
        console.error('❌ WebSocket error:', error);
        toast({
          title: "Connection Error",
          description: "Failed to establish real-time connection",
          variant: "destructive",
        });
      });

      ws.addEventListener('close', () => {
        console.log('🔌 WebSocket disconnected');
        if (liveUpdates && wsReconnectAttempts.current < maxReconnectAttempts) {
          wsReconnectAttempts.current++;
          setTimeout(connectWebSocket, 2000 * wsReconnectAttempts.current);
        }
      });

      setWsConnection(ws);
    } catch (error) {
      console.error('❌ Failed to connect WebSocket:', error);
    }
  }, [liveUpdates, toast]);

  // Initialize WebSocket
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (liveUpdates) {
        connectWebSocket();
      }
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      if (wsConnection) {
        try {
          wsConnection.close();
        } catch (error) {
          console.error('Error closing WebSocket:', error);
        }
      }
    };
  }, [connectWebSocket, liveUpdates]);

  // Load real data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handle URL parameters for tab navigation
  useEffect(() => {
    const tab = searchParams.get('tab');
    const userId = searchParams.get('userId');
    const tradeId = searchParams.get('tradeId');

    if (tab && adminSections.find(section => section.key === tab)) {
      setActiveTab(tab);
      
      if (tab === 'users' && userId) {
        console.log('Viewing user:', userId);
      }
      if (tab === 'trading' && tradeId) {
        console.log('Viewing trade:', tradeId);
      }
    }
  }, [searchParams]);

  const updateChartData = (statsData: any) => {
    if (!statsData) {
      // Clear chart data if no stats available
      setUserGrowthData([]);
      setRevenueData([]);
      setTransactionData([]);
      setUserDistribution([]);
      return;
    }

    // Only set chart data if real data is available
    // TODO: Replace with actual chart data from API
    setUserGrowthData([]);
    setRevenueData([]);
    setTransactionData([]);
    setUserDistribution([]);
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      console.log('🔄 [Dashboard] Loading dashboard data...');
      console.log('🔍 [Dashboard] User permissions:', {
        isAdmin,
        isSuperAdmin,
        userRole: user?.admin_role || (user?.is_admin ? 'admin' : null),
        userId: user?.id
      });
      
      const [statsData, usersData, transactionsData, settingsData, auditData, securityData] = await Promise.all([
        apiService.getDashboardStats().catch(error => {
          console.error('❌ [Dashboard] Failed to load stats:', error);
          return null;
        }),
        apiService.getUsers().catch(error => {
          console.error('❌ [Dashboard] Failed to load users:', error);
          return { data: [], total: 0, page: 1, limit: 10 };
        }),
        apiService.getTransactions().catch(error => {
          console.error('❌ [Dashboard] Failed to load transactions:', error);
          return { data: [], total: 0, page: 1, limit: 10 };
        }),
        apiService.getSystemSettings().catch(error => {
          console.error('❌ [Dashboard] Failed to load settings:', error);
          return null;
        }),
        apiService.getAuditLogs().catch(error => {
          console.error('❌ [Dashboard] Failed to load audit logs:', error);
          return [];
        }),
        apiService.getSecurityEvents().catch(error => {
          console.error('❌ [Dashboard] Failed to load security events:', error);
          return [];
        })
      ]);

      console.log('📊 [Dashboard] Data loaded successfully:');
      console.log('  - Stats:', statsData ? '✅' : '❌');
      console.log('  - Users:', usersData ? `${usersData.data?.length || 0} users` : '❌');
      console.log('  - Transactions:', transactionsData ? `${transactionsData.data?.length || 0} transactions` : '❌');
      console.log('  - Settings:', settingsData ? '✅' : '❌');
      console.log('  - Audit Logs:', auditData ? '✅' : '❌');
      console.log('  - Security Events:', securityData ? '✅' : '❌');

      // Extract users and transactions arrays
      const usersArray = usersData?.data || [];
      const transactionsArray = transactionsData?.data || [];
      
      // Log user details for debugging
      if (usersArray.length > 0) {
        console.log('👥 [Dashboard] User breakdown:', {
          total: usersArray.length,
          admins: usersArray.filter(u => u.is_admin || u.admin_role).length,
          regular: usersArray.filter(u => !u.is_admin && !u.admin_role).length,
          active: usersArray.filter(u => u.status === 'Active').length,
          pending: usersArray.filter(u => u.status === 'Pending').length
        });
      }

      setStats(statsData);
      setUsers(usersArray);
      setTransactions(transactionsArray);
      setSettings(settingsData);
      setAuditLogs(auditData || []);
      setSecurityEvents(securityData || []);
      
      updateChartData(statsData);
    } catch (error) {
      console.error('💥 [Dashboard] Failed to load dashboard data:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      toast({
        title: "Error Loading Dashboard",
        description: "Failed to load some dashboard data. Please check console for details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
    toast({
      title: "Dashboard Updated",
      description: "All data has been refreshed",
    });
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 border-4 border-gray-700 border-t-[#F0B90B] rounded-full"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-10 h-10 bg-[#F0B90B]/20 rounded-full" />
          </motion.div>
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

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <LayoutDashboard className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Welcome back, {user?.first_name || 'Admin'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 ml-13">
              <motion.div
                animate={{ scale: liveUpdates ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 2, repeat: liveUpdates ? Infinity : 0 }}
                className="flex items-center gap-2"
              >
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  liveUpdates ? 'bg-emerald-500' : 'bg-gray-500'
                )}>
                  {liveUpdates && (
                    <motion.div
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-emerald-500 rounded-full opacity-50"
                    />
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {liveUpdates ? 'Live Updates Active' : 'Live Updates Disabled'}
                </span>
              </motion.div>
              
              <span className="text-xs text-gray-600">•</span>
              
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <ClockIcon className="w-3 h-3" />
                <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications dropdown */}
            <div className="relative">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="relative border-gray-700 hover:bg-gray-800"
                      onClick={() => setShowNotifications(!showNotifications)}
                    >
                      <Bell className="w-4 h-4" />
                      {notifications.length > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[10px] flex items-center justify-center text-white"
                        >
                          {notifications.length}
                        </motion.span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Notifications</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-white">Notifications</h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => setNotifications([])}
                      >
                        Clear all
                      </Button>
                    </div>
                    <div className="max-h-96 overflow-y-auto p-2 space-y-2">
                      {notifications.length > 0 ? (
                        notifications.map(notification => (
                          <NotificationCard
                            key={notification.id}
                            notification={notification}
                            onDismiss={dismissNotification}
                          />
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <BellOff className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No notifications</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Live updates toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "border-gray-700",
                      liveUpdates ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-800 text-gray-500'
                    )}
                    onClick={() => setLiveUpdates(!liveUpdates)}
                  >
                    {liveUpdates ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {liveUpdates ? 'Disable live updates' : 'Enable live updates'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Refresh button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="bg-gradient-to-r from-[#F0B90B] to-[#d4a10b] text-black hover:from-yellow-400 hover:to-yellow-500"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <motion.div
                      animate={isRefreshing ? { rotate: 360 } : {}}
                      transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                    </motion.div>
                    {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh dashboard data</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </motion.div>

        {/* Admin Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F0B90B]/5 to-transparent" />
            <TabsList className="relative flex flex-wrap bg-gray-800/50 border border-gray-700/50 p-1 rounded-2xl backdrop-blur-xl">
              {adminSections.map((section, index) => (
                <TabsTrigger
                  key={section.key}
                  value={section.key}
                  className={cn(
                    "relative flex-1 min-w-[100px] data-[state=active]:bg-gradient-to-r data-[state=active]:text-white overflow-hidden group",
                    `data-[state=active]:${section.color}`
                  )}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-1 py-2"
                  >
                    <section.icon className="w-4 h-4" />
                    <span className="text-xs font-medium">{section.label}</span>
                  </motion.div>
                  
                  {/* Active indicator */}
                  {activeTab === section.key && (
                    <motion.div
                      layoutId="activeTab"
                      className={cn(
                        "absolute inset-0 -z-10 bg-gradient-to-r opacity-20",
                        section.color
                      )}
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Contents Container */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                  {/* Stats Grid */}
                  <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats ? (
                      <>
                        <StatsCard
                          title="Total Users"
                          value={stats.totalUsers?.toLocaleString()}
                          icon={Users}
                          change={stats.userGrowth ? `+${stats.userGrowth} this week` : undefined}
                          changeType={stats.userGrowth ? "positive" : undefined}
                          trend={stats.userGrowthRate ? "up" : undefined}
                          trendValue={stats.userGrowthRate ? `${stats.userGrowthRate}%` : undefined}
                          color="primary"
                        />
                        <StatsCard
                          title="Active Users"
                          value={stats.activeUsers?.toLocaleString()}
                          icon={Activity}
                          change={stats.activeUserGrowth ? `+${stats.activeUserGrowth} this week` : undefined}
                          changeType={stats.activeUserGrowth ? "positive" : undefined}
                          trend={stats.activeUserGrowthRate ? "up" : undefined}
                          trendValue={stats.activeUserGrowthRate ? `${stats.activeUserGrowthRate}%` : undefined}
                          color="success"
                        />
                        <StatsCard
                          title="Total Volume"
                          value={stats.totalVolume ? `$${stats.totalVolume.toLocaleString()}` : undefined}
                          icon={DollarSign}
                          change={stats.volumeGrowth ? `+${stats.volumeGrowth} this week` : undefined}
                          changeType={stats.volumeGrowth ? "positive" : undefined}
                          trend={stats.volumeGrowthRate ? "up" : undefined}
                          trendValue={stats.volumeGrowthRate ? `${stats.volumeGrowthRate}%` : undefined}
                          color="info"
                        />
                        <StatsCard
                          title="Success Rate"
                          value={stats.successRate ? `${Number(stats.successRate).toFixed(1)}%` : undefined}
                          icon={Target}
                          change={stats.successRateGrowth ? `+${stats.successRateGrowth} this week` : undefined}
                          changeType={stats.successRateGrowth ? "positive" : undefined}
                          trend={stats.successRateGrowthRate ? "up" : undefined}
                          trendValue={stats.successRateGrowthRate ? `${stats.successRateGrowthRate}%` : undefined}
                          color="purple"
                        />
                      </>
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <div className="text-gray-500">
                          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium mb-2">No statistics available</p>
                          <p className="text-sm">Statistics data will appear here once available</p>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Charts Row 1 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard
                      title="User Growth"
                      subtitle="Monthly active user trends"
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={userGrowthData}>
                          <defs>
                            <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#F0B90B" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#F0B90B" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
                          <XAxis dataKey="month" stroke="#848E9C" />
                          <YAxis stroke="#848E9C" />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: '#1E2329',
                              border: '1px solid #2B3139',
                              borderRadius: '8px',
                              color: '#EAECEF'
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="users"
                            stroke="#F0B90B"
                            strokeWidth={2}
                            fill="url(#userGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard
                      title="Revenue vs Expenses"
                      subtitle="Financial performance"
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
                          <XAxis dataKey="month" stroke="#848E9C" />
                          <YAxis stroke="#848E9C" />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: '#1E2329',
                              border: '1px solid #2B3139',
                              borderRadius: '8px',
                              color: '#EAECEF'
                            }}
                          />
                          <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  </div>

                  {/* Charts Row 2 */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <ChartCard
                      title="Transaction Volume"
                      subtitle="24-hour activity"
                      className="h-[250px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={transactionData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
                          <XAxis dataKey="hour" stroke="#848E9C" />
                          <YAxis stroke="#848E9C" />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: '#1E2329',
                              border: '1px solid #2B3139',
                              borderRadius: '8px',
                              color: '#EAECEF'
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="transactions"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ fill: '#3b82f6', r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard
                      title="User Distribution"
                      subtitle="Account status breakdown"
                      className="h-[250px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={userDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {userDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Legend />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: '#1E2329',
                              border: '1px solid #2B3139',
                              borderRadius: '8px',
                              color: '#EAECEF'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard
                      title="System Health"
                      subtitle="Current metrics"
                      className="space-y-4"
                    >
                      <MetricProgress
                        label="CPU Usage"
                        value={45}
                        max={100}
                        color="info"
                      />
                      <MetricProgress
                        label="Memory Usage"
                        value={62}
                        max={100}
                        color="warning"
                      />
                      <MetricProgress
                        label="Disk Space"
                        value={78}
                        max={100}
                        color="success"
                      />
                      <MetricProgress
                        label="Network Load"
                        value={34}
                        max={100}
                        color="primary"
                      />
                    </ChartCard>
                  </div>

                  {/* Quick Actions */}
                  <motion.div variants={fadeInUp}>
                    <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <QuickActionCard
                        icon={Users}
                        title="Add New User"
                        description="Create a new user account"
                        onClick={() => setActiveTab('users')}
                        color="primary"
                      />
                      <QuickActionCard
                        icon={DollarSign}
                        title="Process Transaction"
                        description="Handle pending transactions"
                        onClick={() => setActiveTab('finance')}
                        color="success"
                      />
                      <QuickActionCard
                        icon={Shield}
                        title="Review Security"
                        description="Check security alerts"
                        onClick={() => setActiveTab('security')}
                        color="danger"
                      />
                      <QuickActionCard
                        icon={Settings}
                        title="System Settings"
                        description="Configure platform"
                        onClick={() => setActiveTab('platform')}
                        color="purple"
                      />
                    </div>
                  </motion.div>

                  {/* Recent Activity */}
                  <motion.div variants={fadeInUp}>
                    <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/30 backdrop-blur-xl">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                            <p className="text-sm text-gray-500 mt-1">Latest actions and events</p>
                          </div>
                          <Button variant="outline" size="sm" className="border-gray-700">
                            View All
                          </Button>
                        </div>
                        
                        <div className="space-y-4">
                          {auditLogs.slice(0, 5).map((log, index) => (
                            <motion.div
                              key={index}
                              variants={slideInRight}
                              custom={index}
                              className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg"
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                log.action === 'create' ? 'bg-emerald-500/20' :
                                log.action === 'update' ? 'bg-blue-500/20' :
                                log.action === 'delete' ? 'bg-rose-500/20' :
                                'bg-gray-500/20'
                              )}>
                                {log.action === 'create' && <Plus className="w-4 h-4 text-emerald-400" />}
                                {log.action === 'update' && <Edit className="w-4 h-4 text-blue-400" />}
                                {log.action === 'delete' && <Trash2 className="w-4 h-4 text-rose-400" />}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white">{log.description}</p>
                                <p className="text-xs text-gray-500 mt-1">{log.user}</p>
                              </div>
                              <div className="text-xs text-gray-600">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </motion.div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <UserManagement />
                </motion.div>
              )}

              {/* Wallet Management Tab */}
              {activeTab === 'wallet' && (
                <motion.div
                  key="wallet"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <WalletManagement />
                </motion.div>
              )}

              {/* Finance Management Tab */}
              {activeTab === 'finance' && (
                <motion.div
                  key="finance"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <SimpleTransactionManagement />
                </motion.div>
              )}

              {/* Trading Admin Tab */}
              {activeTab === 'trading' && (
                <motion.div
                  key="trading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <TradingAdminPanel />
                </motion.div>
              )}

              {/* Investment Admin Tab */}
              {activeTab === 'investment' && (
                <motion.div
                  key="investment"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <InvestmentAdminPanel />
                </motion.div>
              )}

              {/* Trading Control Tab */}
              {activeTab === 'trading-control' && (
                <motion.div
                  key="trading-control"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <Zap className="w-5 h-5 text-amber-400" />
                          Trading Control Panel
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Control user trading outcomes in real-time
                        </p>
                      </div>
                      <Button
                        onClick={() => window.open('/admin/trading-control', '_blank')}
                        className="bg-amber-500 hover:bg-amber-600 text-black"
                      >
                        Open Trading Control
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-gray-800/30 border-gray-700/50">
                        <div className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">Force Win</p>
                              <p className="text-xs text-gray-500">Set users to always win</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                      
                      <Card className="bg-gray-800/30 border-gray-700/50">
                        <div className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                              <Clock className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">Time Windows</p>
                              <p className="text-xs text-gray-500">Schedule outcome periods</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                      
                      <Card className="bg-gray-800/30 border-gray-700/50">
                        <div className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                              <Settings className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">System Settings</p>
                              <p className="text-xs text-gray-500">Configure defaults</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                    
                    <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-amber-400 font-medium mb-1">Access Trading Control</p>
                          <p className="text-xs text-gray-400">
                            Click the button above to open the comprehensive Trading Control Panel in a new tab. 
                            This allows you to manage user trading outcomes, create time windows, and configure system defaults.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Platform Settings Tab */}
              {activeTab === 'platform' && (
                <motion.div
                  key="platform"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <SystemSettings />
                </motion.div>
              )}

              {/* Security & Audit Tab */}
              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <RolePermissions />
                </motion.div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <motion.div
                  key="analytics"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                      title="User Growth Rate"
                      value={`+${(Number(stats?.userGrowthRate || 0) * 100).toFixed(1)}%`}
                      icon={TrendingUp}
                      change="+2.3% vs last month"
                      changeType="positive"
                      color="success"
                    />
                    <StatsCard
                      title="Avg. Transaction"
                      value={`$${(Number(stats?.totalVolume || 0) / Number(stats?.totalUsers || 1)).toFixed(2)}`}
                      icon={CreditCard}
                      change="+5.7% vs last month"
                      changeType="positive"
                      color="info"
                    />
                    <StatsCard
                      title="KYC Completion"
                      value="72.5%"
                      icon={Shield}
                      change="+8.2% vs last month"
                      changeType="positive"
                      color="primary"
                    />
                    <StatsCard
                      title="Retention Rate"
                      value="84.3%"
                      icon={Users}
                      change="-1.2% vs last month"
                      changeType="negative"
                      color="warning"
                    />
                  </div>

                  <ChartCard
                    title="Advanced Analytics"
                    subtitle="Custom report builder"
                    className="min-h-[400px] flex items-center justify-center"
                  >
                    <div className="text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="w-24 h-24 mx-auto mb-4"
                      >
                        <BarChart3 className="w-24 h-24 text-[#F0B90B]/20" />
                      </motion.div>
                      <h3 className="text-xl font-semibold text-white mb-2">Analytics Dashboard</h3>
                      <p className="text-gray-500 mb-6 max-w-md">
                        Advanced analytics with custom reports, predictive modeling, and real-time insights coming soon
                      </p>
                      <Button className="bg-gradient-to-r from-[#F0B90B] to-[#d4a10b] text-black">
                        <Rocket className="w-4 h-4 mr-2" />
                        Launch Analytics Hub
                      </Button>
                    </div>
                  </ChartCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Tabs>
      </div>
    </div>
  );
}