'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BenchmarkInputs } from '@/components/fmv/benchmark-inputs';
import { PercentileBreakdown } from '@/components/fmv/percentile-breakdown';
import { FMVSaveButton } from '@/components/fmv/fmv-save-button';
import { SpecialtyInput } from '@/components/fmv/specialty-input';
import { MarketDataSaveButton } from '@/components/fmv/market-data-save-button';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { MarketBenchmarks } from '@/types';
import { calculateWRVUPercentile } from '@/lib/utils/percentile';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function WRVUCalculatorPage() {
  const [specialty, setSpecialty] = useState<string>('');
  const [wrvuValue, setWrvuValue] = useState<number>(0);
  const [marketBenchmarks, setMarketBenchmarks] = useState<MarketBenchmarks>({});

  const percentile = calculateWRVUPercentile(wrvuValue, marketBenchmarks);

  const formatValue = (value: number) => {
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
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
          wRVU Calculator
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Calculate percentile for Work Relative Value Units
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Input</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <SpecialtyInput
            metricType="wrvu"
            onSpecialtyChange={setSpecialty}
            onMarketDataLoad={setMarketBenchmarks}
          />
          
          <div className="space-y-2">
            <Label className="text-base font-semibold">Annual wRVUs</Label>
            <NumberInput
              value={wrvuValue}
              onChange={setWrvuValue}
              placeholder="Enter annual wRVUs"
              min={0}
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
            type="wrvu"
          />
          
          <MarketDataSaveButton
            specialty={specialty}
            metricType="wrvu"
            benchmarks={marketBenchmarks}
          />
        </CardContent>
      </Card>

      {/* Results Section */}
      {wrvuValue > 0 && (
        <>
          <PercentileBreakdown
            value={wrvuValue}
            percentile={percentile}
            benchmarks={{
              p25: marketBenchmarks.wrvu25,
              p50: marketBenchmarks.wrvu50,
              p75: marketBenchmarks.wrvu75,
              p90: marketBenchmarks.wrvu90,
            }}
            formatValue={formatValue}
            valueLabel="Your wRVUs"
          />

          {/* Save Button */}
          <div className="flex justify-center">
            <FMVSaveButton
              metricType="wrvu"
              value={wrvuValue}
              benchmarks={marketBenchmarks}
              percentile={percentile}
            />
          </div>
        </>
      )}
    </div>
  );
}

