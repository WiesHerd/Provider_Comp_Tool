'use client';

import * as React from 'react';
import { format, addMonths, subMonths, addWeeks, subWeeks, startOfToday } from 'date-fns';
import { CalendarDayCell } from './calendar-day-cell';
import { DateTypeSelector } from './date-type-selector';
import { CalendarSummary } from './calendar-summary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar, Grid, Info, Trash2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils/cn';
import {
  getWeekDays,
  getWeeksInMonth,
  formatDateString,
  type DateString,
} from '@/lib/utils/calendar-helpers';

interface PatientCalendarViewProps {
  dailyPatientCounts?: Record<DateString, number>;
  dailyHours?: Record<DateString, number>;
  vacationDates?: DateString[];
  cmeDates?: DateString[];
  holidayDates?: DateString[];
  onPatientCountChange?: (date: Date, count: number) => void;
  onHoursChange?: (date: Date, hours: number) => void;
  onDateTypeChange?: (date: Date, type: 'vacation' | 'cme' | 'holiday' | null) => void;
  onClearCalendar?: () => void;
  avgWRVUPerEncounter?: number;
  adjustedWRVUPerEncounter?: number;
  className?: string;
}

type ViewMode = 'week' | 'month';

export function PatientCalendarView({
  dailyPatientCounts = {},
  dailyHours = {},
  vacationDates = [],
  cmeDates = [],
  holidayDates = [],
  onPatientCountChange,
  onHoursChange,
  onDateTypeChange,
  onClearCalendar,
  avgWRVUPerEncounter = 0,
  adjustedWRVUPerEncounter = 0,
  className,
}: PatientCalendarViewProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = React.useState(startOfToday());
  const [selectedDates, setSelectedDates] = React.useState<Date[]>([]);
  const [showClearDialog, setShowClearDialog] = React.useState(false);

  // Check if calendar has any data
  const hasCalendarData = React.useMemo(() => {
    const hasPatientCounts = Object.keys(dailyPatientCounts || {}).length > 0 &&
      Object.values(dailyPatientCounts || {}).some(count => count > 0);
    const hasHours = Object.keys(dailyHours || {}).length > 0 &&
      Object.values(dailyHours || {}).some(hours => hours > 0);
    const hasVacationDates = (vacationDates || []).length > 0;
    const hasCmeDates = (cmeDates || []).length > 0;
    const hasHolidayDates = (holidayDates || []).length > 0;
    return hasPatientCounts || hasHours || hasVacationDates || hasCmeDates || hasHolidayDates;
  }, [dailyPatientCounts, dailyHours, vacationDates, cmeDates, holidayDates]);

  const handleClearClick = () => {
    setShowClearDialog(true);
  };

  const handleClearConfirm = () => {
    onClearCalendar?.();
    setShowClearDialog(false);
  };

  const today = startOfToday();

  // Navigation handlers
  const handlePrevious = () => {
    if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(startOfToday());
  };

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

  const handleMarkAsVacation = (dates: Date[]) => {
    dates.forEach((date) => {
      onDateTypeChange?.(date, 'vacation');
    });
    setSelectedDates([]);
  };

  const handleMarkAsCME = (dates: Date[]) => {
    dates.forEach((date) => {
      onDateTypeChange?.(date, 'cme');
    });
    setSelectedDates([]);
  };

  const handleMarkAsHoliday = (dates: Date[]) => {
    dates.forEach((date) => {
      onDateTypeChange?.(date, 'holiday');
    });
    setSelectedDates([]);
  };

  const handleClearType = (dates: Date[]) => {
    dates.forEach((date) => {
      onDateTypeChange?.(date, null);
    });
    setSelectedDates([]);
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
  const monthYear = format(currentDate, 'MMMM yyyy');
  const weekRange =
    viewMode === 'week'
      ? `${format(weeks[0][0], 'MMM d')} - ${format(weeks[0][6], 'MMM d, yyyy')}`
      : monthYear;

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Header Card */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
                Patient Calendar
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
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                aria-label="Previous"
                className="h-9 w-9 p-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="h-9 px-4 font-medium"
              >
                Today
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleNext}
                aria-label="Next"
                className="h-9 w-9 p-0"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
              
              {/* Clear Calendar Button - Only show when there's data */}
              {hasCalendarData && onClearCalendar && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearClick}
                  className="h-9 px-3 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700"
                  aria-label="Clear calendar"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              )}
              
              {/* View mode toggle - Mobile */}
              <div className="sm:hidden flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 ml-2">
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

          {/* Month/Year display */}
          <div className="flex items-center justify-between pt-2">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              {weekRange}
            </h3>
            
            {/* Help text */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Info className="w-3.5 h-3.5" />
              <span>Right-click to mark dates</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Date type selector */}
      {selectedDates.length > 0 && (
        <DateTypeSelector
          selectedDates={selectedDates}
          onMarkAsVacation={handleMarkAsVacation}
          onMarkAsCME={handleMarkAsCME}
          onMarkAsHoliday={handleMarkAsHoliday}
          onClearType={handleClearType}
        />
      )}

      {/* Calendar grid - Desktop optimized */}
      <Card className="border-2">
        <CardContent className="p-4 sm:p-6">
          <div className="w-full overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-2 min-w-[700px]">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 py-2 px-1"
                >
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.slice(0, 3)}</span>
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="space-y-2 sm:space-y-3 min-w-[700px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-2 sm:gap-3">
                  {week.map((date) => {
                    const dateStr = formatDateString(date);
                    const isCurrentMonth = format(date, 'M') === format(currentDate, 'M');
                    const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                    const patientCount = dailyPatientCounts[dateStr] || 0;
                    const hours = dailyHours[dateStr] || 0;
                    const isSelected = selectedDates.some(
                      (d) => formatDateString(d) === dateStr
                    );

                    return (
                      <div
                        key={dateStr}
                        onClick={() => handleDateClick(date)}
                        className={cn(
                          'transition-all duration-200',
                          isSelected && 'ring-2 ring-primary ring-offset-2 rounded-xl'
                        )}
                      >
                        <CalendarDayCell
                          date={date}
                          patientCount={patientCount}
                          hours={hours}
                          vacationDates={vacationDates}
                          cmeDates={cmeDates}
                          holidayDates={holidayDates}
                          isToday={isToday}
                          isCurrentMonth={isCurrentMonth}
                          onPatientCountChange={onPatientCountChange}
                          onHoursChange={onHoursChange}
                          onDateTypeChange={onDateTypeChange}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 border-2 border-blue-300 dark:border-blue-700" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Vacation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 border-2 border-purple-300 dark:border-purple-700" />
              <span className="font-medium text-gray-700 dark:text-gray-300">CME</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 border-2 border-red-300 dark:border-red-700" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Holiday</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-gray-50 dark:bg-gray-800/30 border-2 border-gray-200 dark:border-gray-700" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Weekend</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">Click to add patients • Right-click to mark dates</span>
              <span className="sm:hidden">Tap to add • Long-press to mark</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary */}
      {(avgWRVUPerEncounter > 0 || adjustedWRVUPerEncounter > 0) && (
        <CalendarSummary
          currentDate={currentDate}
          dailyPatientCounts={dailyPatientCounts}
          vacationDates={vacationDates}
          cmeDates={cmeDates}
          holidayDates={holidayDates}
          avgWRVUPerEncounter={avgWRVUPerEncounter}
          adjustedWRVUPerEncounter={adjustedWRVUPerEncounter}
        />
      )}

      {/* Clear Calendar Confirmation Dialog */}
      <Dialog.Root open={showClearDialog} onOpenChange={setShowClearDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-[90vw] z-50 shadow-xl">
            <Dialog.Title className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              Clear Calendar
            </Dialog.Title>
            <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to clear all calendar data? This will remove all patient counts, vacation dates, CME dates, and holiday dates. This action cannot be undone.
            </Dialog.Description>
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Dialog.Close asChild>
                <Button variant="outline" className="w-full sm:w-auto min-h-[44px] touch-target">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                onClick={handleClearConfirm}
                variant="outline"
                className="w-full sm:w-auto min-h-[44px] touch-target text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
