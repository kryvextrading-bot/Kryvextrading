import { useState, useEffect, useCallback, useRef } from 'react';
import { unifiedTradingService } from './unified-trading-service';

export interface OrderBookLevel {
  price: number;
  quantity: number;
  total: number;
}

export interface OrderBookData {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
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

export interface RecentTrade {
  id: number;
  price: number;
  quantity: number;
  time: number;
  isBuyerMaker: boolean;
}

class MarketDataWebSocketService {
  private connections: Map<string, {
    ws: WebSocket | null;
    subscribers: Set<(data: OrderBookData) => void>;
    reconnectAttempts: number;
    reconnectTimer?: NodeJS.Timeout;
    lastData?: OrderBookData;
  }> = new Map();

  private tickerConnections: Map<string, {
    ws: WebSocket | null;
    subscribers: Set<(data: TickerData) => void>;
    reconnectAttempts: number;
    reconnectTimer?: NodeJS.Timeout;
    lastData?: TickerData;
  }> = new Map();

  private tradeConnections: Map<string, {
    ws: WebSocket | null;
    subscribers: Set<(data: RecentTrade[]) => void>;
    reconnectAttempts: number;
    reconnectTimer?: NodeJS.Timeout;
  }> = new Map();

  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private mockMode = false;

  constructor() {
    // Check if we should use mock mode (for development)
    this.mockMode = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  }

  // Subscribe to order book updates
  subscribeOrderBook(symbol: string, callback: (data: OrderBookData) => void): () => void {
    const normalizedSymbol = symbol.toUpperCase().replace('USDT', '');
    
    if (this.mockMode) {
      return this.subscribeMockOrderBook(normalizedSymbol, callback);
    }

    if (!this.connections.has(normalizedSymbol)) {
      this.connections.set(normalizedSymbol, {
        ws: null,
        subscribers: new Set(),
        reconnectAttempts: 0
      });
      this.connectOrderBook(normalizedSymbol);
    }

    const connection = this.connections.get(normalizedSymbol)!;
    connection.subscribers.add(callback);

    // If we have cached data, send it immediately
    if (connection.lastData) {
      callback(connection.lastData);
    }

    // Return unsubscribe function
    return () => {
      const conn = this.connections.get(normalizedSymbol);
      if (conn) {
        conn.subscribers.delete(callback);
        if (conn.subscribers.size === 0) {
          // Close WebSocket if no subscribers
          if (conn.ws) {
            conn.ws.close();
          }
          if (conn.reconnectTimer) {
            clearTimeout(conn.reconnectTimer);
          }
          this.connections.delete(normalizedSymbol);
        }
      }
    };
  }

  // Subscribe to 24hr ticker updates
  subscribeTicker(symbol: string, callback: (data: TickerData) => void): () => void {
    const normalizedSymbol = symbol.toUpperCase().replace('USDT', '');
    
    if (this.mockMode) {
      return this.subscribeMockTicker(normalizedSymbol, callback);
    }

    if (!this.tickerConnections.has(normalizedSymbol)) {
      this.tickerConnections.set(normalizedSymbol, {
        ws: null,
        subscribers: new Set(),
        reconnectAttempts: 0
      });
      this.connectTicker(normalizedSymbol);
    }

    const connection = this.tickerConnections.get(normalizedSymbol)!;
    connection.subscribers.add(callback);

    // If we have cached data, send it immediately
    if (connection.lastData) {
      callback(connection.lastData);
    }

    return () => {
      const conn = this.tickerConnections.get(normalizedSymbol);
      if (conn) {
        conn.subscribers.delete(callback);
        if (conn.subscribers.size === 0) {
          if (conn.ws) {
            conn.ws.close();
          }
          if (conn.reconnectTimer) {
            clearTimeout(conn.reconnectTimer);
          }
          this.tickerConnections.delete(normalizedSymbol);
        }
      }
    };
  }

  // Subscribe to recent trades
  subscribeRecentTrades(symbol: string, callback: (data: RecentTrade[]) => void): () => void {
    const normalizedSymbol = symbol.toUpperCase().replace('USDT', '');
    
    if (this.mockMode) {
      return this.subscribeMockTrades(normalizedSymbol, callback);
    }

    if (!this.tradeConnections.has(normalizedSymbol)) {
      this.tradeConnections.set(normalizedSymbol, {
        ws: null,
        subscribers: new Set(),
        reconnectAttempts: 0
      });
      this.connectRecentTrades(normalizedSymbol);
    }

    const connection = this.tradeConnections.get(normalizedSymbol)!;
    connection.subscribers.add(callback);

    return () => {
      const conn = this.tradeConnections.get(normalizedSymbol);
      if (conn) {
        conn.subscribers.delete(callback);
        if (conn.subscribers.size === 0) {
          if (conn.ws) {
            conn.ws.close();
          }
          if (conn.reconnectTimer) {
            clearTimeout(conn.reconnectTimer);
          }
          this.tradeConnections.delete(normalizedSymbol);
        }
      }
    };
  }

  private connectOrderBook(symbol: string) {
    const connection = this.connections.get(symbol);
    if (!connection) return;

    try {
      const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}usdt@depth20@100ms`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log(`✅ Binance OrderBook WebSocket connected for ${symbol}`);
        connection.reconnectAttempts = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.bids && data.asks) {
            const orderBookData: OrderBookData = {
              bids: data.bids.slice(0, 20).map(([price, qty]: [string, string]) => ({
                price: parseFloat(price),
                quantity: parseFloat(qty),
                total: parseFloat(price) * parseFloat(qty)
              })),
              asks: data.asks.slice(0, 20).map(([price, qty]: [string, string]) => ({
                price: parseFloat(price),
                quantity: parseFloat(qty),
                total: parseFloat(price) * parseFloat(qty)
              })),
              lastUpdateId: data.lastUpdateId,
              symbol,
              timestamp: Date.now()
            };

            connection.lastData = orderBookData;
            
            // Notify all subscribers
            connection.subscribers.forEach(callback => {
              try {
                callback(orderBookData);
              } catch (error) {
                console.error('Error in order book subscriber:', error);
              }
            });
          }
        } catch (error) {
          console.error('Error parsing order book message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error(`❌ Binance OrderBook WebSocket error for ${symbol}:`, error);
      };

      ws.onclose = () => {
        console.log(`🔌 Binance OrderBook WebSocket closed for ${symbol}`);
        this.reconnectOrderBook(symbol);
      };

      connection.ws = ws;
    } catch (error) {
      console.error(`Failed to connect order book for ${symbol}:`, error);
      this.reconnectOrderBook(symbol);
    }
  }

  private connectTicker(symbol: string) {
    const connection = this.tickerConnections.get(symbol);
    if (!connection) return;

    try {
      const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}usdt@ticker`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log(`✅ Binance Ticker WebSocket connected for ${symbol}`);
        connection.reconnectAttempts = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
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

          connection.lastData = tickerData;

          // Notify all subscribers
          connection.subscribers.forEach(callback => {
            try {
              callback(tickerData);
            } catch (error) {
              console.error('Error in ticker subscriber:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing ticker message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error(`❌ Binance Ticker WebSocket error for ${symbol}:`, error);
      };

      ws.onclose = () => {
        console.log(`🔌 Binance Ticker WebSocket closed for ${symbol}`);
        this.reconnectTicker(symbol);
      };

      connection.ws = ws;
    } catch (error) {
      console.error(`Failed to connect ticker for ${symbol}:`, error);
      this.reconnectTicker(symbol);
    }
  }

  private connectRecentTrades(symbol: string) {
    const connection = this.tradeConnections.get(symbol);
    if (!connection) return;

    try {
      const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}usdt@trade`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log(`✅ Binance Trade WebSocket connected for ${symbol}`);
        connection.reconnectAttempts = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          const trade: RecentTrade = {
            id: data.t,
            price: parseFloat(data.p),
            quantity: parseFloat(data.q),
            time: data.T,
            isBuyerMaker: data.m
          };

          // Notify all subscribers with the latest trade
          connection.subscribers.forEach(callback => {
            try {
              callback([trade]);
            } catch (error) {
              console.error('Error in trade subscriber:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing trade message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error(`❌ Binance Trade WebSocket error for ${symbol}:`, error);
      };

      ws.onclose = () => {
        console.log(`🔌 Binance Trade WebSocket closed for ${symbol}`);
        this.reconnectTrades(symbol);
      };

      connection.ws = ws;
    } catch (error) {
      console.error(`Failed to connect trades for ${symbol}:`, error);
      this.reconnectTrades(symbol);
    }
  }

  private reconnectOrderBook(symbol: string) {
    const connection = this.connections.get(symbol);
    if (!connection) return;

    if (connection.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, connection.reconnectAttempts);
      console.log(`🔄 Reconnecting order book for ${symbol} in ${delay}ms (attempt ${connection.reconnectAttempts + 1})`);

      connection.reconnectTimer = setTimeout(() => {
        connection.reconnectAttempts++;
        this.connectOrderBook(symbol);
      }, delay);
    } else {
      console.log(`⚠️ Max reconnection attempts reached for ${symbol} order book, switching to mock mode`);
      this.mockMode = true;
    }
  }

  private reconnectTicker(symbol: string) {
    const connection = this.tickerConnections.get(symbol);
    if (!connection) return;

    if (connection.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, connection.reconnectAttempts);
      console.log(`🔄 Reconnecting ticker for ${symbol} in ${delay}ms (attempt ${connection.reconnectAttempts + 1})`);

      connection.reconnectTimer = setTimeout(() => {
        connection.reconnectAttempts++;
        this.connectTicker(symbol);
      }, delay);
    }
  }

  private reconnectTrades(symbol: string) {
    const connection = this.tradeConnections.get(symbol);
    if (!connection) return;

    if (connection.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, connection.reconnectAttempts);
      console.log(`🔄 Reconnecting trades for ${symbol} in ${delay}ms (attempt ${connection.reconnectAttempts + 1})`);

      connection.reconnectTimer = setTimeout(() => {
        connection.reconnectAttempts++;
        this.connectRecentTrades(symbol);
      }, delay);
    }
  }

  // Mock data generators for development
  private subscribeMockOrderBook(symbol: string, callback: (data: OrderBookData) => void): () => void {
    const generateMockOrderBook = (basePrice: number = 50000): OrderBookData => {
      const bids: OrderBookLevel[] = [];
      const asks: OrderBookLevel[] = [];

      for (let i = 1; i <= 15; i++) {
        bids.push({
          price: basePrice * (1 - i * 0.001),
          quantity: Math.random() * 2 + 0.1,
          total: basePrice * (1 - i * 0.001) * (Math.random() * 2 + 0.1)
        });
        
        asks.push({
          price: basePrice * (1 + i * 0.001),
          quantity: Math.random() * 2 + 0.1,
          total: basePrice * (1 + i * 0.001) * (Math.random() * 2 + 0.1)
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

    // Initial data
    const initialData = generateMockOrderBook();
    callback(initialData);

    // Update every 2 seconds
    const interval = setInterval(() => {
      const mockData = generateMockOrderBook();
      callback(mockData);
    }, 2000);

    return () => clearInterval(interval);
  }

  private subscribeMockTicker(symbol: string, callback: (data: TickerData) => void): () => void {
    const generateMockTicker = (): TickerData => {
      const basePrice = symbol === 'BTC' ? 67668.18 : 
                       symbol === 'ETH' ? 3492.89 : 
                       symbol === 'BNB' ? 603.60 : 
                       symbol === 'SOL' ? 176.88 : 50000;
      
      const price = basePrice * (1 + (Math.random() - 0.5) * 0.01);
      
      return {
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
    };

    // Initial data
    callback(generateMockTicker());

    // Update every 3 seconds
    const interval = setInterval(() => {
      callback(generateMockTicker());
    }, 3000);

    return () => clearInterval(interval);
  }

  private subscribeMockTrades(symbol: string, callback: (data: RecentTrade[]) => void): () => void {
    const generateMockTrade = (): RecentTrade => {
      const basePrice = symbol === 'BTC' ? 67668.18 : 
                       symbol === 'ETH' ? 3492.89 : 
                       symbol === 'BNB' ? 603.60 : 
                       symbol === 'SOL' ? 176.88 : 50000;
      
      return {
        id: Date.now() + Math.floor(Math.random() * 1000),
        price: basePrice * (1 + (Math.random() - 0.5) * 0.002),
        quantity: Math.random() * 2 + 0.1,
        time: Date.now(),
        isBuyerMaker: Math.random() > 0.5
      };
    };

    // Generate initial batch
    const initialTrades = Array(10).fill(0).map(() => generateMockTrade());
    callback(initialTrades);

    // Update every second with new trade
    const interval = setInterval(() => {
      callback([generateMockTrade()]);
    }, 1000);

    return () => clearInterval(interval);
  }

  // Get a single price for a symbol (for one-time use)
  async getPrice(symbol: string): Promise<number> {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}USDT`);
      const data = await response.json();
      return parseFloat(data.price);
    } catch (error) {
      console.error('Error fetching price:', error);
      return 0;
    }
  }

  // Get 24hr ticker stats
  async get24hrStats(symbol: string): Promise<TickerData | null> {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol.toUpperCase()}USDT`);
      const data = await response.json();
      
      return {
        symbol: data.symbol,
        lastPrice: parseFloat(data.lastPrice),
        bidPrice: parseFloat(data.bidPrice),
        askPrice: parseFloat(data.askPrice),
        volume: parseFloat(data.volume),
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice),
        priceChange: parseFloat(data.priceChange),
        priceChangePercent: parseFloat(data.priceChangePercent)
      };
    } catch (error) {
      console.error('Error fetching 24hr stats:', error);
      return null;
    }
  }
}

// Create singleton instance
export const marketDataService = new MarketDataWebSocketService();

// React hook for using order book
export const useOrderBook = (symbol: string) => {
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;

    setLoading(true);
    setError(null);

    const unsubscribe = marketDataService.subscribeOrderBook(symbol, (data) => {
      setOrderBook(data);
      setLoading(false);
    });

    // Set timeout for loading
    const timeout = setTimeout(() => {
      setLoading(false);
      if (!orderBook) {
        setError('Connection timeout');
      }
    }, 10000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [symbol]);

  return { orderBook, loading, error };
};

// React hook for using ticker
export const useTicker = (symbol: string) => {
  const [ticker, setTicker] = useState<TickerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;

    setLoading(true);
    setError(null);

    const unsubscribe = marketDataService.subscribeTicker(symbol, (data) => {
      setTicker(data);
      setLoading(false);
    });

    // Fetch initial data via REST
    marketDataService.get24hrStats(symbol).then(data => {
      if (data) {
        setTicker(data);
        setLoading(false);
      }
    });

    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [symbol]);

  return { ticker, loading, error };
};

// React hook for using recent trades
export const useRecentTrades = (symbol: string) => {
  const [trades, setTrades] = useState<RecentTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;

    setLoading(true);

    const unsubscribe = marketDataService.subscribeRecentTrades(symbol, (newTrades) => {
      setTrades(prev => {
        const updated = [...newTrades, ...prev];
        // Keep only last 50 trades
        return updated.slice(0, 50);
      });
      setLoading(false);
    });

    // Fetch initial trades via REST
    fetch(`https://api.binance.com/api/v3/trades?symbol=${symbol.toUpperCase()}USDT&limit=50`)
      .then(res => res.json())
      .then(data => {
        const formattedTrades = data.map((t: any) => ({
          id: t.id,
          price: parseFloat(t.price),
          quantity: parseFloat(t.qty),
          time: t.time,
          isBuyerMaker: t.isBuyerMaker
        }));
        setTrades(formattedTrades);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching recent trades:', err);
        setLoading(false);
      });

    return () => {
      unsubscribe();
    };
  }, [symbol]);

  return { trades, loading };
};

// Combined hook for all market data
export const useMarketData = (symbol: string) => {
  const { orderBook, loading: orderBookLoading, error: orderBookError } = useOrderBook(symbol);
  const { ticker, loading: tickerLoading, error: tickerError } = useTicker(symbol);
  const { trades, loading: tradesLoading } = useRecentTrades(symbol);

  return {
    orderBook,
    ticker,
    trades,
    loading: orderBookLoading || tickerLoading || tradesLoading,
    error: orderBookError || tickerError
  };
};