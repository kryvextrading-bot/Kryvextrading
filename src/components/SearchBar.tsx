import React from 'react';

export default function SearchBar({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      placeholder="Search"
      className="w-full max-w-xl p-2 rounded bg-gray-100 border focus:outline-none focus:ring"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
} 