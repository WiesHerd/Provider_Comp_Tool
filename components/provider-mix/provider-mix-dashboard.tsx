'use client';

import { useState, useEffect, useMemo } from 'react';
import { useDebouncedLocalStorage } from '@/hooks/use-debounced-local-storage';
import { Provider, ProviderAnalysis, ProviderProfile, GroupSummary } from '@/types/provider-mix';
import { ConversionFactorModel } from '@/types/cf-models';
import { MarketBenchmarks, FTE } from '@/types';
import { SpecialtyInput } from '@/components/fmv/specialty-input';
import { CFModelSelector } from '@/components/physician-scenarios/cf-model-selector';
import { ProviderConfiguration } from './provider-configuration';
import { NonClinicalCompensationInput } from './non-clinical-compensation';
import { ProviderVariabilityDashboard } from './provider-variability-dashboard';
import { ProviderProfileExport } from './provider-profile-export';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Users, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

const STORAGE_KEY = 'providerMixDashboardDraftState';

export function ProviderMixDashboard() {
  const [specialty, setSpecialty] = useState<string>('');
  const [modelYear, setModelYear] = useState<number>(new Date().getFullYear());
  const [fte, setFte] = useState<FTE>(1.0);
  const [basePay, setBasePay] = useState<number>(0);
  const [cfModel, setCfModel] = useState<ConversionFactorModel>({
    modelType: 'single',
    parameters: { cf: 0 },
  });
  const [providers, setProviders] = useState<Provider[]>([
    {
      id: 'provider-1',
      name: '',
      role: 'Core PCP',
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
    specialty,
    modelYear,
    fte,
    basePay,
    cfModel,
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
        setSpecialty(draft.specialty || '');
        setModelYear(draft.modelYear || new Date().getFullYear());
        setFte(draft.fte || 1.0);
        setBasePay(draft.basePay || 0);
        setCfModel(draft.cfModel || { modelType: 'single', parameters: { cf: 0 } });
        setProviders(draft.providers || []);
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
      Object.keys(marketBenchmarks).length === 0 ||
      basePay <= 0
    ) {
      return [];
    }

    return providers
      .filter((p) => p.name && p.clinicalFTE > 0)
      .map((provider) => {
        // Use actual wRVUs if provided, otherwise use median from benchmarks
        const wrvus = provider.actualWrvus || marketBenchmarks.wrvu50 || 0;
        
        if (wrvus <= 0) {
          return null;
        }

        return calculateProviderAnalysis(
          provider,
          wrvus,
          cfModel,
          basePay,
          marketBenchmarks,
          includeCallPay
        );
      })
      .filter((a): a is ProviderAnalysis => a !== null);
  }, [providers, cfModel, basePay, marketBenchmarks, includeCallPay]);

  // Generate provider profiles
  const profiles = useMemo<ProviderProfile[]>(() => {
    return analyses.map((analysis) =>
      generateProviderProfile(
        analysis.provider,
        analysis,
        specialty,
        modelYear,
        cfModel,
        basePay
      )
    );
  }, [analyses, specialty, modelYear, cfModel, basePay]);

  // Calculate group summary
  const groupSummary = useMemo<GroupSummary>(() => {
    return calculateGroupSummary(providers, analyses, cfModel);
  }, [providers, analyses, cfModel]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8 md:pb-12">
        <div className="pt-6 sm:pt-8 md:pt-10 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Provider Mix & FTE Modeling
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400 max-w-3xl">
              Model how different provider types within the same specialty impact conversion factors
              and compensation alignment. This tool separates clinical productivity from
              administrative/academic roles, ensuring fair CF application and FMV-compliant
              compensation modeling. Use this for department-level analysis, provider-specific
              reviews, and FMV defense documentation.
            </p>
          </div>

          {/* Context Panel */}
          <Card className="border-2">
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Base Pay</Label>
                  <Input
                    type="number"
                    value={basePay || ''}
                    onChange={(e) => setBasePay(parseFloat(e.target.value) || 0)}
                    placeholder="Enter base pay"
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">FTE</Label>
                  <NumberInput
                    value={fte}
                    onChange={setFte}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Include Call Pay in TCC</Label>
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
                <Label className="text-sm font-semibold">CF Model</Label>
                <CFModelSelector model={cfModel} onModelChange={setCfModel} fte={fte} />
              </div>
            </CardContent>
          </Card>

          {/* Group Summary Cards */}
          {groupSummary.totalProviders > 0 && (
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
          )}

          {/* Provider Configuration */}
          <ProviderConfiguration providers={providers} onProvidersChange={setProviders} />

          {/* Non-Clinical Compensation */}
          <NonClinicalCompensationInput
            providers={providers}
            basePay={basePay}
            onProvidersChange={setProviders}
          />

          {/* Provider Variability Dashboard */}
          <ProviderVariabilityDashboard analyses={analyses} />

          {/* Provider Profile Export */}
          <ProviderProfileExport
            profiles={profiles}
            specialty={specialty}
            modelYear={modelYear}
          />
        </div>
      </div>
    </div>
  );
}


