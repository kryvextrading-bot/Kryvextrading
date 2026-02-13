import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw,
  Download,
  Eye,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Shield,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Award,
  Briefcase,
  Building,
  Rocket,
  Gem,
  Coins,
  Factory,
  LineChart,
  Copy,
  History,
  Settings,
  Save,
  Upload,
  Image,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  ExternalLink,
  Users,
  Wallet,
  Percent,
  Calendar,
  Flag,
  Lock,
  Unlock,
  EyeOff,
  Gauge,
  Activity,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Fingerprint,
  Key,
  Scale,
  Landmark,
  Globe,
  Network,
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
  Award as AwardIcon,
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
  Plutonium
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart as RechartsLineChart,
  Line,
  Area,
  AreaChart,
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
interface InvestmentProduct {
  id: string;
  name: string;
  type: 'quant-trading' | 'arbitrage' | 'staking' | 'mining' | 'defi' | 'futures' | 'options' | 'real-estate' | 'private-equity' | 'venture-capital';
  category: 'crypto' | 'forex' | 'stocks' | 'commodities' | 'real-estate' | 'private-equity' | 'venture-capital';
  description: string;
  longDescription?: string;
  minimumInvestment: number;
  maximumInvestment?: number;
  expectedReturn: number;
  actualReturn?: number;
  duration: string;
  durationDays: number;
  riskLevel: 'low' | 'medium' | 'high' | 'very-high' | 'extreme';
  status: 'active' | 'inactive' | 'coming-soon' | 'ended' | 'paused';
  icon: string;
  imageUrl?: string;
  
  // Financial metrics
  totalInvested: number;
  investorsCount: number;
  performance: number;
  performanceHistory?: { date: string; value: number }[];
  
  // Fees & terms
  managementFee: number;
  performanceFee: number;
  earlyWithdrawalPenalty?: number;
  lockupPeriod?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  tags: string[];
  featured: boolean;
  popular: boolean;
  
  // Documentation
  documents?: {
    name: string;
    url: string;
    type: string;
  }[];
  
  // Risk metrics
  sharpeRatio?: number;
  sortinoRatio?: number;
  calmarRatio?: number;
  omegaRatio?: number;
  volatility?: number;
  maxDrawdown?: number;
  var_95?: number; // Value at Risk 95%
  cvar_95?: number; // Conditional VaR
  beta?: number;
  alpha?: number;
  rSquared?: number;
  trackingError?: number;
  informationRatio?: number;
  
  // Advanced risk metrics
  skewness?: number;
  kurtosis?: number;
  downsideDeviation?: number;
  gainDeviation?: number;
  lossDeviation?: number;
  avgWin?: number;
  avgLoss?: number;
  winRate?: number;
  profitFactor?: number;
  recoveryFactor?: number;
  
  // Distribution
  distributionFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'at-maturity';
  
  // Availability
  availableFrom?: string;
  availableTo?: string;
  maxCapacity?: number;
  currentAllocation?: number;
  
  // Compliance
  regulatoryStatus: 'approved' | 'pending' | 'rejected' | 'exempt';
  jurisdictions: string[];
  investorRestrictions: string[];
  accreditedOnly: boolean;
  
  // Risk ratings
  riskRating: number; // 1-10
  liquidityRating: number; // 1-10
  complexityRating: number; // 1-10
  
  // Historical data
  historicalReturns?: { date: string; value: number }[];
  drawdownHistory?: { date: string; value: number }[];
  volatilityHistory?: { date: string; value: number }[];
  
  // Stress test results
  stressTests?: {
    scenario: string;
    impact: number;
    probability: 'low' | 'medium' | 'high';
  }[];
}

interface InvestmentStats {
  totalProducts: number;
  activeProducts: number;
  totalInvested: number;
  totalInvestors: number;
  averageReturn: number;
  averageRisk: number;
  averageSharpe: number;
  averageVolatility: number;
  bestPerformer: InvestmentProduct | null;
  worstPerformer: InvestmentProduct | null;
  riskDistribution: { name: string; value: number; color: string }[];
  typeDistribution: { name: string; value: number }[];
  performanceOverTime: { date: string; value: number }[];
  monthlyGrowth: { month: string; investments: number; value: number }[];
  riskReturnScatter: { name: string; risk: number; return: number; size: number }[];
  correlationMatrix: { asset1: string; asset2: string; correlation: number }[];
  varDistribution: { range: string; count: number }[];
}

// Risk scenario presets
const riskScenarios = [
  { name: 'Market Crash - 2008 Style', impact: -40, probability: 'low' },
  { name: 'Moderate Correction', impact: -15, probability: 'medium' },
  { name: 'Interest Rate Hike', impact: -8, probability: 'high' },
  { name: 'Regulatory Change', impact: -12, probability: 'medium' },
  { name: 'Tech Bubble Burst', impact: -25, probability: 'low' },
  { name: 'Currency Crisis', impact: -18, probability: 'medium' },
  { name: 'Geopolitical Event', impact: -10, probability: 'high' },
  { name: 'Liquidity Crisis', impact: -22, probability: 'low' },
  { name: 'Pandemic Outbreak', impact: -30, probability: 'low' },
  { name: 'Black Swan Event', impact: -50, probability: 'very-low' },
];

// ==================== MOCK DATA ====================
const mockInvestments: InvestmentProduct[] = [
  {
    id: '1',
    name: 'Quant Trading Alpha',
    type: 'quant-trading',
    category: 'crypto',
    description: 'AI-powered quantitative trading strategies with proven track record',
    longDescription: 'Our flagship quant trading product utilizes advanced machine learning algorithms to identify and execute profitable trading opportunities across 50+ cryptocurrency pairs. The strategy combines mean reversion, momentum, and arbitrage techniques with rigorous risk management.',
    minimumInvestment: 10000,
    maximumInvestment: 1000000,
    expectedReturn: 25.5,
    actualReturn: 18.2,
    duration: '12 months',
    durationDays: 365,
    riskLevel: 'high',
    status: 'active',
    icon: '🤖',
    imageUrl: '/images/quant-trading.jpg',
    totalInvested: 2500000,
    investorsCount: 125,
    performance: 18.2,
    performanceHistory: [
      { date: '2024-01', value: 2.1 },
      { date: '2024-02', value: 3.4 },
      { date: '2024-03', value: -1.2 },
      { date: '2024-04', value: 4.5 },
      { date: '2024-05', value: 5.2 },
      { date: '2024-06', value: 3.8 },
      { date: '2024-07', value: 2.4 }
    ],
    managementFee: 2.0,
    performanceFee: 20,
    earlyWithdrawalPenalty: 5,
    lockupPeriod: '3 months',
    createdAt: '2024-01-15',
    updatedAt: '2024-07-15',
    createdBy: 'admin.sarah',
    tags: ['ai', 'quant', 'high-yield'],
    featured: true,
    popular: true,
    documents: [
      { name: 'Fact Sheet', url: '/docs/quant-alpha-factsheet.pdf', type: 'pdf' },
      { name: 'Risk Disclosure', url: '/docs/quant-alpha-risk.pdf', type: 'pdf' }
    ],
    sharpeRatio: 1.8,
    sortinoRatio: 2.1,
    calmarRatio: 1.2,
    omegaRatio: 1.5,
    volatility: 15.2,
    maxDrawdown: -8.5,
    var_95: -12.3,
    cvar_95: -15.8,
    beta: 1.2,
    alpha: 8.5,
    rSquared: 0.85,
    trackingError: 5.2,
    informationRatio: 1.1,
    skewness: -0.3,
    kurtosis: 2.8,
    downsideDeviation: 10.5,
    gainDeviation: 12.8,
    lossDeviation: 8.2,
    avgWin: 3.2,
    avgLoss: -1.8,
    winRate: 62,
    profitFactor: 1.8,
    recoveryFactor: 1.5,
    distributionFrequency: 'monthly',
    availableFrom: '2024-01-01',
    availableTo: '2024-12-31',
    maxCapacity: 5000000,
    currentAllocation: 2500000,
    regulatoryStatus: 'approved',
    jurisdictions: ['US', 'UK', 'EU', 'SG'],
    investorRestrictions: ['accredited'],
    accreditedOnly: true,
    riskRating: 8,
    liquidityRating: 7,
    complexityRating: 9,
    historicalReturns: [
      { date: '2023-01', value: 2.1 },
      { date: '2023-02', value: 3.4 },
      { date: '2023-03', value: -1.2 },
      { date: '2023-04', value: 4.5 },
      { date: '2023-05', value: 5.2 },
      { date: '2023-06', value: 3.8 },
      { date: '2023-07', value: 2.4 },
      { date: '2023-08', value: 1.8 },
      { date: '2023-09', value: -0.5 },
      { date: '2023-10', value: 3.2 },
      { date: '2023-11', value: 4.1 },
      { date: '2023-12', value: 2.9 }
    ],
    drawdownHistory: [
      { date: '2023-01', value: 0 },
      { date: '2023-02', value: -0.5 },
      { date: '2023-03', value: -2.8 },
      { date: '2023-04', value: -1.2 },
      { date: '2023-05', value: -0.8 },
      { date: '2023-06', value: -1.5 },
      { date: '2023-07', value: -0.3 },
      { date: '2023-08', value: -0.7 },
      { date: '2023-09', value: -3.5 },
      { date: '2023-10', value: -1.8 },
      { date: '2023-11', value: -0.9 },
      { date: '2023-12', value: -0.4 }
    ],
    volatilityHistory: [
      { date: '2023-01', value: 14.2 },
      { date: '2023-02', value: 15.8 },
      { date: '2023-03', value: 18.5 },
      { date: '2023-04', value: 16.2 },
      { date: '2023-05', value: 15.1 },
      { date: '2023-06', value: 14.8 },
      { date: '2023-07', value: 13.9 },
      { date: '2023-08', value: 14.5 },
      { date: '2023-09', value: 17.2 },
      { date: '2023-10', value: 15.8 },
      { date: '2023-11', value: 14.9 },
      { date: '2023-12', value: 14.2 }
    ],
    stressTests: [
      { scenario: 'Market Crash - 2008 Style', impact: -35, probability: 'low' },
      { scenario: 'Moderate Correction', impact: -12, probability: 'medium' },
      { scenario: 'Interest Rate Hike', impact: -6, probability: 'high' },
      { scenario: 'Regulatory Change', impact: -8, probability: 'medium' },
      { scenario: 'Tech Bubble Burst', impact: -20, probability: 'low' }
    ]
  },
  {
    id: '2',
    name: 'Arbitrage Premium',
    type: 'arbitrage',
    category: 'crypto',
    description: 'Risk-free arbitrage opportunities across multiple exchanges',
    longDescription: 'This product capitalizes on price discrepancies across 15+ major cryptocurrency exchanges. Our low-latency infrastructure executes triangular, cross-exchange, and statistical arbitrage strategies with minimal market exposure.',
    minimumInvestment: 5000,
    maximumInvestment: 500000,
    expectedReturn: 15.8,
    actualReturn: 12.4,
    duration: '6 months',
    durationDays: 180,
    riskLevel: 'low',
    status: 'active',
    icon: '⚡',
    imageUrl: '/images/arbitrage.jpg',
    totalInvested: 1800000,
    investorsCount: 89,
    performance: 12.4,
    performanceHistory: [
      { date: '2024-01', value: 1.8 },
      { date: '2024-02', value: 2.1 },
      { date: '2024-03', value: 1.9 },
      { date: '2024-04', value: 2.2 },
      { date: '2024-05', value: 2.4 },
      { date: '2024-06', value: 2.0 }
    ],
    managementFee: 1.5,
    performanceFee: 15,
    earlyWithdrawalPenalty: 3,
    lockupPeriod: '1 month',
    createdAt: '2024-02-20',
    updatedAt: '2024-07-15',
    createdBy: 'admin.john',
    tags: ['arbitrage', 'low-risk', 'consistent'],
    featured: false,
    popular: true,
    documents: [
      { name: 'Fact Sheet', url: '/docs/arbitrage-factsheet.pdf', type: 'pdf' },
      { name: 'Risk Disclosure', url: '/docs/arbitrage-risk.pdf', type: 'pdf' }
    ],
    sharpeRatio: 2.2,
    sortinoRatio: 2.8,
    calmarRatio: 1.8,
    omegaRatio: 2.1,
    volatility: 8.5,
    maxDrawdown: -3.2,
    var_95: -5.2,
    cvar_95: -6.8,
    beta: 0.3,
    alpha: 5.2,
    rSquared: 0.45,
    trackingError: 3.2,
    informationRatio: 1.8,
    skewness: 0.2,
    kurtosis: 2.1,
    downsideDeviation: 5.8,
    gainDeviation: 7.2,
    lossDeviation: 4.5,
    avgWin: 2.1,
    avgLoss: -0.8,
    winRate: 78,
    profitFactor: 2.6,
    recoveryFactor: 2.2,
    distributionFrequency: 'weekly',
    availableFrom: '2024-02-01',
    availableTo: '2024-12-31',
    maxCapacity: 3000000,
    currentAllocation: 1800000,
    regulatoryStatus: 'approved',
    jurisdictions: ['US', 'UK', 'EU', 'SG', 'AU'],
    investorRestrictions: [],
    accreditedOnly: false,
    riskRating: 3,
    liquidityRating: 8,
    complexityRating: 5,
    historicalReturns: [
      { date: '2023-01', value: 1.5 },
      { date: '2023-02', value: 1.8 },
      { date: '2023-03', value: 1.6 },
      { date: '2023-04', value: 1.9 },
      { date: '2023-05', value: 2.1 },
      { date: '2023-06', value: 1.7 },
      { date: '2023-07', value: 1.8 },
      { date: '2023-08', value: 1.9 },
      { date: '2023-09', value: 1.5 },
      { date: '2023-10', value: 1.8 },
      { date: '2023-11', value: 2.0 },
      { date: '2023-12', value: 1.9 }
    ],
    drawdownHistory: [
      { date: '2023-01', value: 0 },
      { date: '2023-02', value: -0.2 },
      { date: '2023-03', value: -0.8 },
      { date: '2023-04', value: -0.3 },
      { date: '2023-05', value: -0.4 },
      { date: '2023-06', value: -0.6 },
      { date: '2023-07', value: -0.2 },
      { date: '2023-08', value: -0.3 },
      { date: '2023-09', value: -0.9 },
      { date: '2023-10', value: -0.5 },
      { date: '2023-11', value: -0.3 },
      { date: '2023-12', value: -0.2 }
    ],
    volatilityHistory: [
      { date: '2023-01', value: 7.8 },
      { date: '2023-02', value: 8.2 },
      { date: '2023-03', value: 9.1 },
      { date: '2023-04', value: 8.5 },
      { date: '2023-05', value: 8.1 },
      { date: '2023-06', value: 7.9 },
      { date: '2023-07', value: 7.5 },
      { date: '2023-08', value: 7.8 },
      { date: '2023-09', value: 8.8 },
      { date: '2023-10', value: 8.2 },
      { date: '2023-11', value: 7.9 },
      { date: '2023-12', value: 7.6 }
    ],
    stressTests: [
      { scenario: 'Market Crash - 2008 Style', impact: -12, probability: 'low' },
      { scenario: 'Moderate Correction', impact: -5, probability: 'medium' },
      { scenario: 'Interest Rate Hike', impact: -2, probability: 'high' },
      { scenario: 'Regulatory Change', impact: -4, probability: 'medium' },
      { scenario: 'Liquidity Crisis', impact: -8, probability: 'low' }
    ]
  },
  {
    id: '3',
    name: 'Staking Rewards Plus',
    type: 'staking',
    category: 'crypto',
    description: 'High-yield cryptocurrency staking with institutional security',
    longDescription: 'Earn passive income by staking proof-of-stake cryptocurrencies through our institutional-grade infrastructure. We stake across multiple networks including Ethereum, Solana, Cardano, and Polkadot, optimizing for both yield and security.',
    minimumInvestment: 1000,
    maximumInvestment: 250000,
    expectedReturn: 8.5,
    actualReturn: 7.2,
    duration: '3 months',
    durationDays: 90,
    riskLevel: 'low',
    status: 'active',
    icon: '💎',
    imageUrl: '/images/staking.jpg',
    totalInvested: 950000,
    investorsCount: 234,
    performance: 7.2,
    performanceHistory: [
      { date: '2024-01', value: 2.0 },
      { date: '2024-02', value: 2.1 },
      { date: '2024-03', value: 1.8 },
      { date: '2024-04', value: 1.9 },
      { date: '2024-05', value: 2.2 },
      { date: '2024-06', value: 2.0 }
    ],
    managementFee: 1.0,
    performanceFee: 10,
    earlyWithdrawalPenalty: 2,
    lockupPeriod: '7 days',
    createdAt: '2024-03-10',
    updatedAt: '2024-07-15',
    createdBy: 'admin.sarah',
    tags: ['staking', 'passive-income', 'beginner-friendly'],
    featured: true,
    popular: true,
    documents: [
      { name: 'Fact Sheet', url: '/docs/staking-factsheet.pdf', type: 'pdf' },
      { name: 'Risk Disclosure', url: '/docs/staking-risk.pdf', type: 'pdf' }
    ],
    sharpeRatio: 1.5,
    sortinoRatio: 1.9,
    calmarRatio: 1.4,
    omegaRatio: 1.7,
    volatility: 5.8,
    maxDrawdown: -1.5,
    var_95: -2.8,
    cvar_95: -3.5,
    beta: 0.2,
    alpha: 3.2,
    rSquared: 0.35,
    trackingError: 2.1,
    informationRatio: 1.5,
    skewness: 0.1,
    kurtosis: 1.8,
    downsideDeviation: 3.5,
    gainDeviation: 4.8,
    lossDeviation: 2.2,
    avgWin: 1.2,
    avgLoss: -0.3,
    winRate: 85,
    profitFactor: 4.0,
    recoveryFactor: 3.5,
    distributionFrequency: 'daily',
    availableFrom: '2024-03-01',
    availableTo: '2024-12-31',
    maxCapacity: 2000000,
    currentAllocation: 950000,
    regulatoryStatus: 'approved',
    jurisdictions: ['US', 'UK', 'EU', 'SG', 'AU', 'CA'],
    investorRestrictions: [],
    accreditedOnly: false,
    riskRating: 2,
    liquidityRating: 9,
    complexityRating: 3,
    historicalReturns: [
      { date: '2023-01', value: 0.8 },
      { date: '2023-02', value: 0.9 },
      { date: '2023-03', value: 0.8 },
      { date: '2023-04', value: 1.0 },
      { date: '2023-05', value: 1.1 },
      { date: '2023-06', value: 1.0 },
      { date: '2023-07', value: 0.9 },
      { date: '2023-08', value: 1.0 },
      { date: '2023-09', value: 0.8 },
      { date: '2023-10', value: 0.9 },
      { date: '2023-11', value: 1.1 },
      { date: '2023-12', value: 1.0 }
    ],
    drawdownHistory: [
      { date: '2023-01', value: 0 },
      { date: '2023-02', value: -0.1 },
      { date: '2023-03', value: -0.3 },
      { date: '2023-04', value: -0.1 },
      { date: '2023-05', value: -0.1 },
      { date: '2023-06', value: -0.2 },
      { date: '2023-07', value: -0.1 },
      { date: '2023-08', value: -0.1 },
      { date: '2023-09', value: -0.4 },
      { date: '2023-10', value: -0.2 },
      { date: '2023-11', value: -0.1 },
      { date: '2023-12', value: -0.1 }
    ],
    volatilityHistory: [
      { date: '2023-01', value: 5.2 },
      { date: '2023-02', value: 5.5 },
      { date: '2023-03', value: 6.1 },
      { date: '2023-04', value: 5.8 },
      { date: '2023-05', value: 5.6 },
      { date: '2023-06', value: 5.4 },
      { date: '2023-07', value: 5.1 },
      { date: '2023-08', value: 5.3 },
      { date: '2023-09', value: 5.9 },
      { date: '2023-10', value: 5.5 },
      { date: '2023-11', value: 5.2 },
      { date: '2023-12', value: 5.0 }
    ],
    stressTests: [
      { scenario: 'Market Crash - 2008 Style', impact: -5, probability: 'low' },
      { scenario: 'Moderate Correction', impact: -2, probability: 'medium' },
      { scenario: 'Interest Rate Hike', impact: -1, probability: 'high' },
      { scenario: 'Regulatory Change', impact: -3, probability: 'medium' },
      { scenario: 'Network Attack', impact: -8, probability: 'low' }
    ]
  },
  {
    id: '4',
    name: 'DeFi Yield Farm',
    type: 'defi',
    category: 'crypto',
    description: 'Decentralized finance yield farming across multiple protocols',
    longDescription: 'Access high-yield DeFi opportunities across Ethereum, BSC, Arbitrum, and Optimism. Our strategy dynamically allocates capital to the most profitable and secure liquidity pools, lending protocols, and yield farms.',
    minimumInvestment: 2500,
    maximumInvestment: 200000,
    expectedReturn: 32.0,
    actualReturn: -5.3,
    duration: '9 months',
    durationDays: 270,
    riskLevel: 'high',
    status: 'inactive',
    icon: '🌾',
    imageUrl: '/images/defi.jpg',
    totalInvested: 750000,
    investorsCount: 45,
    performance: -5.3,
    performanceHistory: [
      { date: '2024-01', value: 3.2 },
      { date: '2024-02', value: 4.1 },
      { date: '2024-03', value: -2.8 },
      { date: '2024-04', value: -3.5 },
      { date: '2024-05', value: -4.2 },
      { date: '2024-06', value: -2.1 }
    ],
    managementFee: 2.5,
    performanceFee: 25,
    earlyWithdrawalPenalty: 10,
    lockupPeriod: '6 months',
    createdAt: '2024-04-05',
    updatedAt: '2024-07-15',
    createdBy: 'admin.john',
    tags: ['defi', 'high-yield', 'experimental'],
    featured: false,
    popular: false,
    documents: [
      { name: 'Fact Sheet', url: '/docs/defi-factsheet.pdf', type: 'pdf' },
      { name: 'Risk Disclosure', url: '/docs/defi-risk.pdf', type: 'pdf' }
    ],
    sharpeRatio: -0.5,
    sortinoRatio: -0.7,
    calmarRatio: -0.3,
    omegaRatio: 0.6,
    volatility: 25.3,
    maxDrawdown: -15.2,
    var_95: -22.5,
    cvar_95: -28.2,
    beta: 2.5,
    alpha: -12.5,
    rSquared: 0.75,
    trackingError: 12.5,
    informationRatio: -0.8,
    skewness: -1.2,
    kurtosis: 4.5,
    downsideDeviation: 22.5,
    gainDeviation: 18.2,
    lossDeviation: 25.8,
    avgWin: 8.5,
    avgLoss: -12.2,
    winRate: 42,
    profitFactor: 0.7,
    recoveryFactor: -0.5,
    distributionFrequency: 'monthly',
    availableFrom: '2024-04-01',
    availableTo: '2024-09-30',
    maxCapacity: 1500000,
    currentAllocation: 750000,
    regulatoryStatus: 'pending',
    jurisdictions: ['US', 'UK', 'EU'],
    investorRestrictions: ['accredited'],
    accreditedOnly: true,
    riskRating: 9,
    liquidityRating: 4,
    complexityRating: 10,
    historicalReturns: [
      { date: '2023-01', value: 4.5 },
      { date: '2023-02', value: 5.2 },
      { date: '2023-03', value: -2.5 },
      { date: '2023-04', value: -1.8 },
      { date: '2023-05', value: -3.2 },
      { date: '2023-06', value: 2.1 },
      { date: '2023-07', value: 3.8 },
      { date: '2023-08', value: -2.2 },
      { date: '2023-09', value: -4.5 },
      { date: '2023-10', value: 1.5 },
      { date: '2023-11', value: -1.2 },
      { date: '2023-12', value: -2.8 }
    ],
    drawdownHistory: [
      { date: '2023-01', value: 0 },
      { date: '2023-02', value: -0.5 },
      { date: '2023-03', value: -5.2 },
      { date: '2023-04', value: -8.5 },
      { date: '2023-05', value: -12.2 },
      { date: '2023-06', value: -8.5 },
      { date: '2023-07', value: -6.2 },
      { date: '2023-08', value: -10.5 },
      { date: '2023-09', value: -15.2 },
      { date: '2023-10', value: -12.5 },
      { date: '2023-11', value: -14.2 },
      { date: '2023-12', value: -15.2 }
    ],
    volatilityHistory: [
      { date: '2023-01', value: 22.5 },
      { date: '2023-02', value: 24.2 },
      { date: '2023-03', value: 28.5 },
      { date: '2023-04', value: 26.8 },
      { date: '2023-05', value: 29.2 },
      { date: '2023-06', value: 25.5 },
      { date: '2023-07', value: 23.8 },
      { date: '2023-08', value: 26.2 },
      { date: '2023-09', value: 30.5 },
      { date: '2023-10', value: 27.5 },
      { date: '2023-11', value: 25.8 },
      { date: '2023-12', value: 24.2 }
    ],
    stressTests: [
      { scenario: 'Market Crash - 2008 Style', impact: -45, probability: 'medium' },
      { scenario: 'Moderate Correction', impact: -18, probability: 'high' },
      { scenario: 'Interest Rate Hike', impact: -12, probability: 'medium' },
      { scenario: 'Regulatory Change', impact: -25, probability: 'high' },
      { scenario: 'Smart Contract Hack', impact: -60, probability: 'low' },
      { scenario: 'Liquidity Crisis', impact: -35, probability: 'medium' }
    ]
  },
  {
    id: '5',
    name: 'Bitcoin Mining Fund',
    type: 'mining',
    category: 'crypto',
    description: 'Institutional Bitcoin mining with state-of-the-art infrastructure',
    longDescription: 'Invest in industrial-scale Bitcoin mining operations with facilities in North America and Europe. We own and operate the latest generation ASIC miners with access to low-cost renewable energy.',
    minimumInvestment: 25000,
    maximumInvestment: 1000000,
    expectedReturn: 18.0,
    actualReturn: 15.5,
    duration: '24 months',
    durationDays: 730,
    riskLevel: 'medium',
    status: 'coming-soon',
    icon: '⛏️',
    imageUrl: '/images/mining.jpg',
    totalInvested: 3500000,
    investorsCount: 78,
    performance: 15.5,
    performanceHistory: [
      { date: '2024-01', value: 3.5 },
      { date: '2024-02', value: 3.8 },
      { date: '2024-03', value: 4.2 },
      { date: '2024-04', value: 4.0 },
      { date: '2024-05', value: 3.9 },
      { date: '2024-06', value: 4.1 }
    ],
    managementFee: 3.0,
    performanceFee: 20,
    earlyWithdrawalPenalty: 15,
    lockupPeriod: '12 months',
    createdAt: '2024-05-20',
    updatedAt: '2024-07-15',
    createdBy: 'admin.sarah',
    tags: ['mining', 'bitcoin', 'long-term'],
    featured: true,
    popular: false,
    documents: [
      { name: 'Fact Sheet', url: '/docs/mining-factsheet.pdf', type: 'pdf' },
      { name: 'Risk Disclosure', url: '/docs/mining-risk.pdf', type: 'pdf' }
    ],
    sharpeRatio: 1.2,
    sortinoRatio: 1.5,
    calmarRatio: 0.9,
    omegaRatio: 1.3,
    volatility: 12.5,
    maxDrawdown: -5.8,
    var_95: -9.5,
    cvar_95: -12.2,
    beta: 1.5,
    alpha: 6.5,
    rSquared: 0.65,
    trackingError: 7.5,
    informationRatio: 0.9,
    skewness: 0.2,
    kurtosis: 2.5,
    downsideDeviation: 9.5,
    gainDeviation: 11.2,
    lossDeviation: 7.5,
    avgWin: 4.2,
    avgLoss: -2.1,
    winRate: 68,
    profitFactor: 2.0,
    recoveryFactor: 1.8,
    distributionFrequency: 'quarterly',
    availableFrom: '2024-08-01',
    availableTo: '2024-12-31',
    maxCapacity: 10000000,
    currentAllocation: 3500000,
    regulatoryStatus: 'approved',
    jurisdictions: ['US', 'CA', 'NO', 'SE'],
    investorRestrictions: ['accredited'],
    accreditedOnly: true,
    riskRating: 6,
    liquidityRating: 5,
    complexityRating: 7,
    historicalReturns: [
      { date: '2023-01', value: 2.8 },
      { date: '2023-02', value: 3.1 },
      { date: '2023-03', value: 3.5 },
      { date: '2023-04', value: 3.2 },
      { date: '2023-05', value: 2.9 },
      { date: '2023-06', value: 3.3 },
      { date: '2023-07', value: 3.6 },
      { date: '2023-08', value: 3.4 },
      { date: '2023-09', value: 2.7 },
      { date: '2023-10', value: 3.0 },
      { date: '2023-11', value: 3.5 },
      { date: '2023-12', value: 3.8 }
    ],
    drawdownHistory: [
      { date: '2023-01', value: 0 },
      { date: '2023-02', value: -0.3 },
      { date: '2023-03', value: -1.2 },
      { date: '2023-04', value: -0.8 },
      { date: '2023-05', value: -1.5 },
      { date: '2023-06', value: -0.5 },
      { date: '2023-07', value: -0.2 },
      { date: '2023-08', value: -0.9 },
      { date: '2023-09', value: -2.1 },
      { date: '2023-10', value: -1.8 },
      { date: '2023-11', value: -0.6 },
      { date: '2023-12', value: -0.4 }
    ],
    volatilityHistory: [
      { date: '2023-01', value: 11.2 },
      { date: '2023-02', value: 11.8 },
      { date: '2023-03', value: 13.5 },
      { date: '2023-04', value: 12.8 },
      { date: '2023-05', value: 12.2 },
      { date: '2023-06', value: 11.5 },
      { date: '2023-07', value: 10.8 },
      { date: '2023-08', value: 11.5 },
      { date: '2023-09', value: 13.2 },
      { date: '2023-10', value: 12.5 },
      { date: '2023-11', value: 11.8 },
      { date: '2023-12', value: 11.2 }
    ],
    stressTests: [
      { scenario: 'Market Crash - 2008 Style', impact: -25, probability: 'low' },
      { scenario: 'Moderate Correction', impact: -10, probability: 'medium' },
      { scenario: 'Interest Rate Hike', impact: -8, probability: 'medium' },
      { scenario: 'Regulatory Change', impact: -12, probability: 'low' },
      { scenario: 'Energy Price Spike', impact: -15, probability: 'medium' },
      { scenario: 'Mining Difficulty Spike', impact: -10, probability: 'high' }
    ]
  }
];

const mockRiskDistribution = [
  { name: 'Low Risk', value: 45, color: '#10b981' },
  { name: 'Medium Risk', value: 35, color: '#f59e0b' },
  { name: 'High Risk', value: 15, color: '#ef4444' },
  { name: 'Very High Risk', value: 4, color: '#8b5cf6' },
  { name: 'Extreme Risk', value: 1, color: '#ec4899' }
];

const mockTypeDistribution = [
  { name: 'Quant Trading', value: 35 },
  { name: 'Arbitrage', value: 25 },
  { name: 'Staking', value: 20 },
  { name: 'DeFi', value: 12 },
  { name: 'Mining', value: 8 }
];

const mockPerformanceOverTime = [
  { date: 'Jan', value: 5.2 },
  { date: 'Feb', value: 6.8 },
  { date: 'Mar', value: 4.5 },
  { date: 'Apr', value: 7.2 },
  { date: 'May', value: 8.9 },
  { date: 'Jun', value: 10.3 },
  { date: 'Jul', value: 12.1 }
];

const mockMonthlyGrowth = [
  { month: 'Jan', investments: 12, value: 250000 },
  { month: 'Feb', investments: 18, value: 380000 },
  { month: 'Mar', investments: 15, value: 320000 },
  { month: 'Apr', investments: 22, value: 450000 },
  { month: 'May', investments: 25, value: 520000 },
  { month: 'Jun', investments: 30, value: 680000 }
];

// ==================== ICON MAPPING ====================
const iconMap: Record<string, React.ReactNode> = {
  'quant-trading': <LineChart className="w-5 h-5" />,
  'arbitrage': <Zap className="w-5 h-5" />,
  'staking': <Gem className="w-5 h-5" />,
  'mining': <Factory className="w-5 h-5" />,
  'defi': <Coins className="w-5 h-5" />,
  'futures': <BarChart3 className="w-5 h-5" />,
  'options': <Target className="w-5 h-5" />,
  'real-estate': <Building className="w-5 h-5" />,
  'private-equity': <Briefcase className="w-5 h-5" />,
  'venture-capital': <Rocket className="w-5 h-5" />
};

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
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'very-high': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'extreme': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'inactive': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    case 'coming-soon': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'ended': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'paused': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'quant-trading': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'arbitrage': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'staking': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'mining': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'defi': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'futures': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
    case 'options': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
    case 'real-estate': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'private-equity': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    case 'venture-capital': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const getRegulatoryColor = (status: string) => {
  switch (status) {
    case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'exempt': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
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

// ==================== RISK METRICS CARD ====================
const RiskMetricsCard = ({ product }: { product: InvestmentProduct }) => (
  <Card className="bg-[#1E2329] border border-[#2B3139]">
    <CardHeader>
      <CardTitle className="text-[#EAECEF] flex items-center gap-2">
        <Shield className="w-5 h-5 text-[#F0B90B]" />
        Risk Metrics
      </CardTitle>
      <CardDescription className="text-[#848E9C]">
        Advanced risk and performance indicators
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#181A20] rounded-lg p-3">
          <p className="text-xs text-[#848E9C]">Sharpe Ratio</p>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${(product.sharpeRatio || 0) > 1 ? 'text-green-400' : (product.sharpeRatio || 0) > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
              {product.sharpeRatio?.toFixed(2)}
            </span>
            <Badge className={product.sharpeRatio && product.sharpeRatio > 1 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
              {(product.sharpeRatio || 0) > 1 ? 'Good' : 'Fair'}
            </Badge>
          </div>
        </div>

        <div className="bg-[#181A20] rounded-lg p-3">
          <p className="text-xs text-[#848E9C]">Sortino Ratio</p>
          <span className={`text-lg font-bold ${(product.sortinoRatio || 0) > 1.5 ? 'text-green-400' : 'text-yellow-400'}`}>
            {product.sortinoRatio?.toFixed(2)}
          </span>
        </div>

        <div className="bg-[#181A20] rounded-lg p-3">
          <p className="text-xs text-[#848E9C]">Calmar Ratio</p>
          <span className={`text-lg font-bold ${(product.calmarRatio || 0) > 1 ? 'text-green-400' : 'text-yellow-400'}`}>
            {product.calmarRatio?.toFixed(2)}
          </span>
        </div>

        <div className="bg-[#181A20] rounded-lg p-3">
          <p className="text-xs text-[#848E9C]">Volatility</p>
          <span className="text-lg font-bold text-[#EAECEF]">{product.volatility?.toFixed(1)}%</span>
        </div>

        <div className="bg-[#181A20] rounded-lg p-3">
          <p className="text-xs text-[#848E9C]">Max Drawdown</p>
          <span className="text-lg font-bold text-red-400">{product.maxDrawdown?.toFixed(1)}%</span>
        </div>

        <div className="bg-[#181A20] rounded-lg p-3">
          <p className="text-xs text-[#848E9C]">VaR (95%)</p>
          <span className="text-lg font-bold text-red-400">{product.var_95?.toFixed(1)}%</span>
        </div>

        <div className="bg-[#181A20] rounded-lg p-3">
          <p className="text-xs text-[#848E9C]">CVaR (95%)</p>
          <span className="text-lg font-bold text-red-400">{product.cvar_95?.toFixed(1)}%</span>
        </div>

        <div className="bg-[#181A20] rounded-lg p-3">
          <p className="text-xs text-[#848E9C]">Beta</p>
          <span className="text-lg font-bold text-[#EAECEF]">{product.beta?.toFixed(2)}</span>
        </div>

        <div className="bg-[#181A20] rounded-lg p-3">
          <p className="text-xs text-[#848E9C]">Alpha</p>
          <span className={`text-lg font-bold ${(product.alpha || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {product.alpha?.toFixed(1)}%
          </span>
        </div>
      </div>

      <Separator className="bg-[#2B3139] my-4" />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-[#848E9C] mb-2">Win/Loss Statistics</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#848E9C]">Win Rate</span>
              <span className="text-green-400">{product.winRate}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#848E9C]">Avg Win</span>
              <span className="text-green-400">+{product.avgWin}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#848E9C]">Avg Loss</span>
              <span className="text-red-400">{product.avgLoss}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#848E9C]">Profit Factor</span>
              <span className={product.profitFactor && product.profitFactor > 1 ? 'text-green-400' : 'text-red-400'}>
                {product.profitFactor?.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs text-[#848E9C] mb-2">Distribution Metrics</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#848E9C]">Skewness</span>
              <span className={product.skewness && product.skewness > 0 ? 'text-green-400' : 'text-red-400'}>
                {product.skewness?.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#848E9C]">Kurtosis</span>
              <span className={product.kurtosis && product.kurtosis < 3 ? 'text-green-400' : 'text-yellow-400'}>
                {product.kurtosis?.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#848E9C]">Downside Dev</span>
              <span className="text-[#EAECEF]">{product.downsideDeviation?.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-[#2B3139] my-4" />

      <div>
        <p className="text-xs text-[#848E9C] mb-2">Stress Test Scenarios</p>
        <div className="space-y-2">
          {product.stressTests?.map((test, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 text-[#F0B90B]" />
                <span className="text-xs text-[#EAECEF]">{test.scenario}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400">{test.impact}%</span>
                <Badge className={
                  test.probability === 'low' ? 'bg-green-500/20 text-green-400' :
                  test.probability === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }>
                  {test.probability}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

// ==================== COMPLIANCE CARD ====================
const ComplianceCard = ({ product }: { product: InvestmentProduct }) => (
  <Card className="bg-[#1E2329] border border-[#2B3139]">
    <CardHeader>
      <CardTitle className="text-[#EAECEF] flex items-center gap-2">
        <Scale className="w-5 h-5 text-[#F0B90B]" />
        Compliance & Restrictions
      </CardTitle>
      <CardDescription className="text-[#848E9C]">
        Regulatory status and investor requirements
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#848E9C]">Regulatory Status</span>
          <Badge className={getRegulatoryColor(product.regulatoryStatus)}>
            {product.regulatoryStatus}
          </Badge>
        </div>

        <div>
          <span className="text-xs text-[#848E9C]">Approved Jurisdictions</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {product.jurisdictions.map((j, i) => (
              <Badge key={i} className="bg-[#2B3139] text-[#EAECEF]">
                {j}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <span className="text-xs text-[#848E9C]">Investor Restrictions</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {product.investorRestrictions.map((r, i) => (
              <Badge key={i} className="bg-[#2B3139] text-[#EAECEF]">
                {r}
              </Badge>
            ))}
            {product.accreditedOnly && (
              <Badge className="bg-[#F0B90B]/20 text-[#F0B90B]">
                Accredited Only
              </Badge>
            )}
          </div>
        </div>

        <Separator className="bg-[#2B3139]" />

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#181A20] rounded-lg p-2 text-center">
            <p className="text-xs text-[#848E9C]">Risk Rating</p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-lg font-bold text-[#EAECEF]">{product.riskRating}</span>
              <span className="text-xs text-[#848E9C]">/10</span>
            </div>
          </div>
          <div className="bg-[#181A20] rounded-lg p-2 text-center">
            <p className="text-xs text-[#848E9C]">Liquidity</p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-lg font-bold text-[#EAECEF]">{product.liquidityRating}</span>
              <span className="text-xs text-[#848E9C]">/10</span>
            </div>
          </div>
          <div className="bg-[#181A20] rounded-lg p-2 text-center">
            <p className="text-xs text-[#848E9C]">Complexity</p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-lg font-bold text-[#EAECEF]">{product.complexityRating}</span>
              <span className="text-xs text-[#848E9C]">/10</span>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// ==================== HISTORICAL CHARTS ====================
const HistoricalCharts = ({ product }: { product: InvestmentProduct }) => (
  <Card className="bg-[#1E2329] border border-[#2B3139]">
    <CardHeader>
      <CardTitle className="text-[#EAECEF] flex items-center gap-2">
        <LineChart className="w-5 h-5 text-[#F0B90B]" />
        Historical Performance
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={product.historicalReturns}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
            <XAxis dataKey="date" stroke="#848E9C" />
            <YAxis yAxisId="left" stroke="#848E9C" />
            <YAxis yAxisId="right" orientation="right" stroke="#848E9C" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1E2329', border: '1px solid #2B3139' }}
              labelStyle={{ color: '#F0B90B' }}
            />
            <Legend />
            <Bar yAxisId="right" dataKey="value" fill="#F0B90B" name="Monthly Return %" />
            <Line yAxisId="left" type="monotone" dataKey="value" stroke="#10b981" name="Trend" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-[#848E9C] mb-2">Drawdown History</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={product.drawdownHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
                <XAxis dataKey="date" stroke="#848E9C" />
                <YAxis stroke="#848E9C" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E2329', border: '1px solid #2B3139' }}
                />
                <Area type="monotone" dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <p className="text-xs text-[#848E9C] mb-2">Volatility History</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={product.volatilityHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
                <XAxis dataKey="date" stroke="#848E9C" />
                <YAxis stroke="#848E9C" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E2329', border: '1px solid #2B3139' }}
                />
                <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// ==================== MAIN COMPONENT ====================
export default function InvestmentAdminPanel() {
  const { toast } = useToast();
  
  // State
  const [investments, setInvestments] = useState<InvestmentProduct[]>(mockInvestments);
  const [filteredInvestments, setFilteredInvestments] = useState<InvestmentProduct[]>(mockInvestments);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRiskAnalysisOpen, setIsRiskAnalysisOpen] = useState(false);
  const [isStressTestOpen, setIsStressTestOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InvestmentProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<InvestmentProduct | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [riskTab, setRiskTab] = useState('metrics');
  const [formData, setFormData] = useState<Partial<InvestmentProduct>>({
    name: '',
    type: 'quant-trading',
    category: 'crypto',
    description: '',
    longDescription: '',
    minimumInvestment: 1000,
    maximumInvestment: 1000000,
    expectedReturn: 10,
    duration: '',
    durationDays: 30,
    riskLevel: 'medium',
    status: 'active',
    managementFee: 1,
    performanceFee: 20,
    earlyWithdrawalPenalty: 5,
    lockupPeriod: '',
    tags: [],
    featured: false,
    popular: false,
    distributionFrequency: 'monthly',
    icon: '📊',
    regulatoryStatus: 'pending',
    jurisdictions: [],
    investorRestrictions: [],
    accreditedOnly: false,
    riskRating: 5,
    liquidityRating: 5,
    complexityRating: 5,
    sharpeRatio: 1.0,
    sortinoRatio: 1.2,
    volatility: 10,
    maxDrawdown: -5,
    var_95: -8,
    winRate: 60,
    avgWin: 2,
    avgLoss: -1,
    profitFactor: 2,
    stressTests: []
  });
  const [newTag, setNewTag] = useState('');
  const [newJurisdiction, setNewJurisdiction] = useState('');
  const [newRestriction, setNewRestriction] = useState('');
  const [sortField, setSortField] = useState<keyof InvestmentProduct>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Calculate statistics
  const stats: InvestmentStats = {
    totalProducts: investments.length,
    activeProducts: investments.filter(p => p.status === 'active').length,
    totalInvested: investments.reduce((sum, p) => sum + p.totalInvested, 0),
    totalInvestors: investments.reduce((sum, p) => sum + p.investorsCount, 0),
    averageReturn: investments.reduce((sum, p) => sum + p.expectedReturn, 0) / investments.length,
    averageRisk: investments.reduce((sum, p) => sum + p.riskRating, 0) / investments.length,
    averageSharpe: investments.reduce((sum, p) => sum + (p.sharpeRatio || 0), 0) / investments.length,
    averageVolatility: investments.reduce((sum, p) => sum + (p.volatility || 0), 0) / investments.length,
    bestPerformer: investments.reduce((prev, current) => 
      (prev.performance > current.performance) ? prev : current, investments[0]),
    worstPerformer: investments.reduce((prev, current) => 
      (prev.performance < current.performance) ? prev : current, investments[0]),
    riskDistribution: mockRiskDistribution,
    typeDistribution: mockTypeDistribution,
    performanceOverTime: mockPerformanceOverTime,
    monthlyGrowth: mockMonthlyGrowth,
    riskReturnScatter: investments.map(p => ({
      name: p.name,
      risk: p.riskRating * 10,
      return: p.expectedReturn,
      size: p.totalInvested / 100000
    })),
    correlationMatrix: [
      { asset1: 'Quant', asset2: 'Arbitrage', correlation: 0.3 },
      { asset1: 'Quant', asset2: 'Staking', correlation: 0.2 },
      { asset1: 'Quant', asset2: 'DeFi', correlation: 0.7 },
      { asset1: 'Arbitrage', asset2: 'Staking', correlation: 0.1 },
      { asset1: 'Arbitrage', asset2: 'DeFi', correlation: 0.4 },
      { asset1: 'Staking', asset2: 'DeFi', correlation: 0.3 },
    ],
    varDistribution: [
      { range: '0-5%', count: 2 },
      { range: '5-10%', count: 1 },
      { range: '10-15%', count: 1 },
      { range: '15-20%', count: 0 },
      { range: '20%+', count: 1 },
    ]
  };

  // Filter investments
  useEffect(() => {
    let filtered = [...investments];

    if (searchTerm) {
      filtered = filtered.filter(inv => 
        inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
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

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(inv => inv.category === selectedCategory);
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

    setFilteredInvestments(filtered);
  }, [investments, searchTerm, selectedType, selectedRisk, selectedStatus, selectedCategory, sortField, sortDirection]);

  // Handlers
  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Data Refreshed",
        description: "Investment data has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh investment data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
    const headers = [
      'Name', 'Type', 'Category', 'Min Investment', 'Max Investment', 
      'Expected Return', 'Actual Return', 'Duration', 'Risk Level', 'Status',
      'Total Invested', 'Investors', 'Management Fee', 'Performance Fee',
      'Sharpe Ratio', 'Volatility', 'Max Drawdown', 'VaR 95%',
      'Win Rate', 'Profit Factor', 'Created At', 'Featured', 'Popular', 'Tags'
    ];

    const rows = filteredInvestments.map(inv => [
      inv.name,
      inv.type,
      inv.category,
      inv.minimumInvestment,
      inv.maximumInvestment || 'N/A',
      inv.expectedReturn + '%',
      (inv.actualReturn || 0) + '%',
      inv.duration,
      inv.riskLevel,
      inv.status,
      inv.totalInvested,
      inv.investorsCount,
      inv.managementFee + '%',
      inv.performanceFee + '%',
      inv.sharpeRatio?.toFixed(2) || 'N/A',
      inv.volatility?.toFixed(1) + '%' || 'N/A',
      inv.maxDrawdown?.toFixed(1) + '%' || 'N/A',
      inv.var_95?.toFixed(1) + '%' || 'N/A',
      inv.winRate?.toString() + '%' || 'N/A',
      inv.profitFactor?.toFixed(2) || 'N/A',
      inv.createdAt,
      inv.featured ? 'Yes' : 'No',
      inv.popular ? 'Yes' : 'No',
      inv.tags.join(', ')
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investment-products-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `${filteredInvestments.length} products exported successfully.`,
    });
  };

  const handleAddProduct = () => {
    setFormData({
      name: '',
      type: 'quant-trading',
      category: 'crypto',
      description: '',
      longDescription: '',
      minimumInvestment: 1000,
      maximumInvestment: 1000000,
      expectedReturn: 10,
      duration: '',
      durationDays: 30,
      riskLevel: 'medium',
      status: 'active',
      managementFee: 1,
      performanceFee: 20,
      earlyWithdrawalPenalty: 5,
      lockupPeriod: '',
      tags: [],
      featured: false,
      popular: false,
      distributionFrequency: 'monthly',
      icon: '📊',
      regulatoryStatus: 'pending',
      jurisdictions: [],
      investorRestrictions: [],
      accreditedOnly: false,
      riskRating: 5,
      liquidityRating: 5,
      complexityRating: 5,
      sharpeRatio: 1.0,
      sortinoRatio: 1.2,
      volatility: 10,
      maxDrawdown: -5,
      var_95: -8,
      winRate: 60,
      avgWin: 2,
      avgLoss: -1,
      profitFactor: 2,
      stressTests: []
    });
    setNewTag('');
    setNewJurisdiction('');
    setNewRestriction('');
    setIsAddDialogOpen(true);
  };

  const handleEditProduct = (product: InvestmentProduct) => {
    setSelectedProduct(product);
    setFormData(product);
    setNewTag('');
    setNewJurisdiction('');
    setNewRestriction('');
    setIsEditDialogOpen(true);
  };

  const handleViewProduct = (product: InvestmentProduct) => {
    setSelectedProduct(product);
    setIsViewDialogOpen(true);
  };

  const handleRiskAnalysis = (product: InvestmentProduct) => {
    setSelectedProduct(product);
    setIsRiskAnalysisOpen(true);
  };

  const handleStressTest = (product: InvestmentProduct) => {
    setSelectedProduct(product);
    setIsStressTestOpen(true);
  };

  const handleDeleteClick = (product: InvestmentProduct) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setInvestments(prev => prev.filter(inv => inv.id !== productToDelete.id));
      
      toast({
        title: "Product Deleted",
        description: `${productToDelete.name} has been removed successfully.`,
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete investment product.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleSaveProduct = async () => {
    // Validation
    if (!formData.name || !formData.description || !formData.duration || formData.minimumInvestment! <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      if (isEditDialogOpen && selectedProduct) {
        // Update existing product
        setInvestments(prev => prev.map(inv => 
          inv.id === selectedProduct.id 
            ? { 
                ...inv, 
                ...formData, 
                updatedAt: new Date().toISOString().split('T')[0] 
              }
            : inv
        ));
        toast({
          title: "Product Updated",
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        // Add new product
        const newProduct: InvestmentProduct = {
          id: Date.now().toString(),
          name: formData.name || '',
          type: formData.type || 'quant-trading',
          category: formData.category || 'crypto',
          description: formData.description || '',
          longDescription: formData.longDescription || '',
          minimumInvestment: formData.minimumInvestment || 1000,
          maximumInvestment: formData.maximumInvestment,
          expectedReturn: formData.expectedReturn || 0,
          duration: formData.duration || '',
          durationDays: formData.durationDays || 30,
          riskLevel: formData.riskLevel || 'medium',
          status: formData.status || 'active',
          icon: formData.icon || '📊',
          totalInvested: 0,
          investorsCount: 0,
          performance: 0,
          managementFee: formData.managementFee || 1,
          performanceFee: formData.performanceFee || 20,
          earlyWithdrawalPenalty: formData.earlyWithdrawalPenalty,
          lockupPeriod: formData.lockupPeriod,
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
          createdBy: 'admin',
          tags: formData.tags || [],
          featured: formData.featured || false,
          popular: formData.popular || false,
          distributionFrequency: formData.distributionFrequency || 'monthly',
          regulatoryStatus: formData.regulatoryStatus || 'pending',
          jurisdictions: formData.jurisdictions || [],
          investorRestrictions: formData.investorRestrictions || [],
          accreditedOnly: formData.accreditedOnly || false,
          riskRating: formData.riskRating || 5,
          liquidityRating: formData.liquidityRating || 5,
          complexityRating: formData.complexityRating || 5,
          sharpeRatio: formData.sharpeRatio,
          sortinoRatio: formData.sortinoRatio,
          volatility: formData.volatility,
          maxDrawdown: formData.maxDrawdown,
          var_95: formData.var_95,
          winRate: formData.winRate,
          avgWin: formData.avgWin,
          avgLoss: formData.avgLoss,
          profitFactor: formData.profitFactor,
          stressTests: formData.stressTests || []
        };
        setInvestments(prev => [...prev, newProduct]);
        toast({
          title: "Product Created",
          description: `${formData.name} has been added successfully.`,
        });
      }
      
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save investment product.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (productId: string) => {
    try {
      setInvestments(prev => prev.map(inv => 
        inv.id === productId 
          ? { 
              ...inv, 
              status: inv.status === 'active' ? 'inactive' : 'active',
              updatedAt: new Date().toISOString().split('T')[0]
            }
          : inv
      ));
      
      const product = investments.find(p => p.id === productId);
      toast({
        title: "Status Updated",
        description: `${product?.name} is now ${product?.status === 'active' ? 'inactive' : 'active'}.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update product status.",
        variant: "destructive",
      });
    }
  };

  const handleToggleFeatured = async (productId: string) => {
    try {
      setInvestments(prev => prev.map(inv => 
        inv.id === productId 
          ? { ...inv, featured: !inv.featured }
          : inv
      ));
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update featured status.",
        variant: "destructive",
      });
    }
  };

  const handleTogglePopular = async (productId: string) => {
    try {
      setInvestments(prev => prev.map(inv => 
        inv.id === productId 
          ? { ...inv, popular: !inv.popular }
          : inv
      ));
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update popular status.",
        variant: "destructive",
      });
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleAddJurisdiction = () => {
    if (newJurisdiction.trim() && !formData.jurisdictions?.includes(newJurisdiction.trim())) {
      setFormData(prev => ({
        ...prev,
        jurisdictions: [...(prev.jurisdictions || []), newJurisdiction.trim()]
      }));
      setNewJurisdiction('');
    }
  };

  const handleRemoveJurisdiction = (jurisdiction: string) => {
    setFormData(prev => ({
      ...prev,
      jurisdictions: prev.jurisdictions?.filter(j => j !== jurisdiction) || []
    }));
  };

  const handleAddRestriction = () => {
    if (newRestriction.trim() && !formData.investorRestrictions?.includes(newRestriction.trim())) {
      setFormData(prev => ({
        ...prev,
        investorRestrictions: [...(prev.investorRestrictions || []), newRestriction.trim()]
      }));
      setNewRestriction('');
    }
  };

  const handleRemoveRestriction = (restriction: string) => {
    setFormData(prev => ({
      ...prev,
      investorRestrictions: prev.investorRestrictions?.filter(r => r !== restriction) || []
    }));
  };

  const handleAddStressTest = () => {
    const newStressTest = {
      scenario: '',
      impact: 0,
      probability: 'low' as const
    };
    setFormData(prev => ({
      ...prev,
      stressTests: [...(prev.stressTests || []), newStressTest]
    }));
  };

  const handleUpdateStressTest = (index: number, field: string, value: any) => {
    const updated = [...(formData.stressTests || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, stressTests: updated }));
  };

  const handleRemoveStressTest = (index: number) => {
    setFormData(prev => ({
      ...prev,
      stressTests: prev.stressTests?.filter((_, i) => i !== index) || []
    }));
  };

  const handleDuplicateProduct = (product: InvestmentProduct) => {
    const duplicated: InvestmentProduct = {
      ...product,
      id: Date.now().toString(),
      name: `${product.name} (Copy)`,
      totalInvested: 0,
      investorsCount: 0,
      performance: 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setInvestments(prev => [...prev, duplicated]);
    toast({
      title: "Product Duplicated",
      description: `${duplicated.name} has been created.`,
    });
  };

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
            <h1 className="text-2xl font-bold text-[#EAECEF]">Investment Products</h1>
            <Badge className="bg-[#F0B90B]/20 text-[#F0B90B] border-[#F0B90B]/30">
              {stats.activeProducts} Active
            </Badge>
          </div>
          <p className="text-sm text-[#848E9C] mt-1">
            Manage investment products, track performance, and configure offerings
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleAddProduct}
            className="bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatsCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Briefcase}
          subtitle={`${stats.activeProducts} active`}
        />
        <StatsCard
          title="Total Invested"
          value={formatCurrency(stats.totalInvested)}
          icon={DollarSign}
          trend="up"
          trendValue="+12.3% vs last month"
        />
        <StatsCard
          title="Total Investors"
          value={stats.totalInvestors.toLocaleString()}
          icon={Users}
          trend="up"
          trendValue="+45 this month"
        />
        <StatsCard
          title="Average Return"
          value={`${stats.averageReturn.toFixed(1)}%`}
          icon={TrendingUp}
          trend={stats.averageReturn > 10 ? 'up' : 'down'}
          trendValue="vs 8.5% benchmark"
        />
        <StatsCard
          title="Average Risk"
          value={`${stats.averageRisk.toFixed(1)}/10`}
          icon={Shield}
          subtitle="Portfolio risk rating"
        />
        <StatsCard
          title="Avg Sharpe"
          value={stats.averageSharpe.toFixed(2)}
          icon={Award}
          subtitle="Risk-adjusted return"
        />
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-[#1E2329] p-1 rounded-lg max-w-md">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="management" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
            Management
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 pt-4">
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Distribution */}
            <Card className="bg-[#1E2329] border border-[#2B3139]">
              <CardHeader>
                <CardTitle className="text-[#EAECEF] flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#F0B90B]" />
                  Risk Distribution
                </CardTitle>
                <CardDescription className="text-[#848E9C]">
                  Allocation of products by risk level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.riskDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1E2329', 
                        border: '1px solid #2B3139',
                        borderRadius: '8px',
                        color: '#EAECEF'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Risk-Return Scatter */}
            <Card className="bg-[#1E2329] border border-[#2B3139]">
              <CardHeader>
                <CardTitle className="text-[#EAECEF] flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#F0B90B]" />
                  Risk-Return Profile
                </CardTitle>
                <CardDescription className="text-[#848E9C]">
                  Risk vs Expected Return by product
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
                    <XAxis type="number" dataKey="risk" name="Risk" stroke="#848E9C" />
                    <YAxis type="number" dataKey="return" name="Return" stroke="#848E9C" />
                    <ZAxis type="number" dataKey="size" range={[50, 200]} />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ backgroundColor: '#1E2329', border: '1px solid #2B3139' }}
                    />
                    <Scatter name="Products" data={stats.riskReturnScatter} fill="#F0B90B" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Over Time */}
            <Card className="bg-[#1E2329] border border-[#2B3139] lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-[#EAECEF] flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-[#F0B90B]" />
                  Performance Trend
                </CardTitle>
                <CardDescription className="text-[#848E9C]">
                  Cumulative returns across all products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={stats.performanceOverTime}>
                    <defs>
                      <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F0B90B" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#F0B90B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
                    <XAxis dataKey="date" stroke="#848E9C" />
                    <YAxis stroke="#848E9C" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1E2329', 
                        border: '1px solid #2B3139',
                        borderRadius: '8px',
                        color: '#EAECEF'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#F0B90B" 
                      fillOpacity={1} 
                      fill="url(#performanceGradient)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Products */}
          <Card className="bg-[#1E2329] border border-[#2B3139]">
            <CardHeader>
              <CardTitle className="text-[#EAECEF]">Recent Products</CardTitle>
              <CardDescription className="text-[#848E9C]">
                Latest investment offerings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {investments.slice(0, 3).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-[#181A20] rounded-lg hover:bg-[#23262F] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#F0B90B]/10 flex items-center justify-center text-xl">
                        {product.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#EAECEF]">{product.name}</span>
                          {product.featured && (
                            <Badge className="bg-[#F0B90B]/20 text-[#F0B90B] text-[10px]">Featured</Badge>
                          )}
                          {product.popular && (
                            <Badge className="bg-purple-500/20 text-purple-400 text-[10px]">Popular</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-[#848E9C]">Min: ${product.minimumInvestment.toLocaleString()}</span>
                          <span className="text-xs text-[#848E9C]">•</span>
                          <span className="text-xs text-[#848E9C]">Return: {product.expectedReturn}%</span>
                          <span className="text-xs text-[#848E9C]">•</span>
                          <span className="text-xs text-[#848E9C]">Sharpe: {product.sharpeRatio?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(product.status)}>
                      {product.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Growth */}
            <Card className="bg-[#1E2329] border border-[#2B3139]">
              <CardHeader>
                <CardTitle className="text-[#EAECEF] flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#F0B90B]" />
                  Monthly Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={stats.monthlyGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
                    <XAxis dataKey="month" stroke="#848E9C" />
                    <YAxis yAxisId="left" stroke="#848E9C" />
                    <YAxis yAxisId="right" orientation="right" stroke="#848E9C" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1E2329', 
                        border: '1px solid #2B3139',
                        borderRadius: '8px',
                        color: '#EAECEF'
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="investments" fill="#F0B90B" name="New Investors" />
                    <Line yAxisId="right" type="monotone" dataKey="value" stroke="#627EEA" name="Investment Value" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="bg-[#1E2329] border border-[#2B3139]">
              <CardHeader>
                <CardTitle className="text-[#EAECEF] flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#F0B90B]" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {investments.map((product) => (
                    <div key={product.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#EAECEF]">{product.name}</span>
                        <div className="flex gap-4">
                          <span className="text-[#848E9C]">Target: {product.expectedReturn}%</span>
                          <span className={`font-medium ${product.performance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            Actual: {product.performance >= 0 ? '+' : ''}{product.performance}%
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={(product.performance / product.expectedReturn) * 100} 
                        className="h-2 bg-[#2B3139]" 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* VaR Distribution */}
            <Card className="bg-[#1E2329] border border-[#2B3139]">
              <CardHeader>
                <CardTitle className="text-[#EAECEF] flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#F0B90B]" />
                  VaR Distribution (95%)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.varDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
                    <XAxis dataKey="range" stroke="#848E9C" />
                    <YAxis stroke="#848E9C" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1E2329', border: '1px solid #2B3139' }}
                    />
                    <Bar dataKey="count" fill="#F0B90B" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Correlation Matrix */}
            <Card className="bg-[#1E2329] border border-[#2B3139]">
              <CardHeader>
                <CardTitle className="text-[#EAECEF] flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-[#F0B90B]" />
                  Correlation Matrix
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {stats.correlationMatrix.map((item, i) => (
                    <div key={i} className="bg-[#181A20] rounded-lg p-2 text-center">
                      <div className="text-xs text-[#848E9C]">{item.asset1}/{item.asset2}</div>
                      <div className={`text-sm font-bold ${
                        item.correlation > 0.5 ? 'text-red-400' :
                        item.correlation > 0.3 ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {item.correlation.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Management Tab */}
        <TabsContent value="management" className="space-y-6 pt-4">
          {/* Filters Card */}
          <Card className="bg-[#1E2329] border border-[#2B3139]">
            <CardHeader className="cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-[#F0B90B]" />
                  <CardTitle className="text-[#EAECEF]">Filters</CardTitle>
                  <CardDescription className="text-[#848E9C]">
                    ({filteredInvestments.length} of {investments.length} products)
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-[#848E9C]">
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
            </CardHeader>
            {showFilters && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  <div>
                    <Label className="text-xs text-[#848E9C]">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#848E9C] w-4 h-4" />
                      <Input
                        placeholder="Name, description, tags..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-[#181A20] border-[#2B3139] text-[#EAECEF] placeholder-[#5E6673]"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-[#848E9C]">Type</Label>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#181A20] border-[#2B3139]">
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="quant-trading">Quant Trading</SelectItem>
                        <SelectItem value="arbitrage">Arbitrage</SelectItem>
                        <SelectItem value="staking">Staking</SelectItem>
                        <SelectItem value="mining">Mining</SelectItem>
                        <SelectItem value="defi">DeFi</SelectItem>
                        <SelectItem value="futures">Futures</SelectItem>
                        <SelectItem value="options">Options</SelectItem>
                        <SelectItem value="real-estate">Real Estate</SelectItem>
                        <SelectItem value="private-equity">Private Equity</SelectItem>
                        <SelectItem value="venture-capital">Venture Capital</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-[#848E9C]">Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#181A20] border-[#2B3139]">
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="crypto">Cryptocurrency</SelectItem>
                        <SelectItem value="forex">Forex</SelectItem>
                        <SelectItem value="stocks">Stocks</SelectItem>
                        <SelectItem value="commodities">Commodities</SelectItem>
                        <SelectItem value="real-estate">Real Estate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-[#848E9C]">Risk Level</Label>
                    <Select value={selectedRisk} onValueChange={setSelectedRisk}>
                      <SelectTrigger className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#181A20] border-[#2B3139]">
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="low">Low Risk</SelectItem>
                        <SelectItem value="medium">Medium Risk</SelectItem>
                        <SelectItem value="high">High Risk</SelectItem>
                        <SelectItem value="very-high">Very High Risk</SelectItem>
                        <SelectItem value="extreme">Extreme Risk</SelectItem>
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
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="coming-soon">Coming Soon</SelectItem>
                        <SelectItem value="ended">Ended</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-[#848E9C]">Sort By</Label>
                    <Select 
                      value={`${sortField}-${sortDirection}`} 
                      onValueChange={(value) => {
                        const [field, direction] = value.split('-');
                        setSortField(field as keyof InvestmentProduct);
                        setSortDirection(direction as 'asc' | 'desc');
                      }}
                    >
                      <SelectTrigger className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#181A20] border-[#2B3139]">
                        <SelectItem value="createdAt-desc">Newest First</SelectItem>
                        <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                        <SelectItem value="minimumInvestment-desc">Min Investment (High-Low)</SelectItem>
                        <SelectItem value="minimumInvestment-asc">Min Investment (Low-High)</SelectItem>
                        <SelectItem value="expectedReturn-desc">Return (High-Low)</SelectItem>
                        <SelectItem value="expectedReturn-asc">Return (Low-High)</SelectItem>
                        <SelectItem value="riskRating-desc">Risk (High-Low)</SelectItem>
                        <SelectItem value="riskRating-asc">Risk (Low-High)</SelectItem>
                        <SelectItem value="sharpeRatio-desc">Sharpe (High-Low)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Products Table */}
          <Card className="bg-[#1E2329] border border-[#2B3139]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#F0B90B]" />
                  <CardTitle className="text-[#EAECEF]">Investment Products</CardTitle>
                </div>
                <Badge className="bg-[#2B3139] text-[#848E9C]">
                  {filteredInvestments.length} Products
                </Badge>
              </div>
              <CardDescription className="text-[#848E9C]">
                Manage and configure investment offerings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2B3139] hover:bg-transparent">
                      <TableHead className="text-[#F0B90B]">Product</TableHead>
                      <TableHead className="text-[#F0B90B]">Type</TableHead>
                      <TableHead className="text-[#F0B90B]">Min Investment</TableHead>
                      <TableHead className="text-[#F0B90B]">Expected Return</TableHead>
                      <TableHead className="text-[#F0B90B]">Duration</TableHead>
                      <TableHead className="text-[#F0B90B]">Risk Level</TableHead>
                      <TableHead className="text-[#F0B90B]">Status</TableHead>
                      <TableHead className="text-[#F0B90B]">Sharpe</TableHead>
                      <TableHead className="text-[#F0B90B]">Volatility</TableHead>
                      <TableHead className="text-[#F0B90B]">Max DD</TableHead>
                      <TableHead className="text-[#F0B90B]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvestments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8 text-[#848E9C]">
                          No investment products found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvestments.map((product) => (
                        <TableRow key={product.id} className="border-[#2B3139] hover:bg-[#23262F]">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-[#F0B90B]/10 flex items-center justify-center text-lg">
                                {product.icon}
                              </div>
                              <div>
                                <div className="font-medium text-[#EAECEF]">{product.name}</div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {product.featured && (
                                    <Star className="w-3 h-3 fill-[#F0B90B] text-[#F0B90B]" />
                                  )}
                                  {product.popular && (
                                    <Zap className="w-3 h-3 text-purple-400" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTypeColor(product.type)}>
                              {product.type.replace('-', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-[#EAECEF] font-mono">
                            ${product.minimumInvestment.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-[#EAECEF] font-mono">
                            {product.expectedReturn}%
                          </TableCell>
                          <TableCell className="text-[#EAECEF]">
                            {product.duration}
                          </TableCell>
                          <TableCell>
                            <Badge className={getRiskColor(product.riskLevel)}>
                              {product.riskLevel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(product.status)}>
                              {product.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`font-mono font-medium ${
                              (product.sharpeRatio || 0) > 1.5 ? 'text-green-400' :
                              (product.sharpeRatio || 0) > 1 ? 'text-yellow-400' :
                              (product.sharpeRatio || 0) > 0 ? 'text-orange-400' :
                              'text-red-400'
                            }`}>
                              {product.sharpeRatio?.toFixed(2) || 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell className="text-[#EAECEF] font-mono">
                            {product.volatility?.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-red-400 font-mono">
                            {product.maxDrawdown?.toFixed(1)}%
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-[#848E9C] hover:text-[#F0B90B]"
                                onClick={() => handleViewProduct(product)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-[#848E9C] hover:text-[#F0B90B]"
                                onClick={() => handleRiskAnalysis(product)}
                              >
                                <Shield className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-[#848E9C] hover:text-[#F0B90B]"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-[#848E9C] hover:text-[#F0B90B]"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#1E2329] border-[#2B3139]">
                                  <DropdownMenuItem onClick={() => handleStressTest(product)}>
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Stress Test
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDuplicateProduct(product)}>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleFeatured(product.id)}>
                                    {product.featured ? 
                                      <StarOff className="w-4 h-4 mr-2" /> : 
                                      <Star className="w-4 h-4 mr-2" />
                                    }
                                    {product.featured ? 'Remove Featured' : 'Mark Featured'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleTogglePopular(product.id)}>
                                    {product.popular ? 
                                      <Zap className="w-4 h-4 mr-2" /> : 
                                      <Zap className="w-4 h-4 mr-2" />
                                    }
                                    {product.popular ? 'Remove Popular' : 'Mark Popular'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(product)}
                                    className="text-red-400"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
        </TabsContent>
      </Tabs>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
          setSelectedProduct(null);
        }
      }}>
        <DialogContent className="bg-[#1E2329] border-[#F0B90B] text-[#EAECEF] max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#F0B90B]">
              {isEditDialogOpen ? 'Edit Investment Product' : 'Add Investment Product'}
            </DialogTitle>
            <DialogDescription className="text-[#848E9C]">
              {isEditDialogOpen ? 'Update the investment product details.' : 'Create a new investment product offering.'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-[#181A20] p-1 rounded-lg">
              <TabsTrigger value="basic" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                Basic
              </TabsTrigger>
              <TabsTrigger value="financial" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                Financial
              </TabsTrigger>
              <TabsTrigger value="fees" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                Fees
              </TabsTrigger>
              <TabsTrigger value="risk" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                Risk
              </TabsTrigger>
              <TabsTrigger value="compliance" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                Compliance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-xs text-[#848E9C]">Product Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Quant Trading Alpha"
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-xs text-[#848E9C]">Short Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description for card view"
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-xs text-[#848E9C]">Long Description</Label>
                  <Textarea
                    value={formData.longDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, longDescription: e.target.value }))}
                    placeholder="Detailed description for product page"
                    rows={3}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}>
                    <SelectTrigger className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#181A20] border-[#2B3139]">
                      <SelectItem value="quant-trading">Quant Trading</SelectItem>
                      <SelectItem value="arbitrage">Arbitrage</SelectItem>
                      <SelectItem value="staking">Staking</SelectItem>
                      <SelectItem value="mining">Mining</SelectItem>
                      <SelectItem value="defi">DeFi</SelectItem>
                      <SelectItem value="futures">Futures</SelectItem>
                      <SelectItem value="options">Options</SelectItem>
                      <SelectItem value="real-estate">Real Estate</SelectItem>
                      <SelectItem value="private-equity">Private Equity</SelectItem>
                      <SelectItem value="venture-capital">Venture Capital</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as any }))}>
                    <SelectTrigger className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#181A20] border-[#2B3139]">
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                      <SelectItem value="forex">Forex</SelectItem>
                      <SelectItem value="stocks">Stocks</SelectItem>
                      <SelectItem value="commodities">Commodities</SelectItem>
                      <SelectItem value="real-estate">Real Estate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Icon (emoji)</Label>
                  <Input
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="📊"
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Image URL</Label>
                  <Input
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="/images/product.jpg"
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-[#848E9C]">Minimum Investment ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.minimumInvestment}
                    onChange={(e) => setFormData(prev => ({ ...prev, minimumInvestment: Number(e.target.value) }))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Maximum Investment ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.maximumInvestment}
                    onChange={(e) => setFormData(prev => ({ ...prev, maximumInvestment: Number(e.target.value) }))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                    placeholder="Unlimited"
                  />
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Expected Return (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.expectedReturn}
                    onChange={(e) => setFormData(prev => ({ ...prev, expectedReturn: Number(e.target.value) }))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Duration</Label>
                  <Input
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="e.g., 12 months"
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Duration (days)</Label>
                  <Input
                    type="number"
                    value={formData.durationDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, durationDays: Number(e.target.value) }))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Distribution Frequency</Label>
                  <Select value={formData.distributionFrequency} onValueChange={(value) => setFormData(prev => ({ ...prev, distributionFrequency: value as any }))}>
                    <SelectTrigger className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#181A20] border-[#2B3139]">
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                      <SelectItem value="at-maturity">At Maturity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Max Capacity ($)</Label>
                  <Input
                    type="number"
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxCapacity: Number(e.target.value) }))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                    placeholder="Unlimited"
                  />
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Available From</Label>
                  <Input
                    type="date"
                    value={formData.availableFrom}
                    onChange={(e) => setFormData(prev => ({ ...prev, availableFrom: e.target.value }))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Available To</Label>
                  <Input
                    type="date"
                    value={formData.availableTo}
                    onChange={(e) => setFormData(prev => ({ ...prev, availableTo: e.target.value }))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fees" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-[#848E9C]">Management Fee (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.managementFee}
                    onChange={(e) => setFormData(prev => ({ ...prev, managementFee: Number(e.target.value) }))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Performance Fee (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.performanceFee}
                    onChange={(e) => setFormData(prev => ({ ...prev, performanceFee: Number(e.target.value) }))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Early Withdrawal Penalty (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.earlyWithdrawalPenalty}
                    onChange={(e) => setFormData(prev => ({ ...prev, earlyWithdrawalPenalty: Number(e.target.value) }))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Lockup Period</Label>
                  <Input
                    value={formData.lockupPeriod}
                    onChange={(e) => setFormData(prev => ({ ...prev, lockupPeriod: e.target.value }))}
                    placeholder="e.g., 3 months"
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="risk" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-[#848E9C]">Risk Level</Label>
                  <Select value={formData.riskLevel} onValueChange={(value) => setFormData(prev => ({ ...prev, riskLevel: value as any }))}>
                    <SelectTrigger className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#181A20] border-[#2B3139]">
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="medium">Medium Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                      <SelectItem value="very-high">Very High Risk</SelectItem>
                      <SelectItem value="extreme">Extreme Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Risk Rating (1-10)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.riskRating}
                    onChange={(e) => setFormData(prev => ({ ...prev, riskRating: parseInt(e.target.value) }))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Liquidity Rating (1-10)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.liquidityRating}
                    onChange={(e) => setFormData(prev => ({ ...prev, liquidityRating: parseInt(e.target.value) }))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Complexity Rating (1-10)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.complexityRating}
                    onChange={(e) => setFormData(prev => ({ ...prev, complexityRating: parseInt(e.target.value) }))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Sharpe Ratio</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.sharpeRatio}
                    onChange={(e) => setFormData(prev => ({ ...prev, sharpeRatio: parseFloat(e.target.value) }))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Sortino Ratio</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.sortinoRatio}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortinoRatio: parseFloat(e.target.value) }))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Volatility (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.volatility}
                    onChange={(e) => setFormData(prev => ({ ...prev, volatility: parseFloat(e.target.value) }))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Max Drawdown (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.maxDrawdown}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxDrawdown: parseFloat(e.target.value) }))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">VaR 95% (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.var_95}
                    onChange={(e) => setFormData(prev => ({ ...prev, var_95: parseFloat(e.target.value) }))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Win Rate (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.winRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, winRate: parseFloat(e.target.value) }))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Avg Win (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.avgWin}
                    onChange={(e) => setFormData(prev => ({ ...prev, avgWin: parseFloat(e.target.value) }))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Avg Loss (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.avgLoss}
                    onChange={(e) => setFormData(prev => ({ ...prev, avgLoss: parseFloat(e.target.value) }))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Profit Factor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.profitFactor}
                    onChange={(e) => setFormData(prev => ({ ...prev, profitFactor: parseFloat(e.target.value) }))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-[#848E9C]">Regulatory Status</Label>
                  <Select value={formData.regulatoryStatus} onValueChange={(value) => setFormData(prev => ({ ...prev, regulatoryStatus: value as any }))}>
                    <SelectTrigger className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#181A20] border-[#2B3139]">
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="exempt">Exempt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-[#848E9C]">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}>
                    <SelectTrigger className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#181A20] border-[#2B3139]">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="coming-soon">Coming Soon</SelectItem>
                      <SelectItem value="ended">Ended</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label className="text-xs text-[#848E9C]">Approved Jurisdictions</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={newJurisdiction}
                      onChange={(e) => setNewJurisdiction(e.target.value)}
                      placeholder="Add jurisdiction (e.g., US, UK, EU)"
                      className="flex-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddJurisdiction())}
                    />
                    <Button 
                      size="sm"
                      onClick={handleAddJurisdiction}
                      className="bg-[#F0B90B] text-[#181A20]"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.jurisdictions?.map((j) => (
                      <Badge key={j} className="bg-[#2B3139] text-[#EAECEF] flex items-center gap-1">
                        {j}
                        <button onClick={() => handleRemoveJurisdiction(j)} className="ml-1 hover:text-red-400">
                          <XCircle className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <Label className="text-xs text-[#848E9C]">Investor Restrictions</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={newRestriction}
                      onChange={(e) => setNewRestriction(e.target.value)}
                      placeholder="Add restriction (e.g., accredited, institutional)"
                      className="flex-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRestriction())}
                    />
                    <Button 
                      size="sm"
                      onClick={handleAddRestriction}
                      className="bg-[#F0B90B] text-[#181A20]"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.investorRestrictions?.map((r) => (
                      <Badge key={r} className="bg-[#2B3139] text-[#EAECEF] flex items-center gap-1">
                        {r}
                        <button onClick={() => handleRemoveRestriction(r)} className="ml-1 hover:text-red-400">
                          <XCircle className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="col-span-2 flex items-center gap-2">
                  <Switch
                    checked={formData.accreditedOnly}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, accreditedOnly: checked }))}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                  <Label className="text-[#EAECEF]">Accredited Investors Only</Label>
                </div>
              </div>

              <Separator className="bg-[#2B3139]" />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-[#848E9C]">Stress Test Scenarios</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddStressTest}
                    className="border-[#2B3139] text-[#EAECEF]"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Scenario
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.stressTests?.map((test, index) => (
                    <div key={index} className="flex items-center gap-2 bg-[#181A20] p-2 rounded-lg">
                      <Input
                        value={test.scenario}
                        onChange={(e) => handleUpdateStressTest(index, 'scenario', e.target.value)}
                        placeholder="Scenario name"
                        className="flex-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                      />
                      <Input
                        type="number"
                        value={test.impact}
                        onChange={(e) => handleUpdateStressTest(index, 'impact', parseFloat(e.target.value))}
                        placeholder="Impact %"
                        className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                      />
                      <Select
                        value={test.probability}
                        onValueChange={(value) => handleUpdateStressTest(index, 'probability', value)}
                      >
                        <SelectTrigger className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveStressTest(index)}
                        className="text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-2">
                <Label className="text-xs text-[#848E9C]">Tags</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag"
                    className="flex-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button 
                    size="sm"
                    onClick={handleAddTag}
                    className="bg-[#F0B90B] text-[#181A20]"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags?.map((tag) => (
                    <Badge key={tag} className="bg-[#2B3139] text-[#EAECEF] flex items-center gap-1">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-red-400">
                        <XCircle className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="col-span-2 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                  <Label className="text-[#EAECEF]">Featured Product</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.popular}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, popular: checked }))}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                  <Label className="text-[#EAECEF]">Popular Product</Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddDialogOpen(false);
                setIsEditDialogOpen(false);
                setSelectedProduct(null);
              }}
              className="border-[#2B3139] text-[#EAECEF] hover:border-[#F0B90B] hover:text-[#F0B90B]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveProduct}
              className="bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-medium"
            >
              {isEditDialogOpen ? 'Update Product' : 'Create Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Product Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-[#1E2329] border-[#F0B90B] text-[#EAECEF] max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#F0B90B] flex items-center gap-2">
              {selectedProduct?.icon} {selectedProduct?.name}
            </DialogTitle>
            <DialogDescription className="text-[#848E9C]">
              Product details and performance metrics
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-[#181A20] p-1 rounded-lg">
                <TabsTrigger value="details" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                  Details
                </TabsTrigger>
                <TabsTrigger value="risk" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                  Risk Metrics
                </TabsTrigger>
                <TabsTrigger value="compliance" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                  Compliance
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#848E9C]">Description</p>
                    <p className="text-sm text-[#EAECEF] mt-1">{selectedProduct.description}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#848E9C]">Type</p>
                    <Badge className={getTypeColor(selectedProduct.type)}>
                      {selectedProduct.type.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>

                <Separator className="bg-[#2B3139]" />

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#181A20] rounded-lg p-3">
                    <p className="text-xs text-[#848E9C]">Min Investment</p>
                    <p className="text-lg font-bold text-[#EAECEF]">${selectedProduct.minimumInvestment.toLocaleString()}</p>
                  </div>
                  <div className="bg-[#181A20] rounded-lg p-3">
                    <p className="text-xs text-[#848E9C]">Expected Return</p>
                    <p className="text-lg font-bold text-[#EAECEF]">{selectedProduct.expectedReturn}%</p>
                  </div>
                  <div className="bg-[#181A20] rounded-lg p-3">
                    <p className="text-xs text-[#848E9C]">Duration</p>
                    <p className="text-lg font-bold text-[#EAECEF]">{selectedProduct.duration}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#181A20] rounded-lg p-3">
                    <p className="text-xs text-[#848E9C]">Total Invested</p>
                    <p className="text-lg font-bold text-[#EAECEF]">${selectedProduct.totalInvested.toLocaleString()}</p>
                  </div>
                  <div className="bg-[#181A20] rounded-lg p-3">
                    <p className="text-xs text-[#848E9C]">Total Investors</p>
                    <p className="text-lg font-bold text-[#EAECEF]">{selectedProduct.investorsCount}</p>
                  </div>
                </div>

                {selectedProduct.performanceHistory && (
                  <div className="bg-[#181A20] rounded-lg p-3">
                    <p className="text-xs text-[#848E9C] mb-2">Performance History</p>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selectedProduct.performanceHistory}>
                          <Line type="monotone" dataKey="value" stroke="#F0B90B" strokeWidth={2} dot={false} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1E2329', 
                              border: '1px solid #2B3139',
                              borderRadius: '8px'
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {selectedProduct.tags.map((tag) => (
                    <Badge key={tag} className="bg-[#2B3139] text-[#EAECEF]">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  {selectedProduct.featured && (
                    <Badge className="bg-[#F0B90B]/20 text-[#F0B90B]">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {selectedProduct.popular && (
                    <Badge className="bg-purple-500/20 text-purple-400">
                      <Zap className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                  <Badge className={getRiskColor(selectedProduct.riskLevel)}>
                    {selectedProduct.riskLevel} risk
                  </Badge>
                  <Badge className={getStatusColor(selectedProduct.status)}>
                    {selectedProduct.status}
                  </Badge>
                </div>
              </TabsContent>

              <TabsContent value="risk" className="space-y-4 pt-4">
                <RiskMetricsCard product={selectedProduct} />
              </TabsContent>

              <TabsContent value="compliance" className="space-y-4 pt-4">
                <ComplianceCard product={selectedProduct} />
                <HistoricalCharts product={selectedProduct} />
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsViewDialogOpen(false)}
              className="border-[#2B3139] text-[#EAECEF] hover:border-[#F0B90B] hover:text-[#F0B90B]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Risk Analysis Dialog */}
      <Dialog open={isRiskAnalysisOpen} onOpenChange={setIsRiskAnalysisOpen}>
        <DialogContent className="bg-[#1E2329] border-[#F0B90B] text-[#EAECEF] max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#F0B90B] flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Risk Analysis: {selectedProduct?.name}
            </DialogTitle>
            <DialogDescription className="text-[#848E9C]">
              Comprehensive risk metrics and analysis
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <Tabs value={riskTab} onValueChange={setRiskTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-[#181A20] p-1 rounded-lg">
                <TabsTrigger value="metrics" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                  Risk Metrics
                </TabsTrigger>
                <TabsTrigger value="stress" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                  Stress Tests
                </TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                  Historical
                </TabsTrigger>
              </TabsList>

              <TabsContent value="metrics" className="pt-4">
                <RiskMetricsCard product={selectedProduct} />
              </TabsContent>

              <TabsContent value="stress" className="pt-4">
                <Card className="bg-[#1E2329] border border-[#2B3139]">
                  <CardHeader>
                    <CardTitle className="text-[#EAECEF] flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-[#F0B90B]" />
                      Stress Test Scenarios
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedProduct.stressTests?.map((test, index) => (
                        <div key={index} className="bg-[#181A20] rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-[#EAECEF]">{test.scenario}</span>
                            <Badge className={
                              test.probability === 'low' ? 'bg-green-500/20 text-green-400' :
                              test.probability === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }>
                              {test.probability} probability
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-[#848E9C]">Impact</span>
                                <span className="text-red-400">{test.impact}%</span>
                              </div>
                              <Progress value={Math.abs(test.impact) * 2} className="h-2 bg-[#2B3139]" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="pt-4">
                <HistoricalCharts product={selectedProduct} />
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRiskAnalysisOpen(false)}
              className="border-[#2B3139] text-[#EAECEF] hover:border-[#F0B90B] hover:text-[#F0B90B]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#1E2329] border-red-500/50 text-[#EAECEF] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Delete Investment Product
            </DialogTitle>
            <DialogDescription className="text-[#848E9C]">
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-[#2B3139] text-[#EAECEF] hover:border-[#F0B90B]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}