'use client';

import * as React from 'react';
import { format, addMonths, subMonths, addWeeks, subWeeks, startOfToday } from 'date-fns';
import { CalendarDayCell } from './calendar-day-cell';
import { DateTypeSelector } from './date-type-selector';
import { CalendarSummary } from './calendar-summary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar, Grid, Info, Trash2, FileText, Users, Plane, CalendarCheck, BookOpen, Clock, CheckCircle2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils/cn';
import { Tooltip } from '@/components/ui/tooltip';
import { Popover } from '@/components/ui/popover';
import { useMobile } from '@/hooks/use-mobile';
import { NumberInputWithButtons } from '@/components/ui/number-input-with-buttons';
import { Label } from '@/components/ui/label';
import {
  getWeekDays,
  getWeeksInMonth,
  formatDateString,
  replicateWeekTemplate,
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
  // Template mode props
  vacationWeeks?: number;
  statutoryHolidays?: number;
  cmeDays?: number;
  onInputChange?: (field: 'vacationWeeks' | 'statutoryHolidays' | 'cmeDays', value: number) => void;
  onApplyTemplate?: () => void;
  // Patients per hour props
  patientsPerHour?: number;
  onPatientsPerHourChange?: (value: number) => void;
  onCalculatePatientsFromHours?: () => void;
  onApplyWorkWeekTemplate?: (totalHours: number) => void;
  className?: string;
}

type ViewMode = 'template' | 'week' | 'month';

const MODE_DESCRIPTIONS = {
  template: 'Enter patients and hours for one week, then replicate across the year',
  week: 'Manually enter patient counts and hours for one week at a time',
  month: 'Manually enter patient counts and hours for the full month',
};

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
  // Template mode props
  vacationWeeks = 4,
  statutoryHolidays = 10,
  cmeDays = 5,
  onInputChange,
  onApplyTemplate,
  // Patients per hour props
  patientsPerHour = 0,
  onPatientsPerHourChange,
  onCalculatePatientsFromHours,
  onApplyWorkWeekTemplate,
  className,
}: PatientCalendarViewProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>('template');
  const [currentDate, setCurrentDate] = React.useState(startOfToday());
  const [selectedDates, setSelectedDates] = React.useState<Date[]>([]);
  const [showClearDialog, setShowClearDialog] = React.useState(false);
  const [showTemplateSuccess, setShowTemplateSuccess] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const isMobile = useMobile();

  // Ensure component is mounted to avoid hydration mismatches with localStorage data
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

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
    } else if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    }
    // Template mode doesn't need navigation
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    }
    // Template mode doesn't need navigation
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
    } else if (viewMode === 'month') {
      return getWeeksInMonth(currentDate);
    } else {
      // Template mode - show one week
      const weekDays = getWeekDays(startOfToday());
      return [weekDays];
    }
  };

  const weeks = getDaysToDisplay();
  const monthYear = format(currentDate, 'MMMM yyyy');
  const weekRange =
    viewMode === 'week'
      ? `${format(weeks[0][0], 'MMM d')} - ${format(weeks[0][6], 'MMM d, yyyy')}`
      : viewMode === 'template'
      ? 'Week Pattern'
      : monthYear;

  // Calculate total hours per week (for week view) - must be at top level
  const totalHours = React.useMemo(() => {
    if (viewMode !== 'week') return 0;
    const weekDays = weeks[0] || [];
    return weekDays.reduce((sum, date) => {
      const dateStr = formatDateString(date);
      return sum + (dailyHours[dateStr] || 0);
    }, 0);
  }, [viewMode, weeks, dailyHours]);

  // Calculate template week totals (for template view) - must be at top level
  const templateTotals = React.useMemo(() => {
    if (viewMode !== 'template') return { totalHours: 0, totalPatients: 0 };
    const weekDays = weeks[0] || [];
    const totals = weekDays.reduce(
      (acc, date) => {
        const dateStr = formatDateString(date);
        // Skip vacation/CME/holiday dates
        const isVacation = vacationDates?.includes(dateStr);
        const isCME = cmeDates?.includes(dateStr);
        const isHoliday = holidayDates?.includes(dateStr);
        if (isVacation || isCME || isHoliday) return acc;
        
        acc.totalHours += dailyHours[dateStr] || 0;
        acc.totalPatients += dailyPatientCounts[dateStr] || 0;
        return acc;
      },
      { totalHours: 0, totalPatients: 0 }
    );
    return totals;
  }, [viewMode, weeks, dailyHours, dailyPatientCounts, vacationDates, cmeDates, holidayDates]);

  // Mode button component with tooltip/popover
  const ModeButton = ({ mode, icon: Icon, label, description }: { mode: ViewMode; icon: React.ElementType; label: string; description: string }) => {
    const isActive = viewMode === mode;
    
    if (isMobile) {
      return (
        <Popover
          content={description}
          side="bottom"
        >
          <Button
            type="button"
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode(mode)}
            className="w-full sm:w-auto min-h-[44px] touch-target flex items-center justify-center gap-2"
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
            <Info className="w-3.5 h-3.5 opacity-60" />
          </Button>
        </Popover>
      );
    }

    return (
      <Tooltip content={description} side="bottom" disableOnTouch={false}>
        <Button
          type="button"
          variant={isActive ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode(mode)}
          className="min-w-[80px] h-8"
        >
          <Icon className="w-4 h-4 mr-1.5" />
          {label}
        </Button>
      </Tooltip>
    );
  };

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Header Card */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
                Patient Calendar
              </CardTitle>
              
              {/* View mode toggle - Mobile-first: stack vertically on mobile */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-full sm:w-auto">
                <ModeButton mode="template" icon={FileText} label="Week Pattern" description={MODE_DESCRIPTIONS.template} />
                <ModeButton mode="week" icon={Calendar} label="Week" description={MODE_DESCRIPTIONS.week} />
                <ModeButton mode="month" icon={Grid} label="Month" description={MODE_DESCRIPTIONS.month} />
              </div>
            </div>

            {/* Navigation controls - Hide in template mode */}
            {viewMode !== 'template' && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  aria-label="Previous"
                  className="h-9 w-9 p-0 min-h-[44px] touch-target"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleToday}
                  className="h-9 px-4 font-medium min-h-[44px] touch-target"
                >
                  Today
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  aria-label="Next"
                  className="h-9 w-9 p-0 min-h-[44px] touch-target"
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
                    className="h-9 px-3 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700 min-h-[44px] touch-target"
                    aria-label="Clear calendar"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    <span className="hidden sm:inline">Clear</span>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Month/Year display */}
          <div className="flex items-center justify-between pt-2">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              {weekRange}
            </h3>
            
            {/* Help text - Hide in template mode */}
            {viewMode !== 'template' && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Info className="w-3.5 h-3.5" />
                <span>Right-click to mark dates</span>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

          {/* Week Pattern Mode Content - Week Calendar View */}
      {viewMode === 'template' && (
        <div className="space-y-4">
          {/* Vacation/CME/Holiday Inputs */}
          <Card className="border-2">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <NumberInputWithButtons
                  label="Vacation Weeks"
                  value={vacationWeeks}
                  onChange={(value) => onInputChange?.('vacationWeeks', value)}
                  icon={<Plane className="w-5 h-5" />}
                  min={0}
                  max={52}
                  step={1}
                  integerOnly
                />
                <NumberInputWithButtons
                  label="Statutory Holidays"
                  value={statutoryHolidays}
                  onChange={(value) => onInputChange?.('statutoryHolidays', value)}
                  icon={<CalendarCheck className="w-5 h-5" />}
                  min={0}
                  max={365}
                  step={1}
                  integerOnly
                />
                <NumberInputWithButtons
                  label="CME Days"
                  value={cmeDays}
                  onChange={(value) => onInputChange?.('cmeDays', value)}
                  icon={<BookOpen className="w-5 h-5" />}
                  min={0}
                  max={365}
                  step={1}
                  integerOnly
                />
              </div>
            </CardContent>
          </Card>

          {/* Patients Per Hour Calculator */}
          <Card className="border-2">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1 w-full sm:w-auto">
                    <NumberInputWithButtons
                      label="Patients Per Hour"
                      value={patientsPerHour}
                      onChange={(value) => onPatientsPerHourChange?.(value)}
                      icon={<Users className="w-5 h-5" />}
                      min={0}
                      step={0.1}
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">
                      Enter hours and patients will auto-calculate (when patients = 0). Use the button to recalculate all days.
                    </p>
                  </div>
                  {onCalculatePatientsFromHours && (
                    <Button
                      type="button"
                      onClick={onCalculatePatientsFromHours}
                      disabled={patientsPerHour <= 0}
                      className="w-full sm:w-auto min-h-[44px] touch-target"
                      variant="outline"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Calculate Patients from Hours
                    </Button>
                  )}
                </div>

                {/* Predefined Work Week Templates */}
                {onApplyWorkWeekTemplate && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                      Quick Fill
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        onClick={() => onApplyWorkWeekTemplate(32)}
                        variant="outline"
                        className="min-h-[44px] touch-target flex flex-col items-center justify-center gap-0.5 py-2"
                      >
                        <span className="text-lg font-semibold">32</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">hours</span>
                      </Button>
                      <Button
                        type="button"
                        onClick={() => onApplyWorkWeekTemplate(36)}
                        variant="outline"
                        className="min-h-[44px] touch-target flex flex-col items-center justify-center gap-0.5 py-2"
                      >
                        <span className="text-lg font-semibold">36</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">hours</span>
                      </Button>
                      <Button
                        type="button"
                        onClick={() => onApplyWorkWeekTemplate(40)}
                        variant="outline"
                        className="min-h-[44px] touch-target flex flex-col items-center justify-center gap-0.5 py-2"
                      >
                        <span className="text-lg font-semibold">40</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">hours</span>
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                      8h Mon-Thu, Friday adjusts
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Week Calendar - Same as Week mode but hide dates */}
          <Card className="border-2">
            <CardContent className="p-4 sm:p-6">
              <div className="w-full overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-2 min-w-[700px] pl-1 pr-1">
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

                {/* Calendar days - One week */}
                <div className="space-y-2 sm:space-y-3 min-w-[700px] pb-1 pl-1 pr-1">
                  <div className="grid grid-cols-7 gap-2 sm:gap-3">
                    {weeks[0]?.map((date) => {
                      const dateStr = formatDateString(date);
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
                            isCurrentMonth={true}
                            onPatientCountChange={onPatientCountChange}
                            onHoursChange={onHoursChange}
                            onDateTypeChange={onDateTypeChange}
                            hideDate={true}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Week Summary - Week Pattern View */}
          <Card className="border-2 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                {/* Total Hours */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-primary/10 dark:bg-primary/20">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                        Total Hours
                      </p>
                      <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                        {templateTotals.totalHours.toFixed(1)}
                        <span className="text-xl sm:text-2xl font-normal text-gray-500 dark:text-gray-400 ml-1">
                          h
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px h-16 bg-gray-300 dark:bg-gray-700" />

                {/* Total Patients */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-primary/10 dark:bg-primary/20">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                        Total Patients
                      </p>
                      <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                        {templateTotals.totalPatients.toLocaleString()}
                        <span className="text-xl sm:text-2xl font-normal text-gray-500 dark:text-gray-400 ml-1">
                          patients
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Apply Week Pattern Button */}
          {onApplyTemplate && (
            <Card className="border-2">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <Button
                  type="button"
                  onClick={() => {
                    onApplyTemplate();
                    setShowTemplateSuccess(true);
                    setTimeout(() => setShowTemplateSuccess(false), 3000);
                  }}
                  className="w-full sm:w-auto min-h-[44px] touch-target"
                  size="lg"
                >
                  Apply Week Pattern to Year
                </Button>
                {showTemplateSuccess && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>Week pattern applied successfully! Your week pattern has been replicated across the year.</span>
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This will replicate this week&#39;s pattern across all matching days of the year (e.g., all Mondays, all Tuesdays, etc.), excluding vacation, CME, and holiday dates.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Week/Month Mode Content */}
      {viewMode !== 'template' && (
        <>
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

          {/* Patients Per Hour Calculator - Week Mode Only */}
          {viewMode === 'week' && (
            <Card className="border-2">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1 w-full sm:w-auto">
                      <NumberInputWithButtons
                        label="Patients Per Hour"
                        value={patientsPerHour}
                        onChange={(value) => onPatientsPerHourChange?.(value)}
                        icon={<Users className="w-5 h-5" />}
                        min={0}
                        step={0.1}
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">
                        Enter hours and patients will auto-calculate (when patients = 0). Use the button to recalculate all days.
                      </p>
                    </div>
                    {onCalculatePatientsFromHours && (
                      <Button
                        type="button"
                        onClick={onCalculatePatientsFromHours}
                        disabled={patientsPerHour <= 0}
                        className="w-full sm:w-auto min-h-[44px] touch-target"
                        variant="outline"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Calculate Patients from Hours
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Calendar grid */}
          <Card className="border-2">
            <CardContent className="p-4 sm:p-6">
              <div className="w-full overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-2 min-w-[700px] pl-1 pr-1">
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
                <div className="space-y-2 sm:space-y-3 min-w-[700px] pb-1 pl-1 pr-1">
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

          {/* Total Hours Per Week - Week View Only */}
          {viewMode === 'week' && (
            <Card className="border-2">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Total Hours per Week
                    </span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-bold text-primary">
                    {totalHours.toFixed(1)}h
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

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
        </>
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
