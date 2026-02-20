import React from 'react';

const categories = ['Futures', 'USStock', 'Forex', 'Crypto', 'ETF'];

export default function NavigationTabs({ selected, onSelect }: { selected: string, onSelect: (cat: string) => void }) {
  return (
    <div className="flex gap-4 border-b mb-2">
      {categories.map(cat => (
        <button
          key={cat}
          className={`py-2 px-4 text-lg font-medium border-b-2 transition-colors ${selected === cat ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
          onClick={() => onSelect(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
} 