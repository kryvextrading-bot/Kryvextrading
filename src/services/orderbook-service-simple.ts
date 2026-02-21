import { useState, useEffect, useCallback, useRef } from 'react';

export interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

export interface OrderBookData {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  lastUpdateId: number;
  symbol: string;
  timestamp: number;
}

export interface TickerData {
  symbol: string;
  lastPrice: number;
  bidPrice: number;
  askPrice: number;
  volume: number;
  high24h: number;
  low24h: number;
  priceChange: number;
  priceChangePercent: number;
}

// Mock data generator for development
const generateMockOrderBook = (symbol: string, basePrice: number): OrderBookData => {
  const bids: OrderBookEntry[] = [];
  const asks: OrderBookEntry[] = [];
  
  // Generate bids (buy orders) - prices below base
  for (let i = 0; i < 15; i++) {
    const price = basePrice * (1 - (i + 1) * 0.001);
    const quantity = Math.random() * 2 + 0.1;
    bids.push({
      price,
      quantity,
      total: price * quantity
    });
  }
  
  // Generate asks (sell orders) - prices above base
  for (let i = 0; i < 15; i++) {
    const price = basePrice * (1 + (i + 1) * 0.001);
    const quantity = Math.random() * 2 + 0.1;
    asks.push({
      price,
      quantity,
      total: price * quantity
    });
  }
  
  return {
    bids: bids.sort((a, b) => b.price - a.price),
    asks: asks.sort((a, b) => a.price - b.price),
    lastUpdateId: Date.now(),
    symbol,
    timestamp: Date.now()
  };
};

class OrderBookService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<(data: OrderBookData) => void>> = new Map();
  private tickerSubscribers: Map<string, Set<(data: TickerData) => void>> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private mockMode = false;

  constructor() {
    this.mockMode = !import.meta.env.VITE_BINANCE_WS_ENABLED;
  }

  // Subscribe to order book updates for a symbol
  subscribeOrderBook(symbol: string, callback: (data: OrderBookData) => void) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
      this.connectOrderBook(symbol);
    }
    
    this.subscribers.get(symbol)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(symbol);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(symbol);
          this.disconnectOrderBook(symbol);
        }
      }
    };
  }

  // Subscribe to 24hr ticker updates
  subscribeTicker(symbol: string, callback: (data: TickerData) => void) {
    if (!this.tickerSubscribers.has(symbol)) {
      this.tickerSubscribers.set(symbol, new Set());
      this.connectTicker(symbol);
    }
    
    this.tickerSubscribers.get(symbol)!.add(callback);
    
    return () => {
      const subs = this.tickerSubscribers.get(symbol);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.tickerSubscribers.delete(symbol);
          this.disconnectTicker(symbol);
        }
      }
    };
  }

  // Connect to Binance WebSocket for order book
  private connectOrderBook(symbol: string) {
    if (this.mockMode) {
      this.startMockUpdates(symbol);
      return;
    }

    const streamName = `${symbol.toLowerCase()}usdt@depth20@100ms`;
    const wsUrl = `wss://stream.binance.com:9443/ws/${streamName}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log(`✅ OrderBook WebSocket connected for ${symbol}`);
      this.reconnectAttempts.set(symbol, 0);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleOrderBookMessage(symbol, data);
      } catch (error) {
        console.error('Error parsing order book message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error(`OrderBook WebSocket error for ${symbol}:`, error);
    };
    
    ws.onclose = () => {
      console.log(`OrderBook WebSocket closed for ${symbol}`);
      this.reconnectOrderBook(symbol);
    };
    
    // Store WebSocket connection
    (this as any)[`ws_${symbol}`] = ws;
  }

  // Connect to Binance WebSocket for 24hr ticker
  private connectTicker(symbol: string) {
    if (this.mockMode) {
      this.startMockTickerUpdates(symbol);
      return;
    }

    const streamName = `${symbol.toLowerCase()}usdt@ticker`;
    const wsUrl = `wss://stream.binance.com:9443/ws/${streamName}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log(`✅ Ticker WebSocket connected for ${symbol}`);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleTickerMessage(symbol, data);
      } catch (error) {
        console.error('Error parsing ticker message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error(`Ticker WebSocket error for ${symbol}:`, error);
    };
    
    ws.onclose = () => {
      console.log(`Ticker WebSocket closed for ${symbol}`);
      this.reconnectTicker(symbol);
    };
    
    (this as any)[`ticker_ws_${symbol}`] = ws;
  }

  private handleOrderBookMessage(symbol: string, data: any) {
    if (!data.bids || !data.asks) return;
    
    const orderBookData: OrderBookData = {
      bids: data.bids.slice(0, 15).map(([price, quantity]: [string, string]) => ({
        price: parseFloat(price),
        quantity: parseFloat(quantity),
        total: parseFloat(price) * parseFloat(quantity)
      })),
      asks: data.asks.slice(0, 15).map(([price, quantity]: [string, string]) => ({
        price: parseFloat(price),
        quantity: parseFloat(quantity),
        total: parseFloat(price) * parseFloat(quantity)
      })),
      lastUpdateId: data.lastUpdateId,
      symbol,
      timestamp: Date.now()
    };
    
    // Notify subscribers
    const subscribers = this.subscribers.get(symbol);
    if (subscribers) {
      subscribers.forEach(callback => callback(orderBookData));
    }
  }

  private handleTickerMessage(symbol: string, data: any) {
    const tickerData: TickerData = {
      symbol: data.s,
      lastPrice: parseFloat(data.c),
      bidPrice: parseFloat(data.b),
      askPrice: parseFloat(data.a),
      volume: parseFloat(data.v),
      high24h: parseFloat(data.h),
      low24h: parseFloat(data.l),
      priceChange: parseFloat(data.p),
      priceChangePercent: parseFloat(data.P)
    };
    
    const subscribers = this.tickerSubscribers.get(symbol);
    if (subscribers) {
      subscribers.forEach(callback => callback(tickerData));
    }
  }

  private reconnectOrderBook(symbol: string) {
    const attempts = this.reconnectAttempts.get(symbol) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        console.log(`🔄 Reconnecting order book for ${symbol} (attempt ${attempts + 1})`);
        this.reconnectAttempts.set(symbol, attempts + 1);
        this.connectOrderBook(symbol);
      }, this.reconnectDelay * Math.pow(2, attempts));
    } else {
      console.log(`⚠️ Max reconnection attempts reached for ${symbol}, switching to mock mode`);
      this.mockMode = true;
      this.startMockUpdates(symbol);
    }
  }

  private reconnectTicker(symbol: string) {
    const attempts = this.reconnectAttempts.get(`ticker_${symbol}`) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        console.log(`🔄 Reconnecting ticker for ${symbol} (attempt ${attempts + 1})`);
        this.reconnectAttempts.set(`ticker_${symbol}`, attempts + 1);
        this.connectTicker(symbol);
      }, this.reconnectDelay * Math.pow(2, attempts));
    }
  }

  private disconnectOrderBook(symbol: string) {
    const ws = (this as any)[`ws_${symbol}`];
    if (ws) {
      ws.close();
      delete (this as any)[`ws_${symbol}`];
    }
  }

  private disconnectTicker(symbol: string) {
    const ws = (this as any)[`ticker_ws_${symbol}`];
    if (ws) {
      ws.close();
      delete (this as any)[`ticker_ws_${symbol}`];
    }
  }

  // Mock updates for development
  private startMockUpdates(symbol: string) {
    const basePrice = symbol === 'BTC' ? 67668.18 : 
                     symbol === 'ETH' ? 3492.89 : 
                     symbol === 'BNB' ? 603.60 : 
                     symbol === 'SOL' ? 176.88 : 
                     symbol === 'XRP' ? 0.62 : 1.00;
    
    const interval = setInterval(() => {
      const mockData = generateMockOrderBook(symbol, basePrice * (1 + (Math.random() - 0.5) * 0.01));
      
      const subscribers = this.subscribers.get(symbol);
      if (subscribers && subscribers.size > 0) {
        subscribers.forEach(callback => callback(mockData));
      } else {
        clearInterval(interval);
      }
    }, 2000);
    
    (this as any)[`mock_${symbol}`] = interval;
  }

  private startMockTickerUpdates(symbol: string) {
    const basePrice = symbol === 'BTC' ? 67668.18 : 
                     symbol === 'ETH' ? 3492.89 : 
                     symbol === 'BNB' ? 603.60 : 
                     symbol === 'SOL' ? 176.88 : 
                     symbol === 'XRP' ? 0.62 : 1.00;
    
    const interval = setInterval(() => {
      const price = basePrice * (1 + (Math.random() - 0.5) * 0.01);
      const tickerData: TickerData = {
        symbol: `${symbol}USDT`,
        lastPrice: price,
        bidPrice: price * 0.999,
        askPrice: price * 1.001,
        volume: Math.random() * 1000 + 100,
        high24h: price * 1.02,
        low24h: price * 0.98,
        priceChange: price * 0.01 * (Math.random() - 0.5),
        priceChangePercent: (Math.random() - 0.5) * 2
      };
      
      const subscribers = this.tickerSubscribers.get(symbol);
      if (subscribers && subscribers.size > 0) {
        subscribers.forEach(callback => callback(tickerData));
      } else {
        clearInterval(interval);
      }
    }, 3000);
    
    (this as any)[`mock_ticker_${symbol}`] = interval;
  }
}

// Create singleton instance
export const orderBookService = new OrderBookService();

// React hook for using order book
export const useOrderBook = (symbol: string) => {
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [ticker, setTicker] = useState<TickerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    
    // Subscribe to order book updates
    const unsubscribeOrderBook = orderBookService.subscribeOrderBook(symbol, (data) => {
      setOrderBook(data);
      setLoading(false);
    });
    
    // Subscribe to ticker updates
    const unsubscribeTicker = orderBookService.subscribeTicker(symbol, (data) => {
      setTicker(data);
    });
    
    // Set timeout for loading
    const timeout = setTimeout(() => {
      setLoading(false);
      if (!orderBook) {
        setError('Order book loading timeout');
      }
    }, 5000);
    
    return () => {
      unsubscribeOrderBook();
      unsubscribeTicker();
      clearTimeout(timeout);
    };
  }, [symbol]);

  return { orderBook, ticker, loading, error };
};