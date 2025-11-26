'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as Dialog from '@radix-ui/react-dialog';
import { Save, Trash2, Mail, Printer, RotateCcw } from 'lucide-react';
import {
  WRVUForecasterInputs,
  ProductivityMetrics,
  WRVUForecasterScenario,
} from '@/types/wrvu-forecaster';
import { useScenariosStore } from '@/lib/store/scenarios-store';
import { ProviderScenario } from '@/types';
import {
  wrvuForecasterScenarioToProviderScenario,
  providerScenarioToWRVUForecasterScenario,
  isWRVUForecasterScenario,
} from '@/lib/utils/wrvu-forecaster-converters';

const STORAGE_KEY = 'wrvuForecasterScenarios';

interface ScenarioManagerProps {
  inputs: WRVUForecasterInputs;
  metrics: ProductivityMetrics;
  onLoadScenario: (scenario: WRVUForecasterScenario) => void;
  onEmailReport?: () => void;
  onPrint?: () => void;
  onStartOver?: () => void;
}

export function ScenarioManager({ inputs, metrics, onLoadScenario, onEmailReport, onPrint, onStartOver }: ScenarioManagerProps) {
  const { scenarios: globalScenarios, saveScenario: saveGlobalScenario, loadScenarios: loadGlobalScenarios, deleteScenario: deleteGlobalScenario } = useScenariosStore();
  const [localScenarios, setLocalScenarios] = useState<WRVUForecasterScenario[]>([]);
  const [scenarioName, setScenarioName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [existingScenarioId, setExistingScenarioId] = useState<string | null>(null);

  // Load global scenarios on mount
  useEffect(() => {
    loadGlobalScenarios();
  }, [loadGlobalScenarios]);

  // Load local scenarios on mount
  useEffect(() => {
    loadLocalScenarios();
  }, []);

  // Merge scenarios from both sources
  const savedScenarios = useMemo(() => {
    const globalForecasterScenarios = globalScenarios
      .filter(isWRVUForecasterScenario)
      .map(providerScenarioToWRVUForecasterScenario)
      .filter((s): s is WRVUForecasterScenario => s !== null);
    
    // Combine and deduplicate by ID (global takes precedence)
    const scenarioMap = new Map<string, WRVUForecasterScenario>();
    
    // Add local scenarios first
    localScenarios.forEach(s => scenarioMap.set(s.id, s));
    
    // Override with global scenarios (they take precedence)
    globalForecasterScenarios.forEach(s => scenarioMap.set(s.id, s));
    
    return Array.from(scenarioMap.values());
  }, [globalScenarios, localScenarios]);

  // Pre-fill name and check for existing scenario when dialog opens
  useEffect(() => {
    if (showSaveDialog && !scenarioName.trim()) {
      // Generate suggested name
      const providerName = inputs.providerName?.trim() || '';
      const specialty = inputs.specialty === 'Other' ? inputs.customSpecialty?.trim() : inputs.specialty?.trim() || '';
      
      let suggestedName = '';
      
      if (providerName && specialty) {
        suggestedName = `${providerName} - ${specialty}`;
      } else if (providerName) {
        suggestedName = `${providerName} - Forecast`;
      } else if (specialty) {
        suggestedName = `${specialty} - Forecast`;
      } else {
        suggestedName = 'WRVU Forecast';
      }
      
      setScenarioName(suggestedName);

      // Check for existing scenario matching providerName and specialty (check both local and global)
      const existing = savedScenarios.find(scenario => {
        const scenarioProviderName = scenario.providerName?.trim() || '';
        const scenarioSpecialty = scenario.specialty?.trim() || '';
        
        const providerMatch = !providerName || scenarioProviderName === providerName;
        const specialtyMatch = !specialty || scenarioSpecialty === specialty;
        
        // If both are provided, both must match; if only one, that one must match
        if (providerName && specialty) {
          return providerMatch && specialtyMatch;
        } else if (providerName) {
          return providerMatch;
        } else if (specialty) {
          return specialtyMatch;
        }
        
        return false;
      });

      if (existing) {
        setIsUpdating(true);
        setExistingScenarioId(existing.id);
        setScenarioName(existing.name);
      } else {
        setIsUpdating(false);
        setExistingScenarioId(null);
      }
    }
  }, [showSaveDialog, inputs.providerName, inputs.specialty, inputs.customSpecialty, savedScenarios, scenarioName]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!showSaveDialog) {
      setScenarioName('');
      setIsUpdating(false);
      setExistingScenarioId(null);
    }
  }, [showSaveDialog]);

  const loadLocalScenarios = () => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setLocalScenarios(JSON.parse(saved));
      }
    } catch (error) {
      // Error is already handled by storage utilities
    }
  };

  const handleSaveScenario = () => {
    if (!scenarioName.trim()) return;

    const scenarioData: WRVUForecasterScenario = {
      id: existingScenarioId || `wrvu-forecaster-${Date.now()}`,
      name: scenarioName.trim(),
      providerName: inputs.providerName,
      specialty: inputs.specialty === 'Other' ? inputs.customSpecialty : inputs.specialty,
      inputs: { ...inputs },
      metrics: { ...metrics },
      date: existingScenarioId 
        ? savedScenarios.find(s => s.id === existingScenarioId)?.date || new Date().toLocaleDateString()
        : new Date().toLocaleDateString(),
    };

    // Convert to ProviderScenario and save to global store
    const providerScenario = wrvuForecasterScenarioToProviderScenario(scenarioData);
    
    if (existingScenarioId && isUpdating) {
      // Update existing scenario in global store
      providerScenario.id = existingScenarioId;
      saveGlobalScenario(providerScenario);
      
      // Also update in local storage for backward compatibility
      const updatedLocalScenarios = localScenarios.map(s => 
        s.id === existingScenarioId ? scenarioData : s
      );
      setLocalScenarios(updatedLocalScenarios);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLocalScenarios));
    } else {
      // Add new scenario to global store
      saveGlobalScenario(providerScenario);
      
      // Also save to local storage for backward compatibility
      const updatedLocalScenarios = [...localScenarios, scenarioData];
      setLocalScenarios(updatedLocalScenarios);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLocalScenarios));
    }
    
    setScenarioName('');
    setIsUpdating(false);
    setExistingScenarioId(null);
    setShowSaveDialog(false);
  };

  const handleDeleteScenario = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Delete from global store if it exists there
    const globalScenario = globalScenarios.find(s => s.id === id && isWRVUForecasterScenario(s));
    if (globalScenario) {
      deleteGlobalScenario(id);
    }
    
    // Also delete from local storage for backward compatibility
    const updatedLocalScenarios = localScenarios.filter((s) => s.id !== id);
    setLocalScenarios(updatedLocalScenarios);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLocalScenarios));
  };

  return (
    <>
      {/* Action Buttons - Sticky at bottom on mobile, regular on desktop */}
      <div className="sm:mt-6 sm:pt-6 sm:pb-6 sm:border-t sm:border-gray-200 sm:dark:border-gray-800">
        <div className="fixed sm:static bottom-0 left-0 right-0 bg-gray-50 dark:bg-gray-900 border-t sm:border-t-0 border-gray-200 dark:border-gray-800 pt-4 pb-4 sm:pt-0 sm:pb-0 safe-area-inset-bottom z-50">
          <div className="flex flex-row items-center justify-center sm:justify-between gap-3 flex-wrap px-4 sm:px-0 max-w-4xl mx-auto">
            <div className="flex flex-row items-center justify-center gap-3 flex-wrap flex-1">
              <Button 
                onClick={() => setShowSaveDialog(true)}
                className="min-h-[44px] touch-target flex-1 sm:flex-initial"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              
              {onEmailReport && (
                <Button 
                  variant="outline" 
                  onClick={onEmailReport}
                  className="min-h-[44px] touch-target flex-1 sm:flex-initial"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
              )}
              
              {onPrint && (
                <Button 
                  variant="outline" 
                  onClick={onPrint}
                  className="hidden sm:inline-flex min-h-[44px] touch-target"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
              )}
            </div>
            
            {onStartOver && (
              <Button 
                variant="outline" 
                onClick={onStartOver}
                className="min-h-[44px] touch-target sm:ml-auto"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Start Over
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog.Root open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 max-w-md w-[90vw] max-h-[90vh] overflow-y-auto z-50 shadow-xl safe-area-inset">
            <Dialog.Title className="text-lg sm:text-xl font-bold mb-2">
              {isUpdating ? 'Update Scenario' : 'Save Current Scenario'}
            </Dialog.Title>
            <Dialog.Description className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
              {isUpdating 
                ? `Update the name or save as a new scenario. Current scenario: "${scenarioName}"`
                : 'Enter a name for this scenario to save the current settings and calculations.'}
            </Dialog.Description>
            <Input
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="Scenario name"
              className="mb-4 text-base sm:text-sm min-h-[44px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveScenario();
                }
              }}
            />
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <Dialog.Close asChild>
                <Button variant="outline" className="w-full sm:w-auto min-h-[44px] touch-target">Cancel</Button>
              </Dialog.Close>
              {isUpdating && (
                <Button 
                  onClick={() => {
                    setIsUpdating(false);
                    setExistingScenarioId(null);
                    // Regenerate suggested name
                    const providerName = inputs.providerName?.trim() || '';
                    const specialty = inputs.specialty === 'Other' ? inputs.customSpecialty?.trim() : inputs.specialty?.trim() || '';
                    let suggestedName = '';
                    if (providerName && specialty) {
                      suggestedName = `${providerName} - ${specialty}`;
                    } else if (providerName) {
                      suggestedName = `${providerName} - Forecast`;
                    } else if (specialty) {
                      suggestedName = `${specialty} - Forecast`;
                    } else {
                      suggestedName = 'WRVU Forecast';
                    }
                    setScenarioName(suggestedName);
                  }} 
                  variant="outline"
                  className="w-full sm:w-auto min-h-[44px] touch-target"
                >
                  Save as New
                </Button>
              )}
              <Button
                onClick={() => {
                  handleSaveScenario();
                }}
                disabled={!scenarioName.trim()}
                className="w-full sm:w-auto min-h-[44px] touch-target"
              >
                {isUpdating ? 'Update' : 'Save'}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

