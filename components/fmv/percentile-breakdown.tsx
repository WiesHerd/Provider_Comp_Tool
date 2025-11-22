'use client';

import { PercentileChip } from '@/components/ui/percentile-chip';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      {/* Hero Section - Large Percentile Display */}
      <Card className="overflow-hidden border-2 border-gray-200 dark:border-gray-800">
        <div className={`bg-gradient-to-br ${getPercentileColor()} p-6 text-white shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium opacity-90 mb-1">Your Percentile Rank</p>
              <h2 className="text-5xl font-bold">{percentile.toFixed(1)}</h2>
              <p className="text-lg opacity-90 mt-1">percentile</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{formatValue(value)}</div>
              <p className="text-sm opacity-90 mt-1">{valueLabel}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/20">
            <PositionIcon className="w-5 h-5" />
            <span className="font-medium">{positionInfo.text}</span>
          </div>
        </div>
      </Card>

      {/* Visual Distribution Chart */}
      {(p25 && p90) && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Market Distribution
              </h3>
              
              {/* Progress Bar with Gradient */}
              <div className="relative">
                <div className="h-16 bg-gradient-to-r from-blue-200 via-green-200 via-yellow-200 to-red-200 dark:from-blue-900/40 dark:via-green-900/40 dark:via-yellow-900/40 dark:to-red-900/40 rounded-xl overflow-hidden relative shadow-inner">
                  {/* Benchmark markers */}
                  {p25 && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-gray-600 dark:bg-gray-400 z-10"
                      style={{ left: `${getBenchmarkPosition(p25)}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        25th
                      </div>
                    </div>
                  )}
                  {p50 && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-gray-600 dark:bg-gray-400 z-10"
                      style={{ left: `${getBenchmarkPosition(p50)}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        50th
                      </div>
                    </div>
                  )}
                  {p75 && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-gray-600 dark:bg-gray-400 z-10"
                      style={{ left: `${getBenchmarkPosition(p75)}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        75th
                      </div>
                    </div>
                  )}
                  {p90 && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-gray-600 dark:bg-gray-400 z-10"
                      style={{ left: `${getBenchmarkPosition(p90)}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        90th
                      </div>
                    </div>
                  )}
                  
                  {/* Your value indicator */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white dark:bg-gray-900 shadow-lg z-20 rounded-full"
                    style={{ left: `${Math.min(Math.max(getProgressBarValue(), 0), 100)}%` }}
                  >
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                      <div className="bg-white dark:bg-gray-900 px-2 py-1 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="text-xs font-bold text-gray-900 dark:text-white whitespace-nowrap">
                          You
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
