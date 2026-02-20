import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft,
  Maximize2,
  Minimize2,
  Settings,
  Download,
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

// Generate mock candlestick data
const generateCandlestickData = (count: number = 50) => {
  const data = [];
  let currentPrice = 4900;
  
  for (let i = 0; i < count; i++) {
    const volatility = Math.random() * 20 - 10;
    const open = currentPrice;
    const close = currentPrice + volatility;
    const high = Math.max(open, close) + Math.random() * 5;
    const low = Math.min(open, close) - Math.random() * 5;
    const volume = Math.random() * 1000000 + 500000;
    
    data.push({
      time: Date.now() - (count - i) * 60000,
      open,
      high,
      low,
      close,
      volume
    });
    
    currentPrice = close;
  }
  
  return data;
};

export default function ChartView() {
  const navigate = useNavigate();
  const { symbol } = useParams();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('15M');
  const [candlestickData, setCandlestickData] = useState(generateCandlestickData());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const timeframes = ['1M', '5M', '15M', '30M', '1H', '4H', '1D', '1W'];

  // Calculate current price and change from latest candle
  const latestCandle = candlestickData[candlestickData.length - 1];
  const previousCandle = candlestickData[candlestickData.length - 2];
  const currentPrice = latestCandle?.close || 4909.34;
  const priceChange = previousCandle ? ((currentPrice - previousCandle.close) / previousCandle.close) * 100 : -1.68;

  // Real-time data update
  useEffect(() => {
    const updateData = () => {
      setCandlestickData(prev => {
        const newData = [...prev.slice(1)];
        const lastCandle = prev[prev.length - 1];
        const volatility = (Math.random() - 0.5) * 20;
        const newCandle = {
          time: Date.now(),
          open: lastCandle.close,
          high: Math.max(lastCandle.close, lastCandle.close + volatility) + Math.random() * 5,
          low: Math.min(lastCandle.close, lastCandle.close + volatility) - Math.random() * 5,
          close: lastCandle.close + volatility,
          volume: Math.random() * 1000000 + 500000
        };
        newData.push(newCandle);
        return newData;
      });
    };

    const interval = setInterval(updateData, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, []);

  // Handle timeframe changes
  const handleTimeframeChange = (tf: string) => {
    setSelectedTimeframe(tf);
    // Generate new data based on timeframe
    const dataPoints = {
      '1M': 30,
      '5M': 40,
      '15M': 50,
      '30M': 60,
      '1H': 80,
      '4H': 100,
      '1D': 120,
      '1W': 150
    };
    setCandlestickData(generateCandlestickData(dataPoints[tf as keyof typeof dataPoints] || 50));
  };

  // Draw candlestick chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.fillStyle = '#0A0B0D';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (candlestickData.length === 0) return;

    // Calculate price range
    const prices = candlestickData.flatMap(d => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // Draw grid lines
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const y = (canvas.height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw candlesticks
    const candleWidth = Math.max(2, (canvas.width / candlestickData.length) * 0.6);
    const spacing = canvas.width / candlestickData.length;

    candlestickData.forEach((candle, i) => {
      const x = i * spacing + spacing / 2;
      const yHigh = ((maxPrice - candle.high) / priceRange) * canvas.height;
      const yLow = ((maxPrice - candle.low) / priceRange) * canvas.height;
      const yOpen = ((maxPrice - candle.open) / priceRange) * canvas.height;
      const yClose = ((maxPrice - candle.close) / priceRange) * canvas.height;

      // Draw wick
      ctx.strokeStyle = candle.close >= candle.open ? '#10b981' : '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      // Draw body
      ctx.fillStyle = candle.close >= candle.open ? '#10b981' : '#ef4444';
      const bodyHeight = Math.abs(yClose - yOpen);
      const bodyY = Math.min(yOpen, yClose);
      
      if (bodyHeight > 1) {
        ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, bodyHeight);
      } else {
        // Doji candle
        ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, 1);
      }
    });

    // Draw current price line
    const currentY = ((maxPrice - currentPrice) / priceRange) * canvas.height;
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, currentY);
    ctx.lineTo(canvas.width, currentY);
    ctx.stroke();
    ctx.setLineDash([]);

  }, [candlestickData, currentPrice]);

  return (
    <div className={`min-h-screen bg-[#0A0B0D] text-white ${
      isFullscreen ? 'fixed inset-0 z-50' : ''
    }`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => isFullscreen ? setIsFullscreen(false) : navigate(-1)} 
            className="text-gray-400"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold">{symbol?.toUpperCase()} Chart</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-white font-mono">{currentPrice.toFixed(2)}</span>
              <span className={`text-xs ${
                priceChange >= 0 ? 'text-teal-400' : 'text-red-400'
              }`}>
                {priceChange}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="text-gray-400" aria-label="Download chart">
            <Download className="h-5 w-5" />
          </button>
          <button className="text-gray-400" aria-label="Chart settings">
            <Settings className="h-5 w-5" />
          </button>
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-gray-400"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Timeframes */}
      <div className="px-4 py-3 flex space-x-2 overflow-x-auto border-b border-gray-800">
        {timeframes.map(tf => (
          <button
            key={tf}
            onClick={() => handleTimeframeChange(tf)}
            className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
              selectedTimeframe === tf
                ? 'bg-teal-400 text-gray-900'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Chart Area */}
      <div className="relative" style={{ height: isFullscreen ? 'calc(100vh - 120px)' : '500px' }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ background: '#0A0B0D' }}
        />

        {/* Price Indicators */}
        <div className="absolute top-4 left-4 space-y-2">
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 border border-gray-800">
            <div className="text-xs text-gray-500 mb-1">O</div>
            <div className="text-white font-mono text-sm">{previousCandle?.open.toFixed(2) || '4908.23'}</div>
          </div>
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 border border-gray-800">
            <div className="text-xs text-gray-500 mb-1">H</div>
            <div className="text-teal-400 font-mono text-sm">
              {Math.max(...candlestickData.map(d => d.high)).toFixed(2)}
            </div>
          </div>
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 border border-gray-800">
            <div className="text-xs text-gray-500 mb-1">L</div>
            <div className="text-red-400 font-mono text-sm">
              {Math.min(...candlestickData.map(d => d.low)).toFixed(2)}
            </div>
          </div>
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 border border-gray-800">
            <div className="text-xs text-gray-500 mb-1">C</div>
            <div className="text-white font-mono text-sm">{currentPrice.toFixed(2)}</div>
          </div>
        </div>

        {/* Volume Indicator */}
        <div className="absolute bottom-4 right-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 border border-gray-800">
          <div className="text-xs text-gray-500 mb-1">Volume</div>
          <div className="text-white font-mono text-sm">
            {((candlestickData[candlestickData.length - 1]?.volume || 1000000) / 1000000).toFixed(2)}M
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="px-4 py-3 flex justify-between items-center border-t border-gray-800">
        <div className="flex items-center space-x-4">
          <button className="text-gray-400 hover:text-teal-400" aria-label="Trending up">
            <TrendingUp className="h-5 w-5" />
          </button>
          <button className="text-gray-400 hover:text-red-400" aria-label="Trending down">
            <TrendingDown className="h-5 w-5" />
          </button>
        </div>
        <button 
          onClick={() => navigate(`/trading/${symbol}`)}
          className="bg-teal-400 text-gray-900 px-6 py-2 rounded-lg text-sm font-medium"
        >
          Trade
        </button>
      </div>
    </div>
  );
}
