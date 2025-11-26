'use client';

import { useState, useEffect, useMemo } from 'react';
import { useScenariosStore } from '@/lib/store/scenarios-store';
import { ProviderScenario, ScenarioType } from '@/types';
import { Button } from '@/components/ui/button';
import { FolderOpen, Trash2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils/cn';

// Type assertion for React 19 compatibility
const DropdownMenuRoot = DropdownMenuPrimitive.Root as any;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger as any;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal as any;
const DropdownMenuContent = DropdownMenuPrimitive.Content as any;
const DropdownMenuItem = DropdownMenuPrimitive.Item as any;
const DropdownMenuSeparator = DropdownMenuPrimitive.Separator as any;

interface ScenarioLoaderProps {
  scenarioType: ScenarioType;
  onLoad: (scenario: ProviderScenario) => void;
  className?: string;
}

export function ScenarioLoader({ scenarioType, onLoad, className }: ScenarioLoaderProps) {
  const { scenarios, loadScenarios, deleteScenario } = useScenariosStore();
  const [mounted, setMounted] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [scenarioToDelete, setScenarioToDelete] = useState<ProviderScenario | null>(null);

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

  const handleLoad = (scenario: ProviderScenario) => {
    onLoad(scenario);
  };

  const handleDeleteClick = (scenario: ProviderScenario, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setScenarioToDelete(scenario);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (scenarioToDelete) {
      deleteScenario(scenarioToDelete.id);
      setScenarioToDelete(null);
      setDeleteOpen(false);
    }
  };

  return (
    <div className={cn("inline-flex", className)}>
      <DropdownMenuRoot>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={typeFilteredScenarios.length === 0}
            className={cn(
              "min-w-[44px] h-[44px] rounded-full",
              "hover:bg-gray-100/80 dark:hover:bg-gray-800/80",
              "transition-all duration-300 ease-out",
              "active:scale-[0.96]",
              "hover:shadow-sm",
              "group",
              "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
              "touch-manipulation",
              typeFilteredScenarios.length === 0 && "opacity-50 cursor-not-allowed"
            )}
            aria-label={typeFilteredScenarios.length === 0 ? "No saved models" : "Load saved model"}
            title={typeFilteredScenarios.length === 0 ? "No saved models - Save a scenario first" : "Load saved model"}
          >
            <FolderOpen className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent
            className={cn(
              "min-w-[280px] max-h-[400px] overflow-y-auto",
              "bg-white dark:bg-gray-900 rounded-lg shadow-lg",
              "border border-gray-200 dark:border-gray-800 p-1 z-[100]"
            )}
            align="start"
            sideOffset={5}
          >
            {typeFilteredScenarios.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                No saved models yet. Save a scenario to load it here.
              </div>
            ) : (
              <>
                {typeFilteredScenarios.map((scenario, index) => (
              <div key={scenario.id}>
                <DropdownMenuItem
                  className={cn(
                    "flex items-center justify-between px-3 py-3",
                    "text-sm text-gray-700 dark:text-gray-300",
                    "rounded-md cursor-pointer",
                    "hover:bg-gray-50 dark:hover:bg-gray-800",
                    "outline-none",
                    "min-h-[44px] touch-manipulation",
                    "group/item"
                  )}
                  onClick={() => handleLoad(scenario)}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-medium truncate text-gray-900 dark:text-white">
                      {scenario.name}
                    </div>
                    {(scenario.providerName || scenario.specialty) && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {scenario.providerName && scenario.providerName}
                        {scenario.providerName && scenario.specialty && ' • '}
                        {scenario.specialty && scenario.specialty}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteClick(scenario, e)}
                    className={cn(
                      "ml-2 p-1.5 rounded",
                      "hover:bg-red-50 dark:hover:bg-red-900/20",
                      "active:bg-red-100 dark:active:bg-red-900/30",
                      "text-red-600 dark:text-red-500",
                      "shrink-0",
                      "touch-manipulation",
                      "min-w-[32px] min-h-[32px] flex items-center justify-center"
                    )}
                    title="Delete model"
                    aria-label={`Delete model ${scenario.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </DropdownMenuItem>
                {index < typeFilteredScenarios.length - 1 && (
                  <DropdownMenuSeparator className="h-px bg-gray-200 dark:bg-gray-800 my-1" />
                )}
              </div>
            ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-[90vw] z-50 shadow-xl">
            <Dialog.Title className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Delete Model</Dialog.Title>
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
                className="w-full sm:w-auto text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Delete
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

