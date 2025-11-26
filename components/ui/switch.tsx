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
>(({ className, ...props }, ref) => {
  // Use hook to detect screen size and set appropriate dimensions
  const [isMobile, setIsMobile] = React.useState(true);

  React.useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640); // 640px is Tailwind's sm breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Use inline styles to force dimensions and prevent compression
  // Inline styles have highest specificity and will override any parent constraints
  const switchStyle: React.CSSProperties = React.useMemo(() => ({
    width: isMobile ? '44px' : '40px',
    height: isMobile ? '28px' : '24px',
    minWidth: isMobile ? '44px' : '40px',
    maxWidth: isMobile ? '44px' : '40px',
    minHeight: isMobile ? '28px' : '24px',
    maxHeight: isMobile ? '28px' : '24px',
    flexShrink: 0,
    flexGrow: 0,
  }), [isMobile]);

  return (
    <SwitchRoot
      className={cn(
        'peer inline-flex shrink-0 flex-shrink-0 flex-grow-0 cursor-pointer items-center rounded-full border-2 border-transparent',
        'transition-colors duration-150 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700',
        'touch-manipulation', // iOS-friendly touch handling
        className
      )}
      style={switchStyle}
      {...props}
      ref={ref}
    >
    <SwitchThumb
      className={cn(
        'pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-transform',
        isMobile ? 'h-5 w-5' : 'h-4 w-4',
        isMobile 
          ? 'data-[state=checked]:translate-x-[18px] data-[state=unchecked]:translate-x-0.5'
          : 'data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5'
      )}
    />
  </SwitchRoot>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
export type { SwitchProps };

