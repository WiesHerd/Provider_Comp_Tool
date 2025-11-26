'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { User, Check, X } from 'lucide-react';
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

  return (
    <div className="w-full px-3 sm:px-6 lg:max-w-6xl lg:mx-auto py-4 sm:py-6 md:py-8">

      {/* Provider Name Input - At the very top */}
      <Card className="mb-6 border-2 !pt-2 md:!pt-3">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
            Provider Work RVU Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider-name" className="text-sm font-semibold">
                Provider Name (Optional)
              </Label>
              <Input
                id="provider-name"
                value={state.providerName || ''}
                onChange={(e) => handleProviderNameChange(e.target.value)}
                placeholder="Enter provider name"
                className="w-full text-sm sm:text-base"
                icon={<User className="w-5 h-5" />}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="specialty" className="text-sm font-semibold">
                Specialty (Optional)
              </Label>
              <Select
                value={state.specialty || ''}
                onValueChange={handleSpecialtyChange}
              >
                <SelectTrigger id="specialty" className="w-full">
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

            <div className="flex items-start gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex-shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium">Auto-save enabled:</span> Your data is automatically saved to your browser. No save button needed!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Year Navigation - Quick access to different years */}
      {availableYears.length > 1 && (
        <Card className="mb-6 border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              Navigate by Year
            </CardTitle>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Jump to entries from a specific year
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Label htmlFor="year-navigator" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                Select Year:
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
              <div className="flex-1 text-xs text-gray-600 dark:text-gray-400">
                {monthsWithData.length > 0 && (
                  <span>
                    Showing {monthsWithData.length} saved {monthsWithData.length === 1 ? 'month' : 'months'} for {selectedYear}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Month Navigation Buttons - Show saved months */}
      {allMonthsWithData.length > 0 && (
        <Card className="mb-6 border-2">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  Saved Months{availableYears.length > 0 ? ` - ${selectedYear}` : ''}
                </CardTitle>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Quick navigation to months with saved data
                </p>
              </div>
              {availableYears.length > 0 && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="year-selector" className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    Year:
                  </Label>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => handleYearChange(parseInt(value, 10))}
                  >
                    <SelectTrigger id="year-selector" className="w-[120px] h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {monthsWithData.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {monthsWithData.map((monthDate) => {
                const monthKey = format(monthDate, 'yyyy-MM');
                const isActive = monthKey === format(currentDate, 'yyyy-MM');
                const monthLabel = format(monthDate, 'MMM yyyy');
                
                return (
                  <div
                    key={monthKey}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-sm whitespace-nowrap',
                      'transition-all duration-150',
                      'min-h-[44px] touch-manipulation',
                      isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    <button
                      onClick={() => handleMonthButtonClick(monthDate)}
                      className="flex-1 text-left"
                      aria-label={`Navigate to ${monthLabel}`}
                    >
                      {monthLabel}
                    </button>
                    <button
                      onClick={(e) => handleDeleteMonth(monthDate, e)}
                      className={cn(
                        'p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors',
                        'min-w-[24px] min-h-[24px] flex items-center justify-center',
                        isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                      )}
                      aria-label={`Delete ${monthLabel}`}
                      title={`Delete ${monthLabel}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No saved months for {selectedYear}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Goal Tracking */}
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

      {/* Calendar View */}
      <div className="mb-6">
        <WRVUCalendarView
          dailyData={state.dailyData}
          onDataChange={handleDataChange}
          onMonthChange={handleMonthChange}
          initialDate={currentDate}
        />
      </div>

      {/* Monthly Summary */}
      <WRVUMonthlySummary
        currentDate={currentDate}
        dailyData={state.dailyData}
      />

      {/* Visual Charts */}
      <div className="mt-6">
        <WRVUCharts
          currentDate={currentDate}
          dailyData={state.dailyData}
        />
      </div>

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

