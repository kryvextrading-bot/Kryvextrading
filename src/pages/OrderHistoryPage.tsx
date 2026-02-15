// OrderHistoryPage.tsx - Fixed with proper transaction display and admin controls
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Filter, 
  Search, 
  Download, 
  RefreshCw,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Crown,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FileText,
  Printer,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Hooks
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';

// Services
import { tradingService } from '@/services/tradingService';
import { walletService } from '@/services/walletService';

// Types
import { Transaction, TransactionStatus, TransactionType } from '@/types/trading';

// Utils
import { formatPrice, formatCurrency, formatPercentage } from '@/utils/tradingCalculations';

// Constants
const ITEMS_PER_PAGE = 20;

const OrderHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balances, refreshBalances } = useWallet();
  
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState<{ start?: Date; end?: Date }>({});
  const [showBalances, setShowBalances] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Load transactions
  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const data = await tradingService.getUserTransactions(user.id);
      setTransactions(data);
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
    toast.success('Transaction history refreshed');
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches = 
          tx.asset.toLowerCase().includes(term) ||
          tx.type.toLowerCase().includes(term) ||
          tx.id.toLowerCase().includes(term) ||
          (tx.side && tx.side.toLowerCase().includes(term)) ||
          (tx.metadata?.direction && tx.metadata.direction.toLowerCase().includes(term));
        
        if (!matches) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && tx.status !== statusFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }

      // Date filter
      if (dateFilter !== 'all') {
        const txDate = new Date(tx.createdAt);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        switch (dateFilter) {
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
            
          case 'custom':
            if (customDateRange.start && txDate < customDateRange.start) return false;
            if (customDateRange.end && txDate > customDateRange.end) return false;
            break;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [transactions, searchTerm, statusFilter, typeFilter, dateFilter, customDateRange]);

  // Pagination
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredTransactions.length;
    const completed = filteredTransactions.filter(tx => tx.status === 'completed').length;
    const pending = filteredTransactions.filter(tx => tx.status === 'pending' || tx.status === 'processing').length;
    const scheduled = filteredTransactions.filter(tx => tx.status === 'scheduled').length;
    
    const totalVolume = filteredTransactions.reduce((sum, tx) => sum + tx.total, 0);
    const totalPnl = filteredTransactions.reduce((sum, tx) => sum + (tx.pnl || 0), 0);
    
    const wins = filteredTransactions.filter(tx => tx.pnl && tx.pnl > 0).length;
    const losses = filteredTransactions.filter(tx => tx.pnl && tx.pnl < 0).length;
    const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;

    const totalFees = filteredTransactions
      .filter(tx => tx.type === 'fee' || tx.fee)
      .reduce((sum, tx) => sum + (tx.fee || 0), 0);

    // Group by asset
    const byAsset = filteredTransactions.reduce((acc, tx) => {
      if (!acc[tx.asset]) {
        acc[tx.asset] = { volume: 0, pnl: 0, count: 0 };
      }
      acc[tx.asset].volume += tx.total;
      acc[tx.asset].pnl += (tx.pnl || 0);
      acc[tx.asset].count++;
      return acc;
    }, {} as Record<string, { volume: number; pnl: number; count: number }>);

    return { 
      total, 
      completed, 
      pending,
      scheduled,
      totalVolume,
      totalPnl, 
      wins, 
      losses, 
      winRate,
      totalFees,
      byAsset
    };
  }, [filteredTransactions]);

  // Export transactions
  const handleExport = (format: 'csv' | 'json' | 'pdf' = 'csv') => {
    try {
      if (format === 'csv') {
        const headers = [
          'ID',
          'Date',
          'Type',
          'Asset',
          'Side',
          'Amount',
          'Price',
          'Total',
          'Fee',
          'Status',
          'P&L',
          'Direction',
          'Leverage',
          'Time Frame'
        ].join(',');

        const rows = filteredTransactions.map(tx => [
          tx.id,
          new Date(tx.createdAt).toISOString(),
          tx.type,
          tx.asset,
          tx.side || '',
          tx.amount,
          tx.price,
          tx.total,
          tx.fee || 0,
          tx.status,
          tx.pnl || 0,
          tx.metadata?.direction || '',
          tx.metadata?.leverage || '',
          tx.metadata?.timeFrame || ''
        ].join(','));

        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast.success(`Exported ${filteredTransactions.length} transactions to CSV`);
      } 
      else if (format === 'json') {
        const json = JSON.stringify(filteredTransactions, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast.success(`Exported ${filteredTransactions.length} transactions to JSON`);
      }
      else if (format === 'pdf') {
        // For PDF, we'd need a library like jsPDF
        toast.info('PDF export coming soon');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export transactions');
    }
  };

  // Copy transaction ID
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Transaction ID copied to clipboard');
  };

  // View transaction details
  const viewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetails(true);
  };

  // Get status color and icon
  const getStatusConfig = (status: TransactionStatus) => {
    switch (status) {
      case 'completed':
        return {
          color: 'bg-green-500/20 text-green-400 border-green-500/30',
          icon: <CheckCircle className="w-4 h-4" />,
          label: 'Completed'
        };
      case 'pending':
        return {
          color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
          icon: <Clock className="w-4 h-4" />,
          label: 'Pending'
        };
      case 'processing':
        return {
          color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          icon: <RefreshCw className="w-4 h-4 animate-spin" />,
          label: 'Processing'
        };
      case 'scheduled':
        return {
          color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          icon: <Calendar className="w-4 h-4" />,
          label: 'Scheduled'
        };
      case 'failed':
        return {
          color: 'bg-red-500/20 text-red-400 border-red-500/30',
          icon: <XCircle className="w-4 h-4" />,
          label: 'Failed'
        };
      case 'cancelled':
        return {
          color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
          icon: <XCircle className="w-4 h-4" />,
          label: 'Cancelled'
        };
      default:
        return {
          color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
          icon: <AlertCircle className="w-4 h-4" />,
          label: status
        };
    }
  };

  // Get type color
  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case 'trade': return 'bg-[#F0B90B]/20 text-[#F0B90B]';
      case 'option': return 'bg-purple-500/20 text-purple-400';
      case 'deposit': return 'bg-green-500/20 text-green-400';
      case 'withdrawal': return 'bg-orange-500/20 text-orange-400';
      case 'fee': return 'bg-gray-500/20 text-gray-400';
      case 'funding': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-[#181A20] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#181A20]/95 backdrop-blur border-b border-[#2B3139]">
        <div className="px-3 md:px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-[#848E9C] hover:text-[#EAECEF]"
              onClick={() => navigate('/trading')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Back to Trading</span>
            </Button>
            
            <h1 className="text-lg font-semibold text-[#EAECEF] flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#F0B90B]" />
              Order History
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-[#848E9C] hover:text-[#EAECEF]"
              onClick={() => setShowBalances(!showBalances)}
              title={showBalances ? 'Hide Balances' : 'Show Balances'}
            >
              {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            
            <Select onValueChange={(value: any) => handleExport(value)}>
              <SelectTrigger className="h-8 w-24 bg-[#1E2329] border-[#2B3139] text-[#EAECEF]">
                <SelectValue placeholder="Export" />
              </SelectTrigger>
              <SelectContent className="bg-[#1E2329] border-[#2B3139]">
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-[#848E9C] hover:text-[#EAECEF]"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-3 md:p-4 space-y-4">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="bg-[#1E2329] border border-[#2B3139] p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[#848E9C]">Total Orders</div>
                <div className="text-lg font-semibold text-[#EAECEF]">{stats.total}</div>
                <div className="text-xs text-[#848E9C] mt-1">
                  {stats.completed} completed
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#F0B90B]/20 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-[#F0B90B]" />
              </div>
            </div>
          </Card>

          <Card className="bg-[#1E2329] border border-[#2B3139] p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[#848E9C]">Volume</div>
                <div className="text-lg font-semibold text-[#EAECEF]">
                  {showBalances ? `$${formatCurrency(stats.totalVolume)}` : '••••••'}
                </div>
                <div className="text-xs text-[#848E9C] mt-1">
                  {stats.pending} pending
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-[#1E2329] border border-[#2B3139] p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[#848E9C]">Total P&L</div>
                <div className={`text-lg font-semibold ${stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {showBalances ? (
                    <>{stats.totalPnl >= 0 ? '+' : ''}{formatCurrency(stats.totalPnl)}</>
                  ) : '••••••'}
                </div>
                <div className="text-xs text-[#848E9C] mt-1">
                  Fees: {showBalances ? formatCurrency(stats.totalFees) : '••••••'}
                </div>
              </div>
              <div className={`w-8 h-8 rounded-full ${stats.totalPnl >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'} flex items-center justify-center`}>
                {stats.totalPnl >= 0 ? 
                  <TrendingUp className="w-4 h-4 text-green-400" /> : 
                  <TrendingDown className="w-4 h-4 text-red-400" />
                }
              </div>
            </div>
          </Card>

          <Card className="bg-[#1E2329] border border-[#2B3139] p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[#848E9C]">Win Rate</div>
                <div className="text-lg font-semibold text-[#F0B90B]">{stats.winRate.toFixed(1)}%</div>
                <div className="text-xs text-[#848E9C] mt-1">
                  {stats.wins} wins / {stats.losses} losses
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#F0B90B]/20 flex items-center justify-center">
                <Crown className="w-4 h-4 text-[#F0B90B]" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#848E9C]" />
                <Input
                  placeholder="Search by asset, ID, or type..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Select 
                value={statusFilter} 
                onValueChange={(value: any) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-32 bg-[#181A20] border-[#2B3139]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#181A20] border-[#2B3139]">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={typeFilter} 
                onValueChange={(value: any) => {
                  setTypeFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-32 bg-[#181A20] border-[#2B3139]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-[#181A20] border-[#2B3139]">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="trade">Trade</SelectItem>
                  <SelectItem value="option">Option</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="fee">Fee</SelectItem>
                  <SelectItem value="funding">Funding</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={dateFilter} 
                onValueChange={(value: any) => {
                  setDateFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-32 bg-[#181A20] border-[#2B3139]">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent className="bg-[#181A20] border-[#2B3139]">
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 bg-[#181A20] border border-[#2B3139]"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setDateFilter('all');
                  setCustomDateRange({});
                  setCurrentPage(1);
                }}
                title="Clear filters"
              >
                <XCircle className="h-4 w-4 text-[#848E9C]" />
              </Button>
            </div>
          </div>

          {/* Custom date range */}
          {dateFilter === 'custom' && (
            <div className="mt-3 flex gap-2">
              <Input
                type="date"
                className="flex-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                onChange={(e) => setCustomDateRange(prev => ({ 
                  ...prev, 
                  start: e.target.value ? new Date(e.target.value) : undefined 
                }))}
              />
              <Input
                type="date"
                className="flex-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                onChange={(e) => setCustomDateRange(prev => ({ 
                  ...prev, 
                  end: e.target.value ? new Date(e.target.value) : undefined 
                }))}
              />
            </div>
          )}
        </Card>

        {/* Transaction List */}
        <Card className="bg-[#1E2329] border border-[#2B3139] overflow-hidden">
          <div className="p-4 border-b border-[#2B3139] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[#EAECEF]">Transactions</h3>
              <Badge className="bg-[#2B3139] text-[#848E9C]">
                {filteredTransactions.length} found
              </Badge>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-8 h-8 text-[#F0B90B] animate-spin" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-[#2B3139] mx-auto mb-3" />
              <div className="text-[#848E9C]">No transactions found</div>
              <div className="text-xs text-[#5E6673] mt-1">Try adjusting your filters</div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#181A20] border-b border-[#2B3139]">
                    <tr>
                      <th className="text-left p-3 text-xs text-[#848E9C] font-medium">Date & ID</th>
                      <th className="text-left p-3 text-xs text-[#848E9C] font-medium">Type</th>
                      <th className="text-left p-3 text-xs text-[#848E9C] font-medium">Asset</th>
                      <th className="text-right p-3 text-xs text-[#848E9C] font-medium">Amount</th>
                      <th className="text-right p-3 text-xs text-[#848E9C] font-medium">Price</th>
                      <th className="text-right p-3 text-xs text-[#848E9C] font-medium">Total</th>
                      <th className="text-right p-3 text-xs text-[#848E9C] font-medium">P&L</th>
                      <th className="text-center p-3 text-xs text-[#848E9C] font-medium">Status</th>
                      <th className="text-center p-3 text-xs text-[#848E9C] font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {paginatedTransactions.map((tx, index) => {
                        const statusConfig = getStatusConfig(tx.status);
                        return (
                          <motion.tr
                            key={tx.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-[#2B3139] hover:bg-[#23262F]/50 transition-colors"
                          >
                            <td className="p-3">
                              <div className="text-sm text-[#EAECEF]">
                                {new Date(tx.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-[#848E9C] font-mono">
                                {tx.id.slice(0, 8)}...
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge className={getTypeColor(tx.type)}>
                                {tx.type}
                              </Badge>
                              {tx.metadata?.shouldWin && (
                                <Badge className="ml-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                  <Crown className="w-3 h-3" />
                                </Badge>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="text-sm text-[#EAECEF]">{tx.asset}</div>
                              {tx.side && (
                                <div className={`text-xs ${tx.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                                  {tx.side.toUpperCase()}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <div className="text-sm text-[#EAECEF]">{tx.amount}</div>
                            </td>
                            <td className="p-3 text-right">
                              <div className="text-sm text-[#EAECEF]">
                                ${formatPrice(tx.price)}
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <div className="text-sm text-[#EAECEF]">
                                ${formatCurrency(tx.total)}
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              {tx.pnl !== undefined && tx.pnl !== 0 ? (
                                <div className={`text-sm font-medium ${tx.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {tx.pnl >= 0 ? '+' : ''}{formatCurrency(tx.pnl)}
                                </div>
                              ) : (
                                <div className="text-sm text-[#848E9C]">-</div>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <Badge className={statusConfig.color}>
                                {statusConfig.icon}
                                <span className="ml-1">{statusConfig.label}</span>
                              </Badge>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(tx.id)}
                                  title="Copy ID"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => viewDetails(tx)}
                                  title="View Details"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-[#2B3139]">
                <AnimatePresence>
                  {paginatedTransactions.map((tx, index) => {
                    const statusConfig = getStatusConfig(tx.status);
                    return (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-3 hover:bg-[#23262F]/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={statusConfig.color}>
                              {statusConfig.icon}
                              <span className="ml-1">{statusConfig.label}</span>
                            </Badge>
                            
                            <Badge className={getTypeColor(tx.type)}>
                              {tx.type}
                            </Badge>

                            {tx.metadata?.shouldWin && (
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                <Crown className="w-3 h-3" />
                              </Badge>
                            )}
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => viewDetails(tx)}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="text-xs text-[#848E9C]">Asset</div>
                            <div className="font-medium text-[#EAECEF]">{tx.asset}</div>
                            {tx.side && (
                              <div className={`text-xs ${tx.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                                {tx.side.toUpperCase()}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <div className="text-xs text-[#848E9C]">Amount</div>
                            <div className="font-medium text-[#EAECEF]">{tx.amount}</div>
                          </div>
                          
                          <div>
                            <div className="text-xs text-[#848E9C]">Price</div>
                            <div className="font-medium text-[#EAECEF]">${formatPrice(tx.price)}</div>
                          </div>
                          
                          <div>
                            <div className="text-xs text-[#848E9C]">Total</div>
                            <div className="font-medium text-[#EAECEF]">${formatCurrency(tx.total)}</div>
                          </div>
                        </div>

                        {tx.metadata && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {tx.metadata.direction && (
                              <Badge className="bg-[#2B3139] text-[#848E9C] text-xs">
                                {tx.metadata.direction.toUpperCase()}
                              </Badge>
                            )}
                            {tx.metadata.leverage && (
                              <Badge className="bg-[#F0B90B]/20 text-[#F0B90B] text-xs">
                                {tx.metadata.leverage}x
                              </Badge>
                            )}
                            {tx.metadata.timeFrame && (
                              <Badge className="bg-[#2B3139] text-[#848E9C] text-xs">
                                {tx.metadata.timeFrame}s
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-xs text-[#848E9C]">
                            {new Date(tx.createdAt).toLocaleString()}
                          </div>
                          
                          {tx.pnl !== undefined && tx.pnl !== 0 && (
                            <div className={`text-sm font-medium ${tx.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {tx.pnl >= 0 ? '+' : ''}{formatCurrency(tx.pnl)}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </>
          )}

          {/* Pagination */}
          {filteredTransactions.length > 0 && (
            <div className="p-4 border-t border-[#2B3139] flex items-center justify-between">
              <div className="text-xs text-[#848E9C]">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} of {filteredTransactions.length}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
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
                        className="h-8 w-8 p-0"
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
                  className="h-8 w-8 p-0"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Asset Breakdown */}
        <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
          <h3 className="text-sm font-semibold text-[#EAECEF] mb-3">Trading by Asset</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(stats.byAsset).map(([asset, data]) => (
              <div key={asset} className="bg-[#181A20] rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-[#EAECEF]">{asset}</span>
                  <Badge className="bg-[#2B3139] text-[#848E9C]">{data.count} trades</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-xs text-[#848E9C]">Volume</div>
                    <div className="font-mono text-[#EAECEF]">
                      {showBalances ? `$${formatCurrency(data.volume)}` : '••••••'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#848E9C]">P&L</div>
                    <div className={`font-mono ${data.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {showBalances ? (
                        <>{data.pnl >= 0 ? '+' : ''}{formatCurrency(data.pnl)}</>
                      ) : '••••••'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Transaction Details Modal */}
      {showDetails && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#1E2329] border border-[#2B3139] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
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
              {/* Transaction ID */}
              <div>
                <div className="text-xs text-[#848E9C] mb-1">Transaction ID</div>
                <div className="text-sm text-[#EAECEF] font-mono break-all">{selectedTransaction.id}</div>
              </div>

              {/* Status */}
              <div>
                <div className="text-xs text-[#848E9C] mb-1">Status</div>
                <Badge className={getStatusConfig(selectedTransaction.status).color}>
                  {getStatusConfig(selectedTransaction.status).icon}
                  <span className="ml-1">{selectedTransaction.status}</span>
                </Badge>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-[#848E9C]">Type</div>
                  <Badge className={getTypeColor(selectedTransaction.type)}>
                    {selectedTransaction.type}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-[#848E9C]">Asset</div>
                  <div className="text-sm text-[#EAECEF]">{selectedTransaction.asset}</div>
                </div>
                <div>
                  <div className="text-xs text-[#848E9C]">Side</div>
                  <div className={`text-sm ${selectedTransaction.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedTransaction.side?.toUpperCase() || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#848E9C]">Date</div>
                  <div className="text-sm text-[#EAECEF]">
                    {new Date(selectedTransaction.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Financial Details */}
              <div className="bg-[#181A20] rounded-lg p-3 space-y-2">
                <h4 className="text-sm font-medium text-[#EAECEF]">Financial Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#848E9C]">Amount:</span>
                    <span className="text-[#EAECEF]">{selectedTransaction.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#848E9C]">Price:</span>
                    <span className="text-[#EAECEF]">${formatPrice(selectedTransaction.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#848E9C]">Total:</span>
                    <span className="text-[#EAECEF]">${formatCurrency(selectedTransaction.total)}</span>
                  </div>
                  {selectedTransaction.fee && (
                    <div className="flex justify-between">
                      <span className="text-[#848E9C]">Fee:</span>
                      <span className="text-[#EAECEF]">${formatCurrency(selectedTransaction.fee)}</span>
                    </div>
                  )}
                  {selectedTransaction.pnl !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-[#848E9C]">P&L:</span>
                      <span className={selectedTransaction.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {selectedTransaction.pnl >= 0 ? '+' : ''}{formatCurrency(selectedTransaction.pnl)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata */}
              {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
                <div className="bg-[#181A20] rounded-lg p-3">
                  <h4 className="text-sm font-medium text-[#EAECEF] mb-2">Additional Details</h4>
                  <div className="space-y-2">
                    {selectedTransaction.metadata.direction && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#848E9C]">Direction:</span>
                        <Badge className={selectedTransaction.metadata.direction === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                          {selectedTransaction.metadata.direction.toUpperCase()}
                        </Badge>
                      </div>
                    )}
                    {selectedTransaction.metadata.leverage && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#848E9C]">Leverage:</span>
                        <Badge className="bg-[#F0B90B]/20 text-[#F0B90B]">{selectedTransaction.metadata.leverage}x</Badge>
                      </div>
                    )}
                    {selectedTransaction.metadata.timeFrame && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#848E9C]">Time Frame:</span>
                        <span className="text-[#EAECEF]">{selectedTransaction.metadata.timeFrame}s</span>
                      </div>
                    )}
                    {selectedTransaction.metadata.expiresAt && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#848E9C]">Expires:</span>
                        <span className="text-[#EAECEF]">{new Date(selectedTransaction.metadata.expiresAt).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedTransaction.metadata.shouldWin !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#848E9C]">Force Win:</span>
                        <Badge className={selectedTransaction.metadata.shouldWin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}>
                          {selectedTransaction.metadata.shouldWin ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
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
                  copyToClipboard(selectedTransaction.id);
                  setShowDetails(false);
                }}
              >
                Copy ID
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;