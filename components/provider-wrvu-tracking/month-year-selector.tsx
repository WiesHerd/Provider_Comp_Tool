'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MonthYearSelectorProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  availableYears?: number[];
  monthsWithData?: Date[];
  className?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function MonthYearSelector({
  currentDate,
  onDateChange,
  availableYears = [],
  monthsWithData = [],
  className,
}: MonthYearSelectorProps) {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  // Generate year range (current year ± 5 years, or use available years if provided)
  const years = React.useMemo(() => {
    if (availableYears.length > 0) {
      // Include available years plus a few years around current
      const yearSet = new Set(availableYears);
      for (let i = -2; i <= 2; i++) {
        yearSet.add(currentYear + i);
      }
      return Array.from(yearSet).sort((a, b) => b - a);
    }
    
    // Default: current year ± 5 years
    const yearList: number[] = [];
    for (let i = -5; i <= 5; i++) {
      yearList.push(currentYear + i);
    }
    return yearList.sort((a, b) => b - a);
  }, [availableYears, currentYear]);

  // Check if a month has data
  const monthHasData = React.useCallback((year: number, month: number) => {
    return monthsWithData.some(
      (date) => date.getFullYear() === year && date.getMonth() === month
    );
  }, [monthsWithData]);

  const handleYearChange = (yearStr: string) => {
    const year = parseInt(yearStr, 10);
    const newDate = new Date(year, currentMonth, 1);
    onDateChange(newDate);
  };

  const handleMonthChange = (monthStr: string) => {
    const month = parseInt(monthStr, 10);
    const newDate = new Date(currentYear, month, 1);
    onDateChange(newDate);
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Year Selector - Wider for proper text fit */}
      <Select
        value={currentYear.toString()}
        onValueChange={handleYearChange}
      >
        <SelectTrigger className="h-10 w-[120px] text-base font-semibold border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-[300px] min-w-[120px]">
          <SelectGroup>
            {years.map((year) => {
              return (
                <SelectItem 
                  key={year} 
                  value={year.toString()}
                  className={cn(
                    "font-semibold text-base",
                    year === currentYear && "bg-gray-50 dark:bg-gray-800"
                  )}
                >
                  {year}
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Month Selector - Wider for full month names */}
      <Select
        value={currentMonth.toString()}
        onValueChange={handleMonthChange}
      >
        <SelectTrigger className="h-10 w-[160px] text-base font-semibold border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm">
          <SelectValue>
            {MONTHS[currentMonth]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px] min-w-[160px]">
          <SelectGroup>
            {MONTHS.map((month, index) => {
              const hasData = monthHasData(currentYear, index);
              const isCurrentMonth = index === currentMonth;
              
              return (
                <SelectItem 
                  key={index} 
                  value={index.toString()}
                  className={cn(
                    "font-semibold text-base",
                    isCurrentMonth && "bg-gray-50 dark:bg-gray-800"
                  )}
                >
                  <div className="flex items-center justify-between w-full gap-4">
                    <span>{month}</span>
                    {hasData && (
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

