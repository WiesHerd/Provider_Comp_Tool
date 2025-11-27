'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScenarioComparison } from '@/types/call-scenarios';
import { FMVRiskLevel } from '@/types/fmv';
import { format } from 'date-fns';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ScenarioComparisonTableProps {
  comparisons: ScenarioComparison[];
  onSelectScenario?: (scenarioId: string) => void;
  className?: string;
}

export function ScenarioComparisonTable({
  comparisons,
  onSelectScenario,
  className,
}: ScenarioComparisonTableProps) {
  const getRiskLevelStyles = (riskLevel: FMVRiskLevel | 'N/A') => {
    switch (riskLevel) {
      case 'LOW':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          text: 'text-green-700 dark:text-green-300',
          icon: CheckCircle2,
          label: 'Low Risk',
        };
      case 'MODERATE':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          text: 'text-yellow-700 dark:text-yellow-300',
          icon: AlertTriangle,
          label: 'Moderate Risk',
        };
      case 'HIGH':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          text: 'text-red-700 dark:text-red-300',
          icon: AlertCircle,
          label: 'High Risk',
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-800',
          text: 'text-gray-600 dark:text-gray-400',
          icon: AlertCircle,
          label: 'N/A',
        };
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 1) => {
    return value.toFixed(decimals);
  };

  if (comparisons.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No scenarios saved yet. Save a scenario to see comparisons.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Scenario Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200/60 dark:border-gray-700/60">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Scenario
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Total Budget
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  $/FTE
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Fairness Score
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  FMV Risk
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Effective $/24h
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((comparison) => {
                const riskStyles = getRiskLevelStyles(comparison.fmvRiskLevel);
                const RiskIcon = riskStyles.icon;

                return (
                  <tr
                    key={comparison.id}
                    className={cn(
                      'border-b border-gray-100/60 dark:border-gray-800/60',
                      onSelectScenario && 'cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-all duration-200 ease-out'
                    )}
                    onClick={() => onSelectScenario?.(comparison.id)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {comparison.name}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                      {formatCurrency(comparison.totalCallBudget)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                      {formatCurrency(comparison.callPayPerFTE)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={cn(
                          'font-medium',
                          comparison.fairnessScore >= 80
                            ? 'text-green-600 dark:text-green-400'
                            : comparison.fairnessScore >= 60
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-red-600 dark:text-red-400'
                        )}
                      >
                        {formatNumber(comparison.fairnessScore)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        className={cn(
                          'px-2.5 py-1 text-xs font-medium',
                          riskStyles.bg,
                          riskStyles.text,
                          'border shadow-sm'
                        )}
                      >
                        <RiskIcon className="w-3 h-3 mr-1 inline" />
                        {riskStyles.label}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                      {formatCurrency(comparison.effectiveRatePer24h)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(comparison.updatedAt), 'MMM d, yyyy')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

