'use client';

import * as React from 'react';
import { format, addMonths, subMonths, addWeeks, subWeeks, startOfToday } from 'date-fns';
import { CalendarDayCell } from './calendar-day-cell';
import { DateTypeSelector } from './date-type-selector';
import { CalendarSummary } from './calendar-summary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar, Grid, Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  getWeekDays,
  getWeeksInMonth,
  formatDateString,
  type DateString,
} from '@/lib/utils/calendar-helpers';

interface PatientCalendarViewProps {
  dailyPatientCounts?: Record<DateString, number>;
  vacationDates?: DateString[];
  cmeDates?: DateString[];
  holidayDates?: DateString[];
  onPatientCountChange?: (date: Date, count: number) => void;
  onDateTypeChange?: (date: Date, type: 'vacation' | 'cme' | 'holiday' | null) => void;
  avgWRVUPerEncounter?: number;
  adjustedWRVUPerEncounter?: number;
  className?: string;
}

type ViewMode = 'week' | 'month';

export function PatientCalendarView({
  dailyPatientCounts = {},
  vacationDates = [],
  cmeDates = [],
  holidayDates = [],
  onPatientCountChange,
  onDateTypeChange,
  avgWRVUPerEncounter = 0,
  adjustedWRVUPerEncounter = 0,
  className,
}: PatientCalendarViewProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = React.useState(startOfToday());
  const [selectedDates, setSelectedDates] = React.useState<Date[]>([]);

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
                          vacationDates={vacationDates}
                          cmeDates={cmeDates}
                          holidayDates={holidayDates}
                          isToday={isToday}
                          isCurrentMonth={isCurrentMonth}
                          onPatientCountChange={onPatientCountChange}
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
    </div>
  );
}
