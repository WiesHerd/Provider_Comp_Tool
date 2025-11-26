'use client';

import * as React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  formatDateString,
  isNonWorkingDay,
  type DateString,
} from '@/lib/utils/calendar-helpers';

interface CalendarSummaryProps {
  currentDate: Date;
  dailyPatientCounts?: Record<DateString, number>;
  vacationDates?: DateString[];
  cmeDates?: DateString[];
  holidayDates?: DateString[];
  avgWRVUPerEncounter: number;
  adjustedWRVUPerEncounter: number;
  className?: string;
}

export function CalendarSummary({
  currentDate,
  dailyPatientCounts = {},
  vacationDates = [],
  cmeDates = [],
  holidayDates = [],
  avgWRVUPerEncounter,
  adjustedWRVUPerEncounter,
  className,
}: CalendarSummaryProps) {
  // Get all days in the current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate totals for the month
  const monthStats = React.useMemo(() => {
    let totalPatients = 0;
    let workingDays = 0;
    let daysWithPatients = 0;

    monthDays.forEach((day) => {
      const dateStr = formatDateString(day);
      const isWeekendDay = isWeekend(day);
      const isNonWorking = isNonWorkingDay(dateStr, vacationDates, cmeDates, holidayDates);
      
      // Count working days (excluding weekends and non-working days)
      if (!isWeekendDay && !isNonWorking) {
        workingDays++;
      }

      // Count patients
      const patientCount = dailyPatientCounts[dateStr] || 0;
      if (patientCount > 0) {
        totalPatients += patientCount;
        daysWithPatients++;
      }
    });

    const avgPatientsPerDay = daysWithPatients > 0 ? totalPatients / daysWithPatients : 0;
    const avgPatientsPerWorkingDay = workingDays > 0 ? totalPatients / workingDays : 0;

    // Calculate wRVUs
    const estimatedWRVUsAvg = totalPatients * avgWRVUPerEncounter;
    const estimatedWRVUsAdjusted = totalPatients * adjustedWRVUPerEncounter;
    const potentialIncrease = estimatedWRVUsAdjusted - estimatedWRVUsAvg;

    return {
      totalPatients,
      workingDays,
      daysWithPatients,
      avgPatientsPerDay,
      avgPatientsPerWorkingDay,
      estimatedWRVUsAvg,
      estimatedWRVUsAdjusted,
      potentialIncrease,
    };
  }, [monthDays, dailyPatientCounts, vacationDates, cmeDates, holidayDates, avgWRVUPerEncounter, adjustedWRVUPerEncounter]);

  const monthName = format(currentDate, 'MMMM yyyy');

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      maximumFractionDigits: 1,
      minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    }).format(value);
  };

  return (
    <Card className={cn('border-2', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg font-bold text-primary">
            Monthly Forecast - {monthName}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Patient Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Total Patients
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatNumber(monthStats.totalPatients)}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Working Days
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {monthStats.workingDays}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Days w/ Patients
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {monthStats.daysWithPatients}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Avg/Day
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatNumber(monthStats.avgPatientsPerWorkingDay)}
            </p>
          </div>
        </div>

        {/* wRVU Calculations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
          {/* Average wRVU */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Estimated wRVUs (Average)
              </h4>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-blue-700 dark:text-blue-300">
                  {formatNumber(monthStats.totalPatients)} patients × {avgWRVUPerEncounter.toFixed(2)} wRVU
                </span>
              </div>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {formatNumber(monthStats.estimatedWRVUsAvg)}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                wRVUs for {monthName}
              </p>
            </div>
          </div>

          {/* Adjusted wRVU */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border-2 border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                Estimated wRVUs (Adjusted)
              </h4>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-purple-700 dark:text-purple-300">
                  {formatNumber(monthStats.totalPatients)} patients × {adjustedWRVUPerEncounter.toFixed(2)} wRVU
                </span>
              </div>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                {formatNumber(monthStats.estimatedWRVUsAdjusted)}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                wRVUs for {monthName}
              </p>
              {monthStats.potentialIncrease > 0 && (
                <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mt-2 pt-2 border-t border-purple-300 dark:border-purple-700">
                  +{formatNumber(monthStats.potentialIncrease)} potential increase
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Insight */}
        {monthStats.totalPatients > 0 && (
          <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-3 border border-primary/20">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Quick Insight:</span> Based on your calendar entries, 
              you&apos;re projected to generate{' '}
              <span className="font-bold text-primary">
                {formatNumber(monthStats.estimatedWRVUsAvg)}
              </span>{' '}
              wRVUs this month using average rates, or{' '}
              <span className="font-bold text-primary">
                {formatNumber(monthStats.estimatedWRVUsAdjusted)}
              </span>{' '}
              wRVUs with adjusted rates.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

