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
  Stethoscope,
} from 'lucide-react';
import { ProductivityMetrics, WRVUForecasterInputs } from '@/types/wrvu-forecaster';
import { cn } from '@/lib/utils/cn';
import { analyzeCalendarDataCoverage, formatDateString } from '@/lib/utils/calendar-helpers';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';

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
  onClick?: () => void;
  isClickable?: boolean;
}

function StatItem({ icon, label, value, difference, tooltipText, onClick, isClickable }: StatItemProps) {
  // Check if value is negative (for incentive payments)
  const isNegative = value.startsWith('-') || value.includes('-$');
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-3 sm:p-4 border border-gray-200 dark:border-gray-800 rounded-lg transition-all bg-white dark:bg-gray-900",
        isClickable 
          ? "hover:shadow-md hover:border-primary/50 cursor-pointer active:scale-[0.98]" 
          : "hover:shadow-sm"
      )}
    >
      {/* Icon and label - Compact layout for mobile */}
      <div className="flex items-start gap-2 mb-3 sm:mb-4">
        <div className="text-primary flex-shrink-0 mt-0.5">{icon}</div>
        <Tooltip content={tooltipText} side="top" className="max-w-[250px] sm:max-w-[300px]">
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight block flex-1">
            {label}
          </span>
        </Tooltip>
        {isClickable && (
          <ArrowUpRight className="w-4 h-4 text-primary/60 flex-shrink-0 mt-0.5" />
        )}
      </div>
      
      {/* Value and difference - Apple-style: value large, pill on right */}
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn(
          "text-2xl sm:text-3xl lg:text-4xl font-bold break-words flex-1",
          isNegative 
            ? "text-red-600 dark:text-red-400" 
            : "text-gray-900 dark:text-gray-100"
        )}>
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
      {isClickable && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-primary/70 dark:text-primary/60">
            Tap to calculate percentile
          </p>
        </div>
      )}
    </div>
  );
}

export function ProductivitySummary({ metrics, inputs }: ProductivitySummaryProps) {
  const router = useRouter();
  const [isTemplateNoticeDismissed, setIsTemplateNoticeDismissed] = React.useState(false);
  const [isCalendarNoticeDismissed, setIsCalendarNoticeDismissed] = React.useState(false);

  // Calculate adjusted metrics
  const adjustedAnnualWRVUs = metrics.annualPatientEncounters * inputs.adjustedWRVUPerEncounter;
  const adjustedWRVUCompensation = adjustedAnnualWRVUs * inputs.wrvuConversionFactor;
  const adjustedTotalCompensation = Math.max(inputs.baseSalary, adjustedWRVUCompensation);

  // Calculate incentive payments: (Conversion Factor × wRVUs) - Base Pay
  // Can be negative if wRVU compensation is less than base salary
  const currentIncentive = metrics.wrvuCompensation - inputs.baseSalary;
  const adjustedIncentive = adjustedWRVUCompensation - inputs.baseSalary;

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

  const formatFTE = (value: number) => {
    return value.toFixed(2);
  };

  const handleCalculatePercentile = () => {
    const specialty = inputs.specialty === 'Other' ? inputs.customSpecialty : inputs.specialty;
    const fte = inputs.fte ?? 1.0;
    const totalTcc = metrics.estimatedTotalCompensation;
    
    // Build query parameters
    const params = new URLSearchParams();
    params.set('totalTcc', totalTcc.toString());
    params.set('fte', fte.toString());
    if (specialty) {
      params.set('specialty', specialty);
    }
    
    router.push(`/fmv-calculator/tcc?${params.toString()}`);
  };

  // Group metrics into logical sections
  const compensationMetrics: StatItemProps[] = [
    {
      icon: <DollarSign className="w-6 h-6" />,
      label: 'Estimated Total Compensation',
      value: formatCurrency(metrics.estimatedTotalCompensation),
      tooltipText: `Total compensation: Max of base salary (${formatCurrency(inputs.baseSalary)}) or wRVU compensation (${formatCurrency(metrics.wrvuCompensation)}). Currently showing ${formatCurrency(metrics.estimatedTotalCompensation)}. Tap to calculate percentile ranking.`,
      onClick: handleCalculatePercentile,
      isClickable: true,
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      label: 'Estimated Incentive Payment',
      value: formatCurrency(currentIncentive),
      difference: formatDifference(currentIncentive, adjustedIncentive),
      tooltipText: `Incentive Payment = (${formatCurrency(inputs.wrvuConversionFactor)} × ${formatNumber(metrics.estimatedAnnualWRVUs)} wRVUs) - ${formatCurrency(inputs.baseSalary)} = ${formatCurrency(currentIncentive)}. ${currentIncentive >= 0 ? 'Positive incentive payment above base salary (shown in green).' : 'Negative amount indicates wRVU compensation is below base salary (shown in red).'}`,
    },
  ];

  const timeMetrics: StatItemProps[] = [
    {
      icon: <Users className="w-6 h-6" />,
      label: 'FTE Rate',
      value: formatFTE(inputs.fte ?? 1.0),
      tooltipText: `Full-Time Equivalent rate. 1.0 = 100% full-time, 0.5 = 50% part-time, etc. This affects all compensation calculations.`,
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      label: 'Total Weeks',
      value: '52',
      tooltipText: 'Total weeks in a year (52 weeks)',
    },
    {
      icon: <Stethoscope className="w-6 h-6" />,
      label: 'Clinical Weeks',
      value: formatNumber(metrics.weeksWorkedPerYear),
      tooltipText: `Weeks when patients are actually seen: 52 weeks minus ${formatNumber(inputs.vacationWeeks)} vacation weeks minus ${formatNumber((inputs.cmeDays + inputs.statutoryHolidays) / 7)} weeks (CME + holidays) = ${formatNumber(metrics.weeksWorkedPerYear)} clinical weeks`,
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      label: 'Annual Clinic Days',
      value: formatNumber(metrics.annualClinicDays),
      tooltipText: `Total clinic days per year: ${formatNumber(metrics.weeksWorkedPerYear)} clinical weeks × ${formatNumber(metrics.annualClinicDays / metrics.weeksWorkedPerYear || 0)} days/week = ${formatNumber(metrics.annualClinicDays)} days (excluding ${formatNumber(inputs.vacationWeeks)} vacation weeks, ${formatNumber(inputs.cmeDays)} CME days, and ${formatNumber(inputs.statutoryHolidays)} holidays)`,
    },
    {
      icon: <Clock className="w-6 h-6" />,
      label: 'Annual Clinical Hours',
      value: formatNumber(metrics.annualClinicalHours),
      tooltipText: `Total clinical hours per year: ${formatNumber(metrics.annualClinicalHours / metrics.weeksWorkedPerYear || 0)} hours/week × ${formatNumber(metrics.weeksWorkedPerYear)} clinical weeks = ${formatNumber(metrics.annualClinicalHours)} hours (excluding vacation, CME, and holidays)`,
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

      {/* Calculation Breakdown - Show what was excluded */}
      <div className="rounded-lg border-2 p-4 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Calculation Breakdown
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total weeks in year:</span>
              <span className="font-semibold text-gray-900 dark:text-white">52 weeks</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Vacation weeks excluded:</span>
              <span className="font-semibold text-red-600 dark:text-red-400">-{formatNumber(inputs.vacationWeeks)} weeks</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">CME days excluded:</span>
              <span className="font-semibold text-red-600 dark:text-red-400">-{formatNumber(inputs.cmeDays)} days ({(inputs.cmeDays / 7).toFixed(1)} weeks)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Statutory holidays excluded:</span>
              <span className="font-semibold text-red-600 dark:text-red-400">-{formatNumber(inputs.statutoryHolidays)} days ({(inputs.statutoryHolidays / 7).toFixed(1)} weeks)</span>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <span className="font-semibold text-gray-900 dark:text-white">Clinical weeks (patients seen):</span>
              <span className="font-bold text-primary text-lg">{formatNumber(metrics.weeksWorkedPerYear)} weeks</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Clinical days per year:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{formatNumber(metrics.annualClinicDays)} days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Clinical hours per year:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{formatNumber(metrics.annualClinicalHours)} hours</span>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Annual Patient Encounters Calculation:
              </div>
              <div className="text-xs text-gray-700 dark:text-gray-300">
                {metrics.annualClinicDays > 0 ? (
                  <>
                    {formatNumber(metrics.annualClinicDays)} clinical days × {calendarCoverage?.isFullYear ? 'actual average' : 'average'} {((metrics.annualPatientEncounters / metrics.annualClinicDays) || 0).toFixed(1)} patients/day = {formatNumber(metrics.annualPatientEncounters)} encounters
                  </>
                ) : (
                  'No clinical days calculated'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Section */}
      <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Time</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
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

      {/* Billing Improvement Impact Section */}
      {inputs.adjustedWRVUPerEncounter !== inputs.avgWRVUPerEncounter && (
        <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Billing Improvement Impact</h4>
          <div className="rounded-lg border-2 p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="space-y-4">
              {/* Current vs Adjusted wRVUs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Current (Average wRVU)
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">wRVUs:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatNumber(metrics.estimatedAnnualWRVUs)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Calculation:</span>
                      <span className="text-gray-700 dark:text-gray-300 text-xs">
                        {formatNumber(metrics.annualPatientEncounters)} × {inputs.avgWRVUPerEncounter.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Incentive Payment:</span>
                      <span className={cn(
                        'font-semibold',
                        currentIncentive >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      )}>
                        {currentIncentive >= 0 ? '+' : ''}{formatCurrency(currentIncentive)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 pl-2">
                      ({formatCurrency(inputs.wrvuConversionFactor)} × {formatNumber(metrics.estimatedAnnualWRVUs)}) - {formatCurrency(inputs.baseSalary)}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Adjusted (Improved Billing)
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">wRVUs:</span>
                      <span className="font-semibold text-primary">
                        {formatNumber(adjustedAnnualWRVUs)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Calculation:</span>
                      <span className="text-gray-700 dark:text-gray-300 text-xs">
                        {formatNumber(metrics.annualPatientEncounters)} × {inputs.adjustedWRVUPerEncounter.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Incentive Payment:</span>
                      <span className={cn(
                        'font-semibold',
                        adjustedIncentive >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      )}>
                        {adjustedIncentive >= 0 ? '+' : ''}{formatCurrency(adjustedIncentive)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 pl-2">
                      ({formatCurrency(inputs.wrvuConversionFactor)} × {formatNumber(adjustedAnnualWRVUs)}) - {formatCurrency(inputs.baseSalary)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Improvement Summary */}
              {adjustedIncentive > currentIncentive && (
                <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Potential Additional Incentive:
                    </span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      +{formatCurrency(adjustedIncentive - currentIncentive)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Additional {formatNumber(adjustedAnnualWRVUs - metrics.estimatedAnnualWRVUs)} wRVUs from improved billing practices
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

