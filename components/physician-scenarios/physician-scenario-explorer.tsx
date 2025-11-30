'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDebouncedLocalStorage } from '@/hooks/use-debounced-local-storage';
import { FTE, MarketBenchmarks, TCCComponent } from '@/types';
import { ConversionFactorModel } from '@/types/cf-models';
import { BenchmarkInputs } from '@/components/fmv/benchmark-inputs';
import { TCCComponentsGrid } from '@/components/fmv/tcc-components-grid';
import { CFModelSelector } from './cf-model-selector';
import { CFModelComparison } from './cf-model-comparison';
import { CFModelResults } from './cf-model-results';
import { useCFModelsStore } from '@/lib/store/cf-models-store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FTEInput } from '@/components/wrvu/fte-input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { calculateWRVUPercentile, calculateTCCPercentile, calculateCFPercentile } from '@/lib/utils/percentile';
import { normalizeTcc } from '@/lib/utils/normalization';
import { calculateIncentivePayWithModel, getCFModelSummary } from '@/lib/utils/cf-model-engine';
import { getAlignmentStatus } from '@/lib/utils/scenario-modeling';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip } from '@/components/ui/tooltip';
import * as Dialog from '@radix-ui/react-dialog';
import { Stethoscope, Plus, ChevronLeft, ChevronRight, AlertTriangle, X, Info } from 'lucide-react';
import { MarketDataSaveAllButton } from '@/components/fmv/market-data-save-all-button';
import { 
  loadMarketData, 
  getSavedSpecialties
} from '@/lib/utils/market-data-storage';
import { cn } from '@/lib/utils/cn';

const STORAGE_KEY = 'physicianScenarioExplorerDraftState';

const SPECIALTIES = [
  // Primary Care / Hospital Medicine
  'Family Medicine',
  'Internal Medicine',
  'Hospitalist',
  'Pediatrics',
  // Procedural / Surgical
  'Anesthesiology',
  'General Surgery',
  'Orthopedic Surgery',
  'Neurosurgery',
  'Trauma Surgery',
  'Cardiothoracic Surgery',
  'Vascular Surgery',
  'Urology',
  'OB/GYN',
  'ENT (Otolaryngology)',
  'Ophthalmology',
  // Medical Subspecialties
  'Cardiology',
  'Critical Care',
  'Emergency Medicine',
  'Gastroenterology',
  'Nephrology',
  'Neurology',
  'Pulmonology',
  'Radiology',
  // Other
  'Psychiatry',
  'Pathology',
  'Other',
];

/**
 * CF Modelling Screen
 * 
 * Simple CF modeling tool that shows how wRVU percentiles align with TCC percentiles.
 * 
 * Flow:
 * 1. Context: Provider information
 * 2. Market Data: Enter market percentiles (wRVU, TCC, CF)
 * 3. Model Type: Select CF model type (flat, tiered, etc.)
 * 4. Inputs: Enter wRVUs and configure CF model
 * 5. Results: See wRVU percentile and final TCC percentile
 */
export function PhysicianScenarioExplorer() {
  const [activeTab, setActiveTab] = useState<string>('setup');
  const [specialty, setSpecialty] = useState<string | undefined>(undefined);
  const [customSpecialty, setCustomSpecialty] = useState<string>('');
  const [fte, setFte] = useState<FTE>(1.0);
  const [marketBenchmarks, setMarketBenchmarks] = useState<MarketBenchmarks>({});
  const [savedSpecialties, setSavedSpecialties] = useState<string[]>([]);
  const [cfModel, setCfModel] = useState<ConversionFactorModel>({
    modelType: 'single',
    parameters: { cf: 0 },
  });
  const [tccComponents, setTccComponents] = useState<TCCComponent[]>([
    {
      id: 'base-salary',
      label: 'Base Salary',
      type: 'Base Salary',
      amount: 0,
      fixedAmount: 0,
      calculationMethod: 'fixed',
    },
  ]);
  const [wrvus, setWrvus] = useState<number>(0);
  const [showAddModelDialog, setShowAddModelDialog] = useState(false);
  const [newModelName, setNewModelName] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Helper function to get formatted model type name
  const getModelTypeName = (modelType: string): string => {
    switch (modelType) {
      case 'single':
        return 'Flat';
      case 'tiered':
        return 'Tiered';
      case 'percentile-tiered':
        return 'Percentile Tiered';
      case 'budget-neutral':
        return 'Budget Neutral';
      case 'quality-weighted':
        return 'Quality Weighted';
      case 'fte-adjusted':
        return 'FTE Adjusted';
      default:
        return 'CF Model';
    }
  };

  // Set default model name when dialog opens
  useEffect(() => {
    if (showAddModelDialog) {
      const defaultName = getModelTypeName(cfModel.modelType);
      setNewModelName(defaultName);
    }
  }, [showAddModelDialog, cfModel.modelType]);

  const { addModel, loadModels, setActiveModel, activeModelId, getModel, models } = useCFModelsStore();

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  // Load active model when it changes
  useEffect(() => {
    if (activeModelId) {
      const activeModel = getModel(activeModelId);
      if (activeModel) {
        setCfModel(activeModel.model);
      }
    }
  }, [activeModelId, getModel]);

  // Load saved specialties on mount and refresh function
  const refreshSavedSpecialties = useCallback(() => {
    const saved = getSavedSpecialties('wrvu');
    setSavedSpecialties(saved);
  }, []);

  useEffect(() => {
    refreshSavedSpecialties();
  }, [refreshSavedSpecialties]);

  // Auto-load market data when specialty changes
  useEffect(() => {
    if (!specialty || specialty === 'Other') return;
    
    const effectiveSpecialty = specialty === 'Other' ? customSpecialty : specialty;
    if (!effectiveSpecialty) return;

    // Load wRVU data
    const wrvuData = loadMarketData(effectiveSpecialty, 'wrvu');
    // Load TCC data
    const tccData = loadMarketData(effectiveSpecialty, 'tcc');
    // Load CF data
    const cfData = loadMarketData(effectiveSpecialty, 'cf');

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
  }, [specialty, customSpecialty]);

  // Handle loading saved specialty
  const handleLoadSavedSpecialty = (savedSpecialty: string) => {
    setSpecialty(savedSpecialty);
    setCustomSpecialty('');
    
    // Load all market data for this specialty
    const wrvuData = loadMarketData(savedSpecialty, 'wrvu');
    const tccData = loadMarketData(savedSpecialty, 'tcc');
    const cfData = loadMarketData(savedSpecialty, 'cf');

    const loadedBenchmarks: MarketBenchmarks = {
      ...(wrvuData || {}),
      ...(tccData || {}),
      ...(cfData || {}),
    };

    if (Object.keys(loadedBenchmarks).length > 0) {
      setMarketBenchmarks(loadedBenchmarks);
    }
  };

  // Get effective specialty name (for saving)
  const effectiveSpecialty = specialty === 'Other' ? customSpecialty : (specialty || '');

  // Calculate total fixed compensation from TCC components
  const fixedComp = useMemo(() => {
    return tccComponents.reduce((sum, component) => sum + (component.amount || 0), 0);
  }, [tccComponents]);

  // Auto-save draft state
  const draftState = {
    specialty,
    customSpecialty,
    fte,
    marketBenchmarks,
    cfModel,
    tccComponents,
    wrvus,
  };
  useDebouncedLocalStorage(STORAGE_KEY, draftState);

  // Load draft state on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        setSpecialty(draft.specialty || undefined);
        setCustomSpecialty(draft.customSpecialty || '');
        setFte(draft.fte || 1.0);
        setMarketBenchmarks(draft.marketBenchmarks || {});
        setCfModel(draft.cfModel || { modelType: 'single', parameters: { cf: 0 } });
        setTccComponents(draft.tccComponents || [
          {
            id: 'base-salary',
            label: 'Base Salary',
            type: 'Base Salary',
            amount: 0,
            fixedAmount: 0,
            calculationMethod: 'fixed',
          },
        ]);
        setWrvus(draft.wrvus || 0);
      }
    } catch (error) {
      console.error('Error loading draft state:', error);
    }
  }, []);

  // Calculate results
  const results = useMemo(() => {
    if (wrvus <= 0 || !marketBenchmarks.wrvu25 || !marketBenchmarks.tcc25) {
      return null;
    }

    // Calculate clinical dollars from CF model
    // Incentives are only paid when wRVUs × CF exceeds fixed compensation
    // calculateIncentivePayWithModel returns (wRVUs × CF) - basePay
    const incentivePay = calculateIncentivePayWithModel(
      wrvus,
      cfModel,
      fixedComp, // Use fixedComp as basePay - incentives only when wRVUs × CF > fixedComp
      fte,
      marketBenchmarks
    );
    // Clinical dollars is the positive incentive pay (only when wRVUs × CF exceeds fixed comp)
    const positiveClinicalDollars = Math.max(0, incentivePay);

    // Calculate modeled TCC
    const modeledTcc = fixedComp + positiveClinicalDollars;

    // Normalize to 1.0 FTE for percentile calculation
    // Market data is entered at 1.0 FTE, so we must normalize inputs to 1.0 FTE for comparison
    const normalizedWrvus = wrvus / (fte || 1.0);
    const normalizedTcc = normalizeTcc(modeledTcc, fte);

    // Calculate percentiles
    const wrvuPercentile = calculateWRVUPercentile(normalizedWrvus, marketBenchmarks);
    const tccPercentile = calculateTCCPercentile(normalizedTcc, marketBenchmarks);
    
    // Calculate effective CF: Total Cash Compensation / wRVUs
    // This represents the blended rate including both fixed and variable components
    const effectiveCF = wrvus > 0 ? modeledTcc / wrvus : 0;
    const cfPercentile = (marketBenchmarks.cf25 || marketBenchmarks.cf50 || marketBenchmarks.cf75 || marketBenchmarks.cf90)
      ? calculateCFPercentile(effectiveCF, marketBenchmarks)
      : null;

    // Calculate alignment status (incorporates FMV compliance thresholds)
    const alignmentStatus = getAlignmentStatus(wrvuPercentile, tccPercentile);

    // Calculate FMV risk level based on absolute TCC percentile
    let fmvRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | null = null;
    if (tccPercentile > 90) {
      fmvRiskLevel = 'HIGH';
    } else if (tccPercentile >= 75 && tccPercentile <= 90) {
      fmvRiskLevel = 'MODERATE';
    } else if (tccPercentile < 75) {
      fmvRiskLevel = 'LOW';
    }

    return {
      wrvuPercentile,
      tccPercentile,
      cfPercentile,
      modeledTcc,
      clinicalDollars: positiveClinicalDollars,
      effectiveCF,
      alignmentStatus,
      fmvRiskLevel,
      alignmentDelta: Math.abs(tccPercentile - wrvuPercentile),
    };
  }, [wrvus, cfModel, fixedComp, fte, marketBenchmarks]);

  // Handle adding a model
  const handleAddModel = () => {
    if (!results) {
      alert('Please enter market benchmark data in the Setup tab to calculate results before saving the model.');
      return;
    }
    
    const effectiveSpecialty = specialty === 'Other' ? customSpecialty : (specialty || '');
    const modelName = newModelName.trim() || `CF Model ${new Date().toLocaleDateString()}`;
    
    const savedModel = {
      id: `cf-model-${Date.now()}`,
      name: modelName,
      model: cfModel,
      specialty: effectiveSpecialty || undefined,
      fte,
      wrvus,
      tccComponents,
      marketBenchmarks,
      results: {
        ...results,
        alignmentDelta: Math.abs(results.tccPercentile - results.wrvuPercentile),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addModel(savedModel);
    setNewModelName('');
    setShowAddModelDialog(false);
    // Stay on modeling screen after adding model
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6">
      <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto pt-6 sm:pt-8 md:pt-10 pb-4 sm:pb-6 md:pb-8">
        {/* Page Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
              CF Modelling
            </h1>
            <Tooltip 
              content="Model conversion factors and see how wRVU percentiles align with TCC percentiles."
              side="right"
            >
              <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
            </Tooltip>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {toastMessage}
              </p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Apple-style Tab Navigation */}
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => {
            // Check if wRVUs are required for this tab
            if ((value === 'results' || value === 'comparison') && wrvus <= 0) {
              setToastMessage('Please enter Annual wRVUs in the Setup tab to view results and comparisons.');
              return;
            }
            // Provider Compare tab doesn't require wRVUs - it's a standalone comparison tool
            setActiveTab(value);
            // Clear toast when switching to a valid tab
            if (toastMessage) {
              setToastMessage(null);
            }
          }} 
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="setup" className="text-sm font-medium">
              Setup
            </TabsTrigger>
            <TabsTrigger value="modeling" className="text-sm font-medium">
              Modeling
            </TabsTrigger>
            <TabsTrigger value="comparison" className="text-sm font-medium">
              Comparison
            </TabsTrigger>
            <TabsTrigger value="results" className="text-sm font-medium">
              Results
            </TabsTrigger>
          </TabsList>

          {/* Setup Tab */}
          <TabsContent value="setup" className="space-y-6 mt-0">
            {/* Context: Provider Information */}
            <Card className="border-2">
              <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Specialty Selection */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Stethoscope className="w-4 h-4" />
                  Specialty
                </Label>
                
                {/* Quick Load Saved Specialties */}
                {savedSpecialties.length > 0 && (
                  <div className="mb-3 -mt-2">
                    <Label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block">
                      Quick load saved market data:
                    </Label>
                    {savedSpecialties.length <= 5 ? (
                      // For 5 or fewer: Show buttons (quick access)
                      <div className="flex flex-wrap gap-2">
                        {savedSpecialties.map((savedSpec) => {
                          const currentSpecialty = specialty === 'Other' ? customSpecialty : specialty;
                          const isActive = currentSpecialty === savedSpec;
                          return (
                            <button
                              key={savedSpec}
                              type="button"
                              onClick={() => handleLoadSavedSpecialty(savedSpec)}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
                                "min-h-[32px] touch-manipulation",
                                isActive
                                  ? "bg-primary text-white shadow-sm"
                                  : "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
                              )}
                            >
                              {savedSpec}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      // For 6+: Show first 5 as buttons, then indicate more
                      <div className="flex flex-wrap gap-2">
                        {savedSpecialties.slice(0, 5).map((savedSpec) => {
                          const currentSpecialty = specialty === 'Other' ? customSpecialty : specialty;
                          const isActive = currentSpecialty === savedSpec;
                          return (
                            <button
                              key={savedSpec}
                              type="button"
                              onClick={() => handleLoadSavedSpecialty(savedSpec)}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
                                "min-h-[32px] touch-manipulation",
                                isActive
                                  ? "bg-primary text-white shadow-sm"
                                  : "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
                              )}
                            >
                              {savedSpec}
                            </button>
                          );
                        })}
                        <span className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          +{savedSpecialties.length - 5} more
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                <Select
                  value={specialty || undefined}
                  onValueChange={(value) => {
                    setSpecialty(value);
                    setCustomSpecialty(value !== 'Other' ? '' : customSpecialty);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectGroup>
                      <SelectLabel>Primary Care / Hospital Medicine</SelectLabel>
                      {SPECIALTIES.slice(0, 4).map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>Procedural / Surgical</SelectLabel>
                      {SPECIALTIES.slice(4, 15).map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>Medical Subspecialties</SelectLabel>
                      {SPECIALTIES.slice(15, 23).map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>Other</SelectLabel>
                      {SPECIALTIES.slice(23).map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom Specialty - appears when "Other" is selected */}
            {specialty === 'Other' && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Custom Specialty</Label>
                <Input
                  type="text"
                  value={customSpecialty}
                  onChange={(e) => setCustomSpecialty(e.target.value)}
                  placeholder="Enter specialty name"
                  icon={<Stethoscope className="w-5 h-5" />}
                />
              </div>
            )}

            {/* FTE and Annual wRVUs - side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="w-full">
                <FTEInput value={fte} onChange={setFte} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Annual wRVUs</Label>
                <NumberInput
                  value={wrvus}
                  onChange={setWrvus}
                  placeholder="Enter annual wRVUs"
                  min={0}
                  step={0.01}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Productivity level to test against market benchmarks
                </p>
              </div>
            </div>
            
            {/* TCC Components - no duplicate label, TCCComponentsGrid has its own */}
            <TCCComponentsGrid
              components={tccComponents}
              onComponentsChange={setTccComponents}
            />
          </CardContent>
        </Card>

        {/* Market Data */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Market Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <BenchmarkInputs
                benchmarks={marketBenchmarks}
                onBenchmarksChange={setMarketBenchmarks}
                type="wrvu"
              />
            </div>
            
            <div className="space-y-3">
              <BenchmarkInputs
                benchmarks={marketBenchmarks}
                onBenchmarksChange={setMarketBenchmarks}
                type="tcc"
              />
            </div>
            
            <div className="space-y-3">
              <BenchmarkInputs
                benchmarks={marketBenchmarks}
                onBenchmarksChange={setMarketBenchmarks}
                type="cf"
              />
            </div>

            {/* Single Save Button for All Market Data */}
            {effectiveSpecialty && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <MarketDataSaveAllButton
                  specialty={effectiveSpecialty}
                  benchmarks={marketBenchmarks}
                  onSave={refreshSavedSpecialties}
                />
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          {/* Modeling Tab */}
          <TabsContent value="modeling" className="mt-0">
            <Card className="border-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                CF Model
              </CardTitle>
              {wrvus > 0 && cfModel && (
                <Button 
                  onClick={() => setShowAddModelDialog(true)} 
                  variant="outline" 
                  size="sm"
                  className="min-h-[36px] touch-manipulation"
                >
                  <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="hidden sm:inline">Add Model</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quick Load Saved Models */}
            {models.length > 0 && (
              <div className="mb-4">
                <Label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block">
                  Quick load saved models:
                </Label>
                {models.length <= 5 ? (
                  // For 5 or fewer: Show buttons (quick access)
                  <div className="flex flex-wrap gap-2">
                    {models.map((savedModel) => {
                      const isActive = activeModelId === savedModel.id;
                      return (
                        <button
                          key={savedModel.id}
                          type="button"
                          onClick={() => {
                            setActiveModel(savedModel.id);
                            setCfModel(savedModel.model);
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
                            "min-h-[32px] touch-manipulation",
                            isActive
                              ? "bg-primary text-white shadow-sm"
                              : "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
                          )}
                        >
                          {savedModel.name}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  // For 6+: Show first 5 as buttons, then indicate more
                  <div className="flex flex-wrap gap-2">
                    {models.slice(0, 5).map((savedModel) => {
                      const isActive = activeModelId === savedModel.id;
                      return (
                        <button
                          key={savedModel.id}
                          type="button"
                          onClick={() => {
                            setActiveModel(savedModel.id);
                            setCfModel(savedModel.model);
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
                            "min-h-[32px] touch-manipulation",
                            isActive
                              ? "bg-primary text-white shadow-sm"
                              : "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
                          )}
                        >
                          {savedModel.name}
                        </button>
                      );
                    })}
                    <span className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      +{models.length - 5} more
                    </span>
                  </div>
                )}
              </div>
            )}
            
            <CFModelSelector
              model={cfModel}
              onModelChange={setCfModel}
              fte={fte}
              marketBenchmarks={marketBenchmarks}
              wrvus={wrvus}
              tccComponents={tccComponents}
            />
            
            {/* Live CF Preview */}
            {wrvus > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 block">
                  Live Preview
                </Label>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(() => {
                      // Calculate Total Cash Compensation for effective CF
                      const fixedComp = tccComponents.reduce((sum, comp) => sum + (comp.amount || 0), 0);
                      const incentivePay = calculateIncentivePayWithModel(
                        wrvus,
                        cfModel,
                        fixedComp,
                        fte,
                        marketBenchmarks
                      );
                      const clinicalDollars = Math.max(0, incentivePay);
                      const totalTcc = fixedComp + clinicalDollars;
                      
                      // Effective CF = Total Cash Compensation / wRVUs
                      const effectiveCF = wrvus > 0 ? totalTcc / wrvus : 0;
                      const cfPercentile = (marketBenchmarks.cf25 || marketBenchmarks.cf50 || marketBenchmarks.cf75 || marketBenchmarks.cf90)
                        ? calculateCFPercentile(effectiveCF, marketBenchmarks)
                        : null;
                      
                      return (
                        <>
                          <div className="flex flex-col">
                            <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              Effective CF
                            </Label>
                            <div className="text-xl font-semibold text-gray-900 dark:text-white">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(effectiveCF)}/wRVU
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              (Fixed + Incentives) / wRVUs
                            </p>
                          </div>
                          {cfPercentile !== null && (
                            <div className="flex flex-col">
                              <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                CF Percentile
                              </Label>
                              <div className="text-xl font-semibold text-gray-900 dark:text-white">
                                {cfPercentile >= 90 ? '>90th' : `${Math.round(cfPercentile)}th`}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {cfPercentile >= 50 ? 'Above' : 'Below'} market median
                              </p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  {wrvus > 0 && !marketBenchmarks.wrvu25 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
                      Enter wRVU market data to see percentile calculations
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {/* Add Model Button - Mobile-friendly bottom placement */}
            {wrvus > 0 && cfModel && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  onClick={() => setShowAddModelDialog(true)} 
                  className="w-full min-h-[48px] touch-manipulation"
                  size="lg"
                  disabled={!results}
                >
                  <Plus className="w-5 h-5 mr-2 flex-shrink-0" />
                  Save This Model
                </Button>
                {!results && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Enter market data in Setup to see results and save model
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="mt-0">
            <CFModelComparison
              wrvus={wrvus}
              fte={fte}
              fixedComp={fixedComp}
              marketBenchmarks={marketBenchmarks}
              onViewDetails={(modelId) => {
                // Set the active model and switch to Results tab
                setActiveModel(modelId);
                setActiveTab('results');
              }}
              onEditModel={(modelId) => {
                // Set the active model and switch to Modeling tab
                setActiveModel(modelId);
                setActiveTab('modeling');
              }}
            />
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="mt-0">
            {results ? (
              <>
                <CFModelResults
                  cfModel={cfModel}
                  wrvus={wrvus}
                  fte={fte}
                  fixedComp={fixedComp}
                  tccComponents={tccComponents}
                  marketBenchmarks={marketBenchmarks}
                  results={results}
                  onAddModel={() => setShowAddModelDialog(true)}
                  showAddButton={true}
                />
              </>
            ) : (
              <Card className="border-2">
                <CardContent className="p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    Complete Setup and Modeling sections to see results.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Add Model Dialog - Accessible from all tabs */}
        <Dialog.Root open={showAddModelDialog} onOpenChange={setShowAddModelDialog}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-lg w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto z-[101] shadow-2xl animate-in fade-in zoom-in-95 duration-300">
              <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Save CF Model
              </Dialog.Title>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Model Name</Label>
                  <Input
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    placeholder={`CF Model ${new Date().toLocaleDateString()}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddModel();
                      }
                    }}
                  />
                </div>
                {results && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Model Summary:</strong> {getCFModelSummary(cfModel)}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Alignment: {results.alignmentStatus} ({Math.abs(results.tccPercentile - results.wrvuPercentile).toFixed(1)}% difference)
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowAddModelDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddModel}>
                  <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                  Add Model
                </Button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Bottom Navigation Buttons */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 pt-4 pb-4 sm:pb-6 border-t border-gray-200 dark:border-gray-800 safe-area-inset-bottom z-10 mt-8">
          <div className="flex items-center justify-between gap-3 max-w-4xl mx-auto px-4 sm:px-6">
            <Button
              variant="outline"
              onClick={() => {
                const tabs = ['setup', 'modeling', 'comparison', 'results'];
                const currentIndex = tabs.indexOf(activeTab);
                if (currentIndex > 0) {
                  setActiveTab(tabs[currentIndex - 1]);
                }
              }}
              disabled={activeTab === 'setup'}
              className="min-h-[48px] min-w-[120px]"
            >
              <ChevronLeft className="w-4 h-4 mr-2 flex-shrink-0" />
              Back
            </Button>
            
            <Button
              onClick={() => {
                const tabs = ['setup', 'modeling', 'comparison', 'results'];
                const currentIndex = tabs.indexOf(activeTab);
                const nextTab = tabs[currentIndex + 1];
                
                // Check if wRVUs are required for next tab
                if ((nextTab === 'results' || nextTab === 'comparison') && wrvus <= 0) {
                  setToastMessage('Please enter Annual wRVUs in the Setup tab to view results and comparisons.');
                  return;
                }
                
                if (currentIndex < tabs.length - 1) {
                  setActiveTab(nextTab);
                }
              }}
              disabled={activeTab === 'comparison'}
              className="min-h-[48px] min-w-[140px] ml-auto"
            >
              {activeTab === 'comparison' ? 'View Results' : 'Continue'}
              <ChevronRight className="w-4 h-4 ml-2 flex-shrink-0" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
