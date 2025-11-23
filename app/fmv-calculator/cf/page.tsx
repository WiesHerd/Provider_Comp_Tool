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
import { MarketBenchmarks, ProviderScenario } from '@/types';
import { calculateCFPercentile } from '@/lib/utils/percentile';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScenarioLoader } from '@/components/scenarios/scenario-loader';

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
    <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 space-y-8">
      {/* Back Button */}
      <Link href="/fmv-calculator">
        <Button variant="outline" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to FMV Calculator
        </Button>
      </Link>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Input</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ScenarioLoader
            scenarioType="fmv-cf"
            onLoad={(scenario) => {
              // CF is stored in computedPercentiles or we can calculate from normalizedTcc/normalizedWrvus
              if (scenario.normalizedTcc && scenario.normalizedWrvus && scenario.normalizedWrvus > 0) {
                setCfValue(scenario.normalizedTcc / scenario.normalizedWrvus);
              }
              if (scenario.marketBenchmarks) {
                setMarketBenchmarks(scenario.marketBenchmarks);
              }
            }}
          />
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

