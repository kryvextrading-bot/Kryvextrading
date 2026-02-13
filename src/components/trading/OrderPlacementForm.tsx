import React, { useState } from 'react';
import { useOrderContext, OrderType, OrderSide } from '@/contexts/OrderContext';
import { useMarketData } from '@/contexts/MarketDataContext';
import { Button } from '@/components/ui/button';

const SUPPORTED_ASSETS = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOGE', 'MATIC'];

const defaultOrder = {
  asset: 'BTC',
  side: 'Buy' as OrderSide,
  type: 'Market' as OrderType,
  price: '',
  amount: '',
};

const OrderPlacementForm: React.FC = () => {
  const { placeOrder } = useOrderContext();
  const { prices } = useMarketData();
  const [form, setForm] = useState(defaultOrder);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const order = {
      asset: form.asset,
      side: form.side,
      type: form.type,
      price: form.type === 'Market' ? null : Number(form.price),
      amount: Number(form.amount),
    };
    placeOrder(order);
    setForm(defaultOrder);
    setSubmitting(false);
  };

  const livePrice = prices[form.asset] ?? 0;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto bg-[#23262F] rounded-xl shadow p-6 flex flex-col gap-4">
      <div className="flex gap-2">
        <label className="font-semibold">Asset:</label>
        <select value={form.asset} onChange={e => handleChange('asset', e.target.value)} className="border rounded px-2 py-1 bg-[#23262F] text-white">
          {SUPPORTED_ASSETS.map((asset) => (
            <option key={asset} value={asset}>{asset}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <label className="font-semibold">Side:</label>
        <select value={form.side} onChange={e => handleChange('side', e.target.value)} className="border rounded px-2 py-1 bg-[#23262F] text-white">
          <option value="Buy">Buy</option>
          <option value="Sell">Sell</option>
        </select>
      </div>
      <div className="flex gap-2">
        <label className="font-semibold">Type:</label>
        <select value={form.type} onChange={e => handleChange('type', e.target.value)} className="border rounded px-2 py-1 bg-[#23262F] text-white">
          <option value="Market">Market</option>
          <option value="Limit">Limit</option>
          <option value="Stop">Stop</option>
        </select>
      </div>
      {form.type !== 'Market' && (
        <input
          type="number"
          value={form.price}
          onChange={e => handleChange('price', e.target.value)}
          placeholder="Price"
          className="border rounded px-2 py-1 bg-[#23262F] text-white placeholder-[#bbb]"
          min="0"
          step="any"
          required
        />
      )}
      <input
        type="number"
        value={form.amount}
        onChange={e => handleChange('amount', e.target.value)}
        placeholder="Amount"
        className="border rounded px-2 py-1 bg-[#23262F] text-white placeholder-[#bbb]"
        min="0"
        step="any"
        required
      />
      <div className="text-xs text-gray-500">
        Live Price: <span className="font-semibold">${livePrice ? livePrice.toLocaleString(undefined, { maximumFractionDigits: 2 }) : 'N/A'}</span>
      </div>
      <Button type="submit" className="w-full" disabled={submitting || !form.amount || (form.type !== 'Market' && !form.price)}>
        Place Order
      </Button>
    </form>
  );
};

export default OrderPlacementForm; 