'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useDebouncedLocalStorage } from '@/hooks/use-debounced-local-storage';
import { startOfMonth, format, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { cn } from '@/lib/utils/cn';
import { WRVUCalendarView } from '@/components/provider-wrvu-tracking/wrvu-calendar-view';
import { WRVUMonthlySummary } from '@/components/provider-wrvu-tracking/wrvu-monthly-summary';
import { WRVUTrackingActions } from '@/components/provider-wrvu-tracking/wrvu-tracking-actions';
import { WRVUGoalTracking } from '@/components/provider-wrvu-tracking/wrvu-goal-tracking';
import { WRVUCharts } from '@/components/provider-wrvu-tracking/wrvu-charts';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Check, X, Info, ChevronRight } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  formatDateString,
} from '@/lib/utils/calendar-helpers';
import {
  ProviderWRVUTrackingState,
  DailyTrackingData,
  MonthlyGoals,
} from '@/types/provider-wrvu-tracking';

const STORAGE_KEY = 'providerWRVUTrackingState';

const getInitialState = (): ProviderWRVUTrackingState => {
  if (typeof window === 'undefined') {
    return getDefaultState();
  }

  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      const parsed = JSON.parse(savedState);
      // Ensure dailyData exists
      if (!parsed.dailyData) parsed.dailyData = {};
      // Ensure currentMonth exists
      if (!parsed.currentMonth) {
        parsed.currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      }
      return parsed;
    }
  } catch (error) {
    console.error('Error loading saved state:', error);
  }

  return getDefaultState();
};

const getDefaultState = (): ProviderWRVUTrackingState => ({
  dailyData: {},
  currentMonth: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
  providerName: '',
  specialty: '',
  goals: {},
});

// Common medical specialties
const COMMON_SPECIALTIES = [
  // Primary Care / Hospital Medicine
  'Family Medicine',
  'Internal Medicine',
  'Hospitalist',
  'Pediatrics',
  // Procedural / Surgical
  'Anesthesiology',
  'General Surgery',
  'Orthopedic Surgery',
  'Neurosurgery',
  'Trauma Surgery',
  'Cardiothoracic Surgery',
  'Vascular Surgery',
  'Urology',
  'OB/GYN',
  'ENT (Otolaryngology)',
  'Ophthalmology',
  // Medical Subspecialties
  'Cardiology',
  'Critical Care',
  'Emergency Medicine',
  'Gastroenterology',
  'Nephrology',
  'Neurology',
  'Pulmonology',
  'Radiology',
  // Other
  'Psychiatry',
  'Pathology',
  'Other',
];

export default function ProviderWRVUTrackingPage() {
  // Always start with default state to avoid hydration mismatch
  const [state, setState] = useState<ProviderWRVUTrackingState>(getDefaultState());
  const [currentDate, setCurrentDate] = useState<Date>(startOfMonth(new Date()));
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load from localStorage only after mount
  useEffect(() => {
    const savedState = getInitialState();
    setState(savedState);
    
    if (savedState.currentMonth) {
      const date = new Date(savedState.currentMonth + 'T00:00:00');
      if (!isNaN(date.getTime())) {
        setCurrentDate(date);
      }
    }
  }, []);

  // Track state changes for auto-save indicator
  const prevStateRef = React.useRef(state);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Skip on initial mount
    if (prevStateRef.current === state) return;
    
    // Mark as saving
    setIsAutoSaving(true);
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set timeout to mark as saved
    saveTimeoutRef.current = setTimeout(() => {
      setIsAutoSaving(false);
      setLastSaved(new Date());
      prevStateRef.current = state;
    }, 600); // Slightly longer than debounce to show feedback
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state]);

  // Save to localStorage whenever state changes (silent auto-save, debounced)
  useDebouncedLocalStorage(STORAGE_KEY, state);

  // Manual save handler with feedback
  const handleManualSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setSaveFeedback(true);
      setTimeout(() => {
        setSaveFeedback(false);
      }, 2000);
    }
  };

  // Update currentDate when state.currentMonth changes
  useEffect(() => {
    if (state.currentMonth) {
      const date = new Date(state.currentMonth + 'T00:00:00');
      if (!isNaN(date.getTime())) {
        setCurrentDate(date);
      }
    }
  }, [state.currentMonth]);

  const handleDataChange = (date: Date, data: DailyTrackingData) => {
    const dateStr = formatDateString(date);
    setState((prev) => ({
      ...prev,
      dailyData: {
        ...prev.dailyData,
        [dateStr]: data,
      },
    }));
  };

  const handleMonthChange = (newDate: Date) => {
    const monthStr = format(startOfMonth(newDate), 'yyyy-MM-dd');
    setState((prev) => ({
      ...prev,
      currentMonth: monthStr,
    }));
    setCurrentDate(newDate);
  };

  const handleProviderNameChange = (name: string) => {
    setState((prev) => ({
      ...prev,
      providerName: name,
    }));
  };

  const handleSpecialtyChange = (specialty: string) => {
    setState((prev) => ({
      ...prev,
      specialty: specialty,
    }));
  };

  const handleGoalsChange = (goals: MonthlyGoals) => {
    const monthKey = format(currentDate, 'yyyy-MM');
    setState((prev) => ({
      ...prev,
      goals: {
        ...prev.goals,
        [monthKey]: goals,
      },
    }));
  };

  // Calculate current month stats for goals
  const getCurrentMonthStats = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    let totalPatients = 0;
    let totalWRVUs = 0;
    
    monthDays.forEach((day) => {
      const dateStr = formatDateString(day);
      const data = state.dailyData[dateStr];
      if (data) {
        totalPatients += data.patients || 0;
        totalWRVUs += data.workRVUs || 0;
      }
    });
    
    return { totalPatients, totalWRVUs };
  };

  const monthStats = getCurrentMonthStats();
  const monthKey = format(currentDate, 'yyyy-MM');
  const currentGoals = state.goals?.[monthKey];

  // Get all months that have data (patients or wRVUs) - no year limit
  const allMonthsWithData = useMemo(() => {
    const monthSet = new Set<string>();
    
    Object.keys(state.dailyData).forEach((dateStr) => {
      const data = state.dailyData[dateStr];
      if (data && (data.patients > 0 || data.workRVUs > 0)) {
        try {
          const date = parseISO(dateStr);
          const monthKey = format(startOfMonth(date), 'yyyy-MM');
          monthSet.add(monthKey);
        } catch (e) {
          // Skip invalid dates
        }
      }
    });

    // Also include months with goals
    Object.keys(state.goals || {}).forEach((monthKey) => {
      monthSet.add(monthKey);
    });

    // Sort months (newest first)
    return Array.from(monthSet)
      .map((monthKey) => {
        const [year, month] = monthKey.split('-').map(Number);
        return new Date(year, month - 1, 1);
      })
      .sort((a, b) => b.getTime() - a.getTime());
  }, [state.dailyData, state.goals]);

  // Get available years from data
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>();
    allMonthsWithData.forEach((monthDate) => {
      yearSet.add(monthDate.getFullYear());
    });
    return Array.from(yearSet).sort((a, b) => b - a); // Newest first
  }, [allMonthsWithData]);

  // Filter months by selected year (max 12 months per year)
  const monthsWithData = useMemo(() => {
    return allMonthsWithData
      .filter((monthDate) => monthDate.getFullYear() === selectedYear)
      .slice(0, 12); // Max 12 months per year
  }, [allMonthsWithData, selectedYear]);

  // Update selectedYear when currentDate changes to match the year being viewed
  useEffect(() => {
    const currentYear = currentDate.getFullYear();
    if (availableYears.includes(currentYear) && selectedYear !== currentYear) {
      setSelectedYear(currentYear);
    }
  }, [currentDate, availableYears, selectedYear]);

  // Handle year selection - navigate to most recent month of that year with data, or January
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    
    // Find months of that year with data
    const yearMonths = allMonthsWithData.filter(
      (monthDate) => monthDate.getFullYear() === year
    );
    
    // Navigate to most recent month of that year (first in sorted array since newest first)
    // or default to January if no data exists
    const targetMonth = yearMonths.length > 0 
      ? yearMonths[0] // Get most recent month (first in array since sorted newest first)
      : new Date(year, 0, 1); // January of that year
    
    handleMonthChange(targetMonth);
  };

  const handleMonthButtonClick = (monthDate: Date) => {
    handleMonthChange(monthDate);
  };

  const handleDeleteMonth = (monthDate: Date, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    
    const monthKey = format(monthDate, 'yyyy-MM');
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Confirm deletion
    if (window.confirm(`Delete all data for ${format(monthDate, 'MMM yyyy')}? This cannot be undone.`)) {
      setState((prev) => {
        const newDailyData = { ...prev.dailyData };
        const newGoals = { ...prev.goals };
        
        // Remove all days in this month from dailyData
        monthDays.forEach((day) => {
          const dateStr = formatDateString(day);
          delete newDailyData[dateStr];
        });
        
        // Remove goals for this month
        delete newGoals[monthKey];
        
        return {
          ...prev,
          dailyData: newDailyData,
          goals: newGoals,
        };
      });
    }
  };

  // State for collapsible navigation
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  
  // Check if there's any data to show empty state
  const hasAnyData = Object.keys(state.dailyData).some(
    (dateStr) => {
      const data = state.dailyData[dateStr];
      return data && (data.patients > 0 || data.workRVUs > 0);
    }
  );

  return (
    <div className="w-full px-4 sm:px-6 lg:max-w-6xl lg:mx-auto py-4 sm:py-6 md:py-8">
      {/* Page Title */}
      <div className="mb-6 flex items-center justify-between pt-6 sm:pt-8 md:pt-10">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Provider Work RVU Tracking
          </h1>
          <Tooltip 
            content="Track your daily patients and work RVUs by month. Perfect for reconciling with compensation reports."
            side="right"
          >
            <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
          </Tooltip>
        </div>
        
        {/* Auto-save indicator */}
        {(isAutoSaving || lastSaved) && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            {isAutoSaving ? (
              <>
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="hidden sm:inline">Saving...</span>
              </>
            ) : lastSaved && (
              <>
                <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                <span className="hidden sm:inline">
                  Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Provider Name Input - Compact at top */}
      <Card className="mb-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="provider-name" className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  Provider Name (Optional)
                </Label>
                <Input
                  id="provider-name"
                  value={state.providerName || ''}
                  onChange={(e) => handleProviderNameChange(e.target.value)}
                  placeholder="Enter provider name"
                  className="w-full text-sm sm:text-base h-10"
                  icon={<User className="w-4 h-4" />}
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="specialty" className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  Specialty (Optional)
                </Label>
                <Select
                  value={state.specialty || ''}
                  onValueChange={handleSpecialtyChange}
                >
                  <SelectTrigger id="specialty" className="w-full h-10 text-sm">
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Primary Care / Hospital Medicine</SelectLabel>
                      {COMMON_SPECIALTIES.slice(0, 4).map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>Procedural / Surgical</SelectLabel>
                      {COMMON_SPECIALTIES.slice(4, 15).map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>Medical Subspecialties</SelectLabel>
                      {COMMON_SPECIALTIES.slice(15, 23).map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>Other</SelectLabel>
                      {COMMON_SPECIALTIES.slice(23).map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex-shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium">Auto-save enabled:</span> Your data is automatically saved to your browser.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View - PRIMARY ACTION - moved to top */}
      <div className="mb-6">
        <WRVUCalendarView
          dailyData={state.dailyData}
          onDataChange={handleDataChange}
          onMonthChange={handleMonthChange}
          initialDate={currentDate}
          hasAnyData={hasAnyData}
        />
      </div>

      {/* Monthly Summary - Context after data entry */}
      <div className="mb-6">
        <WRVUMonthlySummary
          currentDate={currentDate}
          dailyData={state.dailyData}
        />
      </div>

      {/* Goal Tracking - Set goals after seeing data */}
      <div className="mb-6">
        <WRVUGoalTracking
          currentDate={currentDate}
          goals={currentGoals}
          actualPatients={monthStats.totalPatients}
          actualWRVUs={monthStats.totalWRVUs}
          dailyData={state.dailyData}
          onGoalsChange={handleGoalsChange}
        />
      </div>

      {/* Visual Charts - Visualization after data */}
      <div className="mb-6">
        <WRVUCharts
          currentDate={currentDate}
          dailyData={state.dailyData}
        />
      </div>

      {/* Month/Year Navigation - Collapsible, secondary */}
      {(allMonthsWithData.length > 0 || availableYears.length > 1) && (
        <Card className="mb-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader 
            className="pb-3 cursor-pointer"
            onClick={() => setIsNavigationOpen(!isNavigationOpen)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  Navigate to Other Months
                </CardTitle>
                {allMonthsWithData.length > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({allMonthsWithData.length} {allMonthsWithData.length === 1 ? 'month' : 'months'})
                  </span>
                )}
              </div>
              <button
                type="button"
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={isNavigationOpen ? 'Collapse navigation' : 'Expand navigation'}
                aria-expanded={isNavigationOpen}
              >
                <ChevronRight 
                  className={cn(
                    "w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-200",
                    isNavigationOpen && "rotate-90"
                  )} 
                />
              </button>
            </div>
          </CardHeader>
          {isNavigationOpen && (
            <CardContent className="space-y-4">
              {/* Consolidated Year Navigation */}
              {availableYears.length > 1 && (
                <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <Label htmlFor="year-navigator" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    Filter by Year:
                  </Label>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => handleYearChange(parseInt(value, 10))}
                  >
                    <SelectTrigger id="year-navigator" className="w-[140px] h-10 text-base font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((year) => {
                        const yearMonthCount = allMonthsWithData.filter(
                          (monthDate) => monthDate.getFullYear() === year
                        ).length;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <span className="font-semibold">{year}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-3">
                                ({yearMonthCount} {yearMonthCount === 1 ? 'month' : 'months'})
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Month Navigation - Horizontal scroll on mobile */}
              {allMonthsWithData.length > 0 ? (
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-2 min-w-max sm:min-w-0">
                    {monthsWithData.map((monthDate) => {
                      const monthKey = format(monthDate, 'yyyy-MM');
                      const isActive = monthKey === format(currentDate, 'yyyy-MM');
                      const monthLabel = format(monthDate, 'MMM yyyy');
                      
                      return (
                        <div
                          key={monthKey}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-sm whitespace-nowrap',
                            'transition-all duration-150 flex-shrink-0',
                            'min-h-[44px] touch-manipulation',
                            isActive
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                          )}
                        >
                          <button
                            onClick={() => {
                              handleMonthButtonClick(monthDate);
                              setIsNavigationOpen(false);
                            }}
                            className="flex-1 text-left min-w-0"
                            aria-label={`Navigate to ${monthLabel}`}
                          >
                            {monthLabel}
                          </button>
                          <button
                            onClick={(e) => handleDeleteMonth(monthDate, e)}
                            className={cn(
                              'p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex-shrink-0',
                              'min-w-[32px] min-h-[32px] flex items-center justify-center',
                              isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                            )}
                            aria-label={`Delete ${monthLabel}`}
                            title={`Delete ${monthLabel}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  {availableYears.length > 1 
                    ? `No saved months for ${selectedYear}`
                    : 'No saved months yet. Start tracking by adding data to the calendar above.'}
                </p>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex justify-center">
        <WRVUTrackingActions
          currentDate={currentDate}
          dailyData={state.dailyData}
          providerName={state.providerName}
          specialty={state.specialty}
          onSave={handleManualSave}
          saveFeedback={saveFeedback}
        />
      </div>
    </div>
  );
}

