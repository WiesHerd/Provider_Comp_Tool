'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as Dialog from '@radix-ui/react-dialog';
import { useScenariosStore } from '@/lib/store/scenarios-store';
import { ProviderScenario, FTE } from '@/types';

interface ScenarioSaveButtonProps {
  fte: FTE;
  annualWrvus: number;
  conversionFactor: number;
  productivityPay: number;
  basePay?: number;
  providerName?: string;
  specialty?: string;
}

export function ScenarioSaveButton({
  fte,
  annualWrvus,
  conversionFactor,
  productivityPay,
  basePay = 0,
  providerName,
  specialty,
}: ScenarioSaveButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const { saveScenario } = useScenariosStore();

  const handleSave = () => {
    if (!name.trim()) return;

    const tccComponents = [];
    
    // Add base pay if provided
    if (basePay > 0) {
      tccComponents.push({
        id: 'base-salary',
        label: 'Base Salary',
        type: 'Base Salary',
        amount: basePay,
      });
    }
    
    // Add productivity incentive if greater than 0
    if (productivityPay > 0) {
      tccComponents.push({
        id: 'productivity',
        label: 'Productivity Incentive',
        type: 'Productivity Incentive',
        amount: productivityPay,
      });
    }
    
    const totalTcc = basePay + productivityPay;

    const scenario: ProviderScenario = {
      id: `scenario-${Date.now()}`,
      name: name.trim(),
      scenarioType: 'wrvu-modeler',
      providerName: providerName,
      specialty: specialty,
      fte,
      annualWrvus,
      tccComponents,
      totalTcc,
      normalizedTcc: fte > 0 ? totalTcc / fte : 0,
      normalizedWrvus: fte > 0 ? annualWrvus / fte : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveScenario(scenario);
    setName('');
    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">Save as Scenario</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-[90vw] z-50 shadow-xl">
          <Dialog.Title className="text-xl font-bold mb-2">Save Scenario</Dialog.Title>
          <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Enter a name for this scenario
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

