'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as Dialog from '@radix-ui/react-dialog';
import { useScenariosStore } from '@/lib/store/scenarios-store';
import { ProviderScenario, MarketBenchmarks, TCCComponent, FTE } from '@/types';

interface FMVSaveButtonProps {
  metricType: 'tcc' | 'wrvu' | 'cf';
  value: number;
  benchmarks: MarketBenchmarks;
  percentile: number;
  // TCC-specific props
  tccComponents?: TCCComponent[];
  fte?: FTE;
  totalTcc?: number;
}

export function FMVSaveButton({
  metricType,
  value,
  benchmarks,
  percentile,
  tccComponents,
  fte,
  totalTcc,
}: FMVSaveButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const { saveScenario } = useScenariosStore();

  const handleSave = () => {
    if (!name.trim()) return;

    // Determine scenario type based on metric type
    const scenarioType = metricType === 'tcc' ? 'fmv-tcc' : metricType === 'wrvu' ? 'fmv-wrvu' : 'fmv-cf';
    
    // Create scenario based on metric type
    const scenario: ProviderScenario = {
      id: `fmv-${metricType}-${Date.now()}`,
      name: name.trim(),
      scenarioType,
      fte: fte !== undefined ? fte : 1.0,
      // For wRVU: value is normalized, but we need to calculate annualWrvus from FTE
      // However, we don't have annualWrvus here, so we'll store normalized and calculate on load
      annualWrvus: metricType === 'wrvu' ? (fte !== undefined ? value * fte : value) : 0,
      tccComponents: metricType === 'tcc' && tccComponents 
        ? tccComponents 
        : metricType === 'tcc'
        ? [{
            id: 'tcc',
            label: 'Total Cash Compensation',
            type: 'Base Salary',
            amount: totalTcc || value,
          }]
        : [],
      totalTcc: metricType === 'tcc' ? (totalTcc || value) : undefined,
      normalizedTcc: metricType === 'tcc' ? value : undefined,
      normalizedWrvus: metricType === 'wrvu' ? value : undefined,
      marketBenchmarks: benchmarks,
      computedPercentiles: {
        ...(metricType === 'tcc' && { tccPercentile: percentile }),
        ...(metricType === 'wrvu' && { wrvuPercentile: percentile }),
        ...(metricType === 'cf' && { cfPercentile: percentile }),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveScenario(scenario);
    setName('');
    setOpen(false);
    
    // Optionally navigate to scenarios page
    // router.push('/scenarios');
  };

  const getMetricLabel = () => {
    switch (metricType) {
      case 'tcc':
        return 'Total Cash Compensation';
      case 'wrvu':
        return 'wRVUs';
      case 'cf':
        return 'Conversion Factor';
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button className="w-full sm:w-auto">Save</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-[90vw] z-50 shadow-xl">
          <Dialog.Title className="text-xl font-bold mb-2">Save FMV Scenario</Dialog.Title>
          <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Save this {getMetricLabel()} calculation as a scenario for future reference.
          </Dialog.Description>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Scenario name"
            className="mb-4"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              }
            }}
            autoFocus
          />
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Dialog.Close asChild>
              <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
            </Dialog.Close>
            <Button onClick={handleSave} disabled={!name.trim()} className="w-full sm:w-auto">
              Save
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

