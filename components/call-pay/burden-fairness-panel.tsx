'use client';

import React, { useMemo, useState } from 'react';
import { CallProvider, CallAssumptions } from '@/types/call-pay-engine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  calculateExpectedBurden, 
  calculateFairnessMetrics,
  ProviderBurdenResult,
  FairnessSummary 
} from '@/lib/utils/burden-calculations';
import { Users, TrendingUp, AlertCircle, CheckCircle2, XCircle, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CallScheduleCalendarView } from './call-schedule-calendar-view';
import { generateTestSchedule } from '@/lib/utils/generate-test-schedule';
import { cn } from '@/lib/utils/cn';

interface BurdenFairnessPanelProps {
  providers: CallProvider[];
  assumptions: CallAssumptions;
  schedule?: import('@/types/call-schedule').CallSchedule | null;
  onScheduleChange?: (schedule: import('@/types/call-schedule').CallSchedule) => void;
  onGenerateSchedule?: () => void;
  tiers?: Array<{ id: string; name: string; enabled?: boolean }>; // Available tiers for calendar
}

export function BurdenFairnessPanel({ 
  providers, 
  assumptions,
  schedule,
  onScheduleChange,
  onGenerateSchedule,
  tiers = [],
}: BurdenFairnessPanelProps) {
  const [viewMode, setViewMode] = useState<'expected' | 'schedule'>('expected');
  // Calculate burden for each provider
  const burdenResults = useMemo(() => {
    return calculateExpectedBurden(providers, assumptions);
  }, [providers, assumptions]);

  // Calculate fairness metrics
  const fairnessMetrics = useMemo(() => {
    return calculateFairnessMetrics(burdenResults);
  }, [burdenResults]);

  // Format numbers for display
  const formatNumber = (num: number, decimals: number = 1): string => {
    return num.toFixed(decimals);
  };

  // Get burden index color
  const getBurdenIndexColor = (index: number): string => {
    if (index > 10) return 'text-red-600 dark:text-red-400';
    if (index < -10) return 'text-blue-600 dark:text-blue-400';
    if (Math.abs(index) <= 5) return 'text-green-600 dark:text-green-400';
    return 'text-yellow-600 dark:text-yellow-400';
  };

  // Get fairness score color
  const getFairnessScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Get fairness score icon
  const getFairnessScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle2;
    if (score >= 60) return AlertCircle;
    return XCircle;
  };

  if (burdenResults.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No eligible providers found. Add providers to the roster to see burden analysis.</p>
      </div>
    );
  }

  const FairnessIcon = getFairnessScoreIcon(fairnessMetrics.fairnessScore);

  return (
    <div className="space-y-6">
      {/* View Mode Toggle - Apple-style Segmented Control */}
      <div className="inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0.5 shadow-sm">
        <button
          onClick={() => setViewMode('expected')}
          className={cn(
            "relative flex items-center justify-center min-h-[32px] px-4 text-sm font-medium transition-all duration-200 rounded-md",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1",
            viewMode === 'expected'
              ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          Expected (FTE-based)
        </button>
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />
        <button
          onClick={() => setViewMode('schedule')}
          className={cn(
            "relative flex items-center justify-center min-h-[32px] px-4 text-sm font-medium transition-all duration-200 rounded-md",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1",
            viewMode === 'schedule'
              ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          Schedule-based
        </button>
      </div>

      {viewMode === 'expected' ? (
        <>
      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average Calls per Provider */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average Calls per Provider</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatNumber(fairnessMetrics.groupAverageCalls, 1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Min vs Max Calls */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400">Call Range</p>
                <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                    {formatNumber(fairnessMetrics.minCalls, 1)}
                  </span>
                  <span className="text-lg sm:text-xl text-gray-400 dark:text-gray-500">-</span>
                  <span className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                    {formatNumber(fairnessMetrics.maxCalls, 1)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Min to Max
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fairness Score */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                fairnessMetrics.fairnessScore >= 80 ? "bg-green-100 dark:bg-green-900/30" :
                fairnessMetrics.fairnessScore >= 60 ? "bg-yellow-100 dark:bg-yellow-900/30" :
                "bg-red-100 dark:bg-red-900/30"
              )}>
                <FairnessIcon className={cn(
                  "w-5 h-5",
                  getFairnessScoreColor(fairnessMetrics.fairnessScore)
                )} />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Fairness Score</p>
                <p className={cn(
                  "text-2xl font-semibold",
                  getFairnessScoreColor(fairnessMetrics.fairnessScore)
                )}>
                  {formatNumber(fairnessMetrics.fairnessScore, 1)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {fairnessMetrics.fairnessScore >= 80 ? 'Excellent' :
                   fairnessMetrics.fairnessScore >= 60 ? 'Good' : 'Needs Improvement'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Burden Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Provider Call Burden
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    FTE
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Weekday
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Weekend
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Holiday
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Burden Index
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {burdenResults.map((result, index) => (
                  <tr 
                    key={result.providerId} 
                    className={cn(
                      "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                      index % 2 === 0 && "bg-gray-50/50 dark:bg-gray-800/30"
                    )}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {result.providerName || `Provider ${result.providerId}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                      {formatNumber(result.fte, 2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                      {formatNumber(result.expectedWeekdayCalls, 1)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                      {formatNumber(result.expectedWeekendCalls, 1)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                      {formatNumber(result.expectedHolidayCalls, 1)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white">
                      {formatNumber(result.totalExpectedCalls, 1)}
                    </td>
                    <td className={cn(
                      "px-4 py-3 text-sm text-right font-medium",
                      getBurdenIndexColor(result.burdenIndex)
                    )}>
                      {result.burdenIndex > 0 ? '+' : ''}{formatNumber(result.burdenIndex, 1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Additional Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Eligible Providers</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {fairnessMetrics.eligibleProviderCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Eligible FTE</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatNumber(fairnessMetrics.totalEligibleFTE, 2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Standard Deviation</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatNumber(fairnessMetrics.standardDeviation, 2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Annual Calls</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatNumber(
                  assumptions.weekdayCallsPerMonth * 12 + 
                  assumptions.weekendCallsPerMonth * 12 + 
                  assumptions.holidaysPerYear,
                  1
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
        </>
      ) : (
        <div className="space-y-4">
          {schedule ? (
            <>
              {onScheduleChange && (
                <CallScheduleCalendarView
                  schedule={schedule}
                  providers={providers}
                  tiers={tiers}
                  onScheduleChange={onScheduleChange}
                />
              )}
              {/* Schedule-based burden summary will be added here */}
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No schedule generated yet. Click the button below to create a schedule.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {onGenerateSchedule && (
                    <Button onClick={onGenerateSchedule}>
                      Generate Schedule
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Generate test schedule - uses test providers from generator
                      // This works even if no providers are configured in the roster
                      const testSchedule = generateTestSchedule(new Date().getFullYear());
                      if (onScheduleChange) {
                        onScheduleChange(testSchedule);
                      }
                    }}
                  >
                    Load Test Data
                  </Button>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                  "Load Test Data" will populate a sample schedule with 4 test providers
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

