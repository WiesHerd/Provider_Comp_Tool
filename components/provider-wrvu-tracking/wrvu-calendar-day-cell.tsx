'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { format, isWeekend } from 'date-fns';
import { Tooltip } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Users, TrendingUp, X } from 'lucide-react';
import { DailyTrackingData } from '@/types/provider-wrvu-tracking';

interface WRVUCalendarDayCellProps {
  date: Date;
  trackingData?: DailyTrackingData;
  isToday?: boolean;
  isCurrentMonth?: boolean;
  onDataChange?: (date: Date, data: DailyTrackingData) => void;
  disabled?: boolean;
}

export function WRVUCalendarDayCell({
  date,
  trackingData = { patients: 0, workRVUs: 0 },
  isToday = false,
  isCurrentMonth = true,
  onDataChange,
  disabled = false,
}: WRVUCalendarDayCellProps) {
  const [isEditingPatients, setIsEditingPatients] = React.useState(false);
  const [isEditingWRVUs, setIsEditingWRVUs] = React.useState(false);
  const [patientsValue, setPatientsValue] = React.useState(trackingData.patients.toString());
  const [wrvuValue, setWrvuValue] = React.useState(trackingData.workRVUs.toString());
  const patientsInputRef = React.useRef<HTMLInputElement>(null);
  const wrvuInputRef = React.useRef<HTMLInputElement>(null);

  const isWeekendDay = isWeekend(date);
  const hasData = trackingData.patients > 0 || trackingData.workRVUs > 0;

  // Only update local state from props when NOT editing to prevent clearing user input
  // Use refs to track the last synced values to avoid unnecessary updates
  const lastSyncedPatientsRef = React.useRef(trackingData.patients);
  const lastSyncedWRVUsRef = React.useRef(trackingData.workRVUs);
  
  React.useEffect(() => {
    // Don't update if user is currently editing either field
    if (isEditingPatients || isEditingWRVUs) {
      return;
    }
    
    // Only update if the values actually changed from what we last synced
    const newPatients = trackingData.patients;
    const newWRVUs = trackingData.workRVUs;
    
    if (lastSyncedPatientsRef.current !== newPatients) {
      setPatientsValue(newPatients.toString());
      lastSyncedPatientsRef.current = newPatients;
    }
    if (lastSyncedWRVUsRef.current !== newWRVUs) {
      setWrvuValue(newWRVUs.toString());
      lastSyncedWRVUsRef.current = newWRVUs;
    }
  }, [trackingData.patients, trackingData.workRVUs, isEditingPatients, isEditingWRVUs]);

  React.useEffect(() => {
    if (isEditingPatients && patientsInputRef.current) {
      patientsInputRef.current.focus();
      patientsInputRef.current.select();
    }
  }, [isEditingPatients]);

  React.useEffect(() => {
    if (isEditingWRVUs && wrvuInputRef.current) {
      wrvuInputRef.current.focus();
      wrvuInputRef.current.select();
    }
  }, [isEditingWRVUs]);

  const handlePatientsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setIsEditingPatients(true);
  };

  const handleWRVUClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setIsEditingWRVUs(true);
  };

  const handlePatientsBlur = () => {
    setIsEditingPatients(false);
    const trimmedValue = patientsValue.trim();
    if (trimmedValue === '') {
      updateData(0, trackingData.workRVUs);
      setPatientsValue('0');
      return;
    }
    
    const numValue = parseInt(trimmedValue, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      updateData(numValue, trackingData.workRVUs);
    } else {
      setPatientsValue(trackingData.patients.toString());
    }
  };

  const handleWRVUBlur = () => {
    setIsEditingWRVUs(false);
    const trimmedValue = wrvuValue.trim();
    if (trimmedValue === '') {
      updateData(trackingData.patients, 0);
      setWrvuValue('0');
      return;
    }
    
    const numValue = parseFloat(trimmedValue);
    if (!isNaN(numValue) && numValue >= 0) {
      updateData(trackingData.patients, numValue);
    } else {
      setWrvuValue(trackingData.workRVUs.toString());
    }
  };

  const updateData = (patients: number, workRVUs: number) => {
    if (onDataChange) {
      onDataChange(date, { patients, workRVUs });
    }
  };

  const handlePatientsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handlePatientsBlur();
    } else if (e.key === 'Escape') {
      setPatientsValue(trackingData.patients.toString());
      setIsEditingPatients(false);
    }
  };

  const handleWRVUKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleWRVUBlur();
    } else if (e.key === 'Escape') {
      setWrvuValue(trackingData.workRVUs.toString());
      setIsEditingWRVUs(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateData(0, 0);
    setIsEditingPatients(false);
    setIsEditingWRVUs(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (hasData) {
      updateData(0, 0);
    }
  };

  // Determine cell styling
  const cellClasses = cn(
    'relative flex flex-col h-full min-h-[120px] sm:min-h-[120px] md:min-h-[140px]',
    'rounded-xl border transition-all duration-200 ease-out',
    'group',
    // Base styles
    isCurrentMonth
      ? 'bg-white dark:bg-gray-900'
      : 'bg-gray-50/50 dark:bg-gray-800/30',
    // Border colors - no hover border change to avoid conflicts
    isToday
      ? 'border-2 border-primary shadow-md ring-2 ring-primary/20'
      : 'border border-gray-200 dark:border-gray-700',
    // Weekend styling (subtle)
    isWeekendDay && 'bg-gray-50/30 dark:bg-gray-800/20',
    // Disabled state
    disabled && 'opacity-40 cursor-not-allowed'
  );

  const dayNumber = format(date, 'd');
  const dayName = format(date, 'EEE');

  const tooltipContent = React.useMemo(() => {
    const parts = [format(date, 'EEEE, MMMM d, yyyy')];
    if (trackingData.patients > 0) {
      parts.push(`${trackingData.patients} patient${trackingData.patients !== 1 ? 's' : ''}`);
    }
    if (trackingData.workRVUs > 0) {
      parts.push(`${trackingData.workRVUs.toFixed(2)} wRVUs`);
    }
    if (!hasData) {
      parts.push('Click to add data');
    }
    return parts.join(' • ');
  }, [date, trackingData, hasData]);

  return (
    <Tooltip content={tooltipContent} side="top" disableOnTouch={true}>
      <div
        className={cellClasses}
        onDoubleClick={handleDoubleClick}
        role="gridcell"
        tabIndex={disabled ? -1 : 0}
        aria-label={`${format(date, 'EEEE, MMMM d, yyyy')}. ${trackingData.patients} patients, ${trackingData.workRVUs.toFixed(2)} work RVUs. ${hasData ? 'Has data' : 'No data entered'}. Click to edit.`}
        aria-selected={hasData}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) handlePatientsClick(e as any);
          } else if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            if (!disabled && hasData) {
              updateData(0, 0);
            }
          }
        }}
      >
        {/* Day header - compact */}
        <div className="flex items-center justify-between px-2 pt-2 pb-1">
          <span
            className={cn(
              'text-[10px] sm:text-xs font-medium uppercase tracking-wide',
              !isCurrentMonth && 'text-gray-400 dark:text-gray-600',
              isCurrentMonth && isWeekendDay && 'text-gray-500 dark:text-gray-400',
              isCurrentMonth && !isWeekendDay && 'text-gray-600 dark:text-gray-400'
            )}
          >
            {dayName}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'text-sm sm:text-base font-bold',
                isToday && 'text-primary',
                !isToday && isCurrentMonth && 'text-gray-900 dark:text-gray-100',
                !isCurrentMonth && 'text-gray-400 dark:text-gray-600'
              )}
            >
              {dayNumber}
            </span>
            {/* Data indicator dot - positioned next to day number */}
            {hasData && (
              <div
                className="w-2 h-2 rounded-full bg-primary flex-shrink-0"
                aria-label="Has data"
              />
            )}
          </div>
        </div>

        {/* Dual input section - mobile-first: stacked vertically */}
        <div className="flex-1 flex flex-col items-center justify-center gap-1.5 sm:gap-2 px-2 pb-2">
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
                className="h-11 sm:h-11 text-base sm:text-lg font-bold text-center p-2 pr-8 border-2 border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 min-h-[44px]"
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
              aria-label={`Edit patients for ${format(date, 'MMMM d')}. Current: ${trackingData.patients} patients`}
              className={cn(
                'w-full flex flex-col items-center justify-center gap-0.5',
                'rounded-lg p-1.5 sm:p-2 transition-all duration-200 min-h-[44px]',
                'border-0 outline-none',
                'hover:bg-primary/5 active:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1',
                trackingData.patients > 0 && 'bg-primary/5'
              )}
            >
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span className="text-base sm:text-lg md:text-xl font-bold text-primary">
                  {trackingData.patients || '0'}
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400">
                patients
              </span>
            </button>
          )}

          {/* Work RVUs input */}
          {isEditingWRVUs ? (
            <div className="w-full relative" onClick={(e) => e.stopPropagation()}>
              <Input
                ref={wrvuInputRef}
                type="number"
                value={wrvuValue}
                onChange={(e) => setWrvuValue(e.target.value)}
                onBlur={handleWRVUBlur}
                onKeyDown={handleWRVUKeyDown}
                min={0}
                step={0.01}
                placeholder="0.00"
                className="h-11 sm:h-11 text-base sm:text-lg font-bold text-center p-2 pr-8 border-2 border-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 min-h-[44px]"
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
              onClick={handleWRVUClick}
              aria-label={`Edit work RVUs for ${format(date, 'MMMM d')}. Current: ${trackingData.workRVUs.toFixed(2)} work RVUs`}
              className={cn(
                'w-full flex flex-col items-center justify-center gap-0.5',
                'rounded-lg p-1.5 sm:p-2 transition-all duration-200 min-h-[44px]',
                'border-0 outline-none',
                'hover:bg-primary/5 active:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1',
                trackingData.workRVUs > 0 && 'bg-primary/5'
              )}
            >
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span className="text-base sm:text-lg md:text-xl font-bold text-primary">
                  {trackingData.workRVUs > 0 ? trackingData.workRVUs.toFixed(2) : '0.00'}
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400">
                wRVUs
              </span>
            </button>
          )}
        </div>
      </div>
    </Tooltip>
  );
}

