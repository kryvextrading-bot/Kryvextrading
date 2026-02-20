import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Users, Settings, Shield, AlertTriangle } from 'lucide-react';

interface User {
  id: string;
  email: string;
}

interface TradeOutcome {
  id: string;
  user_id: string;
  enabled: boolean;
  outcome_type: 'win' | 'loss' | 'default';
  spot_enabled: boolean;
  futures_enabled: boolean;
  options_enabled: boolean;
  arbitrage_enabled: boolean;
}

interface TradeWindow {
  id?: string;
  user_id: string;
  outcome_type: 'win' | 'loss' | 'default';
  start_time: Date;
  end_time: Date;
  spot_enabled: boolean;
  futures_enabled: boolean;
  options_enabled: boolean;
  arbitrage_enabled: boolean;
  reason: string;
  active: boolean;
}

interface SystemSettings {
  id: string;
  default_outcome: 'win' | 'loss' | 'random';
  win_probability: number;
  spot_default: 'win' | 'loss' | 'random';
  futures_default: 'win' | 'loss' | 'random';
  options_default: 'win' | 'loss' | 'random';
  arbitrage_default: 'win' | 'loss' | 'random';
}

export default function TradingControlPanel() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [userOutcome, setUserOutcome] = useState<TradeOutcome | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [windows, setWindows] = useState<TradeWindow[]>([]);
  const [newWindow, setNewWindow] = useState<Partial<TradeWindow>>({
    outcome_type: 'win',
    start_time: new Date(),
    end_time: new Date(Date.now() + 3600000),
    spot_enabled: true,
    futures_enabled: true,
    options_enabled: true,
    arbitrage_enabled: true,
    reason: '',
    active: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    loadSystemSettings();
    loadActiveWindows();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadUserOutcome(selectedUser);
    }
  }, [selectedUser]);

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(100);
    if (data) setUsers(data);
  };

  const loadUserOutcome = async (userId: string) => {
    const { data } = await supabase
      .from('trade_outcomes')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    setUserOutcome(data || {
      user_id: userId,
      enabled: false,
      outcome_type: 'default',
      spot_enabled: true,
      futures_enabled: true,
      options_enabled: true,
      arbitrage_enabled: true
    });
  };

  const loadSystemSettings = async () => {
    const { data } = await supabase
      .from('trading_settings')
      .select('*')
      .limit(1)
      .maybeSingle();
    setSystemSettings(data);
  };

  const loadActiveWindows = async () => {
    const { data } = await supabase
      .from('trade_windows')
      .select('*')
      .gte('end_time', new Date().toISOString())
      .order('start_time', { ascending: true });
    setWindows(data || []);
  };

  const saveUserOutcome = async () => {
    if (!userOutcome) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('trade_outcomes')
        .upsert(userOutcome);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User trading settings updated',
      });

      // Log audit
      await supabase
        .from('trading_control_audit')
        .insert({
          user_id: selectedUser,
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          action: 'UPDATE_USER_OUTCOME',
          details: userOutcome
        });

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSystemSettings = async () => {
    if (!systemSettings) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('trading_settings')
        .upsert({
          ...systemSettings,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'System settings updated',
      });

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update system settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createTradeWindow = async () => {
    if (!newWindow.user_id) {
      toast({
        title: 'Error',
        description: 'Please select a user',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('trade_windows')
        .insert({
          ...newWindow,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Trading window created',
      });

      loadActiveWindows();
      setNewWindow({
        outcome_type: 'win',
        start_time: new Date(),
        end_time: new Date(Date.now() + 3600000),
        spot_enabled: true,
        futures_enabled: true,
        options_enabled: true,
        arbitrage_enabled: true,
        reason: '',
        active: true
      });

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create window',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const deactivateWindow = async (windowId: string) => {
    try {
      await supabase
        .from('trade_windows')
        .update({ active: false })
        .eq('id', windowId);

      loadActiveWindows();
      toast({
        title: 'Success',
        description: 'Window deactivated',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to deactivate window',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Shield className="w-6 h-6" />
        Trading Control Panel
      </h1>

      {/* System Settings */}
      <Card className="p-6 bg-[#1E2329] border-[#2B3139]">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          System Default Settings
        </h2>

        {systemSettings && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Default Outcome</Label>
              <Select
                value={systemSettings.default_outcome}
                onValueChange={(value: any) => setSystemSettings({
                  ...systemSettings,
                  default_outcome: value
                })}
              >
                <SelectTrigger className="bg-[#181A20] border-[#2B3139]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="win">Always Win</SelectItem>
                  <SelectItem value="loss">Always Loss</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {systemSettings.default_outcome === 'random' && (
              <div>
                <Label>Win Probability (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={systemSettings.win_probability}
                  onChange={(e) => setSystemSettings({
                    ...systemSettings,
                    win_probability: parseInt(e.target.value)
                  })}
                  className="bg-[#181A20] border-[#2B3139]"
                />
              </div>
            )}

            <div>
              <Label>Spot Trading Default</Label>
              <Select
                value={systemSettings.spot_default}
                onValueChange={(value: any) => setSystemSettings({
                  ...systemSettings,
                  spot_default: value
                })}
              >
                <SelectTrigger className="bg-[#181A20] border-[#2B3139]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="win">Win</SelectItem>
                  <SelectItem value="loss">Loss</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Futures Trading Default</Label>
              <Select
                value={systemSettings.futures_default}
                onValueChange={(value: any) => setSystemSettings({
                  ...systemSettings,
                  futures_default: value
                })}
              >
                <SelectTrigger className="bg-[#181A20] border-[#2B3139]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="win">Win</SelectItem>
                  <SelectItem value="loss">Loss</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Options Trading Default</Label>
              <Select
                value={systemSettings.options_default}
                onValueChange={(value: any) => setSystemSettings({
                  ...systemSettings,
                  options_default: value
                })}
              >
                <SelectTrigger className="bg-[#181A20] border-[#2B3139]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="win">Win</SelectItem>
                  <SelectItem value="loss">Loss</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Arbitrage Default</Label>
              <Select
                value={systemSettings.arbitrage_default}
                onValueChange={(value: any) => setSystemSettings({
                  ...systemSettings,
                  arbitrage_default: value
                })}
              >
                <SelectTrigger className="bg-[#181A20] border-[#2B3139]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="win">Win</SelectItem>
                  <SelectItem value="loss">Loss</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Button
                onClick={saveSystemSettings}
                disabled={loading}
                className="bg-[#F0B90B] text-[#181A20] hover:bg-yellow-400"
              >
                Save System Settings
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* User Settings */}
      <Card className="p-6 bg-[#1E2329] border-[#2B3139]">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          User-Specific Settings
        </h2>

        <div className="space-y-4">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="bg-[#181A20] border-[#2B3139]">
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedUser && userOutcome && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Switch
                  checked={userOutcome.enabled}
                  onCheckedChange={(checked) => setUserOutcome({
                    ...userOutcome,
                    enabled: checked
                  })}
                />
                <Label>Override System Settings</Label>
              </div>

              {userOutcome.enabled && (
                <>
                  <div>
                    <Label>Outcome Type</Label>
                    <Select
                      value={userOutcome.outcome_type}
                      onValueChange={(value: any) => setUserOutcome({
                        ...userOutcome,
                        outcome_type: value
                      })}
                    >
                      <SelectTrigger className="bg-[#181A20] border-[#2B3139]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="win">Force Win</SelectItem>
                        <SelectItem value="loss">Force Loss</SelectItem>
                        <SelectItem value="default">Use System Default</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={userOutcome.spot_enabled}
                        onCheckedChange={(checked) => setUserOutcome({
                          ...userOutcome,
                          spot_enabled: checked
                        })}
                      />
                      <Label>Spot Trading</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={userOutcome.futures_enabled}
                        onCheckedChange={(checked) => setUserOutcome({
                          ...userOutcome,
                          futures_enabled: checked
                        })}
                      />
                      <Label>Futures Trading</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={userOutcome.options_enabled}
                        onCheckedChange={(checked) => setUserOutcome({
                          ...userOutcome,
                          options_enabled: checked
                        })}
                      />
                      <Label>Options Trading</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={userOutcome.arbitrage_enabled}
                        onCheckedChange={(checked) => setUserOutcome({
                          ...userOutcome,
                          arbitrage_enabled: checked
                        })}
                      />
                      <Label>Arbitrage</Label>
                    </div>
                  </div>
                </>
              )}

              <Button
                onClick={saveUserOutcome}
                disabled={loading}
                className="bg-[#F0B90B] text-[#181A20] hover:bg-yellow-400"
              >
                Save User Settings
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Trading Windows */}
      <Card className="p-6 bg-[#1E2329] border-[#2B3139]">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Scheduled Trading Windows
        </h2>

        {/* Create New Window */}
        <div className="space-y-4 mb-6 p-4 bg-[#181A20] rounded-lg">
          <h3 className="font-medium">Create New Window</h3>
          
          <Select
            value={newWindow.user_id}
            onValueChange={(value) => setNewWindow({ ...newWindow, user_id: value })}
          >
            <SelectTrigger className="bg-[#1E2329] border-[#2B3139]">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={newWindow.outcome_type}
            onValueChange={(value: any) => setNewWindow({ ...newWindow, outcome_type: value })}
          >
            <SelectTrigger className="bg-[#1E2329] border-[#2B3139]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="win">Win Window</SelectItem>
              <SelectItem value="loss">Loss Window</SelectItem>
              <SelectItem value="default">System Default</SelectItem>
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full bg-[#1E2329] border-[#2B3139] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newWindow.start_time ? format(newWindow.start_time, 'PPp') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newWindow.start_time}
                    onSelect={(date) => date && setNewWindow({ ...newWindow, start_time: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>End Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full bg-[#1E2329] border-[#2B3139] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newWindow.end_time ? format(newWindow.end_time, 'PPp') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newWindow.end_time}
                    onSelect={(date) => date && setNewWindow({ ...newWindow, end_time: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label>Reason (Optional)</Label>
            <Input
              value={newWindow.reason}
              onChange={(e) => setNewWindow({ ...newWindow, reason: e.target.value })}
              placeholder="Why this window is being created"
              className="bg-[#1E2329] border-[#2B3139]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={newWindow.spot_enabled}
                onCheckedChange={(checked) => setNewWindow({ ...newWindow, spot_enabled: checked })}
              />
              <Label>Spot</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newWindow.futures_enabled}
                onCheckedChange={(checked) => setNewWindow({ ...newWindow, futures_enabled: checked })}
              />
              <Label>Futures</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newWindow.options_enabled}
                onCheckedChange={(checked) => setNewWindow({ ...newWindow, options_enabled: checked })}
              />
              <Label>Options</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newWindow.arbitrage_enabled}
                onCheckedChange={(checked) => setNewWindow({ ...newWindow, arbitrage_enabled: checked })}
              />
              <Label>Arbitrage</Label>
            </div>
          </div>

          <Button
            onClick={createTradeWindow}
            disabled={loading || !newWindow.user_id}
            className="w-full bg-[#F0B90B] text-[#181A20] hover:bg-yellow-400"
          >
            Create Window
          </Button>
        </div>

        {/* Active Windows */}
        <div className="space-y-2">
          <h3 className="font-medium">Active Windows</h3>
          {windows.length === 0 ? (
            <p className="text-[#848E9C] text-sm">No active windows</p>
          ) : (
            windows.map(window => (
              <div key={window.id} className="p-3 bg-[#181A20] rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {window.outcome_type.toUpperCase()} - {users.find(u => u.id === window.user_id)?.email}
                  </div>
                  <div className="text-xs text-[#848E9C]">
                    {format(new Date(window.start_time), 'PPp')} → {format(new Date(window.end_time), 'PPp')}
                  </div>
                  {window.reason && (
                    <div className="text-xs text-[#848E9C] mt-1">Reason: {window.reason}</div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.id && deactivateWindow(window.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                >
                  Deactivate
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Warning Banner */}
      <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-400">Important Note</p>
            <p className="text-sm text-yellow-300">
              Changes to trading controls take effect immediately. All trades will be evaluated against these settings.
              Make sure to test thoroughly before applying to production users.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
