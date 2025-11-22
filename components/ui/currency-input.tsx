import * as React from "react";
import { Input, InputProps } from "./input";
import { cn } from "@/lib/utils/cn";

export interface CurrencyInputProps extends Omit<InputProps, 'type' | 'inputMode' | 'onChange'> {
  value?: number;
  onChange?: (value: number) => void;
  prefix?: string;
  showDecimals?: boolean; // Whether to show decimal places (default: true for currency, false for large numbers)
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, prefix = "$", showDecimals = true, className, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [displayValue, setDisplayValue] = React.useState('');

    // Format value for display (with commas, decimals)
    const formatValue = React.useCallback((val: number | undefined): string => {
      if (val === undefined || isNaN(val) || val === 0) return '';
      if (showDecimals) {
        return val.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      } else {
        return val.toLocaleString('en-US', {
          maximumFractionDigits: 0,
        });
      }
    }, [showDecimals]);

    // Initialize display value
    React.useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatValue(value));
      }
    }, [value, isFocused, formatValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Remove all non-numeric characters except decimal point
      let rawValue = e.target.value.replace(/[^0-9.]/g, '');
      
      // Only allow one decimal point
      const parts = rawValue.split('.');
      if (parts.length > 2) {
        rawValue = parts[0] + '.' + parts.slice(1).join('');
      }
      
      // Limit decimal places if showDecimals is true
      if (showDecimals && parts.length === 2 && parts[1].length > 2) {
        rawValue = parts[0] + '.' + parts[1].substring(0, 2);
      }
      
      setDisplayValue(rawValue);
      
      const numValue = rawValue === '' || rawValue === '.' ? 0 : parseFloat(rawValue);
      if (!isNaN(numValue)) {
        onChange?.(numValue);
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Show raw number when focusing for easy editing
      setDisplayValue(value !== undefined && !isNaN(value) && value !== 0 ? value.toString() : '');
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      // Format value when blurring
      setDisplayValue(formatValue(value));
      props.onBlur?.(e);
    };

    return (
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-base pointer-events-none z-10">
            {prefix}
          </span>
        )}
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(prefix && "pl-[3.5rem]", className)}
          {...props}
        />
      </div>
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };

