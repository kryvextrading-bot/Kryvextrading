// SettingsNotifications.tsx - Fixed version with real data
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, BellOff, BellRing, Settings, User, Shield, Eye, EyeOff,
  Mail, MailOpen, Phone, Globe, Volume2, VolumeX,
  Search, Filter, Download, Plus, X, CheckCircle, AlertCircle,
  Calendar, Clock, Trash2, Archive, Star, Flag, ArrowUpRight,
  ArrowDownLeft, Repeat, Send, TrendingUp, TrendingDown, Gift
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService, Notification, NotificationSettings } from '@/services/notification-service';
import { toast } from 'react-hot-toast';

export default function SettingsNotifications() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    trading_alerts: true,
    price_alerts: false,
    security_alerts: true,
    marketing_emails: false,
    system_updates: true,
    sound_enabled: true,
    desktop_notifications: true,
    mobile_notifications: true
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'deposit' | 'withdrawal' | 'trade' | 'security'>('all');
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    highPriority: 0
  });

  // Load notifications and settings
  useEffect(() => {
    if (user) {
      loadData();
      subscribeToNotifications();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load notifications
      const { data: notificationsData } = await notificationService.getUserNotifications(user!.id, {
        limit: 50
      });
      
      if (notificationsData) {
        setNotifications(notificationsData);
        
        // Calculate stats
        const unread = notificationsData.filter(n => n.status === 'unread').length;
        const highPriority = notificationsData.filter(n => n.priority === 'high' || n.priority === 'critical').length;
        
        setStats({
          total: notificationsData.length,
          unread,
          highPriority
        });
      }

      // Load settings
      const { data: settingsData } = await notificationService.getNotificationSettings(user!.id);
      
      if (settingsData) {
        setSettings(settingsData);
      }
      
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    if (!user) return;
    
    return notificationService.subscribeToNotifications(user.id, (newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
      toast.success(`New: ${newNotification.title}`);
    });
  };

  const handleMarkAsRead = async (id: string) => {
    const { error } = await notificationService.markAsRead(id);
    if (!error) {
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id
            ? { ...notification, status: 'read' as const, read_at: new Date().toISOString() }
            : notification
        )
      );
      toast.success('Notification marked as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    const { error } = await notificationService.markAllAsRead(user.id);
    if (!error) {
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, status: 'read' as const }))
      );
      toast.success('All notifications marked as read');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    const { error } = await notificationService.deleteNotification(id);
    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification deleted');
    }
  };

  const handleClearAll = async () => {
    if (!user) return;
    
    const { error } = await notificationService.clearAllNotifications(user.id);
    if (!error) {
      setNotifications([]);
      toast.success('All notifications cleared');
    }
  };

  const handleSettingToggle = async (key: keyof NotificationSettings) => {
    if (!user) return;
    
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    
    const { error } = await notificationService.updateNotificationSettings(user.id, {
      [key]: newSettings[key]
    });
    
    if (error) {
      toast.error('Failed to update setting');
      setSettings(settings); // Revert on error
    } else {
      toast.success('Setting updated');
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    const { type, metadata } = notification;
    
    // Use custom icon from metadata if available
    if (metadata?.icon) {
      return <span className="text-xl">{metadata.icon}</span>;
    }
    
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="text-green-500 w-5 h-5" />;
      case 'withdrawal': return <ArrowUpRight className="text-red-500 w-5 h-5" />;
      case 'convert': return <Repeat className="text-blue-500 w-5 h-5" />;
      case 'send': return <Send className="text-orange-500 w-5 h-5" />;
      case 'transfer': return <Repeat className="text-purple-500 w-5 h-5" />;
      case 'trade_win': return <TrendingUp className="text-green-500 w-5 h-5" />;
      case 'trade_loss': return <TrendingDown className="text-red-500 w-5 h-5" />;
      case 'system': return <BellRing className="text-blue-500 w-5 h-5" />;
      case 'security': return <Shield className="text-red-500 w-5 h-5" />;
      case 'trading': return <Volume2 className="text-green-500 w-5 h-5" />;
      case 'price': return <Volume2 className="text-purple-500 w-5 h-5" />;
      case 'account': return <User className="text-gray-500 w-5 h-5" />;
      case 'marketing': return <Mail className="text-yellow-500 w-5 h-5" />;
      case 'referral': return <Gift className="text-orange-500 w-5 h-5" />;
      default: return <Bell className="text-gray-500 w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'unread') return notification.status === 'unread' && matchesSearch;
    if (filterType === 'deposit') return notification.type === 'deposit' && matchesSearch;
    if (filterType === 'withdrawal') return notification.type === 'withdrawal' && matchesSearch;
    if (filterType === 'trade') return ['trade_win', 'trade_loss'].includes(notification.type) && matchesSearch;
    if (filterType === 'security') return notification.type === 'security' && matchesSearch;
    
    return false;
  });

  const NotificationItem = ({ notification }: { notification: Notification }) => {
    const isUnread = notification.status === 'unread';
    
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className={`flex items-start gap-4 p-4 border-b border-[#2B3139] hover:bg-[#2B3139]/50 transition-colors ${
          isUnread ? 'bg-[#FCD535]/10' : 'bg-[#181A20]'
        }`}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUnread ? 'bg-[#FCD535] text-white' : 'bg-[#2B3139] text-[#848E9C]'
        }`}>
          {getNotificationIcon(notification)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-semibold ${
                isUnread ? 'text-[#FCD535]' : 'text-white'
              }`}>
                {notification.title}
              </span>
              {isUnread && (
                <div className="w-2 h-2 bg-[#FCD535] rounded-full animate-pulse" />
              )}
              <Badge className={`text-xs ${
                notification.priority === 'critical' ? 'bg-red-500 text-white' :
                notification.priority === 'high' ? 'bg-orange-500 text-white' :
                notification.priority === 'medium' ? 'bg-yellow-500 text-white' :
                'bg-blue-500 text-white'
              }`}>
                {notification.priority}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-[#848E9C]">
              <Clock className="w-3 h-3" />
              {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString()}
            </div>
          </div>
          
          <p className="text-sm text-[#848E9C] mb-2">
            {notification.message}
          </p>
          
          {/* Transaction details if available */}
          {notification.metadata?.amount && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-[#848E9C]">Amount:</span>
              <span className={`font-medium ${
                notification.type.includes('win') || notification.type === 'deposit' 
                  ? 'text-green-500' 
                  : notification.type.includes('loss') || notification.type === 'withdrawal'
                  ? 'text-red-500'
                  : 'text-white'
              }`}>
                {notification.metadata.amount} {notification.metadata.currency || 'USD'}
              </span>
            </div>
          )}
          
          {notification.action_url && (
            <Button
              size="sm"
              variant="link"
              onClick={() => window.open(notification.action_url, '_blank')}
              className="mt-2 text-[#FCD535] hover:text-[#FCD535]/80 p-0 h-auto"
            >
              {notification.action_text || 'View Details'} →
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {isUnread && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMarkAsRead(notification.id)}
              className="text-[#848E9C] hover:text-[#FCD535]"
              title="Mark as read"
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteNotification(notification.id)}
            className="text-[#848E9C] hover:text-[#F6465D]"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0E11] to-[#1C1F26]">
      {/* Header */}
      <div className="bg-[#181A20] border-b border-[#2B3139] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => window.history.back()} 
                className="p-2 hover:bg-[#2B3139] rounded-lg transition-colors"
                title="Go back"
              >
                <Settings className="w-5 h-5 text-[#848E9C]" />
              </button>
              <h1 className="text-2xl font-bold text-white">Notifications & Settings</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-[#848E9C] hover:text-[#FCD535] disabled:text-[#474D57]"
                disabled={stats.unread === 0}
              >
                <MailOpen className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-[#848E9C] hover:text-[#F6465D]"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notification Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#181A20] rounded-xl p-4 shadow-sm border border-[#2B3139]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#848E9C]">Total Notifications</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <Bell className="w-8 h-8 text-[#FCD535] opacity-50" />
            </div>
          </div>
          
          <div className="bg-[#181A20] rounded-xl p-4 shadow-sm border border-[#2B3139]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#848E9C]">Unread</p>
                <p className="text-2xl font-bold text-[#FCD535]">{stats.unread}</p>
              </div>
              <BellRing className="w-8 h-8 text-[#FCD535] opacity-50" />
            </div>
          </div>
          
          <div className="bg-[#181A20] rounded-xl p-4 shadow-sm border border-[#2B3139]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#848E9C]">High Priority</p>
                <p className="text-2xl font-bold text-[#F6465D]">{stats.highPriority}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-[#F6465D] opacity-50" />
            </div>
          </div>
          
          <div className="bg-[#181A20] rounded-xl p-4 shadow-sm border border-[#2B3139]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#848E9C]">Last 24h</p>
                <p className="text-2xl font-bold text-white">
                  {notifications.filter(n => 
                    new Date(n.created_at) > new Date(Date.now() - 86400000)
                  ).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-[#848E9C] opacity-50" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Notifications Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="bg-[#181A20] border-[#2B3139] shadow-lg">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <h2 className="text-xl font-bold text-white">Notifications</h2>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#848E9C]" />
                      <Input
                        placeholder="Search notifications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-[#2B3139] border-[#2B3139] text-white placeholder-[#848E9C]"
                      />
                    </div>
                    <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                      <SelectTrigger className="w-full sm:w-40 bg-[#2B3139] border-[#2B3139] text-white">
                        <SelectValue placeholder="Filter by" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2B3139] border-[#2B3139]">
                        <SelectItem value="all" className="text-white hover:bg-[#374151]">All Types</SelectItem>
                        <SelectItem value="unread" className="text-white hover:bg-[#374151]">Unread Only</SelectItem>
                        <SelectItem value="deposit" className="text-white hover:bg-[#374151]">Deposits</SelectItem>
                        <SelectItem value="withdrawal" className="text-white hover:bg-[#374151]">Withdrawals</SelectItem>
                        <SelectItem value="trade" className="text-white hover:bg-[#374151]">Trades</SelectItem>
                        <SelectItem value="security" className="text-white hover:bg-[#374151]">Security</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="space-y-1 max-h-[600px] overflow-y-auto">
                  {loading ? (
                    <>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="p-4 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex gap-4">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-3 w-1/2" />
                              <Skeleton className="h-3 w-1/4" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4 opacity-50">📭</div>
                      <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">No notifications</div>
                      <p className="text-gray-400 dark:text-gray-500">You're all caught up!</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {filteredNotifications.map((notification) => (
                        <NotificationItem key={notification.id} notification={notification} />
                      ))}
                    </AnimatePresence>
                  )}
                </div>

                {filteredNotifications.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#2B3139]">
                    <p className="text-sm text-[#848E9C] text-center">
                      Showing {filteredNotifications.length} of {stats.total} notifications
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Settings Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-[#181A20] border-[#2B3139] shadow-lg">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Notification Settings</h3>
                <p className="text-sm text-[#848E9C] mb-6">
                  Customize how you receive notifications
                </p>
                
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-white">Delivery Methods</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="email_notifications" className="text-white">Email</Label>
                          <p className="text-xs text-[#848E9C]">Receive notifications via email</p>
                        </div>
                        <Switch
                          id="email_notifications"
                          checked={settings.email_notifications}
                          onCheckedChange={() => handleSettingToggle('email_notifications')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="push_notifications" className="text-white">Push</Label>
                          <p className="text-xs text-[#848E9C]">Push notifications on your devices</p>
                        </div>
                        <Switch
                          id="push_notifications"
                          checked={settings.push_notifications}
                          onCheckedChange={() => handleSettingToggle('push_notifications')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="desktop_notifications" className="text-white">Desktop</Label>
                          <p className="text-xs text-[#848E9C]">Show desktop notifications</p>
                        </div>
                        <Switch
                          id="desktop_notifications"
                          checked={settings.desktop_notifications}
                          onCheckedChange={() => handleSettingToggle('desktop_notifications')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="mobile_notifications" className="text-white">Mobile</Label>
                          <p className="text-xs text-[#848E9C]">Show mobile notifications</p>
                        </div>
                        <Switch
                          id="mobile_notifications"
                          checked={settings.mobile_notifications}
                          onCheckedChange={() => handleSettingToggle('mobile_notifications')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="sound_enabled" className="text-white">Sound</Label>
                          <p className="text-xs text-[#848E9C]">Play sound for notifications</p>
                        </div>
                        <Switch
                          id="sound_enabled"
                          checked={settings.sound_enabled}
                          onCheckedChange={() => handleSettingToggle('sound_enabled')}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#2B3139] pt-6">
                    <h4 className="text-sm font-medium text-white mb-4">Notification Types</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="trading_alerts" className="text-white">Trading Alerts</Label>
                          <p className="text-xs text-[#848E9C]">Trade confirmations, wins/losses</p>
                        </div>
                        <Switch
                          id="trading_alerts"
                          checked={settings.trading_alerts}
                          onCheckedChange={() => handleSettingToggle('trading_alerts')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="price_alerts" className="text-white">Price Alerts</Label>
                          <p className="text-xs text-[#848E9C]">Price movement notifications</p>
                        </div>
                        <Switch
                          id="price_alerts"
                          checked={settings.price_alerts}
                          onCheckedChange={() => handleSettingToggle('price_alerts')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="security_alerts" className="text-white">Security</Label>
                          <p className="text-xs text-[#848E9C]">Login alerts, security events</p>
                        </div>
                        <Switch
                          id="security_alerts"
                          checked={settings.security_alerts}
                          onCheckedChange={() => handleSettingToggle('security_alerts')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="system_updates" className="text-white">System Updates</Label>
                          <p className="text-xs text-[#848E9C]">Platform maintenance, updates</p>
                        </div>
                        <Switch
                          id="system_updates"
                          checked={settings.system_updates}
                          onCheckedChange={() => handleSettingToggle('system_updates')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="marketing_emails" className="text-white">Marketing</Label>
                          <p className="text-xs text-[#848E9C]">Promotions, offers, newsletters</p>
                        </div>
                        <Switch
                          id="marketing_emails"
                          checked={settings.marketing_emails}
                          onCheckedChange={() => handleSettingToggle('marketing_emails')}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#FCD535]/10 p-4 rounded-lg border border-[#FCD535]/20">
                    <div className="flex items-start gap-3">
                      <Bell className="w-5 h-5 text-[#FCD535] flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-sm font-medium text-[#FCD535]">Real-time Updates</h5>
                        <p className="text-xs text-[#FCD535]/80 mt-1">
                          You'll receive notifications instantly for deposits, withdrawals, trades, and security events.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
