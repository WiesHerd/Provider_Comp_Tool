'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
}

interface AccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
}

interface AccordionContextValue {
  value: string[];
  onValueChange: (value: string) => void;
  type: 'single' | 'multiple';
}

const AccordionContext = React.createContext<AccordionContextValue | null>(
  null
);

interface AccordionProps {
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  children: React.ReactNode;
  className?: string;
}

export function Accordion({
  type = 'single',
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className,
}: AccordionProps) {
  const [internalValue, setInternalValue] = React.useState<string[]>(() => {
    if (defaultValue) {
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
    }
    return [];
  });

  const isControlled = controlledValue !== undefined;
  const value = isControlled
    ? Array.isArray(controlledValue)
      ? controlledValue
      : [controlledValue]
    : internalValue;

  const handleValueChange = React.useCallback(
    (newValue: string[]) => {
      if (!isControlled) {
        setInternalValue(newValue);
      }
      if (onValueChange) {
        if (type === 'single') {
          const singleValue = newValue[0] || '';
          onValueChange(singleValue);
        } else {
          onValueChange(newValue);
        }
      }
    },
    [isControlled, onValueChange, type]
  );

  const toggleItem = React.useCallback(
    (itemValue: string) => {
      if (type === 'single') {
        handleValueChange(value.includes(itemValue) ? [] : [itemValue]);
      } else {
        handleValueChange(
          value.includes(itemValue)
            ? value.filter((v) => v !== itemValue)
            : [...value, itemValue]
        );
      }
    },
    [type, value, handleValueChange]
  );

  return (
    <AccordionContext.Provider
      value={{
        value,
        onValueChange: toggleItem,
        type,
      }}
    >
      <div className={cn('space-y-2', className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ value, children }: AccordionItemProps) {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error('AccordionItem must be used within Accordion');
  }

  const isOpen = context.value.includes(value);

  return (
    <div className={cn(
      'border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden',
      'transition-all duration-200',
      isOpen && 'shadow-sm border-primary/20 dark:border-primary/30'
    )}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            isOpen,
            value,
          });
        }
        return child;
      })}
    </div>
  );
}

export function AccordionTrigger({
  children,
  className,
  isOpen,
  value,
  ...props
}: AccordionTriggerProps & { isOpen?: boolean; value?: string }) {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error('AccordionTrigger must be used within Accordion');
  }

  const handleClick = () => {
    if (value) {
      context.onValueChange(value);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'w-full px-4 py-3 flex items-center justify-between',
        'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700',
        'active:bg-gray-200 dark:active:bg-gray-600',
        'transition-all duration-200 ease-in-out',
        'touch-manipulation',
        className
      )}
      {...props}
    >
      <span className="text-base font-semibold flex-1 text-left">{children}</span>
      <ChevronDown
        className={cn(
          'w-5 h-5 transition-transform duration-300 ease-in-out flex-shrink-0 ml-2',
          isOpen && 'rotate-180',
          'text-gray-500 dark:text-gray-400'
        )}
      />
    </button>
  );
}

export function AccordionContent({
  children,
  className,
  isOpen,
  ...props
}: AccordionContentProps & { isOpen?: boolean }) {
  return (
    <div
      className={cn(
        'overflow-hidden transition-all duration-300 ease-in-out',
        isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0',
        className
      )}
      {...props}
    >
      <div className={cn('transition-all duration-300', isOpen ? 'translate-y-0' : '-translate-y-2')}>
        {children}
      </div>
    </div>
  );
}

