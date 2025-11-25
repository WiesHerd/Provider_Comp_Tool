'use client';

import { useState } from 'react';
import { CallPayImpact, CallTier, CallPayContext } from '@/types/call-pay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';
import { useMemo } from 'react';
import { CalculationBreakdown } from './calculation-breakdown';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ImpactSummaryProps {
  impact: CallPayImpact;
  annualAllowableBudget: number | null;
  onBudgetChange: (budget: number | null) => void;
  tiers: CallTier[];
  context: CallPayContext;
}

export function ImpactSummary({ 
  impact, 
  annualAllowableBudget, 
  onBudgetChange,
  tiers,
  context,
}: ImpactSummaryProps) {
  const hasEnabledTiers = impact.tiers.length > 0;
  const [expandedTierId, setExpandedTierId] = useState<string | null>(null);
  
  // Calculate budget usage
  const budgetUsage = useMemo(() => {
    if (!annualAllowableBudget || annualAllowableBudget <= 0) {
      return null;
    }
    const usagePercent = (impact.totalAnnualCallSpend / annualAllowableBudget) * 100;
    const remainingBudget = annualAllowableBudget - impact.totalAnnualCallSpend;
    return {
      percent: Math.min(100, Math.max(0, usagePercent)),
      remaining: remainingBudget,
      exceeded: impact.totalAnnualCallSpend > annualAllowableBudget,
    };
  }, [impact.totalAnnualCallSpend, annualAllowableBudget]);

  // Format values to avoid template literal issues in JSX
  const formattedTotalSpend = impact.totalAnnualCallSpend.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Determine progress bar color
  const getProgressColor = (percent: number) => {
    if (percent >= 95) return 'bg-red-500';
    if (percent >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProgressTextColor = (percent: number) => {
    if (percent >= 95) return 'text-red-600 dark:text-red-400';
    if (percent >= 75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };
  
  return (
    <div className="space-y-8">
      {/* 1. Overall Budget Summary - Show First */}
      <div className="space-y-6">
        {/* Main Budget Display - Prominent */}
        <div className="pb-6 border-b-2 border-gray-200 dark:border-gray-800">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                Total Annual Call Budget
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Annual budget for call coverage
              </div>
            </div>
            <div className={cn(
              "text-4xl sm:text-5xl font-light tracking-tight",
              hasEnabledTiers ? "text-gray-900 dark:text-white" : "text-gray-300 dark:text-gray-600"
            )}>
              ${formattedTotalSpend}
            </div>
          </div>
        </div>

        {/* Secondary Metrics - Grouped with better spacing */}
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Average Call Pay per Provider
            </span>
            <span className="text-base font-semibold text-gray-900 dark:text-white">
              ${impact.averageCallPayPerProvider.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Call Pay per 1.0 FTE
            </span>
            <span className="text-base font-semibold text-gray-900 dark:text-white">
              ${impact.callPayPer1FTE.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          {impact.callPayAsPercentOfTCC !== undefined && (
            <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Call Pay as % of TCC
              </span>
              <span className="text-base font-semibold text-gray-900 dark:text-white">
                {impact.callPayAsPercentOfTCC.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Per-Tier Impact Breakdown */}
      {hasEnabledTiers && (
        <div className="space-y-6 border-t-2 border-gray-200 dark:border-gray-800 pt-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Tier Impact</h3>
          <div className="space-y-6">
            {impact.tiers.map((tierImpact) => {
              const tier = tiers.find(t => t.id === tierImpact.tierId);
              if (!tier) return null;
              
              const isExpanded = expandedTierId === tierImpact.tierId;
              
              return (
                <div key={tierImpact.tierId} className="space-y-3">
                  {/* Tier Header - Clickable with icon */}
                  <button
                    onClick={() => setExpandedTierId(isExpanded ? null : tierImpact.tierId)}
                    className={cn(
                      "w-full text-left transition-all duration-200",
                      "hover:opacity-80 active:opacity-70"
                    )}
                  >
                    <div className="flex items-center justify-between pb-3 border-b-2 border-gray-200 dark:border-gray-800">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {tierImpact.tierName}
                      </h4>
                      <div className="flex items-center gap-2 text-base font-medium text-primary">
                        <span>{isExpanded ? 'Hide' : 'Show'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </button>
                  
                  {/* Calculation Breakdown - Expandable, shown right below header */}
                  {isExpanded && tier && (
                    <div className="pb-4 border-b border-gray-200 dark:border-gray-800 animate-in slide-in-from-top-2 duration-200">
                      <CalculationBreakdown
                        tier={tier}
                        context={context}
                      />
                    </div>
                  )}
                  
                  {/* Tier Metrics - Always visible */}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Annual Pay per Provider
                      </span>
                      <span className="text-base font-semibold text-gray-900 dark:text-white">
                        ${tierImpact.annualPayPerProvider.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Annual Budget for Group
                      </span>
                      <span className="text-base font-semibold text-primary">
                        ${tierImpact.annualPayForGroup.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Effective $/24h
                      </span>
                      <span className="text-base font-semibold text-gray-900 dark:text-white">
                        ${tierImpact.effectiveDollarsPer24h.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Effective $/call
                      </span>
                      <span className="text-base font-semibold text-gray-900 dark:text-white">
                        ${tierImpact.effectiveDollarsPerCall.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Budget Comparison - Optional Comparison with Target */}
      <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-lg">Budget Comparison</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Annual Allowable Budget Input */}
          <div className="space-y-3">
            <div>
              <Label className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                Annual Allowable Budget
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Set your target budget to track spending as you configure call pay
              </p>
            </div>
            <CurrencyInput
              id="annual-budget"
              value={annualAllowableBudget || undefined}
              onChange={(value) => onBudgetChange(value > 0 ? value : null)}
              placeholder="2,000,000"
              className="w-full h-12 text-base touch-manipulation"
              showDecimals={false}
            />
          </div>

          {/* Budget Progress Bar */}
          {budgetUsage && (
            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Budget Usage
                  </span>
                  <span className={cn(
                    "text-sm font-semibold",
                    getProgressTextColor(budgetUsage.percent)
                  )}>
                    {budgetUsage.percent.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2 md:h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500 ease-out",
                      getProgressColor(budgetUsage.percent)
                    )}
                    style={{ width: `${Math.min(100, budgetUsage.percent)}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {budgetUsage.exceeded ? 'Over Budget by' : 'Remaining Budget'}
                </span>
                <span className={cn(
                  "text-sm font-medium",
                  budgetUsage.exceeded 
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-900 dark:text-white"
                )}>
                  {budgetUsage.exceeded ? '-' : ''}$
                  {Math.abs(budgetUsage.remaining).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Minimal Help Text - Apple-style */}
      {!hasEnabledTiers && (
        <p className="text-xs text-gray-400 dark:text-gray-500 pt-4 border-t border-gray-100 dark:border-gray-800">
          Enable tiers above and enter rates to calculate your annual budget automatically.
        </p>
      )}
      
      {hasEnabledTiers && impact.totalAnnualCallSpend === 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 pt-4 border-t border-gray-100 dark:border-gray-800">
          Enter rates and burden assumptions in your enabled tiers to calculate the budget.
        </p>
      )}
    </div>
  );
}

