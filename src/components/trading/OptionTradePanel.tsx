import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import { TooltipProvider } from '@/components/ui/tooltip';
import useBinanceStream from '@/hooks/useBinanceStream';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useWallet } from '@/contexts/WalletContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  CandlestickController,
  CandlestickElement
);

const TIME_RANGES = ['60s', '120s', '240s', '360s', '600s'];
const OPTION_TYPES = ['UP > 0.01%'];
const CURRENCIES = ['USDT'];
const CHART_TYPES = ['candlestick', 'line'];

const mockLineData = {
  labels: ['13:00', '13:05', '13:10', '13:15', '13:20', '13:25'],
  datasets: [
    {
      label: 'Price',
      data: [39.1, 39.2, 39.0, 39.3, 39.4, 39.2],
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34,197,94,0.1)',
      tension: 0.4,
      pointRadius: 0,
      fill: true,
    },
  ],
};

const mockCandleData = {
  labels: ['13:00', '13:05', '13:10', '13:15', '13:20', '13:25'],
  datasets: [
    {
      label: 'Candlestick',
      data: [
        { o: 39.1, h: 39.3, l: 39.0, c: 39.2 },
        { o: 39.2, h: 39.4, l: 39.1, c: 39.0 },
        { o: 39.0, h: 39.2, l: 38.9, c: 39.1 },
        { o: 39.1, h: 39.3, l: 39.0, c: 39.3 },
        { o: 39.3, h: 39.5, l: 39.2, c: 39.4 },
        { o: 39.4, h: 39.5, l: 39.2, c: 39.2 },
      ],
    },
  ],
};

const mockOrderBook = {
  bids: [
    { price: 121967.90, amount: 0.618 },
    { price: 121967.10, amount: 0.018 },
    { price: 121967.00, amount: 0.025 },
    { price: 121966.80, amount: 0.001 },
  ],
  asks: [
    { price: 121972.00, amount: 0.059 },
    { price: 121971.20, amount: 0.003 },
    { price: 121970.00, amount: 0.064 },
    { price: 121968.00, amount: 0.743 },
  ],
};

const mockPrice = 121956.41;
const mockPriceChange = 2.75;
const mockAvailable = 10000;
const mockExpectedProfit = (amount) => amount ? (parseFloat(amount) * 0.176).toFixed(2) : '0.00';

function parseSeconds(str) {
  return parseInt(str.replace(/\D/g, ''));
}

interface OptionTradePanelProps {
  pair?: string;
}

export default function OptionTradePanel({ pair = 'BTC/USDT' }: OptionTradePanelProps) {
  const [direction, setDirection] = useState('up');
  const [timeRange, setTimeRange] = useState('60s');
  const [optionType, setOptionType] = useState(OPTION_TYPES[0]);
  const [currency, setCurrency] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [percent, setPercent] = useState<number>(0);
  const [activeTab, setActiveTab] = useState('active');
  const [orders, setOrders] = useState([]);
  const [inProgress, setInProgress] = useState(null); // { entryPrice, entryTime, direction, amount, timeRange, targetPct, timer }
  const [result, setResult] = useState(null);
  const [chartType, setChartType] = useState('candlestick');
  const timerRef = useRef<any>();
  const { totalValue } = useWallet();

  // Convert pair to Binance symbol (e.g., BTCUSDT)
  const binanceSymbol = pair.replace('/', '').toLowerCase();

  // Live data hooks
  const trade = useBinanceStream(binanceSymbol, 'trade');
  const depth = useBinanceStream(binanceSymbol, 'depth');
  const kline = useBinanceStream(binanceSymbol, 'kline', '1m');

  // Live price
  const livePrice = trade?.p ? parseFloat(trade.p) : mockPrice;
  // Live order book
  const orderBook = depth && depth.b && depth.a ? {
    bids: depth.b.slice(0, 5).map(([price, amount]: [string, string]) => ({ price: parseFloat(price), amount: parseFloat(amount) })),
    asks: depth.a.slice(0, 5).map(([price, amount]: [string, string]) => ({ price: parseFloat(price), amount: parseFloat(amount) })),
  } : mockOrderBook;
  // Live kline chart data
  const [chartData, setChartData] = useState<any[]>([]);
  useEffect(() => {
    if (kline && kline.k) {
      setChartData(prev => {
        const exists = prev.find(c => c.t === kline.k.t);
        if (exists) {
          return prev.map(c => c.t === kline.k.t ? kline.k : c);
        } else {
          return [...prev.slice(-99), kline.k];
        }
      });
    }
  }, [kline]);
  useEffect(() => { setChartData([]); }, [binanceSymbol]);

  // Chart.js data for line/candlestick
  const chartLineData = chartData.length > 0 ? {
    labels: chartData.map(k => new Date(k.t).toLocaleTimeString()),
    datasets: [
      {
        label: 'Price',
        data: chartData.map(k => parseFloat(k.c)),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.1)',
        tension: 0.4,
        pointRadius: 0,
        fill: true,
      },
    ],
  } : mockLineData;
  const chartCandleData = chartData.length > 0 ? {
    labels: chartData.map(k => new Date(k.t).toLocaleTimeString()),
    datasets: [
      {
        label: 'Candlestick',
        data: chartData.map(k => ({ o: parseFloat(k.o), h: parseFloat(k.h), l: parseFloat(k.l), c: parseFloat(k.c) })),
      },
    ],
  } : mockCandleData;

  // Quick select amount
  const quickSelect = (pct: number) => {
    setPercent(pct);
    const amt = ((mockAvailable * pct) / 100).toFixed(2);
    setAmount(amt);
  };

  // Place trade
  const handleBuy = () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0 || parseFloat(amount) > mockAvailable || inProgress) return;
    const entryPrice = livePrice;
    const entryTime = Date.now();
    const seconds = parseSeconds(timeRange);
    const amt = parseFloat(amount);
    const targetPct = 0.01;
    setInProgress({ entryPrice, entryTime, direction, amount: amt, timeRange, targetPct, seconds, timer: seconds });
    setResult(null);
    // Start countdown
    timerRef.current = setInterval(() => {
      setInProgress((prev) => {
        if (!prev) return null;
        if (prev.timer <= 1) {
          clearInterval(timerRef.current);
          // Simulate result
          const finalPrice = livePrice + (direction === 'up' ? 1 : -1) * (Math.random() * 10);
          const win = direction === 'up' ? finalPrice >= entryPrice * (1 + targetPct) : finalPrice <= entryPrice * (1 - targetPct);
          const profit = win ? amt * 0.176 : 0;
          setResult({ win, entryPrice, finalPrice, amount: amt, profit, direction });
          setOrders((orders) => [
            { id: Date.now(), entryPrice, finalPrice, amount: amt, profit, direction, win, entryTime, exitTime: Date.now(), timeRange, status: 'completed', pair: pair, orderType: 'market', price: finalPrice },
            ...orders,
          ]);
          setInProgress(null);
          return null;
        }
        return { ...prev, timer: prev.timer - 1 };
      });
    }, 1000);
  };

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  // UI
  return (
    <TooltipProvider>
      <div className="flex flex-col items-center p-4 gap-4">
        <Card className="w-full max-w-3xl mx-auto p-6 bg-[#23262F] rounded-xl shadow-lg">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left: Trading Form */}
            <div className="flex-1 min-w-[320px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-xl text-white">{pair}</span>
                <span className="text-green-500 font-semibold">{trade?.P ? `${trade.P > 0 ? '+' : ''}${trade.P}%` : `+${mockPriceChange}%`}</span>
              </div>
              <div className="flex gap-2 mb-4">
                <Button className={`flex-1 ${direction === 'up' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`} onClick={() => setDirection('up')}>Up</Button>
                <Button className={`flex-1 ${direction === 'down' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`} onClick={() => setDirection('down')}>Down</Button>
              </div>
              <div className="mb-2">
                <Select value={timeRange} onValueChange={(val) => setTimeRange(val)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_RANGES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="mb-2">
                <Select value={optionType} onValueChange={(val) => setOptionType(val)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Option Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPTION_TYPES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="mb-2 flex gap-2 items-center">
                <Select value={currency} onValueChange={(val) => setCurrency(val)}>
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Total" className="flex-1 border rounded px-2 py-2 text-white placeholder-gray-500 bg-black" />
                <span className="text-sm text-white">USDT</span>
              </div>
              <div className="flex gap-2 mb-2">
                {[25, 50, 100].map(pct => (
                  <Button
                    key={pct}
                    variant="outline"
                    size="sm"
                    className="bg-[#23262F] text-white border border-[#F0B90B] hover:bg-[#181A20] hover:text-[#F0B90B] focus:bg-[#181A20] focus:text-[#F0B90B] transition-colors duration-150"
                    onClick={() => quickSelect(pct)}
                  >
                    {pct}%
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={percent}
                  onChange={e => setPercent(Number(e.target.value))}
                  className="binance-slider"
                />
                <span className="text-xs w-10 text-right text-white">{percent}%</span>
              </div>
              <div className="flex justify-between text-xs mb-1 text-white">
                <span>Purchase Range</span>
                <span>100-50000</span>
              </div>
              <div className="flex justify-between text-xs mb-1 text-white">
                <span>Available</span>
                <span>{formatCurrency(totalValue, 'USD')} USD</span>
              </div>
              <div className="flex justify-between text-xs mb-1 text-white">
                <span>Expected Profit</span>
                <span>{mockExpectedProfit(amount)} USDT</span>
              </div>
              <Button className="w-full mt-2 bg-green-600" disabled={!amount || isNaN(amount) || parseFloat(amount) <= 0 || parseFloat(amount) > mockAvailable || inProgress} onClick={handleBuy}>Buy</Button>
            </div>
            {/* Right: Order Book */}
            <div className="flex-1 min-w-[320px]">
              <div className="font-semibold mb-2">Order Book</div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">Bids</div>
                  {orderBook.bids.map((b, i) => (
                    <div key={i} className="flex justify-between text-green-500 text-xs"><span>{b.price}</span><span>{b.amount}</span></div>
                  ))}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">Asks</div>
                  {orderBook.asks.map((a, i) => (
                    <div key={i} className="flex justify-between text-red-500 text-xs"><span>{a.price}</span><span>{a.amount}</span></div>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <div className="font-semibold mb-2">Price (USDT)</div>
                <div className="text-2xl font-bold text-green-500">{livePrice} <span className="text-base align-top">↑</span></div>
                <div className="text-xs text-muted-foreground">≈{livePrice} USDT</div>
              </div>
            </div>
          </div>
        </Card>
        {/* Tabs for Active/Scheduled/Completed */}
        <div className="w-full max-w-3xl mx-auto mt-6">
          <div className="flex gap-8 border-b mb-2">
            <button className={`binance-tab${activeTab === 'active' ? ' active' : ''}`} onClick={() => setActiveTab('active')}>Active</button>
            <button className={`binance-tab${activeTab === 'scheduled' ? ' active' : ''}`} onClick={() => setActiveTab('scheduled')}>Scheduled</button>
            <button className={`binance-tab${activeTab === 'completed' ? ' active' : ''}`} onClick={() => setActiveTab('completed')}>Completed</button>
          </div>
          {/* Active Orders */}
          {activeTab === 'active' && inProgress && (
            <div className="p-4 bg-[#23262F] border border-[#F0B90B] rounded mb-2 flex items-center gap-4">
              <span className="font-bold text-white">{direction.toUpperCase()} {inProgress.amount} {pair}</span>
              <span className="text-white">Time Left: <span className="font-mono">{inProgress.timer}s</span></span>
              <span className="text-white">Entry: {inProgress.entryPrice}</span>
            </div>
          )}
          {/* Completed Orders */}
          {activeTab === 'completed' && orders.length > 0 && (
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o.id} className="flex justify-between text-xs border-b py-1 items-center">
                  <span>{o.direction?.toUpperCase()} {o.amount} {pair}</span>
                  <span>Entry: {o.entryPrice}</span>
                  <span>Final: {o.finalPrice}</span>
                  <span className={o.win ? 'text-green-600' : 'text-red-600'}>{o.win ? 'Win' : 'Loss'}</span>
                  <span>P/L: {o.win ? '+' : '-'}{o.win ? o.profit : o.amount} USDT</span>
                </div>
              ))}
            </div>
          )}
          {/* Scheduled Orders (not implemented, placeholder) */}
          {activeTab === 'scheduled' && (
            <div className="text-xs text-muted-foreground py-4">Scheduled options panel coming soon.</div>
          )}
        </div>
        {/* Chart below */}
        <div className="w-full max-w-3xl mx-auto mt-6">
          <Card className="p-4 bg-[#23262F]">
            {chartType === 'line' ? (
              <Chart
                type="line"
                data={chartLineData}
                options={{
                  plugins: { legend: { display: false } },
                  scales: { x: { display: true, type: 'category' }, y: { display: true } },
                }}
              />
            ) : (
              <Chart
                type="candlestick"
                data={chartCandleData}
                options={{
                  plugins: { legend: { display: false } },
                  scales: { x: { display: true, type: 'category' }, y: { display: true } },
                }}
              />
            )}
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
} 