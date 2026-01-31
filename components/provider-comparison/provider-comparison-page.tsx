'use client';

import { useState, useEffect } from 'react';
import { ProviderComparison } from '@/components/physician-scenarios/provider-comparison';
import { MarketBenchmarks, ProviderScenario, ProviderComparisonScenarioData, FTE } from '@/types';
import { ConversionFactorModel } from '@/types/cf-models';
import { SpecialtyInput } from '@/components/fmv/specialty-input';
import { BenchmarkInputs } from '@/components/fmv/benchmark-inputs';
import { MarketDataSaveAllButton } from '@/components/fmv/market-data-save-all-button';
import { ScenarioLoader } from '@/components/scenarios/scenario-loader';
import { useScenariosStore } from '@/lib/store/scenarios-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip } from '@/components/ui/tooltip';
import * as Dialog from '@radix-ui/react-dialog';
import { Info, ChevronDown, ChevronUp, Save, Loader2, RotateCcw } from 'lucide-react';
import { 
  loadMarketData
} from '@/lib/utils/market-data-storage';

interface ProviderInput {
  id: string;
  name: string;
  basePay: number;
  cfModel: ConversionFactorModel;
  wrvus: number;
  fte: FTE;
}

export function ProviderComparisonPageContent() {
  const { saveScenario, loadScenarios, updateScenario, getScenario } = useScenariosStore();
  const [specialty, setSpecialty] = useState<string>('');
  const [marketBenchmarks, setMarketBenchmarks] = useState<MarketBenchmarks>({});
  const [showManualEntry, setShowManualEntry] = useState<boolean>(false);
  const [providers, setProviders] = useState<ProviderInput[]>([
    {
      id: 'provider-1',
      name: 'Provider A',
      basePay: 300000,
      cfModel: {
        modelType: 'single',
        parameters: { cf: 50 },
      },
      wrvus: 6000,
      fte: 1.0,
    },
    {
      id: 'provider-2',
      name: 'Provider B',
      basePay: 300000,
      cfModel: {
        modelType: 'single',
        parameters: { cf: 55 },
      },
      wrvus: 7000,
      fte: 1.0,
    },
  ]);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load scenarios on mount
  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  // Auto-load market data when specialty changes
  useEffect(() => {
    if (!specialty || specialty === 'Other') return;
    
    // Load market data asynchronously
    const loadData = async () => {
      const [wrvuData, tccData, cfData] = await Promise.all([
        loadMarketData(specialty, 'wrvu'),
        loadMarketData(specialty, 'tcc'),
        loadMarketData(specialty, 'cf'),
      ]);

      // Merge all loaded data
      const loadedBenchmarks: MarketBenchmarks = {
        ...(wrvuData || {}),
        ...(tccData || {}),
        ...(cfData || {}),
      };

      // Only update if we have some data
      if (Object.keys(loadedBenchmarks).length > 0) {
        setMarketBenchmarks(loadedBenchmarks);
      }
    };
    
    loadData();
  }, [specialty]);

  // Pre-fill name when dialog opens
  useEffect(() => {
    if (showSaveDialog) {
      if (activeScenarioId) {
        const scenario = getScenario(activeScenarioId);
        setScenarioName(scenario?.name || '');
      } else {
        // Suggest a name based on current state
        const specialtyName = specialty || 'Provider Comparison';
        setScenarioName(`${specialtyName} ${new Date().getFullYear()}`);
      }
    }
  }, [showSaveDialog, activeScenarioId, getScenario, specialty]);

  // Handle loading a scenario
  const handleLoadScenario = (scenario: ProviderScenario) => {
    if (scenario.providerComparisonData) {
      setProviders(scenario.providerComparisonData.providers);
      setMarketBenchmarks(scenario.providerComparisonData.marketBenchmarks || {});
      if (scenario.providerComparisonData.specialty) {
        setSpecialty(scenario.providerComparisonData.specialty);
      }
      setActiveScenarioId(scenario.id);
    }
  };

  // Handle saving as new scenario
  const handleSaveAsNew = async () => {
    if (!scenarioName.trim()) return;

    setIsSaving(true);
    try {
      const scenarioData: ProviderComparisonScenarioData = {
        providers,
        marketBenchmarks,
        specialty: specialty || undefined,
      };

      const scenario: ProviderScenario = {
        id: `provider-comparison-${Date.now()}`,
        name: scenarioName.trim(),
        scenarioType: 'provider-comparison',
        specialty: specialty || undefined,
        fte: 1.0, // Default for compatibility
        annualWrvus: providers.reduce((sum, p) => sum + p.wrvus, 0) / providers.length, // Average for compatibility
        tccComponents: [],
        marketBenchmarks,
        providerComparisonData: scenarioData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveScenario(scenario);
      setActiveScenarioId(scenario.id);
      setShowSaveDialog(false);
      setScenarioName('');
    } catch (error) {
      console.error('Error saving scenario:', error);
      alert('Failed to save scenario. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle updating existing scenario
  const handleUpdateScenario = async () => {
    if (!activeScenarioId || !scenarioName.trim()) return;

    setIsSaving(true);
    try {
      const existing = getScenario(activeScenarioId);
      if (!existing) {
        alert('Scenario not found. Please save as new.');
        setIsSaving(false);
        return;
      }

      const scenarioData: ProviderComparisonScenarioData = {
        providers,
        marketBenchmarks,
        specialty: specialty || undefined,
      };

      const updatedScenario: ProviderScenario = {
        ...existing,
        name: scenarioName.trim(),
        specialty: specialty || undefined,
        marketBenchmarks,
        providerComparisonData: scenarioData,
        updatedAt: new Date().toISOString(),
      };

      updateScenario(activeScenarioId, updatedScenario);
      setShowSaveDialog(false);
      setScenarioName('');
    } catch (error) {
      console.error('Error updating scenario:', error);
      alert('Failed to update scenario. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6">
      <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto pt-6 sm:pt-8 md:pt-10 pb-4 sm:pb-6 md:pb-8">
        {/* Page Title */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                Provider Comparison
              </h1>
              <Tooltip 
                content="Quickly compare two providers side-by-side with different pay, CF models, and productivity levels to see how they calculate incentives and total cash compensation."
                side="right"
              >
                <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              <ScenarioLoader
                scenarioType="provider-comparison"
                onLoad={handleLoadScenario}
              />
            </div>
          </div>
        </div>

        {/* Specialty Selection - Optional but helpful for market data */}
        <Card className="border-2 mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Market Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Specialty</Label>
                <SpecialtyInput
                  metricType="wrvu"
                  specialty={specialty}
                  onSpecialtyChange={setSpecialty}
                  onMarketDataLoad={setMarketBenchmarks}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Select a specialty to load market benchmarks. This enables percentile calculations and alignment status. The comparison works without market data, but results will be more limited.
                </p>
              </div>

              {/* Manual Entry Toggle */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  onClick={() => setShowManualEntry(!showManualEntry)}
                  className="w-full justify-between text-sm"
                >
                  <span>Enter market data manually</span>
                  {showManualEntry ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>

                {showManualEntry && (
                  <div className="mt-4 space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <BenchmarkInputs
                      benchmarks={marketBenchmarks}
                      onBenchmarksChange={setMarketBenchmarks}
                      type="wrvu"
                    />
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
                    {specialty && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <MarketDataSaveAllButton
                          specialty={specialty}
                          benchmarks={marketBenchmarks}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Provider Comparison Component */}
        <ProviderComparison 
          marketBenchmarks={marketBenchmarks}
          providers={providers}
          onProvidersChange={setProviders}
        />

        {/* Action Buttons */}
        <div className="bg-gray-50 dark:bg-gray-900 pt-4 pb-4 border-t border-gray-200 dark:border-gray-800 mt-6">
          <div className="flex flex-row items-center justify-center sm:justify-between gap-3 flex-wrap px-4 sm:px-0 max-w-4xl mx-auto">
              <Button 
                onClick={() => setShowSaveDialog(true)}
                className="min-h-[44px] touch-target flex-1 sm:flex-initial"
              >
                <Save className="w-4 h-4 mr-2 flex-shrink-0" />
                Save
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  // Reset to default providers
                  setProviders([
                    {
                      id: 'provider-1',
                      name: 'Provider A',
                      basePay: 300000,
                      cfModel: {
                        modelType: 'single',
                        parameters: { cf: 50 },
                      },
                      wrvus: 6000,
                      fte: 1.0,
                    },
                    {
                      id: 'provider-2',
                      name: 'Provider B',
                      basePay: 300000,
                      cfModel: {
                        modelType: 'single',
                        parameters: { cf: 55 },
                      },
                      wrvus: 7000,
                      fte: 1.0,
                    },
                  ]);
                  setSpecialty('');
                  setMarketBenchmarks({});
                  setActiveScenarioId(null);
                  setShowManualEntry(false);
                }}
                className="min-h-[44px] touch-target flex-1 sm:flex-initial"
              >
                <RotateCcw className="w-4 h-4 mr-2 flex-shrink-0" />
                Start Over
              </Button>
            </div>
        </div>

        {/* Save Scenario Dialog */}
        <Dialog.Root open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[100]" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 max-w-md w-[90vw] max-h-[90vh] overflow-y-auto z-[100] shadow-xl safe-area-inset">
              <Dialog.Title className="text-lg sm:text-xl font-bold mb-2 text-gray-900 dark:text-white">
                {activeScenarioId ? 'Update Scenario' : 'Save Current Scenario'}
              </Dialog.Title>
              <Dialog.Description className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
                {activeScenarioId
                  ? `Update the name or save as a new scenario. Current scenario: "${scenarioName}"`
                  : 'Enter a name for this scenario to save the current comparison settings.'}
              </Dialog.Description>
              <Input
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="Scenario name"
                className="mb-4 text-base sm:text-sm min-h-[44px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && scenarioName.trim()) {
                    if (activeScenarioId) {
                      handleUpdateScenario();
                    } else {
                      handleSaveAsNew();
                    }
                  }
                }}
              />
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <Dialog.Close asChild>
                  <Button variant="outline" className="w-full sm:w-auto min-h-[44px] touch-target">
                    Cancel
                  </Button>
                </Dialog.Close>
                {activeScenarioId && (
                  <Button 
                    onClick={() => {
                      setActiveScenarioId(null);
                      // Regenerate suggested name
                      const specialtyName = specialty || 'Provider Comparison';
                      setScenarioName(`${specialtyName} ${new Date().getFullYear()}`);
                    }} 
                    variant="outline"
                    className="w-full sm:w-auto min-h-[44px] touch-target"
                  >
                    Save as New
                  </Button>
                )}
                <Button
                  onClick={activeScenarioId ? handleUpdateScenario : handleSaveAsNew}
                  disabled={!scenarioName.trim() || isSaving}
                  className="w-full sm:w-auto min-h-[44px] touch-target"
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
      </div>
    </div>
  );
}

