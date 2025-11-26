'use client';

import React, { useState } from 'react';
import { CallPayImpact, CallTier, CallPayContext } from '@/types/call-pay';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/cn';
import { useMemo } from 'react';
import { CalculationBreakdown } from './calculation-breakdown';
import { ChevronDown, ChevronUp, DollarSign, Users, TrendingUp } from 'lucide-react';

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

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Stat Item Component (matching gold standard pattern)
  interface StatItemProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    tooltipText: string;
  }

  function StatItem({ icon, label, value, tooltipText }: StatItemProps) {
    return (
      <div className="p-3 sm:p-4 border border-gray-200 dark:border-gray-800 rounded-lg transition-all bg-white dark:bg-gray-900 hover:shadow-sm">
        {/* Icon and label - Compact layout for mobile */}
        <div className="flex items-start gap-2 mb-3 sm:mb-4">
          <div className="text-primary flex-shrink-0 mt-0.5">{icon}</div>
          <Tooltip content={tooltipText} side="top" className="max-w-[250px] sm:max-w-[300px]">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight block flex-1">
              {label}
            </span>
          </Tooltip>
        </div>
        
        {/* Value - Apple-style: value large */}
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-2xl sm:text-3xl lg:text-4xl font-bold break-words flex-1 text-gray-900 dark:text-gray-100">
            {value}
          </span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* 1. Overall Budget Summary - Show First */}
      <div className="space-y-6">
        {/* Main Budget Display - Prominent Hero Section */}
        <div className="pb-6 border-b-2 border-gray-200 dark:border-gray-800">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Total Annual Call Budget
              </div>
              <div className="text-base text-gray-500 dark:text-gray-400">
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

        {/* Secondary Metrics - Using Stat Items Pattern */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Metrics</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <StatItem
              icon={<Users className="w-6 h-6" />}
              label="Average Call Pay per Provider"
              value={formatCurrency(impact.averageCallPayPerProvider)}
              tooltipText={`Average annual call pay per provider: ${formatCurrency(impact.totalAnnualCallSpend)} total budget ÷ ${context.providersOnCall || 1} providers = ${formatCurrency(impact.averageCallPayPerProvider)}`}
            />
            <StatItem
              icon={<DollarSign className="w-6 h-6" />}
              label="Call Pay per 1.0 FTE"
              value={formatCurrency(impact.callPayPer1FTE)}
              tooltipText={`Call pay normalized to 1.0 FTE (full-time equivalent). This represents the call pay amount per full-time provider.`}
            />
            {impact.callPayAsPercentOfTCC !== undefined && (
              <StatItem
                icon={<TrendingUp className="w-6 h-6" />}
                label="Call Pay as % of TCC"
                value={`${impact.callPayAsPercentOfTCC.toFixed(1)}%`}
                tooltipText={`Call pay as a percentage of Total Cash Compensation (TCC). This shows what portion of total compensation is allocated to call coverage.`}
              />
            )}
          </div>
        </div>
      </div>

      {/* 2. Per-Tier Impact Breakdown */}
      {hasEnabledTiers && (
        <div className="space-y-6 pt-4 border-t-2 border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tier Impact</h3>
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
                      "hover:opacity-80 active:opacity-70",
                      "min-h-[44px] touch-target"
                    )}
                  >
                    <div className="flex items-center justify-between pb-3 border-b-2 border-gray-200 dark:border-gray-800">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {tierImpact.tierName}
                      </h4>
                      <div className="flex items-center">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-primary" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-primary" />
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
                      <Tooltip 
                        content="Annual call pay amount per individual provider after accounting for rotation ratio" 
                        side="top" 
                        className="max-w-[250px] sm:max-w-[300px]"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-help">
                          Annual Pay per Provider
                        </span>
                      </Tooltip>
                      <span className="text-base font-semibold text-gray-900 dark:text-white">
                        ${tierImpact.annualPayPerProvider.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-800">
                      <Tooltip 
                        content="Total annual call pay budget for all providers in the group (per-provider pay × number of providers)" 
                        side="top" 
                        className="max-w-[250px] sm:max-w-[300px]"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-help">
                          Annual Budget for Group
                        </span>
                      </Tooltip>
                      <span className="text-base font-semibold text-primary">
                        ${tierImpact.annualPayForGroup.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-800">
                      <Tooltip 
                        content="Effective cost per 24-hour call period, calculated as annual pay per provider divided by total annual call periods" 
                        side="top" 
                        className="max-w-[250px] sm:max-w-[300px]"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-help">
                          Effective $/24h
                        </span>
                      </Tooltip>
                      <span className="text-base font-semibold text-gray-900 dark:text-white">
                        ${tierImpact.effectiveDollarsPer24h.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5">
                      <Tooltip 
                        content="Effective cost per individual call, calculated as annual pay per provider divided by total annual calls" 
                        side="top" 
                        className="max-w-[250px] sm:max-w-[300px]"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-help">
                          Effective $/call
                        </span>
                      </Tooltip>
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
      <div className="pt-4 border-t-2 border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Budget Comparison</h3>
        <div className="rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
          <div className="space-y-4">
            {/* Annual Allowable Budget Input */}
            <div className="space-y-3">
              <div>
                <Label className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  Annual Allowable Budget
                </Label>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Set your target budget to track spending as you configure call pay
                </p>
              </div>
              <CurrencyInput
                id="annual-budget"
                value={annualAllowableBudget || undefined}
                onChange={(value) => onBudgetChange(value > 0 ? value : null)}
                placeholder="2,000,000"
                className="w-full min-h-[44px] touch-target"
                showDecimals={false}
              />
            </div>

            {/* Budget Progress Bar */}
            {budgetUsage && (
              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Budget Usage
                    </span>
                    <span className={cn(
                      "text-xs sm:text-sm font-semibold",
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
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {budgetUsage.exceeded ? 'Over Budget by' : 'Remaining Budget'}
                  </span>
                  <span className={cn(
                    "text-xs sm:text-sm font-medium",
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
          </div>
        </div>
      </div>

      {/* Minimal Help Text - Apple-style */}
      {!hasEnabledTiers && (
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
          Enable tiers above and enter rates to calculate your annual budget automatically.
        </p>
      )}
      
      {hasEnabledTiers && impact.totalAnnualCallSpend === 0 && (
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
          Enter rates and burden assumptions in your enabled tiers to calculate the budget.
        </p>
      )}
    </div>
  );
}

