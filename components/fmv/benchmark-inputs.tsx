'use client';

import { MarketBenchmarks } from '@/types';
import { CurrencyInput } from '@/components/ui/currency-input';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';

interface BenchmarkInputsProps {
  benchmarks: MarketBenchmarks;
  onBenchmarksChange: (benchmarks: MarketBenchmarks) => void;
  type: 'tcc' | 'cf' | 'wrvu';
}

export function BenchmarkInputs({ benchmarks, onBenchmarksChange, type }: BenchmarkInputsProps) {
  const isCurrency = type === 'tcc' || type === 'cf';
  const isTCC = type === 'tcc';
  const isCF = type === 'cf';

  const updateBenchmark = (key: keyof MarketBenchmarks, value: number) => {
    onBenchmarksChange({ ...benchmarks, [key]: value });
  };

  const getLabel = () => {
    if (type === 'tcc') return 'TCC Benchmarks';
    if (type === 'cf') return 'CF Benchmarks';
    return 'wRVU Benchmarks';
  };

  const getPlaceholder = (percentile: '25' | '50' | '75' | '90') => {
    if (isTCC) {
      const examples = { '25': '100000', '50': '150000', '75': '200000', '90': '300000' };
      return examples[percentile];
    }
    if (isCF) {
      const examples = { '25': '30.00', '50': '40.00', '75': '50.00', '90': '70.00' };
      return examples[percentile];
    }
    return '';
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800">
        <Label className="text-base font-semibold mb-0">{getLabel()}</Label>
      </div>

      <div className="p-4 space-y-4 bg-white dark:bg-gray-900">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">25th Percentile</Label>
              {isCurrency ? (
                <CurrencyInput
                  value={benchmarks[`${type}25` as keyof MarketBenchmarks] as number}
                  onChange={(value) => updateBenchmark(`${type}25` as keyof MarketBenchmarks, value)}
                  placeholder={getPlaceholder('25')}
                  showDecimals={isCF}
                />
              ) : (
                <NumberInput
                  value={benchmarks[`${type}25` as keyof MarketBenchmarks] as number}
                  onChange={(value) => updateBenchmark(`${type}25` as keyof MarketBenchmarks, value)}
                  placeholder={getPlaceholder('25')}
                />
              )}
            </div>
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">50th Percentile</Label>
              {isCurrency ? (
                <CurrencyInput
                  value={benchmarks[`${type}50` as keyof MarketBenchmarks] as number}
                  onChange={(value) => updateBenchmark(`${type}50` as keyof MarketBenchmarks, value)}
                  placeholder={getPlaceholder('50')}
                  showDecimals={isCF}
                />
              ) : (
                <NumberInput
                  value={benchmarks[`${type}50` as keyof MarketBenchmarks] as number}
                  onChange={(value) => updateBenchmark(`${type}50` as keyof MarketBenchmarks, value)}
                  placeholder={getPlaceholder('50')}
                />
              )}
            </div>
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">75th Percentile</Label>
              {isCurrency ? (
                <CurrencyInput
                  value={benchmarks[`${type}75` as keyof MarketBenchmarks] as number}
                  onChange={(value) => updateBenchmark(`${type}75` as keyof MarketBenchmarks, value)}
                  placeholder={getPlaceholder('75')}
                  showDecimals={isCF}
                />
              ) : (
                <NumberInput
                  value={benchmarks[`${type}75` as keyof MarketBenchmarks] as number}
                  onChange={(value) => updateBenchmark(`${type}75` as keyof MarketBenchmarks, value)}
                  placeholder={getPlaceholder('75')}
                />
              )}
            </div>
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">90th Percentile</Label>
              {isCurrency ? (
                <CurrencyInput
                  value={benchmarks[`${type}90` as keyof MarketBenchmarks] as number}
                  onChange={(value) => updateBenchmark(`${type}90` as keyof MarketBenchmarks, value)}
                  placeholder={getPlaceholder('90')}
                  showDecimals={isCF}
                />
              ) : (
                <NumberInput
                  value={benchmarks[`${type}90` as keyof MarketBenchmarks] as number}
                  onChange={(value) => updateBenchmark(`${type}90` as keyof MarketBenchmarks, value)}
                  placeholder={getPlaceholder('90')}
                />
              )}
            </div>
          </div>
        </div>
    </div>
  );
}

