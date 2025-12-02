'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useDebouncedLocalStorage } from '@/hooks/use-debounced-local-storage';
import { startOfMonth, format, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { WRVUCalendarView } from '@/components/provider-wrvu-tracking/wrvu-calendar-view';
import { WRVUMonthlySummary } from '@/components/provider-wrvu-tracking/wrvu-monthly-summary';
import { WRVUTrackingActions } from '@/components/provider-wrvu-tracking/wrvu-tracking-actions';
import { WRVUGoalProgress } from '@/components/provider-wrvu-tracking/wrvu-goal-progress';
import { WRVUCharts } from '@/components/provider-wrvu-tracking/wrvu-charts';
import { MonthYearSelector } from '@/components/provider-wrvu-tracking/month-year-selector';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Check, Info } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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


  // State for tabs - default to 'tracking' since calendar is primary action
  const [activeTab, setActiveTab] = useState('tracking');
  
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
      <div className="mb-6 pt-6 sm:pt-8 md:pt-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white truncate">
              Provider Work RVU Tracking
            </h1>
            <Tooltip 
              content="Track your daily patients and work RVUs by month. Perfect for reconciling with compensation reports."
              side="right"
            >
              <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help flex-shrink-0" />
            </Tooltip>
          </div>
          
          {/* Month/Year Selector - Moves below title on mobile */}
          <div className="flex-shrink-0">
            <MonthYearSelector
              currentDate={currentDate}
              onDateChange={handleMonthChange}
              availableYears={availableYears}
              monthsWithData={allMonthsWithData}
            />
          </div>
        </div>
      </div>

      {/* Tabs for organizing content - Similar to CF screen structure */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-4 mb-6 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="setup" className="text-sm font-medium">
            Setup
          </TabsTrigger>
          <TabsTrigger value="tracking" className="text-sm font-medium">
            Tracking
          </TabsTrigger>
          <TabsTrigger value="summary" className="text-sm font-medium">
            Summary
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-sm font-medium">
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Setup Tab - Provider context and configuration */}
        <TabsContent value="setup" className="space-y-6 mt-0">
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider-name" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Provider Name (Optional)
                  </Label>
                  <Input
                    id="provider-name"
                    value={state.providerName || ''}
                    onChange={(e) => handleProviderNameChange(e.target.value)}
                    placeholder="Enter provider name"
                    className="w-full"
                    icon={<User className="w-4 h-4" />}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="specialty" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
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
              </div>

              <div className="flex items-start gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex-shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Auto-save enabled:</span> Your data is automatically saved to your browser.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons in Setup Tab */}
          <div className="flex justify-center">
            <WRVUTrackingActions
              currentDate={currentDate}
              dailyData={state.dailyData}
              providerName={state.providerName}
              specialty={state.specialty}
              onSave={handleManualSave}
              saveFeedback={saveFeedback}
            />
          </div>
        </TabsContent>

        {/* Tracking Tab - Primary calendar view */}
        <TabsContent value="tracking" className="space-y-6 mt-0">
          {/* Calendar View - PRIMARY ACTION */}
          <WRVUCalendarView
            dailyData={state.dailyData}
            onDataChange={handleDataChange}
            onMonthChange={handleMonthChange}
            initialDate={currentDate}
            hasAnyData={hasAnyData}
            goals={currentGoals}
            onGoalsChange={handleGoalsChange}
            saveIndicator={
              (isAutoSaving || lastSaved) ? (
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
              ) : undefined
            }
          />
        </TabsContent>

        {/* Summary Tab - Monthly summaries and progress */}
        <TabsContent value="summary" className="space-y-6 mt-0">
          {/* Monthly Summary */}
          <WRVUMonthlySummary
            currentDate={currentDate}
            dailyData={state.dailyData}
          />

          {/* Goal Progress - Detailed analysis */}
          <WRVUGoalProgress
            currentDate={currentDate}
            goals={currentGoals}
            actualPatients={monthStats.totalPatients}
            actualWRVUs={monthStats.totalWRVUs}
          />
        </TabsContent>

        {/* Analytics Tab - Charts and visualizations */}
        <TabsContent value="analytics" className="mt-0">
          <WRVUCharts
            currentDate={currentDate}
            dailyData={state.dailyData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

