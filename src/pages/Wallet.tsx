// WalletPage.tsx - Redesigned with premium UI/UX and mobile responsiveness
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Wallet, Send, Download, Plus, Bell, User, Home, BarChart2, 
  Briefcase, UserCircle, ArrowRight, Copy, QrCode, Clock, 
  TrendingUp, ArrowUpRight, ArrowDownLeft, RefreshCw, 
  MoreVertical, ChevronRight, Settings, History, X, CheckCircle,
  AlertTriangle, Info, Globe, Shield, Zap, Award, Star, CreditCard, LogOut, Upload,
  Crown, Eye, EyeOff, Filter, Download as DownloadIcon, ExternalLink, Activity,
  ArrowUpDown, PieChart, LineChart, Wallet2, Sparkles, ShieldCheck,
  Gift, Target, Lock, Unlock, TrendingDown, DollarSign, Percent,
  ChevronDown, Search, SlidersHorizontal
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useUnifiedWallet as useUnifiedWalletV2 } from '@/hooks/useUnifiedWallet-v2';
import { useTradingControl } from '@/hooks/useTradingControl';
import RecordsModal from '@/components/RecordsModal';
import WalletTransfer from '@/components/WalletTransfer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { QRCodeCanvas } from 'qrcode.react';
import { useMarketData } from '@/contexts/MarketDataContext';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

// Services
import { walletService } from '@/services/wallet-service-new';
import { tradingDataService } from '@/services/trading-data-service';
import { depositService } from '@/services/depositService';
import { supabase } from '@/lib/supabase';

// Types
interface Asset {
  symbol: string;
  name: string;
  balance: number;
  locked: number;
  value: number;
  icon?: string;
  change?: string;
}

interface Transaction {
  id: string;
  type: 'Deposit' | 'Withdrawal' | 'Swap' | 'Trade' | 'Arbitrage' | 'Staking' | 'Options' | 'Fee' | 'Funding' | 'Referral' | 'Airdrop';
  asset: string;
  amount: number;
  status: 'Pending' | 'Completed' | 'Failed' | 'Processing' | 'Scheduled' | 'Cancelled';
  date: string;
  details?: any;
  pnl?: number;
  category?: 'spot' | 'futures' | 'options' | 'arbitrage' | 'staking';
  metadata?: {
    shouldWin?: boolean;
    outcome?: 'win' | 'loss';
    network?: string;
    address?: string;
    txHash?: string;
    confirmations?: number;
  };
}

interface DepositAddress {
  label: string;
  value: string;
  note?: string;
}

interface Network {
  name: string;
  symbol: string;
  address: string;
  fee: number;
  minDeposit: number;
  minWithdrawal: number;
  confirmationTime: string;
  requiresMemo?: boolean;
  memo?: string;
}

interface ModalState {
  // Common
  isSubmitting: boolean;
  error: string;
  
  // Deposit
  depositNetwork: string;
  depositAmount: string;
  depositAddress: string;
  depositProof: File | null;
  depositProofUrl: string;
  
  // Withdrawal
  withdrawAddress: string;
  withdrawAmount: string;
  withdrawNetwork: string;
  withdrawMemo?: string;
  
  // Swap
  swapFromSymbol: string;
  swapToSymbol: string;
  swapAmount: string;
  swapEstimatedOutput: string;
  swapSlippage: number;
  
  // Send
  sendAddress: string;
  sendAmount: string;
  sendNetwork: string;
  sendMemo?: string;
  
  // UI
  copied: string;
  showQR: boolean;
}

// ==================== CONSTANTS ====================
const NETWORKS: Record<string, Network[]> = {
  BTC: [
    { name: 'Bitcoin', symbol: 'BTC', address: '1FTUbAx5QNTWbxyeMPpxRbwqH3XnvwKQb', fee: 0.0001, minDeposit: 0.001, minWithdrawal: 0.002, confirmationTime: '~30 min' },
    { name: 'Bitcoin (BEP20)', symbol: 'BTCB', address: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c', fee: 0.00005, minDeposit: 0.0005, minWithdrawal: 0.001, confirmationTime: '~5 min' }
  ],
  ETH: [
    { name: 'Ethereum', symbol: 'ETH', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', fee: 0.005, minDeposit: 0.01, minWithdrawal: 0.02, confirmationTime: '~5 min' },
    { name: 'Ethereum (BEP20)', symbol: 'ETHB', address: '0x2170ed0880ac9a755fd29b2688956bd959f933f8', fee: 0.001, minDeposit: 0.005, minWithdrawal: 0.01, confirmationTime: '~3 min' }
  ],
  USDT: [
    { name: 'ERC20', symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', fee: 5, minDeposit: 10, minWithdrawal: 20, confirmationTime: '~5 min' },
    { name: 'BEP20', symbol: 'USDT', address: '0x55d398326f99059ff775485246999027b3197955', fee: 1, minDeposit: 5, minWithdrawal: 10, confirmationTime: '~3 min' },
    { name: 'TRC20', symbol: 'USDT', address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', fee: 2, minDeposit: 5, minWithdrawal: 10, confirmationTime: '~2 min', requiresMemo: true, memo: '123456789' },
    { name: 'SOL', symbol: 'USDT', address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', fee: 0.5, minDeposit: 1, minWithdrawal: 5, confirmationTime: '~1 min' }
  ],
  SOL: [
    { name: 'Solana', symbol: 'SOL', address: '72K1NJZfx4nNDKWNYwkDRMDzBxYfsmn8o2qTiDspfqkd', fee: 0.01, minDeposit: 0.1, minWithdrawal: 0.5, confirmationTime: '~30 sec' }
  ],
  BNB: [
    { name: 'BSC', symbol: 'BNB', address: 'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2', fee: 0.005, minDeposit: 0.01, minWithdrawal: 0.05, confirmationTime: '~3 min' }
  ],
  XRP: [
    { name: 'Ripple', symbol: 'XRP', address: 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh', fee: 0.25, minDeposit: 1, minWithdrawal: 5, confirmationTime: '~10 sec', requiresMemo: true, memo: '123456789' }
  ],
  ADA: [
    { name: 'Cardano', symbol: 'ADA', address: 'addr1q9d5u0w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2', fee: 1, minDeposit: 5, minWithdrawal: 10, confirmationTime: '~2 min' }
  ],
  DOGE: [
    { name: 'Dogecoin', symbol: 'DOGE', address: 'D5d8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b', fee: 5, minDeposit: 10, minWithdrawal: 20, confirmationTime: '~10 min' }
  ]
};

const CRYPTO_ICONS: Record<string, string> = {
  USDT: '₮', BTC: '₿', ETH: 'Ξ', SOL: '◎', XRP: '✕', ADA: '₳', 
  DOGE: 'Ð', BNB: '🟡', AVAX: '🅰️', DOT: '⚫', MATIC: 'M', 
  TRX: 'T', LINK: '🔗', FIL: '🟦', XMR: 'Ⓜ️', ATOM: '⚛️', 
  LTC: 'Ł', ARB: '🅰️',
};

const CRYPTO_ASSETS = [
  { symbol: 'USDT', name: 'Tether' },
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'XRP', name: 'XRP' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'DOGE', name: 'Dogecoin' },
  { symbol: 'BNB', name: 'Binance Coin' },
];

const USSTOCKS: Asset[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', balance: 0, locked: 0, value: 0 },
  { symbol: 'TSLA', name: 'Tesla Inc.', balance: 0, locked: 0, value: 0 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', balance: 0, locked: 0, value: 0 },
];

const FUTURES: Asset[] = [
  { symbol: 'BTCUSD-PERP', name: 'BTC Perpetual', balance: 0, locked: 0, value: 0 },
  { symbol: 'ETHUSD-PERP', name: 'ETH Perpetual', balance: 0, locked: 0, value: 0 },
];

const ETFS: Asset[] = [
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', balance: 0, locked: 0, value: 0 },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', balance: 0, locked: 0, value: 0 },
];

// ==================== HELPER FUNCTIONS ====================
const getAssetIcon = (symbol: string): string => {
  return CRYPTO_ICONS[symbol] || '◉';
};

const formatCurrency = (value: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'USDT' ? 'USD' : currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatCrypto = (value: number, symbol: string): string => {
  const decimals = symbol === 'USDT' ? 2 : 6;
  return `${value.toFixed(decimals)} ${symbol}`;
};

const formatAddress = (address: string, chars: number = 6): string => {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

// ==================== MODAL COMPONENT ====================
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  fullScreen?: boolean;
}

function Modal({ open, onClose, title, children, fullScreen = false }: ModalProps) {
  if (!open) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          fullScreen ? 'w-full h-full md:h-auto md:max-w-lg' : 'w-full max-w-md',
          'bg-gradient-to-b from-[#1E2329] to-[#181A20] rounded-t-2xl md:rounded-2xl shadow-2xl',
          'flex flex-col max-h-[90vh] md:max-h-[80vh] border border-[#2B3139]'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2B3139] bg-[#1E2329]/50 backdrop-blur">
          <h2 className="text-lg font-semibold text-[#EAECEF]">{title}</h2>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 hover:bg-[#2B3139] rounded-xl transition-colors"
            onClick={onClose}
          >
            <X size={20} className="text-[#848E9C]" />
          </motion.button>
        </div>
        
        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ==================== QUICK ACTION BUTTON ====================
interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: 'default' | 'primary' | 'success' | 'warning';
  disabled?: boolean;
  tooltip?: string;
  badge?: number;
}

function QuickAction({ icon, label, onClick, color = 'default', disabled = false, tooltip, badge }: QuickActionProps) {
  const button = (
    <motion.button
      whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-xl transition-all relative group",
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-[#23262F]'
      )}
      onClick={disabled ? undefined : onClick}
      style={{ willChange: 'transform' }}
    >
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
        "group-hover:shadow-lg group-hover:shadow-black/20",
        color === 'primary' && 'bg-gradient-to-br from-[#F0B90B] to-[#F0B90B]/80 text-[#181A20] shadow-lg shadow-[#F0B90B]/10',
        color === 'success' && 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/10',
        color === 'warning' && 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/10',
        color === 'default' && 'bg-gradient-to-br from-[#2B3139] to-[#23262F] text-[#EAECEF]'
      )}>
        {icon}
        {badge && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#F0B90B] text-[#181A20] text-xs font-bold rounded-full flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>
      <span className="text-xs font-medium text-[#EAECEF]/90 select-none">{label}</span>
    </motion.button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-[#23262F] border-[#2B3139] text-[#EAECEF]">
            <p className="text-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}

// ==================== ASSET CARD ====================
interface AssetCardProps {
  asset: Asset;
  onClick?: () => void;
  showActions?: boolean;
  loading?: boolean;
  hideBalances?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

function AssetCard({ asset, onClick, showActions = false, loading = false, hideBalances = false, variant = 'default' }: AssetCardProps) {
  if (loading) {
    return (
      <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={{ scale: 1.01, x: 2 }}
        whileTap={{ scale: 0.99 }}
      >
        <Card 
          className="bg-[#1E2329] border border-[#2B3139] hover:border-[#F0B90B]/50 transition-all cursor-pointer overflow-hidden"
          onClick={onClick}
        >
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2B3139] to-[#23262F] flex items-center justify-center text-sm">
                  {getAssetIcon(asset.symbol)}
                </div>
                <div>
                  <h3 className="font-medium text-[#EAECEF] text-sm">{asset.symbol}</h3>
                  <p className="text-xs text-[#848E9C]">{asset.name}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-[#EAECEF] text-sm">
                  {hideBalances ? '••••••' : formatCrypto(asset.balance, asset.symbol)}
                </div>
                <div className="text-xs text-[#848E9C]">
                  ≈ ${asset.value.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Card 
        className="bg-gradient-to-b from-[#1E2329] to-[#1A1F26] border border-[#2B3139] hover:border-[#F0B90B]/50 transition-all cursor-pointer overflow-hidden group"
        onClick={onClick}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2B3139] to-[#23262F] flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                {getAssetIcon(asset.symbol)}
              </div>
              <div>
                <h3 className="font-semibold text-[#EAECEF]">{asset.name}</h3>
                <p className="text-xs text-[#848E9C]">{asset.symbol}</p>
              </div>
            </div>
            {asset.change && (
              <Badge className={cn(
                "text-xs",
                asset.change.startsWith('+') 
                  ? 'bg-green-500/15 text-green-400 border-green-500/20' 
                  : 'bg-red-500/15 text-red-400 border-red-500/20'
              )}>
                {asset.change}
              </Badge>
            )}
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <div className="text-xs text-[#848E9C] mb-1">Available</div>
              <div className="font-bold text-lg text-[#EAECEF]">
                {hideBalances ? '••••••' : formatCrypto(asset.balance, asset.symbol)}
              </div>
              {asset.locked > 0 && (
                <div className="flex items-center gap-1 text-xs text-[#F0B90B] mt-1">
                  <Lock size={12} />
                  Locked: {hideBalances ? '••••••' : formatCrypto(asset.locked, asset.symbol)}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-[#848E9C] mb-1">Value</div>
              <div className="font-semibold text-[#EAECEF]">
                {hideBalances ? '••••••' : `$${asset.value.toFixed(2)}`}
              </div>
            </div>
          </div>
          
          {showActions && asset.balance > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 mt-4 pt-3 border-t border-[#2B3139]"
            >
              <Button size="sm" variant="ghost" className="flex-1 text-xs h-8 hover:bg-[#2B3139] hover:text-[#F0B90B]">
                <ArrowDownLeft size={14} className="mr-1" />
                Deposit
              </Button>
              <Button size="sm" variant="ghost" className="flex-1 text-xs h-8 hover:bg-[#2B3139] hover:text-[#F0B90B]">
                <ArrowUpRight size={14} className="mr-1" />
                Withdraw
              </Button>
              <Button size="sm" variant="ghost" className="flex-1 text-xs h-8 hover:bg-[#2B3139] hover:text-[#F0B90B]">
                <RefreshCw size={14} className="mr-1" />
                Swap
              </Button>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// ==================== TRANSACTION ITEM ====================
interface TransactionItemProps {
  transaction: Transaction;
  hideBalances?: boolean;
}

function TransactionItem({ transaction, hideBalances }: TransactionItemProps) {
  const isPositive = transaction.amount > 0;
  const Icon = transaction.type === 'Deposit' ? ArrowDownLeft : 
               transaction.type === 'Withdrawal' ? ArrowUpRight : 
               transaction.type === 'Swap' ? RefreshCw :
               transaction.type === 'Trade' ? TrendingUp : Clock;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-500/15 text-green-400 border-green-500/20';
      case 'Pending': return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20';
      case 'Processing': return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
      case 'Failed': return 'bg-red-500/15 text-red-400 border-red-500/20';
      case 'Cancelled': return 'bg-gray-500/15 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/15 text-gray-400 border-gray-500/20';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Deposit': return 'bg-green-500/15 text-green-400';
      case 'Withdrawal': return 'bg-red-500/15 text-red-400';
      case 'Swap': return 'bg-blue-500/15 text-blue-400';
      case 'Trade': return 'bg-purple-500/15 text-purple-400';
      case 'Options': return 'bg-orange-500/15 text-orange-400';
      case 'Staking': return 'bg-yellow-500/15 text-yellow-400';
      default: return 'bg-gray-500/15 text-gray-400';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between py-3 border-b border-[#2B3139]/50 last:border-0 hover:bg-[#23262F]/50 transition-colors px-2 rounded-lg"
    >
      <div className="flex items-center gap-3">
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", getTypeColor(transaction.type))}>
          <Icon size={14} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#EAECEF]">{transaction.type}</span>
            {transaction.metadata?.shouldWin && (
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[8px] px-1 py-0">
                <Crown className="w-2 h-2 mr-0.5" />
                FW
              </Badge>
            )}
          </div>
          <div className="text-xs text-[#848E9C]">{transaction.asset}</div>
        </div>
      </div>
      <div className="text-right">
        <div className={cn("text-sm font-medium", isPositive ? 'text-green-400' : 'text-red-400')}>
          {hideBalances ? '••••••' : (
            <>{isPositive ? '+' : '-'}{Math.abs(transaction.amount).toFixed(6)} {transaction.asset}</>
          )}
        </div>
        {transaction.pnl !== undefined && transaction.pnl !== 0 && (
          <div className={cn("text-xs", transaction.pnl >= 0 ? 'text-green-400' : 'text-red-400')}>
            {hideBalances ? '••••••' : (
              <>{transaction.pnl >= 0 ? '+' : ''}{transaction.pnl.toFixed(2)} USDT</>
            )}
          </div>
        )}
        <Badge className={cn("text-[10px] mt-1", getStatusColor(transaction.status))}>
          {transaction.status}
        </Badge>
      </div>
    </motion.div>
  );
}

// ==================== STATS CARD ====================
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

function StatsCard({ title, value, change, icon, trend = 'neutral' }: StatsCardProps) {
  return (
    <Card className="bg-gradient-to-br from-[#1E2329] to-[#1A1F26] border border-[#2B3139] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[#848E9C]">{title}</span>
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          trend === 'up' && 'bg-green-500/15 text-green-400',
          trend === 'down' && 'bg-red-500/15 text-red-400',
          trend === 'neutral' && 'bg-[#F0B90B]/15 text-[#F0B90B]'
        )}>
          {icon}
        </div>
      </div>
      <div className="text-xl font-bold text-[#EAECEF]">{value}</div>
      {change && (
        <div className={cn(
          "text-xs mt-1",
          change.startsWith('+') ? 'text-green-400' : change.startsWith('-') ? 'text-red-400' : 'text-[#848E9C]'
        )}>
          {change}
        </div>
      )}
    </Card>
  );
}

// ==================== MAIN COMPONENT ====================
export default function WalletPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  
  // Use unified wallet v2 with default values
  const { 
    balances = { funding: {}, trading: {}, locked: {} },
    getFundingBalance = (asset: string) => 0,
    getTradingBalance = (asset: string) => 0,
    getLockedBalance = (asset: string) => 0,
    getTotalBalance = (asset: string) => 0,
    refreshBalances = async () => {},
    loading: walletLoading = false,
    locks = []
  } = useUnifiedWalletV2() || {};
  
  const {
    userOutcome,
    activeWindows = [],
    systemSettings,
    shouldWin = async () => false,
    loading: controlsLoading = false
  } = useTradingControl() || {};
  
  const { theme, currency = 'USD', setCurrency = () => {} } = useUserSettings() || {};
  const { prices = {} } = useMarketData() || {};

  // State management - Initialize all state with proper defaults
  const [modal, setModal] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [notifOpen, setNotifOpen] = useState<boolean>(false);
  const [showRecordsModal, setShowRecordsModal] = useState<boolean>(false);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [addAssetModal, setAddAssetModal] = useState<boolean>(false);
  const [addAssetSymbol, setAddAssetSymbol] = useState<string>('USDT');
  const [activeTab, setActiveTab] = useState<string>('crypto');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [hideBalances, setHideBalances] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'value' | 'balance' | 'name'>('value');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [depositRequests, setDepositRequests] = useState<any[]>([]);
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Initialize stats with default values
  const [stats, setStats] = useState({
    activeLocks: 0,
    totalVolume: 0,
    winRate: 0
  });

  // Helper function to get asset name
  const getAssetName = useCallback((symbol: string): string => {
    const names: Record<string, string> = {
      'USDT': 'Tether',
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'BNB': 'Binance Coin',
      'SOL': 'Solana',
      'ADA': 'Cardano',
      'XRP': 'Ripple',
      'DOT': 'Polkadot',
      'DOGE': 'Dogecoin',
      'MATIC': 'Polygon',
      'AVAX': 'Avalanche',
      'LINK': 'Chainlink',
      'UNI': 'Uniswap',
      'ATOM': 'Cosmos',
      'LTC': 'Litecoin',
      'BCH': 'Bitcoin Cash',
      'ALGO': 'Algorand',
      'NEAR': 'NEAR Protocol',
      'FIL': 'Filecoin',
      'TRX': 'TRON'
    };
    return names[symbol] || symbol;
  }, []);

  // Create portfolio from balances for display - FIXED with null checks
  const portfolio = useMemo(() => {
    // Ensure balances exists with default empty objects
    const safeBalances = {
      funding: balances?.funding || {},
      trading: balances?.trading || {},
      locked: balances?.locked || {}
    };
    
    const assets: Asset[] = [];
    const assetMap = new Map<string, Asset>();
    
    // Add funding assets
    Object.entries(safeBalances.funding).forEach(([symbol, balance]) => {
      // Skip legacy trading wallet entries
      if (!symbol.includes('_TRADING') && balance && Number(balance) > 0) {
        const price = prices?.[symbol] || (symbol === 'USDT' ? 1 : 0);
        const numBalance = Number(balance) || 0;
        assetMap.set(symbol, {
          symbol,
          name: getAssetName(symbol),
          balance: numBalance,
          locked: 0,
          value: numBalance * price,
          change: '0%'
        });
      }
    });
    
    // Add trading assets
    Object.entries(safeBalances.trading).forEach(([symbol, balance]) => {
      // Skip legacy trading wallet entries
      if (!symbol.includes('_TRADING') && balance && Number(balance) > 0) {
        const price = prices?.[symbol] || (symbol === 'USDT' ? 1 : 0);
        const numBalance = Number(balance) || 0;
        
        if (assetMap.has(symbol)) {
          const existing = assetMap.get(symbol)!;
          existing.balance += numBalance;
          existing.value = (existing.balance + existing.locked) * price;
        } else {
          assetMap.set(symbol, {
            symbol,
            name: getAssetName(symbol),
            balance: numBalance,
            locked: 0,
            value: numBalance * price,
            change: '0%'
          });
        }
      }
    });
    
    // Add locked assets
    Object.entries(safeBalances.locked).forEach(([symbol, balance]) => {
      // Skip legacy trading wallet entries
      if (!symbol.includes('_TRADING') && balance && Number(balance) > 0) {
        const price = prices?.[symbol] || (symbol === 'USDT' ? 1 : 0);
        const numBalance = Number(balance) || 0;
        
        if (assetMap.has(symbol)) {
          const existing = assetMap.get(symbol)!;
          existing.locked = numBalance;
          existing.value = (existing.balance + existing.locked) * price;
        } else {
          assetMap.set(symbol, {
            symbol,
            name: getAssetName(symbol),
            balance: 0,
            locked: numBalance,
            value: numBalance * price,
            change: '0%'
          });
        }
      }
    });
    
    // Convert map to array
    const assetsArray = Array.from(assetMap.values());
    
    // Sort by value descending
    assetsArray.sort((a, b) => b.value - a.value);
    
    return assetsArray;
  }, [balances, prices, getAssetName]);

  // Update stats when locks change
  useEffect(() => {
    const safeLocks = locks || [];
    const totalLocked = Object.values(balances?.locked || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
    
    setStats({
      activeLocks: safeLocks.length,
      totalVolume: totalLocked,
      winRate: 0
    });
  }, [locks, balances]);

  // Safe version of unified balance
  const getUnifiedBalance = useCallback((asset: string = 'USDT'): number => {
    return (getFundingBalance?.(asset) || 0) + (getTradingBalance?.(asset) || 0);
  }, [getFundingBalance, getTradingBalance]);

  // Total balance calculations - MOVED BEFORE displayBalance to fix initialization error
  const totalFundingBalance = useMemo(() => {
    return Object.values(balances?.funding || {}).reduce((acc, val) => acc + (Number(val) || 0), 0);
  }, [balances?.funding]);

  const totalTradingBalance = useMemo(() => {
    return Object.values(balances?.trading || {}).reduce((acc, val) => acc + (Number(val) || 0), 0);
  }, [balances?.trading]);

  const totalLockedBalance = useMemo(() => {
    return Object.values(balances?.locked || {}).reduce((acc, val) => acc + (Number(val) || 0), 0);
  }, [balances?.locked]);

  // Calculate total balance in selected currency - FIXED to use same data as wallet distribution
  const displayBalance = useMemo(() => {
    const total = totalFundingBalance + totalTradingBalance + totalLockedBalance;
    if (currency === 'BTC' && prices?.BTC) {
      return total / prices.BTC;
    }
    return total;
  }, [totalFundingBalance, totalTradingBalance, totalLockedBalance, currency, prices]);

  // Debug logging with safe checks
  useEffect(() => {
    console.log('💰 Wallet Debug:', {
      userId: user?.id,
      currency,
      fundingBalance: getFundingBalance?.('USDT'),
      tradingBalance: getTradingBalance?.('USDT'),
      lockedBalance: getLockedBalance?.('USDT'),
      totalBalance: totalFundingBalance + totalTradingBalance + totalLockedBalance,
      totalFunding: totalFundingBalance,
      totalTrading: totalTradingBalance,
      totalLocked: totalLockedBalance,
      portfolioCount: portfolio.length,
      hasData: portfolio.length > 0,
      walletLoading
    });
  }, [user, currency, getFundingBalance, getTradingBalance, getLockedBalance, totalFundingBalance, totalTradingBalance, totalLockedBalance, portfolio.length, walletLoading]);

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    
    // Refresh from unified wallet v2
    await refreshBalances?.();
    
    setRefreshing(false);
    toast({
      title: "Balance Updated",
      description: "Your wallet balances have been refreshed",
    });
  }, [refreshBalances, toast]);

  // Initialize data on mount
  useEffect(() => {
    refreshBalances?.();
  }, [refreshBalances]);

  // Optimized click handlers
  const handleTransferClick = useCallback(() => {
    setShowTransferModal(true);
  }, []);

  const handleSwapClick = useCallback(() => {
    setModal('swap');
  }, []);

  const handleDepositClick = useCallback(() => {
    if (!selectedAsset) {
      setSelectedAsset(portfolio[0] || { symbol: 'USDT', name: 'Tether', balance: 0, locked: 0, value: 0 });
    }
    setModal('deposit');
  }, [selectedAsset, portfolio]);

  const handleWithdrawClick = useCallback(() => {
    if (!selectedAsset) {
      setSelectedAsset(portfolio[0] || { symbol: 'USDT', name: 'Tether', balance: 0, locked: 0, value: 0 });
    }
    setModal('withdraw');
  }, [selectedAsset, portfolio]);

  const handleSendClick = useCallback(() => {
    if (!selectedAsset) {
      setSelectedAsset(portfolio[0] || { symbol: 'USDT', name: 'Tether', balance: 0, locked: 0, value: 0 });
    }
    setModal('send');
  }, [selectedAsset, portfolio]);

  // Transfer handlers (simplified for v2)
  const handleTransferToTrading = async (asset: string, amount: number) => {
    toast({
      title: "Coming Soon",
      description: "Transfer functionality will be available in the next update",
      variant: "default"
    });
  };

  const handleTransferToFunding = async (asset: string, amount: number) => {
    toast({
      title: "Coming Soon",
      description: "Transfer functionality will be available in the next update",
      variant: "default"
    });
  };

  // Handle deposit request submission using direct Supabase
  const handleDepositRequest = async () => {
    if (!selectedAsset) return;

    const amount = parseFloat(modalState.depositAmount);
    const network = modalState.depositNetwork;
    const proofFile = modalState.depositProof;

    // Validation
    if (!amount || amount <= 0) {
      setModalState(s => ({ ...s, error: 'Please enter a valid amount' }));
      return;
    }

    if (!network) {
      setModalState(s => ({ ...s, error: 'Please select a network' }));
      return;
    }

    if (!proofFile) {
      setModalState(s => ({ ...s, error: 'Please upload proof of payment' }));
      return;
    }

    setModalState(s => ({ ...s, isSubmitting: true, error: '' }));

    try {
      console.log('🚀 [Wallet] Submitting deposit request via Supabase:', {
        amount,
        currency: selectedAsset.symbol,
        network,
        hasProof: !!proofFile
      });

      // Get the platform's deposit address for the selected network
      const platformAddress = NETWORKS[selectedAsset.symbol]?.find(n => n.name === network)?.address || '';

      const result = await depositService.createDepositRequest({
        user_id: user?.id || '',
        user_email: user?.email || '',
        user_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email || '',
        amount: amount,
        currency: selectedAsset.symbol,
        network: network,
        address: platformAddress,
        status: 'Pending'
      }, proofFile);

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit deposit request');
      }

      console.log('✅ [Wallet] Deposit request created successfully:', result.data);

      // Update local state
      setDepositRequests(prev => [result.data!, ...prev]);

      // Show success message
      toast({
        title: "Deposit Request Submitted",
        description: `Your deposit request for ${amount} ${selectedAsset.symbol} has been submitted for review.`,
      });

      // Reset and close modal
      setModal(null);
      resetModalState();

    } catch (error) {
      console.error('❌ [Wallet] Deposit request error:', error);
      setModalState(s => ({ 
        ...s, 
        error: error instanceof Error ? error.message : 'Failed to submit deposit request' 
      }));
    } finally {
      setModalState(s => ({ ...s, isSubmitting: false }));
    }
  };

  // Handle withdrawal request
  const handleWithdrawRequest = async () => {
    if (!selectedAsset) return;

    const amount = parseFloat(modalState.withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setModalState(s => ({ ...s, error: 'Please enter a valid amount' }));
      return;
    }

    if (amount > (selectedAsset.balance || 0)) {
      setModalState(s => ({ ...s, error: 'Insufficient balance' }));
      return;
    }

    toast({
      title: "Coming Soon",
      description: "Withdrawal functionality will be available in the next update",
      variant: "default"
    });
  };

  // Handle swap
  const handleSwap = async () => {
    const fromSymbol = modalState.swapFromSymbol || selectedAsset?.symbol || portfolio[0]?.symbol || '';
    const toSymbol = modalState.swapToSymbol;
    const amount = parseFloat(modalState.swapAmount);

    if (!fromSymbol || !toSymbol) {
      setModalState(s => ({ ...s, error: 'Please select both currencies' }));
      return;
    }

    if (fromSymbol === toSymbol) {
      setModalState(s => ({ ...s, error: 'Cannot swap to the same currency' }));
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      setModalState(s => ({ ...s, error: 'Please enter a valid amount' }));
      return;
    }

    const fromAsset = portfolio.find(a => a.symbol === fromSymbol);
    if (!fromAsset || amount > fromAsset.balance) {
      setModalState(s => ({ ...s, error: 'Insufficient balance' }));
      return;
    }

    // Check if this swap should be profitable based on admin settings
    const shouldWinSwap = await shouldWin('swap');

    try {
      setModalState(s => ({ ...s, isSubmitting: true, error: '' }));

      toast({
        title: "Coming Soon",
        description: "Swap functionality will be available in the next update",
        variant: "default"
      });

      setModal(null);
      resetModalState();

    } catch (error) {
      console.error('Swap error:', error);
      setModalState(s => ({ ...s, error: error instanceof Error ? error.message : 'Swap failed' }));
    } finally {
      setModalState(s => ({ ...s, isSubmitting: false }));
    }
  };

  // Handle send
  const handleSend = async () => {
    if (!selectedAsset) return;

    const amount = parseFloat(modalState.sendAmount);
    if (isNaN(amount) || amount <= 0) {
      setModalState(s => ({ ...s, error: 'Please enter a valid amount' }));
      return;
    }

    const network = NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.sendNetwork);
    if (!network) {
      setModalState(s => ({ ...s, error: 'Please select a network' }));
      return;
    }

    if (amount > selectedAsset.balance) {
      setModalState(s => ({ ...s, error: 'Insufficient balance' }));
      return;
    }

    if (!modalState.sendAddress || modalState.sendAddress.length < 10) {
      setModalState(s => ({ ...s, error: 'Invalid recipient address' }));
      return;
    }

    toast({
      title: "Coming Soon",
      description: "Send functionality will be available in the next update",
      variant: "default"
    });
  };

  // Handle file upload for deposit proof
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please upload an image file (JPG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setModalState(s => ({ ...s, depositProof: file }));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setModalState(s => ({ ...s, depositProofUrl: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle add asset
  const handleAddAsset = useCallback(() => {
    toast({
      title: "Coming Soon",
      description: "Asset addition will be available in the next update",
      variant: "default"
    });
    setAddAssetModal(false);
  }, [toast]);

  // Handle export
  const handleExport = async (format: 'csv' | 'json' = 'csv') => {
    try {
      if (format === 'csv') {
        const headers = [
          'ID',
          'Type',
          'Asset',
          'Amount',
          'Status',
          'Date',
          'Network',
          'Address',
          'TX Hash',
          'P&L'
        ].join(',');

        const rows = transactions.map(tx => [
          tx.id,
          tx.type,
          tx.asset,
          tx.amount,
          tx.status,
          new Date(tx.date).toISOString(),
          tx.metadata?.network || '',
          tx.metadata?.address || '',
          tx.metadata?.txHash || '',
          tx.pnl || ''
        ].join(','));

        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wallet_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: "Export Successful",
          description: `Exported ${transactions.length} transactions`,
        });
      } else {
        const json = JSON.stringify(transactions, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wallet_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: "Export Successful",
          description: `Exported ${transactions.length} transactions`,
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export transactions",
        variant: "destructive"
      });
    }
    setShowExportMenu(false);
  };

  // Reset modal state
  const resetModalState = useCallback(() => {
    setModalState({
      isSubmitting: false,
      error: '',
      depositNetwork: 'ERC20',
      depositAmount: '',
      depositAddress: '',
      depositProof: null,
      depositProofUrl: '',
      withdrawAddress: '',
      withdrawAmount: '',
      withdrawNetwork: 'ERC20',
      swapFromSymbol: '',
      swapToSymbol: '',
      swapAmount: '',
      swapEstimatedOutput: '',
      swapSlippage: 0.5,
      sendAddress: '',
      sendAmount: '',
      sendNetwork: 'ERC20',
      copied: '',
      showQR: false,
    });
  }, []);

  // Modal state
  const [modalState, setModalState] = useState<ModalState>({
    isSubmitting: false,
    error: '',
    depositNetwork: 'ERC20',
    depositAmount: '',
    depositAddress: '',
    depositProof: null,
    depositProofUrl: '',
    withdrawAddress: '',
    withdrawAmount: '',
    withdrawNetwork: 'ERC20',
    swapFromSymbol: '',
    swapToSymbol: '',
    swapAmount: '',
    swapEstimatedOutput: '',
    swapSlippage: 0.5,
    sendAddress: '',
    sendAmount: '',
    sendNetwork: 'ERC20',
    copied: '',
    showQR: false,
  });

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifOpen || profileOpen) {
        const target = event.target as Element;
        if (!target.closest('[data-dropdown]')) {
          setNotifOpen(false);
          setProfileOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen, profileOpen]);

  // Filter and sort portfolio
  const filteredPortfolio = useMemo(() => {
    return portfolio
      .filter(asset => 
        asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === 'value') return b.value - a.value;
        if (sortBy === 'balance') return b.balance - a.balance;
        return a.name.localeCompare(b.name);
      });
  }, [portfolio, searchQuery, sortBy]);

  // Debug logging for filteredPortfolio
  useEffect(() => {
    console.log('🔍 Portfolio Debug:', {
      portfolioLength: portfolio.length,
      portfolioData: portfolio.map(p => ({ symbol: p.symbol, name: p.name, balance: p.balance })),
      searchQuery,
      sortBy,
      filteredLength: filteredPortfolio.length
    });
  }, [portfolio, searchQuery, sortBy]);

  // Navigation items
  const navItems = [
    { key: 'home', label: 'Home', icon: <Home size={20} />, path: '' },
    { key: 'trading', label: 'Trade', icon: <BarChart2 size={20} />, path: 'trading' },
    { key: 'wallet', label: 'Wallet', icon: <Wallet size={20} />, path: 'wallet' },
    { key: 'portfolio', label: 'Portfolio', icon: <Briefcase size={20} />, path: 'portfolio' },
    { key: 'account', label: 'Account', icon: <UserCircle size={20} />, path: 'account' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#181A20] to-[#0E0F14] pb-24">
      {/* Mobile Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-30 bg-[#181A20]/95 backdrop-blur-xl border-b border-[#2B3139]/50"
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="w-9 h-9 bg-gradient-to-br from-[#F0B90B] to-[#F0B90B]/80 rounded-xl flex items-center justify-center shadow-lg shadow-[#F0B90B]/20"
            >
              <Wallet size={18} className="text-[#181A20]" />
            </motion.div>
            <div>
              <h1 className="text-lg font-bold text-[#EAECEF]">Wallet</h1>
              <p className="text-xs text-[#848E9C]">Manage your assets</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 hover:bg-[#23262F] rounded-xl transition-colors"
                    onClick={() => setHideBalances(!hideBalances)}
                  >
                    {hideBalances ? <Eye size={20} className="text-[#EAECEF]" /> : <EyeOff size={20} className="text-[#EAECEF]" />}
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{hideBalances ? 'Show' : 'Hide'} balances</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 hover:bg-[#23262F] rounded-xl transition-colors"
                    onClick={handleRefresh}
                    disabled={refreshing}
                  >
                    <RefreshCw size={20} className={`text-[#EAECEF] ${refreshing ? 'animate-spin' : ''}`} />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh balances</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="relative p-2 hover:bg-[#23262F] rounded-xl transition-colors"
                    onClick={() => setShowRecordsModal(true)}
                  >
                    <History size={20} className="text-[#EAECEF]" />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Transaction history</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="relative p-2 hover:bg-[#23262F] rounded-xl transition-colors"
                    onClick={() => setNotifOpen(!notifOpen)}
                    data-dropdown
                  >
                    <Bell size={20} className="text-[#EAECEF]" />
                    <motion.span 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#F0B90B] rounded-full"
                    />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Notifications</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 bg-gradient-to-br from-[#F0B90B] to-[#F0B90B]/80 rounded-xl flex items-center justify-center shadow-lg shadow-[#F0B90B]/20 hover:shadow-xl transition-all"
              onClick={() => setProfileOpen(!profileOpen)}
              data-dropdown
            >
              <span className="text-sm font-bold text-[#181A20]">
                {user?.first_name?.[0] || user?.email?.[0] || 'U'}
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {notifOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute top-20 right-4 w-80 bg-gradient-to-b from-[#1E2329] to-[#1A1F26] border border-[#2B3139] rounded-2xl shadow-2xl z-50"
            data-dropdown
          >
            <div className="p-4 border-b border-[#2B3139]">
              <h3 className="font-semibold text-[#EAECEF]">Notifications</h3>
            </div>
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              <div className="p-4 space-y-3">
                <motion.div 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-start gap-3 p-3 bg-[#23262F] rounded-xl hover:bg-[#2B3139] transition-colors cursor-pointer"
                >
                  <div className="w-2 h-2 bg-[#F0B90B] rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-[#EAECEF] font-medium">Welcome to Kryvex</p>
                    <p className="text-xs text-[#848E9C] mt-1">Start your trading journey today</p>
                    <p className="text-xs text-[#5E6673] mt-2">Just now</p>
                  </div>
                </motion.div>
              </div>
            </div>
            <div className="p-3 border-t border-[#2B3139]">
              <button className="text-xs text-[#F0B90B] hover:text-yellow-400 transition-colors font-medium">
                Mark all as read
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Dropdown */}
      <AnimatePresence>
        {profileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute top-20 right-4 w-64 bg-gradient-to-b from-[#1E2329] to-[#1A1F26] border border-[#2B3139] rounded-2xl shadow-2xl z-50 overflow-hidden"
            data-dropdown
          >
            <div className="p-4 bg-gradient-to-r from-[#F0B90B]/10 to-transparent border-b border-[#2B3139]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#F0B90B] to-[#F0B90B]/80 rounded-xl flex items-center justify-center">
                  <span className="text-sm font-bold text-[#181A20]">
                    {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#EAECEF]">
                    {user?.first_name && user?.last_name 
                      ? `${user.first_name} ${user.last_name}` 
                      : user?.email || 'User'
                    }
                  </p>
                  <p className="text-xs text-[#848E9C]">{user?.email}</p>
                </div>
              </div>
              {userOutcome?.enabled && userOutcome.outcome_type === 'win' && (
                <Badge className="mt-2 bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[10px]">
                  <Crown className="w-2 h-2 mr-1" />
                  Force Win Active
                </Badge>
              )}
            </div>
            <div className="py-2">
              {[
                { icon: <User size={16} />, label: 'Profile Settings', path: '/account' },
                { icon: <Shield size={16} />, label: 'Security', path: '/security' },
                { icon: <Gift size={16} />, label: 'Referrals', path: '/referrals' },
                { icon: <Settings size={16} />, label: 'Preferences', path: '/settings' },
              ].map((item, index) => (
                <motion.button
                  key={item.label}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="w-full px-4 py-2.5 text-left text-sm text-[#EAECEF] hover:bg-[#23262F] transition-colors flex items-center gap-3 group"
                  onClick={() => {
                    navigate(item.path);
                    setProfileOpen(false);
                  }}
                >
                  <span className="text-[#848E9C] group-hover:text-[#F0B90B] transition-colors">{item.icon}</span>
                  {item.label}
                </motion.button>
              ))}
              <Separator className="my-2 bg-[#2B3139]" />
              <motion.button
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-[#23262F] transition-colors flex items-center gap-3"
                onClick={() => {
                  logout();
                  setProfileOpen(false);
                }}
              >
                <LogOut size={16} />
                Sign Out
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="px-4 py-4 space-y-5 max-w-7xl mx-auto">
        {/* Total Balance Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-[#1E2329] via-[#1A1F26] to-[#161B22] border border-[#2B3139]/50 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#848E9C]">Total Balance</span>
              <div className="flex items-center gap-2">
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-20 h-8 bg-[#23262F] border-[#2B3139] text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="BTC">BTC</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-[#23262F] rounded-lg"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                  >
                    <DownloadIcon size={16} className="text-[#848E9C]" />
                  </Button>
                  <AnimatePresence>
                    {showExportMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-32 bg-[#1E2329] border border-[#2B3139] rounded-xl shadow-xl z-10 overflow-hidden"
                      >
                        <button
                          className="w-full px-4 py-2.5 text-left text-sm text-[#EAECEF] hover:bg-[#23262F] transition-colors"
                          onClick={() => handleExport('csv')}
                        >
                          CSV
                        </button>
                        <button
                          className="w-full px-4 py-2.5 text-left text-sm text-[#EAECEF] hover:bg-[#23262F] transition-colors"
                          onClick={() => handleExport('json')}
                        >
                          JSON
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-[#EAECEF] mb-2 tracking-tight">
                  {walletLoading ? (
                    <Skeleton className="h-10 w-48" />
                  ) : hideBalances ? (
                    '••••••••'
                  ) : currency === 'BTC' ? 
                    `${displayBalance.toFixed(6)} BTC` : 
                    formatCurrency(displayBalance, currency)
                  }
                </div>
                <div className="text-sm text-[#848E9C] flex items-center gap-1">
                  {walletLoading ? <Skeleton className="h-4 w-32" /> : hideBalances ? '••••••' : `≈ ${formatCurrency(getTotalBalance?.('USDT') || 0)} USD`}
                  <Badge className="ml-2 bg-gray-500/15 text-gray-400 border-gray-500/20 text-[10px]">
                    <TrendingUp size={10} className="mr-1" />
                    0% (24h)
                  </Badge>
                </div>
              </div>
              
              {/* Wallet Distribution */}
              <div className="flex gap-4 bg-[#23262F]/50 p-3 rounded-xl">
                <div>
                  <div className="text-xs text-[#848E9C] mb-1">Funding</div>
                  <div className="text-sm font-semibold text-[#EAECEF]">
                    {hideBalances ? '••••••' : formatCurrency(totalFundingBalance)}
                  </div>
                </div>
                <div className="w-px h-8 bg-[#2B3139]"></div>
                <div>
                  <div className="text-xs text-[#848E9C] mb-1">Trading</div>
                  <div className="text-sm font-semibold text-[#F0B90B]">
                    {hideBalances ? '••••••' : formatCurrency(totalTradingBalance)}
                  </div>
                </div>
                {totalLockedBalance > 0 && (
                  <>
                    <div className="w-px h-8 bg-[#2B3139]"></div>
                    <div>
                      <div className="text-xs text-[#848E9C] mb-1">Locked</div>
                      <div className="text-sm font-semibold text-[#F0B90B]">
                        {hideBalances ? '••••••' : formatCurrency(totalLockedBalance)}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
              <StatsCard
                title="Total Assets"
                value={portfolio.length}
                icon={<Wallet2 size={16} />}
                trend="neutral"
              />
              <StatsCard
                title="24h Volume"
                value="$0.00"
                change="+0%"
                icon={<Activity size={16} />}
                trend="neutral"
              />
              <StatsCard
                title="Active Trades"
                value={stats.activeLocks}
                icon={<Target size={16} />}
                trend="neutral"
              />
              <StatsCard
                title="Win Rate"
                value="0%"
                icon={<Crown size={16} />}
                trend="neutral"
              />
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions - Now 5 buttons with premium styling */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-5 gap-2"
        >
          <QuickAction 
            icon={<ArrowDownLeft size={20} />}
            label="Deposit"
            onClick={handleDepositClick}
            color="primary"
            tooltip="Deposit funds to your funding wallet"
          />
          <QuickAction 
            icon={<ArrowUpRight size={20} />}
            label="Withdraw"
            onClick={handleWithdrawClick}
            disabled={getUnifiedBalance('USDT') <= 0}
            tooltip={getUnifiedBalance('USDT') <= 0 ? "No funds to withdraw" : "Withdraw from funding wallet"}
          />
          <QuickAction 
            icon={<RefreshCw size={20} />}
            label="Swap"
            onClick={handleSwapClick}
            disabled={portfolio.length < 2}
            tooltip={portfolio.length < 2 ? "Need at least 2 assets to swap" : "Swap between assets"}
          />
          <QuickAction 
            icon={<Send size={20} />}
            label="Send"
            onClick={handleSendClick}
            disabled={getUnifiedBalance('USDT') <= 0}
            tooltip={getUnifiedBalance('USDT') <= 0 ? "No funds to send" : "Send to another wallet"}
          />
          <QuickAction 
            icon={<ArrowUpDown size={20} />}
            label="Transfer"
            onClick={handleTransferClick}
            tooltip="Transfer between funding and trading wallets"
            badge={stats.activeLocks}
          />
        </motion.div>

        {/* Wallet Transfer Modal */}
        <AnimatePresence>
          {showTransferModal && (
            <WalletTransfer 
              isOpen={showTransferModal}
              onClose={() => setShowTransferModal(false)}
              onTransfer={handleTransferToTrading}
              onTransferBack={handleTransferToFunding}
              fundingBalance={getFundingBalance?.('USDT') || 0}
              tradingBalance={getTradingBalance?.('USDT') || 0}
            />
          )}
        </AnimatePresence>

        {/* Search and Filter Bar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#848E9C]" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#1E2329] border-[#2B3139] text-[#EAECEF] h-10 rounded-xl focus:border-[#F0B90B] transition-colors"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-10 w-10 border-[#2B3139] hover:bg-[#23262F] rounded-xl transition-colors",
              showFilters && "bg-[#23262F] border-[#F0B90B]"
            )}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={18} className="text-[#848E9C]" />
          </Button>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-32 h-10 bg-[#1E2329] border-[#2B3139] text-xs rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="value">By Value</SelectItem>
              <SelectItem value="balance">By Balance</SelectItem>
              <SelectItem value="name">By Name</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Asset Tabs */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full bg-[#1E2329]/50 p-1 rounded-2xl border border-[#2B3139]">
              <TabsTrigger 
                value="crypto" 
                className="text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F0B90B] data-[state=active]:to-[#F0B90B]/90 data-[state=active]:text-[#181A20] rounded-xl transition-all"
              >
                Crypto ({portfolio.length})
              </TabsTrigger>
              <TabsTrigger 
                value="usstock" 
                className="text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F0B90B] data-[state=active]:to-[#F0B90B]/90 data-[state=active]:text-[#181A20] rounded-xl transition-all"
              >
                Stocks
              </TabsTrigger>
              <TabsTrigger 
                value="futures" 
                className="text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F0B90B] data-[state=active]:to-[#F0B90B]/90 data-[state=active]:text-[#181A20] rounded-xl transition-all"
              >
                Futures
              </TabsTrigger>
              <TabsTrigger 
                value="etf" 
                className="text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F0B90B] data-[state=active]:to-[#F0B90B]/90 data-[state=active]:text-[#181A20] rounded-xl transition-all"
              >
                ETFs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="crypto" className="mt-4">
              {/* Show active trades if any */}
              <AnimatePresence>
                {stats.activeLocks > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4"
                  >
                    <Card className="bg-gradient-to-r from-[#1E2329] to-[#23262F] border-[#2B3139] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-[#F0B90B]" />
                          <h3 className="font-medium text-[#EAECEF]">Active Positions</h3>
                        </div>
                        <Badge className="bg-[#F0B90B]/15 text-[#F0B90B] border-[#F0B90B]/20">
                          {formatCurrency(totalLockedBalance)} Active
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {(locks || []).slice(0, 3).map((lock: any) => {
                          // Clean up the lock type display
                          const cleanType = lock.lockType || lock.type || 'Position';
                          const displayName = cleanType === 'options' ? 'Options Trade' : 
                                           cleanType === 'futures' ? 'Futures Trade' :
                                           cleanType === 'spot' ? 'Spot Trade' :
                                           cleanType.charAt(0).toUpperCase() + cleanType.slice(1);
                          
                          return (
                            <div key={lock.id} className="flex justify-between items-center text-sm p-2 bg-[#23262F] rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-[#F0B90B] rounded-full"></div>
                                <span className="text-[#848E9C]">{displayName}</span>
                              </div>
                              <span className="text-[#F0B90B] font-mono font-medium">
                                {formatCurrency(lock.amount || 0)} {lock.asset || 'USDT'}
                              </span>
                            </div>
                          );
                        })}
                        {(locks || []).length > 3 && (
                          <div className="text-xs text-[#848E9C] text-center pt-1">
                            +{(locks || []).length - 3} more positions
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="space-y-3">
                {filteredPortfolio.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16 bg-[#1E2329] rounded-2xl border border-[#2B3139]"
                  >
                    <motion.div
                      animate={{ 
                        y: [0, -10, 0],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ repeat: Infinity, duration: 4 }}
                      className="text-6xl mb-4"
                    >
                      💰
                    </motion.div>
                    <div className="text-[#EAECEF] font-medium mb-2">No assets yet</div>
                    <div className="text-sm text-[#848E9C] mb-6 max-w-xs mx-auto">Add your first cryptocurrency to start trading and managing your portfolio</div>
                    <Button 
                      className="bg-gradient-to-r from-[#F0B90B] to-[#F0B90B]/80 hover:from-[#F0B90B] hover:to-[#F0B90B] text-[#181A20] font-bold px-6 h-11 rounded-xl shadow-lg shadow-[#F0B90B]/20"
                      onClick={() => setAddAssetModal(true)}
                    >
                      <Plus size={18} className="mr-2" />
                      Add Asset
                    </Button>
                  </motion.div>
                ) : (
                  <AnimatePresence>
                    {filteredPortfolio.map((asset, index) => (
                      <motion.div
                        key={asset.symbol}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <AssetCard 
                          asset={asset} 
                          loading={walletLoading}
                          hideBalances={hideBalances}
                          onClick={() => {
                            setSelectedAsset(asset);
                            setModal('assetDetail');
                          }}
                          showActions={asset.balance > 0}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </TabsContent>

            <TabsContent value="usstock" className="mt-4">
              <div className="space-y-3">
                {USSTOCKS.map(asset => (
                  <AssetCard key={asset.symbol} asset={asset} loading={walletLoading} hideBalances={hideBalances} variant="compact" />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="futures" className="mt-4">
              <div className="space-y-3">
                {FUTURES.map(asset => (
                  <AssetCard key={asset.symbol} asset={asset} loading={walletLoading} hideBalances={hideBalances} variant="compact" />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="etf" className="mt-4">
              <div className="space-y-3">
                {ETFS.map(asset => (
                  <AssetCard key={asset.symbol} asset={asset} loading={walletLoading} hideBalances={hideBalances} variant="compact" />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#EAECEF]">Recent Transactions</h3>
            <button 
              className="text-xs text-[#F0B90B] flex items-center gap-1 hover:text-yellow-400 transition-colors font-medium"
              onClick={() => setShowRecordsModal(true)}
            >
              View All
              <ChevronRight size={14} />
            </button>
          </div>
          
          <Card className="bg-[#1E2329] border border-[#2B3139] p-4 rounded-2xl">
            {transactions.length === 0 ? (
              <div className="text-center py-10">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 5 }}
                  className="text-5xl mb-4"
                >
                  📋
                </motion.div>
                <div className="text-[#848E9C] text-sm">No transactions yet</div>
                <div className="text-xs text-[#5E6673] mt-2">Make your first deposit to get started</div>
              </div>
            ) : (
              <div className="space-y-1 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                {transactions.slice(0, 8).map(tx => (
                  <TransactionItem key={tx.id} transaction={tx} hideBalances={hideBalances} />
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Active Windows Banner */}
        <AnimatePresence>
          {activeWindows.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-400">
                    Active Trading Windows
                  </p>
                  <p className="text-xs text-amber-400/80 mt-1">
                    {activeWindows.map((w: any) => w.outcome_type?.toUpperCase() || 'WIN').join(' • ')}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Asset Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="fixed bottom-24 right-4 z-40 bg-gradient-to-r from-[#F0B90B] to-[#F0B90B]/80 text-[#181A20] rounded-2xl shadow-2xl shadow-[#F0B90B]/20 w-14 h-14 flex items-center justify-center hover:shadow-xl transition-all"
              onClick={() => setAddAssetModal(true)}
            >
              <Plus size={24} />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Add new asset</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Bottom Navigation */}
      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 w-full bg-[#1E2329]/95 backdrop-blur-xl border-t border-[#2B3139]/50 px-2 py-2 z-50"
      >
        <div className="flex justify-around items-center max-w-md mx-auto">
          {navItems.map((item, index) => {
            const isActive = location.pathname === `/${item.path}` || 
              (item.path === '' && location.pathname === '/');
            return (
              <motion.button
                key={item.key}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex flex-col items-center px-3 py-1.5 rounded-xl transition-all relative",
                  isActive 
                    ? 'text-[#F0B90B]' 
                    : 'text-[#848E9C] hover:text-[#EAECEF]'
                )}
                onClick={() => navigate(item.path ? `/${item.path}` : '/')}
              >
                {item.icon}
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute -bottom-2 w-1 h-1 bg-[#F0B90B] rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.nav>

      {/* Add Asset Modal */}
      <Modal open={addAssetModal} onClose={() => setAddAssetModal(false)} title="Add Asset">
        <form onSubmit={(e) => { e.preventDefault(); handleAddAsset(); }} className="space-y-5">
          <div>
            <Label className="text-sm text-[#848E9C] mb-2 block">Select Asset</Label>
            <Select value={addAssetSymbol} onValueChange={setAddAssetSymbol}>
              <SelectTrigger className="w-full bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12 rounded-xl focus:border-[#F0B90B]">
                <SelectValue placeholder="Select Asset" />
              </SelectTrigger>
              <SelectContent>
                {CRYPTO_ASSETS.map(a => (
                  <SelectItem key={a.symbol} value={a.symbol}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg w-6">{getAssetIcon(a.symbol)}</span>
                      <div>
                        <span className="font-medium">{a.name}</span>
                        <span className="text-xs text-[#848E9C] ml-2">({a.symbol})</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-[#F0B90B] to-[#F0B90B]/80 hover:from-[#F0B90B] hover:to-[#F0B90B] text-[#181A20] font-bold h-12 rounded-xl shadow-lg shadow-[#F0B90B]/20"
          >
            Add to Wallet
          </Button>
        </form>
      </Modal>

      {/* Asset Detail Modal */}
      <AnimatePresence>
        {modal === 'assetDetail' && selectedAsset && (
          <Modal open={true} onClose={() => setModal(null)} title={selectedAsset.name}>
            <div className="space-y-5">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#23262F] to-[#1E2329] rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2B3139] to-[#23262F] flex items-center justify-center text-3xl shadow-xl">
                  {getAssetIcon(selectedAsset.symbol)}
                </div>
                <div>
                  <div className="text-xl font-bold text-[#EAECEF]">{selectedAsset.name}</div>
                  <div className="text-sm text-[#848E9C]">{selectedAsset.symbol}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#23262F] rounded-xl p-4">
                  <div className="text-xs text-[#848E9C] mb-1">Funding</div>
                  <div className="text-lg font-bold text-[#EAECEF]">
                    {hideBalances ? '••••••' : formatCrypto(selectedAsset.balance, selectedAsset.symbol)}
                  </div>
                </div>
                <div className="bg-[#23262F] rounded-xl p-4">
                  <div className="text-xs text-[#848E9C] mb-1">Trading</div>
                  <div className="text-lg font-bold text-[#F0B90B]">
                    {hideBalances ? '••••••' : formatCrypto(getTradingBalance?.(selectedAsset.symbol) || 0, selectedAsset.symbol)}
                  </div>
                </div>
                <div className="bg-[#23262F] rounded-xl p-4">
                  <div className="text-xs text-[#848E9C] mb-1">Locked</div>
                  <div className="text-lg font-bold text-[#EAECEF]">
                    {hideBalances ? '••••••' : formatCrypto(selectedAsset.locked, selectedAsset.symbol)}
                  </div>
                </div>
                <div className="bg-[#23262F] rounded-xl p-4">
                  <div className="text-xs text-[#848E9C] mb-1">Value</div>
                  <div className="text-lg font-bold text-[#EAECEF]">
                    {hideBalances ? '••••••' : `$${selectedAsset.value.toFixed(2)}`}
                  </div>
                </div>
              </div>

              {/* Network Info */}
              {NETWORKS[selectedAsset.symbol] && (
                <div className="bg-[#23262F] rounded-xl p-4">
                  <div className="text-xs text-[#848E9C] mb-3">Available Networks</div>
                  <div className="space-y-2">
                    {NETWORKS[selectedAsset.symbol].map(network => (
                      <div key={network.name} className="flex items-center justify-between text-sm p-2 bg-[#1E2329] rounded-lg">
                        <span className="text-[#EAECEF]">{network.name}</span>
                        <span className="text-[#848E9C] text-xs">Min: {network.minDeposit} {selectedAsset.symbol}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <Button 
                  className="bg-gradient-to-r from-[#F0B90B] to-[#F0B90B]/80 hover:from-[#F0B90B] hover:to-[#F0B90B] text-[#181A20] font-bold h-11 rounded-xl"
                  onClick={() => {
                    setModal('deposit');
                  }}
                >
                  <ArrowDownLeft size={16} className="mr-2" />
                  Deposit
                </Button>
                <Button 
                  className="bg-[#2B3139] hover:bg-[#3A3F4A] text-[#EAECEF] font-bold h-11 rounded-xl"
                  onClick={() => {
                    setModal('withdraw');
                  }}
                  disabled={selectedAsset.balance <= 0}
                >
                  <ArrowUpRight size={16} className="mr-2" />
                  Withdraw
                </Button>
                <Button 
                  className="bg-[#2B3139] hover:bg-[#3A3F4A] text-[#EAECEF] font-bold h-11 rounded-xl"
                  onClick={() => {
                    setModal('swap');
                  }}
                >
                  <RefreshCw size={16} className="mr-2" />
                  Swap
                </Button>
              </div>
              
              <Button
                className="w-full bg-gradient-to-r from-[#F0B90B] to-[#F0B90B]/80 hover:from-[#F0B90B] hover:to-[#F0B90B] text-[#181A20] font-bold h-11 rounded-xl shadow-lg shadow-[#F0B90B]/20"
                onClick={() => {
                  setShowTransferModal(true);
                  setModal(null);
                }}
              >
                <ArrowUpDown size={16} className="mr-2" />
                Transfer to Trading Wallet
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Deposit Modal */}
      <AnimatePresence>
        {modal === 'deposit' && selectedAsset && (
          <Modal open={true} onClose={() => { setModal('assetDetail'); resetModalState(); }} title={`Deposit ${selectedAsset.symbol}`}>
            <div className="space-y-5">
              {/* QR Code Toggle */}
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#848E9C] hover:text-[#EAECEF] hover:bg-[#23262F] rounded-xl"
                  onClick={() => setModalState(s => ({ ...s, showQR: !s.showQR }))}
                >
                  <QrCode size={16} className="mr-2" />
                  {modalState.showQR ? 'Hide QR' : 'Show QR'}
                </Button>
              </div>

              {/* QR Code */}
              <AnimatePresence>
                {modalState.showQR && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center justify-center mb-4"
                  >
                    <div className="bg-[#23262F] p-4 rounded-2xl shadow-xl">
                      <QRCodeCanvas 
                        value={NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.depositNetwork)?.address || ''} 
                        size={200} 
                        bgColor="#23262F" 
                        fgColor="#EAECEF" 
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Network Selection */}
              {NETWORKS[selectedAsset.symbol] && (
                <div>
                  <Label className="block text-sm text-[#848E9C] mb-2">Network</Label>
                  <select
                    className="w-full bg-[#23262F] rounded-xl px-4 py-3 text-[#EAECEF] border border-[#2B3139] focus:border-[#F0B90B] transition-colors"
                    value={modalState.depositNetwork}
                    onChange={e => setModalState(s => ({ ...s, depositNetwork: e.target.value, copied: '' }))}
                  >
                    {NETWORKS[selectedAsset.symbol].map(net => (
                      <option key={net.name} value={net.name}>
                        {net.name} (Fee: {net.fee} {selectedAsset.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Deposit Address */}
              <div>
                <Label className="block text-sm text-[#848E9C] mb-2">Platform Deposit Address</Label>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-3">
                  <p className="text-xs text-blue-400 font-medium">
                    💡 Copy this address and send your {selectedAsset.symbol} to deposit funds
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-[#23262F] rounded-xl px-4 py-3 text-xs text-[#EAECEF] font-mono break-all border border-[#2B3139]">
                    {NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.depositNetwork)?.address || ''}
                  </code>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 bg-gradient-to-r from-[#F0B90B] to-[#F0B90B]/80 rounded-xl flex items-center justify-center shadow-lg shadow-[#F0B90B]/20"
                    onClick={() => {
                      const address = NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.depositNetwork)?.address || '';
                      navigator.clipboard.writeText(address);
                      setModalState(s => ({ ...s, copied: 'address' }));
                      setTimeout(() => setModalState(s => ({ ...s, copied: '' })), 2000);
                      toast({
                        title: 'Address Copied!',
                        description: 'Platform deposit address copied to clipboard',
                      });
                    }}
                  >
                    {modalState.copied === 'address' ? <CheckCircle size={16} className="text-[#181A20]" /> : <Copy size={16} className="text-[#181A20]" />}
                  </motion.button>
                </div>
              </div>

              {/* Memo/Tag if required */}
              {NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.depositNetwork)?.requiresMemo && (
                <div>
                  <Label className="block text-sm text-[#848E9C] mb-2">Destination Tag / Memo</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-[#23262F] rounded-xl px-4 py-3 text-xs text-[#EAECEF] font-mono border border-[#2B3139]">
                      {NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.depositNetwork)?.memo || ''}
                    </code>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-10 h-10 bg-gradient-to-r from-[#F0B90B] to-[#F0B90B]/80 rounded-xl flex items-center justify-center shadow-lg shadow-[#F0B90B]/20"
                      onClick={() => {
                        const memo = NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.depositNetwork)?.memo || '';
                        navigator.clipboard.writeText(memo);
                        toast({
                          title: 'Copied!',
                          description: 'Memo copied to clipboard',
                        });
                      }}
                    >
                      <Copy size={16} className="text-[#181A20]" />
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Amount */}
              <div>
                <Label className="block text-sm text-[#848E9C] mb-2">Deposit Amount</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={modalState.depositAmount}
                  onChange={e => setModalState(s => ({ ...s, depositAmount: e.target.value, error: '' }))}
                  className="bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12 rounded-xl focus:border-[#F0B90B]"
                  min={NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.depositNetwork)?.minDeposit || 0}
                  step={selectedAsset.symbol === 'USDT' ? '0.01' : '0.000001'}
                />
                <p className="text-xs text-[#848E9C] mt-1">
                  Min: {NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.depositNetwork)?.minDeposit} {selectedAsset.symbol}
                </p>
              </div>

              {/* Payment Proof Upload */}
              <div>
                <Label className="block text-sm text-[#848E9C] mb-2">Payment Proof</Label>
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-[#2B3139] rounded-xl p-4 hover:border-[#F0B90B]/50 transition-colors">
                    <input
                      type="file"
                      id="deposit-proof"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                    <label
                      htmlFor="deposit-proof"
                      className="flex flex-col items-center justify-center cursor-pointer hover:bg-[#2B3139]/50 transition-colors rounded-xl p-4"
                    >
                      <Upload className="w-8 h-8 text-[#848E9C] mb-2" />
                      <span className="text-sm text-[#848E9C]">Click to upload payment proof</span>
                      <span className="text-xs text-[#848E9C]/60">JPG, PNG, GIF up to 5MB</span>
                    </label>
                  </div>
                  
                  <AnimatePresence>
                    {modalState.depositProofUrl && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="relative"
                      >
                        <img 
                          src={modalState.depositProofUrl} 
                          alt="Payment proof" 
                          className="w-full h-48 object-cover rounded-xl"
                        />
                        <Button
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 h-8 w-8 rounded-lg"
                          onClick={() => setModalState(s => ({ ...s, depositProof: null, depositProofUrl: '' }))}
                        >
                          <X size={16} />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              {/* Warnings */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-yellow-400 font-medium">
                      Send only {selectedAsset.symbol} via {modalState.depositNetwork} to this address.
                    </p>
                    <p className="text-xs text-yellow-400/80 mt-1">
                      Confirmation time: {NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.depositNetwork)?.confirmationTime}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#23262F] rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <Info size={14} className="text-[#848E9C]" />
                  <p className="text-xs text-[#848E9C]">
                    Deposit requests require admin approval. Funds will be added to your funding wallet once approved.
                  </p>
                </div>
              </div>

              <AnimatePresence>
                {modalState.error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-3"
                  >
                    <p className="text-xs text-red-400">{modalState.error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                className="w-full bg-gradient-to-r from-[#F0B90B] to-[#F0B90B]/80 hover:from-[#F0B90B] hover:to-[#F0B90B] text-[#181A20] font-bold h-12 rounded-xl shadow-lg shadow-[#F0B90B]/20"
                onClick={handleDepositRequest}
                disabled={!modalState.depositAmount || !modalState.depositProof || modalState.isSubmitting}
              >
                {modalState.isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  'Submit Deposit Request'
                )}
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {modal === 'withdraw' && selectedAsset && (
          <Modal open={true} onClose={() => { setModal('assetDetail'); resetModalState(); }} title={`Withdraw ${selectedAsset.symbol}`}>
            <div className="space-y-5">
              {/* Asset Info */}
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#23262F] to-[#1E2329] rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2B3139] to-[#23262F] flex items-center justify-center text-xl">
                  {getAssetIcon(selectedAsset.symbol)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[#EAECEF]">{selectedAsset.symbol}</div>
                  <div className="text-xs text-[#848E9C]">Funding Available</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-[#EAECEF]">{hideBalances ? '••••••' : formatCrypto(selectedAsset.balance, selectedAsset.symbol)}</div>
                  <div className="text-xs text-[#848E9C]">≈ ${selectedAsset.value.toFixed(2)}</div>
                </div>
              </div>

              {/* Network Selection */}
              {NETWORKS[selectedAsset.symbol] && (
                <div>
                  <Label className="block text-sm text-[#848E9C] mb-2">Network</Label>
                  <select
                    className="w-full bg-[#23262F] rounded-xl px-4 py-3 text-[#EAECEF] border border-[#2B3139] focus:border-[#F0B90B] transition-colors"
                    value={modalState.withdrawNetwork}
                    onChange={e => setModalState(s => ({ ...s, withdrawNetwork: e.target.value, error: '' }))}
                  >
                    {NETWORKS[selectedAsset.symbol].map(net => (
                      <option key={net.name} value={net.name}>
                        {net.name} (Fee: {net.fee} {selectedAsset.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Withdrawal Address */}
              <div>
                <Label className="block text-sm text-[#848E9C] mb-2">Withdrawal Address</Label>
                <Input
                  placeholder="Enter wallet address"
                  value={modalState.withdrawAddress}
                  onChange={e => setModalState(s => ({ ...s, withdrawAddress: e.target.value, error: '' }))}
                  className="bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12 rounded-xl focus:border-[#F0B90B]"
                />
              </div>

              {/* Memo/Tag if required */}
              {NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.withdrawNetwork)?.requiresMemo && (
                <div>
                  <Label className="block text-sm text-[#848E9C] mb-2">Destination Tag / Memo</Label>
                  <Input
                    placeholder="Enter destination tag"
                    value={modalState.withdrawMemo || ''}
                    onChange={e => setModalState(s => ({ ...s, withdrawMemo: e.target.value, error: '' }))}
                    className="bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12 rounded-xl focus:border-[#F0B90B]"
                  />
                </div>
              )}

              {/* Amount */}
              <div>
                <Label className="block text-sm text-[#848E9C] mb-2">Amount</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={modalState.withdrawAmount}
                    onChange={e => setModalState(s => ({ ...s, withdrawAmount: e.target.value, error: '' }))}
                    className="bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12 rounded-xl pr-20 focus:border-[#F0B90B]"
                    min={NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.withdrawNetwork)?.minWithdrawal || 0}
                    max={selectedAsset.balance}
                    step={selectedAsset.symbol === 'USDT' ? '0.01' : '0.000001'}
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F0B90B] text-sm font-semibold hover:text-yellow-400 transition-colors"
                    onClick={() => setModalState(s => ({ ...s, withdrawAmount: selectedAsset.balance.toString() }))}
                  >
                    MAX
                  </button>
                </div>
                <p className="text-xs text-[#848E9C] mt-1">
                  Min: {NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.withdrawNetwork)?.minWithdrawal} {selectedAsset.symbol}
                </p>
              </div>

              {/* Fee Calculation */}
              <div className="bg-[#23262F] rounded-xl p-3">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#848E9C]">Network Fee</span>
                  <span className="text-[#EAECEF] font-medium">
                    {hideBalances ? '••••••' : (
                      <>
                        {NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.withdrawNetwork)?.fee || 0} {selectedAsset.symbol}
                      </>
                    )}
                  </span>
                </div>
                <Separator className="bg-[#2B3139] my-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-[#848E9C]">You'll receive</span>
                  <span className="font-semibold text-[#EAECEF]">
                    {hideBalances ? '••••••' : (
                      modalState.withdrawAmount 
                        ? (parseFloat(modalState.withdrawAmount) - (NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.withdrawNetwork)?.fee || 0)).toFixed(6)
                        : 0
                    )} {selectedAsset.symbol}
                  </span>
                </div>
              </div>

              {/* Error Display */}
              <AnimatePresence>
                {modalState.error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-3"
                  >
                    <p className="text-xs text-red-400">{modalState.error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                className="w-full bg-gradient-to-r from-[#F0B90B] to-[#F0B90B]/80 hover:from-[#F0B90B] hover:to-[#F0B90B] text-[#181A20] font-bold h-12 rounded-xl shadow-lg shadow-[#F0B90B]/20"
                onClick={handleWithdrawRequest}
                disabled={!modalState.withdrawAmount || !modalState.withdrawAddress || modalState.isSubmitting}
              >
                {modalState.isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing...
                  </div>
                ) : (
                  'Request Withdrawal'
                )}
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Swap Modal */}
      <AnimatePresence>
        {modal === 'swap' && (
          <Modal open={true} onClose={() => { setModal(selectedAsset ? 'assetDetail' : null); resetModalState(); }} title="Swap Assets">
            <div className="space-y-5">
              {/* From Section */}
              <div>
                <Label className="block text-sm text-[#848E9C] mb-2">From</Label>
                <div className="flex items-center gap-2">
                  <select
                    className="flex-1 bg-[#23262F] rounded-xl px-4 py-3 text-[#EAECEF] border border-[#2B3139] focus:border-[#F0B90B] transition-colors"
                    value={modalState.swapFromSymbol || selectedAsset?.symbol || portfolio[0]?.symbol || ''}
                    onChange={e => setModalState(s => ({ ...s, swapFromSymbol: e.target.value, error: '' }))}
                  >
                    {portfolio.map(a => (
                      <option key={a.symbol} value={a.symbol}>
                        {a.symbol} - {hideBalances ? '••••••' : formatCrypto(a.balance, a.symbol)}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={modalState.swapAmount}
                    onChange={e => {
                      const amount = e.target.value;
                      setModalState(s => ({ ...s, swapAmount: amount, error: '' }));
                      
                      // Calculate estimated output (mock rate)
                      const fromSymbol = s.swapFromSymbol || selectedAsset?.symbol || portfolio[0]?.symbol || '';
                      const toSymbol = s.swapToSymbol;
                      if (fromSymbol && toSymbol && amount) {
                        const rate = fromSymbol === 'USDT' && toSymbol === 'BTC' ? 0.000025 :
                                    fromSymbol === 'BTC' && toSymbol === 'USDT' ? 40000 : 1;
                        const estimated = parseFloat(amount) * rate;
                        setModalState(s => ({ ...s, swapEstimatedOutput: estimated.toFixed(toSymbol === 'USDT' ? 2 : 6) }));
                      }
                    }}
                    className="flex-1 bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12 rounded-xl focus:border-[#F0B90B]"
                    min="0"
                    step="any"
                  />
                </div>
                <p className="text-xs text-[#848E9C] mt-1">
                  Available: {portfolio.find(a => a.symbol === (modalState.swapFromSymbol || selectedAsset?.symbol || portfolio[0]?.symbol))?.balance.toFixed(6) || '0'} {modalState.swapFromSymbol || selectedAsset?.symbol || portfolio[0]?.symbol}
                </p>
              </div>

              {/* Swap Arrow */}
              <div className="flex justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-[#F0B90B] to-[#F0B90B]/80 flex items-center justify-center shadow-lg shadow-[#F0B90B]/20"
                >
                  <ArrowRight size={20} className="text-[#181A20]" />
                </motion.div>
              </div>

              {/* To Section */}
              <div>
                <Label className="block text-sm text-[#848E9C] mb-2">To</Label>
                <select
                  className="w-full bg-[#23262F] rounded-xl px-4 py-3 text-[#EAECEF] border border-[#2B3139] focus:border-[#F0B90B] transition-colors"
                  value={modalState.swapToSymbol}
                  onChange={e => {
                    setModalState(s => ({ ...s, swapToSymbol: e.target.value, error: '' }));
                    
                    // Recalculate estimated output
                    const fromSymbol = s.swapFromSymbol || selectedAsset?.symbol || portfolio[0]?.symbol || '';
                    const toSymbol = e.target.value;
                    if (fromSymbol && toSymbol && s.swapAmount) {
                      const rate = fromSymbol === 'USDT' && toSymbol === 'BTC' ? 0.000025 :
                                  fromSymbol === 'BTC' && toSymbol === 'USDT' ? 40000 : 1;
                      const estimated = parseFloat(s.swapAmount) * rate;
                      setModalState(s => ({ ...s, swapEstimatedOutput: estimated.toFixed(toSymbol === 'USDT' ? 2 : 6) }));
                    }
                  }}
                >
                  <option value="">Select asset</option>
                  {portfolio
                    .filter(a => a.symbol !== (modalState.swapFromSymbol || selectedAsset?.symbol || portfolio[0]?.symbol))
                    .map(a => (
                      <option key={a.symbol} value={a.symbol}>{a.symbol}</option>
                    ))}
                </select>
              </div>

              {/* Slippage */}
              <div>
                <Label className="block text-sm text-[#848E9C] mb-2">Slippage Tolerance</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[0.1, 0.5, 1.0].map(slippage => (
                    <Button
                      key={slippage}
                      variant={modalState.swapSlippage === slippage ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        "h-10 rounded-xl text-sm",
                        modalState.swapSlippage === slippage
                          ? 'bg-gradient-to-r from-[#F0B90B] to-[#F0B90B]/80 text-[#181A20] border-0'
                          : 'border-[#2B3139] text-[#848E9C] hover:bg-[#23262F]'
                      )}
                      onClick={() => setModalState(s => ({ ...s, swapSlippage: slippage }))}
                    >
                      {slippage}%
                    </Button>
                  ))}
                </div>
              </div>

              {/* Estimated Output */}
              {modalState.swapFromSymbol && modalState.swapToSymbol && (
                <div className="bg-[#23262F] rounded-xl p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#848E9C]">You'll receive</span>
                    <span className="font-semibold text-[#EAECEF]">
                      {hideBalances ? '••••••' : (
                        <>{modalState.swapEstimatedOutput || '0'} {modalState.swapToSymbol}</>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-[#848E9C]">
                    <span>Rate</span>
                    <span className="font-mono">
                      1 {modalState.swapFromSymbol} ≈ {
                        modalState.swapFromSymbol === 'USDT' && modalState.swapToSymbol === 'BTC' ? '0.000025' :
                        modalState.swapFromSymbol === 'BTC' && modalState.swapToSymbol === 'USDT' ? '40,000' : '1'
                      } {modalState.swapToSymbol}
                    </span>
                  </div>
                </div>
              )}

              {/* Error Display */}
              <AnimatePresence>
                {modalState.error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-3"
                  >
                    <p className="text-xs text-red-400">{modalState.error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                className="w-full bg-gradient-to-r from-[#F0B90B] to-[#F0B90B]/80 hover:from-[#F0B90B] hover:to-[#F0B90B] text-[#181A20] font-bold h-12 rounded-xl shadow-lg shadow-[#F0B90B]/20"
                onClick={handleSwap}
                disabled={!modalState.swapAmount || !modalState.swapFromSymbol || !modalState.swapToSymbol || modalState.isSubmitting}
              >
                {modalState.isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Swapping...
                  </div>
                ) : (
                  'Swap'
                )}
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Send Modal */}
      <AnimatePresence>
        {modal === 'send' && selectedAsset && (
          <Modal open={true} onClose={() => { setModal('assetDetail'); resetModalState(); }} title={`Send ${selectedAsset.symbol}`}>
            <div className="space-y-5">
              {/* Asset Info */}
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#23262F] to-[#1E2329] rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2B3139] to-[#23262F] flex items-center justify-center text-xl">
                  {getAssetIcon(selectedAsset.symbol)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[#EAECEF]">{selectedAsset.symbol}</div>
                  <div className="text-xs text-[#848E9C]">Funding Available</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-[#EAECEF]">{hideBalances ? '••••••' : formatCrypto(selectedAsset.balance, selectedAsset.symbol)}</div>
                  <div className="text-xs text-[#848E9C]">≈ ${selectedAsset.value.toFixed(2)}</div>
                </div>
              </div>

              {/* Network Selection */}
              {NETWORKS[selectedAsset.symbol] && (
                <div>
                  <Label className="block text-sm text-[#848E9C] mb-2">Network</Label>
                  <select
                    className="w-full bg-[#23262F] rounded-xl px-4 py-3 text-[#EAECEF] border border-[#2B3139] focus:border-[#F0B90B] transition-colors"
                    value={modalState.sendNetwork}
                    onChange={e => setModalState(s => ({ ...s, sendNetwork: e.target.value, error: '' }))}
                  >
                    {NETWORKS[selectedAsset.symbol].map(net => (
                      <option key={net.name} value={net.name}>
                        {net.name} (Fee: {net.fee} {selectedAsset.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Recipient Address */}
              <div>
                <Label className="block text-sm text-[#848E9C] mb-2">Recipient Address</Label>
                <Input
                  placeholder="Enter wallet address"
                  value={modalState.sendAddress}
                  onChange={e => setModalState(s => ({ ...s, sendAddress: e.target.value, error: '' }))}
                  className="bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12 rounded-xl focus:border-[#F0B90B]"
                />
              </div>

              {/* Memo/Tag if required */}
              {NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.sendNetwork)?.requiresMemo && (
                <div>
                  <Label className="block text-sm text-[#848E9C] mb-2">Destination Tag / Memo</Label>
                  <Input
                    placeholder="Enter destination tag"
                    value={modalState.sendMemo || ''}
                    onChange={e => setModalState(s => ({ ...s, sendMemo: e.target.value, error: '' }))}
                    className="bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12 rounded-xl focus:border-[#F0B90B]"
                  />
                </div>
              )}

              {/* Amount */}
              <div>
                <Label className="block text-sm text-[#848E9C] mb-2">Amount</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={modalState.sendAmount}
                    onChange={e => setModalState(s => ({ ...s, sendAmount: e.target.value, error: '' }))}
                    className="bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12 rounded-xl pr-20 focus:border-[#F0B90B]"
                    min="0"
                    max={selectedAsset.balance}
                    step={selectedAsset.symbol === 'USDT' ? '0.01' : '0.000001'}
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F0B90B] text-sm font-semibold hover:text-yellow-400 transition-colors"
                    onClick={() => setModalState(s => ({ ...s, sendAmount: selectedAsset.balance.toString() }))}
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Fee Calculation */}
              <div className="bg-[#23262F] rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#848E9C]">Network Fee</span>
                  <span className="text-[#EAECEF] font-medium">
                    {hideBalances ? '••••••' : (
                      <>
                        {NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.sendNetwork)?.fee || 0} {selectedAsset.symbol}
                      </>
                    )}
                  </span>
                </div>
                <Separator className="bg-[#2B3139] my-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-[#848E9C]">Recipient receives</span>
                  <span className="font-semibold text-[#EAECEF]">
                    {hideBalances ? '••••••' : (
                      modalState.sendAmount 
                        ? (parseFloat(modalState.sendAmount) - (NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.sendNetwork)?.fee || 0)).toFixed(6)
                        : 0
                    )} {selectedAsset.symbol}
                  </span>
                </div>
              </div>

              {/* Error Display */}
              <AnimatePresence>
                {modalState.error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-3"
                  >
                    <p className="text-xs text-red-400">{modalState.error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                className="w-full bg-gradient-to-r from-[#F0B90B] to-[#F0B90B]/80 hover:from-[#F0B90B] hover:to-[#F0B90B] text-[#181A20] font-bold h-12 rounded-xl shadow-lg shadow-[#F0B90B]/20"
                onClick={handleSend}
                disabled={!modalState.sendAmount || !modalState.sendAddress || modalState.isSubmitting}
              >
                {modalState.isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending...
                  </div>
                ) : (
                  'Send'
                )}
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Records Modal */}
      <RecordsModal open={showRecordsModal} onClose={() => setShowRecordsModal(false)} />

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1E2329;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2B3139;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #F0B90B;
        }
        
        @media (max-width: 640px) {
          input, select, button {
            font-size: 16px !important;
          }
        }

        /* Smooth animations */
        * {
          -webkit-tap-highlight-color: transparent;
        }

        /* Loading skeleton animation */
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite linear;
          background: linear-gradient(to right, #1E2329 4%, #2B3139 25%, #1E2329 36%);
          background-size: 1000px 100%;
        }
      `}</style>
    </div>
  );
}