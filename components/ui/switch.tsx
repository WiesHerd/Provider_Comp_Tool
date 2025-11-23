'use client';

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '@/lib/utils/cn';

type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>;

const SwitchRoot = SwitchPrimitives.Root as any;
const SwitchThumb = SwitchPrimitives.Thumb as any;

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, ...props }, ref) => (
  <SwitchRoot
    className={cn(
      'peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent',
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
        'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
        'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'
      )}
    />
  </SwitchRoot>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
export type { SwitchProps };

