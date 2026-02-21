// TransactionHistory.tsx - Fixed with proper wallet integration and admin controls
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowRightLeft, 
  TrendingUp, 
  Calendar,
  Filter,
  Download,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Crown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  PieChart,
  BarChart3,
  Wallet,
  Activity,
  Zap,
  Shield,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

// Hooks
import { useAuth } from '@/contexts/AuthContext';
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet-v2';
import { useTradingControl } from '@/hooks/useTradingControl';

// Services
import { supabase } from '@/lib/supabase';

// Utils
import { formatCurrency as formatCurrencyUtil, formatPrice, formatPercentage } from '@/utils/tradingCalculations';

// Types
interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'swap' | 'trade' | 'staking' | 'options' | 'fee' | 'funding' | 'referral' | 'airdrop';
  status: 'completed' | 'pending' | 'processing' | 'failed' | 'cancelled' | 'active' | 'expired';
  amount: number;
  asset: string;
  from_currency?: string;
  to_currency?: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  tx_hash?: string;
  fee?: number;
  metadata?: {
    direction?: 'up' | 'down';
    leverage?: number;
    duration?: number;
    payout?: number;
    expires_at?: string;
    should_win?: boolean;
    outcome?: 'win' | 'loss';
    pnl?: number;
    order_type?: string;
    position_id?: string;
    entry_price?: number;
    expiry_price?: number;
    stake?: number;
  };
  confirmations?: number;
  network?: string;
  address?: string;
  reference_id?: string;
}

// Constants
const ITEMS_PER_PAGE = 20;

export default function TransactionHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  // Use unified wallet
  const {
    getFundingBalance,
    getTradingBalance,
    getLockedBalance,
    getTotalBalance,
    refreshBalances,
    loading: walletLoading
  } = useUnifiedWallet();
  
  const {
    userOutcome,
    activeWindows,
    shouldWin,
    loading: controlsLoading
  } = useTradingControl();

  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [showBalances, setShowBalances] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{ start?: Date; end?: Date }>({});
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load transactions from Supabase
  useEffect(() => {
    if (user?.id) {
      loadTransactions();
    }
  }, [user?.id]);

  const loadTransactions = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Fetch from trades table
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (tradesError) throw tradesError;
      
      // Fetch from wallet_transactions table
      const { data: walletTxs, error: walletError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (walletError) throw walletError;
      
      // Format trades as transactions
      const formattedTrades: Transaction[] = (trades || []).map(trade => {
        const metadata = trade.metadata || {};
        const isWin = trade.pnl > 0;
        
        return {
          id: trade.id,
          user_id: trade.user_id,
          type: trade.type || 'trade',
          status: trade.status?.toLowerCase() || 'completed',
          amount: Math.abs(trade.amount || 0),
          asset: trade.asset || 'USDT',
          description: `${metadata.direction || ''} ${metadata.symbol || 'Trade'} - ${isWin ? 'Win' : 'Loss'}`,
          created_at: trade.created_at,
          updated_at: trade.updated_at,
          fee: trade.fee,
          metadata: {
            direction: metadata.direction,
            duration: metadata.duration,
            payout: metadata.payout,
            should_win: metadata.shouldWin,
            outcome: isWin ? 'win' : 'loss',
            pnl: trade.pnl,
            entry_price: metadata.entryPrice,
            expiry_price: metadata.expiryPrice,
            stake: metadata.stake || Math.abs(trade.amount)
          }
        };
      });
      
      // Format wallet transactions
      const formattedWalletTxs: Transaction[] = (walletTxs || []).map(tx => ({
        id: tx.id,
        user_id: tx.user_id,
        type: tx.type,
        status: tx.status || 'completed',
        amount: Math.abs(tx.amount || 0),
        asset: tx.currency || 'USDT',
        description: tx.description || `${tx.type} transaction`,
        created_at: tx.created_at,
        fee: tx.fee,
        network: tx.network,
        address: tx.address,
        tx_hash: tx.tx_hash,
        reference_id: tx.reference_id
      }));
      
      // Combine and sort by date
      const allTransactions = [...formattedTrades, ...formattedWalletTxs].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setTransactions(allTransactions);
      await refreshBalances();
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transaction history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Transaction history updated",
    });
  };

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches = 
          (transaction.description?.toLowerCase().includes(term) || false) ||
          transaction.asset.toLowerCase().includes(term) ||
          transaction.id.toLowerCase().includes(term) ||
          (transaction.tx_hash && transaction.tx_hash.toLowerCase().includes(term)) ||
          (transaction.address && transaction.address.toLowerCase().includes(term)) ||
          (transaction.reference_id && transaction.reference_id.toLowerCase().includes(term));
        
        if (!matches) return false;
      }
      
      // Type filter
      if (filterType !== 'all' && transaction.type !== filterType) {
        return false;
      }
      
      // Status filter
      if (filterStatus !== 'all' && transaction.status !== filterStatus) {
        return false;
      }
      
      // Date filter
      if (dateRange !== 'all') {
        const txDate = new Date(transaction.created_at);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        switch (dateRange) {
          case 'today':
            const today = new Date(now);
            if (txDate < today || txDate > new Date(today.getTime() + 86400000)) return false;
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (txDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (txDate < monthAgo) return false;
            break;
          case 'year':
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            if (txDate < yearAgo) return false;
            break;
          case 'custom':
            if (customDateRange.start && txDate < customDateRange.start) return false;
            if (customDateRange.end && txDate > customDateRange.end) return false;
            break;
        }
      }
      
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          break;
        case 'amount':
          comparison = b.amount - a.amount;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      
      return sortOrder === 'desc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, searchTerm, filterType, filterStatus, dateRange, customDateRange, sortBy, sortOrder]);

  // Pagination
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredTransactions.length;
    const completed = filteredTransactions.filter(t => t.status === 'completed').length;
    const pending = filteredTransactions.filter(t => t.status === 'pending' || t.status === 'processing' || t.status === 'active').length;
    const failed = filteredTransactions.filter(t => t.status === 'failed' || t.status === 'cancelled' || t.status === 'expired').length;
    
    const totalDeposits = filteredTransactions
      .filter(t => t.type === 'deposit' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalWithdrawals = filteredTransactions
      .filter(t => t.type === 'withdrawal' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalFees = filteredTransactions
      .filter(t => t.fee)
      .reduce((sum, t) => sum + (t.fee || 0), 0);
      
    const totalPnl = filteredTransactions
      .filter(t => t.metadata?.pnl)
      .reduce((sum, t) => sum + (t.metadata?.pnl || 0), 0);
      
    const wins = filteredTransactions
      .filter(t => t.metadata?.outcome === 'win').length;
      
    const losses = filteredTransactions
      .filter(t => t.metadata?.outcome === 'loss').length;
      
    // Group by asset
    const byAsset = filteredTransactions.reduce((acc, t) => {
      if (!acc[t.asset]) {
        acc[t.asset] = { deposits: 0, withdrawals: 0, trades: 0, volume: 0 };
      }
      if (t.type === 'deposit') acc[t.asset].deposits += t.amount;
      if (t.type === 'withdrawal') acc[t.asset].withdrawals += t.amount;
      if (t.type === 'trade' || t.type === 'options') {
        acc[t.asset].trades++;
        acc[t.asset].volume += t.amount;
      }
      return acc;
    }, {} as Record<string, { deposits: number; withdrawals: number; trades: number; volume: number }>);
    
    return {
      total,
      completed,
      pending,
      failed,
      totalDeposits,
      totalWithdrawals,
      totalFees,
      totalPnl,
      wins,
      losses,
      winRate: wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0,
      byAsset
    };
  }, [filteredTransactions]);

  // Get transaction icon and color
  const getTransactionConfig = (type: string) => {
    const configs: Record<string, { icon: JSX.Element; color: string; label: string }> = {
      deposit: {
        icon: <ArrowDownLeft className="w-4 h-4" />,
        color: 'bg-green-500/20 text-green-400 border-green-500/30',
        label: 'Deposit'
      },
      withdrawal: {
        icon: <ArrowUpRight className="w-4 h-4" />,
        color: 'bg-red-500/20 text-red-400 border-red-500/30',
        label: 'Withdrawal'
      },
      swap: {
        icon: <ArrowRightLeft className="w-4 h-4" />,
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        label: 'Swap'
      },
      trade: {
        icon: <TrendingUp className="w-4 h-4" />,
        color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        label: 'Trade'
      },
      staking: {
        icon: <Zap className="w-4 h-4" />,
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        label: 'Staking'
      },
      options: {
        icon: <Activity className="w-4 h-4" />,
        color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        label: 'Options'
      },
      fee: {
        icon: <Wallet className="w-4 h-4" />,
        color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        label: 'Fee'
      },
      funding: {
        icon: <RefreshCw className="w-4 h-4" />,
        color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
        label: 'Funding'
      },
      referral: {
        icon: <Crown className="w-4 h-4" />,
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        label: 'Referral'
      },
      airdrop: {
        icon: <Calendar className="w-4 h-4" />,
        color: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
        label: 'Airdrop'
      }
    };
    
    return configs[type] || {
      icon: <HelpCircle className="w-4 h-4" />,
      color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      label: type
    };
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'bg-green-500/20 text-green-400 border-green-500/30',
          label: 'Completed'
        };
      case 'pending':
        return {
          icon: <Clock className="w-4 h-4" />,
          color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
          label: 'Pending'
        };
      case 'processing':
      case 'active':
        return {
          icon: <RefreshCw className="w-4 h-4 animate-spin" />,
          color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          label: 'Processing'
        };
      case 'failed':
        return {
          icon: <XCircle className="w-4 h-4" />,
          color: 'bg-red-500/20 text-red-400 border-red-500/30',
          label: 'Failed'
        };
      case 'cancelled':
      case 'expired':
        return {
          icon: <XCircle className="w-4 h-4" />,
          color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
          label: status === 'cancelled' ? 'Cancelled' : 'Expired'
        };
      default:
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
          label: status
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return formatDate(dateString);
  };

  const formatCurrency = (value: number): string => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleExport = (format: 'csv' | 'json' = 'csv') => {
    try {
      if (format === 'csv') {
        const headers = [
          'ID',
          'Type',
          'Status',
          'Amount',
          'Asset',
          'From/To',
          'Description',
          'Date',
          'TX Hash',
          'Fee',
          'Network',
          'Address'
        ].join(',');

        const rows = filteredTransactions.map(tx => [
          tx.id,
          tx.type,
          tx.status,
          tx.amount,
          tx.asset,
          tx.from_currency && tx.to_currency ? `${tx.from_currency}→${tx.to_currency}` : '',
          `"${(tx.description || '').replace(/"/g, '""')}"`,
          new Date(tx.created_at).toISOString(),
          tx.tx_hash || '',
          tx.fee || '',
          tx.network || '',
          tx.address || ''
        ].join(','));

        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: "Export Successful",
          description: `Exported ${filteredTransactions.length} transactions to CSV`,
        });
      } else {
        const json = JSON.stringify(filteredTransactions, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: "Export Successful",
          description: `Exported ${filteredTransactions.length} transactions to JSON`,
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export transactions",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${description} copied to clipboard`,
    });
  };

  const viewTransactionDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetails(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0E11] flex items-center justify-center p-4">
        <Card className="bg-[#181A20] border-[#2B3139] p-8 max-w-md text-center">
          <Shield className="w-16 h-16 text-[#F0B90B] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#EAECEF] mb-2">Authentication Required</h2>
          <p className="text-[#848E9C] mb-6">Please log in to view your transaction history</p>
          <Button
            className="bg-[#F0B90B] text-[#181A20] hover:bg-yellow-400 w-full"
            onClick={() => navigate('/login')}
          >
            Log In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E11] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            className="text-[#848E9C] hover:text-[#EAECEF] mb-4"
            onClick={() => navigate('/wallet')}
          >
            ← Back to Wallet
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#F0B90B] rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#181A20]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#EAECEF]">Transaction History</h1>
                <p className="text-[#848E9C]">View and manage all your transaction records</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="border-[#2B3139] text-[#848E9C] hover:text-[#EAECEF]"
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              >
                {viewMode === 'list' ? <BarChart3 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              </Button>
              
              <Select onValueChange={(value: 'csv' | 'json') => handleExport(value)}>
                <SelectTrigger className="w-32 bg-[#1E2329] border-[#2B3139] text-[#EAECEF]">
                  <SelectValue placeholder="Export" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                className="border-[#2B3139] text-[#EAECEF] hover:bg-[#2B3139]"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-[#181A20] border-[#2B3139] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#848E9C]">Total Balance</p>
                <p className="text-xl font-bold text-[#EAECEF]">
                  {walletLoading ? <Skeleton className="h-6 w-20" /> : 
                   showBalances ? formatCurrency(getTotalBalance('USDT')) : '••••••'}
                </p>
              </div>
              <Wallet className="w-8 h-8 text-[#F0B90B] opacity-50" />
            </div>
          </Card>

          <Card className="bg-[#181A20] border-[#2B3139] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#848E9C]">Deposits</p>
                <p className="text-xl font-bold text-green-400">
                  {loading ? <Skeleton className="h-6 w-20" /> :
                   showBalances ? formatCurrency(stats.totalDeposits) : '••••••'}
                </p>
              </div>
              <ArrowDownLeft className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </Card>

          <Card className="bg-[#181A20] border-[#2B3139] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#848E9C]">Withdrawals</p>
                <p className="text-xl font-bold text-red-400">
                  {loading ? <Skeleton className="h-6 w-20" /> :
                   showBalances ? formatCurrency(stats.totalWithdrawals) : '••••••'}
                </p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-red-400 opacity-50" />
            </div>
          </Card>

          <Card className="bg-[#181A20] border-[#2B3139] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#848E9C]">Total P&L</p>
                <p className={`text-xl font-bold ${stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {loading ? <Skeleton className="h-6 w-20" /> :
                   showBalances ? (
                    <>{stats.totalPnl >= 0 ? '+' : ''}{formatCurrency(stats.totalPnl)}</>
                  ) : '••••••'}
                </p>
              </div>
              <TrendingUp className={`w-8 h-8 ${stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'} opacity-50`} />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-[#181A20] border-[#2B3139] p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#848E9C]" />
                <Input
                  placeholder="Search by ID, hash, address..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 bg-[#1E2329] border-[#2B3139] text-[#EAECEF]"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={filterType} onValueChange={(value) => {
                setFilterType(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-32 bg-[#1E2329] border-[#2B3139] text-[#EAECEF]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="trade">Trade</SelectItem>
                  <SelectItem value="options">Options</SelectItem>
                  <SelectItem value="swap">Swap</SelectItem>
                  <SelectItem value="staking">Staking</SelectItem>
                  <SelectItem value="fee">Fee</SelectItem>
                  <SelectItem value="funding">Funding</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="airdrop">Airdrop</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={(value) => {
                setFilterStatus(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-32 bg-[#1E2329] border-[#2B3139] text-[#EAECEF]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={(value) => {
                setDateRange(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-32 bg-[#1E2329] border-[#2B3139] text-[#EAECEF]">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32 bg-[#1E2329] border-[#2B3139] text-[#EAECEF]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                className="border border-[#2B3139] bg-[#1E2329]"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              >
                {sortOrder === 'desc' ? '↓' : '↑'}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="border border-[#2B3139] bg-[#1E2329]"
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setFilterStatus('all');
                  setDateRange('all');
                  setCustomDateRange({});
                  setCurrentPage(1);
                }}
              >
                <XCircle className="w-4 h-4 text-[#848E9C]" />
              </Button>
            </div>
          </div>

          {/* Custom date range */}
          {dateRange === 'custom' && (
            <div className="mt-3 flex gap-2">
              <Input
                type="date"
                className="flex-1 bg-[#1E2329] border-[#2B3139] text-[#EAECEF]"
                onChange={(e) => setCustomDateRange(prev => ({ 
                  ...prev, 
                  start: e.target.value ? new Date(e.target.value) : undefined 
                }))}
              />
              <Input
                type="date"
                className="flex-1 bg-[#1E2329] border-[#2B3139] text-[#EAECEF]"
                onChange={(e) => setCustomDateRange(prev => ({ 
                  ...prev, 
                  end: e.target.value ? new Date(e.target.value) : undefined 
                }))}
              />
            </div>
          )}
        </Card>

        {/* Transaction List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Card key={i} className="bg-[#181A20] border-[#2B3139] p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <Card className="bg-[#181A20] border-[#2B3139] p-12 text-center">
            <FileText className="w-16 h-16 text-[#848E9C] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#EAECEF] mb-2">No Transactions Found</h3>
            <p className="text-[#848E9C] max-w-md mx-auto">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all' || dateRange !== 'all'
                ? "No transactions match your current filters. Try adjusting them."
                : "You haven't made any transactions yet. Start trading to see your history."}
            </p>
          </Card>
        ) : viewMode === 'list' ? (
          // List View
          <div className="space-y-3">
            <AnimatePresence>
              {paginatedTransactions.map((transaction, index) => {
                const typeConfig = getTransactionConfig(transaction.type);
                const statusConfig = getStatusConfig(transaction.status);
                
                return (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className="bg-[#181A20] border-[#2B3139] p-4 hover:bg-[#1E2329] transition-colors cursor-pointer"
                      onClick={() => viewTransactionDetails(transaction)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg border ${typeConfig.color}`}>
                            {typeConfig.icon}
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-[#EAECEF] capitalize">
                                {typeConfig.label}
                              </h3>
                              <Badge className={`text-xs ${statusConfig.color}`}>
                                {statusConfig.icon}
                                <span className="ml-1 capitalize">{statusConfig.label}</span>
                              </Badge>
                              {transaction.metadata?.should_win && (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                  <Crown className="w-3 h-3 mr-1" />
                                  Force Win
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-[#848E9C] mb-2">{transaction.description || transaction.type}</p>
                            
                            <div className="flex flex-wrap gap-3 text-xs">
                              {transaction.tx_hash && (
                                <button
                                  className="text-[#5E6673] hover:text-[#F0B90B] flex items-center gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(transaction.tx_hash!, 'Transaction hash');
                                  }}
                                >
                                  <span className="font-mono">
                                    {transaction.tx_hash.slice(0, 10)}...{transaction.tx_hash.slice(-8)}
                                  </span>
                                  <Copy className="w-3 h-3" />
                                </button>
                              )}
                              
                              {transaction.address && (
                                <button
                                  className="text-[#5E6673] hover:text-[#F0B90B] flex items-center gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(transaction.address!, 'Address');
                                  }}
                                >
                                  <span className="font-mono">
                                    {transaction.address.slice(0, 8)}...{transaction.address.slice(-6)}
                                  </span>
                                  <Copy className="w-3 h-3" />
                                </button>
                              )}
                              
                              <span className="text-[#5E6673]">
                                {formatRelativeTime(transaction.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-lg font-semibold ${
                            transaction.type === 'deposit' || transaction.type === 'staking' || transaction.type === 'referral' || transaction.type === 'airdrop'
                              ? 'text-green-400'
                              : transaction.type === 'withdrawal'
                                ? 'text-red-400'
                                : transaction.metadata?.outcome === 'win'
                                  ? 'text-green-400'
                                  : transaction.metadata?.outcome === 'loss'
                                    ? 'text-red-400'
                                    : 'text-[#EAECEF]'
                          }`}>
                            {transaction.type === 'deposit' || transaction.type === 'staking' || transaction.type === 'referral' || transaction.type === 'airdrop'
                              ? '+'
                              : transaction.type === 'withdrawal'
                                ? '-'
                                : transaction.metadata?.outcome === 'win'
                                  ? '+'
                                  : transaction.metadata?.outcome === 'loss'
                                    ? '-'
                                    : ''}
                            {transaction.amount} {transaction.asset}
                          </div>
                          
                          {transaction.from_currency && transaction.to_currency && (
                            <div className="text-xs text-[#848E9C] mt-1">
                              {transaction.from_currency} → {transaction.to_currency}
                            </div>
                          )}
                          
                          {transaction.fee ? (
                            <div className="text-xs text-[#848E9C] mt-1">
                              Fee: {transaction.fee} {transaction.asset}
                            </div>
                          ) : transaction.metadata?.pnl ? (
                            <div className={`text-xs mt-1 ${transaction.metadata.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              P&L: {transaction.metadata.pnl >= 0 ? '+' : ''}{formatCurrency(transaction.metadata.pnl)}
                            </div>
                          ) : null}
                          
                          {transaction.confirmations !== undefined && (
                            <div className="text-xs text-[#848E9C] mt-1">
                              {transaction.confirmations} confirmations
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {paginatedTransactions.map((transaction, index) => {
                const typeConfig = getTransactionConfig(transaction.type);
                const statusConfig = getStatusConfig(transaction.status);
                
                return (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className="bg-[#181A20] border-[#2B3139] p-4 hover:bg-[#1E2329] transition-colors cursor-pointer h-full"
                      onClick={() => viewTransactionDetails(transaction)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg border ${typeConfig.color}`}>
                          {typeConfig.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-[#EAECEF] capitalize">{typeConfig.label}</h3>
                          <Badge className={`text-xs ${statusConfig.color}`}>
                            {statusConfig.icon}
                            <span className="ml-1 capitalize">{statusConfig.label}</span>
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-[#848E9C] mb-3 line-clamp-2">{transaction.description || transaction.type}</p>
                      
                      <div className="mb-3">
                        <div className={`text-xl font-bold ${
                          transaction.type === 'deposit' || transaction.type === 'staking' || transaction.type === 'referral' || transaction.type === 'airdrop'
                            ? 'text-green-400'
                            : transaction.type === 'withdrawal'
                              ? 'text-red-400'
                              : transaction.metadata?.outcome === 'win'
                                ? 'text-green-400'
                                : transaction.metadata?.outcome === 'loss'
                                  ? 'text-red-400'
                                  : 'text-[#EAECEF]'
                        }`}>
                          {transaction.type === 'deposit' || transaction.type === 'staking' || transaction.type === 'referral' || transaction.type === 'airdrop'
                            ? '+'
                            : transaction.type === 'withdrawal'
                              ? '-'
                              : transaction.metadata?.outcome === 'win'
                                ? '+'
                                : transaction.metadata?.outcome === 'loss'
                                  ? '-'
                                  : ''}
                          {transaction.amount} {transaction.asset}
                        </div>
                        
                        {transaction.metadata?.pnl && (
                          <div className={`text-sm ${transaction.metadata.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            P&L: {transaction.metadata.pnl >= 0 ? '+' : ''}{formatCurrency(transaction.metadata.pnl)}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs text-[#5E6673]">
                        {formatDate(transaction.created_at)}
                      </div>
                      
                      {transaction.tx_hash && (
                        <button
                          className="mt-2 text-xs text-[#5E6673] hover:text-[#F0B90B] flex items-center gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(transaction.tx_hash!, 'Transaction hash');
                          }}
                        >
                          <span className="font-mono">
                            {transaction.tx_hash.slice(0, 10)}...{transaction.tx_hash.slice(-8)}
                          </span>
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {filteredTransactions.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-xs text-[#848E9C]">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} of {filteredTransactions.length}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 border border-[#2B3139]"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = currentPage;
                if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                if (pageNum > 0 && pageNum <= totalPages) {
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'ghost'}
                      size="sm"
                      className={`h-8 w-8 p-0 ${
                        currentPage === pageNum 
                          ? 'bg-[#F0B90B] text-[#181A20] hover:bg-yellow-400' 
                          : 'border border-[#2B3139]'
                      }`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                }
                return null;
              })}
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 border border-[#2B3139]"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Summary by Asset */}
        {Object.keys(stats.byAsset).length > 0 && (
          <Card className="bg-[#181A20] border-[#2B3139] p-6 mt-6">
            <h3 className="text-lg font-semibold text-[#EAECEF] mb-4">Summary by Asset</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.byAsset).map(([asset, data]) => (
                <div key={asset} className="bg-[#1E2329] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-[#EAECEF]">{asset}</span>
                    <Badge className="bg-[#2B3139] text-[#848E9C]">{data.trades} trades</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-[#848E9C] text-xs">Deposits</span>
                      <div className="text-green-400 font-medium">
                        {showBalances ? formatCurrency(data.deposits) : '••••••'}
                      </div>
                    </div>
                    <div>
                      <span className="text-[#848E9C] text-xs">Withdrawals</span>
                      <div className="text-red-400 font-medium">
                        {showBalances ? formatCurrency(data.withdrawals) : '••••••'}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[#848E9C] text-xs">Volume</span>
                      <div className="text-[#EAECEF] font-medium">
                        {showBalances ? formatCurrency(data.volume) : '••••••'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {showDetails && selectedTransaction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#181A20] border border-[#2B3139] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-[#2B3139] flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#EAECEF]">Transaction Details</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDetails(false)}
                >
                  <XCircle className="h-5 w-5 text-[#848E9C]" />
                </Button>
              </div>

              <div className="p-4 space-y-4">
                {/* Header with type and status */}
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg border ${getTransactionConfig(selectedTransaction.type).color}`}>
                    {getTransactionConfig(selectedTransaction.type).icon}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-[#EAECEF] capitalize">
                      {getTransactionConfig(selectedTransaction.type).label}
                    </h4>
                    <Badge className={`mt-1 ${getStatusConfig(selectedTransaction.status).color}`}>
                      {getStatusConfig(selectedTransaction.status).icon}
                      <span className="ml-1 capitalize">{selectedTransaction.status}</span>
                    </Badge>
                  </div>
                </div>

                {/* Transaction ID */}
                <div>
                  <div className="text-xs text-[#848E9C] mb-1">Transaction ID</div>
                  <div className="text-sm text-[#EAECEF] font-mono break-all flex items-center gap-2">
                    {selectedTransaction.id}
                    <button
                      onClick={() => copyToClipboard(selectedTransaction.id, 'Transaction ID')}
                      className="text-[#848E9C] hover:text-[#F0B90B]"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Reference ID */}
                {selectedTransaction.reference_id && (
                  <div>
                    <div className="text-xs text-[#848E9C] mb-1">Reference ID</div>
                    <div className="text-sm text-[#EAECEF] font-mono break-all flex items-center gap-2">
                      {selectedTransaction.reference_id}
                      <button
                        onClick={() => copyToClipboard(selectedTransaction.reference_id!, 'Reference ID')}
                        className="text-[#848E9C] hover:text-[#F0B90B]"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Amount and Asset */}
                <div className="bg-[#1E2329] rounded-lg p-4">
                  <div className="text-xs text-[#848E9C] mb-1">Amount</div>
                  <div className={`text-2xl font-bold ${
                    selectedTransaction.type === 'deposit' || selectedTransaction.type === 'staking' || selectedTransaction.type === 'referral' || selectedTransaction.type === 'airdrop'
                      ? 'text-green-400'
                      : selectedTransaction.type === 'withdrawal'
                        ? 'text-red-400'
                        : selectedTransaction.metadata?.outcome === 'win'
                          ? 'text-green-400'
                          : selectedTransaction.metadata?.outcome === 'loss'
                            ? 'text-red-400'
                            : 'text-[#EAECEF]'
                  }`}>
                    {selectedTransaction.type === 'deposit' || selectedTransaction.type === 'staking' || selectedTransaction.type === 'referral' || selectedTransaction.type === 'airdrop'
                      ? '+'
                      : selectedTransaction.type === 'withdrawal'
                        ? '-'
                        : selectedTransaction.metadata?.outcome === 'win'
                          ? '+'
                          : selectedTransaction.metadata?.outcome === 'loss'
                            ? '-'
                            : ''}
                    {selectedTransaction.amount} {selectedTransaction.asset}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-[#848E9C]">Date</div>
                    <div className="text-sm text-[#EAECEF]">{formatDate(selectedTransaction.created_at)}</div>
                  </div>
                  
                  {selectedTransaction.updated_at && (
                    <div>
                      <div className="text-xs text-[#848E9C]">Updated</div>
                      <div className="text-sm text-[#EAECEF]">{formatDate(selectedTransaction.updated_at)}</div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs text-[#848E9C]">Network</div>
                    <div className="text-sm text-[#EAECEF]">{selectedTransaction.network || 'Mainnet'}</div>
                  </div>

                  {selectedTransaction.from_currency && selectedTransaction.to_currency && (
                    <>
                      <div>
                        <div className="text-xs text-[#848E9C]">From</div>
                        <div className="text-sm text-[#EAECEF]">{selectedTransaction.from_currency}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[#848E9C]">To</div>
                        <div className="text-sm text-[#EAECEF]">{selectedTransaction.to_currency}</div>
                      </div>
                    </>
                  )}

                  {selectedTransaction.fee && (
                    <div>
                      <div className="text-xs text-[#848E9C]">Fee</div>
                      <div className="text-sm text-[#EAECEF]">{selectedTransaction.fee} {selectedTransaction.asset}</div>
                    </div>
                  )}

                  {selectedTransaction.confirmations !== undefined && (
                    <div>
                      <div className="text-xs text-[#848E9C]">Confirmations</div>
                      <div className="text-sm text-[#EAECEF]">{selectedTransaction.confirmations}</div>
                    </div>
                  )}
                </div>

                {/* Addresses */}
                {selectedTransaction.address && (
                  <div>
                    <div className="text-xs text-[#848E9C] mb-1">Address</div>
                    <div className="text-sm text-[#EAECEF] font-mono break-all flex items-center gap-2">
                      {selectedTransaction.address}
                      <button
                        onClick={() => copyToClipboard(selectedTransaction.address!, 'Address')}
                        className="text-[#848E9C] hover:text-[#F0B90B]"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Transaction Hash */}
                {selectedTransaction.tx_hash && (
                  <div>
                    <div className="text-xs text-[#848E9C] mb-1">Transaction Hash</div>
                    <div className="text-sm text-[#EAECEF] font-mono break-all flex items-center gap-2">
                      {selectedTransaction.tx_hash}
                      <button
                        onClick={() => copyToClipboard(selectedTransaction.tx_hash!, 'Transaction hash')}
                        className="text-[#848E9C] hover:text-[#F0B90B]"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={`https://etherscan.io/tx/${selectedTransaction.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#848E9C] hover:text-[#F0B90B]"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedTransaction.description && (
                  <div>
                    <div className="text-xs text-[#848E9C] mb-1">Description</div>
                    <div className="text-sm text-[#EAECEF]">{selectedTransaction.description}</div>
                  </div>
                )}

                {/* Metadata */}
                {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
                  <div className="bg-[#1E2329] rounded-lg p-3">
                    <h4 className="text-sm font-medium text-[#EAECEF] mb-2">Additional Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {selectedTransaction.metadata.direction && (
                        <>
                          <span className="text-[#848E9C]">Direction:</span>
                          <span className={selectedTransaction.metadata.direction === 'up' ? 'text-green-400' : 'text-red-400'}>
                            {selectedTransaction.metadata.direction.toUpperCase()}
                          </span>
                        </>
                      )}
                      {selectedTransaction.metadata.leverage && (
                        <>
                          <span className="text-[#848E9C]">Leverage:</span>
                          <span className="text-[#F0B90B]">{selectedTransaction.metadata.leverage}x</span>
                        </>
                      )}
                      {selectedTransaction.metadata.duration && (
                        <>
                          <span className="text-[#848E9C]">Duration:</span>
                          <span className="text-[#EAECEF]">{selectedTransaction.metadata.duration}s</span>
                        </>
                      )}
                      {selectedTransaction.metadata.payout && (
                        <>
                          <span className="text-[#848E9C]">Payout:</span>
                          <span className="text-green-400">{formatCurrency(selectedTransaction.metadata.payout)}</span>
                        </>
                      )}
                      {selectedTransaction.metadata.pnl && (
                        <>
                          <span className="text-[#848E9C]">P&L:</span>
                          <span className={selectedTransaction.metadata.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {selectedTransaction.metadata.pnl >= 0 ? '+' : ''}{formatCurrency(selectedTransaction.metadata.pnl)}
                          </span>
                        </>
                      )}
                      {selectedTransaction.metadata.entry_price && (
                        <>
                          <span className="text-[#848E9C]">Entry Price:</span>
                          <span className="text-[#EAECEF]">${selectedTransaction.metadata.entry_price.toFixed(2)}</span>
                        </>
                      )}
                      {selectedTransaction.metadata.expiry_price && (
                        <>
                          <span className="text-[#848E9C]">Expiry Price:</span>
                          <span className="text-[#EAECEF]">${selectedTransaction.metadata.expiry_price.toFixed(2)}</span>
                        </>
                      )}
                      {selectedTransaction.metadata.stake && (
                        <>
                          <span className="text-[#848E9C]">Stake:</span>
                          <span className="text-[#EAECEF]">{formatCurrency(selectedTransaction.metadata.stake)}</span>
                        </>
                      )}
                      {selectedTransaction.metadata.should_win !== undefined && (
                        <>
                          <span className="text-[#848E9C]">Force Win:</span>
                          <Badge className={selectedTransaction.metadata.should_win ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}>
                            {selectedTransaction.metadata.should_win ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-[#2B3139] flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="border-[#2B3139] text-[#848E9C]"
                  onClick={() => setShowDetails(false)}
                >
                  Close
                </Button>
                <Button
                  className="bg-[#F0B90B] text-[#181A20] hover:bg-yellow-400"
                  onClick={() => {
                    copyToClipboard(selectedTransaction.id, 'Transaction ID');
                  }}
                >
                  Copy ID
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}