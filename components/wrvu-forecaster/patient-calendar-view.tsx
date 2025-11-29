'use client';

import * as React from 'react';
import { format, addMonths, subMonths, addWeeks, subWeeks, startOfToday } from 'date-fns';
import { CalendarDayCell } from './calendar-day-cell';
import { DateTypeSelector } from './date-type-selector';
import { CalendarSummary } from './calendar-summary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar, Grid, Trash2, FileText, Users, Plane, CalendarCheck, BookOpen, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils/cn';
import { Tooltip } from '@/components/ui/tooltip';
import { ScreenInfoModal } from '@/components/ui/screen-info-modal';
import { NumberInputWithButtons } from '@/components/ui/number-input-with-buttons';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  // Template mode props
  vacationWeeks?: number;
  statutoryHolidays?: number;
  cmeDays?: number;
  onInputChange?: (field: 'vacationWeeks' | 'statutoryHolidays' | 'cmeDays', value: number) => void;
  onApplyTemplate?: () => void;
  // Patients per hour props
  patientsPerHour?: number;
  onPatientsPerHourChange?: (value: number) => void;
  patientsPerDay?: number;
  onPatientsPerDayChange?: (value: number) => void;
  isPerHour?: boolean;
  onIsPerHourChange?: (value: boolean) => void;
  onCalculatePatientsFromHours?: () => void;
  onCalculatePatientsFromDay?: () => void;
  onApplyWorkWeekTemplate?: (totalHours: number, dayToReduce?: number) => void;
  onAvgWRVUChange?: (value: number) => void;
  onAdjustedWRVUChange?: (value: number) => void;
  className?: string;
}

type ViewMode = 'template' | 'week' | 'month';

const MODE_DESCRIPTIONS = {
  template: 'Week Pattern: Create a template week that replicates across the entire year. Perfect for providers with consistent weekly schedules. Enter patients and hours for one week, set non-clinical time, then apply to the entire year.',
  week: 'Week View: Manually enter patient counts and hours one week at a time. Navigate between weeks using the arrow buttons. Best for providers with varying weekly schedules or when you need week-by-week precision.',
  month: 'Month View: View and edit the full month at once. Navigate between months to see the complete picture. Ideal for detailed month-by-month planning and bulk date selection.',
};

const COMPREHENSIVE_HELP_CONTENT = `## Patient Calendar Guide

The Patient Calendar helps you forecast annual wRVUs by entering patient counts and clinical hours. Choose the view mode that best fits your workflow.

## Week Pattern Mode

**Purpose**: Create a template week that automatically replicates across the entire year.

**When to use**: Perfect for providers with consistent weekly schedules. If your provider works the same hours and sees similar patient volumes each week, this is the fastest way to build your forecast.

**How to use**:
• Enter patients and hours for one representative week
• Set non-clinical time (vacation weeks, CME days, statutory holidays)
• Use **Quick Fill** templates (32h, 36h, 40h) to quickly set common work week patterns
• Toggle between **Patients Per Hour** and **Patients Per Day** to calculate patient volumes
• Click **Apply This Week to Entire Year** to replicate your pattern across all matching days

**Key Features**:
• **Quick Fill**: Pre-configured templates for 32, 36, or 40-hour work weeks. For 32+ hours, you can choose which day to reduce hours.
• **Patients Per Hour**: Enter your average patients per hour, then click "Calculate from Hours" to auto-fill patient counts based on hours entered.
• **Patients Per Day**: Set a fixed patient count that applies to all working days.
• **Apply to Year**: Replicates your week pattern to all matching days (e.g., all Mondays, all Tuesdays) while automatically excluding vacation, CME, and holiday dates.

## Week Mode

**Purpose**: Manually enter data one week at a time with full control over each week.

**When to use**: Best for providers with varying weekly schedules, seasonal variations, or when you need to model specific weeks differently.

**How to use**:
• Use the navigation arrows or "Today" button to move between weeks
• Click any day to enter patient counts and hours
• Right-click (or long-press on mobile) to mark dates as vacation, CME, or holidays
• Use **Patients Per Hour** calculator to quickly fill a week based on hours entered
• Select multiple dates to bulk-mark them as vacation, CME, or holidays

**Key Features**:
• Week-by-week navigation for precise control
• Patients Per Hour calculator for quick data entry
• Visual indicators show total hours per week
• Bulk date selection for marking multiple days at once

## Month Mode

**Purpose**: View and edit the full month at once for comprehensive planning.

**When to use**: Ideal when you need to see the big picture, plan month-by-month variations, or make bulk edits across multiple weeks.

**How to use**:
• Navigate between months using the arrow buttons
• Click any day to enter patient counts and hours
• Right-click (or long-press) to mark dates as vacation, CME, or holidays
• Select multiple dates across the month for bulk operations
• View monthly summaries when wRVU per encounter values are set

**Key Features**:
• Full month visibility for comprehensive planning
• Monthly navigation for easy month-by-month modeling
• Bulk date selection across the entire month
• Monthly summary statistics when wRVU data is available

## Tips for All Modes

• **Click a day** to enter or edit patient counts and hours
• **Right-click a day** (or long-press on mobile) to mark it as vacation, CME, or holiday
• **Select multiple dates** by clicking them, then use the date type selector to mark them all at once
• **wRVU calculations** use the Average wRVU Per Encounter value you set
• **Adjusted wRVU** allows you to model billing improvements or coding education scenarios
• Data automatically saves as you work`;

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
  patientsPerDay = 0,
  onPatientsPerDayChange,
  isPerHour = true,
  onIsPerHourChange,
  onCalculatePatientsFromHours,
  onCalculatePatientsFromDay,
  onApplyWorkWeekTemplate,
  onAvgWRVUChange,
  onAdjustedWRVUChange,
  className,
}: PatientCalendarViewProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>('template');
  const [currentDate, setCurrentDate] = React.useState(startOfToday());
  const [selectedDates, setSelectedDates] = React.useState<Date[]>([]);
  const [showClearDialog, setShowClearDialog] = React.useState(false);
  const [showTemplateSuccess, setShowTemplateSuccess] = React.useState(false);
  const [selectedQuickFill, setSelectedQuickFill] = React.useState<number | null>(null);
  const [quickFillPopoverOpen, setQuickFillPopoverOpen] = React.useState<number | null>(null);


  // Close popover when clicking outside
  React.useEffect(() => {
    if (quickFillPopoverOpen === null) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.quick-fill-popover-container')) {
        setQuickFillPopoverOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [quickFillPopoverOpen]);

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

    return (
      <Tooltip content={description} side="bottom" disableOnTouch={false}>
        <Button
          type="button"
          variant={isActive ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode(mode)}
          className="min-w-[80px] sm:min-w-[100px] h-8 sm:h-9 px-2 sm:px-3 flex items-center justify-center gap-1.5 sm:gap-2"
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{label}</span>
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
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
                  Patient Calendar
                </CardTitle>
                <div className="relative">
                  <ScreenInfoModal
                    title="Patient Calendar Guide"
                    description={COMPREHENSIVE_HELP_CONTENT}
                  />
                </div>
              </div>
              
              {/* View mode toggle - Horizontal layout on all screen sizes */}
              <div className="flex flex-row items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-full sm:w-auto">
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
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Non-clinical time
                </CardTitle>
              </div>
            </CardHeader>
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

          {/* Patients Per Hour/Day Calculator */}
          <Card className="border-2">
            <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Productivity
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <Label htmlFor="toggle-productivity-mode" className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap min-w-0">
                    {isPerHour ? 'Patients Per Hour' : 'Patients Per Day'}
                  </Label>
                  <Switch
                    id="toggle-productivity-mode"
                    checked={isPerHour}
                    onCheckedChange={(checked: boolean) => onIsPerHourChange?.(checked)}
                    className="touch-target flex-shrink-0"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                <div>
                  {isPerHour ? (
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                        <div className="flex-1 w-full">
                          <NumberInputWithButtons
                            label="Patients Per Hour"
                            value={patientsPerHour}
                            onChange={(value) => onPatientsPerHourChange?.(value)}
                            icon={<Users className="w-5 h-5" />}
                            min={0}
                            step={0.1}
                            placeholder="0"
                          />
                        </div>
                        {onCalculatePatientsFromHours && (
                          <Button
                            type="button"
                            onClick={onCalculatePatientsFromHours}
                            disabled={patientsPerHour <= 0}
                            className="w-full sm:w-auto min-h-[44px] touch-target"
                            variant="outline"
                          >
                            <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                            Calculate from Hours
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">
                        Enter hours and patients will auto-calculate (when patients = 0). Use the button to recalculate all days.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                        <div className="flex-1 w-full">
                          <NumberInputWithButtons
                            label="Patients Per Day"
                            value={patientsPerDay}
                            onChange={(value) => onPatientsPerDayChange?.(value)}
                            icon={<Users className="w-5 h-5" />}
                            min={0}
                            step={1}
                            integerOnly
                            placeholder="0"
                          />
                        </div>
                        {onCalculatePatientsFromDay && (
                          <Button
                            type="button"
                            onClick={onCalculatePatientsFromDay}
                            disabled={patientsPerDay <= 0}
                            className="w-full sm:w-auto min-h-[44px] touch-target"
                            variant="outline"
                          >
                            <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                            Apply Patients Per Day
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">
                        Set this patients per day value for all working days in the calendar.
                      </p>
                    </div>
                  )}
                </div>

                {/* wRVU Per Encounter Section */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <NumberInputWithButtons
                        label="Average wRVU Per Encounter"
                        value={avgWRVUPerEncounter || 0}
                        onChange={(value) => onAvgWRVUChange?.(value)}
                        icon={<TrendingUp className="w-5 h-5" />}
                        min={0}
                        step={0.01}
                      />
                    </div>
                    <div>
                      <NumberInputWithButtons
                        label="Adjusted wRVU Per Encounter"
                        value={adjustedWRVUPerEncounter || 0}
                        onChange={(value) => onAdjustedWRVUChange?.(value)}
                        icon={<TrendingUp className="w-5 h-5" />}
                        min={0}
                        step={0.01}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1">
                    Used for billing improvements or coding education scenarios where the provider has improved billing practices.
                  </p>
                </div>

                {/* Predefined Work Week Templates */}
                {onApplyWorkWeekTemplate && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Quick Fill
                      </Label>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[32, 36, 40].map((hours) => (
                        <div key={hours} className="relative quick-fill-popover-container">
                          <Button
                            type="button"
                            onClick={() => {
                              // If totalHours >= 32, show popover to select day to reduce
                              // If totalHours < 32, apply directly (distributes evenly)
                              if (hours >= 32) {
                                setQuickFillPopoverOpen(quickFillPopoverOpen === hours ? null : hours);
                              } else {
                                onApplyWorkWeekTemplate(hours);
                                setSelectedQuickFill(hours);
                              }
                            }}
                            variant={selectedQuickFill === hours ? 'default' : 'outline'}
                            className={cn(
                              'min-h-[44px] touch-target flex flex-col items-center justify-center gap-0.5 py-2 w-full',
                              selectedQuickFill === hours && 'bg-primary text-primary-foreground'
                            )}
                          >
                            <span className="text-lg font-semibold">{hours}</span>
                            <span className="text-xs opacity-80">hours</span>
                          </Button>
                          {quickFillPopoverOpen === hours && hours >= 32 && (
                            <div className="absolute top-full left-0 mt-1 z-[100] bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[180px]">
                              <div className="p-2 space-y-1">
                                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 px-2">
                                  Reduce hours on:
                                </div>
                                {[
                                  { day: 1, name: 'Monday' },
                                  { day: 2, name: 'Tuesday' },
                                  { day: 3, name: 'Wednesday' },
                                  { day: 4, name: 'Thursday' },
                                  { day: 5, name: 'Friday' },
                                ].map(({ day, name }) => (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => {
                                      onApplyWorkWeekTemplate(hours, day);
                                      setSelectedQuickFill(hours);
                                      setQuickFillPopoverOpen(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                  >
                                    {name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        {selectedQuickFill ? (
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-400" />
                            <span className="font-medium">{selectedQuickFill}h selected</span>
                          </span>
                        ) : (
                          '8h Mon-Thu, Friday adjusts'
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Week Calendar - Same as Week mode but hide dates */}
          <Card className="border-2">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Provider Schedule
                </CardTitle>
              </div>
            </CardHeader>
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
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="flex flex-row items-center justify-between gap-3 sm:gap-6 mb-4 sm:mb-6">
                {/* Total Hours */}
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-start gap-2 sm:gap-3 mb-2">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 dark:bg-primary/20 flex-shrink-0">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                        Total Hours
                      </p>
                      <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                        {templateTotals.totalHours.toFixed(1)}
                        <span className="text-lg sm:text-xl md:text-2xl font-normal text-gray-500 dark:text-gray-400 ml-1">
                          h
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px h-12 sm:h-16 bg-gray-300 dark:bg-gray-700 flex-shrink-0" />

                {/* Total Patients */}
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-start gap-2 sm:gap-3 mb-2">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 dark:bg-primary/20 flex-shrink-0">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                        Total Patients
                      </p>
                      <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                        {templateTotals.totalPatients.toLocaleString()}
                        <span className="text-lg sm:text-xl md:text-2xl font-normal text-gray-500 dark:text-gray-400 ml-1">
                          patients
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Apply Week Pattern Button - Integrated into summary card */}
              {onApplyTemplate && (
                <div className="pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <Button
                        type="button"
                        onClick={() => {
                          onApplyTemplate();
                          setShowTemplateSuccess(true);
                          setTimeout(() => setShowTemplateSuccess(false), 3000);
                        }}
                        disabled={templateTotals.totalHours === 0 && templateTotals.totalPatients === 0}
                        variant={templateTotals.totalHours > 0 || templateTotals.totalPatients > 0 ? 'default' : 'outline'}
                        className={cn(
                          "w-full sm:w-auto min-h-[44px] touch-target",
                          templateTotals.totalHours > 0 || templateTotals.totalPatients > 0 
                            ? "shadow-lg hover:shadow-xl transition-shadow" 
                            : ""
                        )}
                        size="lg"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
                        Apply to Entire Year
                      </Button>
                    </div>
                    {showTemplateSuccess && (
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <span>Week pattern applied successfully! Your week pattern has been replicated across the year.</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      Applies this week&#39;s pattern to all matching days (e.g., all Mondays) throughout the year, excluding vacation, CME, and holidays.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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
                        <Users className="w-4 h-4 mr-2 flex-shrink-0" />
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
                <Trash2 className="w-4 h-4 mr-2 flex-shrink-0" />
                Clear
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
