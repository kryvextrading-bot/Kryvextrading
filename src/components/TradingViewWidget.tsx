import React, { useEffect, useRef } from 'react';

interface TradingViewWidgetProps {
  symbol: string; // e.g., 'BTCUSDT'
}

const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({ symbol }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Remove previous widget if any
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    // Load TradingView script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      if (window.TradingView) {
        // @ts-ignore
        new window.TradingView.widget({
          autosize: true,
          symbol: symbol,
          interval: '15',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#181A20',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          container_id: containerRef.current?.id,
        });
      }
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [symbol]);

  return (
    <div
      id={`tv-widget-${symbol}`}
      ref={containerRef}
      className="tradingview-widget-container"
    >
      <div className="text-white text-center">Loading chart...</div>
    </div>
  );
};

export default TradingViewWidget; 