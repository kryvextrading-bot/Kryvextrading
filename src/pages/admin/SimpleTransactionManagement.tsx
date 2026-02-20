import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { createMockWebSocket } from '@/services/websocket';
import { apiService } from '@/services/api';
import { cn } from '@/lib/utils';
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Bell,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Wallet,
  Users,
  Activity,
  PieChart,
  BarChart3,
  LineChart,
  Calendar,
  MoreHorizontal,
  Copy,
  Check,
  ExternalLink,
  Zap,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
  FileText,
  Download as DownloadIcon,
  Upload,
  Printer,
  Share2,
  Star,
  Award,
  Medal,
  Crown,
  Gem,
  Diamond,
  Sparkles,
  Rocket,
  Target,
  Flame,
  Droplet,
  Wind,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Snowflake,
  Umbrella,
  Tornado,
  Hurricane,
  Earthquake,
  Volcano,
  Mountain,
  Tree,
  Flower,
  Leaf,
  Seedling,
  Sprout,
  Wheat,
  Grain,
  Apple,
  Carrot,
  Fish,
  Bird,
  Cat,
  Dog,
  Rabbit,
  Turtle,
  Elephant,
  Lion,
  Tiger,
  Bear,
  Wolf,
  Fox,
  Deer,
  Horse,
  Cow,
  Pig,
  Sheep,
  Goat,
  Chicken,
  Duck,
  Goose,
  Turkey,
  Peacock,
  Eagle,
  Hawk,
  Owl,
  Raven,
  Crow,
  Parrot,
  Penguin,
  Flamingo,
  Swan,
  Dolphin,
  Whale,
  Shark,
  Octopus,
  Crab,
  Lobster,
  Shrimp,
  Squid,
  Jellyfish,
  Starfish,
  Coral,
  Shell,
} from 'lucide-react';

// ==================== TYPES ====================
interface SimpleTransaction {
  id: string;
  user_id: string;
  user_email: string;
  user_name?: string;
  type: 'Buy' | 'Sell' | 'Deposit' | 'Withdrawal';
  asset: string;
  amount: number;
  value: number;
  status: 'Completed' | 'Pending' | 'Failed' | 'Processing' | 'Cancelled';
  date: string;
  fee: number;
  metadata?: Record<string, any>;
}

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  transactionId?: string;
  userId?: string;
}

interface TransactionStats {
  totalTransactions: number;
  totalVolume: number;
  totalFees: number;
  successRate: number;
  averageValue: number;
  pendingCount: number;
  completedCount: number;
  failedCount: number;
  buyVolume: number;
  sellVolume: number;
  depositVolume: number;
  withdrawalVolume: number;
}

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
      staggerChildren: 0.05
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

// ==================== HELPER FUNCTIONS ====================
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatCompactCurrency = (value: number): string => {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const formatShortDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getTransactionTypeIcon = (type: string) => {
  switch (type) {
    case 'Buy':
      return ArrowDownLeft;
    case 'Sell':
      return ArrowUpRight;
    case 'Deposit':
      return ArrowDownLeft;
    case 'Withdrawal':
      return ArrowUpRight;
    default:
      return Activity;
  }
};

const getTransactionTypeColor = (type: string): string => {
  switch (type) {
    case 'Buy':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'Sell':
      return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    case 'Deposit':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'Withdrawal':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Completed':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'Pending':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'Processing':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'Failed':
      return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    case 'Cancelled':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Completed':
      return CheckCircle;
    case 'Pending':
      return Clock;
    case 'Processing':
      return RefreshCw;
    case 'Failed':
      return XCircle;
    case 'Cancelled':
      return XCircle;
    default:
      return AlertCircle;
  }
};

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'critical':
      return AlertTriangle;
    case 'warning':
      return AlertCircle;
    case 'success':
      return CheckCircle;
    default:
      return Info;
  }
};

const getAlertColor = (type: string): string => {
  switch (type) {
    case 'critical':
      return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
    case 'warning':
      return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    case 'success':
      return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    default:
      return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
  }
};

const truncateId = (id: string, chars = 8): string => {
  return `${id.slice(0, chars)}...`;
};

// ==================== STATS CARD COMPONENT ====================
const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  subtitle, 
  color = 'primary',
  loading = false 
}: any) => {
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

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-4 w-20 bg-gray-700 rounded" />
                <div className="h-6 w-24 bg-gray-700 rounded" />
              </div>
              <div className="h-12 w-12 bg-gray-700 rounded-xl" />
            </div>
            <div className="h-4 w-32 bg-gray-700 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      variants={fadeInScale}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative group"
    >
      <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="relative p-6">
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
          
          {trend && (
            <div className="flex items-center gap-1 mt-2 text-xs">
              {trend === 'up' && <ArrowUp className="w-3 h-3 text-emerald-400" />}
              {trend === 'down' && <ArrowDown className="w-3 h-3 text-rose-400" />}
              <span className={trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}>
                {trendValue}
              </span>
            </div>
          )}
        </CardContent>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/5 to-transparent rounded-full blur-2xl" />
      </Card>
    </motion.div>
  );
};

// ==================== ALERT COMPONENT ====================
const AlertBanner = ({ alert, onDismiss }: { alert: Alert; onDismiss: () => void }) => {
  const Icon = getAlertIcon(alert.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className={cn(
        "p-4 rounded-lg border mb-4",
        getAlertColor(alert.type)
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className={cn(
            "p-1.5 rounded-lg",
            alert.type === 'critical' ? 'bg-rose-500/20' :
            alert.type === 'warning' ? 'bg-amber-500/20' :
            alert.type === 'success' ? 'bg-emerald-500/20' :
            'bg-blue-500/20'
          )}>
            <Icon className={cn(
              "w-4 h-4",
              alert.type === 'critical' ? 'text-rose-400' :
              alert.type === 'warning' ? 'text-amber-400' :
              alert.type === 'success' ? 'text-emerald-400' :
              'text-blue-400'
            )} />
          </div>
          <div className="flex-1">
            <p className={cn(
              "text-sm font-medium mb-1",
              alert.type === 'critical' ? 'text-rose-400' :
              alert.type === 'warning' ? 'text-amber-400' :
              alert.type === 'success' ? 'text-emerald-400' :
              'text-blue-400'
            )}>
              {alert.title}
            </p>
            <p className="text-sm text-gray-300 mb-2">{alert.message}</p>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatDate(alert.timestamp)}</span>
              </div>
              {alert.transactionId && (
                <Badge variant="outline" className="border-gray-700">
                  TX: {truncateId(alert.transactionId)}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-gray-800"
          onClick={onDismiss}
        >
          <XCircle className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

// ==================== TRANSACTION DETAILS MODAL ====================
const TransactionDetailsModal = ({ transaction, open, onClose }: { transaction: SimpleTransaction | null; open: boolean; onClose: () => void }) => {
  if (!transaction) return null;

  const TypeIcon = getTransactionTypeIcon(transaction.type);
  const StatusIcon = getStatusIcon(transaction.status);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F0B90B] to-[#d4a10b] flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-black" />
            </div>
            Transaction Details
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Complete information for transaction {transaction.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                transaction.type === 'Buy' ? 'bg-emerald-500/20' :
                transaction.type === 'Sell' ? 'bg-rose-500/20' :
                transaction.type === 'Deposit' ? 'bg-blue-500/20' :
                'bg-orange-500/20'
              )}>
                <TypeIcon className={cn(
                  "w-6 h-6",
                  transaction.type === 'Buy' ? 'text-emerald-400' :
                  transaction.type === 'Sell' ? 'text-rose-400' :
                  transaction.type === 'Deposit' ? 'text-blue-400' :
                  'text-orange-400'
                )} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Transaction ID</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-mono text-white">{truncateId(transaction.id, 16)}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => handleCopy(transaction.id)}
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            </div>
            <Badge className={getStatusColor(transaction.status)}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {transaction.status}
            </Badge>
          </div>

          <Separator className="bg-gray-700" />

          {/* User Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">User Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="text-sm font-medium text-white">{transaction.user_email}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">User ID</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono text-white">{truncateId(transaction.user_id)}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => handleCopy(transaction.user_id)}
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Transaction Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Type</p>
                <Badge className={getTransactionTypeColor(transaction.type)}>
                  <TypeIcon className="w-3 h-3 mr-1" />
                  {transaction.type}
                </Badge>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Asset</p>
                <p className="text-lg font-bold text-white">{transaction.asset}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Amount</p>
                <p className="text-lg font-bold text-white">{formatNumber(transaction.amount)}</p>
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Financial Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Total Value</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(transaction.value)}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Fee</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(transaction.fee)}</p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Timeline</h3>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Created</p>
                  <p className="text-sm text-white">{formatDate(transaction.date)}</p>
                </div>
                {transaction.metadata?.processedAt && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Processed</p>
                    <p className="text-sm text-white">{formatDate(transaction.metadata.processedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Metadata */}
          {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Additional Data</h3>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <pre className="text-xs text-gray-400 overflow-auto max-h-40">
                  {JSON.stringify(transaction.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ==================== MAIN COMPONENT ====================
export default function SimpleTransactionManagement() {
  const { toast } = useToast();
  
  // State
  const [transactions, setTransactions] = useState<SimpleTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<SimpleTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // WebSocket
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [wsConnection, setWsConnection] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const wsReconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  
  // UI State
  const [selectedTransaction, setSelectedTransaction] = useState<SimpleTransaction | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7d');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');

  // Load initial transactions
  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await apiService.getTransactions();
      
      // Transform Transaction to SimpleTransaction format
      const simpleTransactions = data.map(tx => ({
        id: tx.id,
        user_id: tx.userId,
        user_email: tx.userEmail,
        user_name: tx.userName,
        type: tx.type,
        asset: tx.asset,
        amount: parseFloat(tx.amount),
        value: tx.value,
        status: tx.status,
        date: tx.date,
        fee: tx.fee,
        metadata: tx.metadata
      }));
      
      setTransactions(simpleTransactions);
      setFilteredTransactions(simpleTransactions);
      setError(null);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setError('Failed to load transactions');
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // WebSocket connection for real-time updates
  const connectWebSocket = useCallback(() => {
    if (!liveUpdates) return;

    try {
      const ws = createMockWebSocket('ws://supabase-realtime/admin/transactions');
      
      ws.addEventListener('open', () => {
        console.log('Transaction Management WebSocket connected');
        wsReconnectAttempts.current = 0;
        toast({
          title: "Live Updates Active",
          description: "Real-time transaction monitoring enabled",
        });
      });

      ws.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastUpdate(new Date());

          switch (message.type) {
            case 'new_transaction':
              const newTx = message.data as SimpleTransaction;
              setTransactions(prev => [newTx, ...prev]);
              
              // Generate alerts based on transaction characteristics
              if (newTx.value > 100000) {
                setAlerts(prev => [{
                  id: Date.now().toString(),
                  type: 'critical',
                  title: 'High-Value Transaction',
                  message: `${newTx.user_email} - ${formatCurrency(newTx.value)} ${newTx.type}`,
                  timestamp: new Date().toISOString(),
                  acknowledged: false,
                  transactionId: newTx.id,
                  userId: newTx.user_id
                }, ...prev.slice(0, 4)]);
              } else if (newTx.value > 50000) {
                setAlerts(prev => [{
                  id: Date.now().toString(),
                  type: 'warning',
                  title: 'Large Transaction',
                  message: `${newTx.user_email} - ${formatCurrency(newTx.value)} ${newTx.type}`,
                  timestamp: new Date().toISOString(),
                  acknowledged: false,
                  transactionId: newTx.id,
                  userId: newTx.user_id
                }, ...prev.slice(0, 4)]);
              }
              break;

            case 'transaction_updated':
              const updatedTx = message.data as SimpleTransaction;
              setTransactions(prev => 
                prev.map(tx => tx.id === updatedTx.id ? updatedTx : tx)
              );
              break;

            case 'status_change':
              if (message.data.status === 'Failed') {
                setAlerts(prev => [{
                  id: Date.now().toString(),
                  type: 'warning',
                  title: 'Transaction Failed',
                  message: `${message.data.user_email} - ${message.data.type} of ${formatCurrency(message.data.value)}`,
                  timestamp: new Date().toISOString(),
                  acknowledged: false,
                  transactionId: message.data.id,
                  userId: message.data.user_id
                }, ...prev.slice(0, 4)]);
              }
              break;
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      });

      ws.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Connection Error",
          description: "Failed to establish real-time connection",
          variant: "destructive",
        });
      });

      ws.addEventListener('close', () => {
        console.log('WebSocket disconnected');
        if (liveUpdates && wsReconnectAttempts.current < maxReconnectAttempts) {
          wsReconnectAttempts.current++;
          setTimeout(connectWebSocket, 2000 * wsReconnectAttempts.current);
        }
      });

      setWsConnection(ws);
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }, [liveUpdates, toast]);

  // Initialize WebSocket
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, [connectWebSocket]);

  // Initial load
  useEffect(() => {
    loadTransactions();
  }, []);

  // Calculate statistics
  const stats = useMemo((): TransactionStats => {
    const completed = transactions.filter(t => t.status === 'Completed');
    const pending = transactions.filter(t => t.status === 'Pending');
    const failed = transactions.filter(t => t.status === 'Failed');
    
    return {
      totalTransactions: transactions.length,
      totalVolume: transactions.reduce((sum, t) => sum + t.value, 0),
      totalFees: transactions.reduce((sum, t) => sum + t.fee, 0),
      successRate: transactions.length > 0 ? (completed.length / transactions.length) * 100 : 0,
      averageValue: transactions.length > 0 ? transactions.reduce((sum, t) => sum + t.value, 0) / transactions.length : 0,
      pendingCount: pending.length,
      completedCount: completed.length,
      failedCount: failed.length,
      buyVolume: transactions.filter(t => t.type === 'Buy').reduce((sum, t) => sum + t.value, 0),
      sellVolume: transactions.filter(t => t.type === 'Sell').reduce((sum, t) => sum + t.value, 0),
      depositVolume: transactions.filter(t => t.type === 'Deposit').reduce((sum, t) => sum + t.value, 0),
      withdrawalVolume: transactions.filter(t => t.type === 'Withdrawal').reduce((sum, t) => sum + t.value, 0),
    };
  }, [transactions]);

  // Filter transactions
  useEffect(() => {
    let filtered = transactions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(tx =>
        tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.asset.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(tx => tx.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    // Asset filter
    if (assetFilter !== 'all') {
      filtered = filtered.filter(tx => tx.asset === assetFilter);
    }

    // Amount range filter
    if (minAmount) {
      filtered = filtered.filter(tx => tx.value >= parseFloat(minAmount));
    }
    if (maxAmount) {
      filtered = filtered.filter(tx => tx.value <= parseFloat(maxAmount));
    }

    // Date range filter
    const now = new Date();
    const cutoff = new Date();
    switch (dateRange) {
      case '1d':
        cutoff.setDate(cutoff.getDate() - 1);
        filtered = filtered.filter(tx => new Date(tx.date) >= cutoff);
        break;
      case '7d':
        cutoff.setDate(cutoff.getDate() - 7);
        filtered = filtered.filter(tx => new Date(tx.date) >= cutoff);
        break;
      case '30d':
        cutoff.setMonth(cutoff.getMonth() - 1);
        filtered = filtered.filter(tx => new Date(tx.date) >= cutoff);
        break;
      case '90d':
        cutoff.setMonth(cutoff.getMonth() - 3);
        filtered = filtered.filter(tx => new Date(tx.date) >= cutoff);
        break;
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, typeFilter, statusFilter, assetFilter, minAmount, maxAmount, dateRange]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
    toast({
      title: "Data Refreshed",
      description: "Transaction list has been updated",
    });
  };

  // Handle export
  const handleExport = () => {
    const headers = ['ID', 'User', 'Email', 'Type', 'Asset', 'Amount', 'Value', 'Status', 'Fee', 'Date'];
    const rows = filteredTransactions.map(tx => [
      tx.id,
      tx.user_name || '',
      tx.user_email,
      tx.type,
      tx.asset,
      tx.amount,
      tx.value,
      tx.status,
      tx.fee,
      tx.date
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `${filteredTransactions.length} transactions exported`,
    });
  };

  // Dismiss alert
  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  // Get unique assets for filter
  const uniqueAssets = useMemo(() => {
    return [...new Set(transactions.map(t => t.asset))];
  }, [transactions]);

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
                <CreditCard className="w-5 h-5 text-black" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Transaction Management
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Monitor and manage all platform transactions
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
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
                <Clock className="w-3 h-3" />
                <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

            {/* Export button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleExport}
                    className="border-gray-700 hover:bg-gray-800"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export data</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Refresh button */}
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

        {/* Alerts */}
        <AnimatePresence>
          {alerts.map(alert => (
            <AlertBanner
              key={alert.id}
              alert={alert}
              onDismiss={() => dismissAlert(alert.id)}
            />
          ))}
        </AnimatePresence>

        {/* Statistics Cards */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <StatsCard
            title="Total Transactions"
            value={formatNumber(stats.totalTransactions)}
            icon={Activity}
            trend="up"
            trendValue={`+${((stats.completedCount / stats.totalTransactions) * 100).toFixed(1)}% success`}
            loading={loading}
          />
          <StatsCard
            title="Total Volume"
            value={formatCompactCurrency(stats.totalVolume)}
            icon={DollarSign}
            color="success"
            subtitle={`${formatCompactCurrency(stats.totalFees)} fees`}
            loading={loading}
          />
          <StatsCard
            title="Average Value"
            value={formatCompactCurrency(stats.averageValue)}
            icon={TrendingUp}
            color="info"
            loading={loading}
          />
          <StatsCard
            title="Pending"
            value={stats.pendingCount}
            icon={Clock}
            color="warning"
            subtitle={`${stats.completedCount} completed, ${stats.failedCount} failed`}
            loading={loading}
          />
        </motion.div>

        {/* Volume Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Buy Volume</p>
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-lg font-bold text-white">{formatCompactCurrency(stats.buyVolume)}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Sell Volume</p>
                <ArrowUpRight className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-lg font-bold text-white">{formatCompactCurrency(stats.sellVolume)}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Deposit Volume</p>
                <ArrowDownLeft className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-lg font-bold text-white">{formatCompactCurrency(stats.depositVolume)}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Withdrawal Volume</p>
                <ArrowUpRight className="w-4 h-4 text-orange-400" />
              </div>
              <p className="text-lg font-bold text-white">{formatCompactCurrency(stats.withdrawalVolume)}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-xl">
            <CardHeader className="cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-[#F0B90B]" />
                  <CardTitle className="text-white">Filters</CardTitle>
                  <CardDescription className="text-gray-500">
                    ({filteredTransactions.length} of {transactions.length} transactions)
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-gray-500">
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
            </CardHeader>
            {showFilters && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Search */}
                  <div>
                    <Label className="text-xs text-gray-500">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="ID, email, asset..."
                        className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-600"
                      />
                    </div>
                  </div>

                  {/* Type Filter */}
                  <div>
                    <Label className="text-xs text-gray-500">Type</Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="Buy">Buy</SelectItem>
                        <SelectItem value="Sell">Sell</SelectItem>
                        <SelectItem value="Deposit">Deposit</SelectItem>
                        <SelectItem value="Withdrawal">Withdrawal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <Label className="text-xs text-gray-500">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Processing">Processing</SelectItem>
                        <SelectItem value="Failed">Failed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Asset Filter */}
                  <div>
                    <Label className="text-xs text-gray-500">Asset</Label>
                    <Select value={assetFilter} onValueChange={setAssetFilter}>
                      <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="all">All Assets</SelectItem>
                        {uniqueAssets.map(asset => (
                          <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range */}
                  <div>
                    <Label className="text-xs text-gray-500">Date Range</Label>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="1d">Last 24 Hours</SelectItem>
                        <SelectItem value="7d">Last 7 Days</SelectItem>
                        <SelectItem value="30d">Last 30 Days</SelectItem>
                        <SelectItem value="90d">Last 90 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Min Amount */}
                  <div>
                    <Label className="text-xs text-gray-500">Min Amount</Label>
                    <Input
                      type="number"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      placeholder="0.00"
                      className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-600"
                    />
                  </div>

                  {/* Max Amount */}
                  <div>
                    <Label className="text-xs text-gray-500">Max Amount</Label>
                    <Input
                      type="number"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      placeholder="1000000"
                      className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-600"
                    />
                  </div>

                  {/* Clear Filters */}
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('');
                        setTypeFilter('all');
                        setStatusFilter('all');
                        setAssetFilter('all');
                        setDateRange('7d');
                        setMinAmount('');
                        setMaxAmount('');
                      }}
                      className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </motion.div>

        {/* Transactions Table */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="animate-pulse flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-700 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-1/4" />
                      <div className="h-3 bg-gray-700 rounded w-1/3" />
                    </div>
                    <div className="w-20 h-8 bg-gray-700 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Recent Transactions</CardTitle>
                  <CardDescription className="text-gray-500">
                    Real-time transaction monitoring with automatic updates
                  </CardDescription>
                </div>
                <Badge className="bg-[#F0B90B]/20 text-[#F0B90B]">
                  {filteredTransactions.length} transactions
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-transparent">
                      <TableHead className="text-gray-500">ID</TableHead>
                      <TableHead className="text-gray-500">User</TableHead>
                      <TableHead className="text-gray-500">Type</TableHead>
                      <TableHead className="text-gray-500">Asset</TableHead>
                      <TableHead className="text-gray-500">Amount</TableHead>
                      <TableHead className="text-gray-500">Value</TableHead>
                      <TableHead className="text-gray-500">Status</TableHead>
                      <TableHead className="text-gray-500">Fee</TableHead>
                      <TableHead className="text-gray-500">Date</TableHead>
                      <TableHead className="text-gray-500">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredTransactions.slice(0, 50).map((transaction) => {
                        const TypeIcon = getTransactionTypeIcon(transaction.type);
                        const StatusIcon = getStatusIcon(transaction.status);
                        
                        return (
                          <motion.tr
                            key={transaction.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="border-gray-700 hover:bg-gray-800/50 group"
                          >
                            <TableCell className="text-gray-400 font-mono text-xs">
                              {truncateId(transaction.id)}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {transaction.user_name || transaction.user_email.split('@')[0]}
                                </p>
                                <p className="text-xs text-gray-500">{transaction.user_email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getTransactionTypeColor(transaction.type)}>
                                <TypeIcon className="w-3 h-3 mr-1" />
                                {transaction.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-white font-medium">
                              {transaction.asset}
                            </TableCell>
                            <TableCell className="text-white">
                              {formatNumber(transaction.amount)}
                            </TableCell>
                            <TableCell className="text-white">
                              {formatCompactCurrency(transaction.value)}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(transaction.status)}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {transaction.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-400">
                              {formatCompactCurrency(transaction.fee)}
                            </TableCell>
                            <TableCell className="text-gray-500 text-sm">
                              {formatShortDate(transaction.date)}
                            </TableCell>
                            <TableCell>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => {
                                        setSelectedTransaction(transaction);
                                        setShowDetails(true);
                                      }}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View details</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>

              {filteredTransactions.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
                    <CreditCard className="w-10 h-10 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No transactions found</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' || assetFilter !== 'all' || minAmount || maxAmount
                      ? "Try adjusting your filters"
                      : "No transactions have been recorded yet"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Transaction Details Modal */}
        <TransactionDetailsModal
          transaction={selectedTransaction}
          open={showDetails}
          onClose={() => {
            setShowDetails(false);
            setSelectedTransaction(null);
          }}
        />
      </div>
    </div>
  );
}

// Need to import Dialog components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';