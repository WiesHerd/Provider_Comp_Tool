'use client';

import { Tooltip } from '@/components/ui/tooltip';
import {
  DollarSign,
  Calendar,
  Users,
  Clock,
  TrendingUp,
  Info,
} from 'lucide-react';
import { ProductivityMetrics, WRVUForecasterInputs } from '@/types/wrvu-forecaster';
import { cn } from '@/lib/utils/cn';

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
      <div className="flex items-start gap-2 mb-2 sm:mb-3">
        <div className="text-primary flex-shrink-0 mt-0.5">{icon}</div>
        <Tooltip content={tooltipText} side="top" className="max-w-[250px] sm:max-w-[300px]">
          <span className="text-xs text-gray-600 dark:text-gray-400 leading-tight block flex-1">
            {label}
          </span>
        </Tooltip>
      </div>
      
      {/* Value and difference */}
      <div className="flex flex-col gap-1.5 sm:gap-2">
        <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100 break-words">
          {value}
        </span>
        {difference && (
          <Tooltip content="Potential increase using adjusted wRVU per encounter" side="top">
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-semibold w-fit touch-target">
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
  // Calculate adjusted metrics
  const adjustedAnnualWRVUs = metrics.annualPatientEncounters * inputs.adjustedWRVUPerEncounter;
  const adjustedWRVUCompensation = adjustedAnnualWRVUs * inputs.wrvuConversionFactor;
  const adjustedTotalCompensation = Math.max(inputs.baseSalary, adjustedWRVUCompensation);

  // Calculate incentive payments
  const currentIncentive = Math.max(0, metrics.wrvuCompensation - inputs.baseSalary);
  const adjustedIncentive = Math.max(0, adjustedWRVUCompensation - inputs.baseSalary);

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
      tooltipText: 'Total patient encounters per year based on your schedule and daily/hourly patient load',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      label: 'Estimated Annual wRVUs',
      value: formatNumber(metrics.estimatedAnnualWRVUs),
      difference: formatWRVUDifference(metrics.estimatedAnnualWRVUs, adjustedAnnualWRVUs),
      tooltipText: 'Total annual wRVUs based on patient encounters and average wRVU per encounter',
    },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Forecast Results</h3>
      
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

