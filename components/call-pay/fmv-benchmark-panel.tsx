'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';
import { NumberInput } from '@/components/ui/number-input';
import { Switch } from '@/components/ui/switch';
import { Tooltip } from '@/components/ui/tooltip';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CallPayBenchmarks } from '@/types/call-pay';
import { calculateRatePercentiles } from '@/lib/utils/call-pay-coverage';
import { PercentileChip } from '@/components/ui/percentile-chip';

interface FMVBenchmarkPanelProps {
  weekdayRate: number;
  weekendRate: number;
  holidayRate: number;
  benchmarks: CallPayBenchmarks;
  onBenchmarksChange: (benchmarks: CallPayBenchmarks) => void;
}

export function FMVBenchmarkPanel({
  weekdayRate,
  weekendRate,
  holidayRate,
  benchmarks,
  onBenchmarksChange,
}: FMVBenchmarkPanelProps) {
  // Expand by default if there are no benchmarks entered yet
  const [isExpanded, setIsExpanded] = useState(
    !benchmarks.weekday?.p50 && !benchmarks.weekend?.p50 && !benchmarks.holiday?.p50
  );
  
  // Percentage-based calculation state
  const [usePercentageBased, setUsePercentageBased] = useState(false);
  const [weekendUpliftPercent, setWeekendUpliftPercent] = useState(22);
  const [holidayUpliftPercent, setHolidayUpliftPercent] = useState(22.5);

  const updateBenchmark = (
    period: 'weekday' | 'weekend' | 'holiday',
    percentile: 'p25' | 'p50' | 'p75' | 'p90',
    value: number
  ) => {
    const periodBenchmarks = benchmarks[period] || {};
    const updatedBenchmarks = {
      ...benchmarks,
      [period]: {
        ...periodBenchmarks,
        [percentile]: value,
      },
    };
    
    // If percentage-based and updating weekday, recalculate weekend/holiday
    if (usePercentageBased && period === 'weekday' && value > 0) {
      const weekdayValue = value;
      // Update weekend benchmarks
      updatedBenchmarks.weekend = {
        ...updatedBenchmarks.weekend,
        [percentile]: weekdayValue * (1 + weekendUpliftPercent / 100),
      };
      // Update holiday benchmarks
      updatedBenchmarks.holiday = {
        ...updatedBenchmarks.holiday,
        [percentile]: weekdayValue * (1 + holidayUpliftPercent / 100),
      };
    }
    
    onBenchmarksChange(updatedBenchmarks);
  };

  // Helper function to recalculate weekend/holiday benchmarks from weekday
  const recalculateFromWeekday = (weekendPercent: number, holidayPercent: number) => {
    if (!usePercentageBased || !benchmarks.weekday) return;
    
    const updatedBenchmarks = { ...benchmarks };
    
    // Recalculate all weekend percentiles
    const weekendBenchmarks: any = {};
    if (benchmarks.weekday.p25 !== undefined && benchmarks.weekday.p25 > 0) {
      weekendBenchmarks.p25 = benchmarks.weekday.p25 * (1 + weekendPercent / 100);
    }
    if (benchmarks.weekday.p50 !== undefined && benchmarks.weekday.p50 > 0) {
      weekendBenchmarks.p50 = benchmarks.weekday.p50 * (1 + weekendPercent / 100);
    }
    if (benchmarks.weekday.p75 !== undefined && benchmarks.weekday.p75 > 0) {
      weekendBenchmarks.p75 = benchmarks.weekday.p75 * (1 + weekendPercent / 100);
    }
    if (benchmarks.weekday.p90 !== undefined && benchmarks.weekday.p90 > 0) {
      weekendBenchmarks.p90 = benchmarks.weekday.p90 * (1 + weekendPercent / 100);
    }
    
    // Recalculate all holiday percentiles
    const holidayBenchmarks: any = {};
    if (benchmarks.weekday.p25 !== undefined && benchmarks.weekday.p25 > 0) {
      holidayBenchmarks.p25 = benchmarks.weekday.p25 * (1 + holidayPercent / 100);
    }
    if (benchmarks.weekday.p50 !== undefined && benchmarks.weekday.p50 > 0) {
      holidayBenchmarks.p50 = benchmarks.weekday.p50 * (1 + holidayPercent / 100);
    }
    if (benchmarks.weekday.p75 !== undefined && benchmarks.weekday.p75 > 0) {
      holidayBenchmarks.p75 = benchmarks.weekday.p75 * (1 + holidayPercent / 100);
    }
    if (benchmarks.weekday.p90 !== undefined && benchmarks.weekday.p90 > 0) {
      holidayBenchmarks.p90 = benchmarks.weekday.p90 * (1 + holidayPercent / 100);
    }
    
    updatedBenchmarks.weekend = weekendBenchmarks;
    updatedBenchmarks.holiday = holidayBenchmarks;
    
    onBenchmarksChange(updatedBenchmarks);
  };


  const percentiles = calculateRatePercentiles(
    weekdayRate,
    weekendRate,
    holidayRate,
    benchmarks
  );

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 25 && percentile <= 75) return 'green';
    if (percentile > 75 && percentile <= 90) return 'yellow';
    if (percentile > 90) return 'red';
    return 'gray';
  };

  // Helper to get placeholders based on rate type
  const getWeekdayPlaceholder = (percentile: 'p25' | 'p50' | 'p75' | 'p90'): string => {
    const placeholders = {
      p25: weekdayRate > 0 ? Math.round(weekdayRate * 0.8).toString() : '400',
      p50: weekdayRate > 0 ? Math.round(weekdayRate).toString() : '500',
      p75: weekdayRate > 0 ? Math.round(weekdayRate * 1.2).toString() : '600',
      p90: weekdayRate > 0 ? Math.round(weekdayRate * 1.4).toString() : '700',
    };
    return placeholders[percentile];
  };

  const getWeekendPlaceholder = (percentile: 'p25' | 'p50' | 'p75' | 'p90'): string => {
    const placeholders = {
      p25: weekendRate > 0 ? Math.round(weekendRate * 0.8).toString() : '500',
      p50: weekendRate > 0 ? Math.round(weekendRate).toString() : '600',
      p75: weekendRate > 0 ? Math.round(weekendRate * 1.2).toString() : '700',
      p90: weekendRate > 0 ? Math.round(weekendRate * 1.4).toString() : '800',
    };
    return placeholders[percentile];
  };

  const getHolidayPlaceholder = (percentile: 'p25' | 'p50' | 'p75' | 'p90'): string => {
    const placeholders = {
      p25: holidayRate > 0 ? Math.round(holidayRate * 0.8).toString() : '600',
      p50: holidayRate > 0 ? Math.round(holidayRate).toString() : '800',
      p75: holidayRate > 0 ? Math.round(holidayRate * 1.2).toString() : '1000',
      p90: holidayRate > 0 ? Math.round(holidayRate * 1.4).toString() : '1200',
    };
    return placeholders[percentile];
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between"
        >
          <CardTitle className="text-lg font-semibold">
            FMV Benchmark Analysis
          </CardTitle>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Enter market benchmark data from MGMA, SullivanCotter, or other survey sources to compare your rates.
          </p>
          
          {/* Calculate from Base Rate Toggle */}
          <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700 mb-4">
            <Label className="text-sm font-semibold">
              Calculate from Base Rate
            </Label>
            <div className="flex items-center gap-2">
              <Switch
                // @ts-ignore
                checked={usePercentageBased}
                onCheckedChange={(checked: boolean) => {
                    setUsePercentageBased(checked);
                    if (checked && benchmarks.weekday) {
                      // Auto-calculate weekend/holiday from weekday benchmarks
                      const updatedBenchmarks = { ...benchmarks };
                      
                      // Calculate all weekend percentiles
                      const weekendBenchmarks: any = {};
                      if (benchmarks.weekday.p25 !== undefined && benchmarks.weekday.p25 > 0) {
                        weekendBenchmarks.p25 = benchmarks.weekday.p25 * (1 + weekendUpliftPercent / 100);
                      }
                      if (benchmarks.weekday.p50 !== undefined && benchmarks.weekday.p50 > 0) {
                        weekendBenchmarks.p50 = benchmarks.weekday.p50 * (1 + weekendUpliftPercent / 100);
                      }
                      if (benchmarks.weekday.p75 !== undefined && benchmarks.weekday.p75 > 0) {
                        weekendBenchmarks.p75 = benchmarks.weekday.p75 * (1 + weekendUpliftPercent / 100);
                      }
                      if (benchmarks.weekday.p90 !== undefined && benchmarks.weekday.p90 > 0) {
                        weekendBenchmarks.p90 = benchmarks.weekday.p90 * (1 + weekendUpliftPercent / 100);
                      }
                      
                      // Calculate all holiday percentiles
                      const holidayBenchmarks: any = {};
                      if (benchmarks.weekday.p25 !== undefined && benchmarks.weekday.p25 > 0) {
                        holidayBenchmarks.p25 = benchmarks.weekday.p25 * (1 + holidayUpliftPercent / 100);
                      }
                      if (benchmarks.weekday.p50 !== undefined && benchmarks.weekday.p50 > 0) {
                        holidayBenchmarks.p50 = benchmarks.weekday.p50 * (1 + holidayUpliftPercent / 100);
                      }
                      if (benchmarks.weekday.p75 !== undefined && benchmarks.weekday.p75 > 0) {
                        holidayBenchmarks.p75 = benchmarks.weekday.p75 * (1 + holidayUpliftPercent / 100);
                      }
                      if (benchmarks.weekday.p90 !== undefined && benchmarks.weekday.p90 > 0) {
                        holidayBenchmarks.p90 = benchmarks.weekday.p90 * (1 + holidayUpliftPercent / 100);
                      }
                      
                      updatedBenchmarks.weekend = weekendBenchmarks;
                      updatedBenchmarks.holiday = holidayBenchmarks;
                      onBenchmarksChange(updatedBenchmarks);
                    } else if (!checked) {
                      // When disabling, clear weekend/holiday benchmarks
                      onBenchmarksChange({
                        ...benchmarks,
                        weekend: undefined,
                        holiday: undefined,
                      });
                    }
                }}
              />
              <Tooltip 
                content={usePercentageBased 
                  ? "Weekend and holiday benchmarks are automatically calculated from weekday benchmark using percentage uplifts. Tap to switch to manual entry." 
                  : "Enter weekend and holiday benchmarks manually. Tap to automatically calculate from weekday benchmark using percentage uplifts."}
                side="left"
              >
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 cursor-help">ℹ️</span>
              </Tooltip>
            </div>
          </div>
          
          {/* Benchmark Inputs */}
          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                Weekday Rate Benchmarks
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    25th Percentile
                  </Label>
                  <CurrencyInput
                    value={benchmarks.weekday?.p25}
                    onChange={(value) =>
                      updateBenchmark('weekday', 'p25', value)
                    }
                    placeholder={getWeekdayPlaceholder('p25')}
                    showDecimals={false}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    50th Percentile
                  </Label>
                  <CurrencyInput
                    value={benchmarks.weekday?.p50}
                    onChange={(value) =>
                      updateBenchmark('weekday', 'p50', value)
                    }
                    placeholder={getWeekdayPlaceholder('p50')}
                    showDecimals={false}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    75th Percentile
                  </Label>
                  <CurrencyInput
                    value={benchmarks.weekday?.p75}
                    onChange={(value) =>
                      updateBenchmark('weekday', 'p75', value)
                    }
                    placeholder={getWeekdayPlaceholder('p75')}
                    showDecimals={false}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    90th Percentile
                  </Label>
                  <CurrencyInput
                    value={benchmarks.weekday?.p90}
                    onChange={(value) =>
                      updateBenchmark('weekday', 'p90', value)
                    }
                    placeholder={getWeekdayPlaceholder('p90')}
                    showDecimals={false}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  Weekend Rate Benchmarks
                </Label>
                {usePercentageBased && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      ({weekendUpliftPercent}% above base)
                    </span>
                  </div>
                )}
              </div>
              {usePercentageBased && (
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    Weekend Uplift:
                  </Label>
                  <div className="relative flex-1 max-w-[120px]">
                    <NumberInput
                      value={weekendUpliftPercent}
                      onChange={(value) => {
                        setWeekendUpliftPercent(value);
                        recalculateFromWeekday(value, holidayUpliftPercent);
                      }}
                      min={0}
                      max={100}
                      step={0.1}
                      placeholder="22"
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">%</span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    25th Percentile
                  </Label>
                  <CurrencyInput
                    value={benchmarks.weekend?.p25}
                    onChange={(value) =>
                      updateBenchmark('weekend', 'p25', value)
                    }
                    placeholder={getWeekendPlaceholder('p25')}
                    showDecimals={false}
                    disabled={usePercentageBased}
                    className={usePercentageBased ? 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:text-gray-900 dark:disabled:text-gray-100 disabled:opacity-100 pl-[3.5rem]' : ''}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    50th Percentile
                  </Label>
                  <CurrencyInput
                    value={benchmarks.weekend?.p50}
                    onChange={(value) =>
                      updateBenchmark('weekend', 'p50', value)
                    }
                    placeholder={getWeekendPlaceholder('p50')}
                    showDecimals={false}
                    disabled={usePercentageBased}
                    className={usePercentageBased ? 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:text-gray-900 dark:disabled:text-gray-100 disabled:opacity-100 pl-[3.5rem]' : ''}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    75th Percentile
                  </Label>
                  <CurrencyInput
                    value={benchmarks.weekend?.p75}
                    onChange={(value) =>
                      updateBenchmark('weekend', 'p75', value)
                    }
                    placeholder={getWeekendPlaceholder('p75')}
                    showDecimals={false}
                    disabled={usePercentageBased}
                    className={usePercentageBased ? 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:text-gray-900 dark:disabled:text-gray-100 disabled:opacity-100 pl-[3.5rem]' : ''}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    90th Percentile
                  </Label>
                  <CurrencyInput
                    value={benchmarks.weekend?.p90}
                    onChange={(value) =>
                      updateBenchmark('weekend', 'p90', value)
                    }
                    placeholder={getWeekendPlaceholder('p90')}
                    showDecimals={false}
                    disabled={usePercentageBased}
                    className={usePercentageBased ? 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:text-gray-900 dark:disabled:text-gray-100 disabled:opacity-100 pl-[3.5rem]' : ''}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  Holiday Rate Benchmarks
                </Label>
                {usePercentageBased && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      ({holidayUpliftPercent}% above base)
                    </span>
                  </div>
                )}
              </div>
              {usePercentageBased && (
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    Holiday Uplift:
                  </Label>
                  <div className="relative flex-1 max-w-[120px]">
                    <NumberInput
                      value={holidayUpliftPercent}
                      onChange={(value) => {
                        setHolidayUpliftPercent(value);
                        recalculateFromWeekday(weekendUpliftPercent, value);
                      }}
                      min={0}
                      max={100}
                      step={0.1}
                      placeholder="22.5"
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">%</span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    25th Percentile
                  </Label>
                  <CurrencyInput
                    value={benchmarks.holiday?.p25}
                    onChange={(value) =>
                      updateBenchmark('holiday', 'p25', value)
                    }
                    placeholder={getHolidayPlaceholder('p25')}
                    showDecimals={false}
                    disabled={usePercentageBased}
                    className={usePercentageBased ? 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:text-gray-900 dark:disabled:text-gray-100 disabled:opacity-100 pl-[3.5rem]' : ''}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    50th Percentile
                  </Label>
                  <CurrencyInput
                    value={benchmarks.holiday?.p50}
                    onChange={(value) =>
                      updateBenchmark('holiday', 'p50', value)
                    }
                    placeholder={getHolidayPlaceholder('p50')}
                    showDecimals={false}
                    disabled={usePercentageBased}
                    className={usePercentageBased ? 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:text-gray-900 dark:disabled:text-gray-100 disabled:opacity-100 pl-[3.5rem]' : ''}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    75th Percentile
                  </Label>
                  <CurrencyInput
                    value={benchmarks.holiday?.p75}
                    onChange={(value) =>
                      updateBenchmark('holiday', 'p75', value)
                    }
                    placeholder={getHolidayPlaceholder('p75')}
                    showDecimals={false}
                    disabled={usePercentageBased}
                    className={usePercentageBased ? 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:text-gray-900 dark:disabled:text-gray-100 disabled:opacity-100 pl-[3.5rem]' : ''}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    90th Percentile
                  </Label>
                  <CurrencyInput
                    value={benchmarks.holiday?.p90}
                    onChange={(value) =>
                      updateBenchmark('holiday', 'p90', value)
                    }
                    placeholder={getHolidayPlaceholder('p90')}
                    showDecimals={false}
                    disabled={usePercentageBased}
                    className={usePercentageBased ? 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:text-gray-900 dark:disabled:text-gray-100 disabled:opacity-100 pl-[3.5rem]' : ''}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Percentile Results */}
          {(weekdayRate > 0 || weekendRate > 0 || holidayRate > 0) && (
            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Label className="text-sm font-semibold">
                Modeled Rate Percentiles
              </Label>
              <div className="space-y-2">
                {weekdayRate > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Weekday: ${weekdayRate.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <PercentileChip
                      percentile={percentiles.weekdayPercentile}
                      className="text-xs"
                    />
                  </div>
                )}
                {weekendRate > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Weekend: ${weekendRate.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <PercentileChip
                      percentile={percentiles.weekendPercentile}
                      className="text-xs"
                    />
                  </div>
                )}
                {holidayRate > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Holiday: ${holidayRate.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <PercentileChip
                      percentile={percentiles.holidayPercentile}
                      className="text-xs"
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-2">
                Indicative only – confirm against current market survey data.
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

