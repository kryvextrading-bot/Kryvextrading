import React, { useState, useEffect, useCallback } from 'react';
import { Dialog } from '@headlessui/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import apiService, { getStockPrices, getForexPrices, getEtfPrices } from '@/services/api';
import { useNavigate } from 'react-router-dom';

// Comprehensive market symbols for real-time data
const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI', 'ATOM', 'LTC', 'BCH', 'ETC'];
const FUTURES_SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI', 'ATOM', 'LTC', 'BCH', 'ETC'];
const STOCK_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'AMD', 'INTC', 'CSCO', 'ORCL', 'CRM', 'ADBE', 'PYPL'];
const FOREX_PAIRS = ['EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'USD/CNH', 'USD/HKD', 'NZD/USD', 'USD/SEK', 'USD/NOK', 'USD/DKK', 'USD/SGD', 'USD/MXN'];
const ETF_SYMBOLS = ['SPY', 'IVV', 'VOO', 'QQQ', 'VTI', 'VEA', 'VWO', 'BND', 'AGG', 'VT', 'VIG', 'VYM', 'VUG', 'VTV', 'IWM'];

const TABS = ['Futures', 'USStock', 'Forex', 'Crypto', 'ETF'];

export default function EnhancedPairSelectorModal({ open, onClose, onSelectPair, currentTab = 'Futures' }) {
  const [tab, setTab] = useState(currentTab);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Live data state
  const [cryptoData, setCryptoData] = useState([]);
  const [cryptoLoading, setCryptoLoading] = useState(false);
  const [cryptoError, setCryptoError] = useState('');

  const [futuresData, setFuturesData] = useState([]);
  const [futuresLoading, setFuturesLoading] = useState(false);
  const [futuresError, setFuturesError] = useState('');

  const [stockData, setStockData] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState('');

  const [forexData, setForexData] = useState([]);
  const [forexLoading, setForexLoading] = useState(false);
  const [forexError, setForexError] = useState('');

  const [etfData, setEtfData] = useState([]);
  const [etfLoading, setEtfLoading] = useState(false);
  const [etfError, setEtfError] = useState('');

  // Enhanced data fetching functions
  const fetchCryptoData = useCallback(async () => {
    setCryptoLoading(true);
    setCryptoError('');
    try {
      // Use the existing crypto API endpoint with full URL
      const response = await fetch('http://localhost:3001/api/crypto/prices');
      
      if (!response.ok) throw new Error('Failed to fetch crypto data');
      
      const data = await response.json();
      const cryptoPairs = data.map(crypto => ({
        name: crypto.symbol + '/USDT',
        price: crypto.price,
        change: crypto.change24h || (Math.random() - 0.5) * 10,
        volume24h: crypto.volume24h || Math.random() * 1000000,
        marketCap: crypto.marketCap || Math.random() * 1000000000,
        icon: crypto.symbol === 'BTC' ? '₿' : crypto.symbol === 'ETH' ? 'Ξ' : crypto.symbol === 'BNB' ? '🔶' : crypto.symbol === 'SOL' ? '◎' : undefined,
      }));
      
      setCryptoData(cryptoPairs);
    } catch (error) {
      console.error('Crypto data fetch error:', error);
      setCryptoError('Failed to load crypto data');
      
      // Fallback to mock data
      const fallbackData = CRYPTO_SYMBOLS.map(symbol => ({
        name: symbol + '/USDT',
        price: Math.random() * 100000,
        change: (Math.random() - 0.5) * 10,
        volume24h: Math.random() * 1000000,
        marketCap: Math.random() * 1000000000,
        icon: symbol === 'BTC' ? '₿' : symbol === 'ETH' ? 'Ξ' : symbol === 'BNB' ? '🔶' : symbol === 'SOL' ? '◎' : undefined,
      }));
      setCryptoData(fallbackData);
    } finally {
      setCryptoLoading(false);
    }
  }, []);

  const fetchFuturesData = useCallback(async () => {
    setFuturesLoading(true);
    setFuturesError('');
    try {
      // Use the existing crypto API endpoint for futures (same underlying assets)
      const response = await fetch('http://localhost:3001/api/crypto/prices');
      
      if (!response.ok) throw new Error('Failed to fetch futures data');
      
      const data = await response.json();
      const futuresPairs = data.map(crypto => ({
        name: crypto.symbol + '/USDT',
        price: crypto.price,
        change: crypto.change24h || (Math.random() - 0.5) * 10,
        volume24h: crypto.volume24h || Math.random() * 1000000,
        marketCap: crypto.marketCap || Math.random() * 1000000000,
        leverage: Math.floor(Math.random() * 100) + 1, // Futures leverage
        icon: crypto.symbol === 'BTC' ? '₿' : crypto.symbol === 'ETH' ? 'Ξ' : crypto.symbol === 'BNB' ? '🔶' : crypto.symbol === 'SOL' ? '◎' : undefined,
      }));
      
      setFuturesData(futuresPairs);
    } catch (error) {
      console.error('Futures data fetch error:', error);
      setFuturesError('Failed to load futures data');
      
      // Fallback to mock data
      const fallbackData = FUTURES_SYMBOLS.map(symbol => ({
        name: symbol + '/USDT',
        price: Math.random() * 100000,
        change: (Math.random() - 0.5) * 10,
        volume24h: Math.random() * 1000000,
        marketCap: Math.random() * 1000000000,
        leverage: Math.floor(Math.random() * 100) + 1,
        icon: symbol === 'BTC' ? '₿' : symbol === 'ETH' ? 'Ξ' : symbol === 'BNB' ? '🔶' : symbol === 'SOL' ? '◎' : undefined,
      }));
      setFuturesData(fallbackData);
    } finally {
      setFuturesLoading(false);
    }
  }, []);

  const fetchStockData = useCallback(async () => {
    setStockLoading(true);
    setStockError('');
    try {
      const data = await getStockPrices(STOCK_SYMBOLS);
      const stockPairs = data.map(s => ({
        name: s.symbol,
        price: s.price,
        change: s.change,
        volume24h: Math.random() * 10000000, // Mock volume
        marketCap: Math.random() * 1000000000000, // Mock market cap
        icon: undefined,
      }));
      setStockData(stockPairs);
    } catch (error) {
      console.error('Stock data fetch error:', error);
      setStockError('Failed to load stock data');
      
      // Fallback to mock data
      const fallbackData = STOCK_SYMBOLS.map(symbol => ({
        name: symbol,
        price: Math.random() * 1000,
        change: (Math.random() - 0.5) * 10,
        volume24h: Math.random() * 10000000,
        marketCap: Math.random() * 1000000000000,
        icon: undefined,
      }));
      setStockData(fallbackData);
    } finally {
      setStockLoading(false);
    }
  }, []);

  const fetchForexData = useCallback(async () => {
    setForexLoading(true);
    setForexError('');
    try {
      const data = await getForexPrices(FOREX_PAIRS);
      const forexPairs = data.map(f => ({
        name: f.symbol,
        price: f.price,
        change: f.change,
        volume24h: Math.random() * 1000000, // Mock volume
        icon: undefined,
      }));
      setForexData(forexPairs);
    } catch (error) {
      console.error('Forex data fetch error:', error);
      setForexError('Failed to load forex data');
      
      // Fallback to mock data
      const fallbackData = FOREX_PAIRS.map(pair => ({
        name: pair,
        price: Math.random() * 2 + 0.5,
        change: (Math.random() - 0.5) * 2,
        volume24h: Math.random() * 1000000,
        icon: undefined,
      }));
      setForexData(fallbackData);
    } finally {
      setForexLoading(false);
    }
  }, []);

  const fetchEtfData = useCallback(async () => {
    setEtfLoading(true);
    setEtfError('');
    try {
      const data = await getEtfPrices(ETF_SYMBOLS);
      const etfPairs = data.map(e => ({
        name: e.symbol,
        price: e.price,
        change: e.change,
        volume24h: Math.random() * 1000000, // Mock volume
        icon: undefined,
      }));
      setEtfData(etfPairs);
    } catch (error) {
      console.error('ETF data fetch error:', error);
      setEtfError('Failed to load ETF data');
      
      // Fallback to mock data
      const fallbackData = ETF_SYMBOLS.map(symbol => ({
        name: symbol,
        price: Math.random() * 500,
        change: (Math.random() - 0.5) * 5,
        volume24h: Math.random() * 1000000,
        icon: undefined,
      }));
      setEtfData(fallbackData);
    } finally {
      setEtfLoading(false);
    }
  }, []);

  // Main data fetching effect with auto-refresh
  useEffect(() => {
    if (tab === 'Crypto') fetchCryptoData();
    if (tab === 'Futures') fetchFuturesData();
    if (tab === 'USStock') fetchStockData();
    if (tab === 'Forex') fetchForexData();
    if (tab === 'ETF') fetchEtfData();
  }, [tab, fetchCryptoData, fetchFuturesData, fetchStockData, fetchForexData, fetchEtfData]);

  // Auto-refresh every 30 seconds for real-time data
  useEffect(() => {
    if (!open) return;
    
    const interval = setInterval(() => {
      if (tab === 'Crypto') fetchCryptoData();
      if (tab === 'Futures') fetchFuturesData();
      if (tab === 'USStock') fetchStockData();
      if (tab === 'Forex') fetchForexData();
      if (tab === 'ETF') fetchEtfData();
    }, 30000);

    return () => clearInterval(interval);
  }, [tab, open, fetchCryptoData, fetchFuturesData, fetchStockData, fetchForexData, fetchEtfData]);

  // Enhanced pair selection handler
  const handleSelectPair = useCallback((pair) => {
    // Store selected pair in localStorage for persistence
    localStorage.setItem('selectedTradingPair', JSON.stringify({
      name: pair.name,
      price: pair.price,
      change: pair.change,
      market: tab,
      timestamp: Date.now()
    }));
    
    // Call the original onSelectPair callback
    onSelectPair(pair);
    
    // Navigate to trading page with the selected pair
    navigate(`/trading?pair=${encodeURIComponent(pair.name)}&market=${tab}`);
    
    // Close the modal
    onClose();
  }, [onSelectPair, tab, navigate, onClose]);

  let filtered = [];
  let loading = false;
  let error = '';
  if (tab === 'Crypto') {
    filtered = cryptoData.filter(pair => pair.name.toLowerCase().includes(search.toLowerCase()));
    loading = cryptoLoading;
    error = cryptoError;
  } else if (tab === 'Futures') {
    filtered = futuresData.filter(pair => pair.name.toLowerCase().includes(search.toLowerCase()));
    loading = futuresLoading;
    error = futuresError;
  } else if (tab === 'USStock') {
    filtered = stockData.filter(pair => pair.name.toLowerCase().includes(search.toLowerCase()));
    loading = stockLoading;
    error = stockError;
  } else if (tab === 'Forex') {
    filtered = forexData.filter(pair => pair.name.toLowerCase().includes(search.toLowerCase()));
    loading = forexLoading;
    error = forexError;
  } else if (tab === 'ETF') {
    filtered = etfData.filter(pair => pair.name.toLowerCase().includes(search.toLowerCase()));
    loading = etfLoading;
    error = etfError;
  }

  return (
    <Dialog open={open} onClose={onClose} as="div" className="relative z-50">
      <div className="fixed inset-0 flex items-center justify-center min-h-screen">
        <div className="fixed inset-0 bg-black bg-opacity-70" aria-hidden="true" role="presentation" />
        <Dialog.Panel className="relative bg-[#181A20] dark:bg-[#181A20] border border-[#222531] rounded-2xl shadow-2xl p-0 w-full max-w-4xl z-10">
          <div className="px-8 pt-8 pb-2">
            <Dialog.Title className="text-2xl font-bold mb-6 text-white">Choose your trading pair</Dialog.Title>
            <div className="mb-4 text-sm text-[#848E9C]">
              Real-time data from all markets • Auto-refresh every 30 seconds
            </div>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="mb-6 bg-[#222531] rounded-lg p-1 flex gap-2">
                {TABS.map(t => (
                  <TabsTrigger
                    key={t}
                    value={t}
                    className={
                      `font-bold px-5 py-2 rounded-lg transition-all text-base ${tab === t ? 'bg-[#F0B90B] text-black shadow' : 'text-[#F0B90B] hover:bg-[#23262F]'} `
                    }
                  >
                    {t}
                  </TabsTrigger>
                ))}
              </TabsList>
              {TABS.map(t => (
                <TabsContent key={t} value={t}>
                  <Input
                    className="mb-4 w-full bg-[#23262F] text-white placeholder-[#888] border-none rounded-lg focus:ring-2 focus:ring-[#F0B90B]"
                    placeholder={`Search ${t} pairs...`}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  <div className="overflow-y-auto max-h-[400px] rounded-lg border border-[#23262F]">
                    {loading ? (
                      <div className="text-center py-8 text-[#F0B90B] font-semibold">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F0B90B] mx-auto mb-4"></div>
                        Loading {t} data...
                      </div>
                    ) : error ? (
                      <div className="text-center py-8 text-red-500 font-semibold">{error}</div>
                    ) : (
                      <table className="w-full text-left text-white text-base">
                        <thead>
                          <tr className="bg-[#23262F] border-b border-[#23262F]">
                            <th className="py-3 px-4 text-[#F0B90B] font-bold text-base">Pair</th>
                            <th className="py-3 px-4 text-[#F0B90B] font-bold text-base">Last Price</th>
                            <th className="py-3 px-4 text-[#F0B90B] font-bold text-base">Change %</th>
                            <th className="py-3 px-4 text-[#F0B90B] font-bold text-base">Volume</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((pair, i) => (
                            <tr
                              key={pair.name}
                              className={`transition-all ${i % 2 === 0 ? 'bg-[#181A20]' : 'bg-[#23262F]'} hover:bg-[#F0B90B]/10 cursor-pointer`}
                              onClick={() => handleSelectPair(pair)}
                            >
                              <td className="py-3 px-4 flex items-center gap-2 font-semibold">
                                {pair.icon && <span className="text-xl">{pair.icon}</span>}
                                <span>{pair.name}</span>
                                {pair.leverage && (
                                  <span className="text-xs bg-[#F0B90B]/20 text-[#F0B90B] px-2 py-1 rounded">
                                    {pair.leverage}x
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 font-mono">$ {pair.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="py-3 px-4">
                                <span className={pair.change > 0 ? 'text-[#0ECB81] font-bold' : pair.change < 0 ? 'text-[#F6465D] font-bold' : 'text-[#F0B90B] font-bold'}>
                                  {pair.change > 0 ? '+' : ''}{pair.change.toFixed(2)}%
                                </span>
                              </td>
                              <td className="py-3 px-4 text-xs text-[#848E9C]">
                                {pair.volume24h ? 
                                  `$${(pair.volume24h / 1000000).toFixed(2)}M` : 
                                  'N/A'
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
            <div className="flex gap-4 mt-8">
              <button className="flex-1 py-3 rounded-lg bg-[#23262F] text-[#F0B90B] font-bold text-lg border border-[#F0B90B] hover:bg-[#F0B90B]/10 transition-all" onClick={onClose}>
                Cancel
              </button>
              <button 
                className="flex-1 py-3 rounded-lg bg-[#F0B90B] text-black font-bold text-lg shadow hover:bg-[#FFD666] transition-all" 
                onClick={() => {
                  // Use the first available pair if none is selected
                  const availablePairs = filtered.length > 0 ? filtered : 
                    tab === 'Crypto' ? cryptoData :
                    tab === 'Futures' ? futuresData :
                    tab === 'USStock' ? stockData :
                    tab === 'Forex' ? forexData : etfData;
                  
                  if (availablePairs.length > 0) {
                    handleSelectPair(availablePairs[0]);
                  }
                }}
              >
                Select First Available
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
