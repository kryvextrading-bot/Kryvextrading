import { useState, useEffect } from 'react';

export function useBinanceStream(symbol: string, type: 'trade' | 'depth' | 'kline', interval = '1m') {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    if (!symbol) return;
    let stream = `${symbol.toLowerCase()}@${type}`;
    if (type === 'kline') stream += `_${interval}`;
    if (type === 'depth') stream += '5@100ms';
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${stream}`);
    ws.onmessage = e => setData(JSON.parse(e.data));
    return () => ws.close();
  }, [symbol, type, interval]);
  return data;
}

export default useBinanceStream; 