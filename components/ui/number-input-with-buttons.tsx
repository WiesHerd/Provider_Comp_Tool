'use client';

import * as React from 'react';
import { NumberInput, NumberInputProps } from './number-input';
import { Label } from './label';
import { Button } from './button';
import { Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface NumberInputWithButtonsProps extends Omit<NumberInputProps, 'label'> {
  label?: string;
  icon?: React.ReactNode;
  step?: number;
  min?: number;
  max?: number;
}

export const NumberInputWithButtons = React.forwardRef<
  HTMLInputElement,
  NumberInputWithButtonsProps
>(({ label, icon, step = 1, min = 0, max = Infinity, value = 0, onChange, className, ...props }, ref) => {
  const handleIncrement = () => {
    const newValue = Number((value + step).toFixed(2));
    onChange?.(Math.min(newValue, max));
  };

  const handleDecrement = () => {
    const newValue = Number((value - step).toFixed(2));
    onChange?.(Math.max(newValue, min));
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-semibold">{label}</Label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 z-10 pointer-events-none">
            {icon}
          </div>
        )}
        <NumberInput
          ref={ref}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          className={cn(icon && 'pl-10', 'pr-24', className)}
          {...props}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-md p-0.5 sm:p-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDecrement}
            className="h-8 w-8 sm:h-6 sm:w-6 p-0 hover:bg-primary hover:text-white rounded touch-target"
            disabled={value <= min}
            aria-label="Decrease value"
          >
            <Minus className="h-4 w-4 sm:h-3 sm:w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleIncrement}
            className="h-8 w-8 sm:h-6 sm:w-6 p-0 hover:bg-primary hover:text-white rounded touch-target"
            disabled={value >= max}
            aria-label="Increase value"
          >
            <Plus className="h-4 w-4 sm:h-3 sm:w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
});

NumberInputWithButtons.displayName = 'NumberInputWithButtons';

