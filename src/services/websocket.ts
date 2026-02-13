// Mock WebSocket service for trading data
export class MockWebSocket {
  private url: string;
  private onMessage: ((event: any) => void) | null = null;
  private onOpen: (() => void) | null = null;
  private onClose: (() => void) | null = null;
  private onError: ((event: any) => void) | null = null;
  private interval: NodeJS.Timeout | null = null;
  private isConnected = false;

  constructor(url: string) {
    this.url = url;
  }

  addEventListener(event: string, callback: any) {
    switch (event) {
      case 'message':
        this.onMessage = callback;
        break;
      case 'open':
        this.onOpen = callback;
        break;
      case 'close':
        this.onClose = callback;
        break;
      case 'error':
        this.onError = callback;
        break;
    }
  }

  send(data: string) {
    // Mock send - in real implementation this would send to server
    console.log('Mock WebSocket send:', data);
  }

  close() {
    this.isConnected = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (this.onClose) {
      this.onClose();
    }
  }

  // Simulate connection
  connect() {
    this.isConnected = true;
    if (this.onOpen) {
      this.onOpen();
    }

    // Simulate real-time price updates
    this.interval = setInterval(() => {
      if (this.isConnected && this.onMessage) {
        const mockData = {
          type: 'trade',
          data: {
            symbol: 'BTCUSDT',
            price: (119000 + Math.random() * 2000).toFixed(2),
            quantity: (Math.random() * 10).toFixed(3),
            time: Date.now(),
            isBuyerMaker: Math.random() > 0.5,
          }
        };
        
        this.onMessage({
          data: JSON.stringify(mockData)
        });
      }
    }, 1000);
  }
}

// Factory function to create mock WebSocket
export const createMockWebSocket = (url: string): MockWebSocket => {
  const ws = new MockWebSocket(url);
  // Auto-connect after a short delay to simulate real WebSocket behavior
  setTimeout(() => ws.connect(), 100);
  return ws;
};

// Export as default for compatibility
export default createMockWebSocket; 