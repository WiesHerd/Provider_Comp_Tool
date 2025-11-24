'use client';

import { cn } from '@/lib/utils/cn';
import { Button, ButtonProps } from './button';
import { Plus } from 'lucide-react';

interface FABProps extends Omit<ButtonProps, 'variant' | 'size'> {
  icon?: React.ReactNode;
  label?: string;
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
  showLabel?: boolean;
}

export function FAB({
  icon,
  label,
  position = 'bottom-right',
  showLabel = false,
  className,
  children,
  ...props
}: FABProps) {
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4 sm:bottom-6 sm:right-6',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-4 left-4 sm:bottom-6 sm:left-6',
  };

  return (
    <Button
      className={cn(
        'fixed z-50',
        'w-14 h-14 sm:w-16 sm:h-16',
        'rounded-full shadow-lg',
        'hover:shadow-xl active:scale-95',
        'transition-all duration-200',
        positionClasses[position],
        showLabel && label && 'w-auto px-6 gap-2',
        className
      )}
      variant="default"
      {...props}
    >
      {icon || <Plus className="w-6 h-6" />}
      {showLabel && label && (
        <span className="font-semibold text-base">{label}</span>
      )}
      {children}
    </Button>
  );
}



