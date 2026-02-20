import React from 'react';
import MiniChart from './MiniChart';

export interface AssetRow {
  icon: string; // URL or emoji
  name: string;
  volume: string;
  miniChartData: number[];
  lastPrice: string;
  change: number;
}

export default function AssetTable({ assets, onSelect }: { assets: AssetRow[], onSelect: (row: AssetRow) => void }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b">
          <th className="text-left py-2 px-2">Name</th>
          <th className="text-left py-2 px-2">Volume</th>
          <th className="text-left py-2 px-2">Chart</th>
          <th className="text-left py-2 px-2">Last Price</th>
          <th className="text-left py-2 px-2">Change %</th>
        </tr>
      </thead>
      <tbody>
        {assets.map(row => (
          <tr key={row.name} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => onSelect(row)}>
            <td className="py-2 px-2 flex items-center gap-2">
              <span>{row.icon}</span>
              <span className="font-semibold">{row.name}</span>
            </td>
            <td className="py-2 px-2 text-xs text-gray-500">{row.volume}</td>
            <td className="py-2 px-2">
              <MiniChart data={row.miniChartData} />
            </td>
            <td className="py-2 px-2 font-semibold">{row.lastPrice}</td>
            <td className="py-2 px-2">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${row.change > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {row.change > 0 ? '+' : ''}{row.change}%
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
} 