import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { adminApiService } from '@/services/admin-api';
import apiService from '@/services/api';
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  EyeOff,
  DollarSign,
  CreditCard,
  BanknoteIcon,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  MoreHorizontal,
  Download,
  Settings,
  Shield,
  AlertCircle,
  Plus,
  Minus
} from 'lucide-react';

interface WalletRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed';
  method: string;
  address: string;
  transactionHash?: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  processedBy?: string;
  processedAt?: string;
  fee?: number;
  notes?: string;
  riskScore: number;
  kycVerified: boolean;
}

interface WalletStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalVolume: number;
  avgProcessingTime: number;
  successRate: number;
  totalFees: number;
  activeWallets: number;
}


const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-500/20 text-yellow-400';
    case 'approved': return 'bg-blue-500/20 text-blue-400';
    case 'processing': return 'bg-purple-500/20 text-purple-400';
    case 'completed': return 'bg-green-500/20 text-green-400';
    case 'rejected': return 'bg-red-500/20 text-red-400';
    case 'failed': return 'bg-red-500/20 text-red-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
};

const getTypeColor = (type: string) => {
  return type === 'deposit' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400';
};

const getRiskColor = (score: number) => {
  if (score < 20) return 'text-green-400';
  if (score < 50) return 'text-yellow-400';
  if (score < 80) return 'text-orange-400';
  return 'text-red-400';
};

export default function WalletManagement() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<WalletRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<WalletRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<WalletRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [showFundDialog, setShowFundDialog] = useState(false);
  const [fundAction, setFundAction] = useState<'add' | 'remove'>('add');
  const [selectedUserForFund, setSelectedUserForFund] = useState<string>('');
  const [fundAmount, setFundAmount] = useState('');
  const [fundCurrency, setFundCurrency] = useState('USD');
  const [fundReason, setFundReason] = useState('');
  const [stats, setStats] = useState<WalletStats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    totalVolume: 0,
    avgProcessingTime: 0,
    successRate: 0,
    totalFees: 0,
    activeWallets: 0
  });

  // Load wallet requests
  const loadWalletRequests = async () => {
    try {
      setLoading(true);
      console.log('🔄 [WalletManagement] Loading wallet requests...');
      
      // Get wallet requests from API
      const walletRequests = await adminApiService.getWalletRequests();
      
      // Get transactions to extract wallet-related data
      const transactions = await adminApiService.getTransactions();
      
      // Transform transactions into wallet request format
      const transformedRequests: WalletRequest[] = transactions
        .filter(tx => tx.type === 'Deposit' || tx.type === 'Withdrawal')
        .map(tx => ({
          id: `wallet-${tx.id}`,
          userId: tx.user_id,
          userEmail: tx.user_email,
          userName: tx.user_email.split('@')[0], // Extract name from email
          type: tx.type.toLowerCase() as 'deposit' | 'withdrawal',
          amount: Math.abs(tx.amount),
          currency: 'USD', // Default currency
          status: tx.status === 'Completed' ? 'completed' : 
                  tx.status === 'Pending' ? 'pending' : 
                  tx.status === 'Failed' ? 'rejected' : 'pending',
          walletAddress: `wallet-${tx.user_id.slice(0, 8)}`,
          blockchain: 'Ethereum', // Default blockchain
          transactionHash: tx.id,
          fee: tx.fee,
          riskScore: 25, // Default risk score
          createdAt: tx.created_at,
          processedAt: tx.status === 'Completed' ? tx.updated_at : undefined,
          notes: `${tx.type} transaction for ${tx.asset}`,
          method: 'blockchain' as const,
          address: `0x${tx.user_id.slice(0, 8)}...`, // Mock address
          description: `${tx.type} of ${tx.asset}`,
          updatedAt: tx.updated_at,
          kycVerified: true, // Default to true
          metadata: {
            asset: tx.asset,
            value: tx.value,
            details: tx.details
          }
        }));
      
      console.log('✅ [WalletManagement] Loaded wallet requests:', transformedRequests.length);
      setRequests(transformedRequests);
      setFilteredRequests(transformedRequests);
      calculateStats(transformedRequests);
    } catch (error) {
      console.error('❌ [WalletManagement] Error loading wallet requests:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (requestData: WalletRequest[]) => {
    const stats: WalletStats = {
      totalRequests: requestData.length,
      pendingRequests: requestData.filter(r => r.status === 'pending').length,
      approvedRequests: requestData.filter(r => r.status === 'approved').length,
      rejectedRequests: requestData.filter(r => r.status === 'rejected').length,
      totalVolume: requestData.reduce((sum, r) => sum + r.amount, 0),
      avgProcessingTime: 0, // TODO: Calculate from actual data
      successRate: requestData.length > 0 ? (requestData.filter(r => r.status === 'completed').length / requestData.length) * 100 : 0,
      totalFees: requestData.reduce((sum, r) => sum + (r.fee || 0), 0),
      activeWallets: 0 // TODO: Get from actual API
    };
    setStats(stats);
  };

  // Filter requests
  useEffect(() => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter(req =>
        req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(req => req.type === typeFilter);
    }

    if (currencyFilter !== 'all') {
      filtered = filtered.filter(req => req.currency === currencyFilter);
    }

    console.log('🔍 [WalletManagement] Filtered requests:', filtered.length);
    setFilteredRequests(filtered);
  }, [requests, searchTerm, statusFilter, typeFilter, currencyFilter]);

  // Handle request approval
  const handleApprove = async (requestId: string) => {
    try {
      console.log('👍 [WalletManagement] Approving request:', requestId);
      
      // Find the request being approved
      const request = requests.find(req => req.id === requestId);
      if (!request) {
        console.error('❌ [WalletManagement] Request not found:', requestId);
        toast({
          title: "Error",
          description: "Request not found",
          variant: "destructive",
        });
        return;
      }

      console.log('💰 [WalletManagement] Processing approved request:', {
        requestId: request.id,
        type: request.type,
        amount: request.amount,
        currency: request.currency,
        userId: request.userId
      });

      // Update request status to approved first
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'approved', processedAt: new Date().toISOString() }
          : req
      ));

      // Automatically process the wallet balance change
      if (request.type === 'deposit') {
        console.log('➕ [WalletManagement] Adding funds to wallet for approved deposit');
        await apiService.adminAddFunds(
          request.userId, 
          request.amount, 
          request.currency, 
          'Approved deposit request'
        );
        toast({
          title: "Deposit Approved & Processed",
          description: `${request.currency} ${request.amount.toLocaleString()} has been added to user wallet`,
        });
      } else if (request.type === 'withdrawal') {
        console.log('➖ [WalletManagement] Removing funds from wallet for approved withdrawal');
        await apiService.adminRemoveFunds(
          request.userId, 
          request.amount, 
          request.currency, 
          'Approved withdrawal request'
        );
        toast({
          title: "Withdrawal Approved & Processed",
          description: `${request.currency} ${request.amount.toLocaleString()} has been removed from user wallet`,
        });
      }

      // Update request status to completed after processing
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'completed', processedAt: new Date().toISOString() }
          : req
      ));

      console.log('✅ [WalletManagement] Request approved and processed successfully');
      
    } catch (error) {
      console.error('💥 [WalletManagement] Failed to approve request:', error);
      // Revert the request status back to pending if processing failed
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'pending' }
          : req
      ));
      toast({
        title: "Error",
        description: `Failed to approve request: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // Handle request rejection
  const handleReject = async (requestId: string, notes?: string) => {
    try {
      // Update request status
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'rejected', processedAt: new Date().toISOString(), notes }
          : req
      ));

      console.log('🚫 [WalletManagement] Request rejected:', requestId);
      setShowNotesDialog(false);
      setNotes('');

      toast({
        title: "Request Rejected",
        description: "Wallet request has been rejected",
      });
    } catch (error) {
      console.error('💥 [WalletManagement] Failed to reject request:', error);
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      });
    }
  };

  // Handle processing
  const handleProcess = async (requestId: string) => {
    try {
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'processing' }
          : req
      ));

      // Simulate processing
      setTimeout(() => {
        setRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'completed', processedAt: new Date().toISOString() }
            : req
        ));
      }, 3000);

      console.log('🔄 [WalletManagement] Processing started:', requestId);
      toast({
        title: "Processing Started",
        description: "Wallet request is being processed",
      });
    } catch (error) {
      console.error('💥 [WalletManagement] Failed to process request:', error);
      toast({
        title: "Error",
        description: "Failed to process request",
        variant: "destructive",
      });
    }
  };

  // Handle manual fund management
  const handleFundManagement = async () => {
    console.log('🔄 [WalletManagement] Starting fund management operation', {
      action: fundAction,
      userId: selectedUserForFund,
      amount: fundAmount,
      currency: fundCurrency,
      reason: fundReason
    });

    if (!selectedUserForFund || !fundAmount || parseFloat(fundAmount) <= 0) {
      const errorMsg = 'Please fill in all fields correctly';
      console.error('❌ [WalletManagement] Validation failed:', {
        hasUserId: !!selectedUserForFund,
        hasAmount: !!fundAmount,
        amountValid: parseFloat(fundAmount) > 0
      });
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    try {
      const amount = parseFloat(fundAmount);
      console.log('💰 [WalletManagement] Processing fund operation:', {
        action: fundAction,
        amount,
        currency: fundCurrency,
        userId: selectedUserForFund
      });
      
      if (fundAction === 'add') {
        console.log('➕ [WalletManagement] Calling adminAddFunds API');
        await apiService.adminAddFunds(selectedUserForFund, amount, fundCurrency, fundReason);
        console.log('✅ [WalletManagement] Successfully added funds');
        toast({
          title: "Funds Added",
          description: `Added ${fundCurrency} ${amount.toLocaleString()} to user wallet`,
        });
      } else {
        console.log('➖ [WalletManagement] Calling adminRemoveFunds API');
        await apiService.adminRemoveFunds(selectedUserForFund, amount, fundCurrency, fundReason);
        console.log('✅ [WalletManagement] Successfully removed funds');
        toast({
          title: "Funds Removed",
          description: `Removed ${fundCurrency} ${amount.toLocaleString()} from user wallet`,
        });
      }
      
      setShowFundDialog(false);
      setSelectedUserForFund('');
      setFundAmount('');
      setFundCurrency('USD');
      setFundReason('');
      
      console.log('🔄 [WalletManagement] Refreshing wallet data...');
      // Refresh data
      loadWalletRequests();
    } catch (error) {
      console.error('💥 [WalletManagement] Fund operation failed:', {
        error: error,
        message: error.message,
        stack: error.stack,
        action: fundAction,
        userId: selectedUserForFund,
        amount: fundAmount,
        currency: fundCurrency
      });
      toast({
        title: "Error",
        description: `Failed to ${fundAction} funds: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // Open fund dialog with user pre-selected
  const openFundDialog = (userId: string, action: 'add' | 'remove') => {
    setSelectedUserForFund(userId);
    setFundAction(action);
    setShowFundDialog(true);
  };

  useEffect(() => {
    loadWalletRequests();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-[#2B3139] rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-[#2B3139] rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-[#2B3139] rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[#2B3139] rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-[#2B3139] rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#EAECEF]">Wallet Management</h1>
          <p className="text-[#848E9C]">Manage wallet deposits, withdrawals, and transactions</p>
        </div>
        <Button onClick={loadWalletRequests} className="bg-[#F0B90B] text-black hover:bg-yellow-400">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#1E2329] border border-[#2B3139]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#848E9C]">Total Requests</p>
                <p className="text-2xl font-bold text-[#EAECEF]">{stats.totalRequests}</p>
              </div>
              <Wallet className="w-8 h-8 text-[#F0B90B]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E2329] border border-[#2B3139]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#848E9C]">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.pendingRequests}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E2329] border border-[#2B3139]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#848E9C]">Total Volume</p>
                <p className="text-2xl font-bold text-[#EAECEF]">${stats.totalVolume.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E2329] border border-[#2B3139]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#848E9C]">Success Rate</p>
                <p className="text-2xl font-bold text-green-400">{stats.successRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-[#1E2329] border border-[#2B3139]">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 text-[#848E9C] transform -translate-y-1/2" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search requests..."
                  className="pl-10 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="withdrawal">Withdrawals</SelectItem>
                </SelectContent>
              </Select>

              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="BTC">BTC</SelectItem>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card className="bg-[#1E2329] border border-[#2B3139]">
        <CardHeader>
          <CardTitle className="text-[#EAECEF]">Wallet Requests</CardTitle>
          <CardDescription className="text-[#848E9C]">
            Showing {filteredRequests.length} of {requests.length} requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2B3139]">
                  <TableHead className="text-[#848E9C]">ID</TableHead>
                  <TableHead className="text-[#848E9C]">User</TableHead>
                  <TableHead className="text-[#848E9C]">Type</TableHead>
                  <TableHead className="text-[#848E9C]">Amount</TableHead>
                  <TableHead className="text-[#848E9C]">Method</TableHead>
                  <TableHead className="text-[#848E9C]">Status</TableHead>
                  <TableHead className="text-[#848E9C]">Risk</TableHead>
                  <TableHead className="text-[#848E9C]">KYC</TableHead>
                  <TableHead className="text-[#848E9C]">Date</TableHead>
                  <TableHead className="text-[#848E9C]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id} className="border-[#2B3139] hover:bg-[#181A20]/50">
                    <TableCell className="text-[#EAECEF] font-mono text-xs">{request.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium text-[#EAECEF]">{request.userName}</div>
                        <div className="text-xs text-[#848E9C]">{request.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(request.type)}>
                        {request.type === 'deposit' ? (
                          <ArrowDownLeft className="w-3 h-3 mr-1" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3 mr-1" />
                        )}
                        {request.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#EAECEF]">
                      {request.currency} {request.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-[#848E9C] text-sm">{request.method}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${getRiskColor(request.riskScore)}`}>
                        {request.riskScore}
                      </span>
                    </TableCell>
                    <TableCell>
                      {request.kycVerified ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                    </TableCell>
                    <TableCell className="text-[#848E9C] text-sm">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-[#848E9C] hover:text-[#F0B90B]"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetails(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {request.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-green-400 hover:text-green-300"
                              onClick={() => handleApprove(request.id)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowNotesDialog(true);
                              }}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {request.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300"
                            onClick={() => handleProcess(request.id)}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-green-400 hover:text-green-300"
                          onClick={() => openFundDialog(request.userId, 'add')}
                          title="Add funds to user wallet"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-orange-400 hover:text-orange-300"
                          onClick={() => openFundDialog(request.userId, 'remove')}
                          title="Remove funds from user wallet"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Request Details Dialog */}
      {selectedRequest && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="bg-[#1E2329] text-[#EAECEF] max-w-2xl">
            <DialogHeader>
              <DialogTitle>Request Details</DialogTitle>
              <DialogDescription>
                Review wallet request information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Request ID</Label>
                  <Input value={selectedRequest.id} readOnly className="bg-[#181A20] border-[#2B3139]" />
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>User</Label>
                  <Input value={`${selectedRequest.userName} (${selectedRequest.userEmail})`} readOnly className="bg-[#181A20] border-[#2B3139]" />
                </div>
                <div>
                  <Label>Type</Label>
                  <Badge className={getTypeColor(selectedRequest.type)}>
                    {selectedRequest.type}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount</Label>
                  <Input value={`${selectedRequest.currency} ${selectedRequest.amount.toLocaleString()}`} readOnly className="bg-[#181A20] border-[#2B3139]" />
                </div>
                <div>
                  <Label>Method</Label>
                  <Input value={selectedRequest.method} readOnly className="bg-[#181A20] border-[#2B3139]" />
                </div>
              </div>

              <div>
                <Label>Address</Label>
                <Input value={selectedRequest.address} readOnly className="bg-[#181A20] border-[#2B3139]" />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea value={selectedRequest.description} readOnly className="bg-[#181A20] border-[#2B3139]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Risk Score</Label>
                  <span className={`text-sm font-medium ${getRiskColor(selectedRequest.riskScore)}`}>
                    {selectedRequest.riskScore}
                  </span>
                </div>
                <div>
                  <Label>KYC Verified</Label>
                  {selectedRequest.kycVerified ? (
                    <Badge className="bg-green-500/20 text-green-400">Verified</Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-400">Not Verified</Badge>
                  )}
                </div>
              </div>

              {selectedRequest.notes && (
                <div>
                  <Label>Notes</Label>
                  <Textarea value={selectedRequest.notes} readOnly className="bg-[#181A20] border-[#2B3139]" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Created</Label>
                  <Input value={new Date(selectedRequest.createdAt).toLocaleString()} readOnly className="bg-[#181A20] border-[#2B3139]" />
                </div>
                {selectedRequest.processedAt && (
                  <div>
                    <Label>Processed</Label>
                    <Input value={new Date(selectedRequest.processedAt).toLocaleString()} readOnly className="bg-[#181A20] border-[#2B3139]" />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetails(false)}>
                Close
              </Button>
              {selectedRequest.status === 'pending' && (
                <>
                  <Button onClick={() => handleApprove(selectedRequest.id)} className="bg-green-600 hover:bg-green-700">
                    Approve
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      setShowDetails(false);
                      setShowNotesDialog(true);
                    }}
                  >
                    Reject
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Rejection Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="bg-[#1E2329] text-[#EAECEF]">
          <DialogHeader>
            <DialogTitle>Rejection Reason</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason for Rejection</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter rejection reason..."
                className="bg-[#181A20] border-[#2B3139]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotesDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedRequest && handleReject(selectedRequest.id, notes)}
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fund Management Dialog */}
      <Dialog open={showFundDialog} onOpenChange={setShowFundDialog}>
        <DialogContent className="bg-[#1E2329] text-[#EAECEF]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {fundAction === 'add' ? (
                <>
                  <Plus className="w-5 h-5 text-green-400" />
                  Add Funds to User Wallet
                </>
              ) : (
                <>
                  <Minus className="w-5 h-5 text-orange-400" />
                  Remove Funds from User Wallet
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {fundAction === 'add' 
                ? 'Add funds to a user wallet manually' 
                : 'Remove funds from a user wallet manually'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>User ID</Label>
              <Input 
                value={selectedUserForFund} 
                readOnly 
                className="bg-[#181A20] border-[#2B3139]" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </div>
              <div>
                <Label>Currency</Label>
                <Select value={fundCurrency} onValueChange={setFundCurrency}>
                  <SelectTrigger className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="BTC">BTC</SelectItem>
                    <SelectItem value="ETH">ETH</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Reason</Label>
              <Textarea
                value={fundReason}
                onChange={(e) => setFundReason(e.target.value)}
                placeholder={`Reason for ${fundAction}ing funds...`}
                className="bg-[#181A20] border-[#2B3139]"
              />
            </div>

            {fundAction === 'remove' && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Warning</span>
                </div>
                <p className="text-xs text-red-300 mt-1">
                  Removing funds will decrease the user's wallet balance. This action cannot be undone.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFundDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleFundManagement}
              className={fundAction === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}
            >
              {fundAction === 'add' ? 'Add Funds' : 'Remove Funds'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
