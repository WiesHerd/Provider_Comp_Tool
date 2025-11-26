'use client';

import { TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

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


  const positionInfo = getPositionDescription();

  // Check if percentile is outside acceptable range
  const isBelow25th = percentile < 25;
  const isAbove90th = percentile >= 90;

  return (
    <div className="space-y-6">
      {/* Hero Section - Match call pay large number display style */}
      <div className="pb-6 border-b-2 border-gray-200 dark:border-gray-800">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              Percentile Rank
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {positionInfo.text}
            </div>
          </div>
          <div className={cn(
            "text-4xl sm:text-5xl font-light tracking-tight",
            "text-gray-900 dark:text-white"
          )}>
            {percentile.toFixed(1)}<span className="text-lg sm:text-xl text-gray-500 dark:text-gray-400">th</span>
          </div>
        </div>
      </div>

      {/* Value Display - Secondary metric */}
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-800">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {valueLabel}
          </span>
          <span className="text-base font-semibold text-gray-900 dark:text-white">
            {formatValue(value)}
          </span>
        </div>
      </div>

      {/* Alert Warnings - After market position */}
      {isBelow25th && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 pt-0.5">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Below 25th Percentile
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your value of <span className="font-medium text-gray-900 dark:text-white">{formatValue(value)}</span> is below the 25th percentile ({p25 ? formatBenchmarkValue(p25) : 'N/A'}). 
                  This may require additional documentation or justification for FMV compliance.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAbove90th && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 pt-0.5">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Above 90th Percentile
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your value of <span className="font-medium text-gray-900 dark:text-white">{formatValue(value)}</span> is above the 90th percentile ({p90 ? formatBenchmarkValue(p90) : 'N/A'}). 
                  This requires enhanced scrutiny and documentation for FMV compliance.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Market Position - Match call pay metric row pattern */}
      {(p25 && p90) && (
        <div className="space-y-6 border-t-2 border-gray-200 dark:border-gray-800 pt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Market Position</h3>
          <div className="space-y-3">
            {/* Progress bar with benchmarks */}
            <div className="relative pb-6">
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
            
            {/* Benchmark values - Match call pay metric row pattern */}
            {p25 && (
              <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  25th Percentile
                </span>
                <span className="text-base font-semibold text-gray-900 dark:text-white">
                  {formatBenchmarkValue(p25)}
                </span>
              </div>
            )}
            {p50 && (
              <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  50th Percentile
                </span>
                <span className="text-base font-semibold text-gray-900 dark:text-white">
                  {formatBenchmarkValue(p50)}
                </span>
              </div>
            )}
            {p75 && (
              <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  75th Percentile
                </span>
                <span className="text-base font-semibold text-gray-900 dark:text-white">
                  {formatBenchmarkValue(p75)}
                </span>
              </div>
            )}
            {p90 && (
              <div className="flex justify-between items-center py-2.5">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  90th Percentile
                </span>
                <span className="text-base font-semibold text-gray-900 dark:text-white">
                  {formatBenchmarkValue(p90)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
