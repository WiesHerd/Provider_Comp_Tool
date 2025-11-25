'use client';

import { useMemo } from 'react';
import { CallTier, CallPayContext } from '@/types/call-pay';
import { calculateTierAnnualPay } from '@/lib/utils/call-pay-coverage';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { cn } from '@/lib/utils/cn';

interface CalculationBreakdownProps {
  tier: CallTier;
  context: CallPayContext;
  className?: string;
}

interface CalculationStep {
  label: string;
  formula: string;
  value: number;
  explanation?: string;
  highlight?: boolean;
}

export function CalculationBreakdown({
  tier,
  context,
  className,
}: CalculationBreakdownProps) {
  const breakdown = useMemo(() => {
    if (!tier.enabled) {
      return {
        steps: [],
        monthlyPay: 0,
        annualPayPerProvider: 0,
        annualPayForGroup: 0,
      };
    }

    const { paymentMethod, rates, burden } = tier;
    const { rotationRatio, providersOnCall } = context;
    const steps: CalculationStep[] = [];
    let monthlyPay = 0;

    switch (paymentMethod) {
      case 'Annual stipend': {
        steps.push({
          label: 'Annual Stipend',
          formula: 'Stipend Amount',
          value: rates.weekday,
          explanation: 'Fixed annual amount paid regardless of call frequency',
        });
        monthlyPay = rates.weekday / 12;
        steps.push({
          label: 'Monthly Equivalent',
          formula: `$${rates.weekday.toLocaleString()} ÷ 12`,
          value: monthlyPay,
          explanation: 'Annual stipend divided by 12 months',
        });
        break;
      }

      case 'Daily / shift rate': {
        // Weekday calculation
        const weekdayMonthly = burden.weekdayCallsPerMonth * rates.weekday;
        steps.push({
          label: 'Weekday Monthly Pay',
          formula: `${burden.weekdayCallsPerMonth} calls × $${rates.weekday.toLocaleString()}`,
          value: weekdayMonthly,
          explanation: 'Total weekday calls per month multiplied by weekday rate',
        });

        // Weekend calculation
        const weekendMonthly = burden.weekendCallsPerMonth * rates.weekend;
        steps.push({
          label: 'Weekend Monthly Pay',
          formula: `${burden.weekendCallsPerMonth} calls × $${rates.weekend.toLocaleString()}`,
          value: weekendMonthly,
          explanation: 'Total weekend calls per month multiplied by weekend rate',
        });

        // Holiday calculation
        const holidayMonthly = (burden.holidaysPerYear / 12) * rates.holiday;
        steps.push({
          label: 'Holiday Monthly Pay',
          formula: `(${burden.holidaysPerYear} holidays ÷ 12) × $${rates.holiday.toLocaleString()}`,
          value: holidayMonthly,
          explanation: 'Annual holidays averaged per month, multiplied by holiday rate',
        });

        // Total monthly
        monthlyPay = weekdayMonthly + weekendMonthly + holidayMonthly;
        steps.push({
          label: 'Total Monthly Pay',
          formula: `$${weekdayMonthly.toLocaleString()} + $${weekendMonthly.toLocaleString()} + $${holidayMonthly.toLocaleString()}`,
          value: monthlyPay,
          highlight: true,
          explanation: 'Sum of weekday, weekend, and holiday monthly pay',
        });

        // Trauma uplift if applicable
        if (rates.traumaUpliftPercent && rates.traumaUpliftPercent > 0) {
          const upliftAmount = monthlyPay * (rates.traumaUpliftPercent / 100);
          monthlyPay *= 1 + rates.traumaUpliftPercent / 100;
          steps.push({
            label: 'Trauma/High-Acuity Uplift',
            formula: `$${monthlyPay.toLocaleString()} × ${rates.traumaUpliftPercent}%`,
            value: upliftAmount,
            explanation: `Additional ${rates.traumaUpliftPercent}% applied for trauma/high-acuity cases`,
          });
          steps.push({
            label: 'Adjusted Monthly Pay',
            formula: `$${(monthlyPay - upliftAmount).toLocaleString()} + $${upliftAmount.toLocaleString()}`,
            value: monthlyPay,
            highlight: true,
          });
        }
        break;
      }

      case 'Hourly rate': {
        const weekdayHours = burden.weekdayCallsPerMonth * 24 * rates.weekday;
        steps.push({
          label: 'Weekday Monthly Pay',
          formula: `${burden.weekdayCallsPerMonth} calls × 24 hours × $${rates.weekday.toLocaleString()}/hr`,
          value: weekdayHours,
          explanation: 'Weekday calls × 24 hours per call × hourly rate',
        });

        const weekendHours = burden.weekendCallsPerMonth * 24 * rates.weekend;
        steps.push({
          label: 'Weekend Monthly Pay',
          formula: `${burden.weekendCallsPerMonth} calls × 24 hours × $${rates.weekend.toLocaleString()}/hr`,
          value: weekendHours,
          explanation: 'Weekend calls × 24 hours per call × hourly rate',
        });

        const holidayHours = (burden.holidaysPerYear / 12) * 24 * rates.holiday;
        steps.push({
          label: 'Holiday Monthly Pay',
          formula: `(${burden.holidaysPerYear} ÷ 12) × 24 hours × $${rates.holiday.toLocaleString()}/hr`,
          value: holidayHours,
          explanation: 'Monthly holiday average × 24 hours × holiday hourly rate',
        });

        monthlyPay = weekdayHours + weekendHours + holidayHours;
        steps.push({
          label: 'Total Monthly Pay',
          formula: `$${weekdayHours.toLocaleString()} + $${weekendHours.toLocaleString()} + $${holidayHours.toLocaleString()}`,
          value: monthlyPay,
          highlight: true,
        });

        if (rates.traumaUpliftPercent && rates.traumaUpliftPercent > 0) {
          const upliftAmount = monthlyPay * (rates.traumaUpliftPercent / 100);
          monthlyPay *= 1 + rates.traumaUpliftPercent / 100;
          steps.push({
            label: 'Trauma/High-Acuity Uplift',
            formula: `$${monthlyPay.toLocaleString()} × ${rates.traumaUpliftPercent}%`,
            value: upliftAmount,
          });
          steps.push({
            label: 'Adjusted Monthly Pay',
            formula: `$${(monthlyPay - upliftAmount).toLocaleString()} + $${upliftAmount.toLocaleString()}`,
            value: monthlyPay,
            highlight: true,
          });
        }
        break;
      }

      case 'Monthly retainer': {
        monthlyPay = rates.weekday;
        steps.push({
          label: 'Monthly Retainer',
          formula: 'Fixed Monthly Amount',
          value: monthlyPay,
          explanation: 'Fixed monthly retainer regardless of call volume',
        });
        break;
      }

      case 'Per procedure': {
        const casesPerMonth =
          (burden.avgCasesPer24h || burden.avgCallbacksPer24h) *
          (burden.weekdayCallsPerMonth + burden.weekendCallsPerMonth);
        steps.push({
          label: 'Cases per Month',
          formula: `${burden.avgCasesPer24h || burden.avgCallbacksPer24h} cases/24h × ${burden.weekdayCallsPerMonth + burden.weekendCallsPerMonth} calls`,
          value: casesPerMonth,
          explanation: 'Average cases per 24-hour period × total monthly calls',
        });
        monthlyPay = casesPerMonth * rates.weekday;
        steps.push({
          label: 'Monthly Pay',
          formula: `${casesPerMonth.toFixed(1)} cases × $${rates.weekday.toLocaleString()}/case`,
          value: monthlyPay,
          highlight: true,
        });
        break;
      }

      case 'Per wRVU': {
        const avgWrvusPerCall = burden.avgCasesPer24h || burden.avgCallbacksPer24h;
        const weekdayWrvusPerMonth = avgWrvusPerCall * burden.weekdayCallsPerMonth;
        const weekendWrvusPerMonth = avgWrvusPerCall * burden.weekendCallsPerMonth;
        const holidayWrvusPerMonth = avgWrvusPerCall * (burden.holidaysPerYear / 12);
        const totalWrvusPerMonth = weekdayWrvusPerMonth + weekendWrvusPerMonth + holidayWrvusPerMonth;
        
        steps.push({
          label: 'Weekday wRVUs per Month',
          formula: `${avgWrvusPerCall} wRVUs/24h × ${burden.weekdayCallsPerMonth} weekday calls`,
          value: weekdayWrvusPerMonth,
          explanation: 'Average wRVUs per 24-hour period × weekday calls per month',
        });
        
        if (burden.weekendCallsPerMonth > 0) {
          steps.push({
            label: 'Weekend wRVUs per Month',
            formula: `${avgWrvusPerCall} wRVUs/24h × ${burden.weekendCallsPerMonth} weekend calls`,
            value: weekendWrvusPerMonth,
            explanation: 'Average wRVUs per 24-hour period × weekend calls per month',
          });
        }
        
        if (burden.holidaysPerYear > 0) {
          steps.push({
            label: 'Holiday wRVUs per Month',
            formula: `${avgWrvusPerCall} wRVUs/24h × ${(burden.holidaysPerYear / 12).toFixed(2)} holidays/month`,
            value: holidayWrvusPerMonth,
            explanation: 'Average wRVUs per 24-hour period × average holidays per month',
          });
        }
        
        steps.push({
          label: 'Total wRVUs per Month',
          formula: `${weekdayWrvusPerMonth.toFixed(1)} + ${weekendWrvusPerMonth.toFixed(1)} + ${holidayWrvusPerMonth.toFixed(1)}`,
          value: totalWrvusPerMonth,
          explanation: 'Sum of weekday, weekend, and holiday wRVUs',
        });
        
        // Calculate pay with optional weekend/holiday rates
        const weekendRate = rates.weekend > 0 ? rates.weekend : rates.weekday;
        const holidayRate = rates.holiday > 0 ? rates.holiday : rates.weekday;
        const weekdayWrvuPay = weekdayWrvusPerMonth * rates.weekday;
        const weekendWrvuPay = weekendWrvusPerMonth * weekendRate;
        const holidayWrvuPay = holidayWrvusPerMonth * holidayRate;
        monthlyPay = weekdayWrvuPay + weekendWrvuPay + holidayWrvuPay;
        
        steps.push({
          label: 'Monthly Pay',
          formula: `(${weekdayWrvusPerMonth.toFixed(1)} × $${rates.weekday.toLocaleString()}) + (${weekendWrvusPerMonth.toFixed(1)} × $${weekendRate.toLocaleString()}) + (${holidayWrvusPerMonth.toFixed(1)} × $${holidayRate.toLocaleString()})`,
          value: monthlyPay,
          highlight: true,
        });
        break;
      }
    }

    // Annual calculation
    const annualPayPerProvider = monthlyPay * 12;
    steps.push({
      label: 'Annual Pay (Before Rotation)',
      formula: `$${monthlyPay.toLocaleString()} × 12 months`,
      value: annualPayPerProvider,
      explanation: 'Monthly pay multiplied by 12 months',
    });

    // Rotation adjustment
    const adjustedAnnualPay = annualPayPerProvider / rotationRatio;
    steps.push({
      label: `Annual Pay per Provider (1-in-${rotationRatio})`,
      formula: `$${annualPayPerProvider.toLocaleString()} ÷ ${rotationRatio}`,
      value: adjustedAnnualPay,
      highlight: true,
      explanation: `Each provider covers 1/${rotationRatio} of total calls, so pay is divided accordingly`,
    });

    // Group budget
    const annualPayForGroup = adjustedAnnualPay * providersOnCall;
    steps.push({
      label: `Annual Budget for Group (${providersOnCall} providers)`,
      formula: `$${adjustedAnnualPay.toLocaleString()} × ${providersOnCall} providers`,
      value: annualPayForGroup,
      highlight: true,
      explanation: 'Per-provider annual pay multiplied by number of providers on call',
    });

    return {
      steps,
      monthlyPay,
      annualPayPerProvider: adjustedAnnualPay,
      annualPayForGroup,
    };
  }, [tier, context]);

  if (!tier.enabled) {
    return (
      <div className={cn('text-sm text-gray-500 dark:text-gray-400 italic', className)}>
        Enable this tier to see calculation breakdown
      </div>
    );
  }

  if (breakdown.steps.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection
      title="How This Calculates"
      description="Step-by-step breakdown of how your inputs translate to annual budget"
      defaultOpen={true}
      hint="Tap to see how rates, burden, and rotation ratio combine to calculate annual pay"
      className={className}
    >
      <div className="space-y-6">
        {/* Summary at top */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-5 border border-blue-100 dark:border-blue-900">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Monthly Pay per Provider
              </span>
              <span className="text-2xl font-light text-gray-900 dark:text-white">
                ${breakdown.monthlyPay.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex items-baseline justify-between border-t border-blue-200 dark:border-blue-800 pt-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Annual Pay per Provider
              </span>
              <span className="text-2xl font-light text-gray-900 dark:text-white">
                ${breakdown.annualPayPerProvider.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex items-baseline justify-between border-t border-blue-200 dark:border-blue-800 pt-3">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Annual Budget for Group
              </span>
              <span className="text-3xl font-light text-primary">
                ${breakdown.annualPayForGroup.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Step-by-step breakdown */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
            Calculation Steps
          </h4>
          <div className="space-y-3">
            {breakdown.steps.map((step, index) => (
              <div
                key={index}
                className={cn(
                  'relative pl-6 pb-4 border-l-2',
                  step.highlight
                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-gray-200 dark:border-gray-700',
                  index === breakdown.steps.length - 1 && 'border-l-0 pb-0'
                )}
              >
                {/* Step number */}
                <div
                  className={cn(
                    'absolute -left-3 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold',
                    step.highlight
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  )}
                >
                  {index + 1}
                </div>

                {/* Step content */}
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          'text-sm font-medium',
                          step.highlight
                            ? 'text-primary dark:text-primary-400'
                            : 'text-gray-900 dark:text-white'
                        )}
                      >
                        {step.label}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-mono mt-1 break-all">
                        {step.formula}
                      </div>
                      {step.explanation && (
                        <div className="text-xs text-gray-500 dark:text-gray-500 italic mt-1.5">
                          {step.explanation}
                        </div>
                      )}
                    </div>
                    <div
                      className={cn(
                        'text-sm font-semibold whitespace-nowrap ml-4',
                        step.highlight
                          ? 'text-primary'
                          : 'text-gray-700 dark:text-gray-300'
                      )}
                    >
                      ${step.value.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key insights */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4 space-y-2">
          <div className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            💡 Key Insights
          </div>
          <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1.5 list-disc list-inside">
            <li>
              <strong>Rotation Ratio:</strong> A 1-in-{context.rotationRatio} rotation means each
              provider covers {((1 / context.rotationRatio) * 100).toFixed(1)}% of total calls
            </li>
            <li>
              <strong>Burden Assumptions:</strong> These represent total service needs, not per-provider
              requirements
            </li>
            {tier.paymentMethod === 'Daily / shift rate' && (
              <li>
                <strong>Holiday Distribution:</strong> Holidays are averaged monthly ({tier.burden.holidaysPerYear} ÷ 12) for
                consistent budgeting
              </li>
            )}
            {tier.rates.traumaUpliftPercent !== undefined &&
              tier.rates.traumaUpliftPercent > 0 && (
                <li>
                  <strong>Trauma Uplift:</strong> Applied to all monthly pay before annualization
                </li>
              )}
          </ul>
        </div>
      </div>
    </CollapsibleSection>
  );
}






