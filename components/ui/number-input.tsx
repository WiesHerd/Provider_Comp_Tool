import * as React from "react";
import { Input, InputProps } from "./input";
import { cn } from "@/lib/utils/cn";

export interface NumberInputProps extends Omit<InputProps, 'type' | 'inputMode' | 'onChange'> {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  integerOnly?: boolean;
  icon?: React.ReactNode; // Optional icon to display in the input field
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, min, max, step, integerOnly = false, icon, className, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [displayValue, setDisplayValue] = React.useState('');

    // Initialize display value
    React.useEffect(() => {
      if (!isFocused) {
        // When not focused, show formatted value with comma separators
        if (value !== undefined && value !== null) {
          if (integerOnly) {
            // For integers, show as whole number with comma formatting
            const rounded = Math.round(value);
            setDisplayValue(rounded.toLocaleString('en-US', { maximumFractionDigits: 0 }));
          } else {
            // Format to 2 decimal places with comma formatting
            const formatted = value.toLocaleString('en-US', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            });
            setDisplayValue(formatted);
          }
        } else {
          setDisplayValue('');
        }
      }
    }, [value, isFocused, integerOnly]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;
      
      // Remove commas for parsing (user might paste or type with commas)
      inputValue = inputValue.replace(/,/g, '');
      
      // Allow empty input
      if (inputValue === '' || inputValue === '-') {
        setDisplayValue(inputValue);
        onChange?.(0);
        return;
      }

      // For integer-only, only allow whole numbers
      if (integerOnly) {
        const integerPattern = /^-?\d+$/;
        if (!integerPattern.test(inputValue)) {
          // Invalid pattern, don't update
          return;
        }
        setDisplayValue(inputValue);
        const numValue = parseInt(inputValue, 10);
        if (!isNaN(numValue)) {
          // Apply min/max constraints
          let constrainedValue = numValue;
          if (min !== undefined && constrainedValue < min) {
            constrainedValue = min;
          }
          if (max !== undefined && constrainedValue > max) {
            constrainedValue = max;
          }
          onChange?.(constrainedValue);
        }
        return;
      }

      // Allow partial decimal input (e.g., "15.", "15.5")
      // Check if it's a valid number pattern (including partial decimals)
      const decimalPattern = /^-?\d*\.?\d*$/;
      if (!decimalPattern.test(inputValue)) {
        // Invalid pattern, don't update
        return;
      }

      setDisplayValue(inputValue);
      
      // Only parse and update if it's a complete number
      const numValue = parseFloat(inputValue);
      if (!isNaN(numValue)) {
        // Apply min/max constraints
        let constrainedValue = numValue;
        if (min !== undefined && constrainedValue < min) {
          constrainedValue = min;
        }
        if (max !== undefined && constrainedValue > max) {
          constrainedValue = max;
        }
        onChange?.(constrainedValue);
      } else if (inputValue.endsWith('.') || inputValue === '-') {
        // Allow partial input (e.g., "15." or "-")
        // Don't call onChange yet, just update display
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Show raw value when focusing for easy editing
      if (value !== undefined && value !== null) {
        setDisplayValue(value.toString());
      } else {
        setDisplayValue('');
      }
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      // Format value when blurring with comma separators
      if (value !== undefined && value !== null) {
        if (integerOnly) {
          // For integers, round to whole number with comma formatting
          const rounded = Math.round(value);
          setDisplayValue(rounded.toLocaleString('en-US', { maximumFractionDigits: 0 }));
          if (rounded !== value) {
            onChange?.(rounded);
          }
        } else {
          // Format to 2 decimal places with comma formatting
          const rounded = Math.round(value * 100) / 100;
          const formatted = rounded.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          });
          setDisplayValue(formatted);
          if (rounded !== value) {
            onChange?.(rounded);
          }
        }
      } else {
        setDisplayValue('');
      }
      props.onBlur?.(e);
    };

    // Determine inputMode based on step and integerOnly
    const inputMode = integerOnly ? 'numeric' : (step !== undefined && step < 1 ? 'decimal' : 'numeric');

    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 z-10 pointer-events-none">
            {icon}
          </div>
        )}
        <Input
          ref={ref}
          type="text"
          inputMode={inputMode}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          min={min}
          max={max}
          step={step}
          className={cn(icon && 'pl-10', className)}
          {...props}
        />
      </div>
    );
  }
);
NumberInput.displayName = "NumberInput";

export { NumberInput };

