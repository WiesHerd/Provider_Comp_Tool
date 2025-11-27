'use client';

import * as React from 'react';
import { format, addMonths, subMonths, addWeeks, subWeeks, startOfToday, isWeekend } from 'date-fns';
import { CallScheduleDayCell } from './call-schedule-day-cell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar, Grid } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils/cn';
import { ScreenInfoModal } from '@/components/ui/screen-info-modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  getWeekDays,
  getWeeksInMonth,
  formatDateString,
} from '@/lib/utils/calendar-helpers';
import { CallSchedule, CallDayAssignment, TierAssignment, CallDayType } from '@/types/call-schedule';
import { CallProvider } from '@/types/call-pay-engine';

interface CallScheduleCalendarViewProps {
  schedule: CallSchedule | null;
  providers: CallProvider[];
  tiers?: Array<{ id: string; name: string; enabled?: boolean }>; // Available tiers for selection
  onScheduleChange: (schedule: CallSchedule) => void;
  className?: string;
}

type ViewMode = 'week' | 'month';

const COMPREHENSIVE_HELP_CONTENT = `## Call Schedule Calendar Guide

The Call Schedule Calendar displays provider call assignments for the entire year. Navigate between weeks and months to view and edit assignments.

## Month View

**Purpose**: View and edit call assignments for an entire month at once.

**When to use**: Best for seeing the big picture, planning month-by-month, or making bulk edits.

**How to use**:
• Navigate between months using the arrow buttons or "Today" button
• Click any day to assign or change the provider
• View color-coded assignments (blue=weekday, purple=weekend, red=holiday)
• See provider initials and tier information for each assignment

## Week View

**Purpose**: Focus on a single week at a time for detailed planning.

**When to use**: Best for week-by-week scheduling or when you need to see more detail per day.

**How to use**:
• Navigate between weeks using the arrow buttons
• Click any day to assign or change the provider
• See the full week's assignments at a glance

## Tips

• **Click a day** to open the provider assignment dialog
• **Hover over a day** and click the X button to clear an assignment
• **Color coding**: Blue = Weekday, Purple = Weekend, Red = Holiday
• **Provider initials** are shown in each assigned day
• **Tier information** (C1, C2, etc.) appears below provider initials when assigned`;

export function CallScheduleCalendarView({
  schedule,
  providers,
  tiers = [],
  onScheduleChange,
  className,
}: CallScheduleCalendarViewProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = React.useState(startOfToday());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedAssignment, setSelectedAssignment] = React.useState<CallDayAssignment | null>(null);
  const [tierProviderMap, setTierProviderMap] = React.useState<Record<string, string | null>>({});

  const today = startOfToday();

  // Navigation handlers
  const handlePrevious = () => {
    if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(startOfToday());
  };

  // Get assignment for a date
  const getAssignmentForDate = (date: Date): CallDayAssignment | null => {
    if (!schedule) return null;
    const dateStr = formatDateString(date);
    return schedule.assignments.find(a => formatDateString(a.date) === dateStr) || null;
  };

  // Handle date click - open provider assignment dialog
  const handleDateClick = (date: Date) => {
    const assignment = getAssignmentForDate(date);
    setSelectedDate(date);
    setSelectedAssignment(assignment);
    
    // Initialize tier-provider map from existing assignments
    const map: Record<string, string | null> = {};
    if (assignment?.tierAssignments) {
      assignment.tierAssignments.forEach(ta => {
        map[ta.tierId] = ta.providerId;
      });
    }
    // Also initialize for all available tiers
    tiers.forEach(tier => {
      if (!(tier.id in map)) {
        map[tier.id] = null;
      }
    });
    setTierProviderMap(map);
  };

  // Handle tier provider change
  const handleTierProviderChange = (tierId: string, providerId: string | null) => {
    setTierProviderMap(prev => ({
      ...prev,
      [tierId]: providerId,
    }));
  };

  // Save all tier assignments for the selected date
  const handleSaveAssignments = () => {
    if (!schedule || !selectedDate) return;

    const dateStr = formatDateString(selectedDate);
    const existingAssignment = schedule.assignments.find(a => formatDateString(a.date) === dateStr);
    
    // Build tier assignments array from the map
    const tierAssignments: TierAssignment[] = Object.entries(tierProviderMap)
      .filter(([_tierId, providerId]) => providerId !== null) // Only include assigned tiers
      .map(([tierId, providerId]) => ({
        tierId,
        providerId,
      }));

    let updatedAssignments: CallDayAssignment[];
    
    if (existingAssignment) {
      // Update existing assignment
      updatedAssignments = schedule.assignments.map(assignment => {
        if (formatDateString(assignment.date) === dateStr) {
          return {
            ...assignment,
            tierAssignments,
          };
        }
        return assignment;
      });
    } else {
      // Create new assignment - infer day type from date
      const dayType: CallDayType = isWeekend(selectedDate) ? 'weekend' : 'weekday';
      
      // Check if there's a holiday assignment for this date in the schedule
      const holidayAssignment = schedule.assignments.find(a => 
        formatDateString(a.date) === dateStr && a.type === 'holiday'
      );
      const finalDayType = holidayAssignment?.type || dayType;
      
      const newAssignment: CallDayAssignment = {
        date: new Date(selectedDate),
        type: finalDayType,
        tierAssignments,
      };
      
      updatedAssignments = [...schedule.assignments, newAssignment];
    }

    onScheduleChange({
      ...schedule,
      assignments: updatedAssignments,
    });

    setSelectedDate(null);
    setSelectedAssignment(null);
    setTierProviderMap({});
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

  // Get eligible providers
  const eligibleProviders = providers.filter(p => p.eligibleForCall);

  // Mode button component
  const ModeButton = ({ mode, icon: Icon, label }: { mode: ViewMode; icon: React.ElementType; label: string }) => {
    const isActive = viewMode === mode;

    return (
      <Button
        type="button"
        variant={isActive ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode(mode)}
        className="min-w-[80px] sm:min-w-[100px] h-8 sm:h-9 px-2 sm:px-3 flex items-center justify-center gap-1.5 sm:gap-2 touch-target"
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{label}</span>
      </Button>
    );
  };

  if (!schedule) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400">
            No schedule available. Generate a schedule to view assignments.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
                  Call Schedule - {schedule.year}
                </CardTitle>
                <div className="relative">
                  <ScreenInfoModal
                    title="Call Schedule Calendar Guide"
                    description={COMPREHENSIVE_HELP_CONTENT}
                  />
                </div>
              </div>
              
              {/* View mode toggle */}
              <div className="flex flex-row items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-full sm:w-auto">
                <ModeButton mode="month" icon={Grid} label="Month" />
                <ModeButton mode="week" icon={Calendar} label="Week" />
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 lg:px-2 lg:py-3">
          {/* Legend */}
          <div className="mb-4">
            <div className={cn(
              "flex flex-wrap items-center gap-3 sm:gap-4 text-sm",
              "justify-center sm:justify-start"
            )}>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500 flex-shrink-0"></div>
                <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">Weekday</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-purple-500 flex-shrink-0"></div>
                <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">Weekend</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500 flex-shrink-0"></div>
                <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">Holiday</span>
              </div>
            </div>
          </div>

          {/* Current period label */}
          <div className="mb-4 text-center sm:text-left">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {weekRange}
            </h3>
          </div>

          {/* Calendar grid */}
          <div className="w-full overflow-x-auto -mx-4 sm:mx-0 lg:-mx-2 px-4 sm:px-0 lg:px-2">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 sm:gap-3 lg:gap-2 mb-2 min-w-[700px] pl-1 pr-1 lg:pl-0 lg:pr-0">
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
            <div className="space-y-2 sm:space-y-3 lg:space-y-2 min-w-[700px] pb-1 pl-1 pr-1 lg:pl-0 lg:pr-0">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-2 sm:gap-3 lg:gap-2">
                  {week.map((date) => {
                    const dateStr = formatDateString(date);
                    const isCurrentMonth = format(date, 'M') === format(currentDate, 'M');
                    const isToday = formatDateString(date) === formatDateString(today);
                    const assignment = getAssignmentForDate(date);

                    return (
                      <div
                        key={dateStr}
                        onClick={() => handleDateClick(date)}
                        className={cn(
                          'transition-all duration-200',
                          selectedDate && formatDateString(selectedDate) === dateStr && 'ring-2 ring-primary ring-offset-2 rounded-xl'
                        )}
                      >
                        <CallScheduleDayCell
                          date={date}
                          assignment={assignment}
                          providers={providers}
                          isToday={isToday}
                          isCurrentMonth={isCurrentMonth}
                          onClick={handleDateClick}
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

      {/* Provider Assignment Dialog */}
      <Dialog.Root open={!!selectedDate} onOpenChange={(open) => {
        if (!open) {
          setSelectedDate(null);
          setSelectedAssignment(null);
          setTierProviderMap({});
        }
      }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
            "bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 z-50",
            "border border-gray-200 dark:border-gray-700",
            "w-[calc(100vw-2rem)] sm:w-96 max-w-md",
            "max-h-[90vh] overflow-y-auto"
          )}>
            <Dialog.Title className="text-lg font-semibold mb-4">Assign Providers by Tier</Dialog.Title>
            {selectedDate && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                  {selectedAssignment && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Type: {selectedAssignment.type}
                    </p>
                  )}
                </div>
                
                {/* Provider Selection per Tier */}
                {tiers.length > 0 ? (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold block">Assign Provider for Each Tier</Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Each tier (C1, C2, C3, etc.) requires its own provider assignment.
                    </p>
                    {tiers.map(tier => (
                      <div key={tier.id} className="space-y-1">
                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {tier.name} {tier.name === 'C1' ? '(Primary)' : tier.name === 'C2' ? '(Backup)' : tier.name === 'C3' ? '(Tertiary)' : ''}
                        </Label>
                        <Select
                          value={tierProviderMap[tier.id] || ''}
                          onValueChange={(value) => handleTierProviderChange(tier.id, value === 'none' ? null : value)}
                        >
                          <SelectTrigger className="touch-target min-h-[44px] text-sm">
                            <SelectValue placeholder={`Select provider for ${tier.name}`} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            {eligibleProviders.map(provider => (
                              <SelectItem key={provider.id} value={provider.id}>
                                {provider.name || `Provider ${provider.id}`} ({provider.fte} FTE)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    No tiers available. Configure tiers in Step 2.
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-2 justify-end mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedDate(null);
                      setSelectedAssignment(null);
                      setTierProviderMap({});
                    }}
                    className="w-full sm:w-auto touch-target min-h-[44px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveAssignments}
                    className="w-full sm:w-auto touch-target min-h-[44px]"
                  >
                    Save Assignments
                  </Button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

