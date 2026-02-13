import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationTabs from '../components/NavigationTabs';
import SearchBar from '../components/SearchBar';
import MarketOverview from '../components/MarketOverview';
import AssetTable from '../components/AssetTable';
import { useTrading } from '../contexts/TradingContext';

const mockAssets = [
  { icon: '🟡', name: 'BTC/USDT', volume: '22882.534 M', miniChartData: [1,2,3,4,5,6,7,8,9,10], lastPrice: '$119678.00', change: 0.83 },
  { icon: '🔵', name: 'ETH/USDT', volume: '22157.683 M', miniChartData: [2,3,4,5,6,7,8,9,10,11], lastPrice: '$2999.44', change: 0.26 },
  { icon: '🟣', name: 'SOL/USDT', volume: '2041.153 M', miniChartData: [3,4,5,6,7,8,9,10,11,12], lastPrice: '$164.4072', change: 1.46 },
  { icon: '🟠', name: 'XAUT/USDT', volume: '517.312 M', miniChartData: [4,5,6,7,8,9,10,11,12,13], lastPrice: '$3350.5', change: 0.3 },
  { icon: '⚛️', name: 'ATOM/USDT', volume: '1916.471 M', miniChartData: [5,6,7,8,9,10,11,12,13,14], lastPrice: '$4.776', change: 1.48 },
  { icon: '⚪', name: 'LTC/USDT', volume: '3663.672 M', miniChartData: [6,7,8,9,10,11,12,13,14,15], lastPrice: '$95.85', change: -0.31 },
  { icon: '⚫', name: 'DOT/USDT', volume: '1738.826 M', miniChartData: [7,8,9,10,11,12,13,14,15,16], lastPrice: '$4.086', change: 1.87 },
  { icon: '🔵', name: 'FIL/USDT', volume: '6157.310 M', miniChartData: [8,9,10,11,12,13,14,15,16,17], lastPrice: '$2.616', change: 0.8 },
];

export default function HomePage() {
  const { selectedTab, setSelectedTab, search, setSearch, assets, setAssets } = useTrading();
  const navigate = useNavigate();

  useEffect(() => {
    if (assets.length === 0) setAssets(mockAssets);
  }, [assets, setAssets]);

  const filteredAssets = assets.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mb-2 text-sm text-gray-500">Choose your portfolio</div>
      <NavigationTabs selected={selectedTab} onSelect={setSelectedTab} />
      <SearchBar value={search} onChange={setSearch} />
      <MarketOverview marketCap="$2.4T" volume24h="$89.2B" btcDominance="58.7%" onBuy={()=>{}} onSell={()=>{}} onAlert={()=>{}} />
      <AssetTable assets={filteredAssets} onSelect={row => navigate(`/asset/${row.name.replace(/\W/g, '')}`)} />
    </div>
  );
} 