'use client';

import { ScenarioResult, AlignmentStatus } from '@/types/physician-scenarios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

interface ScenarioResultsTableProps {
  results: ScenarioResult[];
}

export function ScenarioResultsTable({ results }: ScenarioResultsTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCF = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/wRVU`;
  };

  const formatPercentile = (value: number) => {
    if (value >= 90) return '>90th';
    return `${Math.round(value)}th`;
  };

  const getAlignmentBadge = (status: AlignmentStatus) => {
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
    }
  };

  if (results.length === 0) {
    return (
      <Card className="border-2">
        <CardContent className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Add scenarios above to see calculated results.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          Scenario Results
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
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Fixed Comp
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Clinical Dollars
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Modeled TCC
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Effective CF ($/wRVU)
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  wRVU Percentile
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  TCC Percentile
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  CF Percentile
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Alignment
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Recommended CF
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr
                  key={result.scenario.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                    <div className="space-y-1">
                      <div>{result.scenario.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {result.cfModelSummary}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                    {result.scenario.wrvus.toLocaleString('en-US', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                    {formatCurrency(result.scenario.fixedComp || 0)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                    {formatCurrency(result.clinicalDollars)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300 font-medium">
                    {formatCurrency(result.modeledTcc)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                    {formatCF(result.effectiveCF)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                    {formatPercentile(result.wrvuPercentile)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                    {formatPercentile(result.tccPercentile)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                    {result.cfPercentile !== undefined ? formatPercentile(result.cfPercentile) : '—'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {getAlignmentBadge(result.alignmentStatus)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                    {result.recommendedCF !== null && result.recommendedCF !== undefined
                      ? formatCF(result.recommendedCF)
                      : '—'}
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

