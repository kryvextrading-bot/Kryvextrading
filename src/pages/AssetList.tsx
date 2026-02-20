import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Star, 
  TrendingUp, 
  TrendingDown,
  ChevronRight,
  Filter,
  Sparkles,
  Flame,
  Clock
} from 'lucide-react';

interface Asset {
  symbol: string;
  name: string;
  lastPrice: number;
  change: number;
  usdtPrice: number;
  category: 'futures' | 'usstock' | 'forex' | 'crypto' | 'etf';
  volume?: string;
  favorite?: boolean;
}

export default function AssetList() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('futures');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'futures', label: 'Futures' },
    { id: 'usstock', label: 'USStock' },
    { id: 'forex', label: 'Forex' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'etf', label: 'ETF' }
  ];

  const filters = [
    { id: 'favourites', label: 'Favourites' },
    { id: 'all', label: 'All' },
    { id: 'hot', label: 'Hot' },
    { id: 'gainer', label: 'Gainer' },
    { id: 'loser', label: 'Loser' }
  ];

  const assets: Asset[] = [
    { symbol: 'XAU', name: 'Gold', lastPrice: 4909.36, change: -1.68, usdtPrice: 4909.36, category: 'futures', volume: '1.2B' },
    { symbol: 'XAG', name: 'Silver', lastPrice: 74.62, change: -1.81, usdtPrice: 74.62, category: 'futures', volume: '890M' },
    { symbol: 'NG', name: 'Natural Gas', lastPrice: 3.02, change: 0.97, usdtPrice: 3.02, category: 'futures', volume: '2.1B' },
    { symbol: 'CAD', name: 'Canadian Dollar', lastPrice: 12730.88, change: -0.56, usdtPrice: 12730.88, category: 'forex', volume: '450M' },
    { symbol: 'HO', name: 'Heating Oil', lastPrice: 2.32, change: 0.22, usdtPrice: 2.32, category: 'futures', volume: '780M' },
    { symbol: 'RBOB', name: 'Gasoline', lastPrice: 2.14, change: -0.09, usdtPrice: 2.14, category: 'futures', volume: '560M' },
    { symbol: 'GC', name: 'Gold Futures', lastPrice: 4922.34, change: -2.53, usdtPrice: 4922.34, category: 'futures', volume: '3.2B' },
    { symbol: 'XPT', name: 'Platinum', lastPrice: 74.34, change: -4.14, usdtPrice: 74.34, category: 'futures', volume: '340M' }
  ];

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toFixed(2);
    return price.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-semibold">Choose your portfolio</h1>
          <div className="flex items-center space-x-3">
            <button className="text-gray-400">
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Categories */}
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-teal-400 text-gray-900'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal-400"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 flex space-x-2 overflow-x-auto pb-2">
        {filters.map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeFilter === filter.id
                ? 'bg-teal-400 text-gray-900'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Table Header */}
      <div className="px-4 py-3 grid grid-cols-3 text-xs text-gray-500 border-b border-gray-800">
        <div>Name</div>
        <div className="text-right">Last Price</div>
        <div className="text-right">Change %</div>
      </div>

      {/* Asset List */}
      <div className="px-4 divide-y divide-gray-800">
        {assets.map((asset, index) => (
          <div
            key={index}
            className="w-full py-4 grid grid-cols-3 items-center hover:bg-gray-800/50 transition-colors cursor-pointer"
            onClick={() => navigate(`/trading/${asset.symbol.toLowerCase()}`)}
          >
            <div className="flex items-center space-x-3">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  // Toggle favorite
                }}
                className="text-gray-600 hover:text-yellow-400"
              >
                <Star className="h-4 w-4" fill={asset.favorite ? "currentColor" : "none"} />
              </button>
              <div className="text-left">
                <div className="text-white font-medium">{asset.symbol}</div>
                <div className="text-xs text-gray-500">{asset.volume}</div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-white font-mono">
                ${formatPrice(asset.lastPrice)}
              </div>
              <div className="text-xs text-gray-500">
                {asset.usdtPrice.toFixed(2)} USDT
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-sm font-medium ${
                asset.change >= 0 ? 'text-teal-400' : 'text-red-400'
              }`}>
                {asset.change >= 0 ? '+' : ''}{asset.change}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0B0D] border-t border-gray-800 px-4 py-2">
        <div className="grid grid-cols-5 gap-1">
          {['Home', 'Markets', 'Trade', 'Wallet', 'Profile'].map((item, i) => (
            <button
              key={item}
              onClick={() => i === 2 ? null : navigate(`/${item.toLowerCase()}`)}
              className={`flex flex-col items-center py-2 ${
                i === 2 ? 'text-teal-400' : 'text-gray-600'
              }`}
            >
              <div className={`h-1 w-8 rounded-full mb-1 ${
                i === 2 ? 'bg-teal-400' : 'bg-transparent'
              }`} />
              <span className="text-xs">{item}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Kryvex Trading Footer */}
      <div className="py-2 text-center text-xs text-gray-600">
        kryvex.com
      </div>
    </div>
  );
}
