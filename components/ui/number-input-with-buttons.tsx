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
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
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
            className={cn(icon && 'pl-10', className)}
            {...props}
          />
        </div>
        <div className="flex gap-1.5 sm:gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 sm:p-0.5 flex-shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDecrement}
            className="h-11 w-11 sm:h-8 sm:w-8 p-0 hover:bg-primary hover:text-white rounded-md active:scale-95 transition-transform touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center"
            disabled={value <= min}
            aria-label="Decrease value"
          >
            <Minus className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleIncrement}
            className="h-11 w-11 sm:h-8 sm:w-8 p-0 hover:bg-primary hover:text-white rounded-md active:scale-95 transition-transform touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center"
            disabled={value >= max}
            aria-label="Increase value"
          >
            <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});

NumberInputWithButtons.displayName = 'NumberInputWithButtons';

