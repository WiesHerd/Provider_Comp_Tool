'use client';

import { useState, useEffect, useRef } from 'react';
import { startOfMonth, format, endOfMonth, eachDayOfInterval } from 'date-fns';
import { WRVUCalendarView } from '@/components/provider-wrvu-tracking/wrvu-calendar-view';
import { WRVUMonthlySummary } from '@/components/provider-wrvu-tracking/wrvu-monthly-summary';
import { WRVUTrackingActions } from '@/components/provider-wrvu-tracking/wrvu-tracking-actions';
import { WRVUGoalTracking } from '@/components/provider-wrvu-tracking/wrvu-goal-tracking';
import { WRVUCharts } from '@/components/provider-wrvu-tracking/wrvu-charts';
import { MonthlyGoals } from '@/types/provider-wrvu-tracking';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Stethoscope, Check } from 'lucide-react';
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
  type DateString,
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
  const [mounted, setMounted] = useState(false);
  // Always start with default state to avoid hydration mismatch
  const [state, setState] = useState<ProviderWRVUTrackingState>(getDefaultState());
  const [currentDate, setCurrentDate] = useState<Date>(startOfMonth(new Date()));
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const isInitialMountRef = useRef(true);

  // Load from localStorage only after mount
  useEffect(() => {
    setMounted(true);
    const savedState = getInitialState();
    setState(savedState);
    
    if (savedState.currentMonth) {
      const date = new Date(savedState.currentMonth + 'T00:00:00');
      if (!isNaN(date.getTime())) {
        setCurrentDate(date);
      }
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialMountRef.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      // Show save notification
      setShowSaveNotification(true);
      // Clear any existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Hide notification after 2 seconds
      saveTimeoutRef.current = setTimeout(() => {
        setShowSaveNotification(false);
      }, 2000);
    } else {
      isInitialMountRef.current = false;
    }
  }, [state]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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

  return (
    <div className="w-full px-3 sm:px-6 lg:max-w-6xl lg:mx-auto py-4 sm:py-6 md:py-8">
      {/* Save Notification */}
      {showSaveNotification && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-in slide-in-from-right fade-in duration-300">
          <div className="bg-primary text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span className="text-sm font-medium">Saved automatically</span>
          </div>
        </div>
      )}

      {/* Provider Name Input */}
      <Card className="mb-6 border-2">
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

      {/* Goal Tracking */}
      <div className="mt-6">
        <WRVUGoalTracking
          currentDate={currentDate}
          goals={currentGoals}
          actualPatients={monthStats.totalPatients}
          actualWRVUs={monthStats.totalWRVUs}
          onGoalsChange={handleGoalsChange}
        />
      </div>

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
        />
      </div>
    </div>
  );
}

