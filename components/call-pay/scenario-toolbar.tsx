'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as Dialog from '@radix-ui/react-dialog';
import { Save, Loader2, Trash2 } from 'lucide-react';
import { useCallPayScenariosStore } from '@/lib/store/call-pay-scenarios-store';
import { createScenarioFromCurrentState } from '@/lib/utils/call-pay-scenario-utils';
import { CallPayContext, CallTier } from '@/types/call-pay';
import { CallProvider } from '@/types/call-pay-engine';
import { cn } from '@/lib/utils/cn';

interface ScenarioToolbarProps {
  context: CallPayContext;
  tiers: CallTier[];
  providers: CallProvider[];
  onLoadScenario: (scenarioId: string) => void;
  className?: string;
}

export function ScenarioToolbar({
  context,
  tiers,
  providers,
  onLoadScenario,
  className,
}: ScenarioToolbarProps) {
  const {
    scenarios,
    activeScenarioId,
    loadScenarios,
    saveScenario,
    updateScenario,
    deleteScenario,
    setActiveScenario,
    getScenario,
  } = useCallPayScenariosStore();

  const [scenarioName, setScenarioName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [scenarioToDelete, setScenarioToDelete] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load scenarios on mount
  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  // Pre-fill name when dialog opens
  useEffect(() => {
    if (showSaveDialog) {
      if (activeScenarioId) {
        const scenario = getScenario(activeScenarioId);
        setScenarioName(scenario?.name || '');
      } else {
        // Suggest a name based on current state
        const specialty = context.specialty || 'Call Pay';
        const year = context.modelYear || new Date().getFullYear();
        setScenarioName(`${specialty} ${year}`);
      }
    }
  }, [showSaveDialog, activeScenarioId, getScenario, context]);

  const handleSaveAsNew = async () => {
    if (!scenarioName.trim()) return;

    setIsSaving(true);
    try {
      const scenario = createScenarioFromCurrentState(
        scenarioName.trim(),
        context,
        tiers,
        providers
      );

      saveScenario(scenario);
      setActiveScenario(scenario.id);
      setShowSaveDialog(false);
      setScenarioName('');
    } catch (error) {
      console.error('Error saving scenario:', error);
      alert('Failed to save scenario. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateScenario = async () => {
    if (!activeScenarioId || !scenarioName.trim()) return;

    setIsSaving(true);
    try {
      const scenario = createScenarioFromCurrentState(
        scenarioName.trim(),
        context,
        tiers,
        providers,
        activeScenarioId
      );

      // Preserve original createdAt
      const existing = getScenario(activeScenarioId);
      if (existing) {
        scenario.createdAt = existing.createdAt;
      }

      updateScenario(activeScenarioId, scenario);
      setShowSaveDialog(false);
      setScenarioName('');
    } catch (error) {
      console.error('Error updating scenario:', error);
      alert('Failed to update scenario. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadScenario = (scenarioId: string) => {
    setActiveScenario(scenarioId);
    onLoadScenario(scenarioId);
  };

  const handleDeleteClick = (scenarioId: string) => {
    setScenarioToDelete(scenarioId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (scenarioToDelete) {
      deleteScenario(scenarioToDelete);
      if (activeScenarioId === scenarioToDelete) {
        setActiveScenario(null);
      }
      setShowDeleteDialog(false);
      setScenarioToDelete(null);
    }
  };

  return (
    <div className={cn('flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700', className)}>
      {/* Scenario Selector */}
      <div className="flex-1 min-w-0">
        <Label htmlFor="scenario-select" className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
          Active Scenario
        </Label>
        <div className="flex items-center gap-2">
          <Select
            value={activeScenarioId || 'none'}
            onValueChange={(value) => {
              if (value === 'none') {
                setActiveScenario(null);
              } else {
                handleLoadScenario(value);
              }
            }}
          >
            <SelectTrigger id="scenario-select" className="flex-1 min-w-0">
              <SelectValue placeholder="No scenario selected" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No scenario selected</SelectItem>
              {scenarios.map((scenario) => (
                <SelectItem key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {activeScenarioId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteClick(activeScenarioId)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Save Buttons */}
      <div className="flex items-end gap-2">
        {activeScenarioId ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSaveDialog(true)}
            className="whitespace-nowrap"
          >
            <Save className="w-4 h-4 mr-2 flex-shrink-0" />
            Update Scenario
          </Button>
        ) : null}
        <Button
          variant="default"
          size="sm"
          onClick={() => setShowSaveDialog(true)}
          className="whitespace-nowrap"
        >
          <Save className="w-4 h-4 mr-2 flex-shrink-0" />
          Save as New
        </Button>
      </div>

      {/* Save Dialog */}
      <Dialog.Root open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 z-50 border border-gray-200 dark:border-gray-700 w-[calc(100vw-2rem)] sm:w-96 max-w-md">
            <Dialog.Title className="text-lg font-semibold mb-2">
              {activeScenarioId ? 'Update Scenario' : 'Save as New Scenario'}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {activeScenarioId
                ? 'Update the current scenario with the current model state.'
                : 'Save the current model state as a new scenario for comparison.'}
            </Dialog.Description>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="scenario-name">Scenario Name</Label>
                <Input
                  id="scenario-name"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="e.g., Current, Proposed 2025, +1 FTE"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && scenarioName.trim()) {
                      if (activeScenarioId) {
                        handleUpdateScenario();
                      } else {
                        handleSaveAsNew();
                      }
                    }
                  }}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSaveDialog(false);
                  setScenarioName('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={activeScenarioId ? handleUpdateScenario : handleSaveAsNew}
                disabled={!scenarioName.trim() || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin flex-shrink-0" />
                    Saving...
                  </>
                ) : activeScenarioId ? (
                  'Update'
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 z-50 border border-gray-200 dark:border-gray-700 w-[calc(100vw-2rem)] sm:w-96 max-w-md">
            <Dialog.Title className="text-lg font-semibold mb-2">Delete Scenario</Dialog.Title>
            <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete this scenario? This action cannot be undone.
            </Dialog.Description>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="outline" onClick={handleDeleteConfirm} className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20">
                Delete
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

