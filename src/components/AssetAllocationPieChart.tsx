import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Asset } from '@/contexts/WalletContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { formatCurrency } from '@/utils/formatCurrency';

const COLORS = ['#facc15', '#6366f1', '#10b981', '#f472b6', '#f87171', '#34d399', '#60a5fa', '#fbbf24'];

export default function AssetAllocationPieChart({ portfolio }: { portfolio: Asset[] }) {
  const { currency } = useUserSettings();
  
  // Filter out invalid assets
  const validPortfolio = portfolio.filter(asset => 
    asset && 
    typeof asset.value === 'number' && 
    !isNaN(asset.value) && 
    isFinite(asset.value) &&
    asset.value > 0
  );
  
  const total = validPortfolio.reduce((sum, a) => sum + a.value, 0);
  const data = validPortfolio.map((a, i) => ({
    name: a.symbol,
    value: Number(a.value.toFixed(2)),
    percent: total ? ((a.value / total) * 100).toFixed(1) : '0.0',
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, percent }) => `${name}: ${percent}%`}
          >
            {data.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number, n: string) => [formatCurrency(v, currency), n]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
} 