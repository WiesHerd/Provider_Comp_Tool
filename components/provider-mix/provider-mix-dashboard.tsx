'use client';

import { useState, useEffect, useMemo } from 'react';
import { useDebouncedLocalStorage } from '@/hooks/use-debounced-local-storage';
import { Provider, ProviderAnalysis, ProviderProfile, GroupSummary } from '@/types/provider-mix';
import { ConversionFactorModel } from '@/types/cf-models';
import { MarketBenchmarks } from '@/types';
import { SpecialtyInput } from '@/components/fmv/specialty-input';
import { CFModelSelector } from '@/components/physician-scenarios/cf-model-selector';
import { ProviderConfiguration } from './provider-configuration';
import { NonClinicalCompensationInput } from './non-clinical-compensation';
import { ProviderVariabilityDashboard } from './provider-variability-dashboard';
import { ProviderProfileExport } from './provider-profile-export';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  calculateProviderAnalysis,
  generateProviderProfile,
  calculateGroupSummary,
} from '@/lib/utils/provider-mix';
import { Tooltip } from '@/components/ui/tooltip';
import { Users, DollarSign, TrendingUp, AlertCircle, Info } from 'lucide-react';

const STORAGE_KEY = 'providerMixDashboardDraftState';

export function ProviderMixDashboard() {
  const [activeTab, setActiveTab] = useState<string>('setup');
  const [specialty, setSpecialty] = useState<string>('');
  const [modelYear, setModelYear] = useState<number>(new Date().getFullYear());
  // Default values for new providers (can be overridden per provider)
  const [defaultBasePay, setDefaultBasePay] = useState<number>(0);
  const [defaultCfModel, setDefaultCfModel] = useState<ConversionFactorModel>({
    modelType: 'single',
    parameters: { cf: 0 },
  });
  const [providers, setProviders] = useState<Provider[]>([
    {
      id: 'provider-1',
      name: '',
      role: 'Clinical',
      basePay: 0,
      cfModel: {
        modelType: 'single',
        parameters: { cf: 0 },
      },
      clinicalFTE: 1.0,
      adminFTE: 0,
      callBurden: false,
      actualWrvus: undefined,
      notes: '',
    },
  ]);
  const [marketBenchmarks, setMarketBenchmarks] = useState<MarketBenchmarks>({});
  const [includeCallPay, setIncludeCallPay] = useState<boolean>(false);

  // Auto-save draft state
  const draftState = {
    activeTab,
    specialty,
    modelYear,
    defaultBasePay,
    defaultCfModel,
    providers,
    marketBenchmarks,
    includeCallPay,
  };
  useDebouncedLocalStorage(STORAGE_KEY, draftState);

  // Load draft state on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        setActiveTab(draft.activeTab || 'setup');
        setSpecialty(draft.specialty || '');
        setModelYear(draft.modelYear || new Date().getFullYear());
        setDefaultBasePay(draft.defaultBasePay || draft.basePay || 0); // Support old format
        setDefaultCfModel(draft.defaultCfModel || draft.cfModel || { modelType: 'single', parameters: { cf: 0 } }); // Support old format
        // Migrate old providers to new format if needed
        const migratedProviders = (draft.providers || []).map((p: any) => ({
          ...p,
          basePay: p.basePay ?? draft.basePay ?? 0,
          cfModel: p.cfModel ?? draft.cfModel ?? { modelType: 'single', parameters: { cf: 0 } },
        }));
        setProviders(migratedProviders.length > 0 ? migratedProviders : [{
          id: 'provider-1',
          name: '',
          role: 'Clinical',
          basePay: draft.defaultBasePay || draft.basePay || 0,
          cfModel: draft.defaultCfModel || draft.cfModel || { modelType: 'single', parameters: { cf: 0 } },
          clinicalFTE: 1.0,
          adminFTE: 0,
          callBurden: false,
          actualWrvus: undefined,
          notes: '',
        }]);
        setMarketBenchmarks(draft.marketBenchmarks || {});
        setIncludeCallPay(draft.includeCallPay || false);
      }
    } catch (error) {
      console.error('Error loading draft state:', error);
    }
  }, []);

  // Calculate provider analyses
  const analyses = useMemo<ProviderAnalysis[]>(() => {
    if (
      providers.length === 0 ||
      !marketBenchmarks ||
      Object.keys(marketBenchmarks).length === 0
    ) {
      return [];
    }

    return providers
      .filter((p) => p.name && p.clinicalFTE > 0 && p.basePay > 0)
      .map((provider) => {
        // Use actual wRVUs if provided, otherwise use median from benchmarks
        const wrvus = provider.actualWrvus || marketBenchmarks.wrvu50 || 0;
        
        if (wrvus <= 0) {
          return null;
        }

        return calculateProviderAnalysis(
          provider,
          wrvus,
          marketBenchmarks,
          includeCallPay
        );
      })
      .filter((a): a is ProviderAnalysis => a !== null);
  }, [providers, marketBenchmarks, includeCallPay]);

  // Generate provider profiles
  const profiles = useMemo<ProviderProfile[]>(() => {
    return analyses.map((analysis) =>
      generateProviderProfile(
        analysis.provider,
        analysis,
        specialty,
        modelYear
      )
    );
  }, [analyses, specialty, modelYear]);

  // Calculate group summary
  const groupSummary = useMemo<GroupSummary>(() => {
    return calculateGroupSummary(providers, analyses);
  }, [providers, analyses]);


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8 md:pb-12">
        <div className="pt-6 sm:pt-8 md:pt-10 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Provider Mix & FTE Modeling
            </h1>
          </div>

          {/* Tab Navigation */}
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 mb-6 bg-gray-100 dark:bg-gray-800">
              <TabsTrigger value="setup" className="text-sm font-medium">
                Setup
              </TabsTrigger>
              <TabsTrigger value="providers" className="text-sm font-medium">
                Providers
              </TabsTrigger>
              <TabsTrigger value="analysis" className="text-sm font-medium">
                Analysis
              </TabsTrigger>
              <TabsTrigger value="export" className="text-sm font-medium">
                Export
              </TabsTrigger>
            </TabsList>

            {/* Setup Tab */}
            <TabsContent value="setup" className="space-y-6 mt-0">
              <Card className="border-2" id="context-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Context
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Specialty</Label>
                      <SpecialtyInput
                        metricType="cf"
                        specialty={specialty}
                        onSpecialtyChange={setSpecialty}
                        onMarketDataLoad={setMarketBenchmarks}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Model Year</Label>
                      <Select
                        value={modelYear.toString()}
                        onValueChange={(value) => setModelYear(parseInt(value, 10))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {Array.from({ length: 81 }, (_, i) => {
                            const year = 2020 + i;
                            return (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-semibold">Default Base Pay (Optional)</Label>
                        <Tooltip content="Default base pay for new providers. Each provider can have their own base pay set in the Providers tab. This is just a starting value." side="right">
                          <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                        </Tooltip>
                      </div>
                      <Input
                        type="number"
                        value={defaultBasePay || ''}
                        onChange={(e) => setDefaultBasePay(parseFloat(e.target.value) || 0)}
                        placeholder="Enter default base pay"
                        min={0}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Used as default when adding new providers
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-semibold">Include Call Pay in TCC</Label>
                        <Tooltip content="If enabled, call pay amounts will be included in Total Cash Compensation (TCC) calculations for providers with call burden." side="right">
                          <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                        </Tooltip>
                      </div>
                      <div className="flex items-center gap-3 pt-2">
                        <Switch
                          checked={includeCallPay}
                          onCheckedChange={setIncludeCallPay}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {includeCallPay ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-semibold">Default CF Model (Optional)</Label>
                      <Tooltip content="Default CF model for new providers. Each provider can have their own CF model set in the Providers tab. This is just a starting value." side="right">
                        <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                      </Tooltip>
                    </div>
                    <CFModelSelector model={defaultCfModel} onModelChange={setDefaultCfModel} fte={1.0} />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Used as default when adding new providers
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Providers Tab */}
            <TabsContent value="providers" className="space-y-6 mt-0">
              {providers.length === 0 && (
                <Card className="border-2 border-dashed">
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      No providers configured yet.
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Configure providers in the Provider Configuration section below to get started.
                    </p>
                  </CardContent>
                </Card>
              )}
              <ProviderConfiguration 
                providers={providers} 
                defaultBasePay={defaultBasePay}
                defaultCfModel={defaultCfModel}
                onProvidersChange={setProviders} 
              />
              <NonClinicalCompensationInput
                providers={providers}
                onProvidersChange={setProviders}
              />
            </TabsContent>

            {/* Analysis Tab */}
            <TabsContent value="analysis" className="space-y-6 mt-0">
              {/* Group Summary Cards - Always at top when data exists */}
              {groupSummary.totalProviders > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-3 sm:p-4 border border-gray-200/60 dark:border-gray-800/60 rounded-lg transition-all duration-200 ease-out bg-white dark:bg-gray-900 hover:shadow-md shadow-sm">
                      <div className="flex items-start gap-2 mb-3 sm:mb-4">
                        <div className="text-primary flex-shrink-0 mt-0.5">
                          <Users className="w-6 h-6" />
                        </div>
                        <Tooltip content="Total number of providers in the mix" side="top" className="max-w-[250px] sm:max-w-[300px]">
                          <span className="text-xs sm:text-sm text-gray-600/80 dark:text-gray-400/80 leading-tight block flex-1 font-medium">
                            Total Providers
                          </span>
                        </Tooltip>
                      </div>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-2xl sm:text-3xl lg:text-4xl font-bold break-words flex-1 text-gray-900 dark:text-gray-100 tracking-tight">
                          {groupSummary.totalProviders}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 sm:p-4 border border-gray-200/60 dark:border-gray-800/60 rounded-lg transition-all duration-200 ease-out bg-white dark:bg-gray-900 hover:shadow-md shadow-sm">
                      <div className="flex items-start gap-2 mb-3 sm:mb-4">
                        <div className="text-primary flex-shrink-0 mt-0.5">
                          <TrendingUp className="w-6 h-6" />
                        </div>
                        <Tooltip content="Average clinical FTE across all providers" side="top" className="max-w-[250px] sm:max-w-[300px]">
                          <span className="text-xs sm:text-sm text-gray-600/80 dark:text-gray-400/80 leading-tight block flex-1 font-medium">
                            Avg Clinical FTE
                          </span>
                        </Tooltip>
                      </div>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-2xl sm:text-3xl lg:text-4xl font-bold break-words flex-1 text-gray-900 dark:text-gray-100 tracking-tight">
                          {groupSummary.averageClinicalFTE.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 sm:p-4 border border-gray-200/60 dark:border-gray-800/60 rounded-lg transition-all duration-200 ease-out bg-white dark:bg-gray-900 hover:shadow-md shadow-sm">
                      <div className="flex items-start gap-2 mb-3 sm:mb-4">
                        <div className="text-primary flex-shrink-0 mt-0.5">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                        <Tooltip content="Number of providers with Risk Zone status" side="top" className="max-w-[250px] sm:max-w-[300px]">
                          <span className="text-xs sm:text-sm text-gray-600/80 dark:text-gray-400/80 leading-tight block flex-1 font-medium">
                            Providers at Risk
                          </span>
                        </Tooltip>
                      </div>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-2xl sm:text-3xl lg:text-4xl font-bold break-words flex-1 text-gray-900 dark:text-gray-100 tracking-tight">
                          {groupSummary.providersAtRisk}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 sm:p-4 border border-gray-200/60 dark:border-gray-800/60 rounded-lg transition-all duration-200 ease-out bg-white dark:bg-gray-900 hover:shadow-md shadow-sm">
                      <div className="flex items-start gap-2 mb-3 sm:mb-4">
                        <div className="text-primary flex-shrink-0 mt-0.5">
                          <DollarSign className="w-6 h-6" />
                        </div>
                        <Tooltip content="Average TCC across all providers" side="top" className="max-w-[250px] sm:max-w-[300px]">
                          <span className="text-xs sm:text-sm text-gray-600/80 dark:text-gray-400/80 leading-tight block flex-1 font-medium">
                            Average TCC
                          </span>
                        </Tooltip>
                      </div>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-2xl sm:text-3xl lg:text-4xl font-bold break-words flex-1 text-gray-900 dark:text-gray-100 tracking-tight">
                          ${groupSummary.averageTCC.toLocaleString('en-US', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ProviderVariabilityDashboard analyses={analyses} />
                </>
              ) : (
                <Card className="border-2 border-dashed">
                  <CardContent className="p-8 text-center">
                    <TrendingUp className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      No analysis data available yet.
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                      Complete the Setup and Providers tabs to see analysis results.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <button
                        onClick={() => setActiveTab('setup')}
                        className="text-sm text-primary hover:underline"
                      >
                        Go to Setup →
                      </button>
                      <span className="hidden sm:inline text-gray-400">|</span>
                      <button
                        onClick={() => setActiveTab('providers')}
                        className="text-sm text-primary hover:underline"
                      >
                        Go to Providers →
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Export Tab */}
            <TabsContent value="export" className="space-y-6 mt-0">
              {profiles.length === 0 ? (
                <Card className="border-2 border-dashed">
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      No provider profiles available for export.
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                      Complete the Setup and Providers tabs, then review Analysis to generate exportable profiles.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <button
                        onClick={() => setActiveTab('setup')}
                        className="text-sm text-primary hover:underline"
                      >
                        Go to Setup →
                      </button>
                      <span className="hidden sm:inline text-gray-400">|</span>
                      <button
                        onClick={() => setActiveTab('providers')}
                        className="text-sm text-primary hover:underline"
                      >
                        Go to Providers →
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <ProviderProfileExport
                  profiles={profiles}
                  specialty={specialty}
                  modelYear={modelYear}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}


