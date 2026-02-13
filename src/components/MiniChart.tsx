import React from 'react';

export default function MiniChart({ data }: { data: number[] }) {
  if (!data || !data.length) return <div className="w-20 h-6 bg-blue-100 rounded" />;
  
  // Filter out invalid numbers (NaN, null, undefined)
  const validData = data.filter(v => typeof v === 'number' && !isNaN(v) && isFinite(v));
  
  if (!validData.length) return <div className="w-20 h-6 bg-blue-100 rounded" />;
  
  const max = Math.max(...validData);
  const min = Math.min(...validData);
  
  const points = validData.map((v, i) => {
    const x = (i / (validData.length - 1)) * 80;
    const y = 24 - ((v - min) / (max - min || 1)) * 24;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width={80} height={24} className="block">
      <polyline
        fill="none"
        stroke="#60a5fa"
        strokeWidth={2}
        points={points}
      />
    </svg>
  );
} 