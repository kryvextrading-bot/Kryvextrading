import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface OptionsTradeFormProps {
  symbol: string;
  direction: 'up' | 'down';
  positionTime: string;
  orderType: 'market' | 'limit';
  amount: string;
  asset: string;
  percent: number;
  onDirectionChange: (d: 'up' | 'down') => void;
  onPositionTimeChange: (v: string) => void;
  onOrderTypeChange: (v: 'market' | 'limit') => void;
  onAmountChange: (v: string) => void;
  onAssetChange: (v: string) => void;
  onPercentChange: (v: number) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const POSITION_TIMES = ['60s', '120s', '300s'];
const ASSETS = ['USDT', 'BTC', 'ETH'];

export const OptionsTradeForm: React.FC<OptionsTradeFormProps> = ({
  symbol, direction, positionTime, orderType, amount, asset, percent,
  onDirectionChange, onPositionTimeChange, onOrderTypeChange, onAmountChange, onAssetChange, onPercentChange, onSubmit, disabled
}) => {
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow p-6 flex flex-col gap-4">
      <Tabs value={direction} onValueChange={v => onDirectionChange(v as 'up' | 'down')} className="mb-2">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="up">Up</TabsTrigger>
          <TabsTrigger value="down">Down</TabsTrigger>
        </TabsList>
      </Tabs>
      <Select value={positionTime} onValueChange={onPositionTimeChange}>
        <SelectTrigger className="w-full mb-2"><SelectValue placeholder="Select Time" /></SelectTrigger>
        <SelectContent>
          {POSITION_TIMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
        </SelectContent>
      </Select>
      <Tabs value={orderType} onValueChange={v => onOrderTypeChange(v as 'market' | 'limit')} className="mb-2">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="limit">Limit</TabsTrigger>
        </TabsList>
      </Tabs>
      <Input type="number" value={amount} onChange={e => onAmountChange(e.target.value)} placeholder="Amount" className="mb-2" />
      <Select value={asset} onValueChange={onAssetChange}>
        <SelectTrigger className="w-full mb-2"><SelectValue placeholder="Select Asset" /></SelectTrigger>
        <SelectContent>
          {ASSETS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
        </SelectContent>
      </Select>
      {/* Slider for percent */}
      <div className="flex items-center gap-2 mb-2">
        <input type="range" min={0} max={100} value={percent} onChange={e => onPercentChange(Number(e.target.value))} className="w-full" />
        <span className="text-xs w-10 text-right">{percent}%</span>
      </div>
      <Button className="w-full" onClick={onSubmit} disabled={disabled}>
        Buy
      </Button>
    </div>
  );
};
export default OptionsTradeForm; 