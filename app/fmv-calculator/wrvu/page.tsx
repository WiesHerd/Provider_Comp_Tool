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
import { FTEInput } from '@/components/wrvu/fte-input';
import { MarketBenchmarks, ProviderScenario, FTE } from '@/types';
import { calculateWRVUPercentile } from '@/lib/utils/percentile';
import { normalizeWrvus } from '@/lib/utils/normalization';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScenarioLoader } from '@/components/scenarios/scenario-loader';

export default function WRVUCalculatorPage() {
  const [specialty, setSpecialty] = useState<string>('');
  const [annualWrvus, setAnnualWrvus] = useState<number>(0);
  const [fte, setFte] = useState<FTE>(1.0);
  const [marketBenchmarks, setMarketBenchmarks] = useState<MarketBenchmarks>({});

  // Normalize wRVUs to 1.0 FTE for comparison with market benchmarks
  // Market benchmarks are always normalized to 1.0 FTE
  const normalizedWrvus = normalizeWrvus(annualWrvus, fte);
  const percentile = calculateWRVUPercentile(normalizedWrvus, marketBenchmarks);

  const formatValue = (value: number) => {
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
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
          <ScenarioLoader
            scenarioType="fmv-wrvu"
            onLoad={(scenario) => {
              if (scenario.fte) {
                setFte(scenario.fte);
              }
              // Load annual wRVUs - prefer annualWrvus if available, otherwise calculate from normalized
              if (scenario.annualWrvus && scenario.annualWrvus > 0) {
                setAnnualWrvus(scenario.annualWrvus);
              } else if (scenario.normalizedWrvus) {
                const loadedFte = scenario.fte || 1.0;
                setAnnualWrvus(scenario.normalizedWrvus * loadedFte);
              }
              if (scenario.marketBenchmarks) {
                setMarketBenchmarks(scenario.marketBenchmarks);
              }
            }}
          />
          <SpecialtyInput
            metricType="wrvu"
            onSpecialtyChange={setSpecialty}
            onMarketDataLoad={setMarketBenchmarks}
          />
          
          <FTEInput value={fte} onChange={setFte} />
          
          <div className="space-y-2">
            <Label className="text-base font-semibold">Annual wRVUs</Label>
            <NumberInput
              value={annualWrvus}
              onChange={setAnnualWrvus}
              placeholder="Enter annual wRVUs"
              min={0}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Market benchmarks are normalized to 1.0 FTE
            </p>
          </div>
          
          {annualWrvus > 0 && fte > 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Normalized wRVUs (1.0 FTE)</span>
                <span className="font-semibold text-lg text-primary">
                  {formatValue(normalizedWrvus)}
                </span>
              </div>
            </div>
          )}
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
      {normalizedWrvus > 0 && (
        <>
          <PercentileBreakdown
            value={normalizedWrvus}
            percentile={percentile}
            benchmarks={{
              p25: marketBenchmarks.wrvu25,
              p50: marketBenchmarks.wrvu50,
              p75: marketBenchmarks.wrvu75,
              p90: marketBenchmarks.wrvu90,
            }}
            formatValue={formatValue}
            valueLabel="Your Normalized wRVUs (1.0 FTE)"
          />

          {/* Save Button */}
          <div className="flex justify-center">
            <FMVSaveButton
              metricType="wrvu"
              value={normalizedWrvus}
              benchmarks={marketBenchmarks}
              percentile={percentile}
              fte={fte}
            />
          </div>
        </>
      )}
    </div>
  );
}

