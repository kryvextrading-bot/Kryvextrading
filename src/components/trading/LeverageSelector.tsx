import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { LEVERAGE_OPTIONS } from '@/constants/trading';

interface LeverageSelectorProps {
  value: number;
  onChange: (leverage: number) => void;
}

export const LeverageSelector: React.FC<LeverageSelectorProps> = ({
  value,
  onChange
}) => {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="w-24 bg-[#181A20] border-[#2B3139]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LEVERAGE_OPTIONS.map(lev => (
          <SelectItem key={lev} value={String(lev)}>
            {lev}x
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LeverageSelector;