import { ArrowUpDown, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { useCallback } from 'react';

interface BalanceCardProps {
  totalBalance: number;
  currency: string;
  usdValue: number;
  changePercent: number;
}

export function BalanceCard({ totalBalance, currency, usdValue, changePercent }: BalanceCardProps) {
  const { setCurrency } = useUserSettings();
  const currencies = ['USD', 'USDT', 'BTC'];
  const handleSwitchCurrency = useCallback(() => {
    const idx = currencies.indexOf(currency);
    const next = currencies[(idx + 1) % currencies.length];
    setCurrency(next);
  }, [currency, setCurrency]);
  return (
    <Card className="bg-gradient-primary p-6 text-primary-foreground shadow-glow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold">{currency}</span>
          </div>
          <span className="text-sm opacity-90">{changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%</span>
        </div>
        <button onClick={handleSwitchCurrency} title="Switch currency" className="focus:outline-none">
          <ArrowUpDown className="h-5 w-5 opacity-80" />
        </button>
      </div>
      
      <div className="space-y-2">
        <div>
          <p className="text-sm opacity-90">Total Balance</p>
          <p className="text-2xl font-bold">{currency} {totalBalance.toFixed(2)}</p>
        </div>
        
        <div className="flex items-center space-x-2 pt-2">
          <ArrowUpDown className="h-4 w-4 opacity-70" />
          <span className="text-lg font-semibold">USD {usdValue.toFixed(2)}</span>
        </div>
      </div>
    </Card>
  );
}