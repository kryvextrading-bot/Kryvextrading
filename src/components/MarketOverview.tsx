import React from 'react';

export default function MarketOverview({ marketCap, volume24h, btcDominance, onBuy, onSell, onAlert }: {
  marketCap: string;
  volume24h: string;
  btcDominance: string;
  onBuy: () => void;
  onSell: () => void;
  onAlert: () => void;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-white rounded shadow mb-4">
      <div className="flex gap-8">
        <div>
          <div className="text-xs text-gray-500">Total Market Cap</div>
          <div className="font-bold">{marketCap}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">24h Volume</div>
          <div className="font-bold">{volume24h}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">BTC Dominance</div>
          <div className="font-bold">{btcDominance}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={onBuy}>Buy Crypto</button>
        <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded" onClick={onSell}>Sell Crypto</button>
        <button className="bg-yellow-400 text-white px-4 py-2 rounded" onClick={onAlert}>Set Price Alert</button>
      </div>
    </div>
  );
} 