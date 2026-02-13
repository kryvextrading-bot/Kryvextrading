import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FuturesTradeFormProps {
  symbol: string;
  side: 'buy' | 'sell';
  positionType: 'open' | 'close';
  orderType: 'market' | 'limit' | 'stop';
  price: string;
  amount: string;
  percent: number;
  leverage: number;
  tpSl: boolean;
  onSideChange: (side: 'buy' | 'sell') => void;
  onPositionTypeChange: (type: 'open' | 'close') => void;
  onOrderTypeChange: (type: 'market' | 'limit' | 'stop') => void;
  onPriceChange: (v: string) => void;
  onAmountChange: (v: string) => void;
  onPercentChange: (v: number) => void;
  onLeverageChange: (v: number) => void;
  onTpSlChange: (v: boolean) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const LEVERAGES = [1, 2, 5, 10, 20, 50, 100];

export const FuturesTradeForm: React.FC<FuturesTradeFormProps> = ({
  symbol, side, positionType, orderType, price, amount, percent, leverage, tpSl,
  onSideChange, onPositionTypeChange, onOrderTypeChange, onPriceChange, onAmountChange, onPercentChange, onLeverageChange, onTpSlChange, onSubmit, disabled
}) => {
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow p-6 flex flex-col gap-4">
      <div className="flex gap-2 mb-2">
        <Select value={leverage.toString()} onValueChange={v => onLeverageChange(Number(v))}>
          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
          <SelectContent>
            {LEVERAGES.map(l => <SelectItem key={l} value={l.toString()}>{l}x</SelectItem>)}
          </SelectContent>
        </Select>
        <Tabs value={positionType} onValueChange={v => onPositionTypeChange(v as 'open' | 'close')}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="close">Close</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <Tabs value={side} onValueChange={v => onSideChange(v as 'buy' | 'sell')} className="mb-2">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="buy">Buy</TabsTrigger>
          <TabsTrigger value="sell">Sell</TabsTrigger>
        </TabsList>
      </Tabs>
      <Tabs value={orderType} onValueChange={v => onOrderTypeChange(v as 'market' | 'limit' | 'stop')} className="mb-2">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="limit">Limit</TabsTrigger>
          <TabsTrigger value="stop">Stop</TabsTrigger>
        </TabsList>
      </Tabs>
      {orderType !== 'market' && (
        <Input type="number" value={price} onChange={e => onPriceChange(e.target.value)} placeholder="Price" className="mb-2" />
      )}
      <Input type="number" value={amount} onChange={e => onAmountChange(e.target.value)} placeholder="Amount" className="mb-2" />
      {/* Slider for percent */}
      <div className="flex items-center gap-2 mb-2">
        <input type="range" min={0} max={100} value={percent} onChange={e => onPercentChange(Number(e.target.value))} className="w-full" />
        <span className="text-xs w-10 text-right">{percent}%</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <input type="checkbox" checked={tpSl} onChange={e => onTpSlChange(e.target.checked)} id="tp-sl" />
        <label htmlFor="tp-sl" className="text-xs">Take Profit / Stop Loss</label>
      </div>
      <Button className="w-full" onClick={onSubmit} disabled={disabled}>
        {side === 'buy' ? 'Buy' : 'Sell'} {symbol}
      </Button>
    </div>
  );
};
export default FuturesTradeForm; 