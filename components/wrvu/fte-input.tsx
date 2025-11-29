'use client';

import * as React from 'react';
import { FTE } from '@/types';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';

interface FTEInputProps {
  value: FTE;
  onChange: (value: FTE) => void;
}

export function FTEInput({ value, onChange }: FTEInputProps) {
  const step = 0.01;
  const min = 0;
  const max = 1.0;

  const handleIncrement = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const currentValue = value ?? 0;
    const newValue = Number((currentValue + step).toFixed(2));
    onChange(Math.min(newValue, max) as FTE);
  }, [value, step, max, onChange]);

  const handleDecrement = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const currentValue = value ?? 0;
    const newValue = Number((currentValue - step).toFixed(2));
    onChange(Math.max(newValue, min) as FTE);
  }, [value, step, min, onChange]);

  const currentValue = value ?? 0;

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        FTE
      </Label>
      <div className="flex items-center gap-2">
        <div className="relative w-20">
          <NumberInput
            value={currentValue}
            onChange={(val) => {
              // Constrain value to FTE range
              const constrained = Math.max(min, Math.min(max, val));
              onChange(constrained as FTE);
            }}
            min={min}
            max={max}
            step={step}
            className="text-center"
          />
        </div>
        <div className="flex gap-1.5 sm:gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 sm:p-0.5 flex-shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDecrement}
            className="h-11 w-11 sm:h-8 sm:w-8 p-0 hover:bg-primary hover:text-white rounded-md active:scale-95 transition-transform touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center"
            disabled={currentValue <= min}
            aria-label="Decrease FTE"
          >
            <Minus className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleIncrement}
            className="h-11 w-11 sm:h-8 sm:w-8 p-0 hover:bg-primary hover:text-white rounded-md active:scale-95 transition-transform touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center"
            disabled={currentValue >= max}
            aria-label="Increase FTE"
          >
            <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}




