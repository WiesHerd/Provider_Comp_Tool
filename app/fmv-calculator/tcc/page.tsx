'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BenchmarkInputs } from '@/components/fmv/benchmark-inputs';
import { PercentileBreakdown } from '@/components/fmv/percentile-breakdown';
import { FMVSaveButton } from '@/components/fmv/fmv-save-button';
import { SpecialtyInput } from '@/components/fmv/specialty-input';
import { MarketDataSaveButton } from '@/components/fmv/market-data-save-button';
import { TCCComponentsGrid } from '@/components/fmv/tcc-components-grid';
import { FTEInput } from '@/components/wrvu/fte-input';
import { MarketBenchmarks, TCCComponent, FTE, ProviderScenario } from '@/types';
import { calculateTCCPercentile } from '@/lib/utils/percentile';
import { normalizeTcc } from '@/lib/utils/normalization';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScenarioLoader } from '@/components/scenarios/scenario-loader';

export default function TCCCalculatorPage() {
  const [specialty, setSpecialty] = useState<string>('');
  const [fte, setFte] = useState<FTE>(1.0);
  const [tccComponents, setTccComponents] = useState<TCCComponent[]>([]);
  const [marketBenchmarks, setMarketBenchmarks] = useState<MarketBenchmarks>({});

  // Calculate total TCC from components
  const totalTcc = tccComponents.reduce((sum, c) => sum + c.amount, 0);
  const normalizedTcc = normalizeTcc(totalTcc, fte);
  const percentile = calculateTCCPercentile(normalizedTcc, marketBenchmarks);

  const formatValue = (value: number) => {
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
          TCC Calculator
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Calculate percentile for Total Cash Compensation
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Input</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ScenarioLoader
            scenarioType="fmv-tcc"
            onLoad={(scenario) => {
              setFte(scenario.fte);
              if (scenario.tccComponents && scenario.tccComponents.length > 0) {
                setTccComponents(scenario.tccComponents);
              }
              if (scenario.marketBenchmarks) {
                setMarketBenchmarks(scenario.marketBenchmarks);
              }
            }}
          />
          <SpecialtyInput
            metricType="tcc"
            onSpecialtyChange={setSpecialty}
            onMarketDataLoad={setMarketBenchmarks}
          />
          
          <FTEInput value={fte} onChange={setFte} />
          
          <TCCComponentsGrid
            components={tccComponents}
            onComponentsChange={setTccComponents}
          />

          {totalTcc > 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total TCC</span>
                <span className="font-semibold text-lg">
                  {formatValue(totalTcc)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Normalized TCC (1.0 FTE)</span>
                <span className="font-semibold text-lg text-primary">
                  {formatValue(normalizedTcc)}
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
            type="tcc"
          />
          
          <MarketDataSaveButton
            specialty={specialty}
            metricType="tcc"
            benchmarks={marketBenchmarks}
          />
        </CardContent>
      </Card>

      {/* Results Section */}
      {normalizedTcc > 0 && (
        <>
          <PercentileBreakdown
            value={normalizedTcc}
            percentile={percentile}
            benchmarks={{
              p25: marketBenchmarks.tcc25,
              p50: marketBenchmarks.tcc50,
              p75: marketBenchmarks.tcc75,
              p90: marketBenchmarks.tcc90,
            }}
            formatValue={formatValue}
            valueLabel="Your Normalized TCC"
          />

          {/* Save Button */}
          <div className="flex justify-center">
            <FMVSaveButton
              metricType="tcc"
              value={normalizedTcc}
              benchmarks={marketBenchmarks}
              percentile={percentile}
              tccComponents={tccComponents}
              fte={fte}
              totalTcc={totalTcc}
            />
          </div>
        </>
      )}
    </div>
  );
}

