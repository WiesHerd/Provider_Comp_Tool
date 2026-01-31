'use client';

import { MarketBenchmarks } from '@/types';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';

interface BenchmarkInputsProps {
  benchmarks: MarketBenchmarks;
  onBenchmarksChange: (benchmarks: MarketBenchmarks) => void;
  type: 'wrvu' | 'tcc' | 'cf';
}

export function BenchmarkInputs({
  benchmarks,
  onBenchmarksChange,
  type,
}: BenchmarkInputsProps) {
  const getLabel = () => {
    switch (type) {
      case 'wrvu':
        return 'wRVU';
      case 'tcc':
        return 'TCC';
      case 'cf':
        return 'CF';
    }
  };

  const getValue = (percentile: '25' | '50' | '75' | '90') => {
    const key = `${type}${percentile}` as keyof MarketBenchmarks;
    return benchmarks[key] ?? 0;
  };

  const setValue = (percentile: '25' | '50' | '75' | '90', value: number) => {
    const key = `${type}${percentile}` as keyof MarketBenchmarks;
    onBenchmarksChange({
      ...benchmarks,
      [key]: value,
    });
  };

  const label = getLabel();

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">{label} Percentiles</Label>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">25th</Label>
          <CurrencyInput
            value={getValue('25')}
            onChange={(value) => setValue('25', value)}
            placeholder="0"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">50th (Median)</Label>
          <CurrencyInput
            value={getValue('50')}
            onChange={(value) => setValue('50', value)}
            placeholder="0"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">75th</Label>
          <CurrencyInput
            value={getValue('75')}
            onChange={(value) => setValue('75', value)}
            placeholder="0"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">90th</Label>
          <CurrencyInput
            value={getValue('90')}
            onChange={(value) => setValue('90', value)}
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
}
