import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          'transition-all duration-200 ease-out',
          'shadow-[0_1px_2px_rgba(0,0,0,0.05)]',
          variant === 'default' && [
            'bg-primary/90 text-white',
            'border border-primary/20',
          ],
          variant === 'secondary' && [
            'bg-gray-100/80 dark:bg-gray-800/80',
            'text-gray-700 dark:text-gray-200',
            'border border-gray-200/50 dark:border-gray-700/50',
          ],
          variant === 'outline' && [
            'border border-gray-300/60 dark:border-gray-700/60',
            'bg-white/50 dark:bg-gray-900/50',
            'text-gray-700 dark:text-gray-300',
          ],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };

