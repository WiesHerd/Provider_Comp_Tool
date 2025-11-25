'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as Dialog from '@radix-ui/react-dialog';
import { Save } from 'lucide-react';
import { useScenariosStore } from '@/lib/store/scenarios-store';
import { ProviderScenario, FTE, TCCComponent } from '@/types';
import { findMatchingScenario } from '@/lib/utils/scenario-helpers';

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
  const [isUpdating, setIsUpdating] = useState(false);
  const [existingScenarioId, setExistingScenarioId] = useState<string | null>(null);
  const { saveScenario, updateScenario, scenarios } = useScenariosStore();

  // Pre-fill name and check for existing scenario when dialog opens
  useEffect(() => {
    if (open && !name.trim()) {
      // Generate suggested name
      let suggestedName = '';
      
      if (providerName && specialty) {
        suggestedName = `${providerName} - ${specialty}`;
      } else if (providerName) {
        suggestedName = `${providerName} - WRVU Model`;
      } else if (specialty) {
        suggestedName = `${specialty} - WRVU Model`;
      } else {
        suggestedName = 'WRVU Model';
      }
      
      setName(suggestedName);

      // Check for existing scenario
      const existing = findMatchingScenario(scenarios, {
        scenarioType: 'wrvu-modeler',
        specialty,
        providerName,
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
  }, [open, providerName, specialty, scenarios, name]);

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

    const tccComponents: TCCComponent[] = [];
    
    // Add base pay if provided
    if (basePay > 0) {
      tccComponents.push({
        id: 'base-salary',
        label: 'Base Salary',
        type: 'Base Salary' as const,
        amount: basePay,
      });
    }
    
    // Add productivity incentive if greater than 0
    if (productivityPay > 0) {
      tccComponents.push({
        id: 'productivity',
        label: 'Productivity Incentive',
        type: 'Productivity Incentive' as const,
        amount: productivityPay,
      });
    }
    
    const totalTcc = basePay + productivityPay;

    const scenario: ProviderScenario = {
      id: existingScenarioId || `scenario-${Date.now()}`,
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

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button className="w-full sm:w-auto min-h-[44px] touch-target">
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-[90vw] z-50 shadow-xl">
          <Dialog.Title className="text-xl font-bold mb-2">
            {isUpdating ? 'Update Model' : 'Save Model'}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {isUpdating 
              ? `Update the name or save as a new model. Current model: "${name}"`
              : 'Enter a name for this model'}
          </Dialog.Description>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Model name"
            className="mb-4"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              }
            }}
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
                  let suggestedName = '';
                  if (providerName && specialty) {
                    suggestedName = `${providerName} - ${specialty}`;
                  } else if (providerName) {
                    suggestedName = `${providerName} - WRVU Model`;
                  } else if (specialty) {
                    suggestedName = `${specialty} - WRVU Model`;
                  } else {
                    suggestedName = 'WRVU Model';
                  }
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

