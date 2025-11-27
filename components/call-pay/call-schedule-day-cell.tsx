'use client';

import * as React from 'react';
import { memo } from 'react';
import { cn } from '@/lib/utils/cn';
import { format, isWeekend } from 'date-fns';
import { CallDayAssignment, CallDayType } from '@/types/call-schedule';
import { CallProvider } from '@/types/call-pay-engine';

interface CallScheduleDayCellProps {
  date: Date;
  assignment: CallDayAssignment | null;
  providers: CallProvider[];
  isToday?: boolean;
  isCurrentMonth?: boolean;
  onAssignmentChange?: (assignment: CallDayAssignment) => void;
  onClick?: (date: Date) => void; // Opens assignment dialog
  disabled?: boolean;
}

export const CallScheduleDayCell = memo(function CallScheduleDayCell({
  date,
  assignment,
  providers,
  isToday = false,
  isCurrentMonth = true,
  onClick,
  disabled = false,
}: CallScheduleDayCellProps) {

  const isWeekendDay = isWeekend(date);
  // Use assignment type if available, otherwise infer from date
  const dayType: CallDayType = assignment?.type || (isWeekendDay ? 'weekend' : 'weekday');
  
  // Get all tier assignments for this day
  const tierAssignments = assignment?.tierAssignments || [];
  // Check if any tier has an assigned provider
  const hasAssignedProvider = assignment?.tierAssignments?.some(ta => ta.providerId !== null) ?? false;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    // Open assignment dialog via parent component
    if (onClick) {
      onClick(date);
    }
  };

  const cellClasses = cn(
    'relative flex flex-col h-full min-h-[100px] sm:min-h-[120px] md:min-h-[140px] lg:min-h-[110px]',
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
    !disabled && 'hover:border-primary/50 hover:shadow-sm hover:bg-gray-50/50 dark:hover:bg-gray-800/50',
    // Day type styling
    dayType === 'weekend' && !hasAssignedProvider && [
      'bg-gradient-to-br from-purple-50/30 to-purple-100/20 dark:from-purple-900/10 dark:to-purple-800/5',
    ],
    dayType === 'holiday' && !hasAssignedProvider && [
      'bg-gradient-to-br from-red-50/30 to-red-100/20 dark:from-red-900/10 dark:to-red-800/5',
    ],
    // Assigned styling
    hasAssignedProvider && [
      dayType === 'weekday' && 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700',
      dayType === 'weekend' && 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700',
      dayType === 'holiday' && 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700',
    ],
    // Disabled state
    disabled && 'opacity-40 cursor-not-allowed',
  );

  const dayNumber = format(date, 'd');
  const dayName = format(date, 'EEE');

  return (
    <div
      className={cellClasses}
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`${format(date, 'EEEE, MMMM d')}${tierAssignments.length > 0 ? `, ${tierAssignments.length} tier assignment(s)` : ', unassigned'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!disabled) handleClick(e as any);
        }
      }}
    >
      {/* Day header */}
      <div className="flex items-center justify-between px-2 pt-2 pb-1">
        <span
          className={cn(
            'text-[10px] sm:text-xs font-medium uppercase tracking-wide',
            !isCurrentMonth && 'text-gray-400 dark:text-gray-600',
            isCurrentMonth && isWeekendDay && 'text-gray-500 dark:text-gray-400',
            isCurrentMonth && !isWeekendDay && 'text-gray-600 dark:text-gray-400',
          )}
        >
          {dayName}
        </span>
        <span
          className={cn(
            'text-sm sm:text-base font-bold',
            !isCurrentMonth && 'text-gray-400 dark:text-gray-600',
            isCurrentMonth && isToday && 'text-primary',
            isCurrentMonth && !isToday && isWeekendDay && 'text-gray-500 dark:text-gray-400',
            isCurrentMonth && !isToday && !isWeekendDay && 'text-gray-700 dark:text-gray-300',
          )}
        >
          {dayNumber}
        </span>
      </div>

      {/* Assignment content */}
      <div className="flex-1 flex flex-col items-center justify-center px-2 pb-2 lg:px-1.5 lg:pb-1.5 gap-1.5 lg:gap-1">
        {tierAssignments.length > 0 ? (
          <>
            {/* Display each tier assignment */}
            <div className="w-full space-y-1.5 lg:space-y-1">
              {tierAssignments.map((tierAssignment, idx) => {
                const assignedProvider = tierAssignment.providerId
                  ? providers.find(p => p.id === tierAssignment.providerId)
                  : null;
                const providerInitials = assignedProvider?.name
                  ? assignedProvider.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  : null;

                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center justify-between gap-2 lg:gap-1.5 px-2 py-1.5 lg:px-1.5 lg:py-1 rounded-lg",
                      "bg-white dark:bg-gray-800",
                      "border-2 transition-all duration-150",
                      "shadow-sm hover:shadow",
                      dayType === 'weekday' && [
                        "border-blue-200 dark:border-blue-700",
                        "bg-blue-50/50 dark:bg-blue-900/20",
                        "hover:border-blue-300 dark:hover:border-blue-600",
                      ],
                      dayType === 'weekend' && [
                        "border-purple-200 dark:border-purple-700",
                        "bg-purple-50/50 dark:bg-purple-900/20",
                        "hover:border-purple-300 dark:hover:border-purple-600",
                      ],
                      dayType === 'holiday' && [
                        "border-red-200 dark:border-red-700",
                        "bg-red-50/50 dark:bg-red-900/20",
                        "hover:border-red-300 dark:hover:border-red-600",
                      ],
                    )}
                  >
                    <span className={cn(
                      "text-[10px] sm:text-[11px] font-bold uppercase tracking-wide",
                      "min-w-[28px] text-center",
                      dayType === 'weekday' && "text-blue-700 dark:text-blue-300",
                      dayType === 'weekend' && "text-purple-700 dark:text-purple-300",
                      dayType === 'holiday' && "text-red-700 dark:text-red-300",
                    )}>
                      {tierAssignment.tierId}
                    </span>
                    {tierAssignment.providerId ? (
                      <span className={cn(
                        "text-[10px] sm:text-[11px] font-semibold truncate flex-1 text-right",
                        "px-1.5 py-0.5 rounded",
                        dayType === 'weekday' && [
                          "text-blue-800 dark:text-blue-200",
                          "bg-blue-100 dark:bg-blue-900/40",
                        ],
                        dayType === 'weekend' && [
                          "text-purple-800 dark:text-purple-200",
                          "bg-purple-100 dark:bg-purple-900/40",
                        ],
                        dayType === 'holiday' && [
                          "text-red-800 dark:text-red-200",
                          "bg-red-100 dark:bg-red-900/40",
                        ],
                      )}>
                        {providerInitials || '?'}
                      </span>
                    ) : (
                      <span className={cn(
                        "text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500",
                        "italic px-1.5"
                      )}>
                        —
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className={cn(
            "text-[10px] sm:text-xs text-gray-400 dark:text-gray-500",
            "text-center px-2 py-2 italic"
          )}>
            {dayType === 'holiday' ? 'Holiday' : dayType === 'weekend' ? 'Weekend' : 'Available'}
          </div>
        )}
      </div>

      {/* Day type indicator (subtle) */}
      {tierAssignments.length > 0 && (
        <div className={cn(
          "absolute bottom-1 left-1 right-1 h-1 rounded-full",
          dayType === 'weekday' && "bg-blue-400 dark:bg-blue-500",
          dayType === 'weekend' && "bg-purple-400 dark:bg-purple-500",
          dayType === 'holiday' && "bg-red-400 dark:bg-red-500",
        )} />
      )}
    </div>
  );
});

