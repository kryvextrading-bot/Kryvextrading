// WebSocket Service - Clean Implementation without Mock Data

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface WebSocketOptions {
  autoConnect?: boolean;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class EnhancedMockWebSocket {
  private url: string;
  private options: WebSocketOptions;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private readyState: number = 0; // 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 3000;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(url: string, options: WebSocketOptions = {}) {
    this.url = url;
    this.options = {
      autoConnect: true,
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      ...options
    };
    this.maxReconnectAttempts = this.options.maxReconnectAttempts || 5;
    this.reconnectInterval = this.options.reconnectInterval || 3000;

    if (this.options.autoConnect) {
      setTimeout(() => this.connect(), 100);
    }
  }

  // WebSocket API methods
  connect(): void {
    this.readyState = 0; // CONNECTING
    this.emit('open');
    this.readyState = 1; // OPEN
    
    console.log('WebSocket connected to:', this.url);
  }

  close(): void {
    this.readyState = 2; // CLOSING
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.readyState = 3; // CLOSED
    this.emit('close');
  }

  send(data: string): void {
    if (this.readyState !== 1) {
      throw new Error('WebSocket is not open');
    }
    
    try {
      const message = JSON.parse(data);
      console.log('WebSocket message sent:', message);
      // In a real implementation, this would send to server
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  // Event handling
  addEventListener(type: string, listener: Function): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: Function): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  private emit(type: string, event?: any): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in WebSocket event listener:', error);
        }
      });
    }
  }

  // Additional utility methods
  subscribe(channel: string, callback: Function): void {
    console.log('Subscribed to channel:', channel);
    // In a real implementation, this would send subscription message to server
  }

  unsubscribe(channel: string): void {
    console.log('Unsubscribed from channel:', channel);
    // In a real implementation, this would send unsubscribe message to server
  }

  getConnectionState(): number {
    return this.readyState;
  }

  // Getters for WebSocket compatibility
  get CONNECTING(): number { return 0; }
  get OPEN(): number { return 1; }
  get CLOSING(): number { return 2; }
  get CLOSED(): number { return 3; }
}

// Factory function
export const createWebSocket = (url: string, options?: WebSocketOptions): EnhancedMockWebSocket => {
  return new EnhancedMockWebSocket(url, options);
};

// Legacy export for backward compatibility
export const createMockWebSocket = createWebSocket;

// React hook for WebSocket
export const useWebSocket = (url: string, options?: WebSocketOptions) => {
  const [ws, setWs] = useState<EnhancedMockWebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    const websocket = new EnhancedMockWebSocket(url, options);
    
    websocket.addEventListener('open', () => {
      setIsConnected(true);
    });

    websocket.addEventListener('close', () => {
      setIsConnected(false);
    });

    websocket.addEventListener('message', (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        setLastMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [url]);

  return {
    ws,
    isConnected,
    lastMessage,
    send: (data: any) => ws?.send(JSON.stringify(data)),
    subscribe: (channel: string, callback: Function) => ws?.subscribe(channel, callback),
    unsubscribe: (channel: string) => ws?.unsubscribe(channel)
  };
};

// Import useState for the hook
import { useState, useEffect } from 'react';
