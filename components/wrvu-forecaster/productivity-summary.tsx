'use client';

import * as React from 'react';
import { Tooltip } from '@/components/ui/tooltip';
import {
  DollarSign,
  Calendar,
  Users,
  Clock,
  TrendingUp,
  Info,
  AlertCircle,
  X,
} from 'lucide-react';
import { ProductivityMetrics, WRVUForecasterInputs } from '@/types/wrvu-forecaster';
import { cn } from '@/lib/utils/cn';
import { analyzeCalendarDataCoverage, formatDateString } from '@/lib/utils/calendar-helpers';
import { format } from 'date-fns';

interface ProductivitySummaryProps {
  metrics: ProductivityMetrics;
  inputs: WRVUForecasterInputs;
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  difference?: string;
  tooltipText: string;
}

function StatItem({ icon, label, value, difference, tooltipText }: StatItemProps) {
  return (
    <div className="p-3 sm:p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:shadow-sm transition-shadow bg-white dark:bg-gray-900">
      {/* Icon and label - Compact layout for mobile */}
      <div className="flex items-start gap-2 mb-3 sm:mb-4">
        <div className="text-primary flex-shrink-0 mt-0.5">{icon}</div>
        <Tooltip content={tooltipText} side="top" className="max-w-[250px] sm:max-w-[300px]">
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight block flex-1">
            {label}
          </span>
        </Tooltip>
      </div>
      
      {/* Value and difference - Apple-style: value large, pill on right */}
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 break-words flex-1">
          {value}
        </span>
        {difference && (
          <Tooltip content="Potential increase using adjusted wRVU per encounter" side="top">
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold flex-shrink-0 touch-target">
              {difference}
              <Info className="w-3 h-3" />
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

export function ProductivitySummary({ metrics, inputs }: ProductivitySummaryProps) {
  const [isTemplateNoticeDismissed, setIsTemplateNoticeDismissed] = React.useState(false);
  const [isCalendarNoticeDismissed, setIsCalendarNoticeDismissed] = React.useState(false);

  // Calculate adjusted metrics
  const adjustedAnnualWRVUs = metrics.annualPatientEncounters * inputs.adjustedWRVUPerEncounter;
  const adjustedWRVUCompensation = adjustedAnnualWRVUs * inputs.wrvuConversionFactor;
  const adjustedTotalCompensation = Math.max(inputs.baseSalary, adjustedWRVUCompensation);

  // Calculate incentive payments
  const currentIncentive = Math.max(0, metrics.wrvuCompensation - inputs.baseSalary);
  const adjustedIncentive = Math.max(0, adjustedWRVUCompensation - inputs.baseSalary);

  // Analyze calendar data coverage
  const calendarCoverage = inputs.dailyPatientCounts
    ? analyzeCalendarDataCoverage(
        inputs.dailyPatientCounts,
        inputs.vacationDates,
        inputs.cmeDates,
        inputs.statutoryHolidayDates
      )
    : null;

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);

  const formatDifference = (current: number, adjusted: number) => {
    const diff = adjusted - current;
    if (diff <= 0) return undefined;
    return `+${formatCurrency(diff)}`;
  };

  const formatWRVUDifference = (current: number, adjusted: number) => {
    const diff = adjusted - current;
    if (diff <= 0) return undefined;
    return `+${formatNumber(diff)}`;
  };

  // Group metrics into logical sections
  const compensationMetrics: StatItemProps[] = [
    {
      icon: <DollarSign className="w-6 h-6" />,
      label: 'Estimated Total Compensation',
      value: formatCurrency(metrics.estimatedTotalCompensation),
      tooltipText: 'Total annual compensation including base salary and wRVU-based incentive payments',
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      label: 'Estimated Incentive Payment',
      value: formatCurrency(currentIncentive),
      difference: formatDifference(currentIncentive, adjustedIncentive),
      tooltipText: 'Additional compensation earned above base salary based on wRVU production',
    },
  ];

  const timeMetrics: StatItemProps[] = [
    {
      icon: <Calendar className="w-6 h-6" />,
      label: 'Weeks Worked Per Year',
      value: formatNumber(metrics.weeksWorkedPerYear),
      tooltipText: 'Total working weeks per year after subtracting vacation, CME, and holidays',
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      label: 'Annual Clinic Days',
      value: formatNumber(metrics.annualClinicDays),
      tooltipText: 'Total clinic days per year after subtracting vacation, CME, and holidays',
    },
    {
      icon: <Clock className="w-6 h-6" />,
      label: 'Annual Clinical Hours',
      value: formatNumber(metrics.annualClinicalHours),
      tooltipText: 'Total clinical hours per year based on your schedule',
    },
  ];

  const productivityMetrics: StatItemProps[] = [
    {
      icon: <Users className="w-6 h-6" />,
      label: 'Encounters per Week',
      value: formatNumber(metrics.encountersPerWeek),
      tooltipText: 'Average number of patient encounters per week based on your schedule',
    },
    {
      icon: <Users className="w-6 h-6" />,
      label: 'Annual Patient Encounters',
      value: formatNumber(metrics.annualPatientEncounters),
      tooltipText: `Total patient encounters per year ${calendarCoverage?.isFullYear ? 'from your calendar entries' : 'annualized from your calendar data (average daily pattern × annual working days)'}`,
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      label: 'Estimated Annual wRVUs',
      value: formatNumber(metrics.estimatedAnnualWRVUs),
      difference: formatWRVUDifference(metrics.estimatedAnnualWRVUs, adjustedAnnualWRVUs),
      tooltipText: `Annual wRVUs: ${formatNumber(metrics.annualPatientEncounters)} encounters × ${inputs.avgWRVUPerEncounter.toFixed(2)} wRVU/encounter = ${formatNumber(metrics.estimatedAnnualWRVUs)} wRVUs. ${calendarCoverage?.isFullYear ? 'Based on full year calendar data.' : 'Annualized from calendar average.'}`,
    },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Forecast Results</h3>
      
      {/* Calendar Data Source Notice */}
      {inputs.isFromTemplate && !isTemplateNoticeDismissed ? (
        <div className="rounded-lg border-2 p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 relative">
          <button
            onClick={() => setIsTemplateNoticeDismissed(true)}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors touch-target"
            aria-label="Dismiss notice"
          >
            <X className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-1 text-blue-900 dark:text-blue-100">
                Built from Week Template
              </h4>
              <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-300">
                Your forecast is based on a weekly template that has been replicated across all matching days of the year (e.g., all Mondays, all Tuesdays, etc.). Vacation, CME, and holiday dates are excluded from the template pattern.
              </p>
            </div>
          </div>
        </div>
      ) : calendarCoverage && !isCalendarNoticeDismissed ? (
        <div className={cn(
          'rounded-lg border-2 p-4 relative',
          calendarCoverage.isFullYear
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
        )}>
          <button
            onClick={() => setIsCalendarNoticeDismissed(true)}
            className={cn(
              'absolute top-3 right-3 p-1 rounded-full transition-colors touch-target',
              calendarCoverage.isFullYear
                ? 'hover:bg-blue-100 dark:hover:bg-blue-800/50'
                : 'hover:bg-amber-100 dark:hover:bg-amber-800/50'
            )}
            aria-label="Dismiss notice"
          >
            <X className={cn(
              'w-4 h-4',
              calendarCoverage.isFullYear
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-amber-600 dark:text-amber-400'
            )} />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <AlertCircle className={cn(
              'w-5 h-5 flex-shrink-0 mt-0.5',
              calendarCoverage.isFullYear
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-amber-600 dark:text-amber-400'
            )} />
            <div className="flex-1">
              <h4 className={cn(
                'text-sm font-semibold mb-1',
                calendarCoverage.isFullYear
                  ? 'text-blue-900 dark:text-blue-100'
                  : 'text-amber-900 dark:text-amber-100'
              )}>
                {calendarCoverage.isFullYear 
                  ? 'Using Full Year Calendar Data'
                  : 'Annualizing from Partial Calendar Data'}
              </h4>
              <p className={cn(
                'text-xs leading-relaxed',
                calendarCoverage.isFullYear
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-amber-700 dark:text-amber-300'
              )}>
                {calendarCoverage.isFullYear ? (
                  <>
                    Your calendar contains data for {calendarCoverage.monthsCovered} month{calendarCoverage.monthsCovered !== 1 ? 's' : ''} 
                    ({calendarCoverage.totalDaysWithData} working days). Annual projections are based on your actual calendar entries.
                  </>
                ) : (
                  <>
                    Your calendar contains data for {calendarCoverage.monthsCovered} month{calendarCoverage.monthsCovered !== 1 ? 's' : ''} 
                    ({calendarCoverage.totalDaysWithData} working days, {Math.round(calendarCoverage.coveragePercentage)}% of year). 
                    Annual projections are calculated by averaging your daily patient counts and applying that pattern to all {Math.round(metrics.annualClinicDays)} annual working days.
                    {calendarCoverage.dateRange.start && calendarCoverage.dateRange.end && (
                      <> Data range: {format(calendarCoverage.dateRange.start, 'MMM d')} - {format(calendarCoverage.dateRange.end, 'MMM d, yyyy')}.</>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      ) : null}
      
      {/* Compensation Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Compensation</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {compensationMetrics.map((item, index) => (
            <StatItem key={`comp-${index}`} {...item} />
          ))}
        </div>
      </div>

      {/* Time Section */}
      <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Time</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {timeMetrics.map((item, index) => (
            <StatItem key={`time-${index}`} {...item} />
          ))}
        </div>
      </div>

      {/* Productivity Section */}
      <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Productivity</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {productivityMetrics.map((item, index) => (
            <StatItem key={`prod-${index}`} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
}

