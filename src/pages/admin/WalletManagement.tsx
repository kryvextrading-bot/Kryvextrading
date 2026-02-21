import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { adminApiService } from '@/services/admin-api';
import { walletApiService } from '@/services/wallet-api-new';
import { depositService } from '@/services/depositService';
import BalanceSyncService from '@/services/balance-sync';
import DepositSlip from '@/components/DepositSlip';
import { cn } from '@/lib/utils';
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
  Users,
  Calendar,
  MoreHorizontal,
  Download,
  Settings,
  Shield,
  AlertCircle,
  Plus,
  Minus,
  Copy,
  Check,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  FileText,
  Hash,
  Link,
  ExternalLink,
  QrCode,
  Scan,
  Zap,
  Activity,
  PieChart,
  BarChart3,
  LineChart,
  Globe,
  Lock,
  UserCheck,
  UserX,
  Fingerprint,
  Key,
  ShieldAlert,
  Bell,
  Home,
  Briefcase,
  CreditCard,
  Send,
  Upload,
  Trash2,
  Edit,
  Save,
  X,
  Menu,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  TrendingDown,
  BadgeCheck,
  BadgeX,
} from 'lucide-react';

// ==================== TYPES ====================
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
  network?: string;
  proofUrl?: string;
  metadata?: Record<string, any>;
}

interface WalletStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  completedRequests: number;
  totalVolume: number;
  avgProcessingTime: number;
  successRate: number;
  totalFees: number;
  activeWallets: number;
}

interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  firstName?: string;
  lastName?: string;
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

// ==================== HELPER FUNCTIONS ====================
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatCompactCurrency = (value: number): string => {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
};

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
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

const getStatusColor = (status: string): string => {
  const statusLower = status?.toLowerCase() || '';
  switch (statusLower) {
    case 'pending':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'approved':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'processing':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'completed':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'rejected':
    case 'failed':
      return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const getStatusIcon = (status: string) => {
  const statusLower = status?.toLowerCase() || '';
  switch (statusLower) {
    case 'pending':
      return Clock;
    case 'approved':
      return CheckCircle;
    case 'processing':
      return RefreshCw;
    case 'completed':
      return CheckCircle;
    case 'rejected':
    case 'failed':
      return XCircle;
    default:
      return AlertCircle;
  }
};

const getTypeColor = (type: string): string => {
  const typeLower = type?.toLowerCase() || '';
  return typeLower === 'deposit' 
    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
    : 'bg-rose-500/20 text-rose-400 border-rose-500/30';
};

const getTypeIcon = (type: string) => {
  const typeLower = type?.toLowerCase() || '';
  return typeLower === 'deposit' ? ArrowDownLeft : ArrowUpRight;
};

const getNetworkDisplay = (method: string, network?: string): string => {
  if (!method && !network) return 'Unknown';
  
  // Map common network names to display format
  const networkMap: Record<string, string> = {
    'TRC20': 'TRC-20 (Tron)',
    'ERC20': 'ERC-20 (Ethereum)',
    'BEP20': 'BEP-20 (BSC)',
    'SOL': 'Solana',
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'BNB': 'Binance Coin',
    'XRP': 'Ripple',
    'ADA': 'Cardano',
    'DOGE': 'Dogecoin',
    'bank_transfer': 'Bank Transfer',
    'admin': 'Admin Action'
  };
  
  const displayKey = network || method;
  return networkMap[displayKey] || displayKey;
};

const getRiskColor = (score: number): string => {
  if (score < 20) return 'text-emerald-400';
  if (score < 50) return 'text-amber-400';
  if (score < 80) return 'text-orange-400';
  return 'text-rose-400';
};

const getRiskBadge = (score: number): string => {
  if (score < 20) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (score < 50) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  if (score < 80) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
};

const getRiskLabel = (score: number): string => {
  if (score < 20) return 'Low Risk';
  if (score < 50) return 'Medium Risk';
  if (score < 80) return 'High Risk';
  return 'Critical Risk';
};

const truncateHash = (hash: string, chars = 8): string => {
  if (!hash) return '';
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
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

// ==================== REQUEST DETAILS DIALOG ====================
const RequestDetailsDialog = ({ request, open, onClose, onApprove, onReject, onDownloadSlip }: any) => {
  if (!request) return null;

  const StatusIcon = getStatusIcon(request.status);
  const TypeIcon = getTypeIcon(request.type);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F0B90B] to-[#d4a10b] flex items-center justify-center">
              <Wallet className="w-4 h-4 text-black" />
            </div>
            Wallet Request Details
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Complete information for request {request.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                request.type === 'deposit' ? 'bg-emerald-500/20' : 'bg-rose-500/20'
              )}>
                <TypeIcon className={cn(
                  "w-6 h-6",
                  request.type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'
                )} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Request ID</p>
                <p className="text-lg font-mono text-white">{request.id}</p>
              </div>
            </div>
            <Badge className={getStatusColor(request.status)}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {request.status}
            </Badge>
          </div>

          <Separator className="bg-gray-700" />

          {/* User Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">User Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Name</p>
                <p className="text-sm font-medium text-white">{request.userName}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="text-sm font-medium text-white">{request.userEmail}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">User ID</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono text-white">{request.userId.slice(0, 8)}...</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => handleCopy(request.userId)}
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">KYC Status</p>
                {request.kycVerified ? (
                  <Badge className="bg-emerald-500/20 text-emerald-400">
                    <BadgeCheck className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge className="bg-rose-500/20 text-rose-400">
                    <BadgeX className="w-3 h-3 mr-1" />
                    Not Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Transaction Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Type</p>
                <Badge className={getTypeColor(request.type)}>
                  <TypeIcon className="w-3 h-3 mr-1" />
                  {request.type}
                </Badge>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Network</p>
                <p className="text-sm font-medium text-white">
                  {getNetworkDisplay(request.method, request.network)}
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Amount</p>
                <p className="text-lg font-bold text-white">
                  {request.currency} {request.amount.toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Fee</p>
                <p className="text-sm font-medium text-white">
                  {request.fee ? `${request.currency} ${request.fee}` : 'No fee'}
                </p>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-3">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-500">Wallet Address</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => handleCopy(request.address)}
                >
                  {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  Copy
                </Button>
              </div>
              <p className="text-sm font-mono text-white break-all">{request.address}</p>
            </div>

            {request.transactionHash && (
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500">Transaction Hash</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={() => window.open(`https://etherscan.io/tx/${request.transactionHash}`, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View on Explorer
                  </Button>
                </div>
                <p className="text-sm font-mono text-white break-all">{request.transactionHash}</p>
              </div>
            )}
          </div>

          {/* Proof URL for user deposits */}
          {request.proofUrl && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Payment Proof</h3>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <a 
                  href={request.proofUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-2 break-all"
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  {request.proofUrl}
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            </div>
          )}

          {/* Description */}
          {request.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Description</h3>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-sm text-white">{request.description}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {request.notes && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Notes</h3>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-sm text-white">{request.notes}</p>
              </div>
            </div>
          )}

          {/* Risk Assessment */}
          {request.riskScore > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Risk Assessment</h3>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Risk Score</span>
                  <Badge className={getRiskBadge(request.riskScore)}>
                    {request.riskScore} - {getRiskLabel(request.riskScore)}
                  </Badge>
                </div>
                <Progress 
                  value={request.riskScore} 
                  className="h-2 bg-gray-700"
                />
                <div className="flex justify-between mt-1 text-xs">
                  <span className="text-emerald-400">Low</span>
                  <span className="text-amber-400">Medium</span>
                  <span className="text-orange-400">High</span>
                  <span className="text-rose-400">Critical</span>
                </div>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Timeline</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Created</p>
                <p className="text-sm text-white">{formatDate(request.createdAt)}</p>
              </div>
              {request.processedAt && (
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Processed</p>
                  <p className="text-sm text-white">{formatDate(request.processedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          {request.metadata && Object.keys(request.metadata).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Additional Data</h3>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <pre className="text-xs text-gray-400 overflow-auto max-h-40">
                  {JSON.stringify(request.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Close
          </Button>
          
          {(request.status === 'completed' || request.status === 'approved') && (
            <Button
              onClick={() => onDownloadSlip(request)}
              className="bg-gradient-to-r from-[#F0B90B] to-[#F0B90B]/80 text-black hover:from-yellow-400 hover:to-yellow-500"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Receipt
            </Button>
          )}
          
          {request.status === 'pending' && (
            <>
              <Button
                onClick={() => onApprove(request.id)}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => onReject(request)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ==================== REJECTION DIALOG ====================
const RejectionDialog = ({ open, onClose, onConfirm }: any) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason);
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-400" />
            Reject Request
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Please provide a reason for rejecting this request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-400 font-medium mb-1">Warning</p>
                <p className="text-xs text-gray-400">
                  Rejecting this request will notify the user and prevent the transaction from being processed.
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-gray-400">Rejection Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="bg-gray-800/50 border-gray-700 text-white mt-2"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim()}
          >
            Reject Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ==================== FUND MANAGEMENT DIALOG ====================
const FundManagementDialog = ({ open, onClose, onConfirm, action, users, preSelectedUserId }: any) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USDT');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (preSelectedUserId && selectedUserId !== preSelectedUserId) {
      setSelectedUserId(preSelectedUserId);
    }
  }, [preSelectedUserId, selectedUserId]);

  const handleConfirm = () => {
    onConfirm({ userId: selectedUserId, amount: parseFloat(amount), currency, reason });
    setSelectedUserId('');
    setAmount('');
    setCurrency('USDT');
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action === 'add' ? (
              <>
                <Plus className="w-5 h-5 text-emerald-400" />
                Add Funds to Wallet
              </>
            ) : (
              <>
                <Minus className="w-5 h-5 text-rose-400" />
                Remove Funds from Wallet
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            {action === 'add' 
              ? 'Manually add funds to a user wallet' 
              : 'Manually remove funds from a user wallet'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-gray-400">Select User</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white mt-2">
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                {users.map((user: any) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.first_name || ''} {user.last_name || ''}</div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-400">Amount</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="bg-gray-800/50 border-gray-700 text-white mt-2"
              />
            </div>
            <div>
              <Label className="text-gray-400">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="BTC">BTC</SelectItem>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="SOL">SOL</SelectItem>
                  <SelectItem value="BNB">BNB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-gray-400">Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Reason for ${action}ing funds...`}
              className="bg-gray-800/50 border-gray-700 text-white mt-2"
              rows={3}
            />
          </div>

          {action === 'remove' && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-rose-400 font-medium mb-1">Warning</p>
                  <p className="text-xs text-gray-400">
                    Removing funds will decrease the user's wallet balance. This action cannot be undone.
                    Please verify the user has sufficient balance before proceeding.
                  </p>
                </div>
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
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedUserId || !amount || parseFloat(amount) <= 0 || !reason.trim()}
            className={action === 'add' 
              ? 'bg-emerald-500 hover:bg-emerald-600' 
              : 'bg-rose-500 hover:bg-rose-600'
            }
          >
            {action === 'add' ? 'Add Funds' : 'Remove Funds'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ==================== MAIN COMPONENT ====================
export default function WalletManagement() {
  const { toast } = useToast();
  
  // State
  const [requests, setRequests] = useState<WalletRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<WalletRequest[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Selection
  const [selectedRequest, setSelectedRequest] = useState<WalletRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [showFundDialog, setShowFundDialog] = useState(false);
  const [fundAction, setFundAction] = useState<'add' | 'remove'>('add');
  const [selectedUserForFund, setSelectedUserForFund] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [fundAmount, setFundAmount] = useState<string>('');
  const [fundCurrency, setFundCurrency] = useState<string>('USDT');
  
  // Transaction Slip State
  const [showTransactionSlip, setShowTransactionSlip] = useState(false);
  const [transactionSlipData, setTransactionSlipData] = useState<any>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [networkFilter, setNetworkFilter] = useState('all');
  
  // Stats
  const [stats, setStats] = useState<WalletStats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    completedRequests: 0,
    totalVolume: 0,
    avgProcessingTime: 0,
    successRate: 0,
    totalFees: 0,
    activeWallets: 0
  });

  // Load users for dropdown
  const loadUsers = async () => {
    try {
      const usersResponse = await adminApiService.getUsers();
      const usersData = usersResponse.data || [];
      
      // Normalize user data
      const normalizedUsers = usersData.map((user: any) => ({
        id: user.id,
        first_name: user.first_name || user.firstName || '',
        last_name: user.last_name || user.lastName || '',
        email: user.email || '',
        firstName: user.first_name || user.firstName || '',
        lastName: user.last_name || user.lastName || ''
      }));
      
      setUsers(normalizedUsers);
    } catch (error) {
      console.error('❌ [WalletManagement] Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    }
  };

  // Load wallet requests
  const loadWalletRequests = async () => {
    try {
      setLoading(true);
      
      // Get wallet requests from our new wallet API service (includes admin actions)
      const walletRequests = await walletApiService.getWalletRequests();
      
      // Get deposit requests from Supabase using depositService
      let depositRequests = [];
      try {
        const result = await depositService.getAllDepositRequests();
        if (result.success && result.data) {
          depositRequests = result.data;
        } else if (result.error) {
          console.error('Error fetching deposit requests:', result.error);
        }
      } catch (error) {
        console.error('Error fetching deposit requests:', error);
      }
      
      // Transform Supabase deposit requests to wallet request format
      const transformedDepositRequests: WalletRequest[] = depositRequests.map((req: any) => ({
        id: req.id,
        userId: req.user_id,
        userEmail: req.user_email,
        userName: req.user_name || req.user_email?.split('@')[0] || 'Unknown',
        type: 'deposit',
        amount: req.amount,
        currency: req.currency || 'USD',
        status: req.status?.toLowerCase() || 'pending',
        method: req.method || req.network || 'crypto',
        network: req.network || req.method,
        address: req.address || '',
        transactionHash: req.transaction_hash,
        description: req.description || `Deposit request - ${req.amount} ${req.currency}`,
        fee: req.fee || 0,
        riskScore: req.risk_score || 0,
        kycVerified: req.kyc_verified || false,
        processedBy: req.processed_by,
        processedAt: req.processed_at,
        createdAt: req.created_at,
        updatedAt: req.updated_at,
        proofUrl: req.proof_url,
        notes: req.admin_notes,
        metadata: req.metadata || {}
      }));
      
      // Transform database wallet requests to match frontend interface
      const transformedDatabaseRequests = walletRequests.map((req: any) => ({
        id: req.id,
        userId: req.user_id,
        userEmail: req.user?.email || 'unknown@example.com',
        userName: req.user ? 
          `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || 
          req.user.email?.split('@')[0] || 'Unknown' : 'Unknown',
        type: req.type,
        amount: parseFloat(req.amount),
        currency: req.currency,
        status: req.status?.toLowerCase() || 'pending',
        method: req.method || 'admin',
        network: req.network,
        address: req.address,
        transactionHash: req.transaction_hash,
        description: req.description || `${req.type} request`,
        fee: parseFloat(req.fee || 0),
        riskScore: req.risk_score || 0,
        kycVerified: true,
        processedBy: req.processed_by,
        processedAt: req.processed_at,
        createdAt: req.created_at,
        updatedAt: req.updated_at,
        notes: req.admin_notes,
        metadata: req.metadata || {}
      }));
      
      // Combine all requests
      const allRequests = [...transformedDatabaseRequests, ...transformedDepositRequests];
      
      // Sort by date (newest first)
      allRequests.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      console.log('📊 [WalletManagement] Total requests loaded:', allRequests.length);
      console.log('📊 [WalletManagement] Deposit requests:', transformedDepositRequests.length);
      console.log('📊 [WalletManagement] Admin requests:', transformedDatabaseRequests.length);
      
      setRequests(allRequests);
      setFilteredRequests(allRequests);
      calculateStats(allRequests);
      
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
      completedRequests: requestData.filter(r => r.status === 'completed').length,
      totalVolume: requestData.reduce((sum, r) => sum + r.amount, 0),
      avgProcessingTime: 0,
      successRate: requestData.length > 0 ? (requestData.filter(r => r.status === 'completed').length / requestData.length) * 100 : 0,
      totalFees: requestData.reduce((sum, r) => sum + (r.fee || 0), 0),
      activeWallets: 0
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
        req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(req => req.type?.toLowerCase() === typeFilter.toLowerCase());
    }

    if (currencyFilter !== 'all') {
      filtered = filtered.filter(req => req.currency === currencyFilter);
    }

    if (networkFilter !== 'all') {
      filtered = filtered.filter(req => 
        (req.network?.toLowerCase() === networkFilter.toLowerCase()) || 
        (req.method?.toLowerCase() === networkFilter.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  }, [requests, searchTerm, statusFilter, typeFilter, currencyFilter, networkFilter]);

  // Handle request approval
  const handleApprove = async (requestId: string) => {
    try {
      const request = requests.find(req => req.id === requestId);
      if (!request) {
        toast({
          title: "Error",
          description: "Request not found",
          variant: "destructive",
        });
        return;
      }

      // Check if this is a deposit request
      const isDepositRequest = request.type === 'deposit';
      
      // Get current admin user ID
      const { data: { user } } = await supabase.auth.getUser();
      const adminId = user?.id || 'admin';
      
      if (isDepositRequest) {
        // Update deposit request status
        const { error } = await supabase
          .from('deposit_requests')
          .update({ 
            status: 'Approved',
            processed_at: new Date().toISOString(),
            processed_by: adminId,
            admin_notes: 'Approved by admin'
          })
          .eq('id', requestId);

        if (error) throw error;

        // Add funds to user wallet
        await walletApiService.adminAddFunds(
          request.userId, 
          request.amount, 
          request.currency, 
          `Approved deposit: ${request.description}`
        );
        
        // Update local state
        setRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'completed', processedAt: new Date().toISOString() }
            : req
        ));
        
        toast({
          title: "Deposit Approved",
          description: `${request.currency} ${request.amount.toLocaleString()} has been added to user wallet`,
        });
        
        // Show transaction slip
        const slipData = {
          transactionId: request.id,
          date: new Date().toISOString(),
          time: new Date().toISOString(),
          asset: request.currency,
          status: 'Completed' as const,
          amount: request.amount,
          amountUsd: request.amount,
          userName: request.userName,
          userEmail: request.userEmail,
          network: request.network || request.method,
          address: request.address,
          type: 'deposit' as const,
          fee: request.fee
        };
        
        setTransactionSlipData(slipData);
        setShowTransactionSlip(true);
        
      } else {
        // Handle withdrawal
        await walletApiService.adminRemoveFunds(
          request.userId, 
          request.amount, 
          request.currency, 
          `Approved withdrawal: ${request.description}`
        );
        
        setRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'completed', processedAt: new Date().toISOString() }
            : req
        ));
        
        toast({
          title: "Withdrawal Approved",
          description: `${request.currency} ${request.amount.toLocaleString()} has been processed`,
        });
        
        // Show transaction slip for withdrawal
        const slipData = {
          transactionId: request.id,
          date: new Date().toISOString(),
          time: new Date().toISOString(),
          asset: request.currency,
          status: 'Completed' as const,
          amount: request.amount,
          amountUsd: request.amount,
          userName: request.userName,
          userEmail: request.userEmail,
          network: request.network || request.method,
          address: request.address,
          type: 'withdrawal' as const,
          fee: request.fee
        };
        
        setTransactionSlipData(slipData);
        setShowTransactionSlip(true);
      }
      
    } catch (error) {
      console.error('❌ [WalletManagement] Error approving request:', error);
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive",
      });
    }
  };

  // Handle request rejection
  const handleReject = async (requestId: string, reason: string) => {
    try {
      const request = requests.find(req => req.id === requestId);
      if (!request) return;

      const { data: { user } } = await supabase.auth.getUser();

      if (request.type === 'deposit') {
        // Update deposit request status
        const { error } = await supabase
          .from('deposit_requests')
          .update({ 
            status: 'Rejected',
            processed_at: new Date().toISOString(),
            processed_by: user?.id,
            admin_notes: reason
          })
          .eq('id', requestId);

        if (error) throw error;
      }

      // Update local state
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'rejected', notes: reason, processedAt: new Date().toISOString() }
          : req
      ));

      toast({
        title: "Request Rejected",
        description: `${request.currency} ${request.amount} request has been rejected`,
      });

      setShowRejectionDialog(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('❌ [WalletManagement] Error rejecting request:', error);
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      });
    }
  };

  // Handle download slip
  const handleDownloadSlip = (request: WalletRequest) => {
    const slipData = {
      transactionId: request.id,
      date: request.processedAt || request.updatedAt,
      time: request.processedAt || request.updatedAt,
      asset: request.currency,
      status: 'Completed' as const,
      amount: request.amount,
      amountUsd: request.amount,
      userName: request.userName,
      userEmail: request.userEmail,
      network: request.network || request.method,
      address: request.address,
      type: request.type,
      fee: request.fee
    };
    
    setTransactionSlipData(slipData);
    setShowTransactionSlip(true);
  };

  // Handle fund action
  const handleFundAction = async () => {
    try {
      if (!selectedUser || !fundAction || !fundAmount) return;
      
      const amount = parseFloat(fundAmount);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid amount",
          variant: "destructive",
        });
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (fundAction === 'add') {
        await walletApiService.adminAddFunds(
          selectedUser.id, 
          amount, 
          fundCurrency, 
          `Admin manual fund addition`
        );
        
        // Create request record
        await supabase
          .from('wallet_requests')
          .insert({
            user_id: selectedUser.id,
            type: 'deposit',
            amount,
            currency: fundCurrency,
            status: 'completed',
            method: 'admin',
            address: 'admin-action',
            description: 'Admin manual fund addition',
            processed_by: user?.id,
            processed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        toast({
          title: "Funds Added",
          description: `${fundCurrency} ${amount.toLocaleString()} has been added to user wallet`,
        });
      } else {
        await walletApiService.adminRemoveFunds(
          selectedUser.id, 
          amount, 
          fundCurrency, 
          `Admin manual fund removal`
        );
        
        toast({
          title: "Funds Removed",
          description: `${fundCurrency} ${amount.toLocaleString()} has been removed from user wallet`,
        });
      }
      
      setShowFundDialog(false);
      loadWalletRequests();
      
    } catch (error) {
      console.error('❌ [WalletManagement] Error processing fund action:', error);
      toast({
        title: "Error",
        description: "Failed to process fund action",
        variant: "destructive",
      });
    }
  };

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadWalletRequests();
      toast({
        title: "Data Refreshed",
        description: "Wallet requests have been refreshed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Load initial data
  useEffect(() => {
    loadUsers();
    loadWalletRequests();
  }, []);

  // Handle sync all balances
  const handleSyncAllBalances = async () => {
    try {
      setLoading(true);
      await BalanceSyncService.syncAllUsersBalances();
      await refreshData();
      toast({
        title: "Balances Synced",
        description: "All user balances have been synchronized",
      });
    } catch (error) {
      console.error('Failed to sync balances:', error);
      toast({
        title: "Error",
        description: "Failed to sync balances",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get unique networks for filter
  const uniqueNetworks = useMemo(() => {
    const networks = new Set<string>();
    requests.forEach(req => {
      if (req.network) networks.add(req.network);
      if (req.method && req.method !== 'admin' && req.method !== 'bank_transfer') {
        networks.add(req.method);
      }
    });
    return Array.from(networks);
  }, [requests]);

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Wallet Management</h1>
          <p className="text-sm text-gray-400">Manage user wallet requests and transactions</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button 
            onClick={handleSyncAllBalances} 
            disabled={loading} 
            variant="outline" 
            size="sm"
            className="border-green-600 text-green-400 hover:bg-green-600/20 text-xs sm:text-sm flex-1 sm:flex-none"
          >
            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Sync Balances</span>
            <span className="sm:hidden">Sync</span>
          </Button>
          <Button 
            onClick={refreshData} 
            disabled={refreshing} 
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm flex-1 sm:flex-none"
          >
            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards - Mobile Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">Total</p>
                <p className="text-lg sm:text-2xl font-bold text-white">{stats.totalRequests}</p>
              </div>
              <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg">
                <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">Pending</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-400">{stats.pendingRequests}</p>
              </div>
              <div className="bg-yellow-600 p-1.5 sm:p-2 rounded-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">Completed</p>
                <p className="text-lg sm:text-2xl font-bold text-green-400">{stats.completedRequests}</p>
              </div>
              <div className="bg-green-600 p-1.5 sm:p-2 rounded-lg">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">Volume</p>
                <p className="text-lg sm:text-2xl font-bold text-white">{formatCompactCurrency(stats.totalVolume)}</p>
              </div>
              <div className="bg-purple-600 p-1.5 sm:p-2 rounded-lg">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Mobile Responsive */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            {/* Search - Always full width on mobile */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-gray-700 border-gray-600 text-white w-full text-sm"
              />
            </div>

            {/* Filter Row - Scrollable on mobile */}
            <div className="flex overflow-x-auto gap-2 pb-2 sm:pb-0 sm:flex-wrap sm:overflow-visible">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] sm:w-[150px] bg-gray-700 border-gray-600 text-white h-9 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[110px] sm:w-[130px] bg-gray-700 border-gray-600 text-white h-9 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                </SelectContent>
              </Select>

              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger className="w-[100px] sm:w-[120px] bg-gray-700 border-gray-600 text-white h-9 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="BTC">BTC</SelectItem>
                  <SelectItem value="ETH">ETH</SelectItem>
                </SelectContent>
              </Select>

              {uniqueNetworks.length > 0 && (
                <Select value={networkFilter} onValueChange={setNetworkFilter}>
                  <SelectTrigger className="w-[120px] sm:w-[140px] bg-gray-700 border-gray-600 text-white h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="Network" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="all">All Networks</SelectItem>
                    {uniqueNetworks.map(network => (
                      <SelectItem key={network} value={network}>
                        {getNetworkDisplay(network)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button 
                onClick={() => setShowFundDialog(true)} 
                size="sm"
                className="bg-green-600 hover:bg-green-700 h-9 sm:h-10 text-xs sm:text-sm whitespace-nowrap"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Add Funds
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table - Mobile Responsive */}
      <Card className="bg-gray-800 border-gray-700 overflow-hidden">
        <CardContent className="p-0 sm:p-4">
          {/* Desktop Table View - Hidden on mobile */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-400">ID</TableHead>
                  <TableHead className="text-gray-400">User</TableHead>
                  <TableHead className="text-gray-400">Type</TableHead>
                  <TableHead className="text-gray-400">Network</TableHead>
                  <TableHead className="text-gray-400">Amount</TableHead>
                  <TableHead className="text-gray-400">Currency</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Created</TableHead>
                  <TableHead className="text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => {
                  const StatusIcon = getStatusIcon(request.status);
                  const TypeIcon = getTypeIcon(request.type);
                  
                  return (
                    <TableRow key={request.id} className="border-gray-700">
                      <TableCell className="text-white">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-mono">{request.id.slice(0, 8)}...</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => navigator.clipboard.writeText(request.id)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">
                        <div>
                          <div className="font-medium text-sm">{request.userName}</div>
                          <div className="text-xs text-gray-400">{request.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">
                        <Badge className={getTypeColor(request.type)}>
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {request.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">
                        <span className="text-xs">
                          {getNetworkDisplay(request.method, request.network)}
                        </span>
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        {request.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-white">{request.currency}</TableCell>
                      <TableCell className="text-white">
                        <Badge className={getStatusColor(request.status)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white text-sm">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-white">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDetails(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {(request.status === 'completed' || request.status === 'approved') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-[#F0B90B]"
                              onClick={() => handleDownloadSlip(request)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {request.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-green-400 hover:text-green-300"
                                onClick={() => handleApprove(request.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowRejectionDialog(true);
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View - Visible only on mobile */}
          <div className="sm:hidden space-y-3 p-3">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No wallet requests found</p>
              </div>
            ) : (
              filteredRequests.map((request) => {
                const StatusIcon = getStatusIcon(request.status);
                const TypeIcon = getTypeIcon(request.type);
                
                return (
                  <Card key={request.id} className="bg-gray-700/50 border-gray-600">
                    <CardContent className="p-3">
                      {/* Header with ID and Status */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            request.type === 'deposit' ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                          )}>
                            <TypeIcon className={cn(
                              "w-4 h-4",
                              request.type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'
                            )} />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">ID</p>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-mono text-white">{request.id.slice(0, 8)}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                                onClick={() => navigator.clipboard.writeText(request.id)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(request.status)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {request.status}
                        </Badge>
                      </div>

                      {/* User Info */}
                      <div className="mb-2">
                        <p className="text-xs text-gray-400">User</p>
                        <p className="text-sm font-medium text-white">{request.userName}</p>
                        <p className="text-xs text-gray-400">{request.userEmail}</p>
                      </div>

                      {/* Transaction Details Grid */}
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <p className="text-xs text-gray-400">Network</p>
                          <p className="text-xs text-white">
                            {getNetworkDisplay(request.method, request.network)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Amount</p>
                          <p className="text-sm font-bold text-white">
                            {request.amount.toLocaleString()} {request.currency}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Date</p>
                          <p className="text-xs text-white">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Fee</p>
                          <p className="text-xs text-white">
                            {request.fee ? `${request.fee} ${request.currency}` : 'No fee'}
                          </p>
                        </div>
                      </div>

                      {/* Address (if available) */}
                      {request.address && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-400">Address</p>
                          <p className="text-xs font-mono text-white break-all">{request.address}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-gray-600">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetails(true);
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                        
                        {(request.status === 'completed' || request.status === 'approved') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-[#F0B90B]"
                            onClick={() => handleDownloadSlip(request)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Receipt
                          </Button>
                        )}
                        
                        {request.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="h-8 px-2 text-xs bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(request.id)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 px-2 text-xs"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowRejectionDialog(true);
                              }}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Request Details Dialog */}
      <RequestDetailsDialog
        request={selectedRequest}
        open={showDetails}
        onClose={() => setShowDetails(false)}
        onApprove={handleApprove}
        onReject={() => {
          setShowRejectionDialog(true);
          setShowDetails(false);
        }}
        onDownloadSlip={handleDownloadSlip}
      />

      {/* Rejection Dialog */}
      <RejectionDialog
        open={showRejectionDialog}
        onClose={() => {
          setShowRejectionDialog(false);
          setSelectedRequest(null);
        }}
        onConfirm={(reason: string) => {
          if (selectedRequest) {
            handleReject(selectedRequest.id, reason);
          }
        }}
      />

      {/* Fund Management Dialog */}
      <FundManagementDialog
        open={showFundDialog}
        onClose={() => setShowFundDialog(false)}
        onConfirm={handleFundAction}
        action={fundAction}
        users={users}
        preSelectedUserId={selectedUserForFund}
      />

      {/* Transaction Slip Modal */}
      <AnimatePresence>
        {showTransactionSlip && transactionSlipData && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm">
            <div className="min-h-screen px-2 sm:px-4 py-4 sm:py-8">
              <DepositSlip
                data={transactionSlipData}
                onClose={() => {
                  setShowTransactionSlip(false);
                  setTransactionSlipData(null);
                }}
                showCloseButton={true}
                theme="dark"
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}