'use client';

import { useState } from 'react';
import {
  ConversionFactorModel,
  CFModelType,
  SingleCFParameters,
  TieredCFParameters,
  TieredCFTier,
  PercentileTieredCFParameters,
  PercentileTieredCFTier,
  BudgetNeutralCFParameters,
  QualityWeightedCFParameters,
  FTEAdjustedCFParameters,
  FTEAdjustedTier,
  TierType,
} from '@/types/cf-models';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';
import { NumberInput } from '@/components/ui/number-input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { FTE, MarketBenchmarks } from '@/types';
import { calculateWRVUPercentile, getWrvuValueAtPercentile, calculateCFPercentile, calculateTCCPercentile } from '@/lib/utils/percentile';
import { normalizeTcc } from '@/lib/utils/normalization';
import { useMemo } from 'react';

interface CFModelSelectorProps {
  model: ConversionFactorModel;
  onModelChange: (model: ConversionFactorModel) => void;
  fte: FTE; // Required for FTE Adjusted model
  marketBenchmarks?: MarketBenchmarks; // Required for Percentile Tiered model
  wrvus?: number; // For live preview
  tccComponents?: Array<{ amount: number }>; // For live preview
}

export function CFModelSelector({ model, onModelChange, fte, marketBenchmarks, wrvus = 0, tccComponents = [] }: CFModelSelectorProps) {
  const handleModelTypeChange = (newType: CFModelType) => {
    // Initialize default parameters for the new model type
    let defaultParameters: ConversionFactorModel['parameters'];
    
    switch (newType) {
      case 'single':
        defaultParameters = { cf: (model.parameters as SingleCFParameters)?.cf || 0 };
        break;
      case 'tiered':
        defaultParameters = {
          tierType: 'threshold',
          tiers: [
            { threshold: 4000, cf: 55 },
            { threshold: 6000, cf: 60 },
            { cf: 70 },
          ],
        };
        break;
      case 'percentile-tiered':
        defaultParameters = {
          tiers: [
            { percentileThreshold: 33, cf: 50 },
            { percentileThreshold: 55, cf: 60 },
            { percentileThreshold: 75, cf: 70 },
            { cf: 80 },
          ],
        };
        break;
      case 'budget-neutral':
        defaultParameters = {
          targetTccPercentile: 50,
          baseCF: (model.parameters as SingleCFParameters)?.cf || 50,
        };
        break;
      case 'quality-weighted':
        defaultParameters = {
          baseCF: (model.parameters as SingleCFParameters)?.cf || 50,
          qualityScore: 100, // 100% quality
        };
        break;
      case 'fte-adjusted':
        defaultParameters = {
          tiers: [
            { fteMin: 0, fteMax: 0.5, cf: 50 },
            { fteMin: 0.5, fteMax: 0.8, cf: 55 },
            { fteMin: 0.8, fteMax: 1.0, cf: 60 },
          ],
        };
        break;
    }
    
    onModelChange({
      modelType: newType,
      parameters: defaultParameters,
    });
  };

  const updateParameters = (updates: Partial<ConversionFactorModel['parameters']>) => {
    onModelChange({
      ...model,
      parameters: { ...model.parameters, ...updates },
    });
  };

  return (
    <div className="space-y-6">
      {/* CF Model Type Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">CF Model Type</Label>
        <Select value={model.modelType} onValueChange={handleModelTypeChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select CF model type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="single">Single CF</SelectItem>
              <SelectItem value="tiered">Tiered CF (by wRVU)</SelectItem>
              <SelectItem value="percentile-tiered">Tiered CF (by Percentile)</SelectItem>
              <SelectItem value="budget-neutral">Budget Neutral</SelectItem>
              <SelectItem value="quality-weighted">Quality Weighted</SelectItem>
              <SelectItem value="fte-adjusted">FTE Adjusted</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Model-Specific Parameter Inputs */}
      {model.modelType === 'single' && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Conversion Factor ($/wRVU)</Label>
          <div className="relative">
            <CurrencyInput
              value={(model.parameters as SingleCFParameters).cf}
              onChange={(value) => updateParameters({ cf: value })}
              placeholder="Enter CF amount"
              min={0}
              showDecimals={true}
              className="pr-20"
            />
            {marketBenchmarks && (marketBenchmarks.cf25 || marketBenchmarks.cf50 || marketBenchmarks.cf75 || marketBenchmarks.cf90) && (
              (() => {
                const cfPercentile = calculateCFPercentile((model.parameters as SingleCFParameters).cf, marketBenchmarks);
                return cfPercentile !== null ? (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 pointer-events-none">
                    ≈ {Math.round(cfPercentile)}th
                  </span>
                ) : null;
              })()
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This is the dollar amount paid per wRVU for productivity incentives.
          </p>
        </div>
      )}

      {model.modelType === 'tiered' && (
        <TieredCFInputs
          parameters={model.parameters as TieredCFParameters}
          onParametersChange={updateParameters}
          marketBenchmarks={marketBenchmarks}
          wrvus={wrvus}
          tccComponents={tccComponents}
          fte={fte}
        />
      )}

      {model.modelType === 'percentile-tiered' && (
        <PercentileTieredCFInputs
          parameters={model.parameters as PercentileTieredCFParameters}
          onParametersChange={updateParameters}
          marketBenchmarks={marketBenchmarks}
        />
      )}

      {model.modelType === 'budget-neutral' && (
        <BudgetNeutralCFInputs
          parameters={model.parameters as BudgetNeutralCFParameters}
          onParametersChange={updateParameters}
          marketBenchmarks={marketBenchmarks}
        />
      )}

      {model.modelType === 'quality-weighted' && (
        <QualityWeightedCFInputs
          parameters={model.parameters as QualityWeightedCFParameters}
          onParametersChange={updateParameters}
          marketBenchmarks={marketBenchmarks}
        />
      )}

      {model.modelType === 'fte-adjusted' && (
        <FTEAdjustedCFInputs
          parameters={model.parameters as FTEAdjustedCFParameters}
          onParametersChange={updateParameters}
          currentFte={fte}
          marketBenchmarks={marketBenchmarks}
        />
      )}
    </div>
  );
}

// Tiered CF Inputs Component
function TieredCFInputs({
  parameters,
  onParametersChange,
  marketBenchmarks,
  wrvus = 0,
  tccComponents = [],
  fte = 1.0,
}: {
  parameters: TieredCFParameters;
  onParametersChange: (updates: Partial<TieredCFParameters>) => void;
  marketBenchmarks?: MarketBenchmarks;
  wrvus?: number;
  tccComponents?: Array<{ amount: number }>;
  fte?: FTE;
}) {
  const [usePercentileInput, setUsePercentileInput] = useState<Record<number, boolean>>({});
  const addTier = () => {
    const newTier: TieredCFTier = {
      threshold: parameters.tiers.length > 0 
        ? (parameters.tiers[parameters.tiers.length - 1].threshold || 0) + 2000
        : 4000,
      cf: 60,
    };
    onParametersChange({
      tiers: [...parameters.tiers.slice(0, -1), newTier, { cf: 70 }],
    });
  };

  const removeTier = (index: number) => {
    if (parameters.tiers.length <= 2) return; // Keep at least 2 tiers
    const newTiers = parameters.tiers.filter((_, i) => i !== index);
    onParametersChange({ tiers: newTiers });
  };

  const updateTier = (index: number, updates: Partial<TieredCFTier>) => {
    const newTiers = parameters.tiers.map((tier, i) =>
      i === index ? { ...tier, ...updates } : tier
    );
    onParametersChange({ tiers: newTiers });
  };

  // Calculate percentile for a wRVU threshold
  const getPercentileForWrvu = (wrvu: number): number | null => {
    if (!marketBenchmarks?.wrvu25 || wrvu <= 0) return null;
    return calculateWRVUPercentile(wrvu, marketBenchmarks);
  };

  // Get wRVU value for a percentile
  const getWrvuForPercentile = (percentile: number): number | null => {
    if (!marketBenchmarks) return null;
    return getWrvuValueAtPercentile(percentile, marketBenchmarks);
  };

  // Calculate percentile for a CF value
  const getPercentileForCF = (cf: number): number | null => {
    if (!marketBenchmarks?.cf25 || cf <= 0) return null;
    return calculateCFPercentile(cf, marketBenchmarks);
  };

  // Toggle between wRVU and percentile input for a tier
  const togglePercentileInput = (index: number) => {
    setUsePercentileInput(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Tier Type</Label>
        <Select
          value={parameters.tierType}
          onValueChange={(value: TierType) => onParametersChange({ tierType: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="threshold">Threshold-based (wRVU ranges)</SelectItem>
            <SelectItem value="percentage">Percentage-based (% of total wRVUs)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-semibold">Tiers</Label>
        {parameters.tiers.map((tier, index) => {
          const isPercentileMode = usePercentileInput[index] && parameters.tierType === 'threshold' && marketBenchmarks;
          const currentPercentile = tier.threshold && parameters.tierType === 'threshold' 
            ? getPercentileForWrvu(tier.threshold) 
            : null;
          
          return (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-start">
                {/* Threshold/Percentile Input Column */}
                <div className="space-y-1.5">
                  {index < parameters.tiers.length - 1 ? (
                    <>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {isPercentileMode ? 'Percentile Threshold' : (parameters.tierType === 'threshold' ? 'Threshold (wRVUs)' : 'Percentage (%)')}
                        </Label>
                        {parameters.tierType === 'threshold' && marketBenchmarks && (
                          <button
                            type="button"
                            onClick={() => togglePercentileInput(index)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                          >
                            {isPercentileMode ? 'Switch to wRVU' : 'Enter percentile'}
                          </button>
                        )}
                      </div>
                      {isPercentileMode ? (
                        <div className="relative">
                          <NumberInput
                            value={currentPercentile || 0}
                            onChange={(value) => {
                              const wrvuValue = getWrvuForPercentile(value);
                              if (wrvuValue !== null) {
                                updateTier(index, { threshold: wrvuValue });
                              }
                            }}
                            min={0}
                            max={100}
                            step={1}
                            placeholder="e.g., 50"
                            className="h-10 pr-24"
                          />
                          {currentPercentile !== null && tier.threshold && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 pointer-events-none">
                              ≈ {tier.threshold.toLocaleString('en-US', { maximumFractionDigits: 0 })} wRVUs
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="relative">
                          <NumberInput
                            value={tier.threshold || 0}
                            onChange={(value) => updateTier(index, { threshold: value })}
                            min={0}
                            step={parameters.tierType === 'threshold' ? 100 : 1}
                            className="h-10 pr-20"
                          />
                          {parameters.tierType === 'threshold' && currentPercentile !== null && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 pointer-events-none">
                              ≈ {Math.round(currentPercentile)}th
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 block">
                        Final Tier Threshold (wRVUs)
                      </Label>
                      <div className="relative">
                        <NumberInput
                          value={tier.threshold || 0}
                          onChange={(value) => updateTier(index, { threshold: value })}
                          min={0}
                          step={100}
                          placeholder="e.g., 8000"
                          className="h-10 pr-20"
                        />
                        {parameters.tierType === 'threshold' && tier.threshold && getPercentileForWrvu(tier.threshold) !== null && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 pointer-events-none">
                            ≈ {Math.round(getPercentileForWrvu(tier.threshold) || 0)}th
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Applies to all wRVUs above this threshold
                      </p>
                    </>
                  )}
                </div>

                {/* CF Input Column */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 block">
                    CF ($/wRVU)
                  </Label>
                  <div className="relative">
                    <CurrencyInput
                      value={tier.cf}
                      onChange={(value) => updateTier(index, { cf: value })}
                      min={0}
                      showDecimals={true}
                      className="h-10 pr-20"
                    />
                    {marketBenchmarks && (marketBenchmarks.cf25 || marketBenchmarks.cf50 || marketBenchmarks.cf75 || marketBenchmarks.cf90) && (
                      (() => {
                        const cfPercentile = getPercentileForCF(tier.cf);
                        return cfPercentile !== null ? (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 pointer-events-none">
                            ≈ {Math.round(cfPercentile)}th
                          </span>
                        ) : null;
                      })()
                    )}
                  </div>
                </div>

                {/* Delete Button Column */}
                {index < parameters.tiers.length - 1 && parameters.tiers.length > 2 && (
                  <div className="flex items-start pt-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTier(index)}
                      className="h-10 w-10 p-0 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
                      aria-label="Delete tier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <Button
          variant="outline"
          size="sm"
          onClick={addTier}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Tier
        </Button>
      </div>

      {/* Simple Live Preview - Apple Style */}
      {wrvus > 0 && marketBenchmarks?.wrvu25 && marketBenchmarks?.tcc25 && (
        <SimpleTieredCFPreview
          wrvus={wrvus}
          fte={fte}
          tccComponents={tccComponents}
          cfModel={{ modelType: 'tiered', parameters }}
          marketBenchmarks={marketBenchmarks}
        />
      )}
    </div>
  );
}

// Simple Preview Component for Tiered CF - Apple Style (kept simple for modeling screen)
function SimpleTieredCFPreview({
  wrvus,
  fte,
  tccComponents,
  cfModel,
  marketBenchmarks,
}: {
  wrvus: number;
  fte: FTE;
  tccComponents: Array<{ amount: number }>;
  cfModel: { modelType: 'tiered'; parameters: TieredCFParameters };
  marketBenchmarks: MarketBenchmarks;
}) {
  const preview = useMemo(() => {
    const fixedComp = tccComponents.reduce((sum, comp) => sum + (comp.amount || 0), 0);
    const { tierType, tiers } = cfModel.parameters;
    
    // Calculate tier-by-tier breakdown
    const tierBreakdown: Array<{
      tierIndex: number;
      tierLabel: string;
      wrvuRange: string;
      wrvusInTier: number;
      cf: number;
      compensation: number;
    }> = [];
    
    let totalCompensation = 0;
    let previousThreshold = 0;
    
    if (tierType === 'threshold') {
      for (let i = 0; i < tiers.length; i++) {
        const tier = tiers[i];
        const nextTier = tiers[i + 1];
        
        if (nextTier && tier.threshold !== undefined) {
          // Not the last tier
          const tierStart = previousThreshold;
          const tierEnd = tier.threshold;
          const tierWrvus = Math.max(0, Math.min(wrvus - tierStart, tierEnd - tierStart));
          const tierCompensation = tierWrvus * tier.cf;
          totalCompensation += tierCompensation;
          
          tierBreakdown.push({
            tierIndex: i + 1,
            tierLabel: `Tier ${i + 1}`,
            wrvuRange: `${tierStart.toLocaleString('en-US', { maximumFractionDigits: 0 })} - ${tierEnd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
            wrvusInTier: tierWrvus,
            cf: tier.cf,
            compensation: tierCompensation,
          });
          
          previousThreshold = tierEnd;
        } else {
          // Last tier
          const finalTierThreshold = tier.threshold !== undefined ? tier.threshold : previousThreshold;
          const tierWrvus = Math.max(0, wrvus - finalTierThreshold);
          const tierCompensation = tierWrvus * tier.cf;
          totalCompensation += tierCompensation;
          
          tierBreakdown.push({
            tierIndex: i + 1,
            tierLabel: `Final Tier`,
            wrvuRange: `${finalTierThreshold.toLocaleString('en-US', { maximumFractionDigits: 0 })}+`,
            wrvusInTier: tierWrvus,
            cf: tier.cf,
            compensation: tierCompensation,
          });
        }
      }
    }
    
    // Calculate total wRVU compensation (before base pay comparison)
    const totalWrvuCompensation = totalCompensation;
    
    // Incentives only apply when wRVU compensation exceeds fixed comp
    // calculateIncentivePayWithModel returns (wRVUs × CF) - basePay
    const incentivePay = totalWrvuCompensation - fixedComp;
    const clinicalDollars = Math.max(0, incentivePay);
    
    // Calculate modeled TCC
    const modeledTcc = fixedComp + clinicalDollars;
    
    // Normalize to 1.0 FTE for percentile calculation
    const normalizedTcc = normalizeTcc(modeledTcc, fte);
    const tccPercentile = calculateTCCPercentile(normalizedTcc, marketBenchmarks);
    
    // Calculate effective CF: Total Cash Compensation / wRVUs
    // This represents the blended rate including both fixed and variable components
    const effectiveCF = wrvus > 0 ? modeledTcc / wrvus : 0;
    
    return {
      tierBreakdown,
      totalWrvuCompensation,
      clinicalDollars,
      modeledTcc,
      tccPercentile,
      effectiveCF,
      fixedComp,
    };
  }, [wrvus, fte, tccComponents, cfModel, marketBenchmarks]);

  return (
    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
      <div className="space-y-4">
        {/* Summary Cards - Apple Style */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Fixed Compensation
            </div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">
              ${preview.fixedComp.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Productivity Incentives
            </div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">
              ${preview.clinicalDollars.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              ${preview.effectiveCF.toFixed(2)}/wRVU
            </div>
            <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              (Fixed + Incentives) / wRVUs
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Total Cash Compensation
            </div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">
              ${preview.modeledTcc.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <div className="mt-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                preview.tccPercentile > 90
                  ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                  : preview.tccPercentile > 75
                    ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
                    : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
              }`}>
                {preview.tccPercentile.toFixed(1)}th percentile
              </span>
            </div>
          </div>
        </div>

        {/* Tier Breakdown - Apple Style */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Tier Contribution Breakdown
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              How each tier contributes to total compensation
            </p>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {preview.tierBreakdown.map((tier, index) => (
              <div key={index} className="px-4 py-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {tier.tierLabel}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {tier.wrvuRange} wRVUs
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {tier.wrvusInTier.toLocaleString('en-US', { maximumFractionDigits: 0 })} wRVUs × ${tier.cf.toFixed(2)} = ${tier.compensation.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      ${tier.compensation.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {preview.totalWrvuCompensation > 0 
                        ? `${((tier.compensation / preview.totalWrvuCompensation) * 100).toFixed(1)}%`
                        : '0%'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total wRVU Compensation
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                ${preview.totalWrvuCompensation.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
            </div>
            {preview.totalWrvuCompensation < preview.fixedComp && (
              <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                Note: wRVU compensation (${preview.totalWrvuCompensation.toLocaleString('en-US', { maximumFractionDigits: 0 })}) is less than fixed compensation (${preview.fixedComp.toLocaleString('en-US', { maximumFractionDigits: 0 })}). No incentive is paid.
              </div>
            )}
            {preview.totalWrvuCompensation >= preview.fixedComp && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Productivity Incentive: ${preview.clinicalDollars.toLocaleString('en-US', { maximumFractionDigits: 0 })} (wRVU comp - fixed comp)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Budget Neutral CF Inputs Component
function BudgetNeutralCFInputs({
  parameters,
  onParametersChange,
  marketBenchmarks,
}: {
  parameters: BudgetNeutralCFParameters;
  onParametersChange: (updates: Partial<BudgetNeutralCFParameters>) => void;
  marketBenchmarks?: MarketBenchmarks;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Target TCC Percentile</Label>
        <NumberInput
          value={parameters.targetTccPercentile}
          onChange={(value) => onParametersChange({ targetTccPercentile: value })}
          min={0}
          max={100}
          step={1}
        />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          CF will be adjusted to maintain compensation at this percentile (e.g., 50 for 50th percentile).
        </p>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Base CF (Optional)</Label>
        <div className="relative">
          <CurrencyInput
            value={parameters.baseCF || 50}
            onChange={(value) => onParametersChange({ baseCF: value })}
            placeholder="Starting CF for calculation"
            min={0}
            showDecimals={true}
            className="pr-20"
          />
          {marketBenchmarks && (marketBenchmarks.cf25 || marketBenchmarks.cf50 || marketBenchmarks.cf75 || marketBenchmarks.cf90) && (
            (() => {
              const cfPercentile = calculateCFPercentile(parameters.baseCF || 50, marketBenchmarks);
              return cfPercentile !== null ? (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 pointer-events-none">
                  ≈ {Math.round(cfPercentile)}th
                </span>
              ) : null;
            })()
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Optional starting point for CF calculation. If not provided, will be calculated from target percentile.
        </p>
      </div>
    </div>
  );
}

// Quality Weighted CF Inputs Component
function QualityWeightedCFInputs({
  parameters,
  onParametersChange,
  marketBenchmarks,
}: {
  parameters: QualityWeightedCFParameters;
  onParametersChange: (updates: Partial<QualityWeightedCFParameters>) => void;
  marketBenchmarks?: MarketBenchmarks;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Base Conversion Factor ($/wRVU)</Label>
        <div className="relative">
          <CurrencyInput
            value={parameters.baseCF}
            onChange={(value) => onParametersChange({ baseCF: value })}
            placeholder="Enter base CF"
            min={0}
            showDecimals={true}
            className="pr-20"
          />
          {marketBenchmarks && (marketBenchmarks.cf25 || marketBenchmarks.cf50 || marketBenchmarks.cf75 || marketBenchmarks.cf90) && (
            (() => {
              const cfPercentile = calculateCFPercentile(parameters.baseCF, marketBenchmarks);
              return cfPercentile !== null ? (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 pointer-events-none">
                  ≈ {Math.round(cfPercentile)}th
                </span>
              ) : null;
            })()
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Quality Score</Label>
        <NumberInput
          value={parameters.qualityScore}
          onChange={(value) => onParametersChange({ qualityScore: value })}
          min={0}
          max={100}
          step={1}
        />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enter quality score as percentage (0-100). Effective CF = Base CF × (Quality Score / 100).
        </p>
      </div>
    </div>
  );
}

// FTE Adjusted CF Inputs Component
function FTEAdjustedCFInputs({
  parameters,
  onParametersChange,
  currentFte,
  marketBenchmarks,
}: {
  parameters: FTEAdjustedCFParameters;
  onParametersChange: (updates: Partial<FTEAdjustedCFParameters>) => void;
  currentFte: FTE;
  marketBenchmarks?: MarketBenchmarks;
}) {
  const addTier = () => {
    const lastTier = parameters.tiers[parameters.tiers.length - 1];
    const newTier: FTEAdjustedTier = {
      fteMin: lastTier.fteMax || 0.8,
      fteMax: Math.min(1.0, (lastTier.fteMax || 0.8) + 0.2),
      cf: 60,
    };
    onParametersChange({
      tiers: [...parameters.tiers.slice(0, -1), newTier, { fteMin: newTier.fteMax, fteMax: 1.0, cf: 70 }],
    });
  };

  const removeTier = (index: number) => {
    if (parameters.tiers.length <= 2) return;
    const newTiers = parameters.tiers.filter((_, i) => i !== index);
    onParametersChange({ tiers: newTiers });
  };

  const updateTier = (index: number, updates: Partial<FTEAdjustedTier>) => {
    const newTiers = parameters.tiers.map((tier, i) =>
      i === index ? { ...tier, ...updates } : tier
    );
    onParametersChange({ tiers: newTiers });
  };

  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Current FTE: <span className="font-semibold">{currentFte}</span>
        </p>
      </div>
      <div className="space-y-3">
        <Label className="text-sm font-semibold">FTE Tiers</Label>
        {parameters.tiers.map((tier, index) => (
          <div key={index} className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                FTE Min
              </Label>
              <NumberInput
                value={tier.fteMin}
                onChange={(value) => updateTier(index, { fteMin: value })}
                min={0}
                max={1}
                step={0.1}
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                FTE Max
              </Label>
              <NumberInput
                value={tier.fteMax}
                onChange={(value) => updateTier(index, { fteMax: value })}
                min={0}
                max={1}
                step={0.1}
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                CF ($/wRVU)
              </Label>
              <div className="relative">
                <CurrencyInput
                  value={tier.cf}
                  onChange={(value) => updateTier(index, { cf: value })}
                  min={0}
                  showDecimals={true}
                  className="pr-20"
                />
                {marketBenchmarks && (marketBenchmarks.cf25 || marketBenchmarks.cf50 || marketBenchmarks.cf75 || marketBenchmarks.cf90) && (
                  (() => {
                    const cfPercentile = calculateCFPercentile(tier.cf, marketBenchmarks);
                    return cfPercentile !== null ? (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 pointer-events-none">
                        ≈ {Math.round(cfPercentile)}th
                      </span>
                    ) : null;
                  })()
                )}
              </div>
            </div>
            {parameters.tiers.length > 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeTier(index)}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 mb-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={addTier}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add FTE Tier
        </Button>
      </div>
    </div>
  );
}

// Percentile-Based Tiered CF Inputs Component
function PercentileTieredCFInputs({
  parameters,
  onParametersChange,
  marketBenchmarks,
}: {
  parameters: PercentileTieredCFParameters;
  onParametersChange: (updates: Partial<PercentileTieredCFParameters>) => void;
  marketBenchmarks?: MarketBenchmarks;
}) {
  // Calculate percentile for a CF value
  const getPercentileForCF = (cf: number): number | null => {
    if (!marketBenchmarks?.cf25 || cf <= 0) return null;
    return calculateCFPercentile(cf, marketBenchmarks);
  };
  const updateTier = (index: number, updates: Partial<PercentileTieredCFTier>) => {
    const updatedTiers = [...parameters.tiers];
    updatedTiers[index] = { ...updatedTiers[index], ...updates };
    onParametersChange({ tiers: updatedTiers });
  };

  const addTier = () => {
    const lastTier = parameters.tiers[parameters.tiers.length - 1];
    const newThreshold = lastTier.percentileThreshold 
      ? lastTier.percentileThreshold + 10 
      : 90;
    const newTier: PercentileTieredCFTier = {
      percentileThreshold: newThreshold,
      cf: lastTier.cf || 50,
    };
    // Remove threshold from previous last tier
    const updatedTiers = parameters.tiers.map((tier, i) => 
      i === parameters.tiers.length - 1 
        ? { ...tier, percentileThreshold: tier.percentileThreshold }
        : tier
    );
    onParametersChange({ tiers: [...updatedTiers, newTier] });
  };

  const removeTier = (index: number) => {
    if (parameters.tiers.length <= 1) return;
    const updatedTiers = parameters.tiers.filter((_, i) => i !== index);
    // If we removed the last tier, make the new last tier have no threshold
    if (index === parameters.tiers.length - 1 && updatedTiers.length > 0) {
      updatedTiers[updatedTiers.length - 1] = {
        ...updatedTiers[updatedTiers.length - 1],
        percentileThreshold: undefined,
      };
    }
    onParametersChange({ tiers: updatedTiers });
  };

  // Calculate wRVU values for percentile thresholds using market data
  const getWrvuForPercentile = (percentile: number): number | null => {
    if (!marketBenchmarks) return null;
    const { wrvu25, wrvu50, wrvu75, wrvu90 } = marketBenchmarks;
    
    // Use linear interpolation
    if (percentile <= 25 && wrvu25) {
      return wrvu25 * (percentile / 25);
    } else if (percentile <= 50 && wrvu25 && wrvu50) {
      const ratio = (percentile - 25) / 25;
      return wrvu25 + (wrvu50 - wrvu25) * ratio;
    } else if (percentile <= 75 && wrvu50 && wrvu75) {
      const ratio = (percentile - 50) / 25;
      return wrvu50 + (wrvu75 - wrvu50) * ratio;
    } else if (percentile <= 90 && wrvu75 && wrvu90) {
      const ratio = (percentile - 75) / 15;
      return wrvu75 + (wrvu90 - wrvu75) * ratio;
    } else if (percentile > 90 && wrvu90) {
      const ratio = (percentile - 90) / 10;
      return wrvu90 * (1 + ratio * 0.3);
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Percentile-Based Tiers</Label>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Define tiers by productivity percentiles. The system will calculate which tier applies based on the actual wRVU value&apos;s percentile in the market data.
        </p>
        {!marketBenchmarks?.wrvu25 && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Enter wRVU market data above to see calculated wRVU values for each percentile threshold.
          </p>
        )}
      </div>

      <div className="space-y-3">
        {parameters.tiers.map((tier, index) => {
          const isLastTier = index === parameters.tiers.length - 1;
          const prevThreshold = index > 0 
            ? parameters.tiers[index - 1].percentileThreshold || 0 
            : 0;
          const wrvuValue = tier.percentileThreshold 
            ? getWrvuForPercentile(tier.percentileThreshold)
            : null;

          return (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tier {index + 1}
                </Label>
                {parameters.tiers.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTier(index)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!isLastTier ? (
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600 dark:text-gray-400">
                      Up to Percentile
                    </Label>
                    <NumberInput
                      value={tier.percentileThreshold || 0}
                      onChange={(value) => updateTier(index, { percentileThreshold: value })}
                      placeholder="e.g., 33"
                      min={prevThreshold}
                      max={100}
                      step={1}
                    />
                    {wrvuValue !== null && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        ≈ {wrvuValue.toLocaleString('en-US', { maximumFractionDigits: 0 })} wRVUs
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600 dark:text-gray-400">
                      Above {prevThreshold}th Percentile
                    </Label>
                    <div className="text-sm text-gray-500 dark:text-gray-500 py-2">
                      All remaining productivity
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm text-gray-600 dark:text-gray-400">
                    CF Rate ($/wRVU)
                  </Label>
                  <div className="relative">
                    <CurrencyInput
                      value={tier.cf}
                      onChange={(value) => updateTier(index, { cf: value })}
                      placeholder="Enter CF"
                      min={0}
                      showDecimals={true}
                      className="pr-20"
                    />
                    {marketBenchmarks && (marketBenchmarks.cf25 || marketBenchmarks.cf50 || marketBenchmarks.cf75 || marketBenchmarks.cf90) && (
                      (() => {
                        const cfPercentile = getPercentileForCF(tier.cf);
                        return cfPercentile !== null ? (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 pointer-events-none">
                            ≈ {Math.round(cfPercentile)}th
                          </span>
                        ) : null;
                      })()
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={addTier}
        className="w-full sm:w-auto"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Tier
      </Button>
    </div>
  );
}

