'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { format, isWeekend } from 'date-fns';
import { formatDateString, getDateType, type DateString } from '@/lib/utils/calendar-helpers';
import { Tooltip } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Users, X } from 'lucide-react';

interface CalendarDayCellProps {
  date: Date;
  patientCount?: number;
  vacationDates?: DateString[];
  cmeDates?: DateString[];
  holidayDates?: DateString[];
  isToday?: boolean;
  isCurrentMonth?: boolean;
  onPatientCountChange?: (date: Date, count: number) => void;
  onDateTypeChange?: (date: Date, type: 'vacation' | 'cme' | 'holiday' | null) => void;
  disabled?: boolean;
}

export function CalendarDayCell({
  date,
  patientCount = 0,
  vacationDates,
  cmeDates,
  holidayDates,
  isToday = false,
  isCurrentMonth = true,
  onPatientCountChange,
  onDateTypeChange,
  disabled = false,
}: CalendarDayCellProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [editValue, setEditValue] = React.useState(patientCount.toString());
  const inputRef = React.useRef<HTMLInputElement>(null);

  const dateString = formatDateString(date);
  const dateType = getDateType(dateString, vacationDates, cmeDates, holidayDates);
  const isWeekendDay = isWeekend(date);
  const isNonWorking = dateType !== null;

  React.useEffect(() => {
    setEditValue(patientCount.toString());
  }, [patientCount]);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isNonWorking) return;
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    // If empty or just whitespace, set to 0
    const trimmedValue = editValue.trim();
    if (trimmedValue === '') {
      if (onPatientCountChange) {
        onPatientCountChange(date, 0);
      }
      setEditValue('0');
      return;
    }
    
    const numValue = parseInt(trimmedValue, 10);
    if (!isNaN(numValue) && numValue >= 0 && onPatientCountChange) {
      onPatientCountChange(date, numValue);
    } else {
      setEditValue(patientCount.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(patientCount.toString());
      setIsEditing(false);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      // Allow clearing with Delete/Backspace
      if (editValue === '' || editValue === '0') {
        e.preventDefault();
        setEditValue('');
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue('');
    if (onPatientCountChange) {
      onPatientCountChange(date, 0);
    }
    setIsEditing(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isNonWorking) return;
    // Double-click to quickly clear
    if (patientCount > 0 && onPatientCountChange) {
      onPatientCountChange(date, 0);
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    
    if (!onDateTypeChange) return;
    
    // Cycle through: normal -> vacation -> CME -> holiday -> normal
    if (dateType === null) {
      onDateTypeChange(date, 'vacation');
    } else if (dateType === 'vacation') {
      onDateTypeChange(date, 'cme');
    } else if (dateType === 'cme') {
      onDateTypeChange(date, 'holiday');
    } else {
      onDateTypeChange(date, null);
    }
  };

  // Determine cell styling
  const cellClasses = cn(
    'relative flex flex-col h-full min-h-[100px] sm:min-h-[120px] md:min-h-[140px]',
    'rounded-xl border transition-all duration-200 ease-out',
    'group cursor-pointer',
    // Base styles
    isCurrentMonth
      ? 'bg-white dark:bg-gray-900'
      : 'bg-gray-50/50 dark:bg-gray-800/30',
    // Border colors
    isToday
      ? 'border-2 border-primary shadow-md ring-2 ring-primary/20'
      : 'border border-gray-200 dark:border-gray-700',
    // Hover effects
    !isNonWorking && !disabled && 'hover:border-primary/50 hover:shadow-sm hover:bg-gray-50/50 dark:hover:bg-gray-800/50',
    // Vacation styling
    dateType === 'vacation' && [
      'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20',
      'border-blue-300 dark:border-blue-700',
    ],
    // CME styling
    dateType === 'cme' && [
      'bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/30 dark:to-purple-800/20',
      'border-purple-300 dark:border-purple-700',
    ],
    // Holiday styling
    dateType === 'holiday' && [
      'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/30 dark:to-red-800/20',
      'border-red-300 dark:border-red-700',
    ],
    // Weekend styling (subtle)
    isWeekendDay && !isNonWorking && 'bg-gray-50/30 dark:bg-gray-800/20',
    // Disabled state
    disabled && 'opacity-40 cursor-not-allowed',
    isNonWorking && 'cursor-default'
  );

  const dayNumber = format(date, 'd');
  const dayName = format(date, 'EEE');

  const tooltipContent = React.useMemo(() => {
    const parts = [format(date, 'EEEE, MMMM d, yyyy')];
    if (dateType === 'vacation') parts.push('Vacation');
    if (dateType === 'cme') parts.push('CME');
    if (dateType === 'holiday') parts.push('Holiday');
    if (patientCount > 0) parts.push(`${patientCount} patient${patientCount !== 1 ? 's' : ''}`);
    return parts.join(' • ');
  }, [date, dateType, patientCount]);

  return (
    <Tooltip content={tooltipContent} side="top">
      <div
        className={cellClasses}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onContextMenu={handleRightClick}
        onDoubleClick={handleDoubleClick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`${format(date, 'EEEE, MMMM d')}, ${patientCount} patients`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isNonWorking) handleClick(e as any);
          }
        }}
      >
        {/* Day header - compact */}
        <div className="flex items-center justify-between px-2 pt-2 pb-1">
          <span
            className={cn(
              'text-[10px] sm:text-xs font-medium uppercase tracking-wide',
              !isCurrentMonth && 'text-gray-400 dark:text-gray-600',
              isCurrentMonth && isWeekendDay && !isNonWorking && 'text-gray-500 dark:text-gray-400',
              isCurrentMonth && !isWeekendDay && !isNonWorking && 'text-gray-600 dark:text-gray-400',
              isNonWorking && 'opacity-60'
            )}
          >
            {dayName}
          </span>
          <span
            className={cn(
              'text-sm sm:text-base font-bold',
              isToday && 'text-primary',
              !isToday && isCurrentMonth && !isNonWorking && 'text-gray-900 dark:text-gray-100',
              !isCurrentMonth && 'text-gray-400 dark:text-gray-600',
              isNonWorking && 'opacity-60'
            )}
          >
            {dayNumber}
          </span>
        </div>

        {/* Patient count section - main content area */}
        <div className="flex-1 flex flex-col items-center justify-center px-2 pb-2">
          {isNonWorking ? (
            <div className="flex flex-col items-center justify-center gap-1">
              <span className="text-2xl sm:text-3xl opacity-60">
                {dateType === 'vacation' && '🏖️'}
                {dateType === 'cme' && '📚'}
                {dateType === 'holiday' && '🎉'}
              </span>
              <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wide opacity-60">
                {dateType}
              </span>
            </div>
          ) : isEditing ? (
            <div className="w-full relative" onClick={(e) => e.stopPropagation()}>
              <Input
                ref={inputRef}
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                min={0}
                step={1}
                placeholder="0"
                className="h-10 sm:h-12 text-lg sm:text-xl font-bold text-center p-2 pr-10 border-2 border-primary focus:ring-2 focus:ring-primary"
                onClick={(e) => e.stopPropagation()}
              />
              {/* Clear button */}
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Clear patient count"
                title="Clear (or press Delete)"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleClick}
              className={cn(
                'w-full flex flex-col items-center justify-center gap-1',
                'rounded-lg p-2 sm:p-3 transition-all duration-200',
                'hover:bg-primary/5 active:bg-primary/10',
                patientCount > 0 && 'bg-primary/5'
              )}
            >
              {patientCount > 0 ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
                      {patientCount}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                    patient{patientCount !== 1 ? 's' : ''}
                  </span>
                  <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">
                    Double-click to clear
                  </span>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 group-hover:border-primary/50 transition-colors">
                    <span className="text-gray-400 dark:text-gray-500 text-lg sm:text-xl">+</span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Click to add
                  </span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Type indicator dot */}
        {dateType && (
          <div
            className={cn(
              'absolute top-2 right-2 w-2 h-2 rounded-full',
              dateType === 'vacation' && 'bg-blue-500',
              dateType === 'cme' && 'bg-purple-500',
              dateType === 'holiday' && 'bg-red-500'
            )}
            aria-label={dateType}
          />
        )}
      </div>
    </Tooltip>
  );
}
