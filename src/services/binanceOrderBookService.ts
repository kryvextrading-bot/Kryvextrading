import { useState, useEffect, useCallback, useRef } from 'react';

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

class BinanceOrderBookService {
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
  }> = new Map();

  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  // Subscribe to order book updates
  subscribeOrderBook(symbol: string, callback: (data: OrderBookData) => void): () => void {
    const normalizedSymbol = symbol.toUpperCase().replace('USDT', '');
    
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
      console.log(`⚠️ Max reconnection attempts reached for ${symbol} order book`);
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
    } else {
      console.log(`⚠️ Max reconnection attempts reached for ${symbol} ticker`);
    }
  }

  // Get mock data for fallback
  getMockOrderBook(symbol: string, basePrice: number): OrderBookData {
    const bids: OrderBookLevel[] = [];
    const asks: OrderBookLevel[] = [];

    // Generate realistic order book
    for (let i = 1; i <= 10; i++) {
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
  }
}

// Create singleton instance
const binanceOrderBookService = new BinanceOrderBookService();

// React hook for using order book
export const useBinanceOrderBook = (symbol: string) => {
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [ticker, setTicker] = useState<TickerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;

    setLoading(true);
    setError(null);

    // Subscribe to order book
    const unsubscribeOrderBook = binanceOrderBookService.subscribeOrderBook(symbol, (data) => {
      setOrderBook(data);
      setLoading(false);
    });

    // Subscribe to ticker
    const unsubscribeTicker = binanceOrderBookService.subscribeTicker(symbol, (data) => {
      setTicker(data);
    });

    // Set timeout for loading
    const timeout = setTimeout(() => {
      setLoading(false);
      if (!orderBook) {
        setError('Connection timeout');
      }
    }, 10000);

    return () => {
      unsubscribeOrderBook();
      unsubscribeTicker();
      clearTimeout(timeout);
    };
  }, [symbol]);

  return { orderBook, ticker, loading, error };
};

// Simple mock service for development
export const useMockOrderBook = (symbol: string, basePrice: number) => {
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // Generate initial mock data
    const mockService = new BinanceOrderBookService();
    const mockData = mockService.getMockOrderBook(symbol, basePrice);
    setOrderBook(mockData);
    setLoading(false);

    // Update mock data periodically
    const interval = setInterval(() => {
      setOrderBook(prev => {
        if (!prev) return prev;
        
        // Add small random variations
        const updatedBids = prev.bids.map(bid => ({
          ...bid,
          price: bid.price * (1 + (Math.random() - 0.5) * 0.002),
          quantity: bid.quantity * (1 + (Math.random() - 0.5) * 0.1)
        }));
        
        const updatedAsks = prev.asks.map(ask => ({
          ...ask,
          price: ask.price * (1 + (Math.random() - 0.5) * 0.002),
          quantity: ask.quantity * (1 + (Math.random() - 0.5) * 0.1)
        }));

        return {
          ...prev,
          bids: updatedBids,
          asks: updatedAsks,
          timestamp: Date.now()
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [symbol, basePrice]);

  return { orderBook, loading, error: null };
};
