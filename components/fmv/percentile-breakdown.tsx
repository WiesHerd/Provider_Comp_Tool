'use client';

import { PercentileChip } from '@/components/ui/percentile-chip';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

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
        <CardContent className="p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 sm:gap-8">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Percentile Rank
              </p>
              <div className="flex items-baseline gap-2 mb-4">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-gray-900 dark:text-white">
                  {percentile.toFixed(1)}
                </h2>
                <span className="text-lg sm:text-xl font-light text-gray-500 dark:text-gray-400 pb-1">
                  percentile
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <PositionIcon className="w-4 h-4 flex-shrink-0" />
                <span className="break-words">{positionInfo.text}</span>
              </div>
            </div>
            <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-gray-200 dark:border-gray-800 pt-6 sm:pt-0 sm:pl-8 flex-1 sm:flex-none min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 break-words">
                {valueLabel}
              </p>
              <div className="text-2xl sm:text-3xl font-light tracking-tight text-gray-900 dark:text-white break-words">
                {formatValue(value)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Position - Apple-style simple visualization */}
      {(p25 && p90) && (
        <Card className="border border-gray-200/80 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardContent className="p-4 md:p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight mb-1">
                  Market Position
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Your value compared to market benchmarks
                </p>
              </div>
              
              {/* Horizontal Percentile Bar - Apple-style */}
              <div className="space-y-4">
                {/* Progress bar with benchmarks */}
                <div className="relative">
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    {/* Background gradient zones */}
                    <div className="absolute inset-0 flex">
                      <div className="flex-1 bg-blue-100 dark:bg-blue-900/20"></div>
                      <div className="flex-1 bg-green-100 dark:bg-green-900/20"></div>
                      <div className="flex-1 bg-green-100 dark:bg-green-900/20"></div>
                      <div className="flex-1 bg-yellow-100 dark:bg-yellow-900/20"></div>
                      <div className="flex-1 bg-red-100 dark:bg-red-900/20"></div>
                    </div>
                    
                    {/* Benchmark markers */}
                    <div className="absolute inset-0 flex">
                      {p25 && (
                        <div className="absolute left-[25%] top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600"></div>
                      )}
                      {p50 && (
                        <div className="absolute left-[50%] top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600"></div>
                      )}
                      {p75 && (
                        <div className="absolute left-[75%] top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600"></div>
                      )}
                      {p90 && (
                        <div className="absolute left-[90%] top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600"></div>
                      )}
                    </div>
                    
                    {/* Your position indicator */}
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-primary rounded-full shadow-lg z-10"
                      style={{ left: `${Math.min(100, Math.max(0, percentile))}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white dark:border-gray-900 shadow-md"></div>
                    </div>
                  </div>
                  
                  {/* Percentile labels */}
                  <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>0th</span>
                    {p25 && <span>25th</span>}
                    {p50 && <span>50th</span>}
                    {p75 && <span>75th</span>}
                    {p90 && <span>90th</span>}
                    <span>100th</span>
                  </div>
                </div>
                
                {/* Your position card - Apple-style */}
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Your Position</div>
                      <div className="text-2xl font-light tracking-tight text-gray-900 dark:text-white">
                        {percentile.toFixed(1)}<span className="text-lg text-gray-500 dark:text-gray-400">th percentile</span>
                      </div>
                    </div>
                    <div className="text-right sm:text-left sm:border-l sm:border-gray-200 dark:sm:border-gray-700 sm:pl-4">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Your Value</div>
                      <div className="text-xl font-light tracking-tight text-gray-900 dark:text-white">
                        {formatValue(value)}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Benchmark values - Mobile-friendly grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {p25 && (
                    <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">25th</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatBenchmarkValue(p25)}
                      </div>
                    </div>
                  )}
                  {p50 && (
                    <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">50th</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatBenchmarkValue(p50)}
                      </div>
                    </div>
                  )}
                  {p75 && (
                    <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">75th</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatBenchmarkValue(p75)}
                      </div>
                    </div>
                  )}
                  {p90 && (
                    <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">90th</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatBenchmarkValue(p90)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
