'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-4">
        {/* Icon above label - Mobile-friendly vertical layout */}
        <div className="flex flex-col items-center sm:items-start gap-2 mb-3">
          <div className="text-primary flex-shrink-0">{icon}</div>
          <Tooltip content={tooltipText} side="top" className="max-w-[250px] sm:max-w-[300px]">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left leading-tight block w-full">
              {label}
            </span>
          </Tooltip>
        </div>
        
        {/* Value and difference */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 text-center sm:text-left break-words">
            {value}
          </span>
          {difference && (
            <Tooltip content="Potential increase using adjusted wRVU per encounter" side="top">
              <div className="flex items-center justify-center sm:justify-start gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-semibold flex-shrink-0 touch-target w-fit mx-auto sm:mx-0">
                {difference}
                <Info className="w-3 h-3" />
              </div>
            </Tooltip>
          )}
        </div>
      </CardContent>
    </Card>
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

  const summaryItems: StatItemProps[] = [
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
    {
      icon: <Calendar className="w-6 h-6" />,
      label: 'Weeks Worked Per Year',
      value: formatNumber(metrics.weeksWorkedPerYear),
      tooltipText: 'Total working weeks per year after subtracting vacation, CME, and holidays',
    },
    {
      icon: <Users className="w-6 h-6" />,
      label: 'Encounters per Week',
      value: formatNumber(metrics.encountersPerWeek),
      tooltipText: 'Average number of patient encounters per week based on your schedule',
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
    <Card className="mt-4 sm:mt-6 productivity-summary">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg font-bold text-primary">Productivity Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {summaryItems.map((item, index) => (
            <StatItem key={index} {...item} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

