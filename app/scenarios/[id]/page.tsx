'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useScenariosStore } from '@/lib/store/scenarios-store';
import { ProviderScenario, FTE, TCCComponent, MarketBenchmarks } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TCCComponentsGrid } from '@/components/fmv/tcc-components-grid';
import { BenchmarkInputs } from '@/components/fmv/benchmark-inputs';
import { FMVSummaryTiles } from '@/components/fmv/fmv-summary-tiles';
import { PercentileChart } from '@/components/fmv/percentile-chart';
import { FTEInput } from '@/components/wrvu/fte-input';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { normalizeTcc, normalizeWrvus, calculateEffectiveCF } from '@/lib/utils/normalization';
import {
  calculateTCCPercentile,
  calculateWRVUPercentile,
  calculateCFPercentile,
} from '@/lib/utils/percentile';
import { Input } from '@/components/ui/input';

export default function ScenarioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getScenario, saveScenario, updateScenario } = useScenariosStore();
  const [scenario, setScenario] = useState<ProviderScenario | null>(null);
  const [name, setName] = useState('');
  const [fte, setFte] = useState<FTE>(1.0);
  const [annualWrvus, setAnnualWrvus] = useState(0);
  const [tccComponents, setTccComponents] = useState<TCCComponent[]>([]);
  const [marketBenchmarks, setMarketBenchmarks] = useState<MarketBenchmarks>({});

  useEffect(() => {
    if (params.id && typeof params.id === 'string') {
      const loaded = getScenario(params.id);
      if (loaded) {
        setScenario(loaded);
        setName(loaded.name);
        setFte(loaded.fte);
        setAnnualWrvus(loaded.annualWrvus);
        setTccComponents(loaded.tccComponents);
        setMarketBenchmarks(loaded.marketBenchmarks || {});
      }
    }
  }, [params.id, getScenario]);

  // Calculations
  const totalTcc = tccComponents.reduce((sum, c) => sum + c.amount, 0);
  const normalizedTcc = normalizeTcc(totalTcc, fte);
  const normalizedWrvus = normalizeWrvus(annualWrvus, fte);
  const effectiveCF = calculateEffectiveCF(normalizedTcc, normalizedWrvus);

  // Percentiles
  const tccPercentile = calculateTCCPercentile(normalizedTcc, marketBenchmarks);
  const wrvuPercentile = calculateWRVUPercentile(normalizedWrvus, marketBenchmarks);
  const cfPercentile = calculateCFPercentile(effectiveCF, marketBenchmarks);

  const handleSave = () => {
    if (!scenario) return;

    const updated: ProviderScenario = {
      ...scenario,
      name: name.trim() || scenario.name,
      fte,
      annualWrvus,
      tccComponents,
      totalTcc,
      normalizedTcc,
      normalizedWrvus,
      marketBenchmarks,
      computedPercentiles: {
        tccPercentile,
        wrvuPercentile,
        cfPercentile,
      },
      updatedAt: new Date().toISOString(),
    };

    updateScenario(scenario.id, updated);
    router.push('/scenarios');
  };

  const handleSaveAsNew = () => {
    const newScenario: ProviderScenario = {
      id: `scenario-${Date.now()}`,
      name: name.trim() || `${scenario?.name} (Copy)`,
      fte,
      annualWrvus,
      tccComponents,
      totalTcc,
      normalizedTcc,
      normalizedWrvus,
      marketBenchmarks,
      computedPercentiles: {
        tccPercentile,
        wrvuPercentile,
        cfPercentile,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveScenario(newScenario);
    router.push('/scenarios');
  };

  if (!scenario) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <p>Scenario not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">Edit Scenario</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/scenarios')}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleSaveAsNew}>
            Save as New
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scenario Name</CardTitle>
        </CardHeader>
        <CardContent>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Scenario name" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Provider Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FTEInput value={fte} onChange={setFte} />

            <div className="space-y-2">
              <Label className="text-base font-semibold">Annual wRVUs</Label>
              <NumberInput
                value={annualWrvus}
                onChange={setAnnualWrvus}
                placeholder="Enter annual wRVUs"
                min={0}
              />
            </div>

            <TCCComponentsGrid
              components={tccComponents}
              onComponentsChange={setTccComponents}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <BenchmarkInputs
              benchmarks={marketBenchmarks}
              onBenchmarksChange={setMarketBenchmarks}
              type="tcc"
            />
            <BenchmarkInputs
              benchmarks={marketBenchmarks}
              onBenchmarksChange={setMarketBenchmarks}
              type="cf"
            />
            <BenchmarkInputs
              benchmarks={marketBenchmarks}
              onBenchmarksChange={setMarketBenchmarks}
              type="wrvu"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>FMV Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FMVSummaryTiles
            normalizedTcc={normalizedTcc}
            normalizedWrvus={normalizedWrvus}
            effectiveCF={effectiveCF}
            tccPercentile={tccPercentile}
            wrvuPercentile={wrvuPercentile}
            cfPercentile={cfPercentile}
          />

          <PercentileChart
            tccPercentile={tccPercentile}
            wrvuPercentile={wrvuPercentile}
            cfPercentile={cfPercentile}
          />
        </CardContent>
      </Card>
    </div>
  );
}

