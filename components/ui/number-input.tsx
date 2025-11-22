import * as React from "react";
import { Input, InputProps } from "./input";

export interface NumberInputProps extends Omit<InputProps, 'type' | 'inputMode' | 'onChange'> {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  integerOnly?: boolean;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, min, max, step, integerOnly = false, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [displayValue, setDisplayValue] = React.useState('');

    // Initialize display value
    React.useEffect(() => {
      if (!isFocused) {
        // When not focused, show formatted value
        if (value !== undefined && value !== 0) {
          if (integerOnly) {
            // For integers, show as whole number
            setDisplayValue(Math.round(value).toString());
          } else {
            // Format to 2 decimal places, but don't show trailing zeros if not needed
            const formatted = value.toFixed(2);
            setDisplayValue(formatted);
          }
        } else {
          setDisplayValue('');
        }
      }
    }, [value, isFocused, integerOnly]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
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
      if (value !== undefined && value !== 0) {
        setDisplayValue(value.toString());
      } else {
        setDisplayValue('');
      }
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      // Format value when blurring
      if (value !== undefined && value !== 0) {
        if (integerOnly) {
          // For integers, round to whole number
          const rounded = Math.round(value);
          setDisplayValue(rounded.toString());
          if (rounded !== value) {
            onChange?.(rounded);
          }
        } else {
          // Format to 2 decimal places
          const formatted = value.toFixed(2);
          setDisplayValue(formatted);
          // Round the value to 2 decimal places and update if needed
          const rounded = Math.round(value * 100) / 100;
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
        {...props}
      />
    );
  }
);
NumberInput.displayName = "NumberInput";

export { NumberInput };

