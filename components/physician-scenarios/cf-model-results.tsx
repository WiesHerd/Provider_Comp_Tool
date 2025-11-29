'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ConversionFactorModel, TieredCFParameters, PercentileTieredCFParameters } from '@/types/cf-models';
import { TCCComponent, MarketBenchmarks } from '@/types';
import { FTE } from '@/types';
import { getCFModelSummary } from '@/lib/utils/cf-model-engine';
import { calculateIncentivePayWithModel } from '@/lib/utils/cf-model-engine';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { calculateWRVUPercentile } from '@/lib/utils/percentile';

interface CFModelResultsProps {
  cfModel: ConversionFactorModel;
  wrvus: number;
  fte: FTE;
  fixedComp: number;
  tccComponents: TCCComponent[];
  marketBenchmarks: MarketBenchmarks;
  results: {
    wrvuPercentile: number;
    tccPercentile: number;
    cfPercentile: number | null;
    modeledTcc: number;
    clinicalDollars: number;
    effectiveCF: number;
    alignmentStatus: 'Aligned' | 'Mild Drift' | 'Risk Zone';
    fmvRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | null;
  };
  onAddModel?: () => void;
  showAddButton?: boolean;
}

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

export function CFModelResults({
  cfModel,
  wrvus,
  fte,
  fixedComp,
  tccComponents,
  marketBenchmarks,
  results,
  onAddModel,
  showAddButton = false,
}: CFModelResultsProps) {
  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            <span>Results</span>
            <span className="text-base font-normal text-gray-600 dark:text-gray-400 ml-2">
              — {getCFModelSummary(cfModel)}
            </span>
          </CardTitle>
          {showAddButton && onAddModel && (
            <Button onClick={onAddModel} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Model
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* FMV Risk Warning - Minimal Apple Style */}
        {results.fmvRiskLevel === 'HIGH' && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-500 mt-2" />
              <div className="flex-1">
                <Label className="text-sm font-semibold text-gray-900 dark:text-white mb-1 block">
                  High FMV Risk — TCC Exceeds 90th Percentile
                </Label>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  TCC above the 90th percentile requires exceptional justification and may trigger regulatory scrutiny. Ensure physician productivity and qualifications support this compensation level.
                </p>
                {results.wrvuPercentile >= 90 ? (
                  <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                    Note: wRVU percentile is also ≥90th, which provides support for this compensation level.
                  </p>
                ) : (
                  <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                    Compliance concern: TCC percentile ({formatPercentile(results.tccPercentile)}) significantly exceeds wRVU percentile ({formatPercentile(results.wrvuPercentile)}). This misalignment is a compliance risk.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        {results.fmvRiskLevel === 'MODERATE' && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500 mt-2" />
              <div className="flex-1">
                <Label className="text-sm font-semibold text-gray-900 dark:text-white mb-1 block">
                  Moderate FMV Risk — TCC Between 75th-90th Percentile
                </Label>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  TCC in this range requires thorough documentation and justification per FMV compliance standards.
                </p>
                {results.wrvuPercentile >= 75 ? (
                  <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                    Note: wRVU percentile is also ≥75th, which provides support for this compensation level.
                  </p>
                ) : (
                  <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                    Compliance concern: TCC percentile ({formatPercentile(results.tccPercentile)}) exceeds wRVU percentile ({formatPercentile(results.wrvuPercentile)}). Document physician qualifications and market demand.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        {results.fmvRiskLevel === 'LOW' && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mt-2" />
              <div className="flex-1">
                <Label className="text-sm font-semibold text-gray-900 dark:text-white mb-1 block">
                  FMV Compliant
                </Label>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  TCC within safe range (≤75th percentile). No additional FMV documentation required.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alignment Status - Minimal Apple Style */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block uppercase tracking-wide">
                Percentile Alignment Status
              </Label>
              <div className="text-4xl font-semibold text-gray-900 dark:text-white mb-2">
                {results.alignmentStatus}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {Math.abs(results.tccPercentile - results.wrvuPercentile).toFixed(1)}% difference between TCC and wRVU percentiles
              </p>
            </div>
            {results.fmvRiskLevel && (
              <div className="text-right">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                  FMV Risk
                </div>
                <div className={`text-base font-semibold ${
                  results.fmvRiskLevel === 'LOW'
                    ? 'text-green-600 dark:text-green-400'
                    : results.fmvRiskLevel === 'MODERATE'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {results.fmvRiskLevel}
                </div>
              </div>
            )}
          </div>
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              TCC percentile should align with wRVU percentile for FMV compliance.
            </p>
          </div>
        </div>

        {/* Percentiles Grid - Minimal Apple Style */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block uppercase tracking-wide">
              wRVU Percentile
            </Label>
            <div className="text-3xl font-semibold text-gray-900 dark:text-white mb-1">
              {formatPercentile(results.wrvuPercentile)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Productivity level
            </p>
          </div>
          {results.cfPercentile !== null && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block uppercase tracking-wide">
                CF Percentile
              </Label>
              <div className="text-3xl font-semibold text-gray-900 dark:text-white mb-1">
                {formatPercentile(results.cfPercentile)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {results.cfPercentile >= 50 ? 'Above' : 'Below'} market median
              </p>
            </div>
          )}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <div className="flex items-start justify-between mb-2">
              <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                TCC Percentile
              </Label>
              {results.fmvRiskLevel === 'HIGH' && (
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1" />
              )}
              {results.fmvRiskLevel === 'MODERATE' && (
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1" />
              )}
              {results.fmvRiskLevel === 'LOW' && (
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1" />
              )}
            </div>
            <div className="text-3xl font-semibold text-gray-900 dark:text-white mb-1">
              {formatPercentile(results.tccPercentile)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total compensation
            </p>
          </div>
        </div>

        {/* TCC Breakdown */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 block">
            Total Cash Compensation Breakdown
          </Label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            TCC = Fixed Components + Productivity Incentives (incentives only when wRVUs × CF exceeds fixed comp)
          </p>
          <div className="space-y-3">
            {tccComponents.map((component) => (
              <div key={component.id} className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">{component.type}</span>
                <span className="text-base font-medium text-gray-900 dark:text-white">
                  {formatCurrency(component.amount || 0)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Productivity Incentives
                {results.clinicalDollars === 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    (wRVUs × CF did not exceed fixed comp)
                  </span>
                )}
              </span>
              <span className="text-base font-medium text-gray-900 dark:text-white">
                {formatCurrency(results.clinicalDollars)}
              </span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-gray-900 dark:text-white">
                  Total TCC
                </span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(results.modeledTcc)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tier Contribution Breakdown - Only for Tiered CF Models */}
        {cfModel.modelType === 'tiered' && (
          <TierContributionBreakdown
            wrvus={wrvus}
            fixedComp={fixedComp}
            parameters={cfModel.parameters as TieredCFParameters}
          />
        )}

        {/* Percentile Tier Contribution Breakdown - Only for Percentile-Tiered CF Models */}
        {cfModel.modelType === 'percentile-tiered' && (
          <PercentileTierContributionBreakdown
            wrvus={wrvus}
            fte={fte}
            fixedComp={fixedComp}
            parameters={cfModel.parameters as PercentileTieredCFParameters}
            marketBenchmarks={marketBenchmarks}
          />
        )}

        {/* Calculation Breakdown */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 block">
            Calculation Breakdown
          </Label>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Input wRVUs:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                  {wrvus.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Normalized to 1.0 FTE:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                  {(wrvus / (fte || 1.0)).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">wRVUs × CF Model:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                  {formatCurrency((() => {
                    const fullWrvuComp = calculateIncentivePayWithModel(
                      wrvus,
                      cfModel,
                      0,
                      fte,
                      marketBenchmarks
                    ) + fixedComp;
                    return fullWrvuComp;
                  })())}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Fixed Compensation:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(fixedComp)}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Productivity Incentives:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(results.clinicalDollars)}
                  {results.clinicalDollars === 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                      (no incentive - wRVUs × CF ≤ fixed comp)
                    </span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Effective CF:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(results.effectiveCF)}/wRVU
                </span>
              </div>
            </div>
            {results.cfPercentile !== null && (
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">CF Market Position:</span>
                  <div className="text-right">
                    <span className="text-base font-semibold text-gray-900 dark:text-white">
                      {formatPercentile(results.cfPercentile)} percentile
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {results.cfPercentile >= 50 ? 'Above' : 'Below'} market median
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Insights - Minimal Apple Style */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 block">
            Insights & Recommendations
          </Label>
          <div className="space-y-4">
            {results.alignmentStatus === 'Aligned' && (
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold text-gray-900 dark:text-white">FMV Compliant:</span> Your TCC percentile aligns with your wRVU percentile, indicating the CF model produces market-aligned compensation.
                </p>
              </div>
            )}
            {(results.alignmentStatus === 'Mild Drift' || results.alignmentStatus === 'Risk Zone') && (
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {(() => {
                    const delta = Math.abs(results.tccPercentile - results.wrvuPercentile);
                    const isFmvRisk = results.fmvRiskLevel === 'MODERATE' || results.fmvRiskLevel === 'HIGH';
                    const isAligned = delta <= 10;
                    
                    // If FMV risk but percentiles are aligned, focus on FMV risk
                    if (isFmvRisk && isAligned) {
                      return (
                        <>
                          <span className="font-semibold text-gray-900 dark:text-white">FMV Risk Zone:</span> While your TCC percentile ({formatPercentile(results.tccPercentile)}) aligns with your wRVU percentile ({formatPercentile(results.wrvuPercentile)}), the TCC level itself is in the {results.fmvRiskLevel === 'HIGH' ? 'high' : 'moderate'} risk range. This requires thorough documentation and justification, even though compensation aligns with productivity.
                        </>
                      );
                    }
                    
                    // If misaligned, focus on alignment
                    return (
                      <>
                        <span className="font-semibold text-gray-900 dark:text-white">Alignment Concern:</span> TCC percentile ({formatPercentile(results.tccPercentile)}) differs from wRVU percentile ({formatPercentile(results.wrvuPercentile)}) by {delta.toFixed(1)}%. 
                        {results.tccPercentile > results.wrvuPercentile 
                          ? ' When TCC percentile exceeds wRVU percentile, it can be a compliance concern. Consider reducing CF to improve alignment.' 
                          : ' Consider increasing CF to improve alignment.'}
                      </>
                    );
                  })()}
                </p>
              </div>
            )}
            {results.cfPercentile !== null && (
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold text-gray-900 dark:text-white">CF Analysis:</span> Your effective CF of {formatCurrency(results.effectiveCF)}/wRVU is at the {formatPercentile(results.cfPercentile)} percentile in the market.
                  {results.cfPercentile < 50 && ' Lower CF may reduce productivity incentives.'}
                  {results.cfPercentile >= 50 && results.cfPercentile <= 75 && ' This CF level is within FMV range and should motivate productivity.'}
                  {results.cfPercentile > 75 && ' Higher CF may over-incentivize productivity beyond FMV.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Tier Contribution Breakdown Component - Apple Style
function TierContributionBreakdown({
  wrvus,
  fixedComp,
  parameters,
}: {
  wrvus: number;
  fixedComp: number;
  parameters: TieredCFParameters;
}) {
  const tierBreakdown = useMemo(() => {
    const { tierType, tiers } = parameters;
    const breakdown: Array<{
      tierIndex: number;
      tierLabel: string;
      wrvuRange: string;
      wrvusInTier: number;
      cf: number;
      compensation: number;
      compensationToFixed: number; // How much of this tier goes to covering fixed comp
      compensationToIncentive: number; // How much of this tier contributes to incentive
      isIncentiveTier: boolean; // Whether this tier contributes to incentive
    }> = [];
    
    let totalCompensation = 0;
    let previousThreshold = 0;
    let cumulativeCompensation = 0; // Track cumulative compensation to find where incentive starts
    
    if (tierType === 'threshold') {
      for (let i = 0; i < tiers.length; i++) {
        const tier = tiers[i];
        const nextTier = tiers[i + 1];
        
        let tierStart: number;
        let tierEnd: number;
        let tierWrvus: number;
        let tierCompensation: number;
        let tierLabel: string;
        
        if (nextTier && tier.threshold !== undefined) {
          // Not the last tier
          tierStart = previousThreshold;
          tierEnd = tier.threshold;
          tierWrvus = Math.max(0, Math.min(wrvus - tierStart, tierEnd - tierStart));
          tierCompensation = tierWrvus * tier.cf;
          tierLabel = `Tier ${i + 1}`;
          previousThreshold = tierEnd;
        } else {
          // Last tier
          const finalTierThreshold = tier.threshold !== undefined ? tier.threshold : previousThreshold;
          tierStart = finalTierThreshold;
          tierEnd = wrvus; // Use actual wRVUs for final tier
          tierWrvus = Math.max(0, wrvus - finalTierThreshold);
          tierCompensation = tierWrvus * tier.cf;
          tierLabel = `Final Tier`;
        }
        
        totalCompensation += tierCompensation;
        
        // Calculate how much of this tier goes to fixed comp vs incentive
        const compensationBeforeThisTier = cumulativeCompensation;
        const compensationAfterThisTier = cumulativeCompensation + tierCompensation;
        
        let compensationToFixed = 0;
        let compensationToIncentive = 0;
        let isIncentiveTier = false;
        
        if (compensationBeforeThisTier < fixedComp) {
          // This tier crosses the fixed comp threshold
          if (compensationAfterThisTier <= fixedComp) {
            // Entire tier goes to fixed comp
            compensationToFixed = tierCompensation;
            compensationToIncentive = 0;
          } else {
            // Part of tier goes to fixed comp, rest to incentive
            compensationToFixed = fixedComp - compensationBeforeThisTier;
            compensationToIncentive = tierCompensation - compensationToFixed;
            isIncentiveTier = true;
          }
        } else {
          // Entire tier goes to incentive
          compensationToFixed = 0;
          compensationToIncentive = tierCompensation;
          isIncentiveTier = true;
        }
        
        breakdown.push({
          tierIndex: i + 1,
          tierLabel,
          wrvuRange: tierLabel === 'Final Tier' 
            ? `${tierStart.toLocaleString('en-US', { maximumFractionDigits: 0 })}+`
            : `${tierStart.toLocaleString('en-US', { maximumFractionDigits: 0 })} - ${tierEnd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
          wrvusInTier: tierWrvus,
          cf: tier.cf,
          compensation: tierCompensation,
          compensationToFixed,
          compensationToIncentive,
          isIncentiveTier,
        });
        
        cumulativeCompensation += tierCompensation;
      }
    }
    
    return { breakdown, totalCompensation };
  }, [wrvus, parameters, fixedComp]);

  if (tierBreakdown.breakdown.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
      <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 block">
        Tier Contribution Breakdown
      </Label>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        How each tier contributes to total wRVU compensation (before comparing to fixed comp)
      </p>
      
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {tierBreakdown.breakdown.map((tier, index) => (
            <div key={index} className={`px-4 py-3 ${tier.isIncentiveTier ? 'bg-green-50/30 dark:bg-green-900/10' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {tier.tierLabel}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {tier.wrvuRange} wRVUs
                    </span>
                    {tier.isIncentiveTier && (
                      <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                        Incentive Tier
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {tier.wrvusInTier.toLocaleString('en-US', { maximumFractionDigits: 0 })} wRVUs × ${tier.cf.toFixed(2)} = ${tier.compensation.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>
                  {tier.compensationToFixed > 0 && tier.compensationToIncentive > 0 && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 space-y-0.5">
                      <div>→ ${tier.compensationToFixed.toLocaleString('en-US', { maximumFractionDigits: 0 })} to fixed comp</div>
                      <div className="text-green-600 dark:text-green-400 font-medium">
                        → ${tier.compensationToIncentive.toLocaleString('en-US', { maximumFractionDigits: 0 })} to incentive
                      </div>
                    </div>
                  )}
                  {tier.compensationToFixed > 0 && tier.compensationToIncentive === 0 && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      → ${tier.compensationToFixed.toLocaleString('en-US', { maximumFractionDigits: 0 })} to fixed comp
                    </div>
                  )}
                  {tier.compensationToFixed === 0 && tier.compensationToIncentive > 0 && (
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                      → ${tier.compensationToIncentive.toLocaleString('en-US', { maximumFractionDigits: 0 })} to incentive
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    ${tier.compensation.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {tierBreakdown.totalCompensation > 0 
                      ? `${((tier.compensation / tierBreakdown.totalCompensation) * 100).toFixed(1)}%`
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
              ${tierBreakdown.totalCompensation.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
          </div>
          {tierBreakdown.totalCompensation < fixedComp && (
            <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              Note: wRVU compensation (${tierBreakdown.totalCompensation.toLocaleString('en-US', { maximumFractionDigits: 0 })}) is less than fixed compensation (${fixedComp.toLocaleString('en-US', { maximumFractionDigits: 0 })}). No incentive is paid.
            </div>
          )}
          {tierBreakdown.totalCompensation >= fixedComp && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Incentive paid: ${(tierBreakdown.totalCompensation - fixedComp).toLocaleString('en-US', { maximumFractionDigits: 0 })} (wRVU comp - fixed comp)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Percentile Tier Contribution Breakdown Component - Apple Style
function PercentileTierContributionBreakdown({
  wrvus,
  fte,
  fixedComp,
  parameters,
  marketBenchmarks,
}: {
  wrvus: number;
  fte: FTE;
  fixedComp: number;
  parameters: PercentileTieredCFParameters;
  marketBenchmarks: MarketBenchmarks;
}) {
  const breakdown = useMemo(() => {
    const { tiers } = parameters;
    
    if (tiers.length === 0) {
      return null;
    }

    // Normalize wRVUs for percentile calculation
    const normalizedWrvus = wrvus / (fte || 1.0);
    
    // Calculate what percentile this wRVU value is in the market data
    const wrvuPercentile = calculateWRVUPercentile(normalizedWrvus, marketBenchmarks);
    
    // Find which tier this percentile falls into
    let applicableTierIndex = tiers.length - 1; // Default to last tier
    let applicableTier = tiers[tiers.length - 1];
    let tierPercentileRange = '';
    
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const nextTier = tiers[i + 1];
      
      if (nextTier && tier.percentileThreshold !== undefined) {
        // Not the last tier - check if percentile falls in this range
        const tierStart = i === 0 ? 0 : (tiers[i - 1].percentileThreshold || 0);
        const tierEnd = tier.percentileThreshold;
        
        if (wrvuPercentile >= tierStart && wrvuPercentile < tierEnd) {
          applicableTier = tier;
          applicableTierIndex = i;
          tierPercentileRange = `${tierStart}th - ${tierEnd}th`;
          break;
        }
      } else {
        // Last tier - applies to all percentiles above previous threshold
        const tierStart = i === 0 ? 0 : (tiers[i - 1].percentileThreshold || 0);
        if (wrvuPercentile >= tierStart) {
          applicableTier = tier;
          applicableTierIndex = i;
          tierPercentileRange = `${tierStart}th+`;
          break;
        }
      }
    }
    
    // Apply the CF rate from the applicable tier to all wRVUs
    const totalCompensation = wrvus * applicableTier.cf;
    
    // Calculate how much goes to fixed comp vs incentive
    let compensationToFixed = 0;
    let compensationToIncentive = 0;
    
    if (totalCompensation <= fixedComp) {
      compensationToFixed = totalCompensation;
      compensationToIncentive = 0;
    } else {
      compensationToFixed = fixedComp;
      compensationToIncentive = totalCompensation - fixedComp;
    }
    
    return {
      normalizedWrvus,
      wrvuPercentile,
      applicableTierIndex,
      applicableTier,
      tierPercentileRange,
      totalCompensation,
      compensationToFixed,
      compensationToIncentive,
      cf: applicableTier.cf,
    };
  }, [wrvus, fte, parameters, marketBenchmarks, fixedComp]);

  if (!breakdown) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
      <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 block">
        Percentile Tier Breakdown
      </Label>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        This model applies a single CF rate to all wRVUs based on the wRVU percentile in market data.
      </p>
      
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Key Information */}
        <div className="px-4 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Input wRVUs:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {wrvus.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Normalized to 1.0 FTE:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {breakdown.normalizedWrvus.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">wRVU Percentile in Market:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {breakdown.wrvuPercentile.toFixed(1)}th
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Applicable Tier:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                Tier {breakdown.applicableTierIndex + 1} ({breakdown.tierPercentileRange})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">CF Rate Applied:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(breakdown.cf)}/wRVU
              </span>
            </div>
          </div>
        </div>

        {/* All Tiers Overview */}
        <div className="px-4 py-4">
          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3 block uppercase tracking-wide">
            All Tier Definitions
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {parameters.tiers.map((tier, index) => {
              const isApplicable = index === breakdown.applicableTierIndex;
              const prevThreshold = index > 0 
                ? (parameters.tiers[index - 1].percentileThreshold || 0)
                : 0;
              const tierRange = tier.percentileThreshold !== undefined
                ? `${prevThreshold}th - ${tier.percentileThreshold}th`
                : `${prevThreshold}th+`;
              
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    isApplicable
                      ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                      : 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        Tier {index + 1}
                      </span>
                      {isApplicable && (
                        <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Percentile Range:
                      </span>
                      <span className="text-xs text-gray-900 dark:text-white font-medium">
                        {tierRange}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        CF Rate:
                      </span>
                      <span className="text-xs text-gray-900 dark:text-white font-medium">
                        {formatCurrency(tier.cf)}/wRVU
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Calculation Summary */}
        <div className="px-4 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total wRVU Compensation
              </span>
              <span className="text-base font-semibold text-gray-900 dark:text-white">
                {formatCurrency(breakdown.totalCompensation)}
              </span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Calculation: {wrvus.toLocaleString('en-US', { maximumFractionDigits: 0 })} wRVUs × {formatCurrency(breakdown.cf)}/wRVU = {formatCurrency(breakdown.totalCompensation)}
            </div>
            
            {breakdown.compensationToFixed > 0 && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    → To Fixed Compensation:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(breakdown.compensationToFixed)}
                  </span>
                </div>
                {breakdown.compensationToIncentive > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      → To Productivity Incentive:
                    </span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(breakdown.compensationToIncentive)}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {breakdown.compensationToIncentive === 0 && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Note: Total wRVU compensation ({formatCurrency(breakdown.totalCompensation)}) did not exceed fixed compensation ({formatCurrency(fixedComp)}). No productivity incentive is paid.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

