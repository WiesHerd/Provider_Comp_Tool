'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

interface DaySelectorProps {
  daysOfWeek?: number[];
  onDaysChange: (days: number[]) => void;
  className?: string;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NUMBERS = [0, 1, 2, 3, 4, 5, 6]; // Sunday = 0, Monday = 1, etc.

export function DaySelector({ daysOfWeek = [], onDaysChange, className }: DaySelectorProps) {
  const handleDayToggle = (day: number) => {
    const isSelected = daysOfWeek.includes(day);
    if (isSelected) {
      // Remove day if already selected
      const newDays = daysOfWeek.filter((d) => d !== day);
      onDaysChange(newDays);
    } else {
      // Add day if not selected
      const newDays = [...daysOfWeek, day].sort((a, b) => a - b);
      onDaysChange(newDays);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Select Days
      </div>
      <div className="grid grid-cols-7 gap-2 sm:gap-3">
        {DAY_NUMBERS.map((day) => {
          const isSelected = daysOfWeek.includes(day);
          const dayName = DAY_NAMES[day];
          
          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDayToggle(day)}
              className={cn(
                'relative flex flex-col items-center justify-center',
                'min-h-[60px] sm:min-h-[70px]',
                'rounded-xl border transition-all duration-200 ease-out',
                'group cursor-pointer',
                // Base styles - matching calendar
                'bg-white dark:bg-gray-900',
                // Border colors - matching calendar
                isSelected
                  ? 'border-2 border-primary shadow-sm ring-2 ring-primary/20'
                  : 'border border-gray-200 dark:border-gray-700',
                // Hover effects - matching calendar
                'hover:border-primary/50 hover:shadow-sm hover:bg-gray-50/50 dark:hover:bg-gray-800/50',
                // Selected state - matching calendar gradient
                isSelected && [
                  'bg-gradient-to-br from-primary/10 to-primary/5',
                  'dark:from-primary/20 dark:to-primary/10',
                ]
              )}
              aria-label={`${dayName} - ${isSelected ? 'Selected' : 'Not selected'}`}
              aria-pressed={isSelected}
            >
              {/* Day name - matching calendar typography */}
              <span
                className={cn(
                  'text-[10px] sm:text-xs font-medium uppercase tracking-wide mb-1',
                  isSelected
                    ? 'text-primary dark:text-primary'
                    : 'text-gray-600 dark:text-gray-400'
                )}
              >
                {dayName}
              </span>
              {/* Day number - matching calendar typography */}
              <span
                className={cn(
                  'text-sm sm:text-base font-bold',
                  isSelected
                    ? 'text-primary dark:text-primary'
                    : 'text-gray-900 dark:text-gray-100'
                )}
              >
                {day + 1}
              </span>
              {/* Selection indicator dot - matching calendar */}
              {isSelected && (
                <div
                  className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary"
                  aria-label="Selected"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

