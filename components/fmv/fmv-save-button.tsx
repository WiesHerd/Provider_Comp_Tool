'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as Dialog from '@radix-ui/react-dialog';
import { Save } from 'lucide-react';
import { useScenariosStore } from '@/lib/store/scenarios-store';
import { ProviderScenario, MarketBenchmarks, TCCComponent, FTE } from '@/types';
import { findMatchingScenario } from '@/lib/utils/scenario-helpers';

interface FMVSaveButtonProps {
  metricType: 'tcc' | 'wrvu' | 'cf';
  value: number;
  benchmarks: MarketBenchmarks;
  percentile: number;
  specialty?: string;
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
  specialty,
  tccComponents,
  fte,
  totalTcc,
}: FMVSaveButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [existingScenarioId, setExistingScenarioId] = useState<string | null>(null);
  const { saveScenario, updateScenario, scenarios } = useScenariosStore();

  // Determine scenario type based on metric type
  const scenarioType = metricType === 'tcc' ? 'fmv-tcc' : metricType === 'wrvu' ? 'fmv-wrvu' : 'fmv-cf';

  // Pre-fill name and check for existing scenario when dialog opens
  useEffect(() => {
    if (open && !name.trim()) {
      // Generate suggested name
      const metricLabel = metricType.toUpperCase();
      let suggestedName = '';
      
      if (specialty) {
        suggestedName = `${specialty} - ${metricLabel}`;
      } else {
        suggestedName = `${metricLabel} Scenario`;
      }
      
      setName(suggestedName);

      // Check for existing scenario
      const existing = findMatchingScenario(scenarios, {
        scenarioType,
        specialty,
      });

      if (existing) {
        setIsUpdating(true);
        setExistingScenarioId(existing.id);
        setName(existing.name);
      } else {
        setIsUpdating(false);
        setExistingScenarioId(null);
      }
    }
  }, [open, metricType, specialty, scenarioType, scenarios, name]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setName('');
      setIsUpdating(false);
      setExistingScenarioId(null);
    }
  }, [open]);

  const handleSave = () => {
    if (!name.trim()) return;
    
    // Create scenario based on metric type
    const scenario: ProviderScenario = {
      id: existingScenarioId || `fmv-${metricType}-${Date.now()}`,
      name: name.trim(),
      scenarioType,
      specialty,
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
      createdAt: existingScenarioId ? scenarios.find(s => s.id === existingScenarioId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingScenarioId && isUpdating) {
      updateScenario(existingScenarioId, scenario);
    } else {
      saveScenario(scenario);
    }
    
    setName('');
    setIsUpdating(false);
    setExistingScenarioId(null);
    setOpen(false);
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
        <Button className="w-full sm:w-auto min-h-[44px] touch-target">
          <Save className="w-4 h-4 mr-2 flex-shrink-0" />
          Save
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-[90vw] z-50 shadow-xl">
          <Dialog.Title className="text-xl font-bold mb-2">
            {isUpdating ? 'Update FMV Scenario' : 'Save FMV Scenario'}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {isUpdating 
              ? `Update the name or save as a new scenario. Current scenario: "${name}"`
              : `Save this ${getMetricLabel()} calculation as a scenario for future reference.`}
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
              <Button variant="outline" className="w-full sm:w-auto min-h-[44px] touch-target">Cancel</Button>
            </Dialog.Close>
            {isUpdating && (
              <Button 
                onClick={() => {
                  setIsUpdating(false);
                  setExistingScenarioId(null);
                  // Regenerate suggested name
                  const metricLabel = metricType.toUpperCase();
                  const suggestedName = specialty ? `${specialty} - ${metricLabel}` : `${metricLabel} Scenario`;
                  setName(suggestedName);
                }} 
                variant="outline"
                className="w-full sm:w-auto min-h-[44px] touch-target"
              >
                Save as New
              </Button>
            )}
            <Button onClick={handleSave} disabled={!name.trim()} className="w-full sm:w-auto min-h-[44px] touch-target">
              {isUpdating ? 'Update' : 'Save'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

