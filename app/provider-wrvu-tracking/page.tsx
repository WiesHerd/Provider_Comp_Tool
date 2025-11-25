'use client';

import { useState, useEffect } from 'react';
import { startOfMonth, format } from 'date-fns';
import { WRVUCalendarView } from '@/components/provider-wrvu-tracking/wrvu-calendar-view';
import { WRVUMonthlySummary } from '@/components/provider-wrvu-tracking/wrvu-monthly-summary';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';
import {
  formatDateString,
  type DateString,
} from '@/lib/utils/calendar-helpers';
import {
  ProviderWRVUTrackingState,
  DailyTrackingData,
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
});

export default function ProviderWRVUTrackingPage() {
  const [mounted, setMounted] = useState(false);
  // Always start with default state to avoid hydration mismatch
  const [state, setState] = useState<ProviderWRVUTrackingState>(getDefaultState());
  const [currentDate, setCurrentDate] = useState<Date>(startOfMonth(new Date()));

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
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

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

  return (
    <div className="w-full px-3 sm:px-6 lg:max-w-6xl lg:mx-auto py-4 sm:py-6 md:py-8">
      {/* Provider Name Input */}
      <Card className="mb-6 border-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
            Provider Work RVU Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
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
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Track your daily patients and work RVUs to reconcile with compensation reports
            </p>
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
    </div>
  );
}

