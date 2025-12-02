'use client';

import * as React from 'react';
import { memo } from 'react';
import { format, addMonths, subMonths, startOfToday, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { WRVUCalendarDayCell } from './wrvu-calendar-day-cell';
import { MonthGoalsCompact } from './month-goals-compact';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar, Grid, Info, CalendarDays } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils/cn';
import {
  getWeekDays,
  getWeeksInMonth,
  formatDateString,
  type DateString,
} from '@/lib/utils/calendar-helpers';
import { DailyTrackingData, MonthlyGoals } from '@/types/provider-wrvu-tracking';

interface WRVUCalendarViewProps {
  dailyData?: Record<DateString, DailyTrackingData>;
  onDataChange?: (date: Date, data: DailyTrackingData) => void;
  onMonthChange?: (date: Date) => void;
  initialDate?: Date;
  className?: string;
  hasAnyData?: boolean;
  saveIndicator?: React.ReactNode;
  goals?: MonthlyGoals;
  onGoalsChange?: (goals: MonthlyGoals) => void;
}

type ViewMode = 'week' | 'month';

export const WRVUCalendarView = memo(function WRVUCalendarView({
  dailyData = {},
  onDataChange,
  onMonthChange,
  initialDate,
  className,
  hasAnyData = false,
  saveIndicator,
  goals,
  onGoalsChange,
}: WRVUCalendarViewProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>('month');
  const [mounted, setMounted] = React.useState(false);
  const [currentDate, setCurrentDate] = React.useState<Date>(() => {
    if (initialDate) return initialDate;
    if (typeof window !== 'undefined') {
      return startOfToday();
    }
    // Server-side: use a fixed date to avoid hydration mismatch
    return new Date();
  });
  const [selectedDates, setSelectedDates] = React.useState<Date[]>([]);

  React.useEffect(() => {
    setMounted(true);
    if (initialDate) {
      setCurrentDate(initialDate);
    }
  }, [initialDate]);

  const today = React.useMemo(() => {
    return mounted ? startOfToday() : new Date();
  }, [mounted]);

  // Navigation handlers
  const handlePrevious = () => {
    let newDate: Date;
    if (viewMode === 'week') {
      newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate = subMonths(currentDate, 1);
    }
    setCurrentDate(newDate);
    if (onMonthChange && viewMode === 'month') {
      onMonthChange(newDate);
    }
  };

  const handleNext = () => {
    let newDate: Date;
    if (viewMode === 'week') {
      newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate = addMonths(currentDate, 1);
    }
    setCurrentDate(newDate);
    if (onMonthChange && viewMode === 'month') {
      onMonthChange(newDate);
    }
  };

  const handleToday = () => {
    const today = startOfToday();
    setCurrentDate(today);
    if (onMonthChange) {
      onMonthChange(today);
    }
  };

  // Check if we're viewing the current week/month
  const isViewingToday = React.useMemo(() => {
    if (viewMode === 'week') {
      const weekStart = getWeekDays(currentDate)[0];
      const weekEnd = getWeekDays(currentDate)[6];
      return today >= weekStart && today <= weekEnd;
    } else {
      return format(currentDate, 'yyyy-MM') === format(today, 'yyyy-MM');
    }
  }, [currentDate, today, viewMode]);

  // Date selection handlers
  const handleDateClick = (date: Date) => {
    setSelectedDates((prev) => {
      const dateStr = formatDateString(date);
      const isSelected = prev.some((d) => formatDateString(d) === dateStr);
      if (isSelected) {
        return prev.filter((d) => formatDateString(d) !== dateStr);
      }
      return [...prev, date];
    });
  };

  // Get days to display based on view mode
  const getDaysToDisplay = (): Date[][] => {
    if (viewMode === 'week') {
      const weekDays = getWeekDays(currentDate);
      return [weekDays];
    } else {
      return getWeeksInMonth(currentDate);
    }
  };

  const weeks = getDaysToDisplay();
  const monthYear = format(currentDate, 'MMM yyyy'); // Changed to abbreviated month
  const weekRange =
    viewMode === 'week'
      ? `${format(weeks[0][0], 'MMM d')} - ${format(weeks[0][6], 'MMM d, yyyy')}`
      : monthYear;

  // Calculate current month stats for goals progress
  const monthStats = React.useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
      
      let totalPatients = 0;
      let totalWRVUs = 0;
      
      monthDays.forEach((day) => {
        const dateStr = formatDateString(day);
        const data = dailyData[dateStr];
        if (data) {
          totalPatients += data.patients || 0;
          totalWRVUs += data.workRVUs || 0;
        }
      });
      
      return { totalPatients, totalWRVUs };
    }
    return { totalPatients: 0, totalWRVUs: 0 };
  }, [currentDate, dailyData, viewMode]);

  const handleDataChange = (date: Date, data: DailyTrackingData) => {
    if (onDataChange) {
      // If there are selected dates and the changed date is one of them, apply to all selected
      if (selectedDates.length > 0) {
        const dateStr = formatDateString(date);
        const isInSelection = selectedDates.some((d) => formatDateString(d) === dateStr);
        
        if (isInSelection) {
          // Apply the same data to all selected dates
          selectedDates.forEach((selectedDate) => {
            onDataChange(selectedDate, data);
          });
          // Clear selection after applying
          setSelectedDates([]);
        } else {
          // Normal single date update
          onDataChange(date, data);
        }
      } else {
        // Normal single date update
        onDataChange(date, data);
      }
    }
  };

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Header Card */}
      <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
                Work RVU Tracking Calendar
              </CardTitle>
              
              {/* View mode toggle - Desktop */}
              <div className="hidden sm:flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <Button
                  type="button"
                  variant={viewMode === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                  className="min-w-[80px] h-8"
                >
                  <Calendar className="w-4 h-4 mr-1.5" />
                  Week
                </Button>
                <Button
                  type="button"
                  variant={viewMode === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                  className="min-w-[80px] h-8"
                >
                  <Grid className="w-4 h-4 mr-1.5" />
                  Month
                </Button>
              </div>
            </div>

            {/* Navigation controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              {/* First row: Navigation arrows and month picker */}
              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  aria-label="Previous"
                  className="h-9 w-9 p-0 flex-shrink-0"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                
                {/* Month/Year Picker */}
                <Select
                  value={format(currentDate, 'yyyy-MM')}
                  onValueChange={(value) => {
                    const [year, month] = value.split('-').map(Number);
                    const newDate = new Date(year, month - 1, 1);
                    setCurrentDate(newDate);
                    if (onMonthChange) {
                      onMonthChange(newDate);
                    }
                  }}
                >
                  <SelectTrigger className="h-9 flex-1 sm:w-[140px] text-sm">
                    <CalendarDays className="w-4 h-4 mr-2 flex-shrink-0" />
                    <SelectValue>
                      {format(currentDate, 'MMM yyyy')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[400px]">
                    {Array.from({ length: 60 }, (_, i) => {
                      const date = new Date();
                      date.setMonth(date.getMonth() - 24 + i); // Show 2 years back and 3 years forward (60 months total)
                      const year = date.getFullYear();
                      const month = date.getMonth() + 1;
                      const monthYear = `${year}-${String(month).padStart(2, '0')}`;
                      const monthName = format(date, 'MMM yyyy'); // Changed to abbreviated
                      const isNewYear = month === 1 && i > 0;
                      
                      return (
                        <SelectItem key={monthYear} value={monthYear}>
                          {isNewYear && (
                            <span className="text-xs text-gray-400 mr-2">│</span>
                          )}
                          {monthName}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  aria-label="Next"
                  className="h-9 w-9 p-0 flex-shrink-0"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Second row on mobile: Today button and view mode toggle */}
              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <Button
                  type="button"
                  variant={isViewingToday ? "default" : "outline"}
                  size="sm"
                  onClick={handleToday}
                  className="h-9 px-4 font-medium flex-1 sm:flex-initial"
                >
                  Today
                </Button>
                
                {/* View mode toggle - Mobile */}
                <div className="sm:hidden flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex-shrink-0">
                  <Button
                    type="button"
                    variant={viewMode === 'week' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('week')}
                    className="min-w-[60px] h-8 px-2"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant={viewMode === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('month')}
                    className="min-w-[60px] h-8 px-2"
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Month/Year display with save indicator on right */}
          <div className="flex items-center justify-between pt-2 gap-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              {weekRange}
            </h3>
            {/* Save indicator - Right side, inline with month name */}
            {saveIndicator && (
              <div className="flex-shrink-0">
                {saveIndicator}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Calendar grid - Desktop optimized */}
      <Card className="border-2 shadow-md">
        <CardContent className="p-4 sm:p-6 pb-6">
          {/* Top: Tooltip on left, Goals on right */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 mb-4 min-w-0 overflow-hidden">
            {/* Help tooltip - Left side */}
            <Tooltip
              content="Select multiple dates, then enter data once to apply the same values to all selected dates."
              side="bottom"
            >
              <button
                type="button"
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors touch-target flex-shrink-0 self-start sm:self-center"
                aria-label="Help"
              >
                <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
              </button>
            </Tooltip>
            
            {/* Goals - Right side */}
            {onGoalsChange && (
              <div className="flex-1 min-w-0 overflow-hidden flex sm:justify-end">
                <MonthGoalsCompact
                  goals={goals}
                  onGoalsChange={onGoalsChange}
                  actualPatients={monthStats.totalPatients}
                  actualWRVUs={monthStats.totalWRVUs}
                />
              </div>
            )}
          </div>

          {/* Empty state guidance for first-time users */}
          {!hasAnyData && (
            <div className="mb-4 p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    Get Started
                  </p>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    Tap any day in the calendar below to add your patient count and work RVUs. Your data is automatically saved as you enter it.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="w-full overflow-x-auto overflow-y-visible -mx-4 sm:mx-0 px-4 sm:px-6 sm:px-0 calendar-container-landscape">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-2 min-w-[700px] calendar-grid-landscape">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 py-2 px-1"
                >
                  <span className="hidden sm:inline calendar-day-name-landscape">{day}</span>
                  <span className="sm:hidden calendar-day-name-short-landscape">{day.slice(0, 3)}</span>
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="space-y-2 sm:space-y-3 min-w-[700px] calendar-grid-landscape pb-2">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-2 sm:gap-3">
                  {week.map((date) => {
                    const dateStr = formatDateString(date);
                    const isCurrentMonth = format(date, 'M') === format(currentDate, 'M');
                    const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                    const trackingData = dailyData[dateStr] || { patients: 0, workRVUs: 0 };
                    const isSelected = selectedDates.some(
                      (d) => formatDateString(d) === dateStr
                    );

                    return (
                      <div
                        key={dateStr}
                        onClick={() => handleDateClick(date)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Select ${format(date, 'MMMM d, yyyy')} for bulk data entry`}
                        aria-pressed={isSelected}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleDateClick(date);
                          }
                        }}
                        className={cn(
                          'transition-all duration-200',
                          isSelected && 'ring-2 ring-primary ring-offset-0 rounded-xl',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                        )}
                      >
                        <WRVUCalendarDayCell
                          date={date}
                          trackingData={trackingData}
                          isToday={isToday}
                          isCurrentMonth={isCurrentMonth}
                          onDataChange={handleDataChange}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          
          {/* Subtle help text - Apple style, no container */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              {selectedDates.length > 0 
                ? `${selectedDates.length} date${selectedDates.length !== 1 ? 's' : ''} selected • Enter data to apply to all`
                : 'Click dates to select multiple • Enter data to apply to all selected • Double-click to clear'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

