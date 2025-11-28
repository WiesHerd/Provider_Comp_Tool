'use client';

import { useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MarketBenchmarks } from '@/types';
import { FTE } from '@/types';
import { calculateIncentivePayWithModel } from '@/lib/utils/cf-model-engine';
import { calculateWRVUPercentile, calculateTCCPercentile, calculateCFPercentile } from '@/lib/utils/percentile';
import { normalizeTcc, normalizeWrvus } from '@/lib/utils/normalization';
import { getAlignmentStatus } from '@/lib/utils/scenario-modeling';
import { useCFModelsStore } from '@/lib/store/cf-models-store';
import { Edit2, Copy, Trash2, ArrowDown, ArrowUp } from 'lucide-react';
import { CFModelReportExport } from './cf-model-report-export';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercentile = (value: number) => {
  if (value >= 90) return '>90th';
  return `${Math.round(value)}th`;
};

interface CFModelComparisonProps {
  wrvus: number;
  fte: FTE;
  fixedComp: number;
  marketBenchmarks: MarketBenchmarks;
  onViewDetails?: (modelId: string) => void;
  onEditModel?: (modelId: string) => void;
}

export function CFModelComparison({ wrvus, fte, fixedComp, marketBenchmarks, onViewDetails, onEditModel }: CFModelComparisonProps) {
  const { models, loadModels, deleteModel, duplicateModel, setActiveModel } = useCFModelsStore();

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  // Calculate results for each model
  const results = useMemo(() => {
    if (wrvus <= 0 || !marketBenchmarks.wrvu25 || !marketBenchmarks.tcc25) {
      return [];
    }

    const calculatedResults = models.map((savedModel) => {
      const { id, name, model } = savedModel;
      const normalizedWrvus = normalizeWrvus(wrvus, fte);
      // Calculate clinical dollars - incentives only when wRVUs × CF exceeds fixed compensation
      // calculateIncentivePayWithModel returns (wRVUs × CF) - basePay
      const incentivePay = calculateIncentivePayWithModel(
        wrvus,
        model,
        fixedComp, // Use fixedComp as basePay - incentives only when wRVUs × CF > fixedComp
        fte,
        marketBenchmarks
      );
      // Clinical dollars is the positive incentive pay (only when wRVUs × CF exceeds fixed comp)
      const clinicalDollars = Math.max(0, incentivePay);
      const productivityIncentives = clinicalDollars; // Alias for report compatibility
      const modeledTcc = fixedComp + clinicalDollars;
      // Effective CF = Total Cash Compensation / wRVUs (blended rate including fixed + variable)
      const effectiveCF = wrvus > 0 ? modeledTcc / wrvus : 0;
      const normalizedTcc = normalizeTcc(modeledTcc, fte);

      const wrvuPercentile = calculateWRVUPercentile(normalizedWrvus, marketBenchmarks);
      const tccPercentile = calculateTCCPercentile(normalizedTcc, marketBenchmarks);
      const cfPercentile = (marketBenchmarks.cf25 || marketBenchmarks.cf50 || marketBenchmarks.cf75 || marketBenchmarks.cf90)
        ? calculateCFPercentile(effectiveCF, marketBenchmarks)
        : null;

      // Calculate alignment status (incorporates FMV compliance thresholds)
      const alignmentStatus = getAlignmentStatus(wrvuPercentile, tccPercentile);
      const delta = Math.abs(tccPercentile - wrvuPercentile);

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
        id,
        name,
        model,
        clinicalDollars,
        productivityIncentives, // Alias for report compatibility
        actualIncentivePay: incentivePay, // Actual incentive pay (can be negative)
        effectiveCF,
        modeledTcc,
        wrvuPercentile,
        tccPercentile,
        cfPercentile,
        alignmentStatus,
        alignmentDelta: delta,
        fmvRiskLevel,
      };
    });

    // Calculate baseline TCC (lowest total cash compensation across all models)
    // This is simply the model with the lowest TCC - the most cost-effective option
    const baselineTcc = calculatedResults.length > 0 
      ? Math.min(...calculatedResults.map(r => r.modeledTcc)) 
      : 0;
    
    // Calculate highest TCC for comparison
    const highestTcc = calculatedResults.length > 0
      ? Math.max(...calculatedResults.map(r => r.modeledTcc))
      : 0;

    // Add cost delta to each result (difference from lowest TCC model)
    return calculatedResults.map(result => ({
      ...result,
      costDelta: result.modeledTcc - baselineTcc,
      isLowest: result.modeledTcc === baselineTcc,
      isHighest: result.modeledTcc === highestTcc,
    }));
  }, [models, wrvus, fte, fixedComp, marketBenchmarks]);

  // Determine best model for FMV (lowest alignment delta AND TCC ≤ 75th percentile preferred)
  // If no model has TCC ≤ 75th, then lowest alignment delta with TCC ≤ 90th
  const bestFMVModel = useMemo(() => {
    if (results.length === 0) return null;
    
    // First, try to find models with TCC ≤ 75th percentile (FMV safe)
    const safeModels = results.filter(r => r.tccPercentile <= 75);
    if (safeModels.length > 0) {
      return safeModels.reduce((best, current) => 
        Math.abs(current.alignmentDelta) < Math.abs(best.alignmentDelta) ? current : best
      );
    }
    
    // If no safe models, find best alignment among models with TCC ≤ 90th
    const acceptableModels = results.filter(r => r.tccPercentile <= 90);
    if (acceptableModels.length > 0) {
      return acceptableModels.reduce((best, current) => 
        Math.abs(current.alignmentDelta) < Math.abs(best.alignmentDelta) ? current : best
      );
    }
    
    // Fallback: best alignment regardless of percentile
    return results.reduce((best, current) => 
      Math.abs(current.alignmentDelta) < Math.abs(best.alignmentDelta) ? current : best
    );
  }, [results]);

  // Determine best model for productivity motivation (highest effective CF while staying FMV compliant)
  const bestProductivityModel = useMemo(() => {
    if (results.length === 0) return null;
    const fmvCompliant = results.filter(r => r.alignmentStatus === 'Aligned' || r.alignmentStatus === 'Mild Drift');
    if (fmvCompliant.length === 0) return bestFMVModel;
    return fmvCompliant.reduce((best, current) => 
      current.effectiveCF > best.effectiveCF ? current : best
    );
  }, [results, bestFMVModel]);

  // Determine best model for cost effectiveness (lowest cost while maintaining FMV compliance)
  const bestCostEffectiveModel = useMemo(() => {
    if (results.length === 0) return null;
    
    // First, find lowest cost among FMV-safe models (≤75th percentile)
    const safeModels = results.filter(r => r.tccPercentile <= 75);
    if (safeModels.length > 0) {
      return safeModels.reduce((best, current) => 
        current.modeledTcc < best.modeledTcc ? current : best
      );
    }
    
    // Fallback: lowest cost among acceptable models (≤90th percentile)
    const acceptableModels = results.filter(r => r.tccPercentile <= 90);
    if (acceptableModels.length > 0) {
      return acceptableModels.reduce((best, current) => 
        current.modeledTcc < best.modeledTcc ? current : best
      );
    }
    
    // Last resort: absolute lowest cost
    return results.reduce((best, current) => 
      current.modeledTcc < best.modeledTcc ? current : best
    );
  }, [results]);

  const handleEditModel = (id: string) => {
    setActiveModel(id);
    // Navigate to modeling tab (this will be handled by parent component)
    if (onEditModel) {
      onEditModel(id);
    } else if (typeof window !== 'undefined') {
      // Trigger custom event to notify parent to switch to Modeling tab
      window.dispatchEvent(new CustomEvent('cf-model-edit', { detail: { modelId: id } }));
    }
  };

  const handleViewDetails = (id: string) => {
    setActiveModel(id);
    // Call parent callback if provided, otherwise use custom event
    if (onViewDetails) {
      onViewDetails(id);
    } else if (typeof window !== 'undefined') {
      // Trigger custom event to notify parent to switch to Results tab
      window.dispatchEvent(new CustomEvent('cf-model-view-details', { detail: { modelId: id } }));
    }
  };

  const handleDeleteModel = (id: string) => {
    if (confirm('Are you sure you want to delete this model?')) {
      deleteModel(id);
    }
  };

  const handleDuplicateModel = (id: string) => {
    duplicateModel(id);
  };

  if (wrvus <= 0 || !marketBenchmarks.wrvu25 || !marketBenchmarks.tcc25) {
    return (
      <Card className="border-2">
        <CardContent className="p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Complete Setup section to compare models.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (models.length === 0) {
    return (
      <Card className="border-2">
        <CardContent className="p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No saved models to compare. Create and save models in the Modeling tab to see them here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Model Comparison
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Compare all saved CF models side-by-side. Models are automatically calculated using current setup context.
            </p>
          </div>
          {results.length > 0 && (
            <div className="ml-4">
              <CFModelReportExport
                reportData={{
                  models: models.map(m => ({
                    id: m.id,
                    name: m.name,
                    model: m.model,
                    specialty: m.specialty,
                    createdAt: m.createdAt,
                  })),
                  results,
                  context: {
                    wrvus,
                    fte,
                    fixedComp,
                    specialty: models[0]?.specialty,
                    marketBenchmarks,
                  },
                  bestFMVModelId: bestFMVModel?.id,
                  bestProductivityModelId: bestProductivityModel?.id,
                  bestCostEffectiveModelId: bestCostEffectiveModel?.id,
                }}
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Comparison Results */}
        {results.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            {/* Model Comparison */}
            <div>

              {/* Visual Card Grid - Mobile Friendly */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {results.map((result) => {
                  const isBestFMV = result.id === bestFMVModel?.id;
                  const isBestProductivity = result.id === bestProductivityModel?.id;
                  const isBestCostEffective = result.id === bestCostEffectiveModel?.id;
                  
                  return (
                    <Card
                      key={result.id}
                      className={`border-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] cursor-pointer active:scale-[0.99] ${
                        isBestFMV 
                          ? 'border-green-500 dark:border-green-600 bg-gradient-to-br from-green-50/50 to-white dark:from-green-900/10 dark:to-gray-900' 
                          : isBestProductivity
                          ? 'border-blue-500 dark:border-blue-600 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-900/10 dark:to-gray-900'
                          : isBestCostEffective
                          ? 'border-purple-500 dark:border-purple-600 bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-900/10 dark:to-gray-900'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => handleViewDetails(result.id)}
                    >
                      <CardContent className="p-6">
                        {/* Header */}
                        <div className="mb-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {result.name}
                              </h3>
                            </div>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditModel(result.id)}
                                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDuplicateModel(result.id)}
                                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                                title="Duplicate"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteModel(result.id)}
                                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Key Metrics */}
                        <div className="space-y-6 mb-6">
                          {/* Total TCC */}
                          <div>
                              <div className="flex items-baseline justify-between mb-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Total Cash Compensation</span>
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
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  {result.costDelta > 0 ? `+${formatCurrency(result.costDelta)}` : formatCurrency(result.costDelta)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-baseline gap-3">
                              <div className="text-3xl font-light text-gray-900 dark:text-white">
                                {formatCurrency(result.modeledTcc)}
                              </div>
                              {result.actualIncentivePay !== undefined && (
                                <div className={`text-lg font-medium ${
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
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Effective Conversion Factor</div>
                            <div className="text-2xl font-light text-gray-900 dark:text-white">
                              {formatCurrency(result.effectiveCF)}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">per wRVU</div>
                          </div>
                        </div>

                        {/* Alignment */}
                        <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex items-center justify-between mb-5">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 tracking-wide uppercase">Percentile Alignment</span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 mb-4">
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">wRVU</span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                                  {formatPercentile(result.wrvuPercentile)}
                                </span>
                              </div>
                              <div className="relative h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                                <div 
                                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                                    result.tccPercentile > result.wrvuPercentile
                                      ? 'bg-gradient-to-r from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 shadow-sm shadow-red-500/20'
                                      : 'bg-gradient-to-r from-green-500 to-green-600 dark:from-green-400 dark:to-green-500 shadow-sm shadow-green-500/20'
                                  }`}
                                  style={{ 
                                    width: `${Math.min(result.wrvuPercentile, 100)}%`,
                                    transition: 'width 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                  }}
                                />
                              </div>
                            </div>
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">TCC</span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                                  {formatPercentile(result.tccPercentile)}
                                </span>
                              </div>
                              <div className="relative h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                                <div 
                                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                                    result.tccPercentile > result.wrvuPercentile
                                      ? 'bg-gradient-to-r from-red-500 to-red-600 dark:from-red-400 dark:to-red-500 shadow-sm shadow-red-500/20'
                                      : 'bg-gradient-to-r from-green-500 to-green-600 dark:from-green-400 dark:to-green-500 shadow-sm shadow-green-500/20'
                                  }`}
                                  style={{ 
                                    width: `${Math.min(result.tccPercentile, 100)}%`,
                                    transition: 'width 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className={`text-xs text-center font-medium pt-1 ${
                            result.wrvuPercentile > result.tccPercentile
                              ? 'text-green-600 dark:text-green-400'
                              : result.tccPercentile > result.wrvuPercentile
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {result.alignmentDelta.toFixed(1)}% difference
                          </div>
                        </div>

                        {/* CF Market Position */}
                        {result.cfPercentile !== null && (
                          <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between mb-5">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 tracking-wide uppercase">CF Market Position</span>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}

