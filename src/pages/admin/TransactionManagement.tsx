import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { Database } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  AlertTriangle,
  Shield,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Ban,
  Flag,
  FileText,
  User,
  Building,
  Calendar,
  Hash,
  AlertCircle,
  CheckCheck,
  ShieldAlert,
  ShieldCheck,
  Fingerprint,
  Globe,
  Smartphone,
  Laptop,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  PieChart,
  BarChart3,
  Activity,
  Zap,
  Lock,
  Unlock,
  EyeOff,
  Printer,
  Mail,
  MessageSquare,
  History,
  Copy,
  ExternalLink,
  Bell,
  BellOff,
  Radio,
  Wifi,
  WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

// ==================== TYPES ====================
type TransactionType = Database['public']['Tables']['transactions']['Row'];

interface Transaction extends TransactionType {
  userName?: string;
  userType?: 'individual' | 'business' | 'institutional';
  timestamp?: string;
  currency?: string;
  feeCurrency?: string;
  requiresApproval?: boolean;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  riskScore?: number;
  reference?: string;
  description?: string;
  location?: string;
  ipAddress?: string;
  counterparty?: string;
  completedAt?: string;
  approvedAt?: string;
  notes?: string;
  flagged?: boolean;
  deviceInfo?: string;
  browserInfo?: string;
  sessionId?: string;
  twoFactorVerified?: boolean;
  biometricVerified?: boolean;
  voiceVerified?: boolean;
  faceVerified?: boolean;
  smsVerified?: boolean;
  emailVerified?: boolean;
  appVersion?: string;
  osVersion?: string;
  networkType?: string;
  vpnDetected?: boolean;
  proxyDetected?: boolean;
  torDetected?: boolean;
  suspiciousActivity?: boolean;
  fraudScore?: number;
  amlScore?: number;
  kycLevel?: number;
  complianceFlags?: string[];
  regulatoryFlags?: string[];
  sanctionsScreened?: boolean;
  pepScreened?: boolean;
  adverseMediaScreened?: boolean;
  watchlistMatched?: boolean;
  investigationRequired?: boolean;
  manualReviewRequired?: boolean;
  autoApproved?: boolean;
  autoRejected?: boolean;
  priorityLevel?: 'low' | 'medium' | 'high' | 'urgent';
  escalationLevel?: number;
  reviewCount?: number;
  approvalHistory?: {
    timestamp: string;
    reviewer: string;
    action: 'approved' | 'rejected' | 'flagged' | 'escalated';
    reason?: string;
  }[];
  auditTrail?: {
    timestamp: string;
    action: string;
    user: string;
    details?: string;
  }[];
}

interface TransactionStats {
  totalVolume: number;
  totalVolumeChange: number;
  totalTransactions: number;
  totalTransactionsChange: number;
  pendingApprovals: number;
  pendingApprovalsChange: number;
  highRiskCount: number;
  highRiskChange: number;
  averageProcessingTime: number;
  approvalRate: number;
  volumeByType: Record<string, number>;
  volumeByCurrency: Record<string, number>;
  hourlyVolume: { hour: string; volume: number }[];
  riskDistribution: { level: string; count: number }[];
  successRate: number;
  flaggedCount: number;
}

interface WebSocketMessage {
  type: 'new_transaction' | 'transaction_update' | 'bulk_update' | 'alert';
  data: Transaction | Transaction[] | Alert;
  timestamp: string;
}

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'critical';
  message: string;
  transactionId?: string;
  timestamp: string;
  acknowledged: boolean;
}

// ==================== LIVE UPDATES TOGGLE ====================
const LiveUpdatesToggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
  <div className="flex items-center gap-2 bg-[#1E2329] rounded-lg px-3 py-1.5 border border-[#2B3139]">
    {enabled ? (
      <>
        <div className="relative">
          <Wifi className="h-4 w-4 text-green-400" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        </div>
        <span className="text-xs text-[#EAECEF]">Live</span>
      </>
    ) : (
      <>
        <WifiOff className="h-4 w-4 text-[#848E9C]" />
        <span className="text-xs text-[#848E9C]">Offline</span>
      </>
    )}
    <Switch
      checked={enabled}
      onCheckedChange={onToggle}
      className="data-[state=checked]:bg-[#F0B90B] scale-75"
    />
  </div>
);

// ==================== ALERT BANNER ====================
const AlertBanner = ({ alert, onDismiss }: { alert: Alert; onDismiss: () => void }) => {
  const getAlertStyles = () => {
    switch (alert.type) {
      case 'critical':
        return {
          bg: 'bg-red-500/20',
          border: 'border-red-500/30',
          icon: <AlertTriangle className="h-5 w-5 text-red-400" />,
          text: 'text-red-400'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500/30',
          icon: <AlertTriangle className="h-5 w-5 text-yellow-400" />,
          text: 'text-yellow-400'
        };
      default:
        return {
          bg: 'bg-blue-500/20',
          border: 'border-blue-500/30',
          icon: <AlertCircle className="h-5 w-5 text-blue-400" />,
          text: 'text-blue-400'
        };
    }
  };

  const styles = getAlertStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className={`${styles.bg} ${styles.border} border rounded-lg p-4 mb-4`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {styles.icon}
          <div>
            <p className={`text-sm font-medium ${styles.text}`}>{alert.message}</p>
            <p className="text-xs text-[#848E9C] mt-1">
              {format(new Date(alert.timestamp), 'HH:mm:ss')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {alert.transactionId && (
            <Button size="sm" variant="outline" className="h-7 text-xs border-[#2B3139]">
              View Transaction
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onDismiss}>
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// ==================== ANOMALY DETECTION CARD ====================
const AnomalyDetectionCard = ({ transactions }: { transactions: Transaction[] }) => {
  const [anomalies, setAnomalies] = useState<any[]>([]);

  useEffect(() => {
    // Detect anomalies in real-time
    const detectAnomalies = () => {
      const detected = [];
      
      // Detect rapid succession from same user
      const userTimestamps: Record<string, Date[]> = {};
      transactions.forEach(t => {
        if (!userTimestamps[t.userId]) userTimestamps[t.userId] = [];
        userTimestamps[t.userId].push(new Date(t.timestamp));
      });

      Object.entries(userTimestamps).forEach(([userId, timestamps]) => {
        timestamps.sort((a, b) => a.getTime() - b.getTime());
        for (let i = 1; i < timestamps.length; i++) {
          const diff = timestamps[i].getTime() - timestamps[i-1].getTime();
          if (diff < 1000) { // Less than 1 second apart
            detected.push({
              type: 'rapid_succession',
              userId,
              severity: 'high',
              message: `Rapid transactions detected for user ${userId}`
            });
            break;
          }
        }
      });

      // Detect unusual amounts (round numbers, patterns)
      transactions.forEach(t => {
        if (t.amount % 10000 === 0 && t.amount > 50000) {
          detected.push({
            type: 'unusual_amount',
            transactionId: t.id,
            severity: 'medium',
            message: `Unusual round amount: ${t.amount} ${t.currency}`
          });
        }
      });

      // Detect high-risk locations
      const highRiskCountries = ['NG', 'RU', 'CN', 'IR', 'KP'];
      transactions.forEach(t => {
        if (t.location) {
          const countryCode = t.location.split(',').pop()?.trim();
          if (countryCode && highRiskCountries.includes(countryCode)) {
            detected.push({
              type: 'high_risk_location',
              transactionId: t.id,
              severity: 'critical',
              message: `Transaction from high-risk location: ${t.location}`
            });
          }
        }
      });

      setAnomalies(detected);
    };

    detectAnomalies();
  }, [transactions]);

  return (
    <Card className="bg-[#1E2329] border border-[#2B3139]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#F0B90B]" />
            <CardTitle className="text-sm font-medium text-[#EAECEF]">Anomaly Detection</CardTitle>
          </div>
          <Badge className={anomalies.length > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}>
            {anomalies.length} Detected
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {anomalies.length === 0 ? (
          <p className="text-xs text-[#848E9C] text-center py-2">No anomalies detected</p>
        ) : (
          <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
            {anomalies.map((anomaly, i) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-[#181A20] rounded-lg">
                {anomaly.severity === 'critical' ? (
                  <AlertTriangle className="h-3 w-3 text-red-400 shrink-0 mt-0.5" />
                ) : anomaly.severity === 'high' ? (
                  <AlertTriangle className="h-3 w-3 text-orange-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-yellow-400 shrink-0 mt-0.5" />
                )}
                <p className="text-xs text-[#EAECEF]">{anomaly.message}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ==================== HOURLY VOLUME CHART ====================
const HourlyVolumeChart = ({ data }: { data: { hour: string; volume: number }[] }) => {
  const maxVolume = Math.max(...data.map(d => d.volume));

  return (
    <Card className="bg-[#1E2329] border border-[#2B3139]">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#F0B90B]" />
          <CardTitle className="text-sm font-medium text-[#EAECEF]">Hourly Volume (24h)</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end h-24 gap-1">
          {data.map((item, i) => (
            <div key={i} className="flex-1 flex flex-col items-center group">
              <div className="relative w-full">
                <div
                  className="w-full bg-[#F0B90B] rounded-t opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ height: `${(item.volume / maxVolume) * 80}px` }}
                />
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[#2B3139] text-[#EAECEF] text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  ${item.volume.toLocaleString()}
                </div>
              </div>
              <span className="text-[8px] text-[#848E9C] mt-1">{item.hour}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== RISK DISTRIBUTION PIE ====================
const RiskDistributionPie = ({ data }: { data: { level: string; count: number }[] }) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const colors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444'
  };

  return (
    <Card className="bg-[#1E2329] border border-[#2B3139]">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <PieChart className="h-4 w-4 text-[#F0B90B]" />
          <CardTitle className="text-sm font-medium text-[#EAECEF]">Risk Distribution</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((item) => (
            <div key={item.level} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#848E9C] capitalize">{item.level}</span>
                <span className="text-[#EAECEF]">{item.count} ({((item.count / total) * 100).toFixed(1)}%)</span>
              </div>
              <div className="w-full h-1.5 bg-[#2B3139] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(item.count / total) * 100}%`,
                    backgroundColor: colors[item.level as keyof typeof colors]
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== MAIN COMPONENT ====================
export function TransactionManagement() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeDetailTab, setActiveDetailTab] = useState('details');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [showFilters, setShowFilters] = useState(true);
  const [sortField, setSortField] = useState<keyof Transaction>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Real-time updates
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const wsReconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (!liveUpdates) return;

    try {
      const ws = new WebSocket('wss://api.swanira.com/admin/transactions');
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        wsReconnectAttempts.current = 0;
        toast({
          title: "Live Updates Active",
          description: "Real-time transaction monitoring enabled",
        });
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastUpdate(new Date());

          switch (message.type) {
            case 'new_transaction':
              const newTx = message.data as Transaction;
              setTransactions(prev => [newTx, ...prev]);
              
              // Generate alert for high-risk transactions
              if (newTx.riskLevel === 'critical' || newTx.riskLevel === 'high') {
                setAlerts(prev => [{
                  id: Date.now().toString(),
                  type: newTx.riskLevel === 'critical' ? 'critical' : 'warning',
                  message: `High-risk ${newTx.type} detected: ${newTx.amount} ${newTx.currency} by ${newTx.userName}`,
                  transactionId: newTx.id,
                  timestamp: new Date().toISOString(),
                  acknowledged: false
                }, ...prev.slice(0, 9)]);
              }
              
              // Show toast for large transactions
              if (newTx.amount > 100000) {
                toast({
                  title: "Large Transaction Detected",
                  description: `${newTx.amount} ${newTx.currency} ${newTx.type} by ${newTx.userName}`,
                });
              }
              break;

            case 'transaction_update':
              const updatedTx = message.data as Transaction;
              setTransactions(prev => prev.map(tx => 
                tx.id === updatedTx.id ? updatedTx : tx
              ));
              break;

            case 'bulk_update':
              const updatedTxs = message.data as Transaction[];
              setTransactions(prev => {
                const newTxs = [...prev];
                updatedTxs.forEach(updated => {
                  const index = newTxs.findIndex(tx => tx.id === updated.id);
                  if (index !== -1) newTxs[index] = updated;
                });
                return newTxs;
              });
              break;

            case 'alert':
              const alert = message.data as Alert;
              setAlerts(prev => [alert, ...prev.slice(0, 9)]);
              
              if (alert.type === 'critical') {
                toast({
                  title: "🚨 Critical Alert",
                  description: alert.message,
                  variant: "destructive",
                });
              }
              break;
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Connection Error",
          description: "Failed to establish real-time connection",
          variant: "destructive",
        });
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        if (liveUpdates && wsReconnectAttempts.current < maxReconnectAttempts) {
          wsReconnectAttempts.current++;
          setTimeout(connectWebSocket, 2000 * wsReconnectAttempts.current);
        }
      };

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

  // Polling fallback when WebSocket is disabled
  useEffect(() => {
    if (!liveUpdates) {
      const interval = setInterval(() => {
        loadTransactions();
      }, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [liveUpdates]);

  // Load initial data
  useEffect(() => {
    loadTransactions();
  }, []);

  // Filter and calculate stats when data changes
  useEffect(() => {
    filterTransactions();
    calculateStats();
  }, [transactions, searchTerm, statusFilter, typeFilter, riskFilter, dateRange, sortField, sortDirection]);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const data = await adminApiService.getTransactions();
      
      // Transform database data to match component interface
      const transformedData: Transaction[] = data.map(tx => ({
        ...tx,
        userId: tx.user_id,
        userEmail: tx.user_email,
        userName: tx.user_email.split('@')[0], // Extract name from email for now
        timestamp: tx.date,
        currency: 'USD', // Default currency
        feeCurrency: 'USD', // Default fee currency
        requiresApproval: tx.status === 'Pending',
        riskLevel: 'medium' as const, // Default risk level
        riskScore: 50, // Default risk score
        flagged: false,
        // Add other optional properties with defaults
        userType: 'individual' as const,
        reference: `TX-${tx.id.slice(0, 8)}`,
        description: `${tx.type} transaction for ${tx.asset}`,
        location: 'Unknown',
        ipAddress: '0.0.0.0',
        counterparty: 'Unknown',
        deviceInfo: 'Unknown',
        browserInfo: 'Unknown',
        sessionId: 'Unknown',
        twoFactorVerified: false,
        biometricVerified: false,
        voiceVerified: false,
        faceVerified: false,
        smsVerified: false,
        emailVerified: false,
        appVersion: '1.0.0',
        osVersion: 'Unknown',
        networkType: 'Unknown',
        vpnDetected: false,
        proxyDetected: false,
        torDetected: false,
        suspiciousActivity: false,
        fraudScore: 0,
        amlScore: 0,
        kycLevel: 1,
        complianceFlags: [],
        regulatoryFlags: [],
        sanctionsScreened: false,
        pepScreened: false,
        adverseMediaScreened: false,
        watchlistMatched: false,
        investigationRequired: false,
        manualReviewRequired: false,
        autoApproved: false,
        autoRejected: false,
        priorityLevel: 'medium' as const,
        escalationLevel: 0,
        reviewCount: 0,
        approvalHistory: [],
        auditTrail: []
      }));
      
      setTransactions(transformedData);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = () => {
    const filtered = filteredTransactions.length ? filteredTransactions : transactions;
    
    const totalVolume = filtered.reduce((sum, t) => sum + t.amount, 0);
    const totalTransactions = filtered.length;
    const pendingApprovals = filtered.filter(t => t.requiresApproval && t.status === 'Pending').length;
    const highRiskCount = filtered.filter(t => t.riskLevel === 'high' || t.riskLevel === 'critical').length;
    const flaggedCount = filtered.filter(t => t.flagged).length;
    const completedCount = filtered.filter(t => t.status === 'Completed').length;
    const successRate = totalTransactions > 0 ? (completedCount / totalTransactions) * 100 : 0;
    
    // TODO: Replace with real period-over-period calculations
    const totalVolumeChange = 0;
    const totalTransactionsChange = 0;
    const pendingApprovalsChange = 0;
    const highRiskChange = 0;
    
    // Average processing time for completed transactions (in minutes)
    const completedWithTime = filtered.filter(t => t.status === 'Completed' && t.completedAt);
    const averageProcessingTime = completedWithTime.length > 0
      ? completedWithTime.reduce((sum, t) => {
          const start = new Date(t.timestamp!).getTime();
          const end = new Date(t.completedAt!).getTime();
          return sum + (end - start) / 60000;
        }, 0) / completedWithTime.length
      : 0;
    
    const approved = filtered.filter(t => t.status === 'Completed').length;
    const approvalRate = filtered.length > 0 ? (approved / filtered.length) * 100 : 0;
    
    const volumeByType = filtered.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const volumeByCurrency = filtered.reduce((acc, t) => {
      acc[t.currency] = (acc[t.currency] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    // Hourly volume for the last 24h
    const hourlyVolume = Array.from({ length: 24 }, (_, i) => {
      const hour = i.toString().padStart(2, '0') + ':00';
      const volume = filtered
        .filter(t => {
          const date = new Date(t.timestamp);
          return date.getHours() === i;
        })
        .reduce((sum, t) => sum + t.amount, 0);
      return { hour, volume };
    });

    // Risk distribution
    const riskCounts = filtered.reduce((acc, t) => {
      acc[t.riskLevel] = (acc[t.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const riskDistribution = Object.entries(riskCounts).map(([level, count]) => ({
      level,
      count
    }));
    
    setStats({
      totalVolume,
      totalVolumeChange,
      totalTransactions,
      totalTransactionsChange,
      pendingApprovals,
      pendingApprovalsChange,
      highRiskCount,
      highRiskChange,
      averageProcessingTime,
      approvalRate,
      volumeByType,
      volumeByCurrency,
      hourlyVolume,
      riskDistribution,
      successRate,
      flaggedCount
    });
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(txn =>
        txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.internalReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(txn => txn.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(txn => txn.type === typeFilter);
    }

    // Risk filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter(txn => txn.riskLevel === riskFilter);
    }

    // Date range filter
    const now = new Date();
    if (dateRange !== 'all') {
      const cutoff = new Date();
      switch (dateRange) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0);
          filtered = filtered.filter(txn => new Date(txn.timestamp) >= cutoff);
          break;
        case 'yesterday':
          cutoff.setDate(cutoff.getDate() - 1);
          cutoff.setHours(0, 0, 0, 0);
          const end = new Date(cutoff);
          end.setHours(23, 59, 59, 999);
          filtered = filtered.filter(txn => {
            const date = new Date(txn.timestamp);
            return date >= cutoff && date <= end;
          });
          break;
        case 'week':
          cutoff.setDate(cutoff.getDate() - 7);
          filtered = filtered.filter(txn => new Date(txn.timestamp) >= cutoff);
          break;
        case 'month':
          cutoff.setMonth(cutoff.getMonth() - 1);
          filtered = filtered.filter(txn => new Date(txn.timestamp) >= cutoff);
          break;
        case 'quarter':
          cutoff.setMonth(cutoff.getMonth() - 3);
          filtered = filtered.filter(txn => new Date(txn.timestamp) >= cutoff);
          break;
        case 'year':
          cutoff.setFullYear(cutoff.getFullYear() - 1);
          filtered = filtered.filter(txn => new Date(txn.timestamp) >= cutoff);
          break;
      }
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    setFilteredTransactions(filtered);
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const approveTransaction = async (transactionId: string) => {
    try {
      setTransactions(prev => prev.map(txn =>
        txn.id === transactionId 
          ? { 
              ...txn, 
              status: 'approved' as Transaction['status'],
              approvedBy: 'admin',
              approvedAt: new Date().toISOString(),
              notes: approvalNote || txn.notes
            } 
          : txn
      ));
      setApprovalNote('');
      setShowTransactionDetails(false);
      toast({
        title: "✅ Transaction Approved",
        description: `Transaction ${transactionId} has been approved successfully.`,
      });
    } catch (error) {
      toast({
        title: "❌ Approval Failed",
        description: "Failed to approve transaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const rejectTransaction = async (transactionId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejecting this transaction.",
        variant: "destructive",
      });
      return;
    }

    try {
      setTransactions(prev => prev.map(txn =>
        txn.id === transactionId 
          ? { 
              ...txn, 
              status: 'rejected' as Transaction['status'],
              approvedBy: 'admin',
              approvedAt: new Date().toISOString(),
              rejectionReason,
              notes: approvalNote || txn.notes
            } 
          : txn
      ));
      setRejectionReason('');
      setApprovalNote('');
      setShowRejectDialog(false);
      setShowTransactionDetails(false);
      toast({
        title: "❌ Transaction Rejected",
        description: `Transaction ${transactionId} has been rejected.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject transaction",
        variant: "destructive",
      });
    }
  };

  const flagTransaction = async (transactionId: string) => {
    try {
      setTransactions(prev => prev.map(txn =>
        txn.id === transactionId 
          ? { 
              ...txn, 
              status: 'flagged' as Transaction['status'],
              riskLevel: 'critical',
              notes: approvalNote || txn.notes
            } 
          : txn
      ));
      setShowTransactionDetails(false);
      toast({
        title: "🚩 Transaction Flagged",
        description: "This transaction has been flagged for further investigation.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to flag transaction",
        variant: "destructive",
      });
    }
  };

  const exportTransactions = (format: string = 'csv') => {
    const dataToExport = filteredTransactions.map(t => ({
      ID: t.id,
      Date: new Date(t.timestamp).toLocaleString(),
      User: t.userName,
      Email: t.userEmail,
      Type: t.type,
      Status: t.status,
      Amount: `${t.currency} ${t.amount.toLocaleString()}`,
      Fee: `${t.feeCurrency} ${t.fee.toLocaleString()}`,
      Risk: t.riskLevel,
      RiskScore: t.riskScore,
      Reference: t.reference,
      Description: t.description,
      Location: t.location,
      IP: t.ipAddress,
      Counterparty: t.counterparty
    }));

    const headers = Object.keys(dataToExport[0]);
    const csv = [
      headers.join(','),
      ...dataToExport.map(row => headers.map(h => `"${row[h as keyof typeof row]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.${format}`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `${filteredTransactions.length} transactions exported successfully.`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'approved': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'failed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'cancelled': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'flagged': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'withdrawal': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'trade': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'transfer': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'fee': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'interest': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'refund': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="h-4 w-4" />;
      case 'withdrawal': return <ArrowUpRight className="h-4 w-4" />;
      case 'trade': return <RefreshCw className="h-4 w-4" />;
      case 'transfer': return <Wallet className="h-4 w-4" />;
      case 'fee': return <DollarSign className="h-4 w-4" />;
      case 'interest': return <TrendingUp className="h-4 w-4" />;
      case 'refund': return <CheckCircle className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'individual': return <User className="h-4 w-4" />;
      case 'business': return <Building className="h-4 w-4" />;
      case 'institutional': return <Shield className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-64 bg-[#2B3139] rounded animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-[#2B3139] rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-[#2B3139] rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[#2B3139] rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-[#2B3139] rounded animate-pulse"></div>
      </div>
    );
  }

  const pendingApprovals = filteredTransactions.filter(t => t.requiresApproval && t.status === 'pending');

  return (
    <motion.div 
      className="space-y-6 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-[#EAECEF]">Transaction Management</h2>
            {pendingApprovals.length > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                {pendingApprovals.length} Pending Review
              </Badge>
            )}
          </div>
          <p className="text-sm text-[#848E9C] mt-1">
            Monitor, approve, and manage all financial transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LiveUpdatesToggle enabled={liveUpdates} onToggle={() => setLiveUpdates(!liveUpdates)} />
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger className="w-24 bg-[#1E2329] border-[#2B3139] text-[#EAECEF]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => exportTransactions(exportFormat)}
            className="bg-[#F0B90B] hover:bg-yellow-400 text-black font-bold"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {alerts.map(alert => (
          <AlertBanner key={alert.id} alert={alert} onDismiss={() => acknowledgeAlert(alert.id)} />
        ))}
      </AnimatePresence>

      {/* Stats Cards */}
      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-[#1E2329] border border-[#2B3139] hover:border-[#F0B90B]/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#848E9C]">Total Volume</CardTitle>
                <DollarSign className="h-4 w-4 text-[#F0B90B]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#EAECEF]">
                  {formatCurrency(stats.totalVolume, 'USD')}
                </div>
                <div className="flex items-center mt-1">
                  <Badge className={stats.totalVolumeChange > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                    {stats.totalVolumeChange > 0 ? '+' : ''}{stats.totalVolumeChange}%
                  </Badge>
                  <span className="text-xs text-[#848E9C] ml-2">vs last period</span>
                </div>
                <p className="text-xs text-[#5E6673] mt-2">
                  {stats.totalTransactions} total transactions
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1E2329] border border-[#2B3139] hover:border-[#F0B90B]/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#848E9C]">Pending Approval</CardTitle>
                <Clock className="h-4 w-4 text-[#F0B90B]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#EAECEF]">{stats.pendingApprovals}</div>
                <div className="flex items-center mt-1">
                  <Badge className={stats.pendingApprovalsChange < 0 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                    {stats.pendingApprovalsChange > 0 ? '+' : ''}{stats.pendingApprovalsChange}%
                  </Badge>
                  <span className="text-xs text-[#848E9C] ml-2">vs last period</span>
                </div>
                <p className="text-xs text-[#5E6673] mt-2">
                  Requires manual review
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1E2329] border border-[#2B3139] hover:border-[#F0B90B]/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#848E9C]">Processing Time</CardTitle>
                <Activity className="h-4 w-4 text-[#F0B90B]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#EAECEF]">
                  {stats.averageProcessingTime.toFixed(1)} min
                </div>
                <Progress 
                  value={Math.min(100, (stats.averageProcessingTime / 30) * 100)} 
                  className="mt-2 h-1 bg-[#2B3139]" 
                />
                <p className="text-xs text-[#5E6673] mt-2">
                  Approval rate: {stats.approvalRate.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1E2329] border border-[#2B3139] hover:border-[#F0B90B]/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#848E9C]">High Risk</CardTitle>
                <AlertTriangle className="h-4 w-4 text-[#F0B90B]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#EAECEF]">{stats.highRiskCount}</div>
                <div className="flex items-center mt-1">
                  <Badge className={stats.highRiskChange < 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                    {stats.highRiskChange > 0 ? '+' : ''}{stats.highRiskChange}%
                  </Badge>
                  <span className="text-xs text-[#848E9C] ml-2">flagged</span>
                </div>
                <p className="text-xs text-[#5E6673] mt-2">
                  {stats.flaggedCount} flagged transactions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <HourlyVolumeChart data={stats.hourlyVolume} />
            <RiskDistributionPie data={stats.riskDistribution} />
            <AnomalyDetectionCard transactions={filteredTransactions} />
          </div>
        </>
      )}

      {/* Filters */}
      <Card className="bg-[#1E2329] border border-[#2B3139]">
        <CardHeader className="cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-[#F0B90B]" />
              <CardTitle className="text-[#EAECEF]">Filters</CardTitle>
              <CardDescription className="text-[#848E9C]">
                ({filteredTransactions.length} of {transactions.length} transactions)
                {liveUpdates && (
                  <span className="ml-2 text-green-400 text-xs">
                    Last update: {format(lastUpdate, 'HH:mm:ss')}
                  </span>
                )}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-[#848E9C]">
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-[#848E9C]">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#848E9C]" />
                  <Input
                    placeholder="ID, user, reference..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-[#181A20] border-[#2B3139] text-[#EAECEF] placeholder:text-[#5E6673]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-[#848E9C]">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-[#848E9C]">Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="trade">Trade</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="fee">Fee</SelectItem>
                    <SelectItem value="interest">Interest</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-[#848E9C]">Risk Level</Label>
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risks</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-[#848E9C]">Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="quarter">Last 90 Days</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-[#848E9C]">Sort By</Label>
                <Select 
                  value={`${sortField}-${sortDirection}`} 
                  onValueChange={(value) => {
                    const [field, direction] = value.split('-');
                    setSortField(field as keyof Transaction);
                    setSortDirection(direction as 'asc' | 'desc');
                  }}
                >
                  <SelectTrigger className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="timestamp-desc">Newest First</SelectItem>
                    <SelectItem value="timestamp-asc">Oldest First</SelectItem>
                    <SelectItem value="amount-desc">Amount (High-Low)</SelectItem>
                    <SelectItem value="amount-asc">Amount (Low-High)</SelectItem>
                    <SelectItem value="riskScore-desc">Risk (High-Low)</SelectItem>
                    <SelectItem value="riskScore-asc">Risk (Low-High)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Transactions Table */}
      <Card className="bg-[#1E2329] border border-[#2B3139]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#F0B90B]" />
              <CardTitle className="text-[#EAECEF]">Transaction List</CardTitle>
            </div>
            <Badge className="bg-[#2B3139] text-[#848E9C]">
              {filteredTransactions.length} Transactions
            </Badge>
          </div>
          <CardDescription className="text-[#848E9C]">
            Review and manage transaction requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2B3139] hover:bg-transparent">
                  <TableHead className="text-[#F0B90B]">Transaction</TableHead>
                  <TableHead className="text-[#F0B90B]">User</TableHead>
                  <TableHead className="text-[#F0B90B]">Type</TableHead>
                  <TableHead className="text-[#F0B90B]">Amount</TableHead>
                  <TableHead className="text-[#F0B90B]">Status</TableHead>
                  <TableHead className="text-[#F0B90B]">Risk</TableHead>
                  <TableHead className="text-[#F0B90B]">Date</TableHead>
                  <TableHead className="text-[#F0B90B]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-[#848E9C]">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="border-[#2B3139] hover:bg-[#23262F]">
                      <TableCell>
                        <div>
                          <div className="font-medium text-[#EAECEF]">{transaction.id}</div>
                          <div className="text-xs text-[#848E9C] flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {transaction.reference}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
                            ${transaction.userType === 'business' ? 'bg-blue-500/20 text-blue-400' :
                              transaction.userType === 'institutional' ? 'bg-purple-500/20 text-purple-400' :
                              'bg-green-500/20 text-green-400'}`}
                          >
                            {getUserTypeIcon(transaction.userType)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-[#EAECEF]">{transaction.userName}</div>
                            <div className="text-xs text-[#848E9C]">KYC Level {transaction.userKycLevel}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(transaction.type)}>
                          <div className="flex items-center gap-1">
                            {getTypeIcon(transaction.type)}
                            <span className="capitalize">{transaction.type}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-[#EAECEF]">
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </div>
                          {transaction.cryptoAmount && (
                            <div className="text-xs text-[#848E9C]">
                              {transaction.cryptoAmount} {transaction.cryptoCurrency}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRiskColor(transaction.riskLevel)}>
                          {transaction.riskLevel}
                          {transaction.riskScore > 0 && ` (${transaction.riskScore})`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-[#EAECEF]">
                          {formatDate(transaction.timestamp).split(',')[0]}
                        </div>
                        <div className="text-xs text-[#848E9C]">
                          {formatDate(transaction.timestamp).split(',')[1]}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-[#848E9C] hover:text-[#F0B90B]"
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowTransactionDetails(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {transaction.requiresApproval && transaction.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-500/20 text-green-400 hover:bg-green-500/30 h-8"
                                onClick={() => {
                                  setSelectedTransaction(transaction);
                                  setShowTransactionDetails(true);
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog open={showTransactionDetails} onOpenChange={setShowTransactionDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1E2329] border border-[#F0B90B]">
          <DialogHeader>
            <DialogTitle className="text-[#F0B90B] text-xl">Transaction Details</DialogTitle>
            <DialogDescription className="text-[#848E9C]">
              Review comprehensive transaction information
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-6">
              <Tabs value={activeDetailTab} onValueChange={setActiveDetailTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-[#181A20] p-1 rounded-lg">
                  <TabsTrigger 
                    value="details" 
                    className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]"
                  >
                    Details
                  </TabsTrigger>
                  <TabsTrigger 
                    value="risk" 
                    className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]"
                  >
                    Risk Analysis
                  </TabsTrigger>
                  <TabsTrigger 
                    value="compliance" 
                    className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]"
                  >
                    Compliance
                  </TabsTrigger>
                  <TabsTrigger 
                    value="actions" 
                    className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]"
                  >
                    Actions
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div>
                      <Label className="text-xs text-[#848E9C]">Transaction ID</Label>
                      <p className="text-sm font-mono text-[#EAECEF]">{selectedTransaction.id}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-[#848E9C]">Reference</Label>
                      <p className="text-sm font-mono text-[#EAECEF]">{selectedTransaction.reference}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-[#848E9C]">Internal Reference</Label>
                      <p className="text-sm font-mono text-[#EAECEF]">{selectedTransaction.internalReference}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-[#848E9C]">Status</Label>
                      <Badge className={getStatusColor(selectedTransaction.status)}>
                        {selectedTransaction.status}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-[#848E9C]">Description</Label>
                      <p className="text-sm text-[#EAECEF]">{selectedTransaction.description}</p>
                    </div>
                  </div>

                  <Separator className="bg-[#2B3139]" />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-[#848E9C]">User</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
                          ${selectedTransaction.userType === 'business' ? 'bg-blue-500/20 text-blue-400' :
                            selectedTransaction.userType === 'institutional' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-green-500/20 text-green-400'}`}
                        >
                          {getUserTypeIcon(selectedTransaction.userType)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#EAECEF]">{selectedTransaction.userName}</p>
                          <p className="text-xs text-[#848E9C]">{selectedTransaction.userEmail}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-[#848E9C]">KYC Level</Label>
                      <p className="text-sm text-[#EAECEF]">Level {selectedTransaction.userKycLevel}</p>
                    </div>
                  </div>

                  <Separator className="bg-[#2B3139]" />

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-[#848E9C]">Amount</Label>
                      <p className="text-lg font-bold text-[#EAECEF]">
                        {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-[#848E9C]">Fee</Label>
                      <p className="text-sm text-[#EAECEF]">
                        {formatCurrency(selectedTransaction.fee, selectedTransaction.feeCurrency)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-[#848E9C]">Net</Label>
                      <p className="text-sm text-[#EAECEF]">
                        {formatCurrency(selectedTransaction.amount - selectedTransaction.fee, selectedTransaction.currency)}
                      </p>
                    </div>
                  </div>

                  {selectedTransaction.cryptoAmount && (
                    <div className="bg-[#181A20] rounded-lg p-3">
                      <Label className="text-xs text-[#848E9C]">Crypto Details</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <p className="text-xs text-[#848E9C]">Amount</p>
                          <p className="text-sm text-[#EAECEF]">{selectedTransaction.cryptoAmount} {selectedTransaction.cryptoCurrency}</p>
                        </div>
                        {selectedTransaction.blockchainTxHash && (
                          <div className="col-span-2">
                            <p className="text-xs text-[#848E9C]">Transaction Hash</p>
                            <p className="text-xs font-mono text-[#EAECEF] break-all">{selectedTransaction.blockchainTxHash}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-[#848E9C]">Created</Label>
                      <p className="text-sm text-[#EAECEF]">{formatDate(selectedTransaction.timestamp)}</p>
                    </div>
                    {selectedTransaction.completedAt && (
                      <div>
                        <Label className="text-xs text-[#848E9C]">Completed</Label>
                        <p className="text-sm text-[#EAECEF]">{formatDate(selectedTransaction.completedAt)}</p>
                      </div>
                    )}
                  </div>

                  {selectedTransaction.counterparty && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-[#848E9C]">Counterparty</Label>
                        <p className="text-sm text-[#EAECEF]">{selectedTransaction.counterparty}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-[#848E9C]">Account</Label>
                        <p className="text-sm text-[#EAECEF]">{selectedTransaction.counterpartyAccount}</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-[#181A20] rounded-lg p-3">
                    <Label className="text-xs text-[#848E9C]">Device & Location</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div>
                        <p className="text-xs text-[#848E9C]">IP Address</p>
                        <p className="text-xs text-[#EAECEF]">{selectedTransaction.ipAddress || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#848E9C]">Location</p>
                        <p className="text-xs text-[#EAECEF]">{selectedTransaction.location || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#848E9C]">Device</p>
                        <p className="text-xs text-[#EAECEF]">{selectedTransaction.deviceInfo || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {selectedTransaction.notes && (
                    <div>
                      <Label className="text-xs text-[#848E9C]">Notes</Label>
                      <p className="text-sm text-[#EAECEF] p-2 bg-[#181A20] rounded">{selectedTransaction.notes}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="risk" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div>
                      <Label className="text-xs text-[#848E9C]">Risk Level</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getRiskColor(selectedTransaction.riskLevel)}>
                          {selectedTransaction.riskLevel.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-[#EAECEF]">Score: {selectedTransaction.riskScore}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-[#848E9C]">Requires Approval</Label>
                      <p className="text-sm text-[#EAECEF]">
                        {selectedTransaction.requiresApproval ? 'Yes' : 'No'} 
                        {selectedTransaction.requiresApproval && ` (Level ${selectedTransaction.approvalLevel})`}
                      </p>
                    </div>
                  </div>

                  {selectedTransaction.riskFactors.length > 0 && (
                    <div>
                      <Label className="text-xs text-[#848E9C]">Risk Factors</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedTransaction.riskFactors.map((factor, i) => (
                          <Badge key={i} className="bg-red-500/20 text-red-400 border-red-500/30">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-[#181A20] rounded-lg p-4">
                    <h4 className="text-sm font-medium text-[#EAECEF] mb-3">Risk Assessment</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#848E9C]">Amount Risk</span>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={Math.min(100, (selectedTransaction.amount / 100000) * 100)} 
                            className="w-32 h-1 bg-[#2B3139]" 
                          />
                          <span className="text-xs text-[#EAECEF]">
                            {selectedTransaction.amount > 10000 ? 'High' : 'Normal'}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#848E9C]">Velocity Check</span>
                        <Badge className={selectedTransaction.complianceChecks.velocity ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                          {selectedTransaction.complianceChecks.velocity ? 'Pass' : 'Fail'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#848E9C]">Fraud Score</span>
                        <Badge className={selectedTransaction.complianceChecks.fraud ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                          {selectedTransaction.complianceChecks.fraud ? 'Low' : 'High'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="compliance" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="bg-[#181A20] rounded-lg p-3">
                      <Label className="text-xs text-[#848E9C]">AML Screening</Label>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedTransaction.complianceChecks.aml ? (
                          <ShieldCheck className="h-4 w-4 text-green-400" />
                        ) : (
                          <ShieldAlert className="h-4 w-4 text-red-400" />
                        )}
                        <span className="text-sm text-[#EAECEF]">
                          {selectedTransaction.complianceChecks.aml ? 'Cleared' : 'Failed'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#181A20] rounded-lg p-3">
                      <Label className="text-xs text-[#848E9C]">Sanction List</Label>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedTransaction.complianceChecks.sanction ? (
                          <ShieldCheck className="h-4 w-4 text-green-400" />
                        ) : (
                          <ShieldAlert className="h-4 w-4 text-red-400" />
                        )}
                        <span className="text-sm text-[#EAECEF]">
                          {selectedTransaction.complianceChecks.sanction ? 'Cleared' : 'Failed'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#181A20] rounded-lg p-3">
                      <Label className="text-xs text-[#848E9C]">PEP Screening</Label>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedTransaction.complianceChecks.pep ? (
                          <Fingerprint className="h-4 w-4 text-green-400" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-400" />
                        )}
                        <span className="text-sm text-[#EAECEF]">
                          {selectedTransaction.complianceChecks.pep ? 'No Match' : 'Flagged'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#181A20] rounded-lg p-3">
                      <Label className="text-xs text-[#848E9C]">OFAC Check</Label>
                      <Badge className="bg-green-500/20 text-green-400">Cleared</Badge>
                    </div>
                  </div>

                  <div className="bg-[#181A20] rounded-lg p-4">
                    <h4 className="text-sm font-medium text-[#EAECEF] mb-3">Compliance Notes</h4>
                    <p className="text-xs text-[#848E9C]">
                      All standard checks passed. Transaction requires level {selectedTransaction.approvalLevel} approval 
                      due to {selectedTransaction.amount > 50000 ? 'amount threshold' : 'risk profile'}.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="actions" className="space-y-4">
                  {selectedTransaction.requiresApproval && selectedTransaction.status === 'pending' ? (
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label className="text-xs text-[#848E9C]">Approval Note (Optional)</Label>
                        <Textarea
                          placeholder="Add a note for this decision..."
                          value={approvalNote}
                          onChange={(e) => setApprovalNote(e.target.value)}
                          className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => approveTransaction(selectedTransaction.id)}
                          className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Transaction
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => setShowRejectDialog(true)}
                          className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => flagTransaction(selectedTransaction.id)}
                          className="flex-1 border-orange-500/30 text-orange-400 hover:bg-orange-500/20"
                        >
                          <Flag className="h-4 w-4 mr-2" />
                          Flag
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <Button variant="outline" className="flex-col h-20 border-[#2B3139] hover:bg-[#23262F]">
                        <Shield className="h-5 w-5 mb-2 text-[#F0B90B]" />
                        <span className="text-xs text-[#EAECEF]">Security Review</span>
                      </Button>
                      <Button variant="outline" className="flex-col h-20 border-[#2B3139] hover:bg-[#23262F]">
                        <History className="h-5 w-5 mb-2 text-[#F0B90B]" />
                        <span className="text-xs text-[#EAECEF]">View History</span>
                      </Button>
                      <Button variant="outline" className="flex-col h-20 border-[#2B3139] hover:bg-[#23262F]">
                        <Mail className="h-5 w-5 mb-2 text-[#F0B90B]" />
                        <span className="text-xs text-[#EAECEF]">Contact User</span>
                      </Button>
                      <Button variant="outline" className="flex-col h-20 border-[#2B3139] hover:bg-[#23262F]">
                        <Printer className="h-5 w-5 mb-2 text-[#F0B90B]" />
                        <span className="text-xs text-[#EAECEF]">Print Receipt</span>
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransactionDetails(false)} className="border-[#2B3139] text-[#EAECEF]">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-[#1E2329] border border-red-500/50">
          <DialogHeader>
            <DialogTitle className="text-red-400">Reject Transaction</DialogTitle>
            <DialogDescription className="text-[#848E9C]">
              Please provide a reason for rejecting this transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-[#848E9C]">Rejection Reason</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full mt-1 bg-[#181A20] border border-[#2B3139] rounded-lg px-3 py-2 text-[#EAECEF] placeholder:text-[#5E6673] focus:outline-none focus:border-red-500"
                rows={4}
                placeholder="e.g., Insufficient KYC, suspicious activity, documentation required..."
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => rejectTransaction(selectedTransaction?.id || '')}
                className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
              >
                Confirm Rejection
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
                className="flex-1 border-[#2B3139] text-[#EAECEF]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
    </motion.div>
  );
}