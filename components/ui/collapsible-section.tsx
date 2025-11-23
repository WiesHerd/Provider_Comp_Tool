'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './button';

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}

export function CollapsibleSection({
  title,
  description,
  defaultOpen = false,
  children,
  className,
  hint,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        'border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden',
        'bg-white dark:bg-gray-900',
        className
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full px-4 py-3 sm:px-6 sm:py-4',
          'flex items-center justify-between',
          'bg-gray-50 dark:bg-gray-800/50',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'transition-colors duration-150',
          'touch-manipulation min-h-[44px]'
        )}
      >
        <div className="flex-1 text-left">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-0.5">
            {title}
          </h3>
          {description && (
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
          {!isOpen && hint && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
              {hint}
            </p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0">
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-6 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

