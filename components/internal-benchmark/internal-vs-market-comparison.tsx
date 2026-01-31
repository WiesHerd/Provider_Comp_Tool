'use client';

import { InternalPercentiles } from '@/types/internal-benchmark';
import { MarketBenchmarks } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useDarkMode } from '@/lib/hooks/use-dark-mode';

interface InternalVsMarketComparisonProps {
  internalPercentiles: InternalPercentiles | null;
  surveyBenchmarks: MarketBenchmarks | null;
}

export function InternalVsMarketComparison({
  internalPercentiles,
  surveyBenchmarks,
}: InternalVsMarketComparisonProps) {
  const isDark = useDarkMode();

  if (!internalPercentiles || !surveyBenchmarks) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Internal vs Market Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload provider data and select a specialty to see comparison charts.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for wRVU chart
  const wrvuData = [
    {
      percentile: '25th',
      internal: internalPercentiles.wrvu25,
      market: surveyBenchmarks.wrvu25 || 0,
    },
    {
      percentile: '50th',
      internal: internalPercentiles.wrvu50,
      market: surveyBenchmarks.wrvu50 || 0,
    },
    {
      percentile: '75th',
      internal: internalPercentiles.wrvu75,
      market: surveyBenchmarks.wrvu75 || 0,
    },
    {
      percentile: '90th',
      internal: internalPercentiles.wrvu90,
      market: surveyBenchmarks.wrvu90 || 0,
    },
  ];

  // Prepare data for TCC chart
  const tccData = [
    {
      percentile: '25th',
      internal: internalPercentiles.tcc25,
      market: surveyBenchmarks.tcc25 || 0,
    },
    {
      percentile: '50th',
      internal: internalPercentiles.tcc50,
      market: surveyBenchmarks.tcc50 || 0,
    },
    {
      percentile: '75th',
      internal: internalPercentiles.tcc75,
      market: surveyBenchmarks.tcc75 || 0,
    },
    {
      percentile: '90th',
      internal: internalPercentiles.tcc90,
      market: surveyBenchmarks.tcc90 || 0,
    },
  ];

  // Dynamic colors based on theme
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const axisColor = isDark ? '#9ca3af' : '#6b7280';
  const textColor = isDark ? '#f3f4f6' : '#111827';
  const internalColor = '#3b82f6'; // Blue for internal
  const marketColor = isDark ? '#64748b' : '#94a3b8'; // Gray for market
  const tooltipBg = isDark ? '#1f2937' : '#ffffff';
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb';
  const tooltipText = isDark ? '#f3f4f6' : '#111827';

  const formatWrvuTooltip = (value: number) => {
    return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const formatTccTooltip = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          Internal vs Market Comparison
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Visual comparison of percentile curves
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* wRVU Chart */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              wRVU Percentiles
            </h3>
            <div className="w-full h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={wrvuData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={gridColor}
                    opacity={isDark ? 0.5 : 1}
                  />
                  <XAxis
                    dataKey="percentile"
                    stroke={axisColor}
                    tick={{ fill: textColor, fontSize: 12 }}
                  />
                  <YAxis
                    stroke={axisColor}
                    tick={{ fill: textColor, fontSize: 12 }}
                    tickFormatter={(value) => value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      border: `1px solid ${tooltipBorder}`,
                      borderRadius: '8px',
                      color: tooltipText,
                    }}
                    formatter={(value: number) => formatWrvuTooltip(value)}
                  />
                  <Legend wrapperStyle={{ color: textColor }} iconType="line" />
                  <Line
                    type="monotone"
                    dataKey="internal"
                    stroke={internalColor}
                    strokeWidth={2.5}
                    name="Internal"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="market"
                    stroke={marketColor}
                    strokeWidth={2.5}
                    name="Market Survey"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TCC Chart */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              TCC Percentiles
            </h3>
            <div className="w-full h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tccData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={gridColor}
                    opacity={isDark ? 0.5 : 1}
                  />
                  <XAxis
                    dataKey="percentile"
                    stroke={axisColor}
                    tick={{ fill: textColor, fontSize: 12 }}
                  />
                  <YAxis
                    stroke={axisColor}
                    tick={{ fill: textColor, fontSize: 12 }}
                    tickFormatter={(value) =>
                      `$${(value / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      border: `1px solid ${tooltipBorder}`,
                      borderRadius: '8px',
                      color: tooltipText,
                    }}
                    formatter={(value: number) => formatTccTooltip(value)}
                  />
                  <Legend wrapperStyle={{ color: textColor }} iconType="line" />
                  <Line
                    type="monotone"
                    dataKey="internal"
                    stroke={internalColor}
                    strokeWidth={2.5}
                    name="Internal"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="market"
                    stroke={marketColor}
                    strokeWidth={2.5}
                    name="Market Survey"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}






















