'use client';

import { CallPayImpact } from '@/types/call-pay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useMemo } from 'react';

interface ImpactSummaryProps {
  impact: CallPayImpact;
  onAddToTCC: () => void;
  annualAllowableBudget: number | null;
  onBudgetChange: (budget: number | null) => void;
}

export function ImpactSummary({ impact, onAddToTCC, annualAllowableBudget, onBudgetChange }: ImpactSummaryProps) {
  const hasEnabledTiers = impact.tiers.length > 0;
  
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
    <div className="space-y-4">
      {/* Per-Tier Impact Cards */}
      {hasEnabledTiers && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Tier Impact</h3>
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex gap-3 pb-2 min-w-max">
              {impact.tiers.map((tier) => (
                <Card key={tier.tierId} className="min-w-[280px]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{tier.tierName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Annual Pay per Provider
                      </span>
                      <span className="font-semibold">
                        $
                        {tier.annualPayPerProvider.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Annual Budget for Group
                      </span>
                      <span className="font-semibold text-primary">
                        $
                        {tier.annualPayForGroup.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Effective $/24h
                      </span>
                      <span className="font-semibold">
                        $
                        {tier.effectiveDollarsPer24h.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Effective $/call
                      </span>
                      <span className="font-semibold">
                        $
                        {tier.effectiveDollarsPerCall.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Combined Call Spend Impact - Apple-style minimal */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
            Step 3: Annual Call Budget
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {hasEnabledTiers 
              ? "Calculated from enabled tiers"
              : "Enable tiers and enter rates to calculate budget"
            }
          </p>
        </div>

        {/* Budget Progress Bar */}
        {budgetUsage && (
          <div className="space-y-3">
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

        {/* Main Budget Display - Apple-style */}
        <div className="py-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Total Annual Call Budget
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                Annual budget for call coverage
              </div>
            </div>
            <div className={cn(
              "text-4xl font-light tracking-tight",
              hasEnabledTiers ? "text-gray-900 dark:text-white" : "text-gray-300 dark:text-gray-600"
            )}>
              ${formattedTotalSpend}
            </div>
          </div>
        </div>

        {/* Secondary Metrics - Apple-style list */}
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Average Call Pay per Provider
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              ${impact.averageCallPayPerProvider.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Call Pay per 1.0 FTE
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              ${impact.callPayPer1FTE.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          {impact.callPayAsPercentOfTCC !== undefined && (
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Call Pay as % of TCC
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {impact.callPayAsPercentOfTCC.toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        {hasEnabledTiers && impact.totalAnnualCallSpend > 0 && (
          <div className="pt-4">
            <Button onClick={onAddToTCC} className="w-full" size="lg" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add to TCC Components
            </Button>
          </div>
        )}
        
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
    </div>
  );
}

