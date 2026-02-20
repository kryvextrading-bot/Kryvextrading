// pages/AccountManagementPage.tsx - COMPLETE MOBILE-OPTIMIZED REDESIGN

import React, { useState } from 'react';
import { useAccountsContext, Exchange, AccountMode } from '@/contexts/AccountsContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaWallet, 
  FaShareAlt, 
  FaHeadphones, 
  FaRobot, 
  FaWater, 
  FaHandHoldingUsd, 
  FaIdCard, 
  FaCheckCircle, 
  FaGlobe, 
  FaQuestionCircle, 
  FaShieldAlt, 
  FaGavel, 
  FaBook, 
  FaUserCircle,
  FaExchangeAlt,
  FaPlus,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaCopy,
  FaKey,
  FaLock,
  FaUnlock,
  FaPlug,
  FaLink,
  FaUnlink,
  FaChartPie,
  FaBell,
  FaCog,
  FaSignOutAlt,
  FaSignInAlt
} from 'react-icons/fa';
import { 
  HiOutlineCurrencyDollar, 
  HiOutlineChartBar, 
  HiOutlineRefresh, 
  HiOutlineShieldCheck,
  HiOutlineCog,
  HiOutlineSupport,
  HiOutlineDocumentText,
  HiOutlineScale
} from 'react-icons/hi';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  ChevronRight, 
  ArrowLeft,
  Settings,
  Bell,
  LogOut,
  LogIn,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  CreditCard,
  Clock,
  ChevronDown,
  X,
  Check,
  AlertCircle,
  Info,
  Globe,
  Headphones,
  Share2,
  Wallet,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  RefreshCw,
  Copy,
  Key,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Minus,
  Menu,
  Home
} from 'lucide-react';

// ==================== CONSTANTS ====================
const EXCHANGES: Exchange[] = ['Binance', 'Coinbase', 'Kraken', 'MockExchange'];

// ==================== ANIMATION VARIANTS ====================
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1]
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }
};

const cardVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  },
  hover: {
    scale: 1.02,
    y: -2,
    transition: { duration: 0.2 }
  }
};

const shimmerEffect = {
  initial: { x: '-100%' },
  hover: { x: '100%' },
  transition: { duration: 0.8, ease: "easeInOut" }
};

// ==================== ACCOUNT CARD COMPONENT ====================
const AccountCard = ({ account, onRemove, onViewPortfolio, isSelected }: any) => {
  const [showBalances, setShowBalances] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const totalValue = Object.values(account.balances || {}).reduce((a: number, b: any) => a + (b || 0), 0);
  const balanceCount = Object.keys(account.balances || {}).length;
  
  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      className="relative"
    >
      <Card className="bg-[#1E2329] border border-[#2B3139] hover:border-[#F0B90B]/50 transition-all duration-300 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          variants={shimmerEffect}
          initial="initial"
          whileHover="hover"
        />
        
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F0B90B]/20 to-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <FaExchangeAlt className="text-[#F0B90B]" size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-[#EAECEF] text-sm truncate">{account.name}</h3>
                  <Badge className={account.mode === 'live' 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30 text-[10px] px-1.5 py-0.5' 
                    : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px] px-1.5 py-0.5'
                  }>
                    {account.mode === 'live' ? 'LIVE' : 'DEMO'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#848E9C] flex-wrap">
                  <span>{account.exchange}</span>
                  <span className="w-1 h-1 rounded-full bg-[#2B3139]" />
                  <span className="truncate">ID: {account.id.slice(0, 6)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-[#848E9C] hover:text-[#EAECEF] hover:bg-[#2B3139] transition-colors"
                onClick={() => setShowBalances(!showBalances)}
              >
                {showBalances ? <EyeOff size={14} /> : <Eye size={14} />}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                onClick={() => onRemove(account.id)}
              >
                <Trash2 size={14} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-[#848E9C] hover:text-[#EAECEF] hover:bg-[#2B3139] transition-colors lg:hidden"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <ChevronDown size={14} className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
              </motion.button>
            </div>
          </div>
          
          {/* Balances - Always visible on desktop, collapsible on mobile */}
          <AnimatePresence>
            {(showBalances || window.innerWidth >= 1024) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-2 overflow-hidden"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#848E9C]">Total Value</span>
                  <span className="font-mono text-[#EAECEF] font-bold">
                    ${totalValue.toFixed(2)}
                  </span>
                </div>
                
                {showBalances ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(account.balances || {}).slice(0, 4).map(([sym, bal]: [string, any]) => (
                        <div key={sym} className="bg-[#181A20] rounded-lg p-2">
                          <div className="text-[10px] text-[#848E9C]">{sym}</div>
                          <div className="text-xs font-mono text-[#EAECEF] truncate">
                            {bal?.toFixed(4) || '0.0000'}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {balanceCount > 4 && (
                      <motion.button 
                        whileHover={{ x: 2 }}
                        className="text-[10px] text-[#F0B90B] hover:text-yellow-400 flex items-center gap-1 mt-1"
                        onClick={() => onViewPortfolio(account.id)}
                      >
                        View all {balanceCount} assets
                        <ChevronRight size={10} />
                      </motion.button>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center py-2">
                    <span className="text-xs text-[#5E6673]">•••••• (Hidden)</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* API Status */}
          {account.mode === 'live' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 pt-3 border-t border-[#2B3139] flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-[10px] text-[#848E9C]">API Connected</span>
              </div>
              <Badge className="bg-[#2B3139] text-[#848E9C] text-[10px] px-2 py-0.5">
                Read-only
              </Badge>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

// ==================== DAPP CARD COMPONENT ====================
const DAppCard = ({ icon, label, action, onClick, badge }: any) => (
  <motion.div
    variants={cardVariants}
    whileHover="hover"
    whileTap={{ scale: 0.98 }}
  >
    <Card 
      className="bg-[#1E2329] border border-[#2B3139] hover:border-[#F0B90B] hover:bg-[#23262F] transition-all p-4 cursor-pointer group overflow-hidden relative"
      onClick={onClick}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        variants={shimmerEffect}
        initial="initial"
        whileHover="hover"
      />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#F0B90B]/10 flex items-center justify-center group-hover:bg-[#F0B90B]/20 transition-colors flex-shrink-0">
            <span className="text-[#F0B90B] text-xl">{icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-[#EAECEF] text-sm truncate">{label}</h4>
            {badge && (
              <span className="text-[10px] text-[#848E9C] block truncate">{badge}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {action && (
            <Button size="sm" className="h-7 text-xs bg-[#F0B90B] text-[#181A20] whitespace-nowrap">
              {action}
            </Button>
          )}
          <ChevronRight size={16} className="text-[#848E9C] group-hover:text-[#F0B90B] transition-colors" />
        </div>
      </div>
    </Card>
  </motion.div>
);

// ==================== MENU SECTION COMPONENT ====================
const MenuSection = ({ title, options }: { title: string; options: any[] }) => (
  <motion.div variants={itemVariants} className="space-y-2">
    <h3 className="text-xs font-semibold text-[#848E9C] uppercase tracking-wider px-1">
      {title}
    </h3>
    <Card className="bg-[#1E2329] border border-[#2B3139] divide-y divide-[#2B3139] overflow-hidden rounded-xl">
      {options.map((opt, index) => (
        <motion.div
          key={index}
          whileHover={{ backgroundColor: '#2B3139', x: 2 }}
          className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
          onClick={opt.onClick}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-[#F0B90B] text-lg flex-shrink-0">{opt.icon}</span>
            <span className="text-sm text-[#EAECEF] truncate">{opt.label}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {opt.badge && (
              <Badge className="bg-[#F0B90B]/20 text-[#F0B90B] text-[10px] px-2 py-0.5 whitespace-nowrap">
                {opt.badge}
              </Badge>
            )}
            {opt.action && (
              <Button size="sm" variant="ghost" className="h-7 text-xs text-[#F0B90B] whitespace-nowrap">
                {opt.action}
              </Button>
            )}
            <ChevronRight size={14} className="text-[#5E6673]" />
          </div>
        </motion.div>
      ))}
    </Card>
  </motion.div>
);

// ==================== PORTFOLIO MODAL COMPONENT ====================
const PortfolioModal = ({ account, onClose }: { account: any; onClose: () => void }) => {
  const totalValue = Object.values(account?.balances || {}).reduce((a: number, b: any) => a + (b || 0), 0);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full md:max-w-lg bg-[#1E2329] border border-[#2B3139] rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#2B3139] bg-gradient-to-r from-[#F0B90B]/10 to-transparent">
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-1 hover:bg-[#2B3139] rounded-lg transition-colors"
            >
              <ArrowLeft size={18} className="text-[#848E9C]" />
            </motion.button>
            <h2 className="text-lg font-bold text-[#EAECEF]">{account?.name} Portfolio</h2>
          </div>
          <Badge className={account?.mode === 'live' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
            {account?.mode?.toUpperCase()}
          </Badge>
        </div>
        
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 140px)' }}>
          <motion.div 
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-gradient-to-br from-[#181A20] to-[#1E2329] rounded-xl p-4 mb-4 border border-[#2B3139]"
          >
            <div className="text-xs text-[#848E9C] mb-1">Total Portfolio Value</div>
            <div className="text-2xl font-bold text-[#EAECEF] font-mono">
              ${totalValue.toFixed(2)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Clock size={12} className="text-[#5E6673]" />
              <span className="text-[10px] text-[#5E6673]">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </motion.div>
          
          <h4 className="text-xs font-medium text-[#848E9C] mb-3">Asset Balances</h4>
          
          {Object.entries(account?.balances || {}).length === 0 ? (
            <div className="text-center py-8 text-[#5E6673] text-sm">
              No balances found
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(account?.balances || {}).map(([sym, bal]: [string, any], index) => (
                <motion.div
                  key={sym}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-[#181A20] rounded-lg border border-[#2B3139] hover:border-[#F0B90B]/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F0B90B]/20 to-yellow-500/20 flex items-center justify-center text-sm font-bold text-[#F0B90B]">
                      {sym.charAt(0)}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[#EAECEF]">{sym}</span>
                      <span className="text-[10px] text-[#848E9C] block">≈ ${bal?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-[#EAECEF]">{bal?.toFixed(6) || '0.000000'}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-[#2B3139] bg-[#181A20]">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="w-full py-3 bg-[#F0B90B] text-[#181A20] rounded-xl font-medium hover:bg-yellow-400 transition-colors"
          >
            Close
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ==================== MAIN COMPONENT ====================
export default function AccountManagementPage() {
  const { accounts, addAccount, removeAccount, aggregateBalances } = useAccountsContext();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    name: '',
    exchange: 'Binance' as Exchange,
    mode: 'mock' as AccountMode,
    apiKey: '',
    apiSecret: '',
  });
  
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [portfolioAccount, setPortfolioAccount] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('accounts');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    addAccount({
      name: form.name || `${form.exchange} ${form.mode === 'mock' ? 'Demo' : 'Live'}`,
      exchange: form.exchange,
      mode: form.mode,
      apiKey: form.mode === 'real' ? form.apiKey : undefined,
      apiSecret: form.mode === 'real' ? form.apiSecret : undefined,
      balances: {},
      portfolio: [],
    });
    setForm({ name: '', exchange: 'Binance', mode: 'mock', apiKey: '', apiSecret: '' });
    setAdding(false);
    setShowAddForm(false);
  };

  const aggregate = aggregateBalances();
  const totalPortfolioValue = Object.values(aggregate).reduce((a: number, b: any) => a + (b || 0), 0);

  // DApp options
  const dappOptions = [
    { icon: <FaRobot />, label: 'AI Arbitrage', badge: '6.2% APY', onClick: () => navigate('/arbitrage') },
    { icon: <FaWater />, label: 'Liquidity Mining', badge: 'Up to 15% APY', onClick: () => navigate('/arbitrage?tab=staking') },
    { icon: <FaHandHoldingUsd />, label: 'Crypto Loans', badge: 'From 3.5% APR', onClick: () => navigate('/loan') },
    { icon: <FaIdCard />, label: 'Credit Score', badge: '750+', onClick: () => navigate('/credit-score') },
    { icon: <FaCheckCircle />, label: 'KYC Verification', action: 'Verify Now', onClick: () => navigate('/kyc-verification') },
  ];

  const systemOptions = [
    { icon: <FaGlobe />, label: 'Language', badge: 'English', onClick: () => navigate('/settings/language') },
    { icon: <FaQuestionCircle />, label: 'FAQ & Support', onClick: () => navigate('/faq') },
    { icon: <FaBell />, label: 'Notifications', badge: '3', onClick: () => navigate('/settings/notifications') },
    { icon: <FaCog />, label: 'Preferences', onClick: () => navigate('/settings') },
  ];

  const privacyOptions = [
    { icon: <FaShieldAlt />, label: 'Privacy Policy', onClick: () => navigate('/privacy') },
    { icon: <FaGavel />, label: 'Terms of Service', onClick: () => navigate('/legal') },
    { icon: <HiOutlineScale />, label: 'Legal Documentation', onClick: () => navigate('/legal-docs') },
  ];

  const aboutOptions = [
    { icon: <FaBook />, label: 'White Paper', onClick: () => navigate('/white-paper') },
    { icon: <HiOutlineDocumentText />, label: 'Documentation', onClick: () => navigate('/docs') },
    { icon: <Award size={16} />, label: 'Audit Reports', badge: '2024', onClick: () => navigate('/audits') },
  ];

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-[#0B0E11] text-[#EAECEF] pb-24"
    >
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            rotate: [0, 90, 180]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-[#F0B90B]/5 rounded-full blur-3xl"
        />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#1E2329]/95 backdrop-blur-xl border-b border-[#2B3139]/50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-[#2B3139] rounded-xl transition-colors"
            >
              <ArrowLeft size={20} className="text-[#848E9C]" />
            </motion.button>
            <div className="w-8 h-8 bg-gradient-to-br from-[#F0B90B] to-yellow-500 rounded-xl flex items-center justify-center">
              <Settings size={16} className="text-[#0B0E11]" />
            </div>
            <h1 className="text-lg font-bold text-[#EAECEF]">Account Management</h1>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-2 hover:bg-[#2B3139] rounded-xl transition-colors"
          >
            <Menu size={20} className="text-[#848E9C]" />
          </motion.button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4 space-y-5 max-w-7xl mx-auto">
        {/* User Profile Card */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-[#1E2329] to-[#2B3139] border-0 p-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F0B90B] to-yellow-500 flex items-center justify-center shadow-lg shadow-[#F0B90B]/20"
                >
                  <User size={24} className="text-[#0B0E11]" />
                </motion.div>
                <div>
                  <h2 className="font-semibold text-[#EAECEF]">
                    {user ? `${user.firstName || 'User'} ${user.lastName || ''}` : 'Guest User'}
                  </h2>
                  <p className="text-xs text-[#848E9C] flex items-center gap-1">
                    <Mail size={12} />
                    {user ? user.email : 'Not signed in'}
                  </p>
                </div>
              </div>
              
              {user ? (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto border-[#2B3139] text-[#EAECEF] hover:bg-[#2B3139]"
                    onClick={() => { logout(); navigate('/login'); }}
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign Out
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    className="w-full sm:w-auto bg-[#F0B90B] hover:bg-yellow-400 text-[#0B0E11] font-semibold"
                    onClick={() => navigate('/login')}
                  >
                    <LogIn size={16} className="mr-2" />
                    Sign In
                  </Button>
                </motion.div>
              )}
            </div>
            
            {/* Account Stats - Mobile Responsive Grid */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#2B3139]">
              <motion.div 
                whileHover={{ y: -2 }}
                className="text-center bg-[#0B0E11] rounded-xl p-2"
              >
                <div className="text-xs text-[#848E9C]">Connected</div>
                <div className="font-bold text-[#EAECEF] text-lg">{accounts.length}</div>
                <div className="text-[10px] text-[#5E6673]">Exchanges</div>
              </motion.div>
              <motion.div 
                whileHover={{ y: -2 }}
                className="text-center bg-[#0B0E11] rounded-xl p-2"
              >
                <div className="text-xs text-[#848E9C]">Total Value</div>
                <div className="font-bold text-[#EAECEF] text-sm font-mono truncate">
                  ${totalPortfolioValue.toFixed(2)}
                </div>
                <div className="text-[10px] text-[#5E6673]">USD</div>
              </motion.div>
              <motion.div 
                whileHover={{ y: -2 }}
                className="text-center bg-[#0B0E11] rounded-xl p-2"
              >
                <div className="text-xs text-[#848E9C]">Member</div>
                <div className="font-bold text-[#EAECEF]">
                  {user ? '2024' : '-'}
                </div>
                <div className="text-[10px] text-[#5E6673] flex items-center justify-center gap-1">
                  <Calendar size={10} />
                  {new Date().getFullYear()}
                </div>
              </motion.div>
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions - Mobile Optimized Grid */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { icon: Wallet, label: 'Wallet', onClick: () => navigate('/wallet'), color: 'from-blue-500 to-blue-400' },
              { icon: Share2, label: 'Share', onClick: () => navigate('/share'), color: 'from-green-500 to-green-400' },
              { icon: Headphones, label: 'Support', onClick: () => navigate('/contact'), color: 'from-purple-500 to-purple-400' }
            ].map((item, index) => (
              <motion.div
                key={item.label}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className="bg-gradient-to-br from-[#1E2329] to-[#2B3139] border-0 p-3 hover:shadow-xl hover:shadow-[#F0B90B]/5 transition-all cursor-pointer"
                  onClick={item.onClick}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-2`}>
                      <item.icon size={18} className="text-[#0B0E11]" />
                    </div>
                    <span className="text-xs font-medium text-[#EAECEF]">{item.label}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Main Tabs - Mobile Optimized */}
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full bg-[#1E2329] p-1 rounded-xl border border-[#2B3139]">
              <TabsTrigger 
                value="accounts" 
                className="text-xs sm:text-sm data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#0B0E11] rounded-lg transition-all duration-200 py-2.5"
              >
                Exchange Accounts
              </TabsTrigger>
              <TabsTrigger 
                value="dapps" 
                className="text-xs sm:text-sm data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#0B0E11] rounded-lg transition-all duration-200 py-2.5"
              >
                DApp & Settings
              </TabsTrigger>
            </TabsList>

            {/* Accounts Tab */}
            <TabsContent value="accounts" className="mt-4 space-y-4">
              {/* Add Account Button */}
              {!showAddForm ? (
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Button
                    className="w-full bg-[#1E2329] border border-[#2B3139] text-[#EAECEF] hover:bg-[#2B3139] h-12 rounded-xl font-medium"
                    onClick={() => setShowAddForm(true)}
                  >
                    <Plus size={16} className="mr-2" />
                    Connect Exchange Account
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-[#EAECEF]">Add New Account</h3>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowAddForm(false)}
                        className="p-1 hover:bg-[#2B3139] rounded-lg transition-colors"
                      >
                        <X size={18} className="text-[#848E9C]" />
                      </motion.button>
                    </div>
                    
                    <form onSubmit={handleAdd} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-[#848E9C]">Exchange</Label>
                          <Select value={form.exchange} onValueChange={v => handleChange('exchange', v)}>
                            <SelectTrigger className="bg-[#0B0E11] border-[#2B3139] text-[#EAECEF] h-10 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1E2329] border-[#2B3139]">
                              {EXCHANGES.map(ex => (
                                <SelectItem key={ex} value={ex} className="text-[#EAECEF] focus:bg-[#2B3139]">
                                  {ex}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-[#848E9C]">Mode</Label>
                          <Select value={form.mode} onValueChange={v => handleChange('mode', v as AccountMode)}>
                            <SelectTrigger className="bg-[#0B0E11] border-[#2B3139] text-[#EAECEF] h-10 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1E2329] border-[#2B3139]">
                              <SelectItem value="mock" className="text-[#EAECEF]">Demo / Paper</SelectItem>
                              <SelectItem value="real" className="text-[#EAECEF]">Live Trading</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-[#848E9C]">Account Name (Optional)</Label>
                        <Input
                          value={form.name}
                          onChange={e => handleChange('name', e.target.value)}
                          placeholder="e.g., Main Trading"
                          className="bg-[#0B0E11] border-[#2B3139] text-[#EAECEF] h-10 text-sm"
                        />
                      </div>
                      
                      {form.mode === 'real' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-3"
                        >
                          <div>
                            <Label className="text-xs text-[#848E9C]">API Key</Label>
                            <div className="relative">
                              <Input
                                value={form.apiKey}
                                onChange={e => handleChange('apiKey', e.target.value)}
                                placeholder="Enter API key"
                                className="bg-[#0B0E11] border-[#2B3139] text-[#EAECEF] h-10 pl-10 text-sm"
                                required
                              />
                              <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848E9C]" />
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-xs text-[#848E9C]">API Secret</Label>
                            <div className="relative">
                              <Input
                                type="password"
                                value={form.apiSecret}
                                onChange={e => handleChange('apiSecret', e.target.value)}
                                placeholder="Enter API secret"
                                className="bg-[#0B0E11] border-[#2B3139] text-[#EAECEF] h-10 pl-10 text-sm"
                                required
                              />
                              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848E9C]" />
                            </div>
                          </div>
                          
                          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                            <p className="text-xs text-blue-400 flex items-start gap-2">
                              <Shield size={14} className="mt-0.5 shrink-0" />
                              API keys are encrypted and stored securely. Use read-only permissions.
                            </p>
                          </div>
                        </motion.div>
                      )}
                      
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <Button
                          type="submit"
                          className="w-full bg-[#F0B90B] hover:bg-yellow-400 text-[#0B0E11] font-semibold h-11 rounded-xl"
                          disabled={adding || (form.mode === 'real' && (!form.apiKey || !form.apiSecret))}
                        >
                          {adding ? (
                            <div className="flex items-center gap-2">
                              <RefreshCw size={14} className="animate-spin" />
                              Connecting...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <FaPlug size={14} />
                              Connect Account
                            </div>
                          )}
                        </Button>
                      </motion.div>
                    </form>
                  </Card>
                </motion.div>
              )}

              {/* Accounts List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#EAECEF]">Connected Accounts</h3>
                  <Badge className="bg-[#2B3139] text-[#848E9C] px-2 py-1">
                    {accounts.length} Total
                  </Badge>
                </div>
                
                {accounts.length === 0 ? (
                  <Card className="bg-[#1E2329] border border-[#2B3139] p-8 text-center">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#2B3139] flex items-center justify-center"
                    >
                      <FaExchangeAlt size={24} className="text-[#5E6673]" />
                    </motion.div>
                    <h4 className="text-[#EAECEF] font-medium mb-2">No Accounts Connected</h4>
                    <p className="text-xs text-[#848E9C] mb-4 max-w-xs mx-auto">
                      Connect your exchange accounts to view balances and trade across multiple platforms.
                    </p>
                    <Button 
                      className="bg-[#F0B90B] text-[#0B0E11] font-bold"
                      onClick={() => setShowAddForm(true)}
                    >
                      <Plus size={14} className="mr-2" />
                      Add First Account
                    </Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {accounts.map(acc => (
                      <AccountCard
                        key={acc.id}
                        account={acc}
                        onRemove={removeAccount}
                        onViewPortfolio={setPortfolioAccount}
                        isSelected={portfolioAccount?.id === acc.id}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Aggregate Balances - Mobile Optimized */}
              {accounts.length > 0 && Object.keys(aggregate).length > 0 && (
                <motion.div variants={itemVariants}>
                  <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <HiOutlineChartBar size={16} className="text-[#F0B90B]" />
                      <span className="text-sm font-medium text-[#EAECEF]">Aggregate Portfolio</span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {Object.entries(aggregate).slice(0, 8).map(([sym, bal]: [string, any]) => (
                        <div key={sym} className="bg-[#0B0E11] rounded-lg p-2 border border-[#2B3139]">
                          <div className="text-[10px] text-[#848E9C]">{sym}</div>
                          <div className="text-xs font-mono text-[#EAECEF] truncate">{bal?.toFixed(4) || '0.0000'}</div>
                          <div className="text-[9px] text-[#5E6673]">≈ ${bal?.toFixed(2) || '0.00'}</div>
                        </div>
                      ))}
                    </div>
                    
                    {Object.keys(aggregate).length > 8 && (
                      <button className="text-xs text-[#F0B90B] hover:text-yellow-400 flex items-center gap-1 mt-3">
                        View all {Object.keys(aggregate).length} assets
                        <ChevronRight size={12} />
                      </button>
                    )}
                    
                    <div className="mt-3 pt-3 border-t border-[#2B3139] flex justify-between items-center">
                      <span className="text-xs text-[#848E9C]">Total Value</span>
                      <span className="text-sm font-bold text-[#EAECEF] font-mono">
                        ${totalPortfolioValue.toFixed(2)}
                      </span>
                    </div>
                  </Card>
                </motion.div>
              )}
            </TabsContent>

            {/* DApp & Settings Tab */}
            <TabsContent value="dapps" className="mt-4 space-y-5">
              <MenuSection title="Decentralized Applications" options={dappOptions} />
              <MenuSection title="System & Preferences" options={systemOptions} />
              <MenuSection title="Privacy & Legal" options={privacyOptions} />
              <MenuSection title="About Kryvex" options={aboutOptions} />
              
              {/* Version Info */}
              <motion.div variants={itemVariants}>
                <Card className="bg-[#1E2329] border border-[#2B3139] p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-[#848E9C]">System Status: Operational</span>
                  </div>
                  <p className="text-[10px] text-[#5E6673]">
                    Kryvex Trading v1.0.0 • © 2024 Kryvex
                  </p>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Portfolio Modal */}
      <AnimatePresence>
        {portfolioAccount && (
          <PortfolioModal 
            account={portfolioAccount} 
            onClose={() => setPortfolioAccount(null)} 
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setShowMobileMenu(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-64 bg-[#1E2329] border-l border-[#2B3139] p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-[#EAECEF]">Menu</h3>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 hover:bg-[#2B3139] rounded-lg transition-colors"
                >
                  <X size={18} className="text-[#848E9C]" />
                </button>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setActiveTab('accounts');
                    setShowMobileMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-[#EAECEF] hover:bg-[#2B3139] rounded-lg transition-colors"
                >
                  Exchange Accounts
                </button>
                <button
                  onClick={() => {
                    setActiveTab('dapps');
                    setShowMobileMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-[#EAECEF] hover:bg-[#2B3139] rounded-lg transition-colors"
                >
                  DApp & Settings
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
        
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        @media (max-width: 640px) {
          input, select, button {
            font-size: 16px !important;
          }
          
          .grid {
            gap: 0.5rem;
          }
        }

        /* Binance style focus rings */
        *:focus-visible {
          outline: 2px solid #F0B90B;
          outline-offset: 2px;
        }
      `}</style>
    </motion.div>
  );
}