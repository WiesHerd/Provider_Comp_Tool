'use client';

import { useState } from 'react';
import { ProviderAnalysis } from '@/types/provider-mix';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ProviderVariabilityDashboardProps {
  analyses: ProviderAnalysis[];
}

type RiskFilter = 'all' | 'Aligned' | 'Mild Drift' | 'Risk Zone';

export function ProviderVariabilityDashboard({
  analyses,
}: ProviderVariabilityDashboardProps) {
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentile = (value: number) => {
    if (value >= 90) return '>90th';
    return `${Math.round(value)}th`;
  };

  const getRiskBadge = (riskFlag: string) => {
    switch (riskFlag) {
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

  const filteredAnalyses =
    riskFilter === 'all'
      ? analyses
      : analyses.filter((a) => a.riskFlag === riskFilter);

  if (analyses.length === 0) {
    return (
      <Card className="border-2">
        <CardContent className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Configure providers and CF model above to see analysis results.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Provider Variability Dashboard
          </CardTitle>
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter:
            </Label>
            <Select value={riskFilter} onValueChange={(value: RiskFilter) => setRiskFilter(value)}>
              <SelectTrigger className="w-[140px] min-h-[44px] touch-manipulation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                <SelectItem value="Aligned">Aligned</SelectItem>
                <SelectItem value="Mild Drift">Mild Drift</SelectItem>
                <SelectItem value="Risk Zone">Risk Zone</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Provider
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Role
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Clinical FTE
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Actual wRVUs
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Estimated TCC
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Survey Percentile
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Risk Flag
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAnalyses.map((analysis) => {
                const provider = analysis.provider;
                const wrvus = provider.actualWrvus || 0;
                const isRiskRow = analysis.riskFlag === 'Risk Zone';

                return (
                  <tr
                    key={provider.id}
                    className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                      isRiskRow ? 'bg-red-50/30 dark:bg-red-900/10' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                      {provider.name || `Provider ${provider.id.slice(-4)}`}
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      {provider.role}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                      {provider.clinicalFTE.toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                      {wrvus > 0
                        ? wrvus.toLocaleString('en-US', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300 font-medium">
                      {formatCurrency(analysis.totalTCC)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                      {formatPercentile(analysis.tccPercentile)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getRiskBadge(analysis.riskFlag)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredAnalyses.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <p>No providers match the selected filter.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


