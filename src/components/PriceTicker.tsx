import React from 'react';
import { useMarketData } from '../contexts/MarketDataContext';

const coinOrder = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOGE', 'MATIC'];

export const PriceTicker: React.FC = () => {
  const { prices, lastUpdated, isLoading } = useMarketData();

  return (
    <div className="flex items-center bg-[#181A20] text-[#F0B90B] px-3 py-2 md:px-4 md:py-2 rounded-lg font-semibold text-sm md:text-base shadow-lg overflow-x-auto">
      {isLoading ? (
        <span className="text-xs md:text-sm">Loading prices...</span>
      ) : (
        <div className="flex items-center gap-3 md:gap-6 flex-wrap">
          {coinOrder.map((symbol) => (
            <span key={symbol} className="whitespace-nowrap text-xs md:text-sm">
              {symbol}: ${prices[symbol]?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          ))}
        </div>
      )}
      <span className="text-[#888] font-normal text-xs ml-auto whitespace-nowrap hidden md:block">
        {lastUpdated ? `Updated: ${lastUpdated.toLocaleTimeString()}` : ''}
      </span>
    </div>
  );
};

export default PriceTicker; 