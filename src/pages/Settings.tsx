// pages/Settings.tsx - COMPLETE PREMIUM REDESIGN

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings as SettingsIcon,
  User, 
  Bell, 
  Globe, 
  Shield, 
  Palette,
  Volume2,
  Moon,
  Sun,
  Monitor,
  Eye,
  EyeOff,
  Key,
  Fingerprint,
  Mail,
  Phone,
  Lock,
  LogOut,
  Download,
  Upload,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Info,
  Award,
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Clock,
  Calendar,
  Zap,
  Sparkles,
  Gem,
  Crown,
  Rocket,
  ShieldCheck,
  Wifi,
  WifiOff,
  Smartphone,
  Tablet,
  Laptop,
  Headphones,
  Volume,
  Volume1,
  Volume2 as Volume2Icon,
  VolumeX,
  Bell as BellIcon,
  BellOff,
  BellRing,
  Mail as MailIcon,
  MailOpen,
  Phone as PhoneIcon,
  Globe as GlobeIcon,
  Languages,
  Translate,
  Brush,
  Paintbrush,
  Sparkles as SparklesIcon,
  Gem as GemIcon,
  Crown as CrownIcon,
  Rocket as RocketIcon,
  Shield as ShieldIcon,
  ShieldCheck as ShieldCheckIcon,
  ShieldAlert,
  User as UserIcon,
  Users,
  UserPlus,
  UserCheck,
  UserCog,
  Settings as SettingsIcon2,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Power,
  PowerOff,
  Circle,
  CircleDot,
  CircleCheck,
  CircleX,
  CircleAlert,
  CircleHelp,
  CirclePlus,
  CircleMinus,
  CircleDollarSign,
  CircleEuro,
  CirclePound,
  CircleYen,
  CircleBitcoin,
  CircleEthereum,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit,
  Save,
  Trash2,
  Plus,
  Minus,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Menu,
  X as XIcon,
  Home,
  Settings,
  HelpCircle,
  LogOut as LogOutIcon,
  UserCircle,
  BellRing as BellRingIcon,
  Shield as ShieldIcon2,
  Globe as GlobeIcon2,
  Palette as PaletteIcon2,
  Volume2 as Volume2Icon2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

// ==================== TYPES ====================
interface SettingSection {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  color: string;
}

interface SecuritySetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  icon: React.ElementType;
  color: string;
  badge?: string;
}

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  icon: React.ElementType;
  color: string;
}

interface Language {
  code: string;
  name: string;
  native: string;
  flag: string;
}

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

// ==================== CONSTANTS ====================
const BINANCE_YELLOW = '#F0B90B';
const BINANCE_DARK = '#0B0E11';
const BINANCE_CARD = '#1E2329';
const BINANCE_BORDER = '#2B3139';
const BINANCE_HOVER = '#373B42';

const settingsSections: SettingSection[] = [
  { id: 'general', label: 'General', icon: SettingsIcon, description: 'App preferences and appearance', color: 'from-blue-500 to-blue-400' },
  { id: 'account', label: 'Account', icon: User, description: 'Manage your personal information', color: 'from-green-500 to-green-400' },
  { id: 'security', label: 'Security', icon: Shield, description: 'Protect your account', color: 'from-red-500 to-red-400' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Configure alerts and updates', color: 'from-yellow-500 to-yellow-400' },
  { id: 'language', label: 'Language & Region', icon: Globe, description: 'Set your preferences', color: 'from-purple-500 to-purple-400' },
  { id: 'trading', label: 'Trading', icon: TrendingUp, description: 'Default trading settings', color: 'from-orange-500 to-orange-400' },
  { id: 'privacy', label: 'Privacy', icon: Eye, description: 'Control your data', color: 'from-pink-500 to-pink-400' },
  { id: 'about', label: 'About', icon: Info, description: 'App information', color: 'from-indigo-500 to-indigo-400' },
];

const securitySettings: SecuritySetting[] = [
  { id: '2fa', label: 'Two-Factor Authentication', description: 'Add an extra layer of security to your account', enabled: true, icon: Fingerprint, color: 'green', badge: 'Active' },
  { id: 'ipWhitelist', label: 'IP Whitelist', description: 'Restrict access to trusted IP addresses', enabled: false, icon: Globe, color: 'blue', badge: 'Disabled' },
  { id: 'loginAlerts', label: 'Login Alerts', description: 'Get notified of new login attempts', enabled: true, icon: Bell, color: 'yellow', badge: 'Active' },
  { id: 'withdrawalWhitelist', label: 'Withdrawal Whitelist', description: 'Limit withdrawals to trusted addresses', enabled: false, icon: Shield, color: 'red', badge: 'Disabled' },
  { id: 'sessionTimeout', label: 'Session Timeout', description: 'Automatically log out after inactivity', enabled: true, icon: Clock, color: 'purple', badge: '15 min' },
  { id: 'deviceManagement', label: 'Device Management', description: 'Manage trusted devices', enabled: true, icon: Smartphone, color: 'orange', badge: '3 devices' },
];

const notificationSettings: NotificationSetting[] = [
  { id: 'emailNotifications', label: 'Email Notifications', description: 'Receive updates via email', enabled: true, icon: Mail, color: 'blue' },
  { id: 'pushNotifications', label: 'Push Notifications', description: 'Receive push notifications on your devices', enabled: true, icon: Bell, color: 'yellow' },
  { id: 'tradingAlerts', label: 'Trading Alerts', description: 'Get notified about your trades', enabled: true, icon: TrendingUp, color: 'green' },
  { id: 'priceAlerts', label: 'Price Alerts', description: 'Receive alerts when prices reach your targets', enabled: false, icon: CircleDollarSign, color: 'purple' },
  { id: 'newsUpdates', label: 'News & Updates', description: 'Stay informed about platform updates', enabled: true, icon: Globe, color: 'orange' },
  { id: 'securityAlerts', label: 'Security Alerts', description: 'Critical security notifications', enabled: true, icon: Shield, color: 'red' },
];

const languages: Language[] = [
  { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', native: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
];

const currencies: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
];

// ==================== ANIMATION VARIANTS ====================
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
      duration: 0.5,
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

// ==================== MAIN COMPONENT ====================
export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [notifications, setNotifications] = useState(notificationSettings);
  const [security, setSecurity] = useState(securitySettings);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsEditing(false);
      toast.success('Settings saved successfully!');
    }, 1500);
  };

  const toggleNotification = (id: string) => {
    setNotifications(prev =>
      prev.map(item =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  const toggleSecurity = (id: string) => {
    setSecurity(prev =>
      prev.map(item =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

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
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 5 }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#5096FF]/5 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#F0B90B] to-yellow-400 bg-clip-text text-transparent mb-2">
            Settings
          </h1>
          <p className="text-[#848E9C] text-lg">Manage your account preferences and security</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Settings Navigation */}
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <Card className="bg-[#1E2329] border-[#2B3139] overflow-hidden sticky top-20">
              <CardHeader className="border-b border-[#2B3139] bg-gradient-to-r from-[#F0B90B]/10 to-transparent">
                <CardTitle className="text-[#EAECEF] flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5 text-[#F0B90B]" />
                  Settings Menu
                </CardTitle>
                <CardDescription className="text-[#848E9C]">
                  {settingsSections.length} categories
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {settingsSections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeTab === section.id;
                    return (
                      <motion.button
                        key={section.id}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab(section.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 relative group overflow-hidden ${
                          isActive
                            ? 'bg-gradient-to-r from-[#F0B90B] to-yellow-500 text-[#0B0E11]'
                            : 'text-[#848E9C] hover:text-[#EAECEF] hover:bg-[#2B3139]'
                        }`}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                          variants={shimmerEffect}
                          initial="initial"
                          whileHover="hover"
                        />
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isActive
                            ? 'bg-[#0B0E11]/20'
                            : `bg-gradient-to-br ${section.color} opacity-20`
                        }`}>
                          <Icon className={`w-4 h-4 ${isActive ? 'text-[#0B0E11]' : ''}`} />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-sm">{section.label}</p>
                          <p className="text-xs opacity-70 hidden sm:block">{section.description}</p>
                        </div>
                        {isActive && (
                          <motion.div
                            layoutId="activeSection"
                            className="absolute right-2 w-1.5 h-1.5 bg-[#0B0E11] rounded-full"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </nav>

                <Separator className="my-4 bg-[#2B3139]" />

                <Button
                  variant="ghost"
                  className="w-full justify-start text-[#848E9C] hover:text-red-400 hover:bg-red-500/10"
                  onClick={handleLogout}
                >
                  <LogOutIcon className="w-4 h-4 mr-3" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </motion.div>

            {activeTab === 'trading' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label htmlFor="default-amount">{t('Default Trade Amount')}</Label>
                  <Input
                    id="default-amount"
                    type="number"
                    placeholder="100"
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-4">
                  <Label htmlFor="leverage">{t('Default Leverage')}</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="1x, 5x, 10x, 20x" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1x</SelectItem>
                      <SelectItem value="5">5x</SelectItem>
                      <SelectItem value="10">10x</SelectItem>
                      <SelectItem value="20">20x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="slippage">{t('Slippage Tolerance')}</Label>
                  <Input
                    id="slippage"
                    type="number"
                    placeholder="0.1"
                    step="0.01"
                    className="bg-muted"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  </motion.div>
</div>
                              disabled={!isEditing}
                              className="bg-[#0B0E11] border-[#2B3139] text-[#EAECEF] disabled:opacity-70"
                            />
                          </div>
                        </div>

                        <div className="bg-[#0B0E11] rounded-xl p-4 border border-[#2B3139]">
                          <h4 className="text-sm font-medium text-[#EAECEF] mb-2">Account Status</h4>
                          <div className="flex items-center gap-4">
                            <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                              <CircleCheck className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                              <Shield className="w-3 h-3 mr-1" />
                              KYC Level 2
                            </Badge>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Security Settings */}
                    {activeTab === 'security' && (
                      <motion.div variants={itemVariants} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {security.map((setting) => {
                            const Icon = setting.icon;
                            return (
                              <motion.div
                                key={setting.id}
                                whileHover={{ scale: 1.02, y: -2 }}
                                className="bg-[#0B0E11] rounded-xl p-4 border border-[#2B3139] hover:border-[#F0B90B]/30 transition-all duration-200"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className={`w-8 h-8 rounded-lg bg-${setting.color}-500/10 flex items-center justify-center`}>
                                    <Icon className={`w-4 h-4 text-${setting.color}-400`} />
                                  </div>
                                  <Switch
                                    checked={setting.enabled}
                                    onCheckedChange={() => toggleSecurity(setting.id)}
                                    className="data-[state=checked]:bg-[#F0B90B]"
                                  />
                                </div>
                                <h4 className="font-medium text-[#EAECEF] mb-1">{setting.label}</h4>
                                <p className="text-xs text-[#848E9C] mb-2">{setting.description}</p>
                                {setting.badge && (
                                  <Badge className={`bg-${setting.color}-500/10 text-${setting.color}-400 border-${setting.color}-500/20`}>
                                    {setting.badge}
                                  </Badge>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>

                        <div className="bg-[#0B0E11] rounded-xl p-4 border border-[#2B3139]">
                          <h4 className="text-sm font-medium text-[#EAECEF] mb-3">Password</h4>
                          <div className="space-y-3">
                            <div className="relative">
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Current Password"
                                disabled={!isEditing}
                                className="bg-[#1E2329] border-[#2B3139] text-[#EAECEF] pr-10"
                              />
                              <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#848E9C] hover:text-[#F0B90B]"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            <Input
                              type="password"
                              placeholder="New Password"
                              disabled={!isEditing}
                              className="bg-[#1E2329] border-[#2B3139] text-[#EAECEF]"
                            />
                            <Input
                              type="password"
                              placeholder="Confirm New Password"
                              disabled={!isEditing}
                              className="bg-[#1E2329] border-[#2B3139] text-[#EAECEF]"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-[#0B0E11] rounded-xl border border-[#2B3139]">
                          <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-[#EAECEF] mb-1">Recent Login Activity</p>
                            <p className="text-xs text-[#848E9C]">Last login: Today at 09:45 AM from New York, USA</p>
                          </div>
                          <Button variant="outline" size="sm" className="border-[#2B3139] text-[#848E9C]">
                            View All
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {/* Notifications Settings */}
                    {activeTab === 'notifications' && (
                      <motion.div variants={itemVariants} className="space-y-4">
                        {notifications.map((notification) => {
                          const Icon = notification.icon;
                          return (
                            <motion.div
                              key={notification.id}
                              whileHover={{ scale: 1.01, x: 4 }}
                              className="flex items-center justify-between p-4 bg-[#0B0E11] rounded-xl border border-[#2B3139] hover:border-[#F0B90B]/30 transition-all duration-200"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg bg-${notification.color}-500/10 flex items-center justify-center`}>
                                  <Icon className={`w-5 h-5 text-${notification.color}-400`} />
                                </div>
                                <div>
                                  <h4 className="font-medium text-[#EAECEF]">{notification.label}</h4>
                                  <p className="text-xs text-[#848E9C]">{notification.description}</p>
                                </div>
                              </div>
                              <Switch
                                checked={notification.enabled}
                                onCheckedChange={() => toggleNotification(notification.id)}
                                className="data-[state=checked]:bg-[#F0B90B]"
                              />
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    )}

                    {/* Language & Region Settings */}
                    {activeTab === 'language' && (
                      <motion.div variants={itemVariants} className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-[#EAECEF] mb-4 flex items-center gap-2">
                            <Globe className="w-5 h-5 text-[#F0B90B]" />
                            Language
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {languages.map((lang) => (
                              <motion.button
                                key={lang.code}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedLanguage(lang.code)}
                                className={`p-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-2 ${
                                  selectedLanguage === lang.code
                                    ? 'border-[#F0B90B] bg-[#F0B90B]/10'
                                    : 'border-[#2B3139] hover:border-[#F0B90B]/50'
                                }`}
                              >
                                <span className="text-xl">{lang.flag}</span>
                                <div className="text-left">
                                  <p className={`text-sm font-medium ${
                                    selectedLanguage === lang.code ? 'text-[#F0B90B]' : 'text-[#EAECEF]'
                                  }`}>
                                    {lang.native}
                                  </p>
                                  <p className="text-xs text-[#848E9C]">{lang.name}</p>
                                </div>
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        <Separator className="bg-[#2B3139]" />

                        <div>
                          <h3 className="text-lg font-semibold text-[#EAECEF] mb-4 flex items-center gap-2">
                            <CircleDollarSign className="w-5 h-5 text-[#F0B90B]" />
                            Currency
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {currencies.map((currency) => (
                              <motion.button
                                key={currency.code}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedCurrency(currency.code)}
                                className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                                  selectedCurrency === currency.code
                                    ? 'border-[#F0B90B] bg-[#F0B90B]/10'
                                    : 'border-[#2B3139] hover:border-[#F0B90B]/50'
                                }`}
                              >
                                <p className={`text-sm font-medium mb-1 ${
                                  selectedCurrency === currency.code ? 'text-[#F0B90B]' : 'text-[#EAECEF]'
                                }`}>
                                  {currency.code} ({currency.symbol})
                                </p>
                                <p className="text-xs text-[#848E9C]">{currency.name}</p>
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Trading Settings */}
                    {activeTab === 'trading' && (
                      <motion.div variants={itemVariants} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[#848E9C]">Default Trade Amount</Label>
                            <div className="relative">
                              <Input
                                type="number"
                                placeholder="100"
                                defaultValue="100"
                                disabled={!isEditing}
                                className="bg-[#0B0E11] border-[#2B3139] text-[#EAECEF] pr-12"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#848E9C] text-sm">USDT</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[#848E9C]">Default Leverage</Label>
                            <Select defaultValue="10" disabled={!isEditing}>
                              <SelectTrigger className="bg-[#0B0E11] border-[#2B3139] text-[#EAECEF]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#1E2329] border-[#2B3139]">
                                {[1, 2, 3, 5, 10, 20, 25, 33, 50, 100].map((lev) => (
                                  <SelectItem key={lev} value={lev.toString()} className="text-[#EAECEF] focus:bg-[#2B3139]">
                                    {lev}x
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[#848E9C]">Slippage Tolerance</Label>
                            <div className="relative">
                              <Input
                                type="number"
                                placeholder="0.5"
                                defaultValue="0.5"
                                step="0.1"
                                disabled={!isEditing}
                                className="bg-[#0B0E11] border-[#2B3139] text-[#EAECEF] pr-8"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#848E9C] text-sm">%</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[#848E9C]">Order Type</Label>
                            <Select defaultValue="market" disabled={!isEditing}>
                              <SelectTrigger className="bg-[#0B0E11] border-[#2B3139] text-[#EAECEF]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#1E2329] border-[#2B3139]">
                                <SelectItem value="market" className="text-[#EAECEF]">Market</SelectItem>
                                <SelectItem value="limit" className="text-[#EAECEF]">Limit</SelectItem>
                                <SelectItem value="stop" className="text-[#EAECEF]">Stop-Limit</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Separator className="bg-[#2B3139]" />

                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-[#EAECEF]">Advanced Trading Preferences</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-[#EAECEF]">One-Click Trading</Label>
                                <p className="text-xs text-[#848E9C]">Execute trades with a single click</p>
                              </div>
                              <Switch defaultChecked className="data-[state=checked]:bg-[#F0B90B]" />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-[#EAECEF]">Confirmation Dialog</Label>
                                <p className="text-xs text-[#848E9C]">Show confirmation before trades</p>
                              </div>
                              <Switch defaultChecked className="data-[state=checked]:bg-[#F0B90B]" />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-[#EAECEF]">Stop-Loss Default</Label>
                                <p className="text-xs text-[#848E9C]">Automatically set stop-loss</p>
                              </div>
                              <Switch className="data-[state=checked]:bg-[#F0B90B]" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Privacy Settings */}
                    {activeTab === 'privacy' && (
                      <motion.div variants={itemVariants} className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-[#0B0E11] rounded-xl border border-[#2B3139]">
                            <div>
                              <h4 className="font-medium text-[#EAECEF]">Profile Visibility</h4>
                              <p className="text-xs text-[#848E9C]">Make your profile public</p>
                            </div>
                            <Switch defaultChecked className="data-[state=checked]:bg-[#F0B90B]" />
                          </div>

                          <div className="flex items-center justify-between p-4 bg-[#0B0E11] rounded-xl border border-[#2B3139]">
                            <div>
                              <h4 className="font-medium text-[#EAECEF]">Trading History</h4>
                              <p className="text-xs text-[#848E9C]">Show your trading history to others</p>
                            </div>
                            <Switch className="data-[state=checked]:bg-[#F0B90B]" />
                          </div>

                          <div className="flex items-center justify-between p-4 bg-[#0B0E11] rounded-xl border border-[#2B3139]">
                            <div>
                              <h4 className="font-medium text-[#EAECEF]">Analytics</h4>
                              <p className="text-xs text-[#848E9C]">Help improve by sharing usage data</p>
                            </div>
                            <Switch defaultChecked className="data-[state=checked]:bg-[#F0B90B]" />
                          </div>
                        </div>

                        <Separator className="bg-[#2B3139]" />

                        <div className="bg-[#0B0E11] rounded-xl p-4 border border-[#2B3139]">
                          <h4 className="text-sm font-medium text-[#EAECEF] mb-2">Data & Privacy</h4>
                          <p className="text-xs text-[#848E9C] mb-4">Download or delete your data</p>
                          <div className="flex gap-3">
                            <Button variant="outline" size="sm" className="border-[#2B3139] text-[#848E9C]">
                              <Download className="w-4 h-4 mr-2" />
                              Export Data
                            </Button>
                            <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Account
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* About */}
                    {activeTab === 'about' && (
                      <motion.div variants={itemVariants} className="space-y-6 text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-[#F0B90B] to-yellow-500 rounded-2xl flex items-center justify-center mx-auto">
                          <span className="text-3xl font-bold text-[#0B0E11]">K</span>
                        </div>
                        
                        <div>
                          <h2 className="text-2xl font-bold text-[#EAECEF] mb-2">Kryvex Trading</h2>
                          <p className="text-[#848E9C]">Version 2.0.0</p>
                        </div>

                        <div className="max-w-md mx-auto space-y-3">
                          <div className="flex items-center justify-between p-3 bg-[#0B0E11] rounded-xl border border-[#2B3139]">
                            <span className="text-sm text-[#848E9C]">Build Number</span>
                            <span className="text-sm font-medium text-[#EAECEF]">2024.02.17-01</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-[#0B0E11] rounded-xl border border-[#2B3139]">
                            <span className="text-sm text-[#848E9C]">Last Updated</span>
                            <span className="text-sm font-medium text-[#EAECEF]">February 17, 2024</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-[#0B0E11] rounded-xl border border-[#2B3139]">
                            <span className="text-sm text-[#848E9C]">License</span>
                            <span className="text-sm font-medium text-[#EAECEF]">MIT</span>
                          </div>
                        </div>

                        <div className="flex justify-center gap-4 pt-4">
                          <Button variant="ghost" className="text-[#848E9C] hover:text-[#EAECEF]">
                            Terms of Service
                          </Button>
                          <Button variant="ghost" className="text-[#848E9C] hover:text-[#EAECEF]">
                            Privacy Policy
                          </Button>
                        </div>

                        <p className="text-xs text-[#5E6673] pt-4">
                          © 2024 Kryvex Trading. All rights reserved.
                        </p>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

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
        input[type="number"] {
          -moz-appearance: textfield;
        }

        @media (max-width: 640px) {
          input, select, button {
            font-size: 16px !important;
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