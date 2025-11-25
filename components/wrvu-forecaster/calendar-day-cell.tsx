'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { format, isWeekend } from 'date-fns';
import { formatDateString, getDateType, type DateString } from '@/lib/utils/calendar-helpers';
import { Tooltip } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Users, X, Clock } from 'lucide-react';

interface CalendarDayCellProps {
  date: Date;
  patientCount?: number;
  hours?: number;
  vacationDates?: DateString[];
  cmeDates?: DateString[];
  holidayDates?: DateString[];
  isToday?: boolean;
  isCurrentMonth?: boolean;
  onPatientCountChange?: (date: Date, count: number) => void;
  onHoursChange?: (date: Date, hours: number) => void;
  onDateTypeChange?: (date: Date, type: 'vacation' | 'cme' | 'holiday' | null) => void;
  disabled?: boolean;
}

export function CalendarDayCell({
  date,
  patientCount = 0,
  hours = 0,
  vacationDates,
  cmeDates,
  holidayDates,
  isToday = false,
  isCurrentMonth = true,
  onPatientCountChange,
  onHoursChange,
  onDateTypeChange,
  disabled = false,
}: CalendarDayCellProps) {
  const [isEditingPatients, setIsEditingPatients] = React.useState(false);
  const [isEditingHours, setIsEditingHours] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [patientsValue, setPatientsValue] = React.useState(patientCount.toString());
  const [hoursValue, setHoursValue] = React.useState(hours.toString());
  const patientsInputRef = React.useRef<HTMLInputElement>(null);
  const hoursInputRef = React.useRef<HTMLInputElement>(null);

  const dateString = formatDateString(date);
  const dateType = getDateType(dateString, vacationDates, cmeDates, holidayDates);
  const isWeekendDay = isWeekend(date);
  const isNonWorking = dateType !== null;

  React.useEffect(() => {
    setPatientsValue(patientCount.toString());
  }, [patientCount]);

  React.useEffect(() => {
    setHoursValue(hours.toString());
  }, [hours]);

  React.useEffect(() => {
    if (isEditingPatients && patientsInputRef.current) {
      patientsInputRef.current.focus();
      patientsInputRef.current.select();
    }
  }, [isEditingPatients]);

  React.useEffect(() => {
    if (isEditingHours && hoursInputRef.current) {
      hoursInputRef.current.focus();
      hoursInputRef.current.select();
    }
  }, [isEditingHours]);

  const handlePatientsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isNonWorking) return;
    setIsEditingPatients(true);
  };

  const handleHoursClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isNonWorking) return;
    setIsEditingHours(true);
  };

  const handlePatientsBlur = () => {
    setIsEditingPatients(false);
    const trimmedValue = patientsValue.trim();
    if (trimmedValue === '') {
      if (onPatientCountChange) {
        onPatientCountChange(date, 0);
      }
      setPatientsValue('0');
      return;
    }
    
    const numValue = parseInt(trimmedValue, 10);
    if (!isNaN(numValue) && numValue >= 0 && onPatientCountChange) {
      onPatientCountChange(date, numValue);
    } else {
      setPatientsValue(patientCount.toString());
    }
  };

  const handleHoursBlur = () => {
    setIsEditingHours(false);
    const trimmedValue = hoursValue.trim();
    if (trimmedValue === '') {
      if (onHoursChange) {
        onHoursChange(date, 0);
      }
      setHoursValue('0');
      return;
    }
    
    const numValue = parseFloat(trimmedValue);
    if (!isNaN(numValue) && numValue >= 0 && onHoursChange) {
      onHoursChange(date, numValue);
    } else {
      setHoursValue(hours.toString());
    }
  };

  const handlePatientsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handlePatientsBlur();
    } else if (e.key === 'Escape') {
      setPatientsValue(patientCount.toString());
      setIsEditingPatients(false);
    }
  };

  const handleHoursKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleHoursBlur();
    } else if (e.key === 'Escape') {
      setHoursValue(hours.toString());
      setIsEditingHours(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPatientCountChange) {
      onPatientCountChange(date, 0);
    }
    if (onHoursChange) {
      onHoursChange(date, 0);
    }
    setIsEditingPatients(false);
    setIsEditingHours(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isNonWorking) return;
    // Double-click to quickly clear both
    if ((patientCount > 0 || hours > 0)) {
      if (onPatientCountChange) {
        onPatientCountChange(date, 0);
      }
      if (onHoursChange) {
        onHoursChange(date, 0);
      }
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
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    return parts.join(' • ');
  }, [date, dateType, patientCount, hours]);

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
        aria-label={`${format(date, 'EEEE, MMMM d')}, ${patientCount} patients, ${hours} hours`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isNonWorking) handlePatientsClick(e as any);
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

        {/* Dual input section - patients and hours */}
        <div className="flex-1 flex flex-col items-center justify-center gap-1.5 sm:gap-2 px-2 pb-2">
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
          ) : (
            <>
              {/* Patients input */}
              {isEditingPatients ? (
                <div className="w-full relative" onClick={(e) => e.stopPropagation()}>
                  <Input
                    ref={patientsInputRef}
                    type="number"
                    value={patientsValue}
                    onChange={(e) => setPatientsValue(e.target.value)}
                    onBlur={handlePatientsBlur}
                    onKeyDown={handlePatientsKeyDown}
                    min={0}
                    step={1}
                    placeholder="0"
                    className="h-10 sm:h-11 text-base sm:text-lg font-bold text-center p-2 pr-8 border-2 border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Clear"
                    title="Clear"
                  >
                    <X className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handlePatientsClick}
                  className={cn(
                    'w-full flex flex-col items-center justify-center gap-0.5',
                    'rounded-lg p-1.5 sm:p-2 transition-all duration-200 min-h-[44px]',
                    'border-0 outline-none',
                    'hover:bg-primary/5 active:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1',
                    patientCount > 0 && 'bg-primary/5'
                  )}
                >
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    <span className="text-base sm:text-lg md:text-xl font-bold text-primary">
                      {patientCount || '0'}
                    </span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400">
                    patients
                  </span>
                </button>
              )}

              {/* Hours input */}
              {isEditingHours ? (
                <div className="w-full relative" onClick={(e) => e.stopPropagation()}>
                  <Input
                    ref={hoursInputRef}
                    type="number"
                    value={hoursValue}
                    onChange={(e) => setHoursValue(e.target.value)}
                    onBlur={handleHoursBlur}
                    onKeyDown={handleHoursKeyDown}
                    min={0}
                    step={0.5}
                    placeholder="0"
                    className="h-10 sm:h-11 text-base sm:text-lg font-bold text-center p-2 pr-8 border-2 border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Clear"
                    title="Clear"
                  >
                    <X className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleHoursClick}
                  className={cn(
                    'w-full flex flex-col items-center justify-center gap-0.5',
                    'rounded-lg p-1.5 sm:p-2 transition-all duration-200 min-h-[44px]',
                    'border-0 outline-none',
                    'hover:bg-primary/5 active:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1',
                    hours > 0 && 'bg-primary/5'
                  )}
                >
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    <span className="text-base sm:text-lg md:text-xl font-bold text-primary">
                      {hours > 0 ? hours.toFixed(1) : '0'}
                    </span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400">
                    hours
                  </span>
                </button>
              )}
            </>
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
