'use client';

import { useState, useEffect, useMemo } from 'react';
import { useScenariosStore } from '@/lib/store/scenarios-store';
import { ProviderScenario, ScenarioType } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Trash2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface ScenarioLoaderProps {
  scenarioType: ScenarioType;
  onLoad: (scenario: ProviderScenario) => void;
  className?: string;
}

export function ScenarioLoader({ scenarioType, onLoad, className }: ScenarioLoaderProps) {
  const { scenarios, loadScenarios, deleteScenario } = useScenariosStore();
  const [selectedId, setSelectedId] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [scenarioToDelete, setScenarioToDelete] = useState<ProviderScenario | null>(null);
  const [selectOpen, setSelectOpen] = useState(false);

  // Load scenarios on mount
  useEffect(() => {
    setMounted(true);
    loadScenarios();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload scenarios when scenarioType changes
  useEffect(() => {
    if (mounted) {
      loadScenarios();
    }
  }, [scenarioType, mounted]); // eslint-disable-line react-hooks/exhaustive-deps


  // Filter scenarios by type
  // Include scenarios that match the type, or legacy scenarios (no type) for 'wrvu-modeler' screen
  const typeFilteredScenarios = useMemo(() => 
    scenarios.filter(
      (s) => s.scenarioType === scenarioType || 
            (!s.scenarioType && (scenarioType === 'wrvu-modeler' || scenarioType === 'general'))
    ),
    [scenarios, scenarioType]
  );


  const handleLoad = () => {
    if (!selectedId) return;
    const scenario = scenarios.find((s) => s.id === selectedId);
    if (scenario) {
      onLoad(scenario);
      setSelectedId(''); // Clear selection after loading
    }
  };

  const handleDeleteClick = (scenario: ProviderScenario, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setScenarioToDelete(scenario);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (scenarioToDelete) {
      const deletedId = scenarioToDelete.id;
      deleteScenario(deletedId);
      // The store's deleteScenario already updates the scenarios array
      // which will trigger a re-render via Zustand
      if (selectedId === deletedId) {
        setSelectedId(''); // Clear selection if deleting the selected scenario
      }
      setScenarioToDelete(null);
      setDeleteOpen(false);
      setSelectOpen(false); // Ensure dropdown is closed
    }
  };

  return (
    <div className={`space-y-2 ${className || ''}`}>
      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Load Saved Scenario
      </label>
      {typeFilteredScenarios.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
          No saved scenarios available. Save a scenario to load it here.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <div className="flex-1 min-w-0">
              <Select 
                key={`scenario-select-${typeFilteredScenarios.length}-${scenarios.length}`}
                value={selectedId} 
                onValueChange={setSelectedId} 
                open={selectOpen} 
                onOpenChange={setSelectOpen}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a scenario..." />
                </SelectTrigger>
                <SelectContent>
                  {typeFilteredScenarios.map((scenario) => (
                    <SelectItem 
                      key={scenario.id} 
                      value={scenario.id}
                      className="group pr-8"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="flex-1 truncate pointer-events-none">
                          {scenario.name}
                          {scenario.providerName && ` - ${scenario.providerName}`}
                          {scenario.specialty && ` (${scenario.specialty})`}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            e.nativeEvent.stopImmediatePropagation();
                            setSelectOpen(false);
                            handleDeleteClick(scenario, e);
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            e.nativeEvent.stopImmediatePropagation();
                          }}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            e.nativeEvent.stopImmediatePropagation();
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-500 shrink-0 -mr-2 pointer-events-auto z-10 relative"
                          title="Delete scenario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleLoad}
              disabled={!selectedId}
              variant="outline"
              className="w-full sm:w-auto shrink-0"
            >
              <Download className="w-4 h-4 mr-1" />
              Load
            </Button>
          </div>

          {/* Delete Confirmation Dialog */}
          <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
              <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-[90vw] z-50 shadow-xl">
                <Dialog.Title className="text-xl font-bold mb-2">Delete Scenario</Dialog.Title>
                <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Are you sure you want to delete &quot;{scenarioToDelete?.name}&quot;? This action cannot be undone.
                </Dialog.Description>
                <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                  <Dialog.Close asChild>
                    <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
                  </Dialog.Close>
                  <Button
                    onClick={handleDeleteConfirm}
                    variant="outline"
                    className="w-full sm:w-auto text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      )}
    </div>
  );
}

