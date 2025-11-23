'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface StepBadgeProps {
  number: number;
  variant?: 'default' | 'active' | 'completed';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StepBadge({
  number,
  variant = 'default',
  size = 'md',
  className,
}: StepBadgeProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold transition-all duration-200',
        sizeClasses[size],
        variant === 'default' && 'bg-blue-500 text-white',
        variant === 'active' && 'bg-primary text-white ring-2 ring-primary/20 shadow-sm',
        variant === 'completed' && 'bg-primary text-white shadow-sm',
        className
      )}
    >
      {variant === 'completed' ? (
        <Check className={iconSizes[size]} />
      ) : (
        <span>{number}</span>
      )}
    </div>
  );
}

