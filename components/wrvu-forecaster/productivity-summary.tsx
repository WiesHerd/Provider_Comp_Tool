'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
}

function StatItem({ icon, label, value, difference }: StatItemProps) {
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-primary flex-shrink-0">{icon}</div>
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{label}</span>
        </div>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 break-words">{value}</span>
          {difference && (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-semibold flex-shrink-0 touch-target">
              {difference}
              <Info className="w-3 h-3" />
            </div>
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
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      label: 'Estimated Incentive Payment',
      value: formatCurrency(currentIncentive),
      difference: formatDifference(currentIncentive, adjustedIncentive),
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      label: 'Weeks Worked Per Year',
      value: formatNumber(metrics.weeksWorkedPerYear),
    },
    {
      icon: <Users className="w-6 h-6" />,
      label: 'Encounters per Week',
      value: formatNumber(metrics.encountersPerWeek),
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      label: 'Annual Clinic Days',
      value: formatNumber(metrics.annualClinicDays),
    },
    {
      icon: <Clock className="w-6 h-6" />,
      label: 'Annual Clinical Hours',
      value: formatNumber(metrics.annualClinicalHours),
    },
    {
      icon: <Users className="w-6 h-6" />,
      label: 'Annual Patient Encounters',
      value: formatNumber(metrics.annualPatientEncounters),
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      label: 'Estimated Annual wRVUs',
      value: formatNumber(metrics.estimatedAnnualWRVUs),
      difference: formatWRVUDifference(metrics.estimatedAnnualWRVUs, adjustedAnnualWRVUs),
    },
  ];

  return (
    <Card className="mt-4 sm:mt-6">
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

