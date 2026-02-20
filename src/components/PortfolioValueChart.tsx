import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { formatCurrency } from '@/utils/formatCurrency';

export default function PortfolioValueChart({ valueHistory }: { valueHistory: { timestamp: number; value: number }[] }) {
  const { currency } = useUserSettings();
  
  // Filter out invalid data points
  const validHistory = valueHistory.filter(point => 
    point && 
    typeof point.value === 'number' && 
    !isNaN(point.value) && 
    isFinite(point.value) &&
    typeof point.timestamp === 'number' &&
    !isNaN(point.timestamp)
  );
  
  // Format data for recharts
  const data = validHistory.map(point => ({
    time: new Date(point.timestamp).toLocaleTimeString(),
    value: Number(point.value.toFixed(2)),
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" minTickGap={32} />
          <YAxis dataKey="value" domain={['auto', 'auto']} tickFormatter={v => formatCurrency(v, currency)}/>
          <Tooltip formatter={v => formatCurrency(v as number, currency)} />
          <Line type="monotone" dataKey="value" stroke="#facc15" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 