'use client';

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '@/lib/utils/cn';

const SwitchRoot = SwitchPrimitives.Root as any;
const SwitchThumb = SwitchPrimitives.Thumb as any;

type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchRoot>;

const Switch = React.forwardRef<
  any,
  SwitchProps
>(({ className, ...props }, ref) => (
  <SwitchRoot
    className={cn(
      'peer inline-flex h-7 w-11 sm:h-6 sm:w-10 shrink-0 flex-shrink-0 flex-grow-0 cursor-pointer items-center rounded-full border-2 border-transparent',
      'min-w-[44px] sm:min-w-[40px] max-w-[44px] sm:max-w-[40px]', // Lock dimensions - Apple switch aspect ratio
      '!w-[44px] sm:!w-[40px] !h-[28px] sm:!h-[24px]', // Force explicit dimensions to prevent compression
      'aspect-[1.57] sm:aspect-[1.67]', // Enforce aspect ratio to maintain Apple switch proportions
      'transition-colors duration-150 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700',
      'touch-manipulation', // iOS-friendly touch handling
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchThumb
      className={cn(
        'pointer-events-none block h-5 w-5 sm:h-4 sm:w-4 rounded-full bg-white shadow-lg ring-0 transition-transform',
        'data-[state=checked]:translate-x-[18px] sm:data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5'
      )}
    />
  </SwitchRoot>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
export type { SwitchProps };

