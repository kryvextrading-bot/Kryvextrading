import React, { useState, useEffect, useCallback } from 'react';
import { Dialog } from '@headlessui/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import apiService, { getStockPrices, getForexPrices, getEtfPrices } from '@/services/api';

// Comprehensive market symbols for real-time data
const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI', 'ATOM', 'LTC', 'BCH', 'ETC'];
const FUTURES_SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI', 'ATOM', 'LTC', 'BCH', 'ETC'];
const STOCK_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'AMD', 'INTC', 'CSCO', 'ORCL', 'CRM', 'ADBE', 'PYPL'];
const FOREX_PAIRS = ['EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'USD/CNH', 'USD/HKD', 'NZD/USD', 'USD/SEK', 'USD/NOK', 'USD/DKK', 'USD/SGD', 'USD/MXN'];
const ETF_SYMBOLS = ['SPY', 'IVV', 'VOO', 'QQQ', 'VTI', 'VEA', 'VWO', 'BND', 'AGG', 'VT', 'VIG', 'VYM', 'VUG', 'VTV', 'IWM'];

const TABS = ['Futures', 'USStock', 'Forex', 'Crypto', 'ETF'];

export default function PairSelectorModal({ open, onClose, onSelectPair, currentTab = 'Futures' }) {
  const [tab, setTab] = useState(currentTab);
  const [search, setSearch] = useState('');

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

  useEffect(() => {
    if (tab === 'Crypto') {
      setCryptoLoading(true);
      setCryptoError('');
      apiService.getCryptoPrices()
        .then(data => {
          setCryptoData(data.map(c => ({
            name: c.symbol + '/USDT',
            price: c.price,
            change: c.change24h,
            icon: c.symbol === 'BTC' ? '₿' : c.symbol === 'ETH' ? 'Ξ' : undefined,
          })));
          setCryptoLoading(false);
        })
        .catch(() => {
          setCryptoError('Failed to load crypto data');
          setCryptoLoading(false);
        });
    }
    if (tab === 'Futures') {
      setFuturesLoading(true);
      setFuturesError('');
      // For demo, reuse crypto as futures; in real app, fetch futures pairs/prices
      apiService.getCryptoPrices()
        .then(data => {
          setFuturesData(data.map(c => ({
            name: c.symbol + '/USDT',
            price: c.price,
            change: c.change24h,
            icon: c.symbol === 'BTC' ? '₿' : c.symbol === 'ETH' ? 'Ξ' : undefined,
          })));
          setFuturesLoading(false);
        })
        .catch(() => {
          setFuturesError('Failed to load futures data');
          setFuturesLoading(false);
        });
    }
    if (tab === 'USStock') {
      setStockLoading(true);
      setStockError('');
      getStockPrices(STOCK_SYMBOLS)
        .then(data => {
          setStockData(data.map(s => ({
            name: s.symbol,
            price: s.price,
            change: s.change,
            icon: undefined,
          })));
          setStockLoading(false);
        })
        .catch(() => {
          setStockError('Failed to load stock data');
          setStockLoading(false);
        });
    }
    if (tab === 'Forex') {
      setForexLoading(true);
      setForexError('');
      getForexPrices(FOREX_PAIRS)
        .then(data => {
          setForexData(data.map(f => ({
            name: f.symbol,
            price: f.price,
            change: f.change,
            icon: undefined,
          })));
          setForexLoading(false);
        })
        .catch(() => {
          setForexError('Failed to load forex data');
          setForexLoading(false);
        });
    }
    if (tab === 'ETF') {
      setEtfLoading(true);
      setEtfError('');
      getEtfPrices(ETF_SYMBOLS)
        .then(data => {
          setEtfData(data.map(e => ({
            name: e.symbol,
            price: e.price,
            change: e.change,
            icon: undefined,
          })));
          setEtfLoading(false);
        })
        .catch(() => {
          setEtfError('Failed to load ETF data');
          setEtfLoading(false);
        });
    }
  }, [tab]);

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
        <Dialog.Panel className="relative bg-[#181A20] dark:bg-[#181A20] border border-[#222531] rounded-2xl shadow-2xl p-0 w-full max-w-3xl z-10">
          <div className="px-8 pt-8 pb-2">
            <Dialog.Title className="text-2xl font-bold mb-6 text-white">Choose your portfolio</Dialog.Title>
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
                    placeholder="Search"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  <div className="overflow-y-auto max-h-[400px] rounded-lg border border-[#23262F]">
                    {loading ? (
                      <div className="text-center py-8 text-[#F0B90B] font-semibold">Loading...</div>
                    ) : error ? (
                      <div className="text-center py-8 text-red-500 font-semibold">{error}</div>
                    ) : (
                      <table className="w-full text-left text-white text-base">
                        <thead>
                          <tr className="bg-[#23262F] border-b border-[#23262F]">
                            <th className="py-3 px-4 text-[#F0B90B] font-bold text-base">Name</th>
                            <th className="py-3 px-4 text-[#F0B90B] font-bold text-base">Last Price</th>
                            <th className="py-3 px-4 text-[#F0B90B] font-bold text-base">Change %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((pair, i) => (
                            <tr
                              key={pair.name}
                              className={`transition-all ${i % 2 === 0 ? 'bg-[#181A20]' : 'bg-[#23262F]'} hover:bg-[#F0B90B]/10 cursor-pointer`}
                              onClick={() => { onSelectPair(pair); onClose(); }}
                            >
                              <td className="py-3 px-4 flex items-center gap-2 font-semibold">
                                {pair.icon && <span className="text-xl">{pair.icon}</span>}
                                <span>{pair.name}</span>
                              </td>
                              <td className="py-3 px-4 font-mono">$ {pair.price}</td>
                              <td className="py-3 px-4">
                                <span className={pair.change > 0 ? 'text-[#0ECB81] font-bold' : pair.change < 0 ? 'text-[#F6465D] font-bold' : 'text-[#F0B90B] font-bold'}>
                                  {pair.change > 0 ? '+' : ''}{pair.change}%
                                </span>
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
            <button className="mt-8 w-full py-3 rounded-lg bg-[#F0B90B] text-black font-bold text-lg shadow hover:bg-[#FFD666] transition-all" onClick={onClose}>Close</button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 