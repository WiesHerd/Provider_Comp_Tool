'use client';

import { InternalPercentiles } from '@/types/internal-benchmark';
import { MarketBenchmarks } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateComparisonMetrics } from '@/lib/utils/internal-benchmark';

interface PercentileCalculatorProps {
  internalPercentiles: InternalPercentiles | null;
  surveyBenchmarks: MarketBenchmarks | null;
}

export function PercentileCalculator({
  internalPercentiles,
  surveyBenchmarks,
}: PercentileCalculatorProps) {
  if (!internalPercentiles || !surveyBenchmarks) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Percentile Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload provider data and select a specialty to see percentile comparisons.
          </p>
        </CardContent>
      </Card>
    );
  }

  const comparison = calculateComparisonMetrics(internalPercentiles, surveyBenchmarks);

  const formatNumber = (value: number, decimals: number = 0): string => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatPercent = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          Percentile Comparison
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Internal percentiles vs. Market Survey benchmarks
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* wRVU Percentiles */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              wRVU Percentiles
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Percentile
                    </th>
                    <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Internal
                    </th>
                    <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Survey
                    </th>
                    <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Difference
                    </th>
                    <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      % Diff
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400">25th</td>
                    <td className="py-2 px-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {formatNumber(internalPercentiles.wrvu25)}
                    </td>
                    <td className="py-2 px-3 text-sm text-right text-gray-600 dark:text-gray-400">
                      {surveyBenchmarks.wrvu25 ? formatNumber(surveyBenchmarks.wrvu25) : 'N/A'}
                    </td>
                    <td className="py-2 px-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {formatNumber(comparison.wrvuDifference.p25)}
                    </td>
                    <td
                      className={`py-2 px-3 text-sm text-right font-medium ${
                        comparison.wrvuPercentDifference.p25 >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatPercent(comparison.wrvuPercentDifference.p25)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400">50th</td>
                    <td className="py-2 px-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {formatNumber(internalPercentiles.wrvu50)}
                    </td>
                    <td className="py-2 px-3 text-sm text-right text-gray-600 dark:text-gray-400">
                      {surveyBenchmarks.wrvu50 ? formatNumber(surveyBenchmarks.wrvu50) : 'N/A'}
                    </td>
                    <td className="py-2 px-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {formatNumber(comparison.wrvuDifference.p50)}
                    </td>
                    <td
                      className={`py-2 px-3 text-sm text-right font-medium ${
                        comparison.wrvuPercentDifference.p50 >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatPercent(comparison.wrvuPercentDifference.p50)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400">75th</td>
                    <td className="py-2 px-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {formatNumber(internalPercentiles.wrvu75)}
                    </td>
                    <td className="py-2 px-3 text-sm text-right text-gray-600 dark:text-gray-400">
                      {surveyBenchmarks.wrvu75 ? formatNumber(surveyBenchmarks.wrvu75) : 'N/A'}
                    </td>
                    <td className="py-2 px-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {formatNumber(comparison.wrvuDifference.p75)}
                    </td>
                    <td
                      className={`py-2 px-3 text-sm text-right font-medium ${
                        comparison.wrvuPercentDifference.p75 >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatPercent(comparison.wrvuPercentDifference.p75)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400">90th</td>
                    <td className="py-2 px-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {formatNumber(internalPercentiles.wrvu90)}
                    </td>
                    <td className="py-2 px-3 text-sm text-right text-gray-600 dark:text-gray-400">
                      {surveyBenchmarks.wrvu90 ? formatNumber(surveyBenchmarks.wrvu90) : 'N/A'}
                    </td>
                    <td className="py-2 px-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {formatNumber(comparison.wrvuDifference.p90)}
                    </td>
                    <td
                      className={`py-2 px-3 text-sm text-right font-medium ${
                        comparison.wrvuPercentDifference.p90 >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatPercent(comparison.wrvuPercentDifference.p90)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* TCC Percentiles */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              TCC Percentiles
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Percentile
                    </th>
                    <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Internal
                    </th>
                    <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Survey
                    </th>
                    <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Difference
                    </th>
                    <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      % Diff
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400">25th</td>
                    <td className="py-2 px-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      ${formatNumber(internalPercentiles.tcc25, 0)}
                    </td>
                    <td className="py-2 px-3 text-sm text-right text-gray-600 dark:text-gray-400">
                      {surveyBenchmarks.tcc25 ? `$${formatNumber(surveyBenchmarks.tcc25, 0)}` : 'N/A'}
                    </td>
                    <td className="py-2 px-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      ${formatNumber(comparison.tccDifference.p25, 0)}
                    </td>
                    <td
                      className={`py-2 px-3 text-sm text-right font-medium ${
                        comparison.tccPercentDifference.p25 >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatPercent(comparison.tccPercentDifference.p25)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400">50th</td>
                    <td className="py-2 px-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      ${formatNumber(internalPercentiles.tcc50, 0)}
                    </td>
                    <td className="py-2 px-3 text-sm text-right text-gray-600 dark:text-gray-400">
                      {surveyBenchmarks.tcc50 ? `$${formatNumber(surveyBenchmarks.tcc50, 0)}` : 'N/A'}
                    </td>
                    <td className="py-2 px-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      ${formatNumber(comparison.tccDifference.p50, 0)}
                    </td>
                    <td
                      className={`py-2 px-3 text-sm text-right font-medium ${
                        comparison.tccPercentDifference.p50 >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatPercent(comparison.tccPercentDifference.p50)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400">75th</td>
                    <td className="py-2 px-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      ${formatNumber(internalPercentiles.tcc75, 0)}
                    </td>
                    <td className="py-2 px-3 text-sm text-right text-gray-600 dark:text-gray-400">
                      {surveyBenchmarks.tcc75 ? `$${formatNumber(surveyBenchmarks.tcc75, 0)}` : 'N/A'}
                    </td>
                    <td className="py-2 px-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      ${formatNumber(comparison.tccDifference.p75, 0)}
                    </td>
                    <td
                      className={`py-2 px-3 text-sm text-right font-medium ${
                        comparison.tccPercentDifference.p75 >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatPercent(comparison.tccPercentDifference.p75)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400">90th</td>
                    <td className="py-2 px-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      ${formatNumber(internalPercentiles.tcc90, 0)}
                    </td>
                    <td className="py-2 px-3 text-sm text-right text-gray-600 dark:text-gray-400">
                      {surveyBenchmarks.tcc90 ? `$${formatNumber(surveyBenchmarks.tcc90, 0)}` : 'N/A'}
                    </td>
                    <td className="py-2 px-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      ${formatNumber(comparison.tccDifference.p90, 0)}
                    </td>
                    <td
                      className={`py-2 px-3 text-sm text-right font-medium ${
                        comparison.tccPercentDifference.p90 >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatPercent(comparison.tccPercentDifference.p90)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}




