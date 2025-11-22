'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BenchmarkInputs } from '@/components/fmv/benchmark-inputs';
import { PercentileBreakdown } from '@/components/fmv/percentile-breakdown';
import { FMVSaveButton } from '@/components/fmv/fmv-save-button';
import { SpecialtyInput } from '@/components/fmv/specialty-input';
import { MarketDataSaveButton } from '@/components/fmv/market-data-save-button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { MarketBenchmarks } from '@/types';
import { calculateCFPercentile } from '@/lib/utils/percentile';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CFCalculatorPage() {
  const [specialty, setSpecialty] = useState<string>('');
  const [cfValue, setCfValue] = useState<number>(0);
  const [marketBenchmarks, setMarketBenchmarks] = useState<MarketBenchmarks>({});

  const percentile = calculateCFPercentile(cfValue, marketBenchmarks);

  const formatValue = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/wRVU`;
  };

  const formatBenchmark = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Back Button */}
      <Link href="/fmv-calculator">
        <Button variant="outline" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to FMV Calculator
        </Button>
      </Link>

      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          CF Calculator
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Calculate percentile for Conversion Factor ($/wRVU)
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Input</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <SpecialtyInput
            metricType="cf"
            onSpecialtyChange={setSpecialty}
            onMarketDataLoad={setMarketBenchmarks}
          />
          
          <div className="space-y-2">
            <Label className="text-base font-semibold">Conversion Factor ($/wRVU)</Label>
            <CurrencyInput
              value={cfValue}
              onChange={setCfValue}
              placeholder="Enter CF amount"
              min={0}
              showDecimals={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Market Data Section */}
      <Card>
        <CardHeader>
          <CardTitle>Market Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <BenchmarkInputs
            benchmarks={marketBenchmarks}
            onBenchmarksChange={setMarketBenchmarks}
            type="cf"
          />
          
          <MarketDataSaveButton
            specialty={specialty}
            metricType="cf"
            benchmarks={marketBenchmarks}
          />
        </CardContent>
      </Card>

      {/* Results Section */}
      {cfValue > 0 && (
        <>
          <PercentileBreakdown
            value={cfValue}
            percentile={percentile}
            benchmarks={{
              p25: marketBenchmarks.cf25,
              p50: marketBenchmarks.cf50,
              p75: marketBenchmarks.cf75,
              p90: marketBenchmarks.cf90,
            }}
            formatValue={formatValue}
            formatBenchmark={formatBenchmark}
            valueLabel="Your CF"
          />

          {/* Save Button */}
          <div className="flex justify-center">
            <FMVSaveButton
              metricType="cf"
              value={cfValue}
              benchmarks={marketBenchmarks}
              percentile={percentile}
            />
          </div>
        </>
      )}
    </div>
  );
}

