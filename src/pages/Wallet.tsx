// WalletPage.tsx - Fixed with proper two-wallet integration and working buttons
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Wallet, Send, Download, Plus, Bell, User, Home, BarChart2, 
  Briefcase, UserCircle, ArrowRight, Copy, QrCode, Clock, 
  TrendingUp, ArrowUpRight, ArrowDownLeft, RefreshCw, 
  MoreVertical, ChevronRight, Settings, History, X, CheckCircle,
  AlertTriangle, Info, Globe, Shield, Zap, Award, Star, CreditCard, LogOut, Upload,
  Crown, Eye, EyeOff, Filter, Download as DownloadIcon, ExternalLink, Activity,
  ArrowUpDown
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useWallet } from '@/contexts/WalletContext';
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet';
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
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Services
import { walletService } from '@/services/walletService';
import { transactionService } from '@/services/transactionService';
import { adminService } from '@/services/adminService';
import { tradingDataService } from '@/services/trading-data-service';
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
    { name: 'Cardano', symbol: 'ADA', address: 'addr1q9d5u0w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2', fee: 1, minDeposit: 5, minWithdrawal: 10, confirmationTime: '~2 min' }
  ],
  DOGE: [
    { name: 'Dogecoin', symbol: 'DOGE', address: 'D5d8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8', fee: 5, minDeposit: 10, minWithdrawal: 20, confirmationTime: '~10 min' }
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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 animate-in fade-in duration-200">
      <div className={`
        ${fullScreen ? 'w-full h-full md:h-auto md:max-w-lg' : 'w-full max-w-md'} 
        bg-[#181A20] rounded-t-2xl md:rounded-2xl shadow-xl 
        animate-in slide-in-from-bottom md:zoom-in-95 duration-300
        flex flex-col max-h-[90vh] md:max-h-[80vh]
      `}>
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2B3139]">
          <button 
            className="p-2 hover:bg-[#23262F] rounded-lg transition-colors"
            onClick={onClose}
          >
            <X size={20} className="text-[#848E9C]" />
          </button>
          <h2 className="text-lg font-bold text-[#EAECEF]">{title}</h2>
          <div className="w-10" /> {/* Spacer */}
        </div>
        
        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// ==================== QUICK ACTION BUTTON ====================
interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: 'default' | 'primary';
  disabled?: boolean;
  tooltip?: string;
}

function QuickAction({ icon, label, onClick, color = 'default', disabled = false, tooltip }: QuickActionProps) {
  const button = (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-colors group cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#23262F]'
      }`}
      onClick={disabled ? undefined : onClick}
      style={{ willChange: 'transform' }}
    >
      <div className={`
        w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200
        ${color === 'primary' ? 'bg-[#F0B90B]/20 text-[#F0B90B] group-hover:bg-[#F0B90B]/30' : 
          'bg-[#2B3139] text-[#EAECEF] group-hover:bg-[#3A3F4A]'}
      `}>
        {icon}
      </div>
      <span className="text-xs font-medium text-[#EAECEF] select-none">{label}</span>
    </motion.button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
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
}

function AssetCard({ asset, onClick, showActions = false, loading = false, hideBalances = false }: AssetCardProps) {
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

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card 
        className="bg-[#1E2329] border border-[#2B3139] hover:border-[#F0B90B] transition-all cursor-pointer overflow-hidden"
        onClick={onClick}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2B3139] flex items-center justify-center text-xl">
                {getAssetIcon(asset.symbol)}
              </div>
              <div>
                <h3 className="font-semibold text-[#EAECEF]">{asset.name}</h3>
                <p className="text-xs text-[#848E9C]">{asset.symbol}</p>
              </div>
            </div>
            {asset.change && (
              <Badge className={asset.change.startsWith('+') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                {asset.change}
              </Badge>
            )}
          </div>
          
          <div className="flex justify-between items-end mt-2">
            <div>
              <div className="text-sm text-[#848E9C]">Available</div>
              <div className="font-bold text-[#EAECEF]">
                {hideBalances ? '••••••' : formatCrypto(asset.balance, asset.symbol)}
              </div>
              {asset.locked > 0 && (
                <div className="text-xs text-[#848E9C] mt-1">
                  Locked: {hideBalances ? '••••••' : formatCrypto(asset.locked, asset.symbol)}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-[#848E9C]">Value</div>
              <div className="font-semibold text-[#EAECEF]">
                {hideBalances ? '••••••' : `$${asset.value.toFixed(2)}`}
              </div>
            </div>
          </div>
          
          {showActions && asset.balance > 0 && (
            <div className="flex gap-2 mt-4 pt-3 border-t border-[#2B3139]">
              <Button size="sm" variant="ghost" className="flex-1 text-xs h-8">
                <ArrowDownLeft size={14} className="mr-1" />
                Deposit
              </Button>
              <Button size="sm" variant="ghost" className="flex-1 text-xs h-8">
                <ArrowUpRight size={14} className="mr-1" />
                Withdraw
              </Button>
              <Button size="sm" variant="ghost" className="flex-1 text-xs h-8">
                <RefreshCw size={14} className="mr-1" />
                Swap
              </Button>
            </div>
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
      case 'Completed': return 'bg-green-500/20 text-green-400';
      case 'Pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'Processing': return 'bg-blue-500/20 text-blue-400';
      case 'Failed': return 'bg-red-500/20 text-red-400';
      case 'Cancelled': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Deposit': return 'bg-green-500/20 text-green-400';
      case 'Withdrawal': return 'bg-red-500/20 text-red-400';
      case 'Swap': return 'bg-blue-500/20 text-blue-400';
      case 'Trade': return 'bg-purple-500/20 text-purple-400';
      case 'Options': return 'bg-orange-500/20 text-orange-400';
      case 'Staking': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between py-3 border-b border-[#2B3139] last:border-0"
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getTypeColor(transaction.type)}`}>
          <Icon size={14} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#EAECEF]">{transaction.type}</span>
            {transaction.metadata?.shouldWin && (
              <Badge className="bg-emerald-500/20 text-emerald-400 text-[8px] px-1 py-0">
                <Crown className="w-2 h-2 mr-0.5" />
                FW
              </Badge>
            )}
          </div>
          <div className="text-xs text-[#848E9C]">{transaction.asset}</div>
          {transaction.metadata?.txHash && (
            <button
              className="text-xs text-[#5E6673] hover:text-[#F0B90B] flex items-center gap-1 mt-1"
              onClick={() => {
                navigator.clipboard.writeText(transaction.metadata!.txHash!);
                toast({
                  title: 'Copied',
                  description: 'Transaction hash copied to clipboard',
                });
              }}
            >
              <span className="font-mono">{formatAddress(transaction.metadata.txHash, 4)}</span>
              <Copy className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {hideBalances ? '••••••' : (
            <>{isPositive ? '+' : '-'}{Math.abs(transaction.amount).toFixed(6)} {transaction.asset}</>
          )}
        </div>
        {transaction.pnl !== undefined && transaction.pnl !== 0 && (
          <div className={`text-xs ${transaction.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {hideBalances ? '••••••' : (
              <>{transaction.pnl >= 0 ? '+' : ''}{transaction.pnl.toFixed(2)} USDT</>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 justify-end mt-1">
          <span className="text-xs text-[#848E9C]">
            {new Date(transaction.date).toLocaleDateString()}
          </span>
          <Badge className={`text-[10px] ${getStatusColor(transaction.status)}`}>
            {transaction.status}
          </Badge>
        </div>
      </div>
    </motion.div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function WalletPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  
  // Use both wallet contexts
  const { 
    balances: fundingBalances,
    portfolio, 
    transactions, 
    addTransaction, 
    updatePortfolio, 
    totalValue,
    refreshBalance,
    loading: walletLoading,
    addBalance,
    removeBalance,
    lockBalance,
    unlockBalance,
    getBalance
  } = useWallet();
  
  const {
    getBalance: getUnifiedBalance,
    getFundingBalance,
    getTradingBalance,
    getLockedBalance,
    getTotalBalance,
    getDepositAddress,
    stats,
    locks,
    refreshData: refreshUnifiedData,
    transferToTrading,
    transferToFunding,
    tradingBalances
  } = useUnifiedWallet();
  
  const {
    userOutcome,
    activeWindows,
    systemSettings,
    shouldWin,
    loading: controlsLoading
  } = useTradingControl();
  
  const { theme, currency, setCurrency } = useUserSettings();
  const { prices } = useMarketData();

  // State management
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

  // Modal state
  const [modalState, setModalState] = useState<ModalState>({
    isSubmitting: false,
    error: '',
    depositNetwork: 'ERC20',
    depositAmount: '',
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

  // Reset modal state
  const resetModalState = useCallback(() => {
    setModalState({
      isSubmitting: false,
      error: '',
      depositNetwork: 'ERC20',
      depositAmount: '',
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

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    
    // Refresh from both contexts
    await Promise.all([
      refreshBalance(),
      refreshUnifiedData()
    ]);
    
    setRefreshing(false);
    toast({
      title: "Balance Updated",
      description: "Your wallet balances have been refreshed",
    });
  }, [refreshBalance, refreshUnifiedData, toast]);

  // Transfer handlers
  const handleTransferToTrading = async (asset: string, amount: number) => {
    try {
      const result = await transferToTrading(asset, amount);
      if (result.success) {
        toast.success(`Successfully transferred ${formatCurrency(amount)} ${asset} to trading wallet`);
        await handleRefresh();
      } else {
        toast.error(result.error || 'Transfer failed');
      }
    } catch (error) {
      toast.error('Transfer failed');
    }
  };

  const handleTransferToFunding = async (asset: string, amount: number) => {
    try {
      const result = await transferToFunding(asset, amount);
      if (result.success) {
        toast.success(`Successfully transferred ${formatCurrency(amount)} ${asset} to funding wallet`);
        await handleRefresh();
      } else {
        toast.error(result.error || 'Transfer failed');
      }
    } catch (error) {
      toast.error('Transfer failed');
    }
  };

  // Optimized click handlers
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

  const handleSwapClick = useCallback(() => {
    setModal('swap');
  }, []);

  const handleSendClick = useCallback(() => {
    if (!selectedAsset) {
      setSelectedAsset(portfolio[0] || { symbol: 'USDT', name: 'Tether', balance: 0, locked: 0, value: 0 });
    }
    setModal('send');
  }, [selectedAsset, portfolio]);

  const handleTransferClick = useCallback(() => {
    setShowTransferModal(true);
  }, []);

  // Handle deposit request submission
  const handleDepositRequest = async () => {
    if (!selectedAsset) return;

    const amount = parseFloat(modalState.depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setModalState(s => ({ ...s, error: 'Please enter a valid amount' }));
      return;
    }

    const network = NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.depositNetwork);
    if (!network) {
      setModalState(s => ({ ...s, error: 'Please select a network' }));
      return;
    }

    if (amount < network.minDeposit) {
      setModalState(s => ({ ...s, error: `Minimum deposit is ${network.minDeposit} ${selectedAsset.symbol}` }));
      return;
    }

    if (!modalState.depositProof) {
      setModalState(s => ({ ...s, error: 'Please upload payment proof' }));
      return;
    }

    try {
      setModalState(s => ({ ...s, isSubmitting: true, error: '' }));

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('amount', modalState.depositAmount);
      formData.append('currency', selectedAsset.symbol);
      formData.append('network', modalState.depositNetwork);
      formData.append('address', network.address);
      formData.append('proof', modalState.depositProof);
      formData.append('userId', user?.id || '');
      formData.append('userEmail', user?.email || '');
      formData.append('userName', `${user?.first_name || ''} ${user?.last_name || ''}`.trim());

      // Submit deposit request
      const response = await fetch('/api/wallet/deposit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit deposit request');
      }

      const result = await response.json();

      // Add transaction record
      addTransaction({
        id: result.id || Date.now().toString(),
        type: 'Deposit',
        asset: selectedAsset.symbol,
        amount,
        status: 'Pending',
        date: new Date().toISOString(),
        details: { 
          network: modalState.depositNetwork,
          address: network.address,
          requestId: result.id 
        },
        metadata: {
          network: modalState.depositNetwork,
          address: network.address
        }
      });

      toast({
        title: "Deposit Request Submitted",
        description: `Your deposit request for ${amount} ${selectedAsset.symbol} has been submitted for review.`,
      });

      // Reset and close modal
      setModal(null);
      resetModalState();

    } catch (error) {
      console.error('Deposit request error:', error);
      setModalState(s => ({ ...s, error: error instanceof Error ? error.message : 'Failed to submit deposit request' }));
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

    const network = NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.withdrawNetwork);
    if (!network) {
      setModalState(s => ({ ...s, error: 'Please select a network' }));
      return;
    }

    if (amount < network.minWithdrawal) {
      setModalState(s => ({ ...s, error: `Minimum withdrawal is ${network.minWithdrawal} ${selectedAsset.symbol}` }));
      return;
    }

    if (amount > selectedAsset.balance) {
      setModalState(s => ({ ...s, error: 'Insufficient balance' }));
      return;
    }

    if (!modalState.withdrawAddress || modalState.withdrawAddress.length < 10) {
      setModalState(s => ({ ...s, error: 'Invalid withdrawal address' }));
      return;
    }

    // Validate address format based on network
    if (network.requiresMemo && !modalState.withdrawMemo) {
      setModalState(s => ({ ...s, error: 'Destination tag/memo is required for this network' }));
      return;
    }

    try {
      setModalState(s => ({ ...s, isSubmitting: true, error: '' }));

      // Lock the withdrawal amount
      await lockBalance(selectedAsset.symbol, amount, `withdrawal_${Date.now()}`);

      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          currency: selectedAsset.symbol,
          amount,
          address: modalState.withdrawAddress,
          memo: modalState.withdrawMemo,
          network: modalState.withdrawNetwork,
        }),
      });

      if (!response.ok) {
        // Unlock if failed
        await unlockBalance(selectedAsset.symbol, amount, `withdrawal_${Date.now()}`);
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit withdrawal request');
      }

      const result = await response.json();

      // Add transaction record
      addTransaction({
        id: result.id || Date.now().toString(),
        type: 'Withdrawal',
        asset: selectedAsset.symbol,
        amount: -amount,
        status: 'Pending',
        date: new Date().toISOString(),
        details: { 
          address: modalState.withdrawAddress,
          network: modalState.withdrawNetwork,
          requestId: result.id 
        },
        metadata: {
          network: modalState.withdrawNetwork,
          address: modalState.withdrawAddress,
          txHash: result.txHash
        }
      });

      // Refresh balance to show pending withdrawal
      await handleRefresh();

      toast({
        title: "Withdrawal Request Submitted",
        description: `Your withdrawal request for ${amount} ${selectedAsset.symbol} has been submitted for processing.`,
      });

      setModal(null);
      resetModalState();

    } catch (error) {
      console.error('Withdrawal error:', error);
      setModalState(s => ({ ...s, error: error instanceof Error ? error.message : 'Withdrawal failed' }));
    } finally {
      setModalState(s => ({ ...s, isSubmitting: false }));
    }
  };

  // Handle swap
  const handleSwap = async () => {
    const fromSymbol = modalState.swapFromSymbol || selectedAsset?.symbol || portfolio[0]?.symbol;
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

      // Lock the swap amount
      await lockBalance(fromSymbol, amount, `swap_${Date.now()}`);

      const response = await fetch('/api/wallet/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          fromCurrency: fromSymbol,
          toCurrency: toSymbol,
          amount,
          slippage: modalState.swapSlippage,
          shouldWin: shouldWinSwap,
        }),
      });

      if (!response.ok) {
        // Unlock if failed
        await unlockBalance(fromSymbol, amount, `swap_${Date.now()}`);
        const error = await response.json();
        throw new Error(error.message || 'Swap failed');
      }

      const result = await response.json();

      // Add transaction record
      addTransaction({
        id: result.id || Date.now().toString(),
        type: 'Swap',
        asset: `${fromSymbol}/${toSymbol}`,
        amount: -amount,
        status: 'Completed',
        date: new Date().toISOString(),
        details: { 
          fromSymbol, 
          toSymbol, 
          rate: result.rate, 
          receivedAmount: result.receivedAmount 
        },
        metadata: {
          shouldWin: shouldWinSwap,
          outcome: shouldWinSwap ? 'win' : 'loss'
        }
      });

      // Refresh balance
      await handleRefresh();

      toast({
        title: shouldWinSwap ? "Swap Successful (Win Forced)" : "Swap Successful",
        description: `Swapped ${amount} ${fromSymbol} to ${result.receivedAmount.toFixed(6)} ${toSymbol}`,
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

    if (network.requiresMemo && !modalState.sendMemo) {
      setModalState(s => ({ ...s, error: 'Destination tag/memo is required for this network' }));
      return;
    }

    try {
      setModalState(s => ({ ...s, isSubmitting: true, error: '' }));

      // Lock the send amount
      await lockBalance(selectedAsset.symbol, amount, `send_${Date.now()}`);

      const response = await fetch('/api/wallet/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          currency: selectedAsset.symbol,
          amount,
          toAddress: modalState.sendAddress,
          memo: modalState.sendMemo,
          network: modalState.sendNetwork,
        }),
      });

      if (!response.ok) {
        // Unlock if failed
        await unlockBalance(selectedAsset.symbol, amount, `send_${Date.now()}`);
        const error = await response.json();
        throw new Error(error.message || 'Failed to send funds');
      }

      const result = await response.json();

      // Add transaction record
      addTransaction({
        id: result.id || Date.now().toString(),
        type: 'Withdrawal',
        asset: selectedAsset.symbol,
        amount: -amount,
        status: 'Completed',
        date: new Date().toISOString(),
        details: { 
          toAddress: modalState.sendAddress,
          network: modalState.sendNetwork,
          txHash: result.txHash 
        },
        metadata: {
          network: modalState.sendNetwork,
          address: modalState.sendAddress,
          txHash: result.txHash
        }
      });

      // Refresh balance
      await handleRefresh();

      toast({
        title: "Transfer Successful",
        description: `Sent ${amount} ${selectedAsset.symbol} to ${formatAddress(modalState.sendAddress)}`,
      });

      setModal(null);
      resetModalState();

    } catch (error) {
      console.error('Send error:', error);
      setModalState(s => ({ ...s, error: error instanceof Error ? error.message : 'Transfer failed' }));
    } finally {
      setModalState(s => ({ ...s, isSubmitting: false }));
    }
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
    if (!portfolio.find(a => a.symbol === addAssetSymbol)) {
      const asset = CRYPTO_ASSETS.find(a => a.symbol === addAssetSymbol);
      updatePortfolio([
        ...portfolio,
        { 
          symbol: addAssetSymbol, 
          name: asset?.name || addAssetSymbol, 
          balance: 0,
          locked: 0,
          value: 0,
          change: '0%'
        },
      ]);
      
      toast({
        title: 'Asset Added',
        description: `${addAssetSymbol} has been added to your wallet`,
      });
    }
    setAddAssetModal(false);
  }, [portfolio, addAssetSymbol, updatePortfolio, toast]);

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

  // Calculate total balance in selected currency
  const displayBalance = currency === 'BTC' && prices?.BTC 
    ? (getUnifiedBalance('USDT') + getLockedBalance('USDT')) / prices.BTC 
    : getUnifiedBalance('USDT') + getLockedBalance('USDT');

  // Navigation items
  const navItems = [
    { key: 'home', label: 'Home', icon: <Home size={20} />, path: '' },
    { key: 'trading', label: 'Trade', icon: <BarChart2 size={20} />, path: 'trading' },
    { key: 'wallet', label: 'Wallet', icon: <Wallet size={20} />, path: 'wallet' },
    { key: 'portfolio', label: 'Portfolio', icon: <Briefcase size={20} />, path: 'portfolio' },
    { key: 'account', label: 'Account', icon: <UserCircle size={20} />, path: 'account' },
  ];

  return (
    <div className="min-h-screen bg-[#181A20] pb-24">
      {/* Mobile Header */}
      <div className="sticky top-0 z-30 bg-[#181A20]/95 backdrop-blur border-b border-[#2B3139]">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#F0B90B] to-yellow-500 rounded-lg flex items-center justify-center">
              <Wallet size={18} className="text-[#181A20]" />
            </div>
            <h1 className="text-lg font-bold text-[#EAECEF]">Wallet</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              className="p-2 hover:bg-[#23262F] rounded-lg transition-colors"
              onClick={() => setHideBalances(!hideBalances)}
            >
              {hideBalances ? <Eye size={20} className="text-[#EAECEF]" /> : <EyeOff size={20} className="text-[#EAECEF]" />}
            </button>
            <button 
              className="p-2 hover:bg-[#23262F] rounded-lg transition-colors"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={20} className={`text-[#EAECEF] ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button 
              className="relative p-2 hover:bg-[#23262F] rounded-lg transition-colors"
              onClick={() => setShowRecordsModal(true)}
            >
              <History size={20} className="text-[#EAECEF]" />
            </button>
            <button 
              className="relative p-2 hover:bg-[#23262F] rounded-lg transition-colors"
              onClick={() => setNotifOpen(!notifOpen)}
              data-dropdown
            >
              <Bell size={20} className="text-[#EAECEF]" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#F0B90B] rounded-full animate-pulse"></span>
            </button>
            <button 
              className="w-8 h-8 bg-[#F0B90B] rounded-lg flex items-center justify-center hover:bg-yellow-400 transition-colors"
              onClick={() => setProfileOpen(!profileOpen)}
              data-dropdown
            >
              <span className="text-sm font-bold text-[#181A20]">
                {user?.first_name?.[0] || user?.email?.[0] || 'U'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Dropdown */}
      {notifOpen && (
        <div className="absolute top-16 right-20 w-80 bg-[#1E2329] border border-[#2B3139] rounded-xl shadow-xl z-50" data-dropdown>
          <div className="p-4 border-b border-[#2B3139]">
            <h3 className="font-semibold text-[#EAECEF]">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-3 p-3 bg-[#23262F] rounded-lg">
                <div className="w-2 h-2 bg-[#F0B90B] rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-[#EAECEF] font-medium">Welcome to Kryvex</p>
                  <p className="text-xs text-[#848E9C] mt-1">Start your trading journey today</p>
                  <p className="text-xs text-[#5E6673] mt-2">Just now</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-3 border-t border-[#2B3139]">
            <button className="text-xs text-[#F0B90B] hover:text-yellow-400 transition-colors">
              Mark all as read
            </button>
          </div>
        </div>
      )}

      {/* Profile Dropdown */}
      {profileOpen && (
        <div className="absolute top-16 right-4 w-64 bg-[#1E2329] border border-[#2B3139] rounded-xl shadow-xl z-50" data-dropdown>
          <div className="p-4 border-b border-[#2B3139]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F0B90B] rounded-full flex items-center justify-center">
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
                {userOutcome?.enabled && userOutcome.outcome_type === 'win' && (
                  <Badge className="mt-1 bg-emerald-500/20 text-emerald-400 text-[10px]">
                    <Crown className="w-2 h-2 mr-1" />
                    Force Win
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="py-2">
            <button 
              className="w-full px-4 py-2 text-left text-sm text-[#EAECEF] hover:bg-[#23262F] transition-colors flex items-center gap-3"
              onClick={() => {
                navigate('/account');
                setProfileOpen(false);
              }}
            >
              <User size={16} className="text-[#848E9C]" />
              Profile Settings
            </button>
            <button 
              className="w-full px-4 py-2 text-left text-sm text-[#EAECEF] hover:bg-[#23262F] transition-colors flex items-center gap-3"
              onClick={() => {
                navigate('/security');
                setProfileOpen(false);
              }}
            >
              <Shield size={16} className="text-[#848E9C]" />
              Security
            </button>
            <button 
              className="w-full px-4 py-2 text-left text-sm text-[#EAECEF] hover:bg-[#23262F] transition-colors flex items-center gap-3"
              onClick={() => {
                logout();
                setProfileOpen(false);
              }}
            >
              <LogOut size={16} className="text-[#848E9C]" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 py-4 space-y-4">
        {/* Total Balance Card */}
        <Card className="bg-gradient-to-br from-[#1E2329] to-[#2B3139] border-0 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#848E9C]">Total Balance</span>
            <div className="flex items-center gap-2">
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-24 h-8 bg-[#181A20] border-[#2B3139] text-xs">
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
                  className="h-8 w-8"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                >
                  <DownloadIcon size={16} className="text-[#848E9C]" />
                </Button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-32 bg-[#1E2329] border border-[#2B3139] rounded-lg shadow-xl z-10">
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-[#EAECEF] hover:bg-[#23262F] transition-colors"
                      onClick={() => handleExport('csv')}
                    >
                      CSV
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-[#EAECEF] hover:bg-[#23262F] transition-colors"
                      onClick={() => handleExport('json')}
                    >
                      JSON
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-[#EAECEF] mb-1">
                {walletLoading ? (
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-32" />
                  </div>
                ) : hideBalances ? (
                  '••••••••'
                ) : currency === 'BTC' ? 
                  `${displayBalance.toFixed(6)} BTC` : 
                  formatCurrency(displayBalance, currency)
                }
              </div>
              <div className="text-xs text-[#848E9C]">
                {walletLoading ? <Skeleton className="h-4 w-24" /> : hideBalances ? '••••••' : `≈ ${formatCurrency(getUnifiedBalance('USDT') + getLockedBalance('USDT'))} USD`}
              </div>
              <div className="flex flex-col text-xs text-[#848E9C] mt-1">
                <span>Funding: {hideBalances ? '••••••' : formatCurrency(getFundingBalance('USDT'))} USDT</span>
                <span>Trading: {hideBalances ? '••••••' : formatCurrency(getTradingBalance('USDT'))} USDT</span>
                {getLockedBalance('USDT') > 0 && (
                  <span className="text-[#F0B90B]">Locked: {hideBalances ? '••••••' : formatCurrency(getLockedBalance('USDT'))} USDT</span>
                )}
              </div>
            </div>
            <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
              <TrendingUp size={12} className="mr-1" />
              0%
            </Badge>
          </div>
        </Card>

        {/* Quick Actions - Now 5 buttons */}
        <div className="grid grid-cols-5 gap-2">
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
          />
        </div>

        {/* Wallet Transfer Modal */}
        {showTransferModal && (
          <WalletTransfer onClose={() => setShowTransferModal(false)} />
        )}

        {/* Asset Tabs */}
        <div className="mt-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full bg-[#1E2329] p-1 rounded-xl">
              <TabsTrigger 
                value="crypto" 
                className="text-xs md:text-sm data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg"
              >
                Crypto ({portfolio.length})
              </TabsTrigger>
              <TabsTrigger 
                value="usstock" 
                className="text-xs md:text-sm data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg"
              >
                Stocks
              </TabsTrigger>
              <TabsTrigger 
                value="futures" 
                className="text-xs md:text-sm data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg"
              >
                Futures
              </TabsTrigger>
              <TabsTrigger 
                value="etf" 
                className="text-xs md:text-sm data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg"
              >
                ETFs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="crypto" className="mt-4">
              <div className="space-y-3">
                {/* Show active trades if any */}
                {stats.activeLocks > 0 && (
                  <Card className="bg-gradient-to-br from-[#1E2329] to-[#2B3139] border-[#3A3F4A] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#F0B90B]" />
                        <h3 className="font-medium text-[#EAECEF]">Active Trades ({stats.activeLocks})</h3>
                      </div>
                      <Badge className="bg-[#F0B90B]/20 text-[#F0B90B] border-[#F0B90B]/30">
                        {formatCurrency(getLockedBalance('USDT'))} Locked
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {locks.slice(0, 3).map(lock => (
                        <div key={lock.id} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#F0B90B] rounded-full"></div>
                            <span className="text-[#848E9C]">{lock.lockType}</span>
                          </div>
                          <span className="text-[#F0B90B] font-mono">{lock.amount} {lock.asset}</span>
                        </div>
                      ))}
                      {locks.length > 3 && (
                        <div className="text-xs text-[#848E9C] text-center pt-1">
                          +{locks.length - 3} more active trades
                        </div>
                      )}
                    </div>
                  </Card>
                )}
                
                {portfolio.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12 bg-[#1E2329] rounded-xl border border-[#2B3139]"
                  >
                    <div className="text-4xl mb-3">💰</div>
                    <div className="text-[#EAECEF] font-medium mb-2">No assets yet</div>
                    <div className="text-sm text-[#848E9C] mb-4">Add your first cryptocurrency to start trading</div>
                    <Button 
                      className="bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold"
                      onClick={() => setAddAssetModal(true)}
                    >
                      <Plus size={16} className="mr-2" />
                      Add Asset
                    </Button>
                  </motion.div>
                ) : (
                  <AnimatePresence>
                    {portfolio.map(asset => (
                      <AssetCard 
                        key={asset.symbol} 
                        asset={asset} 
                        loading={walletLoading}
                        hideBalances={hideBalances}
                        onClick={() => {
                          setSelectedAsset(asset);
                          setModal('assetDetail');
                        }}
                        showActions={asset.balance > 0}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </TabsContent>

            <TabsContent value="usstock" className="mt-4">
              <div className="space-y-3">
                {USSTOCKS.map(asset => (
                  <AssetCard key={asset.symbol} asset={asset} loading={walletLoading} hideBalances={hideBalances} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="futures" className="mt-4">
              <div className="space-y-3">
                {FUTURES.map(asset => (
                  <AssetCard key={asset.symbol} asset={asset} loading={walletLoading} hideBalances={hideBalances} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="etf" className="mt-4">
              <div className="space-y-3">
                {ETFS.map(asset => (
                  <AssetCard key={asset.symbol} asset={asset} loading={walletLoading} hideBalances={hideBalances} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Recent Transactions */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#EAECEF]">Recent Transactions</h3>
            <button 
              className="text-xs text-[#F0B90B] flex items-center gap-1 hover:text-yellow-400 transition-colors"
              onClick={() => setShowRecordsModal(true)}
            >
              View All
              <ChevronRight size={14} />
            </button>
          </div>
          
          <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📋</div>
                <div className="text-[#848E9C] text-sm">No transactions yet</div>
                <div className="text-xs text-[#5E6673] mt-2">Make your first deposit to get started</div>
              </div>
            ) : (
              <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                {transactions.slice(0, 5).map(tx => (
                  <TransactionItem key={tx.id} transaction={tx} hideBalances={hideBalances} />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Active Windows Banner */}
        {activeWindows.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <p className="text-sm text-amber-400">
                Active trading windows: {activeWindows.map(w => w.outcome_type.toUpperCase()).join(', ')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add Asset Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-24 right-4 z-40 bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] rounded-full shadow-lg w-14 h-14 flex items-center justify-center transition-all shadow-[#F0B90B]/20"
        onClick={() => setAddAssetModal(true)}
      >
        <Plus size={24} />
      </motion.button>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-[#1E2329] border-t border-[#2B3139] px-2 py-2 z-50">
        <div className="flex justify-around items-center">
          {navItems.map(item => {
            const isActive = location.pathname === `/${item.path}` || 
              (item.path === '' && location.pathname === '/');
            return (
              <motion.button
                key={item.key}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  flex flex-col items-center px-3 py-1.5 rounded-xl transition-colors
                  ${isActive ? 'text-[#F0B90B]' : 'text-[#848E9C] hover:text-[#EAECEF]'}
                `}
                onClick={() => navigate(item.path ? `/${item.path}` : '/')}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* Add Asset Modal */}
      <Modal open={addAssetModal} onClose={() => setAddAssetModal(false)} title="Add Asset">
        <form onSubmit={(e) => { e.preventDefault(); handleAddAsset(); }} className="space-y-4">
          <div>
            <Label className="text-sm text-[#848E9C] mb-2 block">Select Asset</Label>
            <Select value={addAssetSymbol} onValueChange={setAddAssetSymbol}>
              <SelectTrigger className="w-full bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12">
                <SelectValue placeholder="Select Asset" />
              </SelectTrigger>
              <SelectContent>
                {CRYPTO_ASSETS.map(a => (
                  <SelectItem key={a.symbol} value={a.symbol}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getAssetIcon(a.symbol)}</span>
                      <span>{a.name} ({a.symbol})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            type="submit" 
            className="w-full bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold h-12"
          >
            Add to Wallet
          </Button>
        </form>
      </Modal>

      {/* Asset Detail Modal */}
      {modal === 'assetDetail' && selectedAsset && (
        <Modal open={true} onClose={() => setModal(null)} title={selectedAsset.name}>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-[#23262F] rounded-xl">
              <div className="w-16 h-16 rounded-full bg-[#2B3139] flex items-center justify-center text-3xl">
                {getAssetIcon(selectedAsset.symbol)}
              </div>
              <div>
                <div className="text-xl font-bold text-[#EAECEF]">{selectedAsset.name}</div>
                <div className="text-sm text-[#848E9C]">{selectedAsset.symbol}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#23262F] rounded-xl p-4">
                <div className="text-xs text-[#848E9C] mb-1">Funding Available</div>
                <div className="text-lg font-bold text-[#EAECEF]">
                  {hideBalances ? '••••••' : formatCrypto(selectedAsset.balance, selectedAsset.symbol)}
                </div>
              </div>
              <div className="bg-[#23262F] rounded-xl p-4">
                <div className="text-xs text-[#848E9C] mb-1">Trading Available</div>
                <div className="text-lg font-bold text-[#F0B90B]">
                  {hideBalances ? '••••••' : formatCrypto(getTradingBalance(selectedAsset.symbol), selectedAsset.symbol)}
                </div>
              </div>
              <div className="bg-[#23262F] rounded-xl p-4">
                <div className="text-xs text-[#848E9C] mb-1">Locked</div>
                <div className="text-lg font-bold text-[#EAECEF]">
                  {hideBalances ? '••••••' : formatCrypto(selectedAsset.locked, selectedAsset.symbol)}
                </div>
              </div>
              <div className="bg-[#23262F] rounded-xl p-4">
                <div className="text-xs text-[#848E9C] mb-1">Total Value</div>
                <div className="text-lg font-bold text-[#EAECEF]">
                  {hideBalances ? '••••••' : `$${selectedAsset.value.toFixed(2)}`}
                </div>
              </div>
            </div>

            {/* Network Info */}
            {NETWORKS[selectedAsset.symbol] && (
              <div className="bg-[#23262F] rounded-xl p-4">
                <div className="text-xs text-[#848E9C] mb-2">Available Networks</div>
                <div className="space-y-2">
                  {NETWORKS[selectedAsset.symbol].map(network => (
                    <div key={network.name} className="flex items-center justify-between text-sm">
                      <span className="text-[#EAECEF]">{network.name}</span>
                      <span className="text-[#848E9C]">Min: {network.minDeposit} {selectedAsset.symbol}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 mt-2">
              <Button 
                className="bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold"
                onClick={() => {
                  setModal('deposit');
                }}
              >
                <ArrowDownLeft size={16} className="mr-2" />
                Deposit
              </Button>
              <Button 
                className="bg-[#2B3139] hover:bg-[#3A3F4A] text-[#EAECEF] font-bold"
                onClick={() => {
                  setModal('withdraw');
                }}
                disabled={selectedAsset.balance <= 0}
              >
                <ArrowUpRight size={16} className="mr-2" />
                Withdraw
              </Button>
              <Button 
                className="bg-[#2B3139] hover:bg-[#3A3F4A] text-[#EAECEF] font-bold"
                onClick={() => {
                  setModal('swap');
                }}
              >
                <RefreshCw size={16} className="mr-2" />
                Swap
              </Button>
            </div>
            
            <Button
              className="w-full bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold mt-2"
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

      {/* Deposit Modal */}
      {modal === 'deposit' && selectedAsset && (
        <Modal open={true} onClose={() => { setModal('assetDetail'); resetModalState(); }} title={`Deposit ${selectedAsset.symbol}`}>
          <div className="space-y-4">
            {/* QR Code Toggle */}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-[#848E9C] hover:text-[#EAECEF]"
                onClick={() => setModalState(s => ({ ...s, showQR: !s.showQR }))}
              >
                <QrCode size={16} className="mr-2" />
                {modalState.showQR ? 'Hide QR' : 'Show QR'}
              </Button>
            </div>

            {/* QR Code */}
            {modalState.showQR && (
              <div className="flex items-center justify-center mb-4">
                <div className="bg-[#23262F] p-4 rounded-xl">
                  <QRCodeCanvas 
                    value={NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.depositNetwork)?.address || ''} 
                    size={200} 
                    bgColor="#23262F" 
                    fgColor="#EAECEF" 
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>
            )}
            
            {/* Network Selection */}
            {NETWORKS[selectedAsset.symbol] && (
              <div>
                <Label className="block text-sm text-[#848E9C] mb-2">Network</Label>
                <select
                  className="w-full bg-[#23262F] rounded-lg px-4 py-3 text-[#EAECEF] border border-[#2B3139] focus:border-[#F0B90B] transition-colors"
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
              <Label className="block text-sm text-[#848E9C] mb-2">Deposit Address</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-[#23262F] rounded-lg px-4 py-3 text-xs text-[#EAECEF] font-mono break-all">
                  {NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.depositNetwork)?.address || ''}
                </code>
                <Button
                  className="bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20]"
                  onClick={() => {
                    const address = NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.depositNetwork)?.address || '';
                    navigator.clipboard.writeText(address);
                    setModalState(s => ({ ...s, copied: 'address' }));
                    setTimeout(() => setModalState(s => ({ ...s, copied: '' })), 2000);
                    toast({
                      title: 'Copied!',
                      description: 'Address copied to clipboard',
                    });
                  }}
                >
                  {modalState.copied === 'address' ? <CheckCircle size={16} /> : <Copy size={16} />}
                </Button>
              </div>
            </div>

            {/* Memo/Tag if required */}
            {NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.depositNetwork)?.requiresMemo && (
              <div>
                <Label className="block text-sm text-[#848E9C] mb-2">Destination Tag / Memo</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-[#23262F] rounded-lg px-4 py-3 text-xs text-[#EAECEF] font-mono">
                    {NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.depositNetwork)?.memo || ''}
                  </code>
                  <Button
                    className="bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20]"
                    onClick={() => {
                      const memo = NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.depositNetwork)?.memo || '';
                      navigator.clipboard.writeText(memo);
                      toast({
                        title: 'Copied!',
                        description: 'Memo copied to clipboard',
                      });
                    }}
                  >
                    <Copy size={16} />
                  </Button>
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
                className="bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12"
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
                <div className="border-2 border-dashed border-[#2B3139] rounded-lg p-4">
                  <input
                    type="file"
                    id="deposit-proof"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                  <label
                    htmlFor="deposit-proof"
                    className="flex flex-col items-center justify-center cursor-pointer hover:bg-[#2B3139]/50 transition-colors rounded-lg p-4"
                  >
                    <Upload className="w-8 h-8 text-[#848E9C] mb-2" />
                    <span className="text-sm text-[#848E9C]">Click to upload payment proof</span>
                    <span className="text-xs text-[#848E9C]/60">JPG, PNG, GIF up to 5MB</span>
                  </label>
                </div>
                
                {modalState.depositProofUrl && (
                  <div className="relative">
                    <img 
                      src={modalState.depositProofUrl} 
                      alt="Payment proof" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 h-8 w-8"
                      onClick={() => setModalState(s => ({ ...s, depositProof: null, depositProofUrl: '' }))}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Warnings */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-yellow-400">
                    Send only {selectedAsset.symbol} via {modalState.depositNetwork} to this address.
                  </p>
                  <p className="text-xs text-yellow-400/80 mt-1">
                    Confirmation time: {NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.depositNetwork)?.confirmationTime}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#23262F] rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Info size={14} className="text-[#848E9C]" />
                <p className="text-xs text-[#848E9C]">
                  Deposit requests require admin approval. Funds will be added to your funding wallet once approved.
                </p>
              </div>
            </div>

            {modalState.error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-xs text-red-400">{modalState.error}</p>
              </div>
            )}

            <Button
              className="w-full bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold h-12"
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

      {/* Withdraw Modal */}
      {modal === 'withdraw' && selectedAsset && (
        <Modal open={true} onClose={() => { setModal('assetDetail'); resetModalState(); }} title={`Withdraw ${selectedAsset.symbol}`}>
          <div className="space-y-4">
            {/* Asset Info */}
            <div className="flex items-center gap-3 p-3 bg-[#23262F] rounded-lg">
              <div className="w-10 h-10 rounded-full bg-[#2B3139] flex items-center justify-center text-xl">
                {getAssetIcon(selectedAsset.symbol)}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-[#EAECEF]">{selectedAsset.symbol}</div>
                <div className="text-xs text-[#848E9C]">Funding Available: {hideBalances ? '••••••' : formatCrypto(selectedAsset.balance, selectedAsset.symbol)}</div>
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
                  className="w-full bg-[#23262F] rounded-lg px-4 py-3 text-[#EAECEF] border border-[#2B3139] focus:border-[#F0B90B] transition-colors"
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
                className="bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12"
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
                  className="bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12"
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
                  className="bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12 pr-20"
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
            <div className="bg-[#23262F] rounded-lg p-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#848E9C]">Network Fee</span>
                <span className="text-[#EAECEF]">
                  {hideBalances ? '••••••' : (
                    <>
                      {NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.withdrawNetwork)?.fee || 0} {selectedAsset.symbol}
                    </>
                  )}
                </span>
              </div>
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
            {modalState.error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-xs text-red-400">{modalState.error}</p>
              </div>
            )}

            <Button
              className="w-full bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold h-12"
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

      {/* Swap Modal */}
      {modal === 'swap' && (
        <Modal open={true} onClose={() => { setModal(selectedAsset ? 'assetDetail' : null); resetModalState(); }} title="Swap Assets">
          <div className="space-y-4">
            {/* From Section */}
            <div>
              <Label className="block text-sm text-[#848E9C] mb-2">From</Label>
              <div className="flex items-center gap-2">
                <select
                  className="flex-1 bg-[#23262F] rounded-lg px-4 py-3 text-[#EAECEF] border border-[#2B3139] focus:border-[#F0B90B] transition-colors"
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
                    const fromSymbol = s.swapFromSymbol || selectedAsset?.symbol || portfolio[0]?.symbol;
                    const toSymbol = s.swapToSymbol;
                    if (fromSymbol && toSymbol && amount) {
                      const rate = fromSymbol === 'USDT' && toSymbol === 'BTC' ? 0.000025 :
                                  fromSymbol === 'BTC' && toSymbol === 'USDT' ? 40000 : 1;
                      const estimated = parseFloat(amount) * rate;
                      setModalState(s => ({ ...s, swapEstimatedOutput: estimated.toFixed(toSymbol === 'USDT' ? 2 : 6) }));
                    }
                  }}
                  className="flex-1 bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12"
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
              <div className="w-10 h-10 rounded-full bg-[#23262F] flex items-center justify-center">
                <ArrowRight size={20} className="text-[#F0B90B]" />
              </div>
            </div>

            {/* To Section */}
            <div>
              <Label className="block text-sm text-[#848E9C] mb-2">To</Label>
              <select
                className="w-full bg-[#23262F] rounded-lg px-4 py-3 text-[#EAECEF] border border-[#2B3139] focus:border-[#F0B90B] transition-colors"
                value={modalState.swapToSymbol}
                onChange={e => {
                  setModalState(s => ({ ...s, swapToSymbol: e.target.value, error: '' }));
                  
                  // Recalculate estimated output
                  const fromSymbol = s.swapFromSymbol || selectedAsset?.symbol || portfolio[0]?.symbol;
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
              <div className="flex gap-2">
                {[0.1, 0.5, 1.0].map(slippage => (
                  <Button
                    key={slippage}
                    variant={modalState.swapSlippage === slippage ? 'default' : 'outline'}
                    size="sm"
                    className={`flex-1 ${
                      modalState.swapSlippage === slippage
                        ? 'bg-[#F0B90B] text-[#181A20]'
                        : 'border-[#2B3139] text-[#848E9C]'
                    }`}
                    onClick={() => setModalState(s => ({ ...s, swapSlippage: slippage }))}
                  >
                    {slippage}%
                  </Button>
                ))}
              </div>
            </div>

            {/* Estimated Output */}
            {modalState.swapFromSymbol && modalState.swapToSymbol && (
              <div className="bg-[#23262F] rounded-lg p-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#848E9C]">You'll receive</span>
                  <span className="font-semibold text-[#EAECEF]">
                    {hideBalances ? '••••••' : (
                      <>{modalState.swapEstimatedOutput || '0'} {modalState.swapToSymbol}</>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-[#848E9C]">
                  <span>Rate</span>
                  <span>
                    1 {modalState.swapFromSymbol} ≈ {
                      modalState.swapFromSymbol === 'USDT' && modalState.swapToSymbol === 'BTC' ? '0.000025' :
                      modalState.swapFromSymbol === 'BTC' && modalState.swapToSymbol === 'USDT' ? '40,000' : '1'
                    } {modalState.swapToSymbol}
                  </span>
                </div>
              </div>
            )}

            {/* Error Display */}
            {modalState.error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-xs text-red-400">{modalState.error}</p>
              </div>
            )}

            <Button
              className="w-full bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold h-12"
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

      {/* Send Modal */}
      {modal === 'send' && selectedAsset && (
        <Modal open={true} onClose={() => { setModal('assetDetail'); resetModalState(); }} title={`Send ${selectedAsset.symbol}`}>
          <div className="space-y-4">
            {/* Asset Info */}
            <div className="flex items-center gap-3 p-3 bg-[#23262F] rounded-lg">
              <div className="w-10 h-10 rounded-full bg-[#2B3139] flex items-center justify-center text-xl">
                {getAssetIcon(selectedAsset.symbol)}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-[#EAECEF]">{selectedAsset.symbol}</div>
                <div className="text-xs text-[#848E9C]">Funding Available: {hideBalances ? '••••••' : formatCrypto(selectedAsset.balance, selectedAsset.symbol)}</div>
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
                  className="w-full bg-[#23262F] rounded-lg px-4 py-3 text-[#EAECEF] border border-[#2B3139] focus:border-[#F0B90B] transition-colors"
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
                className="bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12"
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
                  className="bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12"
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
                  className="bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12 pr-20"
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
            <div className="bg-[#23262F] rounded-lg p-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#848E9C]">Network Fee</span>
                <span className="text-[#EAECEF]">
                  {hideBalances ? '••••••' : (
                    <>
                      {NETWORKS[selectedAsset.symbol]?.find(n => n.name === modalState.sendNetwork)?.fee || 0} {selectedAsset.symbol}
                    </>
                  )}
                </span>
              </div>
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
            {modalState.error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-xs text-red-400">{modalState.error}</p>
              </div>
            )}

            <Button
              className="w-full bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold h-12"
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

      {/* Records Modal */}
      <RecordsModal open={showRecordsModal} onClose={() => setShowRecordsModal(false)} />

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1E2329;
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
      `}</style>
    </div>
  );
}