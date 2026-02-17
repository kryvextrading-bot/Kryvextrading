import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  User, 
  Bell, 
  Globe, 
  Shield, 
  Palette,
  Volume2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

export default function Settings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');

  const settingsTabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'trading', label: 'Trading', icon: Palette },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'about', label: 'About', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-6">{t('Settings')}</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Settings Navigation */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      {t('Settings')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <nav className="flex flex-col space-y-1">
                      {settingsTabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                              activeTab === tab.id
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-accent hover:text-accent-foreground'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="font-medium">{t(tab.label)}</span>
                          </button>
                        );
                      })}
                    </nav>
                  </CardContent>
                </Card>

              {/* Settings Content */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {settingsTabs.find(tab => tab.id === activeTab)?.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeTab === 'general' && (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <Label htmlFor="theme">{t('Theme')}</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder={t('Select theme')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="light">{t('Light')}</SelectItem>
                              <SelectItem value="dark">{t('Dark')}</SelectItem>
                              <SelectItem value="system">{t('System')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-4">
                          <Label htmlFor="language">{t('Language')}</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder={t('Select language')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="es">Español</SelectItem>
                              <SelectItem value="fr">Français</SelectItem>
                              <SelectItem value="zh">中文</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-4">
                          <Label htmlFor="notifications">{t('Email Notifications')}</Label>
                          <div className="flex items-center space-x-2">
                            <Switch id="notifications" />
                            <span className="text-sm text-muted-foreground">
                              {t('Receive email updates')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'account' && (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <Label htmlFor="email">{t('Email')}</Label>
                          <Input
                            id="email"
                            type="email"
                            defaultValue={user?.email || ''}
                            className="bg-muted"
                            disabled
                          />
                        </div>
                        
                        <div className="space-y-4">
                          <Label htmlFor="phone">{t('Phone')}</Label>
                          <Input
                            id="phone"
                            type="tel"
                            defaultValue={user?.phone || ''}
                            className="bg-muted"
                            disabled
                          />
                        </div>

                        <div className="space-y-4">
                          <Label htmlFor="username">{t('Username')}</Label>
                          <Input
                            id="username"
                            defaultValue={user?.username || ''}
                            className="bg-muted"
                            disabled
                          />
                        </div>
                      </div>
                    )}

                    {activeTab === 'security' && (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <Label htmlFor="current-password">{t('Current Password')}</Label>
                          <Input
                            id="current-password"
                            type="password"
                            placeholder={t('Enter current password')}
                            className="bg-muted"
                          />
                        </div>
                        
                        <div className="space-y-4">
                          <Label htmlFor="new-password">{t('New Password')}</Label>
                          <Input
                            id="new-password"
                            type="password"
                            placeholder={t('Enter new password')}
                            className="bg-muted"
                          />
                        </div>

                        <div className="flex justify-end pt-4">
                          <Button>{t('Update Password')}</Button>
                        </div>
                      </div>
                    )}

                    {activeTab === 'notifications' && (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="email-notifications">{t('Email Notifications')}</Label>
                            <Switch id="email-notifications" defaultChecked />
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="push-notifications">{t('Push Notifications')}</Label>
                            <Switch id="push-notifications" defaultChecked />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="trading-alerts">{t('Trading Alerts')}</Label>
                            <Switch id="trading-alerts" defaultChecked />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="price-alerts">{t('Price Alerts')}</Label>
                            <Switch id="price-alerts" defaultChecked />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'language' && (
                      <div className="space-y-6">
                        <p className="text-muted-foreground mb-4">
                          {t('Language settings are available in the Language tab.')}
                        </p>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => window.location.href = '/settings/language'}
                        >
                          {t('Go to Language Settings')}
                        </Button>
                      </div>
                    )}

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
        </div>
      </div>
    </div>
  );
}
