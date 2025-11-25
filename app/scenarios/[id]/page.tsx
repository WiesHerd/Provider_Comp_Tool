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
import * as Dialog from '@radix-ui/react-dialog';
import { Trash2, Activity } from 'lucide-react';

export default function ScenarioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getScenario, saveScenario, updateScenario, deleteScenario } = useScenariosStore();
  const [scenario, setScenario] = useState<ProviderScenario | null>(null);
  const [name, setName] = useState('');
  const [fte, setFte] = useState<FTE>(1.0);
  const [annualWrvus, setAnnualWrvus] = useState(0);
  const [tccComponents, setTccComponents] = useState<TCCComponent[]>([]);
  const [marketBenchmarks, setMarketBenchmarks] = useState<MarketBenchmarks>({});
  const [deleteOpen, setDeleteOpen] = useState(false);

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

  const handleDelete = () => {
    if (!scenario) return;
    deleteScenario(scenario.id);
    setDeleteOpen(false);
    router.push('/scenarios');
  };

  if (!scenario) {
    return (
      <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto py-4 sm:py-6 md:py-8">
        <p>Model not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
        <div className="flex flex-col sm:flex-row gap-2 flex-1 sm:flex-none">
          <Button variant="outline" onClick={() => router.push('/scenarios')} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button variant="outline" onClick={handleSaveAsNew} className="w-full sm:w-auto">
            Save as New
          </Button>
          <Button onClick={handleSave} className="w-full sm:w-auto">Save</Button>
        </div>
        <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
          <Dialog.Trigger asChild>
            <Button variant="outline" className="w-full sm:w-auto text-red-600 hover:text-red-700 border-red-200 hover:border-red-300">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-[90vw] z-50 shadow-xl">
              <Dialog.Title className="text-xl font-bold mb-2">Delete Model</Dialog.Title>
              <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to delete &quot;{scenario?.name}&quot;? This action cannot be undone.
              </Dialog.Description>
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Dialog.Close asChild>
                  <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
                </Dialog.Close>
                <Button onClick={handleDelete} variant="outline" className="w-full sm:w-auto text-red-600 hover:text-red-700">
                  Delete
                </Button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scenario Name</CardTitle>
        </CardHeader>
        <CardContent>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Scenario name" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
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
                icon={<Activity className="w-5 h-5" />}
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

