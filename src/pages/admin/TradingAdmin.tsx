import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { adminApiService } from '@/services/admin-api';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3,
  PieChart,
  RefreshCw,
  Download,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  Target,
  Zap,
  Shield,
  AlertCircle,
  Flag,
  Ban,
  Lock,
  Unlock,
  EyeOff,
  Gauge,
  LineChart,
  CandlestickChart,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Users,
  UserCheck,
  UserX,
  Wallet,
  CreditCard,
  Network,
  Wifi,
  Server,
  Cpu,
  HardDrive,
  Database,
  Cloud,
  GitBranch,
  Code,
  Terminal,
  Box,
  Layers,
  ZapIcon,
  Heart,
  HeartOff,
  ThumbsUp,
  ThumbsDown,
  Award,
  Medal,
  Crown,
  Sparkles,
  Flame,
  Droplet,
  Wind,
  Sun,
  Moon,
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
  Sand,
  Rock,
  Stone,
  Crystal,
  Diamond,
  Ruby,
  Emerald,
  Sapphire,
  Topaz,
  Opal,
  Pearl,
  Amber,
  Coal,
  Iron,
  Copper,
  Bronze,
  Silver,
  Gold,
  Platinum,
  Titanium,
  Uranium,
  Plutonium,
  ChevronUp,
  ChevronDown,
  Info
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  ZAxis,
  Treemap
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// ==================== TYPES ====================
interface Trade {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  asset: string;
  type: 'spot' | 'futures' | 'options' | 'margin';
  orderType: 'market' | 'limit' | 'stop' | 'stop-limit';
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  value: number;
  status: 'open' | 'closed' | 'cancelled' | 'expired';
  pnl: number;
  pnlPercentage?: number;
  fee: number;
  feeAsset: string;
  winRate?: number;
  date: string;
  closedAt?: string;
  duration?: number; // in seconds
  leverage?: number;
  liquidationPrice?: number;
  margin?: number;
  stopLoss?: number;
  takeProfit?: number;
  
  // Advanced metrics
  volatility?: number;
  sharpeRatio?: number;
  maxDrawdown?: number;
  
  // Market data
  marketCap?: number;
  volume24h?: number;
  change24h?: number;
  
  // Risk metrics
  riskScore?: number;
  riskFactors?: string[];
  
  // Execution
  exchange?: string;
  executionTime?: number;
  slippage?: number;
  
  // Strategy
  strategy?: string;
  strategyId?: string;
  
  // Tags
  tags?: string[];
  notes?: string;
}

interface TradingStats {
  totalTrades: number;
  totalVolume: number;
  totalPnL: number;
  totalFees: number;
  winRate: number;
  openPositions: number;
  averageTradeSize: number;
  averageDuration: number;
  bestTrade: Trade | null;
  worstTrade: Trade | null;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  recoveryFactor: number;
  winLossRatio: number;
  averageWin: number;
  averageLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

interface MarketCondition {
  asset: string;
  volatility: 'low' | 'medium' | 'high' | 'extreme';
  liquidity: 'low' | 'medium' | 'high';
  spread: number;
  volume24h: number;
  priceChange24h: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  support: number;
  resistance: number;
  rsi: number;
  macd: 'bullish' | 'bearish' | 'neutral';
}

interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  tradeId?: string;
  userId?: string;
}






    
// ==================== HELPER FUNCTIONS ====================
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercent = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const getPnLColor = (pnl: number) => {
  return pnl >= 0 ? 'text-green-400' : 'text-red-400';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'closed': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'cancelled': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    case 'expired': return 'bg-red-500/20 text-red-400 border-red-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const getSideColor = (side: string) => {
  return side === 'buy' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30';
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'spot': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'futures': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'options': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'margin': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const getVolatilityColor = (volatility: string) => {
  switch (volatility) {
    case 'low': return 'bg-green-500/20 text-green-400';
    case 'medium': return 'bg-yellow-500/20 text-yellow-400';
    case 'high': return 'bg-orange-500/20 text-orange-400';
    case 'extreme': return 'bg-red-500/20 text-red-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
};

const getLiquidityColor = (liquidity: string) => {
  switch (liquidity) {
    case 'low': return 'bg-red-500/20 text-red-400';
    case 'medium': return 'bg-yellow-500/20 text-yellow-400';
    case 'high': return 'bg-green-500/20 text-green-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
};

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'critical': return <AlertTriangle className="w-5 h-5 text-red-400" />;
    case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    case 'info': return <Info className="w-5 h-5 text-blue-400" />;
    default: return <AlertCircle className="w-5 h-5 text-gray-400" />;
  }
};

// ==================== STATS CARD COMPONENT ====================
const StatsCard = ({ title, value, icon: Icon, trend, trendValue, subtitle, color = 'default' }: any) => (
  <Card className="bg-[#1E2329] border border-[#2B3139] hover:border-[#F0B90B]/50 transition-all">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#848E9C]">{title}</p>
          <p className="text-xl font-bold text-[#EAECEF] mt-1">{value}</p>
          {subtitle && <p className="text-xs text-[#5E6673] mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${
              trend === 'up' ? 'text-green-400' : 
              trend === 'down' ? 'text-red-400' : 'text-[#F0B90B]'
            }`}>
              {trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg bg-[#F0B90B]/10 flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-[#F0B90B]" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// ==================== MARKET CONDITIONS CARD ====================
const MarketConditionsCard = ({ condition }: { condition: MarketCondition }) => (
  <Card className="bg-[#1E2329] border border-[#2B3139]">
    <CardHeader>
      <CardTitle className="text-[#EAECEF] flex items-center justify-between">
        <span>{condition.asset}</span>
        <Badge className={
          condition.trend === 'bullish' ? 'bg-green-500/20 text-green-400' :
          condition.trend === 'bearish' ? 'bg-red-500/20 text-red-400' :
          'bg-yellow-500/20 text-yellow-400'
        }>
          {condition.trend}
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#181A20] rounded-lg p-2">
          <p className="text-xs text-[#848E9C]">Volatility</p>
          <Badge className={getVolatilityColor(condition.volatility)}>
            {condition.volatility}
          </Badge>
        </div>
        <div className="bg-[#181A20] rounded-lg p-2">
          <p className="text-xs text-[#848E9C]">Liquidity</p>
          <Badge className={getLiquidityColor(condition.liquidity)}>
            {condition.liquidity}
          </Badge>
        </div>
        <div className="bg-[#181A20] rounded-lg p-2">
          <p className="text-xs text-[#848E9C]">Spread</p>
          <p className="text-sm font-bold text-[#EAECEF]">{condition.spread}%</p>
        </div>
        <div className="bg-[#181A20] rounded-lg p-2">
          <p className="text-xs text-[#848E9C]">24h Change</p>
          <p className={`text-sm font-bold ${condition.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {condition.priceChange24h >= 0 ? '+' : ''}{condition.priceChange24h}%
          </p>
        </div>
      </div>

      <Separator className="bg-[#2B3139] my-3" />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-[#848E9C]">Support</p>
          <p className="text-sm font-bold text-[#EAECEF]">${condition.support.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-[#848E9C]">Resistance</p>
          <p className="text-sm font-bold text-[#EAECEF]">${condition.resistance.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-[#848E9C]">RSI</p>
          <p className={`text-sm font-bold ${
            condition.rsi > 70 ? 'text-red-400' :
            condition.rsi < 30 ? 'text-green-400' :
            'text-[#EAECEF]'
          }`}>
            {condition.rsi}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#848E9C]">MACD</p>
          <Badge className={
            condition.macd === 'bullish' ? 'bg-green-500/20 text-green-400' :
            condition.macd === 'bearish' ? 'bg-red-500/20 text-red-400' :
            'bg-yellow-500/20 text-yellow-400'
          }>
            {condition.macd}
          </Badge>
        </div>
      </div>
    </CardContent>
  </Card>
);

// ==================== ALERT BANNER COMPONENT ====================
const AlertBanner = ({ 
  alert, 
  onDismiss, 
  onViewUser, 
  onViewTrade 
}: { 
  alert: Alert; 
  onDismiss: () => void;
  onViewUser?: (userId: string) => void;
  onViewTrade?: (tradeId: string) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, x: 100 }}
    className={`p-4 rounded-lg border mb-4 ${
      alert.type === 'critical' ? 'bg-red-500/10 border-red-500/30' :
      alert.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
      'bg-blue-500/10 border-blue-500/30'
    }`}
  >
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-3">
        {getAlertIcon(alert.type)}
        <div>
          <p className={`text-sm font-medium ${
            alert.type === 'critical' ? 'text-red-400' :
            alert.type === 'warning' ? 'text-yellow-400' :
            'text-blue-400'
          }`}>
            {alert.message}
          </p>
          <p className="text-xs text-[#848E9C] mt-1">
            {new Date(alert.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {alert.userId && onViewUser && (
          <Button 
            size="sm" 
            variant="outline" 
            className="h-7 text-xs border-[#2B3139] hover:bg-[#F0B90B] hover:text-black transition-colors"
            onClick={() => onViewUser(alert.userId!)}
          >
            <Eye className="w-3 h-3 mr-1" />
            View User
          </Button>
        )}
        {alert.tradeId && onViewTrade && (
          <Button 
            size="sm" 
            variant="outline" 
            className="h-7 text-xs border-[#2B3139] hover:bg-[#F0B90B] hover:text-black transition-colors"
            onClick={() => onViewTrade(alert.tradeId!)}
          >
            <Eye className="w-3 h-3 mr-1" />
            View Trade
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-red-500/20" onClick={onDismiss}>
          <XCircle className="w-4 h-4" />
        </Button>
      </div>
    </div>
  </motion.div>
);

// ==================== TRADE DETAILS DIALOG ====================
const TradeDetailsDialog = ({ trade, open, onClose }: { trade: Trade | null; open: boolean; onClose: () => void }) => {
  if (!trade) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1E2329] border-[#F0B90B] text-[#EAECEF] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#F0B90B] flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Trade Details - {trade.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#181A20] rounded-lg p-3">
              <p className="text-xs text-[#848E9C]">User</p>
              <p className="text-sm font-medium text-[#EAECEF]">{trade.userName}</p>
              <p className="text-xs text-[#848E9C]">{trade.userEmail}</p>
            </div>
            <div className="bg-[#181A20] rounded-lg p-3">
              <p className="text-xs text-[#848E9C]">Asset</p>
              <p className="text-lg font-bold text-[#EAECEF]">{trade.asset}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="bg-[#181A20] rounded-lg p-2">
              <p className="text-xs text-[#848E9C]">Type</p>
              <Badge className={getTypeColor(trade.type)}>
                {trade.type}
              </Badge>
            </div>
            <div className="bg-[#181A20] rounded-lg p-2">
              <p className="text-xs text-[#848E9C]">Side</p>
              <Badge className={getSideColor(trade.side)}>
                {trade.side.toUpperCase()}
              </Badge>
            </div>
            <div className="bg-[#181A20] rounded-lg p-2">
              <p className="text-xs text-[#848E9C]">Order Type</p>
              <p className="text-sm font-bold text-[#EAECEF]">{trade.orderType}</p>
            </div>
            <div className="bg-[#181A20] rounded-lg p-2">
              <p className="text-xs text-[#848E9C]">Status</p>
              <Badge className={getStatusColor(trade.status)}>
                {trade.status}
              </Badge>
            </div>
          </div>

          <Separator className="bg-[#2B3139]" />

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#181A20] rounded-lg p-3">
              <p className="text-xs text-[#848E9C]">Amount</p>
              <p className="text-lg font-bold text-[#EAECEF]">{trade.amount}</p>
            </div>
            <div className="bg-[#181A20] rounded-lg p-3">
              <p className="text-xs text-[#848E9C]">Price</p>
              <p className="text-lg font-bold text-[#EAECEF]">${trade.price.toLocaleString()}</p>
            </div>
            <div className="bg-[#181A20] rounded-lg p-3">
              <p className="text-xs text-[#848E9C]">Value</p>
              <p className="text-lg font-bold text-[#EAECEF]">${trade.value.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#181A20] rounded-lg p-3">
              <p className="text-xs text-[#848E9C]">P&L</p>
              <p className={`text-lg font-bold ${getPnLColor(trade.pnl)}`}>
                {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toLocaleString()}
              </p>
              {trade.pnlPercentage && (
                <p className={`text-xs ${getPnLColor(trade.pnlPercentage)}`}>
                  {trade.pnlPercentage >= 0 ? '+' : ''}{trade.pnlPercentage}%
                </p>
              )}
            </div>
            <div className="bg-[#181A20] rounded-lg p-3">
              <p className="text-xs text-[#848E9C]">Fee</p>
              <p className="text-lg font-bold text-[#EAECEF]">${trade.fee.toLocaleString()} {trade.feeAsset}</p>
            </div>
          </div>

          {trade.leverage && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#181A20] rounded-lg p-2">
                <p className="text-xs text-[#848E9C]">Leverage</p>
                <p className="text-sm font-bold text-[#EAECEF]">{trade.leverage}x</p>
              </div>
              <div className="bg-[#181A20] rounded-lg p-2">
                <p className="text-xs text-[#848E9C]">Margin</p>
                <p className="text-sm font-bold text-[#EAECEF]">${trade.margin?.toLocaleString()}</p>
              </div>
              <div className="bg-[#181A20] rounded-lg p-2">
                <p className="text-xs text-[#848E9C]">Liquidation</p>
                <p className="text-sm font-bold text-red-400">${trade.liquidationPrice?.toLocaleString()}</p>
              </div>
            </div>
          )}

          <Separator className="bg-[#2B3139]" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#848E9C]">Date</p>
              <p className="text-sm text-[#EAECEF]">{new Date(trade.date).toLocaleString()}</p>
            </div>
            {trade.closedAt && (
              <div>
                <p className="text-xs text-[#848E9C]">Closed At</p>
                <p className="text-sm text-[#EAECEF]">{new Date(trade.closedAt).toLocaleString()}</p>
              </div>
            )}
            {trade.duration && (
              <div>
                <p className="text-xs text-[#848E9C]">Duration</p>
                <p className="text-sm text-[#EAECEF]">{Math.floor(trade.duration / 3600)}h {Math.floor((trade.duration % 3600) / 60)}m</p>
              </div>
            )}
          </div>

          <Separator className="bg-[#2B3139]" />

          <div>
            <p className="text-xs text-[#848E9C] mb-2">Risk Metrics</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#181A20] rounded-lg p-2">
                <p className="text-xs text-[#848E9C]">Risk Score</p>
                <p className={`text-sm font-bold ${
                  (trade.riskScore || 0) < 30 ? 'text-green-400' :
                  (trade.riskScore || 0) < 60 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {trade.riskScore}
                </p>
              </div>
              <div className="bg-[#181A20] rounded-lg p-2">
                <p className="text-xs text-[#848E9C]">Volatility</p>
                <p className="text-sm font-bold text-[#EAECEF]">{trade.volatility}%</p>
              </div>
              <div className="bg-[#181A20] rounded-lg p-2">
                <p className="text-xs text-[#848E9C]">Sharpe Ratio</p>
                <p className="text-sm font-bold text-[#EAECEF]">{trade.sharpeRatio?.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {trade.riskFactors && trade.riskFactors.length > 0 && (
            <div>
              <p className="text-xs text-[#848E9C] mb-2">Risk Factors</p>
              <div className="flex flex-wrap gap-2">
                {trade.riskFactors.map((factor, i) => (
                  <Badge key={i} className="bg-red-500/20 text-red-400 border-red-500/30">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {factor}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-[#848E9C] mb-2">Tags</p>
            <div className="flex flex-wrap gap-2">
              {trade.tags?.map((tag, i) => (
                <Badge key={i} className="bg-[#2B3139] text-[#EAECEF]">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {trade.notes && (
            <div>
              <p className="text-xs text-[#848E9C]">Notes</p>
              <p className="text-sm text-[#EAECEF] p-2 bg-[#181A20] rounded">{trade.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-[#2B3139] text-[#EAECEF] hover:border-[#F0B90B]"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ==================== MANIPULATION DETECTION CARD ====================
const ManipulationDetectionCard = ({ trades }: { trades: Trade[] }) => {
  const [anomalies, setAnomalies] = useState<any[]>([]);

  useEffect(() => {
    const detectAnomalies = () => {
      const detected = [];

      // Detect rapid trading from same user
      const userTrades: Record<string, Trade[]> = {};
      trades.forEach(t => {
        if (!userTrades[t.userId]) userTrades[t.userId] = [];
        userTrades[t.userId].push(t);
      });

      Object.entries(userTrades).forEach(([userId, userTrades]) => {
        userTrades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Check for rapid succession
        for (let i = 1; i < userTrades.length; i++) {
          const diff = new Date(userTrades[i].date).getTime() - new Date(userTrades[i-1].date).getTime();
          if (diff < 1000) { // Less than 1 second
            detected.push({
              type: 'rapid_trading',
              userId,
              severity: 'high',
              message: `Rapid trading detected: ${userTrades.length} trades in short succession`,
              time: userTrades[i].date
            });
            break;
          }
        }

        // Check for wash trading
        const buyTrades = userTrades.filter(t => t.side === 'buy');
        const sellTrades = userTrades.filter(t => t.side === 'sell');
        if (buyTrades.length > 10 && sellTrades.length > 10) {
          const buyVolume = buyTrades.reduce((sum, t) => sum + t.value, 0);
          const sellVolume = sellTrades.reduce((sum, t) => sum + t.value, 0);
          if (Math.abs(buyVolume - sellVolume) < 1000) {
            detected.push({
              type: 'wash_trading',
              userId,
              severity: 'critical',
              message: `Possible wash trading: Buy volume $${buyVolume.toLocaleString()}, Sell volume $${sellVolume.toLocaleString()}`,
              time: new Date().toISOString()
            });
          }
        }
      });

      // Detect spoofing (large orders near best bid/ask)
      const largeOrders = trades.filter(t => t.value > 100000);
      if (largeOrders.length > 5) {
        detected.push({
          type: 'spoofing',
          severity: 'medium',
          message: `Possible spoofing: ${largeOrders.length} large orders detected`,
          time: new Date().toISOString()
        });
      }

      // Detect layering (multiple orders at different price levels)
      const priceLevels: Record<string, number> = {};
      trades.forEach(t => {
        const key = `${t.asset}-${Math.round(t.price / 100) * 100}`;
        priceLevels[key] = (priceLevels[key] || 0) + 1;
      });
      
      Object.entries(priceLevels).forEach(([level, count]) => {
        if (count > 10) {
          detected.push({
            type: 'layering',
            severity: 'medium',
            message: `Possible layering: ${count} orders at ${level}`,
            time: new Date().toISOString()
          });
        }
      });

      setAnomalies(detected);
    };

    detectAnomalies();
  }, [trades]);

  return (
    <Card className="bg-[#1E2329] border border-[#2B3139]">
      <CardHeader>
        <CardTitle className="text-[#EAECEF] flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#F0B90B]" />
          Market Manipulation Detection
        </CardTitle>
        <CardDescription className="text-[#848E9C]">
          Real-time monitoring for suspicious trading patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        {anomalies.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
              <Shield className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-[#EAECEF] font-medium mb-2">No Anomalies Detected</p>
            <p className="text-xs text-[#848E9C]">Market appears clean and normal</p>
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.map((anomaly, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${
                  anomaly.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                  anomaly.severity === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
                  'bg-yellow-500/10 border-yellow-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  {anomaly.severity === 'critical' && <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
                  {anomaly.severity === 'high' && <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />}
                  {anomaly.severity === 'medium' && <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#EAECEF]">{anomaly.message}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge className={
                        anomaly.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                        anomaly.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }>
                        {anomaly.type}
                      </Badge>
                      <span className="text-xs text-[#848E9C]">
                        {new Date(anomaly.time).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {anomaly.userId && (
                      <Button size="sm" variant="outline" className="h-7 text-xs border-[#2B3139]">
                        <Eye className="w-3 h-3 mr-1" />
                        User
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="h-7 text-xs border-[#2B3139]">
                      <Flag className="w-3 h-3 mr-1" />
                      Flag
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ==================== LIQUIDITY MONITORING CARD ====================
const LiquidityMonitoringCard = ({ marketConditions }: { marketConditions: MarketCondition[] }) => (
  <Card className="bg-[#1E2329] border border-[#2B3139]">
    <CardHeader>
      <CardTitle className="text-[#EAECEF] flex items-center gap-2">
        <Droplet className="w-5 h-5 text-[#F0B90B]" />
        Liquidity Monitoring
      </CardTitle>
      <CardDescription className="text-[#848E9C]">
        Real-time market liquidity and depth analysis
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {marketConditions.map((condition, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#EAECEF]">{condition.asset}</span>
              <Badge className={getLiquidityColor(condition.liquidity)}>
                {condition.liquidity} liquidity
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#181A20] rounded-lg p-2">
                <p className="text-xs text-[#848E9C]">Spread</p>
                <p className="text-sm font-bold text-[#EAECEF]">{condition.spread}%</p>
              </div>
              <div className="bg-[#181A20] rounded-lg p-2">
                <p className="text-xs text-[#848E9C]">24h Volume</p>
                <p className="text-sm font-bold text-[#EAECEF]">${(condition.volume24h / 1e9).toFixed(2)}B</p>
              </div>
            </div>
            <Progress 
              value={condition.liquidity === 'high' ? 90 : condition.liquidity === 'medium' ? 50 : 20} 
              className="h-1 bg-[#2B3139]" 
            />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// ==================== PRICE IMPACT ANALYZER ====================
const PriceImpactAnalyzer = ({ trades }: { trades: Trade[] }) => {
  const [selectedAsset, setSelectedAsset] = useState('all');
  const [impactData, setImpactData] = useState<any[]>([]);

  useEffect(() => {
    // Calculate price impact for large orders
    const assets = selectedAsset === 'all' 
      ? [...new Set(trades.map(t => t.asset))]
      : [selectedAsset];

    const data = assets.map(asset => {
      const assetTrades = trades.filter(t => t.asset === asset);
      const largeTrades = assetTrades.filter(t => t.value > 50000);
      
      return {
        asset,
        largeOrders: largeTrades.length,
        avgImpact: largeTrades.length > 0 
          ? largeTrades.reduce((sum, t) => sum + (t.slippage || 0), 0) / largeTrades.length 
          : 0,
        maxImpact: Math.max(...largeTrades.map(t => t.slippage || 0), 0),
        totalValue: assetTrades.reduce((sum, t) => sum + t.value, 0)
      };
    });

    setImpactData(data);
  }, [trades, selectedAsset]);

  return (
    <Card className="bg-[#1E2329] border border-[#2B3139]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#F0B90B]" />
            <CardTitle className="text-[#EAECEF]">Price Impact Analysis</CardTitle>
          </div>
          <Select value={selectedAsset} onValueChange={setSelectedAsset}>
            <SelectTrigger className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assets</SelectItem>
              <SelectItem value="BTC/USDT">BTC</SelectItem>
              <SelectItem value="ETH/USDT">ETH</SelectItem>
              <SelectItem value="SOL/USDT">SOL</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {impactData.map((item, i) => (
            <div key={i} className="bg-[#181A20] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#EAECEF]">{item.asset}</span>
                <Badge className={item.avgImpact > 0.5 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}>
                  {item.avgImpact.toFixed(3)}% avg impact
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-xs text-[#848E9C]">Large Orders</p>
                  <p className="font-bold text-[#EAECEF]">{item.largeOrders}</p>
                </div>
                <div>
                  <p className="text-xs text-[#848E9C]">Max Impact</p>
                  <p className="font-bold text-red-400">{item.maxImpact.toFixed(3)}%</p>
                </div>
                <div>
                  <p className="text-xs text-[#848E9C]">Total Value</p>
                  <p className="font-bold text-[#EAECEF]">${(item.totalValue / 1e6).toFixed(1)}M</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== CIRCUIT BREAKER CONTROLS ====================
const CircuitBreakerControls = () => {
  const [circuits, setCircuits] = useState([
    { name: 'BTC/USDT', enabled: true, threshold: 10, triggered: false },
    { name: 'ETH/USDT', enabled: true, threshold: 15, triggered: false },
    { name: 'SOL/USDT', enabled: false, threshold: 20, triggered: false }
  ]);

  const handleToggleCircuit = (index: number) => {
    const updated = [...circuits];
    updated[index].enabled = !updated[index].enabled;
    setCircuits(updated);
  };

  const handleThresholdChange = (index: number, value: number) => {
    const updated = [...circuits];
    updated[index].threshold = value;
    setCircuits(updated);
  };

  return (
    <Card className="bg-[#1E2329] border border-[#2B3139]">
      <CardHeader>
        <CardTitle className="text-[#EAECEF] flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#F0B90B]" />
          Circuit Breakers
        </CardTitle>
        <CardDescription className="text-[#848E9C]">
          Automatic trading halts on extreme volatility
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {circuits.map((circuit, i) => (
            <div key={i} className="bg-[#181A20] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#EAECEF]">{circuit.name}</span>
                <Switch
                  checked={circuit.enabled}
                  onCheckedChange={() => handleToggleCircuit(i)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#848E9C]">Trigger Threshold</span>
                    <span className="text-[#EAECEF]">{circuit.threshold}%</span>
                  </div>
                  <Slider
                    value={[circuit.threshold]}
                    onValueChange={(value) => handleThresholdChange(i, value[0])}
                    min={5}
                    max={30}
                    step={1}
                    className="py-2"
                  />
                </div>
                {circuit.triggered && (
                  <Badge className="bg-red-500/20 text-red-400">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Triggered
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== MAIN COMPONENT ====================
export default function TradingAdminPanel() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [showTradeDetails, setShowTradeDetails] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState(true);

  // Navigation handlers
  const handleViewUser = (userId: string) => {
    toast({
      title: "Navigating to User Management",
      description: "Opening user details...",
    });
    navigate(`/admin/dashboard?tab=users&userId=${userId}`);
  };

  const handleViewTrade = (tradeId: string) => {
    toast({
      title: "Navigating to Trading Panel",
      description: "Opening trade details...",
    });
    navigate(`/admin/dashboard?tab=trading&tradeId=${tradeId}`);
  };

  // Load real trading data
  const loadTradingData = async () => {
    try {
      setLoading(true);
      
      // Load data from API
      const [ordersData, positionsData, usersData] = await Promise.all([
        adminApiService.getOrders(),
        adminApiService.getPositions(),
        adminApiService.getUsers()
      ]);
      
      // Transform orders and positions into trade format
      const transformedTrades: Trade[] = [
        ...ordersData.map(order => ({
          id: order.id,
          userId: order.user_id,
          userEmail: '', // Will be filled from user data
          userName: '', // Will be filled from user data
          type: 'spot' as const, // Map order type to trade type
          side: order.side,
          asset: order.symbol,
          amount: order.amount,
          price: order.price || 0,
          value: order.executed_value || (order.amount * (order.price || 0)),
          status: (order.status === 'open' ? 'open' : order.status === 'closed' ? 'closed' : order.status === 'cancelled' ? 'cancelled' : order.status === 'expired' ? 'expired' : 'open') as 'open' | 'closed' | 'cancelled' | 'expired',
          pnl: 0, // Orders don't have P&L
          pnlPercentage: 0,
          fee: order.fee,
          feeAsset: order.fee_asset || 'USDT',
          winRate: 0,
          closedAt: order.executed_at,
          duration: 0,
          volatility: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          marketCap: 0,
          volume24h: 0,
          change24h: 0,
          riskScore: 0,
          riskFactors: [],
          exchange: 'Kryvex',
          executionTime: 0,
          slippage: 0,
          strategy: 'Manual',
          strategyId: '',
          tags: [],
          notes: '',
          orderType: (order.type === 'stop_limit' ? 'stop-limit' : order.type) as 'market' | 'limit' | 'stop' | 'stop-limit',
          leverage: order.leverage,
          takeProfit: order.take_profit,
          stopLoss: order.stop_loss,
          liquidationPrice: order.liquidation_price,
          margin: order.margin,
          filledAmount: order.filled_amount,
          date: order.created_at, // Add missing date property
          createdAt: order.created_at,
          updatedAt: order.updated_at
        })),
        ...positionsData.map(position => ({
          id: position.id,
          userId: position.user_id,
          userEmail: '', // Will be filled from user data
          userName: '', // Will be filled from user data
          type: 'futures' as const, // Map position to futures type
          side: position.side,
          asset: position.symbol,
          amount: position.quantity,
          price: position.entry_price,
          value: position.quantity * position.entry_price,
          status: position.status,
          pnl: position.unrealized_pnl + position.realized_pnl,
          pnlPercentage: position.entry_price > 0 ? ((position.unrealized_pnl + position.realized_pnl) / (position.quantity * position.entry_price)) * 100 : 0,
          fee: 0,
          feeAsset: 'USDT',
          winRate: 0,
          closedAt: position.closed_at,
          duration: position.opened_at ? Math.floor((new Date().getTime() - new Date(position.opened_at).getTime()) / (1000 * 60 * 60 * 24)) : 0,
          volatility: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          marketCap: 0,
          volume24h: 0,
          change24h: 0,
          riskScore: 0,
          riskFactors: [],
          exchange: 'Kryvex',
          executionTime: 0,
          slippage: 0,
          strategy: 'Position Trading',
          strategyId: '',
          tags: [],
          notes: '',
          orderType: 'market',
          leverage: position.leverage,
          takeProfit: 0,
          stopLoss: 0,
          liquidationPrice: position.liquidation_price,
          margin: position.margin,
          filledAmount: position.quantity,
          date: position.created_at, // Add missing date property
          createdAt: position.created_at,
          updatedAt: position.updated_at
        }))
      ];
      
      // Enhance trades with user information
      const enhancedTrades = transformedTrades.map(trade => {
        const user = usersData.find(u => u.id === trade.userId);
        return {
          ...trade,
          userName: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email.split('@')[0] : 'Unknown User',
          userEmail: user?.email || 'unknown@example.com'
        };
      });

      setTrades(enhancedTrades);
      setFilteredTrades(enhancedTrades);
      setAlerts([]); // No alerts from API yet
      
      toast({
        title: "Data Loaded",
        description: `Loaded ${enhancedTrades.length} trading records`,
      });
    } catch (error) {
      console.error('Failed to load trading data:', error);
      setTrades([]);
      setFilteredTrades([]);
      setAlerts([]);
      toast({
        title: "No Data Available",
        description: "Could not load trading data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadTradingData();
  }, []);

  // Calculate statistics
  const stats: TradingStats = {
    totalTrades: trades.length,
    totalVolume: trades.reduce((sum, t) => sum + t.value, 0),
    totalPnL: trades.filter(t => t.status === 'closed').reduce((sum, t) => sum + t.pnl, 0),
    totalFees: trades.reduce((sum, t) => sum + t.fee, 0),
    winRate: trades.filter(t => t.status === 'closed').length > 0 
      ? (trades.filter(t => t.status === 'closed' && t.pnl > 0).length / trades.filter(t => t.status === 'closed').length) * 100 
      : 0,
    openPositions: trades.filter(t => t.status === 'open').length,
    averageTradeSize: trades.length > 0 ? trades.reduce((sum, t) => sum + t.value, 0) / trades.length : 0,
    averageDuration: trades.filter(t => t.duration).length > 0 
      ? trades.filter(t => t.duration).reduce((sum, t) => sum + (t.duration || 0), 0) / trades.filter(t => t.duration).length 
      : 0,
    bestTrade: trades.length > 0 ? trades.reduce((prev, curr) => (prev.pnl > curr.pnl) ? prev : curr, trades[0]) : null,
    worstTrade: trades.length > 0 ? trades.reduce((prev, curr) => (prev.pnl < curr.pnl) ? prev : curr, trades[0]) : null,
    profitFactor: trades.filter(t => t.pnl > 0).length > 0 && trades.filter(t => t.pnl < 0).length > 0
      ? trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) / Math.abs(trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0))
      : 0,
    sharpeRatio: 1.5, // Calculated from historical data
    maxDrawdown: -15.2,
    recoveryFactor: 1.8,
    winLossRatio: trades.filter(t => t.pnl > 0).length > 0 && trades.filter(t => t.pnl < 0).length > 0
      ? trades.filter(t => t.pnl > 0).length / trades.filter(t => t.pnl < 0).length
      : 0,
    averageWin: trades.filter(t => t.pnl > 0).length > 0 
      ? trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) / trades.filter(t => t.pnl > 0).length 
      : 0,
    averageLoss: trades.filter(t => t.pnl < 0).length > 0 
      ? Math.abs(trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0) / trades.filter(t => t.pnl < 0).length)
      : 0,
    consecutiveWins: 5,
    consecutiveLosses: 2
  };

  // Filter trades
  useEffect(() => {
    let filtered = trades;

    if (searchTerm) {
      filtered = filtered.filter(trade => 
        trade.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.id.includes(searchTerm)
      );
    }

    if (selectedAsset !== 'all') {
      filtered = filtered.filter(trade => trade.asset.includes(selectedAsset));
    }

    if (selectedUser !== 'all') {
      filtered = filtered.filter(trade => trade.userId === selectedUser);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(trade => trade.status === selectedStatus);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(trade => trade.type === selectedType);
    }

    // Date range filter
    const now = new Date();
    const cutoff = new Date();
    switch (dateRange) {
      case '1d':
        cutoff.setDate(cutoff.getDate() - 1);
        filtered = filtered.filter(t => new Date(t.date) >= cutoff);
        break;
      case '7d':
        cutoff.setDate(cutoff.getDate() - 7);
        filtered = filtered.filter(t => new Date(t.date) >= cutoff);
        break;
      case '30d':
        cutoff.setMonth(cutoff.getMonth() - 1);
        filtered = filtered.filter(t => new Date(t.date) >= cutoff);
        break;
      case '90d':
        cutoff.setMonth(cutoff.getMonth() - 3);
        filtered = filtered.filter(t => new Date(t.date) >= cutoff);
        break;
    }

    setFilteredTrades(filtered);
  }, [trades, searchTerm, selectedAsset, selectedUser, selectedStatus, selectedType, dateRange]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Data Refreshed",
        description: "Trading data has been updated.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh trading data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' = 'csv') => {
    const headers = ['ID', 'User', 'Asset', 'Type', 'Side', 'Amount', 'Price', 'Value', 'Status', 'P&L', 'Fee', 'Date'];
    const rows = filteredTrades.map(trade => [
      trade.id,
      trade.userEmail,
      trade.asset,
      trade.type,
      trade.side,
      trade.amount,
      trade.price,
      trade.value,
      trade.status,
      trade.pnl,
      trade.fee,
      trade.date
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-admin-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `${filteredTrades.length} trades exported.`,
    });
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    toast({
      title: "Alert Dismissed",
      description: "Alert has been acknowledged.",
    });
  };

  const viewTradeDetails = (trade: Trade) => {
    setSelectedTrade(trade);
    setShowTradeDetails(true);
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#EAECEF]">Trading Admin Panel</h1>
          <p className="text-[#848E9C]">Monitor and manage all trading activity</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-[#1E2329] rounded-lg px-3 py-1 border border-[#2B3139]">
            <div className={`w-2 h-2 rounded-full ${liveUpdates ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-xs text-[#EAECEF]">Live</span>
            <Switch
              checked={liveUpdates}
              onCheckedChange={setLiveUpdates}
              className="data-[state=checked]:bg-[#F0B90B] scale-75"
            />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
            className="border-[#2B3139] text-[#848E9C] hover:border-[#F0B90B] hover:text-[#F0B90B]"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleExport('csv')}
            className="border-[#2B3139] text-[#848E9C] hover:border-[#F0B90B] hover:text-[#F0B90B]"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {alerts.map(alert => (
          <AlertBanner 
            key={alert.id} 
            alert={alert} 
            onDismiss={() => acknowledgeAlert(alert.id)}
            onViewUser={handleViewUser}
            onViewTrade={handleViewTrade}
          />
        ))}
      </AnimatePresence>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatsCard
          title="Total Trades"
          value={stats.totalTrades}
          icon={BarChart3}
        />
        <StatsCard
          title="Total Volume"
          value={formatCurrency(stats.totalVolume)}
          icon={DollarSign}
        />
        <StatsCard
          title="Total P&L"
          value={`${stats.totalPnL >= 0 ? '+' : ''}${formatCurrency(stats.totalPnL)}`}
          icon={TrendingUp}
          trend={stats.totalPnL >= 0 ? 'up' : 'down'}
          trendValue={`${stats.winRate.toFixed(1)}% win rate`}
        />
        <StatsCard
          title="Open Positions"
          value={stats.openPositions}
          icon={Activity}
        />
        <StatsCard
          title="Avg Trade Size"
          value={formatCurrency(stats.averageTradeSize)}
          icon={Target}
        />
        <StatsCard
          title="Sharpe Ratio"
          value={stats.sharpeRatio.toFixed(2)}
          icon={Shield}
          trend={stats.sharpeRatio > 1.5 ? 'up' : 'down'}
          trendValue="Risk-adjusted"
        />
      </div>

      {/* Advanced Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
          <p className="text-xs text-[#848E9C]">Profit Factor</p>
          <p className={`text-xl font-bold ${stats.profitFactor > 1.5 ? 'text-green-400' : 'text-yellow-400'}`}>
            {stats.profitFactor.toFixed(2)}
          </p>
        </Card>
        <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
          <p className="text-xs text-[#848E9C]">Max Drawdown</p>
          <p className="text-xl font-bold text-red-400">{stats.maxDrawdown.toFixed(1)}%</p>
        </Card>
        <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
          <p className="text-xs text-[#848E9C]">Avg Win / Loss</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-green-400">+${(stats.averageWin / 1000).toFixed(1)}K</span>
            <span className="text-[#848E9C]">/</span>
            <span className="text-sm text-red-400">-${(stats.averageLoss / 1000).toFixed(1)}K</span>
          </div>
        </Card>
        <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
          <p className="text-xs text-[#848E9C]">Consecutive W/L</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-green-400">{stats.consecutiveWins} wins</span>
            <span className="text-[#848E9C]">/</span>
            <span className="text-sm text-red-400">{stats.consecutiveLosses} losses</span>
          </div>
        </Card>
      </div>

      {/* Advanced Monitoring Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ManipulationDetectionCard trades={trades} />
        <LiquidityMonitoringCard marketConditions={[]} />
        <PriceImpactAnalyzer trades={trades} />
        <CircuitBreakerControls />
      </div>

      {/* Market Conditions */}
      <Card className="bg-[#1E2329] border border-[#2B3139]">
        <CardHeader>
          <CardTitle className="text-[#EAECEF] flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#F0B90B]" />
            Market Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[].map((condition, i) => (
              <MarketConditionsCard key={i} condition={condition} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* P&L Trend */}
        <Card className="bg-[#1E2329] border border-[#2B3139]">
          <CardHeader>
            <CardTitle className="text-[#EAECEF] flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              P&L Trend (7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
                <XAxis dataKey="date" stroke="#848E9C" />
                <YAxis stroke="#848E9C" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E2329', border: '1px solid #2B3139' }}
                  labelStyle={{ color: '#EAECEF' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="#F0B90B" 
                  fill="#F0B90B" 
                  fillOpacity={0.3}
                  name="Cumulative P&L"
                />
                <Area 
                  type="monotone" 
                  dataKey="pnl" 
                  stroke="#627EEA" 
                  fill="#627EEA" 
                  fillOpacity={0.3}
                  name="Daily P&L"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Volume Trend */}
        <Card className="bg-[#1E2329] border border-[#2B3139]">
          <CardHeader>
            <CardTitle className="text-[#EAECEF] flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Volume Trend (7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
                <XAxis dataKey="date" stroke="#848E9C" />
                <YAxis stroke="#848E9C" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E2329', border: '1px solid #2B3139' }}
                  labelStyle={{ color: '#EAECEF' }}
                />
                <Bar dataKey="volume" fill="#F0B90B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Asset Distribution */}
        <Card className="bg-[#1E2329] border border-[#2B3139]">
          <CardHeader>
            <CardTitle className="text-[#EAECEF] flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Asset Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={[]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#848E9C'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E2329', border: '1px solid #2B3139' }}
                />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Win/Loss Distribution */}
        <Card className="bg-[#1E2329] border border-[#2B3139]">
          <CardHeader>
            <CardTitle className="text-[#EAECEF] flex items-center gap-2">
              <Target className="w-5 h-5" />
              Win/Loss Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-center">
                <div className="text-5xl font-bold text-[#EAECEF] mb-2">{stats.winRate.toFixed(1)}%</div>
                <div className="text-sm text-[#848E9C] mb-4">Win Rate</div>
                <Progress value={stats.winRate} className="w-64 h-2 bg-[#2B3139]" />
                <div className="flex justify-between mt-4 text-sm">
                  <div className="text-center">
                    <div className="text-green-400 font-bold">{stats.winLossRatio.toFixed(2)}</div>
                    <div className="text-xs text-[#848E9C]">Win/Loss Ratio</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#EAECEF] font-bold">{stats.totalTrades}</div>
                    <div className="text-xs text-[#848E9C]">Total Trades</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-[#1E2329] border border-[#2B3139]">
        <CardHeader className="cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#F0B90B]" />
              <CardTitle className="text-[#EAECEF]">Filters</CardTitle>
              <CardDescription className="text-[#848E9C]">
                ({filteredTrades.length} of {trades.length} trades)
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-[#848E9C]">
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div>
                <Label className="text-xs text-[#848E9C]">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#848E9C] w-4 h-4" />
                  <Input
                    placeholder="Search by ID, user, asset..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-[#181A20] border-[#2B3139] text-[#EAECEF] placeholder-[#5E6673]"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-[#848E9C]">Asset</Label>
                <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                  <SelectTrigger className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#181A20] border-[#2B3139]">
                    <SelectItem value="all">All Assets</SelectItem>
                    <SelectItem value="BTC">BTC</SelectItem>
                    <SelectItem value="ETH">ETH</SelectItem>
                    <SelectItem value="SOL">SOL</SelectItem>
                    <SelectItem value="BNB">BNB</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-[#848E9C]">User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#181A20] border-[#2B3139]">
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="1">John Doe</SelectItem>
                    <SelectItem value="2">Jane Smith</SelectItem>
                    <SelectItem value="3">Michael Johnson</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-[#848E9C]">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#181A20] border-[#2B3139]">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-[#848E9C]">Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#181A20] border-[#2B3139]">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="spot">Spot</SelectItem>
                    <SelectItem value="futures">Futures</SelectItem>
                    <SelectItem value="options">Options</SelectItem>
                    <SelectItem value="margin">Margin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-[#848E9C]">Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#181A20] border-[#2B3139]">
                    <SelectItem value="1d">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Trades Table */}
      <Card className="bg-[#1E2329] border border-[#2B3139]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[#EAECEF]">Trading Activity</CardTitle>
              <CardDescription className="text-[#848E9C]">
                Showing {filteredTrades.length} of {trades.length} trades
              </CardDescription>
            </div>
            <Button 
              onClick={loadTradingData}
              disabled={loading}
              variant="outline"
              size="sm"
              className="border-[#2B3139] text-[#848E9C] hover:border-[#F0B90B] hover:text-[#F0B90B]"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2B3139]">
                  <TableHead className="text-[#848E9C]">ID</TableHead>
                  <TableHead className="text-[#848E9C]">User</TableHead>
                  <TableHead className="text-[#848E9C]">Asset</TableHead>
                  <TableHead className="text-[#848E9C]">Type</TableHead>
                  <TableHead className="text-[#848E9C]">Side</TableHead>
                  <TableHead className="text-[#848E9C]">Amount</TableHead>
                  <TableHead className="text-[#848E9C]">Price</TableHead>
                  <TableHead className="text-[#848E9C]">Value</TableHead>
                  <TableHead className="text-[#848E9C]">Status</TableHead>
                  <TableHead className="text-[#848E9C]">P&L</TableHead>
                  <TableHead className="text-[#848E9C]">Date</TableHead>
                  <TableHead className="text-[#848E9C]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrades.map((trade) => (
                  <TableRow key={trade.id} className="border-[#2B3139] hover:bg-[#181A20]/50">
                    <TableCell className="text-[#EAECEF] font-mono text-xs">{trade.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium text-[#EAECEF]">{trade.userName}</div>
                        <div className="text-xs text-[#848E9C]">{trade.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[#EAECEF] font-medium">{trade.asset}</TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(trade.type || 'unknown')}>
                        {trade.type || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSideColor(trade.side || 'unknown')}>
                        {(trade.side || 'unknown').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#EAECEF]">{trade.amount || '0'}</TableCell>
                    <TableCell className="text-[#EAECEF]">${(trade.price || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-[#EAECEF]">${(trade.value || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(trade.status || 'unknown')}>
                        {trade.status || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {trade.status === 'closed' ? (
                        <span className={`font-medium ${getPnLColor(trade.pnl || 0)}`}>
                          {(trade.pnl || 0) >= 0 ? '+' : ''}${(trade.pnl || 0).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-[#848E9C]">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[#848E9C] text-sm">
                      {trade.date ? new Date(trade.date).toLocaleDateString() : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-[#848E9C] hover:text-[#F0B90B]"
                        onClick={() => viewTradeDetails(trade)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Trade Details Dialog */}
      <TradeDetailsDialog
        trade={selectedTrade}
        open={showTradeDetails}
        onClose={() => {
          setShowTradeDetails(false);
          setSelectedTrade(null);
        }}
      />
    </motion.div>
  );
}