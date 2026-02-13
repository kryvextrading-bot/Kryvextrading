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
import { motion } from 'framer-motion';
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
  Clock
} from 'lucide-react';

const EXCHANGES: Exchange[] = ['Binance', 'Coinbase', 'Kraken', 'MockExchange'];

// Account Card Component
const AccountCard = ({ account, onRemove, onViewPortfolio, isSelected }: any) => {
  const [showBalances, setShowBalances] = useState(false);
  
  return (
    <Card className="bg-[#1E2329] border border-[#2B3139] hover:border-[#F0B90B]/50 transition-all p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F0B90B]/20 to-yellow-500/20 flex items-center justify-center">
            <FaExchangeAlt className="text-[#F0B90B]" size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-[#EAECEF]">{account.name}</h3>
              <Badge className={account.mode === 'live' 
                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              }>
                {account.mode === 'live' ? 'LIVE' : 'DEMO'}
              </Badge>
            </div>
            <div className="text-xs text-[#848E9C] flex items-center gap-2">
              <span>{account.exchange}</span>
              <span className="w-1 h-1 rounded-full bg-[#2B3139]" />
              <span>ID: {account.id.slice(0, 8)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-[#848E9C] hover:text-[#EAECEF]"
            onClick={() => setShowBalances(!showBalances)}
          >
            {showBalances ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={() => onRemove(account.id)}
          >
            <FaTrash size={14} />
          </Button>
        </div>
      </div>
      
      {/* Balances */}
      <div className="mt-4 space-y-2">
        {showBalances ? (
          <>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#848E9C]">Total Value</span>
              <span className="font-mono text-[#EAECEF] font-bold">
                ${Object.values(account.balances).reduce((a: number, b: any) => a + (b || 0), 0).toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(account.balances).slice(0, 4).map(([sym, bal]: [string, any]) => (
                <div key={sym} className="bg-[#181A20] rounded-lg p-2">
                  <div className="text-[10px] text-[#848E9C]">{sym}</div>
                  <div className="text-xs font-mono text-[#EAECEF]">{bal?.toFixed(4) || '0.0000'}</div>
                </div>
              ))}
            </div>
            {Object.keys(account.balances).length > 4 && (
              <button 
                className="text-[10px] text-[#F0B90B] hover:text-yellow-400 flex items-center gap-1 mt-1"
                onClick={() => onViewPortfolio(account.id)}
              >
                View all {Object.keys(account.balances).length} assets
                <ChevronRight size={10} />
              </button>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center py-2">
            <span className="text-xs text-[#5E6673]">•••••• (Hidden)</span>
          </div>
        )}
      </div>
      
      {/* API Status (for live accounts) */}
      {account.mode === 'live' && (
        <div className="mt-3 pt-3 border-t border-[#2B3139] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-[10px] text-[#848E9C]">API Connected</span>
          </div>
          <Badge className="bg-[#2B3139] text-[#848E9C] text-[10px]">
            Read-only
          </Badge>
        </div>
      )}
    </Card>
  );
};

// DApp Card Component
const DAppCard = ({ icon, label, action, onClick, badge }: any) => (
  <Card 
    className="bg-[#1E2329] border border-[#2B3139] hover:border-[#F0B90B] hover:bg-[#23262F] transition-all p-4 cursor-pointer group"
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#F0B90B]/10 flex items-center justify-center group-hover:bg-[#F0B90B]/20 transition-colors">
          <span className="text-[#F0B90B] text-xl">{icon}</span>
        </div>
        <div>
          <h4 className="font-medium text-[#EAECEF] text-sm">{label}</h4>
          {badge && <span className="text-[10px] text-[#848E9C]">{badge}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {action && (
          <Button size="sm" className="h-7 text-xs bg-[#F0B90B] text-[#181A20]">
            {action}
          </Button>
        )}
        <ChevronRight size={16} className="text-[#848E9C] group-hover:text-[#F0B90B] transition-colors" />
      </div>
    </div>
  </Card>
);

// Menu Section Component
const MenuSection = ({ title, options }: { title: string; options: any[] }) => (
  <div className="space-y-2">
    <h3 className="text-xs font-semibold text-[#848E9C] uppercase tracking-wider mb-2">
      {title}
    </h3>
    <Card className="bg-[#1E2329] border border-[#2B3139] divide-y divide-[#2B3139]">
      {options.map((opt, index) => (
        <div
          key={index}
          className="flex items-center justify-between px-4 py-3 hover:bg-[#23262F] cursor-pointer transition-colors"
          onClick={opt.onClick}
        >
          <div className="flex items-center gap-3">
            <span className="text-[#F0B90B] text-lg">{opt.icon}</span>
            <span className="text-sm text-[#EAECEF]">{opt.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {opt.badge && (
              <Badge className="bg-[#F0B90B]/20 text-[#F0B90B] text-[10px]">
                {opt.badge}
              </Badge>
            )}
            {opt.action && (
              <Button size="sm" variant="ghost" className="h-7 text-xs text-[#F0B90B]">
                {opt.action}
              </Button>
            )}
            <ChevronRight size={14} className="text-[#5E6673]" />
          </div>
        </div>
      ))}
    </Card>
  </div>
);

// Portfolio Modal Component
const PortfolioModal = ({ account, onClose }: { account: any; onClose: () => void }) => {
  const totalValue = Object.values(account?.balances || {}).reduce((a: number, b: any) => a + (b || 0), 0);
  
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 animate-in fade-in duration-200">
      <Card className="w-full md:max-w-lg bg-[#1E2329] border border-[#2B3139] rounded-t-2xl md:rounded-2xl animate-in slide-in-from-bottom md:zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-4 border-b border-[#2B3139]">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-1 hover:bg-[#2B3139] rounded-lg">
              <ArrowLeft size={18} className="text-[#848E9C]" />
            </button>
            <h2 className="text-lg font-bold text-[#EAECEF]">{account?.name} Portfolio</h2>
          </div>
          <Badge className={account?.mode === 'live' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
            {account?.mode?.toUpperCase()}
          </Badge>
        </div>
        
        <div className="p-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="bg-[#181A20] rounded-lg p-4 mb-4">
            <div className="text-xs text-[#848E9C] mb-1">Total Portfolio Value</div>
            <div className="text-2xl font-bold text-[#EAECEF] font-mono">
              ${totalValue.toFixed(2)}
            </div>
            <div className="text-[10px] text-[#5E6673] mt-1">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-[#848E9C] mb-2">Asset Balances</h4>
            {Object.entries(account?.balances || {}).length === 0 ? (
              <div className="text-center py-8 text-[#5E6673] text-sm">No balances found</div>
            ) : (
              Object.entries(account?.balances || {}).map(([sym, bal]: [string, any]) => (
                <div key={sym} className="flex items-center justify-between py-2 border-b border-[#2B3139] last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#2B3139] flex items-center justify-center text-xs">
                      {sym.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-[#EAECEF]">{sym}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-[#EAECEF]">{bal?.toFixed(6) || '0.000000'}</div>
                    <div className="text-[10px] text-[#848E9C]">${bal?.toFixed(2) || '0.00'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-[#2B3139] flex justify-end">
          <Button onClick={onClose} className="bg-[#F0B90B] text-[#181A20] hover:bg-yellow-400">
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
};

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

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <motion.div 
      className="min-h-screen bg-[#181A20] pb-24"
      initial="initial"
      animate="animate"
      variants={fadeInUp}
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#181A20]/95 backdrop-blur border-b border-[#2B3139]">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-[#23262F] rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-[#848E9C]" />
            </button>
            <div className="w-8 h-8 bg-gradient-to-br from-[#F0B90B] to-yellow-500 rounded-lg flex items-center justify-center">
              <Settings size={18} className="text-[#181A20]" />
            </div>
            <h1 className="text-lg font-bold text-[#EAECEF]">Account Management</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4 space-y-5">
        
        {/* User Profile Card */}
        <motion.div variants={fadeInUp}>
          <Card className="bg-gradient-to-br from-[#1E2329] to-[#2B3139] border-0 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F0B90B] to-yellow-500 flex items-center justify-center">
                  <User size={24} className="text-[#181A20]" />
                </div>
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
                <Button 
                  variant="outline" 
                  className="border-[#2B3139] text-[#EAECEF] hover:bg-[#23262F]"
                  onClick={() => { logout(); navigate('/login'); }}
                >
                  <LogOut size={16} className="mr-2" />
                  Sign Out
                </Button>
              ) : (
                <Button 
                  className="bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20]"
                  onClick={() => navigate('/login')}
                >
                  <LogIn size={16} className="mr-2" />
                  Sign In
                </Button>
              )}
            </div>
            
            {/* Account Stats */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#2B3139]">
              <div className="text-center">
                <div className="text-xs text-[#848E9C]">Connected</div>
                <div className="font-bold text-[#EAECEF]">{accounts.length}</div>
                <div className="text-[10px] text-[#5E6673]">Exchanges</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-[#848E9C]">Total Value</div>
                <div className="font-bold text-[#EAECEF] font-mono">
                  ${totalPortfolioValue.toFixed(2)}
                </div>
                <div className="text-[10px] text-[#5E6673]">USD</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-[#848E9C]">Member Since</div>
                <div className="font-bold text-[#EAECEF]">
                  {user ? '2024' : '-'}
                </div>
                <div className="text-[10px] text-[#5E6673]">
                  <Calendar size={10} className="inline mr-1" />
                  {new Date().getFullYear()}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={fadeInUp}>
          <div className="grid grid-cols-3 gap-3">
            <Card 
              className="bg-[#1E2329] border border-[#2B3139] p-4 hover:border-[#F0B90B] transition-all cursor-pointer"
              onClick={() => navigate('/wallet')}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-[#F0B90B]/10 flex items-center justify-center mb-2">
                  <FaWallet className="text-[#F0B90B]" size={18} />
                </div>
                <span className="text-xs font-medium text-[#EAECEF]">Wallet</span>
                <span className="text-[10px] text-[#848E9C] mt-1">View balances</span>
              </div>
            </Card>
            
            <Card 
              className="bg-[#1E2329] border border-[#2B3139] p-4 hover:border-[#F0B90B] transition-all cursor-pointer"
              onClick={() => navigate('/share')}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-[#F0B90B]/10 flex items-center justify-center mb-2">
                  <FaShareAlt className="text-[#F0B90B]" size={18} />
                </div>
                <span className="text-xs font-medium text-[#EAECEF]">Share</span>
                <span className="text-[10px] text-[#848E9C] mt-1">Refer & earn</span>
              </div>
            </Card>
            
            <Card 
              className="bg-[#1E2329] border border-[#2B3139] p-4 hover:border-[#F0B90B] transition-all cursor-pointer"
              onClick={() => navigate('/contact')}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-[#F0B90B]/10 flex items-center justify-center mb-2">
                  <FaHeadphones className="text-[#F0B90B]" size={18} />
                </div>
                <span className="text-xs font-medium text-[#EAECEF]">Support</span>
                <span className="text-[10px] text-[#848E9C] mt-1">24/7 help</span>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Main Tabs */}
        <motion.div variants={fadeInUp}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full bg-[#1E2329] p-1 rounded-xl">
              <TabsTrigger 
                value="accounts" 
                className="text-xs data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg"
              >
                Exchange Accounts
              </TabsTrigger>
              <TabsTrigger 
                value="dapps" 
                className="text-xs data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg"
              >
                DApp & Settings
              </TabsTrigger>
            </TabsList>

            {/* Accounts Tab */}
            <TabsContent value="accounts" className="mt-4 space-y-4">
              {/* Add Account Button */}
              {!showAddForm ? (
                <Button
                  className="w-full bg-[#1E2329] border border-[#2B3139] text-[#EAECEF] hover:bg-[#23262F] h-12"
                  onClick={() => setShowAddForm(true)}
                >
                  <FaPlus className="mr-2" size={14} />
                  Connect Exchange Account
                </Button>
              ) : (
                <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-[#EAECEF]">Add New Account</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-[#848E9C]"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                  
                  <form onSubmit={handleAdd} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-[#848E9C]">Exchange</Label>
                        <Select value={form.exchange} onValueChange={v => handleChange('exchange', v)}>
                          <SelectTrigger className="bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {EXCHANGES.map(ex => (
                              <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-[#848E9C]">Mode</Label>
                        <Select value={form.mode} onValueChange={v => handleChange('mode', v as AccountMode)}>
                          <SelectTrigger className="bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mock">Demo / Paper Trading</SelectItem>
                            <SelectItem value="real">Live Trading (API)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-[#848E9C]">Account Name (Optional)</Label>
                      <Input
                        value={form.name}
                        onChange={e => handleChange('name', e.target.value)}
                        placeholder="e.g., Main Trading, Test Account"
                        className="bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-10"
                      />
                    </div>
                    
                    {form.mode === 'real' && (
                      <>
                        <div>
                          <Label className="text-xs text-[#848E9C]">API Key</Label>
                          <div className="relative">
                            <Input
                              value={form.apiKey}
                              onChange={e => handleChange('apiKey', e.target.value)}
                              placeholder="Enter API key"
                              className="bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-10 pl-10"
                              required
                            />
                            <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848E9C]" size={14} />
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
                              className="bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-10 pl-10"
                              required
                            />
                            <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848E9C]" size={14} />
                          </div>
                        </div>
                        
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                          <p className="text-[10px] text-blue-400 flex items-start gap-2">
                            <Shield size={12} className="mt-0.5 shrink-0" />
                            API keys are encrypted and stored securely. Use read-only permissions when possible.
                          </p>
                        </div>
                      </>
                    )}
                    
                    <Button
                      type="submit"
                      className="w-full bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold h-11"
                      disabled={adding || (form.mode === 'real' && (!form.apiKey || !form.apiSecret))}
                    >
                      {adding ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-[#181A20] border-t-transparent rounded-full animate-spin" />
                          Connecting...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <FaPlug size={14} />
                          Connect Account
                        </div>
                      )}
                    </Button>
                  </form>
                </Card>
              )}

              {/* Accounts List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#EAECEF]">Connected Accounts</h3>
                  <Badge className="bg-[#2B3139] text-[#848E9C]">
                    {accounts.length} Total
                  </Badge>
                </div>
                
                {accounts.length === 0 ? (
                  <Card className="bg-[#1E2329] border border-[#2B3139] p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#2B3139] flex items-center justify-center">
                      <FaExchangeAlt size={24} className="text-[#5E6673]" />
                    </div>
                    <h4 className="text-[#EAECEF] font-medium mb-2">No Accounts Connected</h4>
                    <p className="text-xs text-[#848E9C] mb-4">
                      Connect your exchange accounts to view balances and trade across multiple platforms.
                    </p>
                    <Button 
                      className="bg-[#F0B90B] text-[#181A20] font-bold"
                      onClick={() => setShowAddForm(true)}
                    >
                      <FaPlus size={14} className="mr-2" />
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

              {/* Aggregate Balances */}
              {accounts.length > 0 && Object.keys(aggregate).length > 0 && (
                <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <HiOutlineChartBar size={16} className="text-[#F0B90B]" />
                    <span className="text-sm font-medium text-[#EAECEF]">Aggregate Portfolio</span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(aggregate).map(([sym, bal]: [string, any]) => (
                      <div key={sym} className="bg-[#181A20] rounded-lg p-2">
                        <div className="text-[10px] text-[#848E9C]">{sym}</div>
                        <div className="text-xs font-mono text-[#EAECEF]">{bal?.toFixed(4) || '0.0000'}</div>
                        <div className="text-[9px] text-[#5E6673]">≈ ${bal?.toFixed(2) || '0.00'}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-[#2B3139] flex justify-between items-center">
                    <span className="text-xs text-[#848E9C]">Total Value</span>
                    <span className="text-sm font-bold text-[#EAECEF] font-mono">
                      ${totalPortfolioValue.toFixed(2)}
                    </span>
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* DApp & Settings Tab */}
            <TabsContent value="dapps" className="mt-4 space-y-5">
              {/* DApp Section */}
              <MenuSection title="Decentralized Applications" options={dappOptions} />
              
              {/* System & Preferences */}
              <MenuSection title="System & Preferences" options={systemOptions} />
              
              {/* Privacy & Legal */}
              <MenuSection title="Privacy & Legal" options={privacyOptions} />
              
              {/* About */}
              <MenuSection title="About Swan-IRA" options={aboutOptions} />
              
              {/* Version Info */}
              <Card className="bg-[#1E2329] border border-[#2B3139] p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-[#848E9C]">System Status: Operational</span>
                </div>
                <p className="text-[10px] text-[#5E6673]">
                  Swan-IRA v2.4.0 • © 2024 Swan IRA Financial Services
                </p>
                <p className="text-[9px] text-[#5E6673] mt-1">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Portfolio Modal */}
      {portfolioAccount && (
        <PortfolioModal 
          account={portfolioAccount} 
          onClose={() => setPortfolioAccount(null)} 
        />
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
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