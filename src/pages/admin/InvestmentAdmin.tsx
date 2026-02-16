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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { adminApiService } from '@/services/admin-api';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Plus, 
  Edit, 
  Trash2, 
  TrendingUp, 
  TrendingDown as TrendDownIcon, 
  DollarSign, 
  BarChart3, 
  PieChart, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff, 
  Calendar,
  Clock,
  FileText,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Settings,
  Copy,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Users,
  UserCheck,
  UserX,
  Key,
  Lock,
  Unlock,
  Zap,
  Award,
  Star,
  Target
} from 'lucide-react';

// ==================== TYPES ====================
interface InvestmentProduct {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  longDescription: string;
  minimumInvestment: number;
  maximumInvestment: number;
  expectedReturn: number;
  actualReturn: number;
  duration: string;
  durationDays: number;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  icon: string;
  imageUrl: string;
  totalInvested: number;
  investorsCount: number;
  performance: number;
  performanceHistory: { date: string; value: number }[];
  managementFee: number;
  performanceFee: number;
  earlyWithdrawalPenalty: number;
  lockupPeriod: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
  featured: boolean;
  popular: boolean;
  documents: { name: string; url: string; type: string }[];
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  omegaRatio: number;
  volatility: number;
  maxDrawdown: number;
  var_95: number;
  cvar_95: number;
  beta: number;
  alpha: number;
  rSquared: number;
  trackingError: number;
  informationRatio: number;
  skewness: number;
  kurtosis: number;
  downsideDeviation: number;
  gainDeviation: number;
  lossDeviation: number;
  avgWin: number;
  avgLoss: number;
  winRate: number;
  profitFactor: number;
  recoveryFactor: number;
  distributionFrequency: string;
  availableFrom: string;
  availableTo: string;
  maxCapacity: number;
  currentAllocation: number;
  regulatoryStatus: string;
  jurisdictions: string[];
  investorRestrictions: string[];
  accreditedOnly: boolean;
  riskRating: number;
  liquidityRating: number;
  complexityRating: number;
  historicalReturns: { date: string; value: number }[];
  drawdownHistory: { date: string; value: number }[];
  stressTests: {
    scenario: string;
    impact: number;
    probability: string;
  }[];
}

interface RiskScenario {
  name: string;
  impact: number;
  probability: string;
}

interface PerformanceMetrics {
  totalInvested: number;
  totalReturns: number;
  averageReturn: number;
  bestPerformer: InvestmentProduct;
  worstPerformer: InvestmentProduct;
  riskDistribution: { name: string; value: number; color: string }[];
  typeDistribution: { name: string; value: number }[];
  performanceOverTime: { date: string; value: number }[];
  monthlyGrowth: { month: string; investments: number; value: number }[];
  riskReturnScatter: { name: string; risk: number; return: number }[];
}

// ==================== MAIN COMPONENT ====================
export default function InvestmentAdmin() {
  const { toast } = useToast();
  
  // State
  const [investments, setInvestments] = useState<InvestmentProduct[]>([]);
  const [filteredInvestments, setFilteredInvestments] = useState<InvestmentProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<InvestmentProduct | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'quant-trading',
    category: 'crypto',
    description: '',
    longDescription: '',
    minimumInvestment: 10000,
    maximumInvestment: 1000000,
    expectedReturn: 15,
    duration: '12 months',
    riskLevel: 'medium' as const,
    managementFee: 2,
    performanceFee: 20,
    earlyWithdrawalPenalty: 5,
    lockupPeriod: '3 months',
    tags: [] as string[],
    featured: false,
    popular: false
  });

  // Load data from API
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await adminApiService.getInvestmentProducts();
      
      // Transform database data to match component interface
      const transformedData: InvestmentProduct[] = data.map(product => ({
        id: product.id,
        name: product.name,
        type: product.type,
        category: 'crypto', // Default category
        description: product.description || '',
        longDescription: product.long_description || '',
        minimumInvestment: product.min_investment,
        maximumInvestment: product.max_investment || 1000000,
        expectedReturn: product.expected_return,
        actualReturn: product.actual_return || 0,
        duration: product.duration,
        durationDays: product.duration_days || 365,
        riskLevel: product.risk_level as 'low' | 'medium' | 'high',
        status: (product.status === 'coming-soon' ? 'pending' : product.status === 'ended' ? 'suspended' : product.status) as 'active' | 'inactive' | 'suspended' | 'pending',
        icon: product.icon || '📊',
        imageUrl: product.image_url || '',
        totalInvested: product.total_invested,
        investorsCount: product.investors_count,
        performance: product.actual_return || 0,
        performanceHistory: [], // TODO: Get from separate API
        managementFee: product.management_fee,
        performanceFee: product.performance_fee,
        earlyWithdrawalPenalty: product.early_withdrawal_penalty || 0,
        lockupPeriod: product.lockup_period || '3 months',
        createdAt: product.created_at,
        updatedAt: product.updated_at,
        createdBy: product.created_by || '',
        tags: product.tags || [],
        featured: product.featured,
        popular: product.popular,
        documents: product.documents || [],
        sharpeRatio: 0, // TODO: Calculate from historical data
        sortinoRatio: 0,
        calmarRatio: 0,
        omegaRatio: 0,
        volatility: 0,
        maxDrawdown: 0,
        var_95: 0,
        cvar_95: 0,
        beta: 0,
        alpha: 0,
        rSquared: 0,
        trackingError: 0,
        informationRatio: 0,
        skewness: 0,
        kurtosis: 0,
        downsideDeviation: 0,
        gainDeviation: 0,
        lossDeviation: 0,
        avgWin: 0,
        avgLoss: 0,
        winRate: 0,
        profitFactor: 0,
        recoveryFactor: 0,
        distributionFrequency: 'monthly' as const,
        availableFrom: product.available_from || '',
        availableTo: product.available_to || '',
        maxCapacity: product.max_capacity || 0,
        currentAllocation: product.total_invested,
        regulatoryStatus: 'approved' as const,
        jurisdictions: ['US', 'UK', 'EU', 'SG'], // Default jurisdictions
        investorRestrictions: ['accredited'], // Default restrictions
        accreditedOnly: true,
        riskRating: product.risk_level === 'low' ? 3 : product.risk_level === 'medium' ? 6 : product.risk_level === 'high' ? 8 : 10,
        liquidityRating: 7, // Default liquidity rating
        complexityRating: 5, // Default complexity rating
        historicalReturns: [], // TODO: Get from separate API
        drawdownHistory: [], // TODO: Get from separate API
        stressTests: [] // TODO: Get from separate API
      }));
      
      setInvestments(transformedData);
      setFilteredInvestments(transformedData);
    } catch (error) {
      console.error('Failed to load investment data:', error);
      toast({
        title: "Error",
        description: "Failed to load investment products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter investments
  useEffect(() => {
    let filtered = investments;

    if (searchTerm) {
      filtered = filtered.filter(inv =>
        inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(inv => inv.type === selectedType);
    }

    if (selectedRisk !== 'all') {
      filtered = filtered.filter(inv => inv.riskLevel === selectedRisk);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(inv => inv.status === selectedStatus);
    }

    setFilteredInvestments(filtered);
  }, [investments, searchTerm, selectedType, selectedRisk, selectedStatus]);

  // Calculate performance metrics
  const performanceMetrics: PerformanceMetrics = {
    totalInvested: investments.reduce((sum, inv) => sum + inv.totalInvested, 0),
    totalReturns: investments.reduce((sum, inv) => sum + (inv.totalInvested * inv.actualReturn / 100), 0),
    averageReturn: investments.length > 0 ? investments.reduce((sum, inv) => sum + inv.actualReturn, 0) / investments.length : 0,
    bestPerformer: investments.length > 0 ? investments.reduce((prev, current) => 
      (prev.performance > current.performance) ? prev : current, investments[0]) : {} as InvestmentProduct,
    worstPerformer: investments.length > 0 ? investments.reduce((prev, current) => 
      (prev.performance < current.performance) ? prev : current, investments[0]) : {} as InvestmentProduct,
    riskDistribution: [],
    typeDistribution: [],
    performanceOverTime: [],
    monthlyGrowth: [],
    riskReturnScatter: investments.map(inv => ({
      name: inv.name,
      risk: inv.riskRating * 10,
      return: inv.actualReturn
    }))
  };

  const handleCreateInvestment = () => {
    // TODO: Implement create investment API call
    console.log('Creating investment:', formData);
    toast({
      title: "Investment Created",
      description: "New investment product has been created",
    });
    setShowCreateDialog(false);
    setFormData({
      name: '',
      type: 'quant-trading',
      category: 'crypto',
      description: '',
      longDescription: '',
      minimumInvestment: 10000,
      maximumInvestment: 1000000,
      expectedReturn: 15,
      duration: '12 months',
      riskLevel: 'medium',
      managementFee: 2,
      performanceFee: 20,
      earlyWithdrawalPenalty: 5,
      lockupPeriod: '3 months',
      tags: [],
      featured: false,
      popular: false
    });
  };

  const handleEditInvestment = (investment: InvestmentProduct) => {
    setEditingInvestment(investment);
    setFormData({
      name: investment.name,
      type: investment.type,
      category: investment.category,
      description: investment.description,
      longDescription: investment.longDescription,
      minimumInvestment: investment.minimumInvestment,
      maximumInvestment: investment.maximumInvestment,
      expectedReturn: investment.expectedReturn,
      duration: investment.duration,
      riskLevel: investment.riskLevel,
      managementFee: investment.managementFee,
      performanceFee: investment.performanceFee,
      earlyWithdrawalPenalty: investment.earlyWithdrawalPenalty,
      lockupPeriod: investment.lockupPeriod,
      tags: investment.tags,
      featured: investment.featured,
      popular: investment.popular
    });
  };

  const handleSaveInvestment = () => {
    // TODO: Implement update investment API call
    console.log('Saving investment:', formData);
    toast({
      title: "Investment Updated",
      description: "Investment product has been updated",
    });
    setEditingInvestment(null);
  };

  const handleDeleteInvestment = (id: string) => {
    // TODO: Implement delete investment API call
    console.log('Deleting investment:', id);
    toast({
      title: "Investment Deleted",
      description: "Investment product has been deleted",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#EAECEF]">Investment Management</h1>
          <p className="text-[#848E9C]">Manage investment products and performance</p>
        </div>
        <Button onClick={loadData} className="bg-[#F0B90B] text-black hover:bg-yellow-400">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 text-[#848E9C] transform -translate-y-1/2" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search investment products..."
            className="pl-10 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-40 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="quant-trading">Quant Trading</SelectItem>
            <SelectItem value="arbitrage">Arbitrage</SelectItem>
            <SelectItem value="staking">Staking</SelectItem>
            <SelectItem value="mining">Mining</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedRisk} onValueChange={setSelectedRisk}>
          <SelectTrigger className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risks</SelectItem>
            <SelectItem value="low">Low Risk</SelectItem>
            <SelectItem value="medium">Medium Risk</SelectItem>
            <SelectItem value="high">High Risk</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-[#F0B90B] text-black hover:bg-yellow-400">
          <Plus className="w-4 h-4 mr-2" />
          Create Investment
        </Button>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#1E2329] border border-[#2B3139]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#848E9C]">Total Invested</p>
                <p className="text-2xl font-bold text-[#EAECEF]">
                  ${performanceMetrics.totalInvested.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-[#F0B90B]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E2329] border border-[#2B3139]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#848E9C]">Total Returns</p>
                <p className="text-2xl font-bold text-[#EAECEF]">
                  ${performanceMetrics.totalReturns.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E2329] border border-[#2B3139]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#848E9C]">Average Return</p>
                <p className="text-2xl font-bold text-[#EAECEF]">
                  {performanceMetrics.averageReturn.toFixed(1)}%
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-[#F0B90B]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E2329] border border-[#2B3139]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#848E9C]">Active Products</p>
                <p className="text-2xl font-bold text-[#EAECEF]">
                  {investments.length}
                </p>
              </div>
              <Activity className="w-8 h-8 text-[#F0B90B]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment Products Table */}
      <Card className="bg-[#1E2329] border border-[#2B3139]">
        <CardHeader>
          <CardTitle className="text-[#EAECEF]">Investment Products</CardTitle>
          <CardDescription className="text-[#848E9C]">
            Showing {filteredInvestments.length} of {investments.length} products
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInvestments.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-[#848E9C] mx-auto mb-4" />
              <p className="text-[#848E9C]">No investment products found</p>
              <p className="text-sm text-[#5E6673] mt-2">Create your first investment product to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-[#2B3139]">
                  <TableHead className="text-[#848E9C]">Name</TableHead>
                  <TableHead className="text-[#848E9C]">Type</TableHead>
                  <TableHead className="text-[#848E9C]">Risk</TableHead>
                  <TableHead className="text-[#848E9C]">Min Investment</TableHead>
                  <TableHead className="text-[#848E9C]">Expected Return</TableHead>
                  <TableHead className="text-[#848E9C]">Investors</TableHead>
                  <TableHead className="text-[#848E9C]">Performance</TableHead>
                  <TableHead className="text-[#848E9C]">Status</TableHead>
                  <TableHead className="text-[#848E9C]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvestments.map((investment) => (
                  <TableRow key={investment.id} className="border-[#2B3139]">
                    <TableCell className="text-[#EAECEF]">
                      <div className="flex items-center gap-2">
                        <span>{investment.icon}</span>
                        <span>{investment.name}</span>
                        {investment.featured && <Star className="w-4 h-4 text-yellow-400" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-[#2B3139] text-[#848E9C]">
                        {investment.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        investment.riskLevel === 'low' ? 'bg-green-500/20 text-green-400' :
                        investment.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }>
                        {investment.riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#EAECEF]">
                      ${investment.minimumInvestment.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-[#EAECEF]">
                      {investment.expectedReturn}%
                    </TableCell>
                    <TableCell className="text-[#848E9C]">
                      {investment.investorsCount}
                    </TableCell>
                    <TableCell className="text-[#EAECEF]">
                      <div className="flex items-center gap-2">
                        <span>{investment.actualReturn}%</span>
                        {investment.performance >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : (
                          <TrendDownIcon className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        investment.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        investment.status === 'inactive' ? 'bg-gray-500/20 text-gray-400' :
                        investment.status === 'suspended' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }>
                        {investment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEditInvestment(investment)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-400" onClick={() => handleDeleteInvestment(investment.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Investment Dialog */}
      {(showCreateDialog || editingInvestment) && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) { setShowCreateDialog(false); setEditingInvestment(null); } }}>
          <DialogContent className="bg-[#1E2329] text-[#EAECEF] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingInvestment ? 'Edit Investment' : 'Create Investment'}
              </DialogTitle>
              <DialogDescription>
                {editingInvestment ? 'Update investment product details' : 'Create a new investment product'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Product Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter product name"
                    className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                    <SelectTrigger className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quant-trading">Quant Trading</SelectItem>
                      <SelectItem value="arbitrage">Arbitrage</SelectItem>
                      <SelectItem value="staking">Staking</SelectItem>
                      <SelectItem value="mining">Mining</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crypto">Crypto</SelectItem>
                      <SelectItem value="stocks">Stocks</SelectItem>
                      <SelectItem value="forex">Forex</SelectItem>
                      <SelectItem value="commodities">Commodities</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Risk Level</Label>
                  <Select value={formData.riskLevel} onValueChange={(value) => setFormData({...formData, riskLevel: value as any})}>
                    <SelectTrigger className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="medium">Medium Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Minimum Investment</Label>
                  <Input
                    type="number"
                    value={formData.minimumInvestment}
                    onChange={(e) => setFormData({...formData, minimumInvestment: parseInt(e.target.value)})}
                    className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
                <div>
                  <Label>Maximum Investment</Label>
                  <Input
                    type="number"
                    value={formData.maximumInvestment}
                    onChange={(e) => setFormData({...formData, maximumInvestment: parseInt(e.target.value)})}
                    className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
                <div>
                  <Label>Expected Return (%)</Label>
                  <Input
                    type="number"
                    value={formData.expectedReturn}
                    onChange={(e) => setFormData({...formData, expectedReturn: parseFloat(e.target.value)})}
                    className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
                <div>
                  <Label>Duration</Label>
                  <Select value={formData.duration} onValueChange={(value) => setFormData({...formData, duration: value})}>
                    <SelectTrigger className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3 months">3 months</SelectItem>
                      <SelectItem value="6 months">6 months</SelectItem>
                      <SelectItem value="12 months">12 months</SelectItem>
                      <SelectItem value="24 months">24 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter product description"
                  className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  rows={3}
                />
              </div>

              <div>
                <Label>Long Description</Label>
                <Textarea
                  value={formData.longDescription}
                  onChange={(e) => setFormData({...formData, longDescription: e.target.value})}
                  placeholder="Enter detailed product description"
                  className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Management Fee (%)</Label>
                  <Input
                    type="number"
                    value={formData.managementFee}
                    onChange={(e) => setFormData({...formData, managementFee: parseFloat(e.target.value)})}
                    className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
                <div>
                  <Label>Performance Fee (%)</Label>
                  <Input
                    type="number"
                    value={formData.performanceFee}
                    onChange={(e) => setFormData({...formData, performanceFee: parseFloat(e.target.value)})}
                    className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
                <div>
                  <Label>Lockup Period</Label>
                  <Select value={formData.lockupPeriod} onValueChange={(value) => setFormData({...formData, lockupPeriod: value})}>
                    <SelectTrigger className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1 month">1 month</SelectItem>
                      <SelectItem value="3 months">3 months</SelectItem>
                      <SelectItem value="6 months">6 months</SelectItem>
                      <SelectItem value="12 months">12 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData({...formData, featured: checked})}
                  />
                  <Label>Featured Product</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.popular}
                    onCheckedChange={(checked) => setFormData({...formData, popular: checked})}
                  />
                  <Label>Popular Product</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowCreateDialog(false); setEditingInvestment(null); }}>
                Cancel
              </Button>
              <Button onClick={editingInvestment ? handleSaveInvestment : handleCreateInvestment} className="bg-[#F0B90B] text-black hover:bg-yellow-400">
                {editingInvestment ? 'Save Changes' : 'Create Investment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
