import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Wallet, Send, Download, Plus, Bell, User, Home, BarChart2, 
  Briefcase, UserCircle, ArrowRight, Copy, QrCode, Clock, 
  TrendingUp, ArrowUpRight, ArrowDownLeft, RefreshCw, 
  MoreVertical, ChevronRight, Settings, History, X, CheckCircle,
  AlertTriangle, Info, Globe, Shield, Zap, Award, Star, CreditCard, LogOut
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useWallet } from '@/contexts/WalletContext';
import RecordsModal from '@/components/RecordsModal';
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

// ==================== TYPES ====================
interface Asset {
  symbol: string;
  name: string;
  balance: number;
  value: number;
  icon?: string;
  change?: string;
}

interface Transaction {
  id: string;
  type: 'Deposit' | 'Withdrawal' | 'Swap' | 'Trade';
  asset: string;
  amount: number;
  status: 'Pending' | 'Completed' | 'Failed';
  date: string;
  details?: any;
}

interface DepositAddress {
  label: string;
  value: string;
  note?: string;
}

interface ModalState {
  copied: string;
  withdrawAmount: string;
  withdrawAddress: string;
  withdrawError: string;
  depositNetwork: string;
  swapToSymbol: string;
  swapAmount: string;
  swapError: string;
  swapFromSymbol: string;
}

// ==================== CONSTANTS ====================
const depositAddresses: DepositAddress[] = [
  { label: 'BTC', value: '1FTUbAx5QNTWbxyeMPpxRbwqH3XnvwKQb', note: "Don't send NFTs to this address. Smart contract deposits are not supported with the exception of ETH via ERC20, BSC via BEP20, Arbitrum and Optimism networks." },
  { label: 'ETH', value: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' },
  { label: 'BNB', value: 'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2' },
  { label: 'XRP', value: 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh' },
  { label: 'ADA', value: 'addr1q9d5u0w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2w7k2' },
  { label: 'DOGE', value: 'D5d8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8' },
  { label: 'SOL', value: '72K1NJZfx4nNDKWNYwkDRMDzBxYfsmn8o2qTiDspfqkd' },
  { label: 'LTC', value: 'LZg8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8' },
  { label: 'DOT', value: '1dotdotdotdotdotdotdotdotdotdotdotdotdotdot' },
  { label: 'LINK', value: '0xlinklinklinklinklinklinklinklinklinklink' },
  { label: 'MATIC', value: '0xmaticmaticmaticmaticmaticmaticmaticmatic' },
  { label: 'TRC20', value: 'TYdFjAfhWL9DjaDBAe5LS7zUjBqpYGkRYB' },
  { label: 'BEP20', value: '0xd5fffaa3740af39c265563aec8c14bd08c05e838' },
  { label: 'ERC20', value: '0xd5fffaa3740af39c265563aec8c14bd08c05e838' },
  { label: 'Optimism', value: '0xd5fffaa3740af39c265563aec8c14bd08c05e838' },
  { label: 'BNB Smart Chain (BEP20)', value: '0xd5fffaa3740af39c265563aec8c14bd08c05e838' },
  { label: 'Arbitrum One', value: '0xd5fffaa3740af39c265563aec8c14bd08c05e838' },
  { label: 'Avalanche', value: 'X-avax18pps7dlperx5z49sfls524ctznjdyq0q8z5py0', note: 'This deposit address supports X-Chain deposits. For C-Chain deposits, please use the AVAXC network.' },
];

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
  { symbol: 'AVAX', name: 'Avalanche' },
  { symbol: 'DOT', name: 'Polkadot' },
  { symbol: 'MATIC', name: 'Polygon' },
  { symbol: 'TRX', name: 'TRON' },
  { symbol: 'LINK', name: 'Chainlink' },
  { symbol: 'FIL', name: 'Filecoin' },
  { symbol: 'XMR', name: 'Monero' },
  { symbol: 'ATOM', name: 'Cosmos' },
  { symbol: 'LTC', name: 'Litecoin' },
  { symbol: 'ARB', name: 'Arbitrum' },
];

const USSTOCKS: Asset[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', balance: 0, value: 0, change: '+1.2%' },
  { symbol: 'TSLA', name: 'Tesla Inc.', balance: 0, value: 0, change: '-0.5%' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', balance: 0, value: 0, change: '+0.8%' },
];

const FUTURES: Asset[] = [
  { symbol: 'BTCUSD-PERP', name: 'BTC Perpetual', balance: 0, value: 0, change: '+2.1%' },
  { symbol: 'ETHUSD-PERP', name: 'ETH Perpetual', balance: 0, value: 0, change: '-1.3%' },
];

const ETFS: Asset[] = [
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', balance: 0, value: 0, change: '+0.3%' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', balance: 0, value: 0, change: '+0.7%' },
];

// ==================== HELPER FUNCTIONS ====================
const getAssetIcon = (symbol: string): string => {
  return CRYPTO_ICONS[symbol] || '◉';
};

const formatCurrency = (value: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatCrypto = (value: number, symbol: string): string => {
  const decimals = symbol === 'USDT' ? 2 : 6;
  return `${value.toFixed(decimals)} ${symbol}`;
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
}

function QuickAction({ icon, label, onClick, color = 'default' }: QuickActionProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[#23262F] transition-colors group"
      onClick={onClick}
    >
      <div className={`
        w-12 h-12 rounded-full flex items-center justify-center
        ${color === 'primary' ? 'bg-[#F0B90B]/20 text-[#F0B90B] group-hover:bg-[#F0B90B]/30' : 
          'bg-[#2B3139] text-[#EAECEF] group-hover:bg-[#3A3F4A]'}
      `}>
        {icon}
      </div>
      <span className="text-xs font-medium text-[#EAECEF]">{label}</span>
    </motion.button>
  );
}

// ==================== ASSET CARD ====================
interface AssetCardProps {
  asset: Asset;
  onClick?: () => void;
  showActions?: boolean;
}

function AssetCard({ asset, onClick, showActions = false }: AssetCardProps) {
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
              <div className="text-sm text-[#848E9C]">Balance</div>
              <div className="font-bold text-[#EAECEF]">
                {formatCrypto(asset.balance, asset.symbol)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-[#848E9C]">Value</div>
              <div className="font-semibold text-[#EAECEF]">
                ${asset.value.toFixed(2)}
              </div>
            </div>
          </div>
          
          {showActions && (
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
}

function TransactionItem({ transaction }: TransactionItemProps) {
  const isPositive = transaction.amount > 0;
  const Icon = transaction.type === 'Deposit' ? ArrowDownLeft : 
               transaction.type === 'Withdrawal' ? ArrowUpRight : RefreshCw;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-500/20 text-green-400';
      case 'Pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'Failed': return 'bg-red-500/20 text-red-400';
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
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center
          ${transaction.type === 'Deposit' ? 'bg-green-500/20 text-green-400' : 
            transaction.type === 'Withdrawal' ? 'bg-red-500/20 text-red-400' : 
            'bg-[#F0B90B]/20 text-[#F0B90B]'}
        `}>
          <Icon size={14} />
        </div>
        <div>
          <div className="text-sm font-medium text-[#EAECEF]">{transaction.type}</div>
          <div className="text-xs text-[#848E9C]">{transaction.asset}</div>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '+' : '-'}{Math.abs(transaction.amount).toFixed(6)} {transaction.asset}
        </div>
        <div className="text-xs text-[#848E9C]">
          {new Date(transaction.date).toLocaleDateString()}
          <Badge className={`ml-2 ${getStatusColor(transaction.status)}`}>
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
  const { 
    balances,
    portfolio, 
    transactions, 
    addTransaction, 
    updatePortfolio, 
    totalValue,
    executeTransfer
  } = useWallet();
  const { theme, currency, setCurrency } = useUserSettings();
  const { prices } = useMarketData();

  // State management
  const [modal, setModal] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<string>('USDT');
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [notifOpen, setNotifOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [showRecordsModal, setShowRecordsModal] = useState<boolean>(false);
  const [addAssetModal, setAddAssetModal] = useState<boolean>(false);
  const [addAssetSymbol, setAddAssetSymbol] = useState<string>('USDT');

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
  const [activeTab, setActiveTab] = useState<string>('crypto');

  const [modalState, setModalState] = useState<ModalState>({
    copied: '',
    withdrawAmount: '',
    withdrawAddress: '',
    withdrawError: '',
    depositNetwork: depositAddresses[0]?.label || 'TRC20',
    swapToSymbol: '',
    swapAmount: '',
    swapError: '',
    swapFromSymbol: '',
  });

  // Reset modal state helper
  const resetModalState = () => setModalState({
    copied: '',
    withdrawAmount: '',
    withdrawAddress: '',
    withdrawError: '',
    depositNetwork: depositAddresses[0]?.label || 'TRC20',
    swapToSymbol: '',
    swapAmount: '',
    swapError: '',
    swapFromSymbol: '',
  });

  // Fetch prices
  const fetchPrices = useCallback(async () => {
    setLoading(true);
    try {
      const prices = await apiService.getCryptoPrices();
      const updatedPortfolio = portfolio.map(asset => {
        const priceObj = prices.find(p => p.symbol === asset.symbol);
        if (!priceObj) return asset;
        return {
          ...asset,
          value: asset.balance * priceObj.price,
        };
      });
      updatePortfolio(updatedPortfolio);
    } catch (e) {
      console.error('Failed to fetch prices:', e);
      toast({
        title: 'Error',
        description: 'Failed to fetch current prices',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [portfolio, updatePortfolio, toast]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // Handlers
  const handleBuy = (symbol: string, amount: number) => {
    if (amount <= 0) {
      toast({
        title: 'Error',
        description: 'Amount must be greater than 0',
        variant: 'destructive',
      });
      return;
    }

    addTransaction({
      id: Date.now().toString(),
      type: 'Deposit',
      asset: symbol,
      amount,
      status: 'Completed',
      date: new Date().toISOString(),
    });
    
    const updatedPortfolio = portfolio.map(a =>
      a.symbol === symbol
        ? { ...a, balance: a.balance + amount, value: (a.balance + amount) * (prices?.[symbol] || 1) }
        : a
    );
    updatePortfolio(updatedPortfolio);
    
    toast({
      title: 'Deposit Successful',
      description: `${amount} ${symbol} has been added to your wallet`,
    });
    
    setModal(null);
  };

  const handleSend = async (symbol: string, amount: number, address: string) => {
    if (amount <= 0) {
      setModalState(s => ({ ...s, withdrawError: 'Amount must be greater than 0' }));
      return;
    }

    const asset = portfolio.find(a => a.symbol === symbol);
    if (!asset || amount > asset.balance) {
      setModalState(s => ({ ...s, withdrawError: 'Insufficient balance' }));
      return;
    }

    if (!address || address.length < 10) {
      setModalState(s => ({ ...s, withdrawError: 'Invalid address' }));
      return;
    }

    try {
      await executeTransfer(symbol, amount, address, 'withdrawal');

      addTransaction({
        id: Date.now().toString(),
        type: 'Withdrawal',
        asset: symbol,
        amount: -amount,
        status: 'Pending',
        date: new Date().toISOString(),
        details: { address }
      });
      
      toast({
        title: 'Withdrawal Initiated',
        description: `${amount} ${symbol} withdrawal request submitted`,
      });
      
      setModal(null);
      resetModalState();
    } catch (error) {
      setModalState(s => ({ ...s, withdrawError: error instanceof Error ? error.message : 'Withdrawal failed' }));
    }
  };

  const handleSwap = () => {
    const fromSymbol = modalState.swapFromSymbol || portfolio[0]?.symbol;
    const toSymbol = modalState.swapToSymbol;
    const amount = parseFloat(modalState.swapAmount);

    if (!fromSymbol || !toSymbol) {
      setModalState(s => ({ ...s, swapError: 'Please select both currencies' }));
      return;
    }

    if (fromSymbol === toSymbol) {
      setModalState(s => ({ ...s, swapError: 'Cannot swap to the same currency' }));
      return;
    }

    const fromAsset = portfolio.find(a => a.symbol === fromSymbol);
    if (!fromAsset || amount > fromAsset.balance) {
      setModalState(s => ({ ...s, swapError: 'Insufficient balance' }));
      return;
    }

    // Mock conversion rate - in real app, fetch from API
    const rate = fromSymbol === 'USDT' && toSymbol === 'BTC' ? 0.000025 :
                 fromSymbol === 'BTC' && toSymbol === 'USDT' ? 40000 : 1;
    const receivedAmount = amount * rate;

    // Deduct from source
    const updatedFromPortfolio = portfolio.map(a =>
      a.symbol === fromSymbol
        ? { ...a, balance: a.balance - amount, value: (a.balance - amount) * (prices?.[fromSymbol] || 1) }
        : a
    );

    // Add to destination
    const updatedToPortfolio = updatedFromPortfolio.map(a =>
      a.symbol === toSymbol
        ? { ...a, balance: a.balance + receivedAmount, value: (a.balance + receivedAmount) * (prices?.[toSymbol] || 1) }
        : a
    );

    updatePortfolio(updatedToPortfolio);

    addTransaction({
      id: Date.now().toString(),
      type: 'Swap',
      asset: `${fromSymbol}/${toSymbol}`,
      amount: -amount,
      status: 'Completed',
      date: new Date().toISOString(),
      details: { fromSymbol, toSymbol, rate, receivedAmount }
    });

    toast({
      title: 'Swap Successful',
      description: `Swapped ${amount} ${fromSymbol} to ${receivedAmount.toFixed(6)} ${toSymbol}`,
    });

    setModal(null);
    resetModalState();
  };

  const handleAddAsset = () => {
    if (!portfolio.find(a => a.symbol === addAssetSymbol)) {
      const asset = CRYPTO_ASSETS.find(a => a.symbol === addAssetSymbol);
      updatePortfolio([
        ...portfolio,
        { 
          symbol: addAssetSymbol, 
          name: asset?.name || addAssetSymbol, 
          balance: 0, 
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
  };

  // Calculate total balance in selected currency
  let displayBalance = totalValue;
  if (currency === 'BTC' && prices?.['BTC']) {
    displayBalance = totalValue / prices['BTC'];
  }

  // Navigation items
  const navItems = [
    { key: 'home', label: 'Home', icon: <Home size={20} />, path: '' },
    { key: 'trading', label: 'Trade', icon: <BarChart2 size={20} />, path: 'trading' },
    { key: 'wallet', label: 'Wallet', icon: <Wallet size={20} />, path: 'wallet' },
    { key: 'portfolio', label: 'Portfolio', icon: <Briefcase size={20} />, path: 'portfolio' },
    { key: 'account', label: 'Account', icon: <UserCircle size={20} />, path: 'account' },
  ];

  // Portfolio stats
  const totalAssets = portfolio.length;
  const totalChange = 2.4; // Mock data - replace with real calculation

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
                  <p className="text-sm text-[#EAECEF] font-medium">New deposit received</p>
                  <p className="text-xs text-[#848E9C] mt-1">1,000 USDT has been added to your wallet</p>
                  <p className="text-xs text-[#5E6673] mt-2">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[#23262F] rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-[#EAECEF] font-medium">KYC verification completed</p>
                  <p className="text-xs text-[#848E9C] mt-1">Your account is now fully verified</p>
                  <p className="text-xs text-[#5E6673] mt-2">1 day ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[#23262F] rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-[#EAECEF] font-medium">Trading bonus credited</p>
                  <p className="text-xs text-[#848E9C] mt-1">$50 bonus has been added to your account</p>
                  <p className="text-xs text-[#5E6673] mt-2">3 days ago</p>
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
                navigate('/payment-methods');
                setProfileOpen(false);
              }}
            >
              <CreditCard size={16} className="text-[#848E9C]" />
              Payment Methods
            </button>
            <button 
              className="w-full px-4 py-2 text-left text-sm text-[#EAECEF] hover:bg-[#23262F] transition-colors flex items-center gap-3"
              onClick={() => {
                navigate('/transaction-history');
                setProfileOpen(false);
              }}
            >
              <History size={16} className="text-[#848E9C]" />
              Transaction History
            </button>
            <div className="border-t border-[#2B3139] my-2"></div>
            <button 
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-[#23262F] transition-colors flex items-center gap-3"
              onClick={() => {
                logout();
                setProfileOpen(false);
              }}
            >
              <LogOut size={16} />
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
          </div>
          
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-[#EAECEF] mb-1">
                {currency === 'BTC' 
                  ? `${displayBalance.toFixed(6)} BTC` 
                  : formatCurrency(displayBalance, currency)
                }
              </div>
              <div className="text-xs text-[#848E9C]">
                ≈ {formatCurrency(totalValue)} USD
              </div>
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <TrendingUp size={12} className="mr-1" />
              +{totalChange}%
            </Badge>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2">
          <QuickAction 
            icon={<ArrowDownLeft size={20} />}
            label="Deposit"
            onClick={() => setModal('deposit')}
            color="primary"
          />
          <QuickAction 
            icon={<ArrowUpRight size={20} />}
            label="Withdraw"
            onClick={() => setModal('withdraw')}
          />
          <QuickAction 
            icon={<RefreshCw size={20} />}
            label="Swap"
            onClick={() => setModal('swap')}
          />
          <QuickAction 
            icon={<Send size={20} />}
            label="Send"
            onClick={() => setModal('send')}
          />
        </div>

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
                  <AssetCard key={asset.symbol} asset={asset} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="futures" className="mt-4">
              <div className="space-y-3">
                {FUTURES.map(asset => (
                  <AssetCard key={asset.symbol} asset={asset} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="etf" className="mt-4">
              <div className="space-y-3">
                {ETFS.map(asset => (
                  <AssetCard key={asset.symbol} asset={asset} />
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
                  <TransactionItem key={tx.id} transaction={tx} />
                ))}
              </div>
            )}
          </Card>
        </div>
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
                <div className="text-xs text-[#848E9C] mb-1">Balance</div>
                <div className="text-lg font-bold text-[#EAECEF]">
                  {formatCrypto(selectedAsset.balance, selectedAsset.symbol)}
                </div>
              </div>
              <div className="bg-[#23262F] rounded-xl p-4">
                <div className="text-xs text-[#848E9C] mb-1">Value</div>
                <div className="text-lg font-bold text-[#EAECEF]">
                  ${selectedAsset.value.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Price Chart Placeholder */}
            <div className="bg-[#23262F] rounded-xl p-4 h-32 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl mb-2">📈</div>
                <div className="text-xs text-[#848E9C]">Price chart coming soon</div>
              </div>
            </div>

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
          </div>
        </Modal>
      )}

      {/* Deposit Modal */}
      {modal === 'deposit' && selectedAsset && (
        <Modal open={true} onClose={() => { setModal('assetDetail'); resetModalState(); }} title={`Deposit ${selectedAsset.symbol}`}>
          <div className="space-y-4">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-[#23262F] p-4 rounded-xl">
                <QRCodeCanvas 
                  value={depositAddresses.find(a => a.label === modalState.depositNetwork)?.value || ''} 
                  size={200} 
                  bgColor="#23262F" 
                  fgColor="#EAECEF" 
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>
            
            <div>
              <Label className="block text-sm text-[#848E9C] mb-2">Network</Label>
              <select
                className="w-full bg-[#23262F] rounded-lg px-4 py-3 text-[#EAECEF] border border-[#2B3139] focus:border-[#F0B90B] transition-colors"
                value={modalState.depositNetwork}
                onChange={e => setModalState(s => ({ ...s, depositNetwork: e.target.value, copied: '' }))}
              >
                {depositAddresses.map(net => (
                  <option key={net.label} value={net.label}>{net.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <Label className="block text-sm text-[#848E9C] mb-2">Deposit Address</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-[#23262F] rounded-lg px-4 py-3 text-xs text-[#EAECEF] font-mono break-all">
                  {depositAddresses.find(a => a.label === modalState.depositNetwork)?.value}
                </code>
                <Button
                  className="bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20]"
                  onClick={() => {
                    navigator.clipboard.writeText(depositAddresses.find(a => a.label === modalState.depositNetwork)?.value || '');
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
            
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-400">
                  Send only {selectedAsset.symbol} via {modalState.depositNetwork} to this address. 
                  Sending any other asset or network may result in permanent loss.
                </p>
              </div>
              {depositAddresses.find(a => a.label === modalState.depositNetwork)?.note && (
                <p className="text-xs text-yellow-400/80 mt-2">
                  {depositAddresses.find(a => a.label === modalState.depositNetwork)?.note}
                </p>
              )}
            </div>

            <div className="bg-[#23262F] rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Info size={14} className="text-[#848E9C]" />
                <p className="text-xs text-[#848E9C]">
                  Deposits require network confirmations before being credited to your account.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Withdraw Modal */}
      {modal === 'withdraw' && selectedAsset && (
        <Modal open={true} onClose={() => { setModal('assetDetail'); resetModalState(); }} title={`Withdraw ${selectedAsset.symbol}`}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-[#23262F] rounded-lg">
              <div className="w-10 h-10 rounded-full bg-[#2B3139] flex items-center justify-center text-xl">
                {getAssetIcon(selectedAsset.symbol)}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-[#EAECEF]">{selectedAsset.symbol}</div>
                <div className="text-xs text-[#848E9C]">Available: {formatCrypto(selectedAsset.balance, selectedAsset.symbol)}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-[#EAECEF]">{formatCrypto(selectedAsset.balance, selectedAsset.symbol)}</div>
                <div className="text-xs text-[#848E9C]">≈ ${selectedAsset.value.toFixed(2)}</div>
              </div>
            </div>

            <div>
              <Label className="block text-sm text-[#848E9C] mb-2">Recipient Address</Label>
              <Input
                placeholder="Enter wallet address"
                value={modalState.withdrawAddress}
                onChange={e => setModalState(s => ({ ...s, withdrawAddress: e.target.value, withdrawError: '' }))}
                className="bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12"
              />
            </div>

            <div>
              <Label className="block text-sm text-[#848E9C] mb-2">Amount</Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={modalState.withdrawAmount}
                  onChange={e => setModalState(s => ({ ...s, withdrawAmount: e.target.value, withdrawError: '' }))}
                  className="bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12 pr-20"
                  min="0"
                  step={selectedAsset.symbol === 'USDT' ? '0.01' : '0.000001'}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F0B90B] text-sm font-semibold hover:text-yellow-400 transition-colors"
                  onClick={() => setModalState(s => ({ ...s, withdrawAmount: selectedAsset.balance.toString() }))}
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="bg-[#23262F] rounded-lg p-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#848E9C]">Network Fee</span>
                <span className="text-[#EAECEF]">0.0001 {selectedAsset.symbol}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#848E9C]">You'll receive</span>
                <span className="font-semibold text-[#EAECEF]">
                  {modalState.withdrawAmount 
                    ? formatCrypto(parseFloat(modalState.withdrawAmount) - 0.0001, selectedAsset.symbol)
                    : `0 ${selectedAsset.symbol}`}
                </span>
              </div>
            </div>

            {modalState.withdrawError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-xs text-red-400">{modalState.withdrawError}</p>
              </div>
            )}

            <Button
              className="w-full bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold h-12"
              onClick={() => {
                const amount = parseFloat(modalState.withdrawAmount);
                handleSend(selectedAsset.symbol, amount, modalState.withdrawAddress);
              }}
              disabled={!modalState.withdrawAmount || !modalState.withdrawAddress}
            >
              Withdraw
            </Button>
          </div>
        </Modal>
      )}

      {/* Swap Modal */}
      {modal === 'swap' && (
        <Modal open={true} onClose={() => { setModal(selectedAsset ? 'assetDetail' : null); resetModalState(); }} title="Swap Assets">
          <div className="space-y-4">
            <div>
              <Label className="block text-sm text-[#848E9C] mb-2">From</Label>
              <div className="flex items-center gap-2">
                <select
                  className="flex-1 bg-[#23262F] rounded-lg px-4 py-3 text-[#EAECEF] border border-[#2B3139] focus:border-[#F0B90B] transition-colors"
                  value={modalState.swapFromSymbol || portfolio[0]?.symbol || ''}
                  onChange={e => setModalState(s => ({ ...s, swapFromSymbol: e.target.value, swapError: '' }))}
                >
                  {portfolio.map(a => (
                    <option key={a.symbol} value={a.symbol}>{a.symbol} - {formatCrypto(a.balance, a.symbol)}</option>
                  ))}
                </select>
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={modalState.swapAmount}
                    onChange={e => setModalState(s => ({ ...s, swapAmount: e.target.value, swapError: '' }))}
                    className="bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12"
                    min="0"
                    step="any"
                  />
                </div>
              </div>
              <div className="text-xs text-[#848E9C] mt-1">
                Available: {portfolio.find(a => a.symbol === modalState.swapFromSymbol)?.balance.toFixed(6) || '0'} {modalState.swapFromSymbol}
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-[#23262F] flex items-center justify-center">
                <ArrowRight size={20} className="text-[#F0B90B]" />
              </div>
            </div>

            <div>
              <Label className="block text-sm text-[#848E9C] mb-2">To</Label>
              <select
                className="w-full bg-[#23262F] rounded-lg px-4 py-3 text-[#EAECEF] border border-[#2B3139] focus:border-[#F0B90B] transition-colors"
                value={modalState.swapToSymbol}
                onChange={e => setModalState(s => ({ ...s, swapToSymbol: e.target.value, swapError: '' }))}
              >
                <option value="">Select asset</option>
                {portfolio
                  .filter(a => a.symbol !== modalState.swapFromSymbol)
                  .map(a => (
                    <option key={a.symbol} value={a.symbol}>{a.symbol}</option>
                  ))}
              </select>
            </div>

            {modalState.swapFromSymbol && modalState.swapToSymbol && (
              <div className="bg-[#23262F] rounded-lg p-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#848E9C]">Rate</span>
                  <span className="text-[#EAECEF]">
                    1 {modalState.swapFromSymbol} ≈ {modalState.swapFromSymbol === 'USDT' && modalState.swapToSymbol === 'BTC' ? '0.000025' :
                      modalState.swapFromSymbol === 'BTC' && modalState.swapToSymbol === 'USDT' ? '40,000' : '1'} {modalState.swapToSymbol}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#848E9C]">You'll receive</span>
                  <span className="font-semibold text-[#EAECEF]">
                    {modalState.swapAmount ? (() => {
                      const amount = parseFloat(modalState.swapAmount);
                      const rate = modalState.swapFromSymbol === 'USDT' && modalState.swapToSymbol === 'BTC' ? 0.000025 :
                                  modalState.swapFromSymbol === 'BTC' && modalState.swapToSymbol === 'USDT' ? 40000 : 1;
                      return `${(amount * rate).toFixed(modalState.swapToSymbol === 'USDT' ? 2 : 6)} ${modalState.swapToSymbol}`;
                    })() : `0 ${modalState.swapToSymbol}`}
                  </span>
                </div>
              </div>
            )}

            {modalState.swapError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-xs text-red-400">{modalState.swapError}</p>
              </div>
            )}

            <Button
              className="w-full bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold h-12"
              onClick={handleSwap}
              disabled={!modalState.swapAmount || !modalState.swapFromSymbol || !modalState.swapToSymbol}
            >
              Swap
            </Button>
          </div>
        </Modal>
      )}

      {/* Send Modal */}
      {modal === 'send' && selectedAsset && (
        <Modal open={true} onClose={() => { setModal('assetDetail'); resetModalState(); }} title={`Send ${selectedAsset.symbol}`}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-[#23262F] rounded-lg">
              <div className="w-10 h-10 rounded-full bg-[#2B3139] flex items-center justify-center text-xl">
                {getAssetIcon(selectedAsset.symbol)}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-[#EAECEF]">{selectedAsset.symbol}</div>
                <div className="text-xs text-[#848E9C]">Available: {formatCrypto(selectedAsset.balance, selectedAsset.symbol)}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-[#EAECEF]">{formatCrypto(selectedAsset.balance, selectedAsset.symbol)}</div>
                <div className="text-xs text-[#848E9C]">≈ ${selectedAsset.value.toFixed(2)}</div>
              </div>
            </div>

            <div>
              <Label className="block text-sm text-[#848E9C] mb-2">Recipient Email or Address</Label>
              <Input
                placeholder="Enter email or wallet address"
                value={modalState.withdrawAddress}
                onChange={e => setModalState(s => ({ ...s, withdrawAddress: e.target.value, withdrawError: '' }))}
                className="bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12"
              />
            </div>

            <div>
              <Label className="block text-sm text-[#848E9C] mb-2">Amount</Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={modalState.withdrawAmount}
                  onChange={e => setModalState(s => ({ ...s, withdrawAmount: e.target.value, withdrawError: '' }))}
                  className="bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12 pr-20"
                  min="0"
                  step={selectedAsset.symbol === 'USDT' ? '0.01' : '0.000001'}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F0B90B] text-sm font-semibold hover:text-yellow-400 transition-colors"
                  onClick={() => setModalState(s => ({ ...s, withdrawAmount: selectedAsset.balance.toString() }))}
                >
                  MAX
                </button>
              </div>
            </div>

            {modalState.withdrawError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-xs text-red-400">{modalState.withdrawError}</p>
              </div>
            )}

            <Button
              className="w-full bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold h-12"
              onClick={() => {
                const amount = parseFloat(modalState.withdrawAmount);
                handleSend(selectedAsset.symbol, amount, modalState.withdrawAddress);
              }}
              disabled={!modalState.withdrawAmount || !modalState.withdrawAddress}
            >
              Send
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