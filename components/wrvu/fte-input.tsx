'use client';

import { FTE } from '@/types';
import { Label } from '@/components/ui/label';

interface FTEInputProps {
  value: FTE;
  onChange: (value: FTE) => void;
}

export function FTEInput({ value, onChange }: FTEInputProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">FTE (Full-Time Equivalent)</Label>
          <span className="text-2xl font-bold text-primary">{value.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.01"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) as FTE)}
          className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>0.1</span>
          <span>0.5</span>
          <span>1.0</span>
        </div>
      </div>
    </div>
  );
}




