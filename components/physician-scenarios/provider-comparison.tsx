'use client';

import { useState, useMemo } from 'react';
import { FTE, MarketBenchmarks } from '@/types';
import { ConversionFactorModel } from '@/types/cf-models';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { CFModelSelector } from './cf-model-selector';
import { Button } from '@/components/ui/button';
import { calculateIncentivePayWithModel, getCFModelSummary } from '@/lib/utils/cf-model-engine';
import { calculateWRVUPercentile, calculateTCCPercentile, calculateCFPercentile } from '@/lib/utils/percentile';
import { normalizeTcc } from '@/lib/utils/normalization';
import { getAlignmentStatus } from '@/lib/utils/scenario-modeling';
import { Plus, Trash2, ArrowDown, ArrowUp, Settings2, Copy, Minus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import * as Dialog from '@radix-ui/react-dialog';

interface ProviderComparisonProps {
  marketBenchmarks: MarketBenchmarks;
}

interface ProviderInput {
  id: string;
  name: string;
  basePay: number;
  cfModel: ConversionFactorModel;
  wrvus: number;
  fte: FTE;
}

interface ProviderResult {
  id: string;
  name: string;
  basePay: number;
  cfSummary: string;
  wrvus: number;
  fte: FTE;
  incentivePay: number;
  actualIncentivePay: number;
  totalTCC: number;
  normalizedTCC: number;
  effectiveCF: number;
  wrvuPercentile: number | null;
  tccPercentile: number | null;
  cfPercentile: number | null;
  alignmentStatus: string | null;
  alignmentDelta: number | null;
  isLowest: boolean;
  isHighest: boolean;
  costDelta: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercentile = (value: number | null) => {
  if (value === null) return '—';
  if (value >= 90) return '>90th';
  return `${Math.round(value)}th`;
};

export function ProviderComparison({ marketBenchmarks }: ProviderComparisonProps) {
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

  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [editingCFModel, setEditingCFModel] = useState<ConversionFactorModel | null>(null);

  // Calculate results for all providers
  const results = useMemo<ProviderResult[]>(() => {
    const calculatedResults = providers.map((provider) => {
      const incentivePay = calculateIncentivePayWithModel(
        provider.wrvus,
        provider.cfModel,
        provider.basePay,
        provider.fte,
        marketBenchmarks
      );
      const totalTCC = provider.basePay + Math.max(0, incentivePay);
      const normalizedTCC = normalizeTcc(totalTCC, provider.fte);
      const normalizedWrvus = provider.wrvus / (provider.fte || 1.0);
      const effectiveCF = provider.wrvus > 0 ? totalTCC / provider.wrvus : 0;
      
      const wrvuPercentile = marketBenchmarks.wrvu25
        ? calculateWRVUPercentile(normalizedWrvus, marketBenchmarks)
        : null;
      const tccPercentile = marketBenchmarks.tcc25
        ? calculateTCCPercentile(normalizedTCC, marketBenchmarks)
        : null;
      const cfPercentile = (marketBenchmarks.cf25 || marketBenchmarks.cf50 || marketBenchmarks.cf75 || marketBenchmarks.cf90)
        ? calculateCFPercentile(effectiveCF, marketBenchmarks)
        : null;
      
      const alignmentStatus = wrvuPercentile !== null && tccPercentile !== null
        ? getAlignmentStatus(wrvuPercentile, tccPercentile)
        : null;
      
      const alignmentDelta = wrvuPercentile !== null && tccPercentile !== null
        ? Math.abs(tccPercentile - wrvuPercentile)
        : null;

      return {
        id: provider.id,
        name: provider.name || `Provider ${String.fromCharCode(64 + providers.findIndex(p => p.id === provider.id) + 1)}`,
        basePay: provider.basePay,
        cfSummary: getCFModelSummary(provider.cfModel),
        wrvus: provider.wrvus,
        fte: provider.fte,
        incentivePay: Math.max(0, incentivePay),
        actualIncentivePay: incentivePay,
        totalTCC,
        normalizedTCC,
        effectiveCF,
        wrvuPercentile,
        tccPercentile,
        cfPercentile,
        alignmentStatus,
        alignmentDelta,
        isLowest: false,
        isHighest: false,
        costDelta: 0,
      };
    });

    const tccValues = calculatedResults.map(r => r.totalTCC);
    const minTCC = Math.min(...tccValues);
    const maxTCC = Math.max(...tccValues);
    const baselineTCC = calculatedResults[0]?.totalTCC || 0;

    return calculatedResults.map((result, index) => ({
      ...result,
      isLowest: result.totalTCC === minTCC && tccValues.filter(t => t === minTCC).length === 1,
      isHighest: result.totalTCC === maxTCC && tccValues.filter(t => t === maxTCC).length === 1,
      costDelta: index === 0 ? 0 : result.totalTCC - baselineTCC,
    }));
  }, [providers, marketBenchmarks]);

  const addProvider = () => {
    const newProvider: ProviderInput = {
      id: `provider-${Date.now()}`,
      name: `Provider ${String.fromCharCode(64 + providers.length + 1)}`,
      basePay: 300000,
      cfModel: {
        modelType: 'single',
        parameters: { cf: 50 },
      },
      wrvus: 6000,
      fte: 1.0,
    };
    setProviders([...providers, newProvider]);
  };

  const removeProvider = (id: string) => {
    if (providers.length <= 2) return;
    setProviders(providers.filter(p => p.id !== id));
  };

  const duplicateProvider = (id: string) => {
    const provider = providers.find(p => p.id === id);
    if (!provider) return;
    const newProvider: ProviderInput = {
      ...provider,
      id: `provider-${Date.now()}`,
      name: `${provider.name} (Copy)`,
    };
    setProviders([...providers, newProvider]);
  };

  const updateProvider = (id: string, updates: Partial<ProviderInput>) => {
    setProviders(providers.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleOpenCFDialog = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (provider) {
      setEditingProviderId(providerId);
      setEditingCFModel(provider.cfModel);
    }
  };

  const handleSaveCFModel = () => {
    if (editingProviderId && editingCFModel) {
      updateProvider(editingProviderId, { cfModel: editingCFModel });
      setEditingProviderId(null);
      setEditingCFModel(null);
    }
  };

  // Quick preset: Same base, different CF
  const applyPresetSameBaseDifferentCF = () => {
    const basePay = providers[0]?.basePay || 300000;
    const wrvus = providers[0]?.wrvus || 6000;
    setProviders([
      {
        id: 'provider-1',
        name: 'Provider A',
        basePay,
        cfModel: { modelType: 'single', parameters: { cf: 50 } },
        wrvus,
        fte: 1.0,
      },
      {
        id: 'provider-2',
        name: 'Provider B',
        basePay,
        cfModel: { modelType: 'single', parameters: { cf: 55 } },
        wrvus,
        fte: 1.0,
      },
    ]);
  };

  // Quick preset: Same CF, different wRVUs
  const applyPresetSameCFDifferentWRVUs = () => {
    const basePay = providers[0]?.basePay || 300000;
    const cf = providers[0]?.cfModel.modelType === 'single' 
      ? (providers[0].cfModel.parameters as { cf: number }).cf 
      : 50;
    setProviders([
      {
        id: 'provider-1',
        name: 'Provider A',
        basePay,
        cfModel: { modelType: 'single', parameters: { cf } },
        wrvus: 6000,
        fte: 1.0,
      },
      {
        id: 'provider-2',
        name: 'Provider B',
        basePay,
        cfModel: { modelType: 'single', parameters: { cf } },
        wrvus: 7000,
        fte: 1.0,
      },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Quick Presets */}
      <div className="flex flex-wrap gap-2 sm:gap-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={applyPresetSameBaseDifferentCF}
          className="text-xs sm:text-sm h-9 sm:h-8 px-3 sm:px-3 touch-manipulation"
        >
          Same Base, Different CF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={applyPresetSameCFDifferentWRVUs}
          className="text-xs sm:text-sm h-9 sm:h-8 px-3 sm:px-3 touch-manipulation"
        >
          Same CF, Different wRVUs
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={addProvider}
          className="text-xs sm:text-sm h-9 sm:h-8 px-3 sm:px-3 touch-manipulation"
        >
          <Plus className="w-3.5 h-3.5 sm:w-3 sm:h-3 mr-1.5 sm:mr-1" />
          Add Provider
        </Button>
      </div>

      {/* Results Section - Inline Editable */}
      {results.length > 0 && (
        <Card className="border-2">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  Provider Comparison
                </CardTitle>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1.5 sm:mt-2">
                  Click values to edit. Changes update instantly.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6">
              <div className="space-y-4 sm:space-y-4 md:space-y-6">
                {results.map((result) => {
                  const provider = providers.find(p => p.id === result.id);
                  if (!provider) return null;
                  
                  const providerIndex = providers.findIndex(p => p.id === result.id);
                  const isBaseline = providerIndex === 0;
                  const isEditingCF = editingProviderId === result.id;
                  
                  return (
                    <Card
                      key={result.id}
                      className={cn(
                        "border-2 transition-all duration-200 hover:shadow-lg",
                        result.isHighest && result.totalTCC !== results.find(r => r.id !== result.id)?.totalTCC
                          ? "border-green-500 dark:border-green-600 bg-gradient-to-br from-green-50/50 to-white dark:from-green-900/10 dark:to-gray-900"
                          : result.isLowest && result.totalTCC !== results.find(r => r.id !== result.id)?.totalTCC
                          ? "border-blue-500 dark:border-blue-600 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-900/10 dark:to-gray-900"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      )}
                    >
                      <CardContent className="p-4 sm:p-6">
                        {/* Header with Inline Name Edit */}
                        <div className="mb-5 sm:mb-6">
                          <div className="flex items-start justify-between mb-3 sm:mb-4">
                            <div className="flex-1 min-w-0">
                              {isBaseline && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Baseline</div>
                              )}
                              <Input
                                value={provider.name}
                                onChange={(e) => updateProvider(provider.id, { name: e.target.value })}
                                className="text-base sm:text-lg font-semibold border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-2 -ml-2 py-1"
                                placeholder="Provider name"
                              />
                            </div>
                            <div className="flex items-center gap-0.5 sm:gap-1 ml-2 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => duplicateProvider(provider.id)}
                                className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 touch-manipulation"
                                title="Duplicate"
                              >
                                <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </Button>
                              {providers.length > 2 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeProvider(provider.id)}
                                  className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400 touch-manipulation"
                                  title="Remove"
                                >
                                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quick Inputs - Inline */}
                        <div className="mb-6 sm:mb-6 pb-6 sm:pb-6 border-b border-gray-100 dark:border-gray-800">
                          <div className="grid grid-cols-2 gap-4 sm:gap-4">
                            {/* Base Pay */}
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 leading-tight">Base Pay</Label>
                              <NumberInput
                                value={provider.basePay}
                                onChange={(value) => updateProvider(provider.id, { basePay: value })}
                                min={0}
                                step={1000}
                                className="h-11 text-sm touch-manipulation"
                              />
                            </div>
                            
                            {/* wRVUs */}
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 leading-tight">wRVUs</Label>
                              <NumberInput
                                value={provider.wrvus}
                                onChange={(value) => updateProvider(provider.id, { wrvus: value })}
                                min={0}
                                step={100}
                                className="h-11 text-sm touch-manipulation"
                              />
                            </div>
                            
                            {/* CF Model */}
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 leading-tight">CF Model</Label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenCFDialog(provider.id)}
                                className="w-full h-11 justify-start text-sm touch-manipulation px-3"
                              >
                                <Settings2 className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span className="truncate text-left">
                                  {provider.cfModel.modelType === 'single' 
                                    ? `$${(provider.cfModel.parameters as { cf: number }).cf}/wRVU`
                                    : provider.cfModel.modelType === 'tiered'
                                    ? 'Tiered'
                                    : provider.cfModel.modelType === 'percentile-tiered'
                                    ? 'Percentile Tiered'
                                    : provider.cfModel.modelType === 'budget-neutral'
                                    ? 'Budget Neutral'
                                    : provider.cfModel.modelType === 'quality-weighted'
                                    ? 'Quality Weighted'
                                    : provider.cfModel.modelType === 'fte-adjusted'
                                    ? 'FTE Adjusted'
                                    : 'CF Model'}
                                </span>
                              </Button>
                            </div>
                            
                            {/* FTE - Custom without wrapper label */}
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 leading-tight">FTE</Label>
                              <div className="flex items-center gap-2 h-11">
                                <div className="relative flex-1">
                                  <NumberInput
                                    value={provider.fte}
                                    onChange={(val) => {
                                      const constrained = Math.max(0, Math.min(1.0, val));
                                      updateProvider(provider.id, { fte: constrained as FTE });
                                    }}
                                    min={0}
                                    max={1.0}
                                    step={0.01}
                                    className="h-11 text-sm text-center touch-manipulation"
                                  />
                                </div>
                                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex-shrink-0">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const newValue = Math.max(0, provider.fte - 0.01);
                                      updateProvider(provider.id, { fte: newValue as FTE });
                                    }}
                                    className="h-9 w-9 p-0 hover:bg-primary hover:text-white rounded-md active:scale-95 transition-transform touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
                                    disabled={provider.fte <= 0}
                                    aria-label="Decrease FTE"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const newValue = Math.min(1.0, provider.fte + 0.01);
                                      updateProvider(provider.id, { fte: newValue as FTE });
                                    }}
                                    className="h-9 w-9 p-0 hover:bg-primary hover:text-white rounded-md active:scale-95 transition-transform touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
                                    disabled={provider.fte >= 1.0}
                                    aria-label="Increase FTE"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Key Metrics */}
                        <div className="space-y-6 mb-6">
                          {/* Total TCC - Hero Metric */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Cash Compensation</span>
                              {result.isLowest && (
                                <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                  <ArrowDown className="w-3 h-3" />
                                  Lowest
                                </span>
                              )}
                              {result.isHighest && !result.isLowest && (
                                <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                  <ArrowUp className="w-3 h-3" />
                                  Highest
                                </span>
                              )}
                              {!result.isLowest && !result.isHighest && result.costDelta !== undefined && result.costDelta !== 0 && (
                                <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                                  {result.costDelta > 0 ? `+${formatCurrency(result.costDelta)}` : formatCurrency(result.costDelta)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-baseline gap-3">
                              <div className="text-4xl font-light text-gray-900 dark:text-white tabular-nums leading-none">
                                {formatCurrency(result.totalTCC)}
                              </div>
                              {result.actualIncentivePay !== undefined && result.actualIncentivePay !== 0 && (
                                <div className={`text-lg font-medium tabular-nums ${
                                  result.actualIncentivePay >= 0
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {result.actualIncentivePay >= 0 ? '+' : ''}{formatCurrency(result.actualIncentivePay)}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Effective CF */}
                          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Conversion Factor</div>
                            <div className="text-2xl font-light text-gray-900 dark:text-white tabular-nums">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }).format(result.effectiveCF)}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">per wRVU</div>
                          </div>
                        </div>

                        {/* Alignment */}
                        {result.wrvuPercentile !== null && result.tccPercentile !== null && (
                          <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between mb-5">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Alignment</span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 sm:gap-6 mb-3 sm:mb-4">
                              <div className="space-y-2 sm:space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] sm:text-xs font-medium text-gray-600 dark:text-gray-400">wRVU</span>
                                  <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                                    {formatPercentile(result.wrvuPercentile)}
                                  </span>
                                </div>
                                <div className="relative h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                                  <div 
                                    className={cn(
                                      "h-full rounded-full transition-all duration-700 ease-out",
                                      result.tccPercentile > result.wrvuPercentile
                                        ? "bg-gradient-to-r from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 shadow-sm shadow-red-500/20"
                                        : "bg-gradient-to-r from-green-500 to-green-600 dark:from-green-400 dark:to-green-500 shadow-sm shadow-green-500/20"
                                    )}
                                    style={{ 
                                      width: `${Math.min(result.wrvuPercentile, 100)}%`,
                                      transition: 'width 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2 sm:space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] sm:text-xs font-medium text-gray-600 dark:text-gray-400">TCC</span>
                                  <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                                    {formatPercentile(result.tccPercentile)}
                                  </span>
                                </div>
                                <div className="relative h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                                  <div 
                                    className={cn(
                                      "h-full rounded-full transition-all duration-700 ease-out",
                                      result.tccPercentile > result.wrvuPercentile
                                        ? "bg-gradient-to-r from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 shadow-sm shadow-red-500/20"
                                        : "bg-gradient-to-r from-green-500 to-green-600 dark:from-green-400 dark:to-green-500 shadow-sm shadow-green-500/20"
                                    )}
                                    style={{ 
                                      width: `${Math.min(result.tccPercentile, 100)}%`,
                                      transition: 'width 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                            
                            {result.alignmentDelta !== null && (
                              <div className={cn(
                                "text-[11px] sm:text-xs text-center font-medium pt-0.5 sm:pt-1 tabular-nums",
                                result.wrvuPercentile > result.tccPercentile
                                  ? "text-green-600 dark:text-green-400"
                                  : result.tccPercentile > result.wrvuPercentile
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-gray-500 dark:text-gray-400"
                              )}>
                                {result.alignmentDelta.toFixed(1)}% difference
                              </div>
                            )}
                          </div>
                        )}

                        {/* CF Market Position */}
                        {result.cfPercentile !== null && (
                          <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between mb-5">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">CF Position</span>
                              <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                                {formatPercentile(result.cfPercentile)}
                              </span>
                            </div>
                            <div className="relative h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                              <div 
                                className="h-full rounded-full bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-500 dark:to-gray-400 transition-all duration-700 ease-out shadow-sm"
                                style={{ 
                                  width: `${Math.min(result.cfPercentile, 100)}%`,
                                  transition: 'width 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CF Model Configuration Dialog */}
      <Dialog.Root open={editingProviderId !== null} onOpenChange={(open) => !open && setEditingProviderId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-2xl w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto z-[101] shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Configure CF Model
            </Dialog.Title>
            {editingCFModel && editingProviderId && (
              <div className="space-y-4">
                <CFModelSelector
                  model={editingCFModel}
                  onModelChange={setEditingCFModel}
                  fte={providers.find(p => p.id === editingProviderId)?.fte || 1.0}
                  marketBenchmarks={marketBenchmarks}
                />
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="outline" onClick={() => setEditingProviderId(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveCFModel}>
                    Save
                  </Button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
