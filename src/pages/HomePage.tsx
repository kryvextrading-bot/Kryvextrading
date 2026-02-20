import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ArrowRight, Eye, ChevronRight, MoreHorizontal, BarChart3, Users, Clock, Zap, Shield, Globe, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function HomePage() {
  const navigate = useNavigate();

  const services = [
    { name: 'Quant Trading', path: '/trading', icon: BarChart3 },
    { name: 'Node Stacking', path: '/stacking', icon: Zap },
    { name: 'Loan', path: '/loan', icon: Shield },
    { name: 'Pre-sale coin', path: '/presale', icon: TrendingUp },
    { name: 'Liquidity Miner', path: '/liquidity', icon: Users },
    { name: 'Join AI Arbitrage', path: '/arbitrage', icon: Globe }
  ];

  const watchlist = [
    { 
      pair: 'BTC/USDT',
      volume: '25800.21M',
      price: '$ 68699.89',
      secondary: '68699.89 USDT',
      change: '+0.57%',
      positive: true
    },
    { 
      pair: 'ETH/USDT',
      volume: '2956.502M',
      price: '$ 1974.23',
      secondary: '1974.23 USDT',
      change: '-1.87%',
      positive: false
    }
  ];

  const stats = [
    { label: 'Total Balance', value: 'USDT 2509961.9900', subValue: 'USD 2509961.9900' }
  ];

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="text-sm text-gray-400">Welcome to</div>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">Swan-IRA</h1>
            <div className="text-2xl font-semibold text-gray-300">1124</div>
          </div>
        </div>

        {/* Total Balance Card */}
        <Card className="bg-[#141518] border-gray-800 p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">USDT</span>
              <span className="text-sm text-gray-500">Total Balance</span>
            </div>
            <Eye className="h-4 w-4 text-gray-500" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">USDT {stats[0].value}</div>
          <div className="text-gray-400">USD {stats[0].subValue}</div>
        </Card>

        {/* Services Grid */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {services.map((service, index) => (
              <button
                key={index}
                onClick={() => navigate(service.path)}
                className="bg-[#141518] border border-gray-800 rounded-lg p-4 text-left hover:bg-[#1A1C21] transition-colors group"
              >
                <service.icon className="h-5 w-5 text-gray-400 mb-2" />
                <span className="text-white text-sm font-medium">{service.name}</span>
              </button>
            ))}
          </div>
          
          {/* See More Links */}
          <div className="flex items-center space-x-6 mt-4">
            <button 
              onClick={() => navigate('/trading')}
              className="text-sm text-gray-400 hover:text-white flex items-center"
            >
              See more <ArrowRight className="h-3 w-3 ml-1" />
            </button>
            <button 
              onClick={() => navigate('/arbitrage')}
              className="text-sm text-gray-400 hover:text-white flex items-center"
            >
              See more <ArrowRight className="h-3 w-3 ml-1" />
            </button>
          </div>
        </div>

        {/* Watch List Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Watch List</h2>
            <button 
              onClick={() => navigate('/watchlist')}
              className="text-sm text-gray-400 hover:text-white flex items-center"
            >
              See All <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {watchlist.map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(`/trading/${item.pair.toLowerCase().replace('/', '')}`)}
                className="bg-[#141518] border border-gray-800 rounded-lg p-4 text-left hover:bg-[#1A1C21] transition-colors group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{item.pair}</span>
                  <span className="text-xs text-gray-500">Volume: {item.volume}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold text-white">{item.price}</div>
                    <div className="text-sm text-gray-400">{item.secondary}</div>
                  </div>
                  <div className={`text-sm font-medium ${item.positive ? 'text-teal-400' : 'text-red-400'}`}>
                    {item.change}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-800">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">100+</div>
            <div className="text-xs text-gray-500">Trading Pairs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">0.1%</div>
            <div className="text-xs text-gray-500">Maker Fee</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">24/7</div>
            <div className="text-xs text-gray-500">Support</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">~1s</div>
            <div className="text-xs text-gray-500">Execution</div>
          </div>
        </div>
      </div>
    </div>
  );
}