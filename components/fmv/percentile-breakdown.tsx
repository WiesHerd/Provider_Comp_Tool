'use client';

import { PercentileChip } from '@/components/ui/percentile-chip';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Dot } from 'recharts';

interface PercentileBreakdownProps {
  value: number;
  percentile: number;
  benchmarks: {
    p25?: number;
    p50?: number;
    p75?: number;
    p90?: number;
  };
  formatValue: (value: number) => string;
  formatBenchmark?: (value: number) => string;
  valueLabel: string;
}

export function PercentileBreakdown({
  value,
  percentile,
  benchmarks,
  formatValue,
  formatBenchmark,
  valueLabel,
}: PercentileBreakdownProps) {
  const formatBenchmarkValue = formatBenchmark || formatValue;
  const { p25, p50, p75, p90 } = benchmarks;

  const getPositionDescription = () => {
    if (!p25 || value < p25) {
      return { text: 'Below market range', icon: TrendingDown, color: 'text-blue-600 dark:text-blue-400' };
    }
    if (p25 && p50 && value >= p25 && value < p50) {
      return { text: 'Lower market range', icon: Minus, color: 'text-green-600 dark:text-green-400' };
    }
    if (p50 && p75 && value >= p50 && value < p75) {
      return { text: 'Mid market range', icon: CheckCircle2, color: 'text-green-600 dark:text-green-400' };
    }
    if (p75 && p90 && value >= p75 && value < p90) {
      return { text: 'Upper market range', icon: TrendingUp, color: 'text-yellow-600 dark:text-yellow-400' };
    }
    if (p90 && value >= p90) {
      return { text: 'Above market range', icon: AlertTriangle, color: 'text-red-600 dark:text-red-400' };
    }
    return { text: 'Insufficient benchmark data', icon: Minus, color: 'text-gray-600 dark:text-gray-400' };
  };

  const getProgressBarValue = () => {
    if (!p25 || !p90) return 0;
    if (value < p25) return 0;
    if (value > p90) return 100;
    return ((value - p25) / (p90 - p25)) * 100;
  };

  const getBenchmarkPosition = (benchmark: number | undefined) => {
    if (!p25 || !p90 || !benchmark) return 0;
    return ((benchmark - p25) / (p90 - p25)) * 100;
  };

  const getPercentileColor = () => {
    if (percentile < 25) return 'from-blue-500 to-blue-600';
    if (percentile < 75) return 'from-green-500 to-green-600';
    if (percentile < 90) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const positionInfo = getPositionDescription();
  const PositionIcon = positionInfo.icon;

  // Check if percentile is outside acceptable range
  const isBelow25th = percentile < 25;
  const isAbove90th = percentile >= 90;

  return (
    <div className="space-y-5">
      {/* Alert Warnings - Apple-style subtle design */}
      {isBelow25th && (
        <div className="rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/50 backdrop-blur-sm">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="flex-1 pt-0.5">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Below 25th Percentile
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Your value of <span className="font-medium text-gray-900 dark:text-gray-100">{formatValue(value)}</span> is below the 25th percentile ({p25 ? formatBenchmarkValue(p25) : 'N/A'}). 
                  This may require additional documentation or justification for FMV compliance.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAbove90th && (
        <div className="rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50 backdrop-blur-sm">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <div className="flex-1 pt-0.5">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Above 90th Percentile
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Your value of <span className="font-medium text-gray-900 dark:text-gray-100">{formatValue(value)}</span> is above the 90th percentile ({p90 ? formatBenchmarkValue(p90) : 'N/A'}). 
                  This requires enhanced scrutiny and documentation for FMV compliance.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section - Apple-style clean design */}
      <Card className="overflow-hidden border border-gray-200/80 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Percentile Rank
              </p>
              <div className="flex items-baseline gap-2 mb-4">
                <h2 className="text-6xl font-light tracking-tight text-gray-900 dark:text-white">
                  {percentile.toFixed(1)}
                </h2>
                <span className="text-xl font-light text-gray-500 dark:text-gray-400 pb-1">
                  percentile
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <PositionIcon className="w-4 h-4" />
                <span>{positionInfo.text}</span>
              </div>
            </div>
            <div className="text-right border-l border-gray-200 dark:border-gray-800 pl-8">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {valueLabel}
              </p>
              <div className="text-3xl font-light tracking-tight text-gray-900 dark:text-white">
                {formatValue(value)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Distribution Chart - Line Chart with Market Data */}
      {(p25 && p90) && (
        <Card className="border border-gray-200/80 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
                  Market Distribution
                </h3>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Your Value: <span className="font-semibold text-gray-900 dark:text-white">{formatValue(value)}</span>
                </div>
              </div>
              
              {/* Line Chart showing percentile distribution */}
              {(() => {
                // Create data points for the line chart - only benchmark points for the line
                const benchmarkData = [];
                if (p25) benchmarkData.push({ percentile: 25, value: p25 });
                if (p50) benchmarkData.push({ percentile: 50, value: p50 });
                if (p75) benchmarkData.push({ percentile: 75, value: p75 });
                if (p90) benchmarkData.push({ percentile: 90, value: p90 });
                
                // Sort by percentile
                benchmarkData.sort((a, b) => a.percentile - b.percentile);
                
                // Calculate domain for Y-axis (add some padding)
                const allValues = [...benchmarkData.map(d => d.value), value].filter(v => v > 0);
                const minValue = Math.max(0, Math.min(...allValues) * 0.85);
                const maxValue = Math.max(...allValues) * 1.15;
                
                // Custom dot component for user's value
                const CustomUserDot = (props: any) => {
                  const { cx, cy } = props;
                  return (
                    <g>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={10}
                        fill="#00C805"
                        stroke="#fff"
                        strokeWidth={3}
                        className="drop-shadow-lg"
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill="#fff"
                      />
                    </g>
                  );
                };
                
                // Custom dot component for benchmarks
                const CustomBenchmarkDot = (props: any) => {
                  const { cx, cy } = props;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill="#6b7280"
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  );
                };
                
                return (
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={benchmarkData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                        <XAxis 
                          dataKey="percentile" 
                          type="number"
                          domain={[0, 100]}
                          tickFormatter={(val) => `${val}th`}
                          stroke="#6b7280"
                          className="text-xs"
                          label={{ value: 'Percentile', position: 'insideBottom', offset: -5, className: 'text-xs fill-gray-500' }}
                        />
                        <YAxis 
                          domain={[minValue, maxValue]}
                          tickFormatter={(val) => formatBenchmarkValue(val)}
                          stroke="#6b7280"
                          className="text-xs"
                          label={{ value: 'Value', angle: -90, position: 'insideLeft', className: 'text-xs fill-gray-500' }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {data.percentile}th Percentile
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {formatBenchmarkValue(data.value)}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        {/* Market distribution line connecting benchmarks */}
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#94a3b8"
                          strokeWidth={2.5}
                          dot={<CustomBenchmarkDot />}
                          activeDot={{ r: 7, fill: '#94a3b8', strokeWidth: 2, stroke: '#fff' }}
                        />
                        {/* User's value as a reference line and point */}
                        <ReferenceLine 
                          x={percentile} 
                          stroke="#00C805" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          opacity={0.4}
                          label={{ value: `You: ${formatValue(value)}`, position: 'top', fill: '#00C805', fontSize: 12, fontWeight: 'bold' }}
                        />
                        {/* User's value point overlay */}
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="transparent"
                          dot={<CustomUserDot />}
                          data={[{ percentile: percentile, value: value }]}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    
                    {/* Legend with value always visible */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-6 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-0.5 bg-gray-400"></div>
                          <span className="text-gray-600 dark:text-gray-400">Market Benchmarks</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-primary"></div>
                          <span className="text-gray-900 dark:text-white font-medium">Your Value</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Current Value</div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                          {formatValue(value)}
                        </div>
                        <div className="text-xs text-primary mt-0.5">
                          {percentile.toFixed(1)}th percentile
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
