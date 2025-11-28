'use client';

import { StewardshipComparison } from '@/types/cf-stewardship';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface StewardshipComparisonTableProps {
  comparisons: StewardshipComparison[];
}

export function StewardshipComparisonTable({ comparisons }: StewardshipComparisonTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentileMatch = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}`;
  };

  const getAlignmentBadge = (status: string) => {
    switch (status) {
      case 'Aligned':
        return (
          <Badge
            variant="outline"
            className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Aligned
          </Badge>
        );
      case 'Mild Drift':
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            Mild Drift
          </Badge>
        );
      case 'Risk Zone':
        return (
          <Badge
            variant="outline"
            className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            Risk Zone
          </Badge>
        );
      default:
        return null;
    }
  };

  if (comparisons.length === 0) {
    return (
      <Card className="border-2">
        <CardContent className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Configure CF models above to see comparison results.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          CF Stewardship Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Scenario
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  wRVUs
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 border-l border-gray-200 dark:border-gray-700">
                  Current CF → Incentive Pay
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Current CF → Survey TCC
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 border-l border-gray-200 dark:border-gray-700">
                  Proposed CF → Incentive Pay
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Proposed CF → Survey TCC
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 border-l border-gray-200 dark:border-gray-700">
                  Percentile Match
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Alignment Status
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((comparison) => (
                <tr
                  key={comparison.scenario.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                    {comparison.scenario.name}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                    {comparison.scenario.wrvus.toLocaleString('en-US', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300 border-l border-gray-200 dark:border-gray-700">
                    {formatCurrency(comparison.currentIncentivePay)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                    {formatCurrency(comparison.currentSurveyTCC)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300 border-l border-gray-200 dark:border-gray-700">
                    {formatCurrency(comparison.proposedIncentivePay)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300 font-medium">
                    {formatCurrency(comparison.proposedSurveyTCC)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300 border-l border-gray-200 dark:border-gray-700">
                    {formatPercentileMatch(comparison.percentileMatch)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {getAlignmentBadge(comparison.alignmentStatus)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}


