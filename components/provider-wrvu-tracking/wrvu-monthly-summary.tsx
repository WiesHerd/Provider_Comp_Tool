'use client';

import * as React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Calculator, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  formatDateString,
  type DateString,
} from '@/lib/utils/calendar-helpers';
import { DailyTrackingData } from '@/types/provider-wrvu-tracking';

interface WRVUMonthlySummaryProps {
  currentDate: Date;
  dailyData?: Record<DateString, DailyTrackingData>;
  className?: string;
}

export function WRVUMonthlySummary({
  currentDate,
  dailyData = {},
  className,
}: WRVUMonthlySummaryProps) {
  // Get all days in the current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate totals for the month
  const monthStats = React.useMemo(() => {
    let totalPatients = 0;
    let totalWRVUs = 0;
    let daysWithData = 0;
    let workingDays = 0;

    monthDays.forEach((day) => {
      const dateStr = formatDateString(day);
      const isWeekendDay = isWeekend(day);
      
      // Count working days (excluding weekends)
      if (!isWeekendDay) {
        workingDays++;
      }

      // Count data
      const data = dailyData[dateStr];
      if (data) {
        if (data.patients > 0 || data.workRVUs > 0) {
          daysWithData++;
          totalPatients += data.patients || 0;
          totalWRVUs += data.workRVUs || 0;
        }
      }
    });

    const avgPatientsPerDay = daysWithData > 0 ? totalPatients / daysWithData : 0;
    const avgWRVUsPerDay = daysWithData > 0 ? totalWRVUs / daysWithData : 0;
    const avgWRVUsPerPatient = totalPatients > 0 ? totalWRVUs / totalPatients : 0;

    return {
      totalPatients,
      totalWRVUs,
      daysWithData,
      workingDays,
      avgPatientsPerDay,
      avgWRVUsPerDay,
      avgWRVUsPerPatient,
    };
  }, [dailyData, monthDays]);

  const monthName = format(currentDate, 'MMMM yyyy');

  const formatNumber = (value: number, decimals: number = 0) => {
    return new Intl.NumberFormat('en-US', { 
      maximumFractionDigits: decimals,
      minimumFractionDigits: value % 1 === 0 ? 0 : decimals,
    }).format(value);
  };

  return (
    <Card className={cn('border-2', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg font-bold text-primary">
            Monthly Summary - {monthName}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Stats - 2 columns on mobile, 4 on desktop */}
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
              <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Total wRVUs
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatNumber(monthStats.totalWRVUs, 2)}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Days w/ Data
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {monthStats.daysWithData}
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
        </div>

        {/* Averages - 2 columns on mobile, 3 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Avg Patients/Day
              </h4>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatNumber(monthStats.avgPatientsPerDay, 1)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Based on {monthStats.daysWithData} day{monthStats.daysWithData !== 1 ? 's' : ''} with data
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Avg wRVUs/Day
              </h4>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatNumber(monthStats.avgWRVUsPerDay, 2)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Based on {monthStats.daysWithData} day{monthStats.daysWithData !== 1 ? 's' : ''} with data
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Avg wRVUs/Patient
              </h4>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatNumber(monthStats.avgWRVUsPerPatient, 2)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {monthStats.totalPatients > 0 
                ? `Based on ${formatNumber(monthStats.totalPatients)} patients`
                : 'No patients recorded'}
            </p>
          </div>
        </div>

        {/* Quick Insight */}
        {monthStats.daysWithData > 0 && (
          <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-3 border border-primary/20">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Quick Insight:</span> You&apos;ve tracked{' '}
              <span className="font-bold text-primary">
                {formatNumber(monthStats.totalPatients)}
              </span>{' '}
              patients and{' '}
              <span className="font-bold text-primary">
                {formatNumber(monthStats.totalWRVUs, 2)}
              </span>{' '}
              work RVUs across{' '}
              <span className="font-bold text-primary">
                {monthStats.daysWithData}
              </span>{' '}
              day{monthStats.daysWithData !== 1 ? 's' : ''} this month.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

