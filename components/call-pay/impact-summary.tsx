'use client';

import { CallPayImpact } from '@/types/call-pay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ImpactSummaryProps {
  impact: CallPayImpact;
  onAddToTCC: () => void;
}

export function ImpactSummary({ impact, onAddToTCC }: ImpactSummaryProps) {
  const hasEnabledTiers = impact.tiers.length > 0;
  
  return (
    <div className="space-y-4">
      {/* Per-Tier Impact Cards */}
      {hasEnabledTiers && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Tier Impact</h3>
          <div className="overflow-x-auto">
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

      {/* Combined Call Spend Impact */}
      <Card className={cn(
        "border-2 transition-colors",
        hasEnabledTiers ? "border-primary/20 bg-primary/5" : "border-gray-200 dark:border-gray-700"
      )}>
        <CardHeader>
          <CardTitle className="text-xl">Annual Call Budget</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {hasEnabledTiers 
              ? "Annual budget summary for all enabled tiers"
              : "Enable tiers and enter values above to see your annual budget"
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 border-b-2 border-primary/30 dark:border-primary/20 bg-white dark:bg-gray-800 rounded-lg px-4 -mx-4">
              <div>
                <span className="text-lg font-bold text-gray-900 dark:text-white block">
                  Total Annual Call Budget
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                  Your annual budget for call coverage
                </span>
              </div>
              <span className={cn(
                "font-bold text-3xl transition-colors",
                hasEnabledTiers ? "text-primary" : "text-gray-400 dark:text-gray-500"
              )}>
                $
                {impact.totalAnnualCallSpend.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Average Call Pay per Provider
              </span>
              <span className="font-semibold">
                $
                {impact.averageCallPayPerProvider.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Call Pay per 1.0 FTE
              </span>
              <span className="font-semibold">
                $
                {impact.callPayPer1FTE.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            {impact.callPayAsPercentOfTCC !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Call Pay as % of TCC
                </span>
                <span className="font-semibold">
                  {impact.callPayAsPercentOfTCC.toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          {hasEnabledTiers && impact.totalAnnualCallSpend > 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button onClick={onAddToTCC} className="w-full" size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Add to TCC Components
              </Button>
            </div>
          )}
          
          {!hasEnabledTiers && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  ⚠️ No tiers enabled
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                  To calculate your annual budget:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                  <li><strong>Enable a tier</strong> - Toggle the switch at the top of a tier card (C1, C2, etc.)</li>
                  <li><strong>Enter rates</strong> - Set weekday rate (and weekend/holiday if not using percentage-based)</li>
                  <li><strong>Enter burden</strong> - Total calls/shifts needed per month for your service</li>
                  <li><strong>View budget</strong> - Your annual budget will appear here automatically</li>
                </ol>
              </div>
            </div>
          )}
          
          {hasEnabledTiers && impact.totalAnnualCallSpend === 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  💡 Budget is $0
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Make sure you've entered rates and burden assumptions (calls per month) in your enabled tiers.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

