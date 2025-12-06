'use client';

import { BudgetImpact } from '@/types/cf-stewardship';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { DollarSign, Users } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';

interface BudgetImpactCardProps {
  budgetImpact: BudgetImpact | null;
  providerCount: number;
  medianWrvus: number;
  onProviderCountChange: (count: number) => void;
  onMedianWrvusChange: (wrvus: number) => void;
}

export function BudgetImpactCard({
  budgetImpact,
  providerCount,
  medianWrvus,
  onProviderCountChange,
  onMedianWrvusChange,
}: BudgetImpactCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const StatItem = ({ icon, label, value, tooltipText }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    tooltipText: string;
  }) => {
    return (
      <div className="p-3 sm:p-4 border border-gray-200/60 dark:border-gray-800/60 rounded-lg transition-all duration-200 ease-out bg-white dark:bg-gray-900 hover:shadow-md shadow-sm">
        <div className="flex items-start gap-2 mb-3 sm:mb-4">
          <div className="text-primary flex-shrink-0 mt-0.5">{icon}</div>
          <Tooltip content={tooltipText} side="top" className="max-w-[250px] sm:max-w-[300px]">
            <span className="text-xs sm:text-sm text-gray-600/80 dark:text-gray-400/80 leading-tight block flex-1 font-medium">
              {label}
            </span>
          </Tooltip>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-2xl sm:text-3xl lg:text-4xl font-bold break-words flex-1 text-gray-900 dark:text-gray-100 tracking-tight">
            {value}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          Budget & Provider Impact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Number of Providers</Label>
            <NumberInput
              value={providerCount}
              onChange={onProviderCountChange}
              min={1}
              step={1}
              integerOnly
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Median wRVU Model</Label>
            <NumberInput
              value={medianWrvus}
              onChange={onMedianWrvusChange}
              min={0}
              step={100}
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Default: 50th percentile from benchmarks
            </p>
          </div>
        </div>

        {/* Impact Results */}
        {budgetImpact && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatItem
              icon={<DollarSign className="w-6 h-6" />}
              label="Estimated Budget Impact"
              value={formatCurrency(budgetImpact.totalBudgetImpact)}
              tooltipText={`Total annual budget impact for ${providerCount} providers: ${formatCurrency(budgetImpact.deltaPerFTE)} per FTE × ${providerCount} providers = ${formatCurrency(budgetImpact.totalBudgetImpact)}`}
            />
            <StatItem
              icon={<Users className="w-6 h-6" />}
              label="Estimated Average Provider Impact"
              value={formatCurrency(budgetImpact.averageProviderImpact)}
              tooltipText={`Average annual compensation change per provider (per FTE): ${formatCurrency(budgetImpact.currentTCCPerFTE)} current → ${formatCurrency(budgetImpact.proposedTCCPerFTE)} proposed = ${formatCurrency(budgetImpact.deltaPerFTE)}`}
            />
          </div>
        )}

        {!budgetImpact && (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            Configure CF models above to see budget impact calculations.
          </div>
        )}
      </CardContent>
    </Card>
  );
}









