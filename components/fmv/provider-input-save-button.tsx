'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as Dialog from '@radix-ui/react-dialog';
import { useScenariosStore } from '@/lib/store/scenarios-store';
import { ProviderScenario, TCCComponent, FTE } from '@/types';
import { Save } from 'lucide-react';

interface ProviderInputSaveButtonProps {
  scenarioType: 'fmv-tcc' | 'fmv-wrvu' | 'fmv-cf';
  fte: FTE;
  tccComponents?: TCCComponent[];
  specialty?: string;
  // wRVU specific
  annualWrvus?: number;
  monthlyWrvus?: number;
  monthlyBreakdown?: number[];
  // CF specific
  cfValue?: number;
}

export function ProviderInputSaveButton({
  scenarioType,
  fte,
  tccComponents = [],
  specialty,
  annualWrvus = 0,
  monthlyWrvus,
  monthlyBreakdown,
  cfValue,
}: ProviderInputSaveButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const { saveScenario } = useScenariosStore();

  const handleSave = () => {
    if (!name.trim()) return;

    let totalTcc = 0;
    let normalizedTcc = 0;
    
    if (scenarioType === 'fmv-tcc' && tccComponents.length > 0) {
      totalTcc = tccComponents.reduce((sum, c) => sum + (c.amount || 0), 0);
      normalizedTcc = fte > 0 ? totalTcc / fte : 0;
    }

    const scenario: ProviderScenario = {
      id: `provider-input-${scenarioType}-${Date.now()}`,
      name: name.trim(),
      scenarioType,
      fte,
      annualWrvus: scenarioType === 'fmv-wrvu' ? (annualWrvus || 0) : 0,
      monthlyWrvus: scenarioType === 'fmv-wrvu' ? monthlyWrvus : undefined,
      monthlyBreakdown: scenarioType === 'fmv-wrvu' && monthlyBreakdown ? [...monthlyBreakdown] : undefined,
      tccComponents: tccComponents.length > 0 ? tccComponents : [],
      totalTcc: totalTcc > 0 ? totalTcc : undefined,
      normalizedTcc: normalizedTcc > 0 ? normalizedTcc : undefined,
      cfValue: scenarioType === 'fmv-cf' ? cfValue : undefined,
      specialty,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveScenario(scenario);
    setName('');
    setOpen(false);
  };

  // Check if there's data to save based on scenario type
  const hasData = 
    (scenarioType === 'fmv-tcc' && tccComponents.length > 0 && tccComponents.some(c => c.amount > 0)) ||
    (scenarioType === 'fmv-wrvu' && annualWrvus > 0) ||
    (scenarioType === 'fmv-cf' && cfValue !== undefined && cfValue > 0);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          disabled={!hasData}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          Save Provider Input
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-[90vw] z-50 shadow-xl">
          <Dialog.Title className="text-xl font-bold mb-2">Save Provider Input</Dialog.Title>
          <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {scenarioType === 'fmv-tcc' && 'Save your FTE and TCC components to load them later. You can continue working on this calculation or start a new one.'}
            {scenarioType === 'fmv-wrvu' && 'Save your FTE and wRVU data (including monthly breakdown) to load them later. You can continue working on this calculation or start a new one.'}
            {scenarioType === 'fmv-cf' && 'Save your conversion factor to load it later. You can continue working on this calculation or start a new one.'}
          </Dialog.Description>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Dr. Smith - Cardiology"
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

