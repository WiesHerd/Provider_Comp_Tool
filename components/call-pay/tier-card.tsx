'use client';

import { useState, useEffect } from 'react';
import { CallTier, CoverageType, PaymentMethod, Specialty, isProceduralSpecialty } from '@/types/call-pay';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar, Tag, Info, Sparkles } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CallPayContext } from '@/types/call-pay';

interface TierCardProps {
  tier: CallTier;
  onTierChange: (tier: CallTier) => void;
  specialty?: Specialty; // Optional specialty to conditionally show fields
  context?: CallPayContext; // Context for suggestions and auto-fill
}

const COVERAGE_TYPES: CoverageType[] = [
  'In-house',
  'Restricted home',
  'Unrestricted home',
  'Backup only',
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'Annual stipend',
  'Daily / shift rate',
  'Hourly rate',
  'Monthly retainer',
  'Per procedure',
  'Per wRVU',
];

/**
 * Calculate burden suggestions based on rotation ratio and providers
 */
function getBurdenSuggestions(
  providersOnCall: number,
  rotationRatio: number
): {
  weekdayCallsPerMonth: { min: number; max: number; suggested: number };
  weekendCallsPerMonth: { min: number; max: number; suggested: number };
  holidaysPerYear: { min: number; max: number; suggested: number };
} {
  // Typical provider takes 2-4 calls/month
  const typicalCallsPerProvider = 3;
  
  // Estimate total calls based on rotation
  // If 1-in-4 rotation with 8 providers, each provider covers 1/4 of total
  // So total calls = (providersOnCall / rotationRatio) × typicalCallsPerProvider
  const callsPerProvider = typicalCallsPerProvider;
  const totalCallsEstimate = (providersOnCall / rotationRatio) * callsPerProvider;
  
  // Weekday: ~20-22 business days max, suggest 60-80% of max
  const maxWeekday = 22;
  const weekdaySuggested = Math.round(totalCallsEstimate * 0.7); // 70% of estimate
  const weekdayMin = Math.max(5, Math.round(weekdaySuggested * 0.6));
  const weekdayMax = Math.min(maxWeekday, Math.round(weekdaySuggested * 1.2));
  
  // Weekend: ~8-9 weekend days max, suggest 40-60% of weekday
  const maxWeekend = 9;
  const weekendSuggested = Math.round(weekdaySuggested * 0.5); // 50% of weekday
  const weekendMin = Math.max(2, Math.round(weekendSuggested * 0.6));
  const weekendMax = Math.min(maxWeekend, Math.round(weekendSuggested * 1.2));
  
  // Holidays: Common values 6-12, suggest 8-10
  const holidaysSuggested = 9;
  const holidaysMin = 6;
  const holidaysMax = 12;
  
  return {
    weekdayCallsPerMonth: {
      min: weekdayMin,
      max: weekdayMax,
      suggested: Math.max(5, Math.min(maxWeekday, weekdaySuggested))
    },
    weekendCallsPerMonth: {
      min: weekendMin,
      max: weekendMax,
      suggested: Math.max(2, Math.min(maxWeekend, weekendSuggested))
    },
    holidaysPerYear: {
      min: holidaysMin,
      max: holidaysMax,
      suggested: holidaysSuggested
    }
  };
}

export function TierCard({ tier, onTierChange, specialty, context }: TierCardProps) {
  // Track which burden fields are in custom mode
  const [customModes, setCustomModes] = useState({
    weekdayCallsPerMonth: false,
    weekendCallsPerMonth: false,
    holidaysPerYear: false,
    avgCallbacksPer24h: false,
    avgCasesPer24h: false,
  });

  // Track if weekend/holiday rate differentiation is enabled for Per procedure/Per wRVU
  const [useDifferentiatedRates, setUseDifferentiatedRates] = useState(
    tier.paymentMethod === 'Per procedure' || tier.paymentMethod === 'Per wRVU'
      ? (tier.rates.weekend > 0 || tier.rates.holiday > 0)
      : false
  );

  // Sync differentiated rates state when payment method changes
  useEffect(() => {
    if (tier.paymentMethod === 'Per procedure' || tier.paymentMethod === 'Per wRVU') {
      setUseDifferentiatedRates(tier.rates.weekend > 0 || tier.rates.holiday > 0);
    } else {
      setUseDifferentiatedRates(false);
    }
  }, [tier.paymentMethod, tier.rates.weekend, tier.rates.holiday]);

  // Handle custom specialties - check if it's in the predefined list
  const predefinedSpecialties: Specialty[] = [
    'Family Medicine', 'Internal Medicine', 'Hospitalist', 'Pediatrics',
    'Anesthesiology', 'General Surgery', 'Orthopedic Surgery', 'Neurosurgery',
    'Trauma Surgery', 'Cardiothoracic Surgery', 'Vascular Surgery', 'Urology',
    'OB/GYN', 'ENT (Otolaryngology)', 'Ophthalmology', 'Cardiology',
    'Critical Care', 'Emergency Medicine', 'Gastroenterology', 'Nephrology',
    'Neurology', 'Pulmonology', 'Radiology', 'Psychiatry', 'Pathology', 'Other'
  ];
  
  const isPredefined = specialty && predefinedSpecialties.includes(specialty as Specialty);
  const isProcedural = specialty && isPredefined
    ? isProceduralSpecialty(specialty as Specialty)
    : true; // Default to true for custom specialties (show procedural fields)

  // Preset values for dropdowns
  const weekdayPresets = [0, 5, 10, 12, 15, 18, 20, 22, 25, 30];
  const weekendPresets = [0, 2, 4, 6, 8, 10, 12];
  const holidaysPresets = [0, 6, 8, 10, 12, 14, 16];
  const callbacksPresets = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 5.0];
  const updateField = <K extends keyof CallTier>(
    field: K,
    value: CallTier[K]
  ) => {
    onTierChange({ ...tier, [field]: value });
  };

  const updateRates = (updates: Partial<CallTier['rates']>) => {
    updateField('rates', { ...tier.rates, ...updates });
  };

  const updateBurden = (updates: Partial<CallTier['burden']>) => {
    updateField('burden', { ...tier.burden, ...updates });
  };

  // Auto-fill burden from rotation ratio
  const autoFillBurden = () => {
    if (!context || context.providersOnCall === 0 || context.rotationRatio === 0) {
      return;
    }
    const suggestions = getBurdenSuggestions(
      context.providersOnCall,
      context.rotationRatio
    );
    updateBurden({
      weekdayCallsPerMonth: suggestions.weekdayCallsPerMonth.suggested,
      weekendCallsPerMonth: suggestions.weekendCallsPerMonth.suggested,
      holidaysPerYear: suggestions.holidaysPerYear.suggested,
      // Keep callbacks/cases as-is
    });
  };

  // Get suggestions if context is available
  const burdenSuggestions = context && context.providersOnCall > 0 && context.rotationRatio > 0
    ? getBurdenSuggestions(context.providersOnCall, context.rotationRatio)
    : null;

  // Helper functions for tooltip content
  const getWeekdayTooltip = () => {
    const formula = 'weekdayMonthly = weekdayCallsPerMonth × weekdayRate';
    const example = tier.rates.weekday > 0
      ? `Example: ${tier.burden.weekdayCallsPerMonth} calls × $${tier.rates.weekday.toLocaleString()} = $${(tier.burden.weekdayCallsPerMonth * tier.rates.weekday).toLocaleString()}/month`
      : '';
    const appliesTo = 'Daily/Shift Rate, Hourly Rate, Per Procedure, Per wRVU';
    return `Total weekday calls needed per month for the service (not per provider)\n\nFormula: ${formula}${example ? `\n${example}` : ''}\n\nApplies to: ${appliesTo}`;
  };

  const getWeekendTooltip = () => {
    const formula = 'weekendMonthly = weekendCallsPerMonth × weekendRate';
    const example = tier.rates.weekend > 0
      ? `Example: ${tier.burden.weekendCallsPerMonth} calls × $${tier.rates.weekend.toLocaleString()} = $${(tier.burden.weekendCallsPerMonth * tier.rates.weekend).toLocaleString()}/month`
      : '';
    const appliesTo = 'Daily/Shift Rate, Hourly Rate, Per Procedure, Per wRVU';
    return `Total weekend calls needed per month for the service\n\nFormula: ${formula}${example ? `\n${example}` : ''}\n\nApplies to: ${appliesTo}`;
  };

  const getHolidayTooltip = () => {
    const isPerProcedure = tier.paymentMethod === 'Per procedure';
    const isPerWrvu = tier.paymentMethod === 'Per wRVU';
    const isProcedureOrWrvu = isPerProcedure || isPerWrvu;
    const fieldLabel = isPerWrvu ? 'wRVUs' : 'cases';
    const formula = isProcedureOrWrvu
      ? isPerWrvu
        ? 'holidayMonthly = (holidaysPerYear ÷ 12) × avgWrvusPer24h × holidayRate'
        : 'holidayMonthly = (holidaysPerYear ÷ 12) × avgCasesPer24h × holidayRate'
      : 'holidayMonthly = (holidaysPerYear ÷ 12) × holidayRate';
    const avgMonthly = tier.burden.holidaysPerYear > 0 ? (tier.burden.holidaysPerYear / 12).toFixed(2) : '0';
    const example = tier.rates.holiday > 0 && tier.burden.holidaysPerYear > 0
      ? isProcedureOrWrvu
        ? `Example: ${tier.burden.holidaysPerYear} holidays ÷ 12 = ${avgMonthly} holidays/month × ${(tier.burden.avgCasesPer24h || tier.burden.avgCallbacksPer24h || 0).toFixed(1)} ${fieldLabel} × $${tier.rates.holiday.toLocaleString()} = $${((tier.burden.holidaysPerYear / 12) * (tier.burden.avgCasesPer24h || tier.burden.avgCallbacksPer24h || 0) * tier.rates.holiday).toLocaleString()}/month`
        : `Example: ${tier.burden.holidaysPerYear} holidays ÷ 12 = ${avgMonthly} holidays/month × $${tier.rates.holiday.toLocaleString()} = $${((tier.burden.holidaysPerYear / 12) * tier.rates.holiday).toLocaleString()}/month`
      : '';
    const appliesTo = isProcedureOrWrvu
      ? 'Daily/Shift Rate, Hourly Rate, Per Procedure, Per wRVU (optional)'
      : 'Daily/Shift Rate, Hourly Rate';
    return `Total holidays covered per year (averaged monthly: ÷12)\n\nFormula: ${formula}${example ? `\n${example}` : ''}\n\nApplies to: ${appliesTo}`;
  };

  const getCallbacksTooltip = () => {
    const isWrvu = tier.paymentMethod === 'Per wRVU';
    const formula = isWrvu 
      ? 'wRVUsPerMonth = wRVUsPer24h × (weekdayCalls + weekendCalls + holidays)'
      : 'casesPerMonth = callbacksPer24h × (weekdayCalls + weekendCalls)';
    const totalCalls = tier.burden.weekdayCallsPerMonth + tier.burden.weekendCallsPerMonth;
    const totalCallsWithHolidays = totalCalls + (tier.burden.holidaysPerYear / 12);
    const example = tier.burden.avgCallbacksPer24h > 0 && totalCalls > 0
      ? isWrvu
        ? `Example: ${tier.burden.avgCallbacksPer24h} wRVUs/24h × ${totalCallsWithHolidays.toFixed(1)} calls/month = ${(tier.burden.avgCallbacksPer24h * totalCallsWithHolidays).toFixed(1)} wRVUs/month`
        : `Example: ${tier.burden.avgCallbacksPer24h} callbacks × ${totalCalls} calls = ${(tier.burden.avgCallbacksPer24h * totalCalls).toFixed(1)} procedures/month`
      : '';
    const description = isWrvu 
      ? `Average work RVUs per 24-hour call period\n\nFor Per wRVU payment method, enter the average wRVUs generated per 24-hour call period. This is used to calculate total wRVUs per month.`
      : `Average callbacks per 24-hour call period`;
    const appliesTo = 'Per Procedure, Per wRVU';
    return `${description}\n\nFormula: ${formula}${example ? `\n${example}` : ''}\n\nApplies to: ${appliesTo}`;
  };

  const getCasesTooltip = () => {
    const isWrvu = tier.paymentMethod === 'Per wRVU';
    const formula = isWrvu
      ? 'wRVUsPerMonth = avgWrvusPer24h × (weekdayCalls + weekendCalls + holidays)'
      : 'casesPerMonth = avgCasesPer24h × (weekdayCalls + weekendCalls)';
    const totalCalls = tier.burden.weekdayCallsPerMonth + tier.burden.weekendCallsPerMonth;
    const totalCallsWithHolidays = totalCalls + (tier.burden.holidaysPerYear / 12);
    const example = (tier.burden.avgCasesPer24h || 0) > 0 && totalCalls > 0
      ? isWrvu
        ? `Example: ${tier.burden.avgCasesPer24h} wRVUs/24h × ${totalCallsWithHolidays.toFixed(1)} calls/month = ${((tier.burden.avgCasesPer24h || 0) * totalCallsWithHolidays).toFixed(1)} wRVUs/month`
        : `Example: ${tier.burden.avgCasesPer24h} cases × ${totalCalls} calls = ${((tier.burden.avgCasesPer24h || 0) * totalCalls).toFixed(1)} cases/month`
      : '';
    const description = isWrvu
      ? `Average work RVUs per 24-hour call period (for procedural specialties)\n\nFor Per wRVU payment method, enter the average wRVUs generated per 24-hour call period. This is preferred over callbacks for procedural specialties and is used to calculate total wRVUs per month.`
      : `Average cases per 24-hour call period (for procedural specialties)`;
    const appliesTo = 'Per Procedure, Per wRVU (preferred for procedural specialties)';
    return `${description}\n\nFormula: ${formula}${example ? `\n${example}` : ''}\n\nApplies to: ${appliesTo}`;
  };

  const showTraumaUplift =
    tier.paymentMethod === 'Daily / shift rate' ||
    tier.paymentMethod === 'Hourly rate';

  const showCasesInput =
    (tier.paymentMethod === 'Per procedure' ||
      tier.paymentMethod === 'Per wRVU') &&
    isProcedural;

  return (
    <div className="space-y-4">
      {/* Coverage and Rates Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Coverage & Rates</CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <Switch
                  // @ts-ignore - TypeScript build type resolution issue with Radix UI Switch
                  checked={tier.enabled}
                  onCheckedChange={(checked: boolean) => updateField('enabled', checked)}
                />
                <Label className="text-sm text-gray-600 dark:text-gray-400">
                  {tier.enabled ? 'Enabled' : 'Disabled'}
                </Label>
              </div>
              <Input
                value={tier.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="font-semibold text-base max-w-[120px]"
                placeholder="C1"
                icon={<Tag className="w-5 h-5" />}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Coverage Type and Payment Method - Side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Coverage Type</Label>
              <Select
                value={tier.coverageType}
                onValueChange={(value) =>
                  updateField('coverageType', value as CoverageType)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {COVERAGE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Payment Method</Label>
              <Select
                value={tier.paymentMethod}
                onValueChange={(value) =>
                  updateField('paymentMethod', value as PaymentMethod)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

      {/* Rates */}
      <div className="space-y-3 pt-3 border-t border-gray-200/60 dark:border-gray-700/60">
        <Label className="text-sm font-semibold">Rates</Label>

        {tier.paymentMethod === 'Annual stipend' && (
          <div className="space-y-2">
            <Label className="text-xs text-gray-600 dark:text-gray-400">
              Annual Stipend
            </Label>
            <CurrencyInput
              value={tier.rates.weekday}
              onChange={(value) => updateRates({ weekday: value })}
              placeholder="0.00"
            />
          </div>
        )}

        {tier.paymentMethod === 'Monthly retainer' && (
          <div className="space-y-2">
            <Label className="text-xs text-gray-600 dark:text-gray-400">
              Monthly Retainer
            </Label>
            <CurrencyInput
              value={tier.rates.weekday}
              onChange={(value) => updateRates({ weekday: value })}
              placeholder="0.00"
            />
          </div>
        )}

        {(tier.paymentMethod === 'Daily / shift rate' ||
          tier.paymentMethod === 'Hourly rate') && (
          <>
            <div className="space-y-2">
              <Label className="text-xs text-gray-600 dark:text-gray-400">
                Weekday Rate (Base Rate)
              </Label>
              <CurrencyInput
                value={tier.rates.weekday}
                onChange={(value) => {
                  const updates: Partial<CallTier['rates']> = { weekday: value };
                  // Auto-calculate weekend/holiday if using percentage-based
                  if (tier.rates.usePercentageBasedRates) {
                    if (tier.rates.weekendUpliftPercent !== undefined) {
                      updates.weekend = value * (1 + tier.rates.weekendUpliftPercent / 100);
                    }
                    if (tier.rates.holidayUpliftPercent !== undefined) {
                      updates.holiday = value * (1 + tier.rates.holidayUpliftPercent / 100);
                    }
                  }
                  updateRates(updates);
                }}
                placeholder="0.00"
              />
            </div>

            {/* Toggle between manual and percentage-based rates */}
            <div className="flex items-center justify-between py-2 border-t border-gray-200/60 dark:border-gray-700/60">
              <Label className="text-xs text-gray-600 dark:text-gray-400">
                Calculate from Base Rate
              </Label>
              <Switch
                // @ts-ignore - TypeScript build type resolution issue with Radix UI Switch
                checked={tier.rates.usePercentageBasedRates ?? false}
                onCheckedChange={(checked: boolean) => {
                  if (checked) {
                    // Switch to percentage-based: set defaults if not set
                    const updates: Partial<CallTier['rates']> = {
                      usePercentageBasedRates: true,
                      weekendUpliftPercent: tier.rates.weekendUpliftPercent ?? 20,
                      holidayUpliftPercent: tier.rates.holidayUpliftPercent ?? 30,
                    };
                    // Calculate rates from weekday
                    if (tier.rates.weekday > 0) {
                      updates.weekend = tier.rates.weekday * (1 + (updates.weekendUpliftPercent ?? 20) / 100);
                      updates.holiday = tier.rates.weekday * (1 + (updates.holidayUpliftPercent ?? 30) / 100);
                    }
                    updateRates(updates);
                  } else {
                    // Switch to manual entry: keep current values but disable percentage mode
                    updateRates({ usePercentageBasedRates: false });
                  }
                }}
              />
            </div>

            {tier.rates.usePercentageBasedRates ? (
              // Percentage-based inputs
              <>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    Weekend Rate ({tier.rates.weekendUpliftPercent ?? 20}% above base)
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <CurrencyInput
                        value={tier.rates.weekend}
                        onChange={() => {}} // Read-only when percentage-based
                        placeholder="0.00"
                        disabled
                        className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:text-gray-900 dark:disabled:text-gray-100 disabled:opacity-100"
                        icon={<Calendar className="w-5 h-5" />}
                      />
                    </div>
                    <div className="w-24">
                      <Select
                        value={(tier.rates.weekendUpliftPercent ?? 20).toString()}
                        onValueChange={(value) => {
                          const uplift = parseFloat(value);
                          updateRates({
                            weekendUpliftPercent: uplift,
                            weekend: tier.rates.weekday * (1 + uplift / 100),
                          });
                        }}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 10, 15, 20, 25, 30, 35, 40, 50, 75, 100].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}%
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 self-center">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    Holiday Rate ({tier.rates.holidayUpliftPercent ?? 30}% above base)
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <CurrencyInput
                        value={tier.rates.holiday}
                        onChange={() => {}} // Read-only when percentage-based
                        placeholder="0.00"
                        disabled
                        className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:text-gray-900 dark:disabled:text-gray-100 disabled:opacity-100"
                        icon={<Calendar className="w-5 h-5" />}
                      />
                    </div>
                    <div className="w-24">
                      <Select
                        value={(tier.rates.holidayUpliftPercent ?? 30).toString()}
                        onValueChange={(value) => {
                          const uplift = parseFloat(value);
                          updateRates({
                            holidayUpliftPercent: uplift,
                            holiday: tier.rates.weekday * (1 + uplift / 100),
                          });
                        }}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 15, 20, 25, 30, 35, 40, 50, 75, 100, 150, 200].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}%
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 self-center">%</span>
                  </div>
                </div>
              </>
            ) : (
              // Manual entry inputs - side by side
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    Weekend Rate
                  </Label>
                  <CurrencyInput
                    value={tier.rates.weekend}
                    onChange={(value) => updateRates({ weekend: value })}
                    placeholder="0.00"
                    icon={<Calendar className="w-5 h-5" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    Holiday Rate
                  </Label>
                  <CurrencyInput
                    value={tier.rates.holiday}
                    onChange={(value) => updateRates({ holiday: value })}
                    placeholder="0.00"
                    icon={<Calendar className="w-5 h-5" />}
                  />
                </div>
              </div>
            )}
            {showTraumaUplift && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    Trauma / High-Acuity Uplift (%)
                  </Label>
                  <Switch
                    // @ts-ignore - TypeScript build type resolution issue with Radix UI Switch
                    checked={tier.rates.traumaUpliftPercent !== undefined}
                    onCheckedChange={(checked: boolean) =>
                      updateRates({
                        traumaUpliftPercent: checked ? 0 : undefined,
                      })
                    }
                  />
                </div>
                {tier.rates.traumaUpliftPercent !== undefined && (
                  <Select
                    value={tier.rates.traumaUpliftPercent.toString()}
                    onValueChange={(value) =>
                      updateRates({ traumaUpliftPercent: parseFloat(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select uplift %" />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 5, 10, 15, 20, 25, 30, 35, 40, 50, 75, 100].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </>
        )}

        {(tier.paymentMethod === 'Per procedure' ||
          tier.paymentMethod === 'Per wRVU') && (
          <>
            <div className="space-y-2">
              <Label className="text-xs text-gray-600 dark:text-gray-400">
                Rate per {tier.paymentMethod === 'Per procedure' ? 'Procedure' : 'wRVU'} (Base Rate)
              </Label>
              <CurrencyInput
                value={tier.rates.weekday}
                onChange={(value) => updateRates({ weekday: value })}
                placeholder="0.00"
              />
            </div>

            {/* Optional Weekend/Holiday Rate Differentiation */}
            <div className="flex items-center justify-between gap-2 py-2 border-t border-gray-200 dark:border-gray-700">
              <Label className="text-xs text-gray-600 dark:text-gray-400 flex-1 min-w-0">
                Different rates for weekend/holiday (optional)
              </Label>
              <Switch
                // @ts-ignore - TypeScript build type resolution issue with Radix UI Switch
                checked={useDifferentiatedRates}
                onCheckedChange={(checked: boolean) => {
                  setUseDifferentiatedRates(checked);
                  if (!checked) {
                    // Reset weekend and holiday rates to 0 when disabled
                    updateRates({ weekend: 0, holiday: 0 });
                  } else {
                    // Initialize weekend and holiday rates if not set
                    if (tier.rates.weekend === 0 && tier.rates.holiday === 0) {
                      updateRates({
                        weekend: tier.rates.weekday,
                        holiday: tier.rates.weekday,
                      });
                    }
                  }
                }}
              />
            </div>

            {useDifferentiatedRates && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    Weekend Rate (optional)
                  </Label>
                  <CurrencyInput
                    value={tier.rates.weekend}
                    onChange={(value) => updateRates({ weekend: value })}
                    placeholder="0.00"
                    icon={<Calendar className="w-5 h-5" />}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Leave same as base to use single rate
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    Holiday Rate (optional)
                  </Label>
                  <CurrencyInput
                    value={tier.rates.holiday}
                    onChange={(value) => updateRates({ holiday: value })}
                    placeholder="0.00"
                    icon={<Calendar className="w-5 h-5" />}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Leave same as base to use single rate
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
        </CardContent>
      </Card>

      {/* Burden Assumptions - Only show for payment methods that use burden */}
      {(tier.paymentMethod === 'Daily / shift rate' ||
        tier.paymentMethod === 'Hourly rate' ||
        tier.paymentMethod === 'Per procedure' ||
        tier.paymentMethod === 'Per wRVU') && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-0">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Burden Assumptions</CardTitle>
              <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                Total service needs per month
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3">

          {/* Auto-Fill Button */}
          {context && context.providersOnCall > 0 && context.rotationRatio > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pb-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={autoFillBurden}
                className="text-xs w-full sm:w-auto"
              >
                <Sparkles className="w-3 h-3 mr-1.5" />
                Estimate from Rotation Ratio
              </Button>
              {burdenSuggestions && (
                <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">
                  Based on 1-in-{context.rotationRatio} rotation with {context.providersOnCall} providers
                </span>
              )}
            </div>
          )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2 flex flex-col">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-gray-600 dark:text-gray-400">
                Weekday Calls per Month
              </Label>
              <Tooltip content={getWeekdayTooltip()} side="top" className="max-w-[300px]">
                <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
              </Tooltip>
            </div>
            {customModes.weekdayCallsPerMonth ? (
              <div className="space-y-2">
                <NumberInput
                  value={tier.burden.weekdayCallsPerMonth}
                  onChange={(value) =>
                    updateBurden({ weekdayCallsPerMonth: value })
                  }
                  min={0}
                  placeholder="Weekday calls/month"
                />
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setCustomModes(prev => ({ ...prev, weekdayCallsPerMonth: false }))}
                    className="text-xs text-primary hover:underline"
                  >
                    Use preset values
                  </button>
                  {burdenSuggestions && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Suggested: {burdenSuggestions.weekdayCallsPerMonth.suggested} (range: {burdenSuggestions.weekdayCallsPerMonth.min}-{burdenSuggestions.weekdayCallsPerMonth.max})
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Max ~22 business days/month
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <Select
                  value={weekdayPresets.includes(tier.burden.weekdayCallsPerMonth) 
                    ? tier.burden.weekdayCallsPerMonth.toString() 
                    : 'custom'}
                  onValueChange={(value) => {
                    if (value === 'custom') {
                      setCustomModes(prev => ({ ...prev, weekdayCallsPerMonth: true }));
                    } else {
                      updateBurden({ weekdayCallsPerMonth: parseInt(value, 10) });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Weekday calls/month" />
                  </SelectTrigger>
                  <SelectContent>
                    {weekdayPresets.map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom...</SelectItem>
                  </SelectContent>
                </Select>
                {burdenSuggestions && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Suggested: {burdenSuggestions.weekdayCallsPerMonth.suggested} (range: {burdenSuggestions.weekdayCallsPerMonth.min}-{burdenSuggestions.weekdayCallsPerMonth.max})
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 break-words">
                  Total service needs (not per provider) • Max ~22 business days/month
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2 flex flex-col">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-gray-600 dark:text-gray-400">
                Weekend Calls per Month
              </Label>
              <Tooltip content={getWeekendTooltip()} side="top" className="max-w-[300px]">
                <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
              </Tooltip>
            </div>
            {customModes.weekendCallsPerMonth ? (
              <div className="space-y-2">
                <NumberInput
                  value={tier.burden.weekendCallsPerMonth}
                  onChange={(value) =>
                    updateBurden({ weekendCallsPerMonth: value })
                  }
                  min={0}
                  placeholder="Weekend calls/month"
                />
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setCustomModes(prev => ({ ...prev, weekendCallsPerMonth: false }))}
                    className="text-xs text-primary hover:underline"
                  >
                    Use preset values
                  </button>
                  {burdenSuggestions && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Suggested: {burdenSuggestions.weekendCallsPerMonth.suggested} (range: {burdenSuggestions.weekendCallsPerMonth.min}-{burdenSuggestions.weekendCallsPerMonth.max})
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Max ~8-9 weekend days/month
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <Select
                  value={weekendPresets.includes(tier.burden.weekendCallsPerMonth) 
                    ? tier.burden.weekendCallsPerMonth.toString() 
                    : 'custom'}
                  onValueChange={(value) => {
                    if (value === 'custom') {
                      setCustomModes(prev => ({ ...prev, weekendCallsPerMonth: true }));
                    } else {
                      updateBurden({ weekendCallsPerMonth: parseInt(value, 10) });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Weekend calls/month" />
                  </SelectTrigger>
                  <SelectContent>
                    {weekendPresets.map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom...</SelectItem>
                  </SelectContent>
                </Select>
                {burdenSuggestions && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Suggested: {burdenSuggestions.weekendCallsPerMonth.suggested} (range: {burdenSuggestions.weekendCallsPerMonth.min}-{burdenSuggestions.weekendCallsPerMonth.max})
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 break-words">
                  Total service needs (not per provider) • Max ~8-9 weekend days/month
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Holidays - Show for Daily/Shift Rate, Hourly Rate, and optionally for Per procedure/Per wRVU */}
        {(tier.paymentMethod === 'Daily / shift rate' || 
          tier.paymentMethod === 'Hourly rate' ||
          tier.paymentMethod === 'Per procedure' ||
          tier.paymentMethod === 'Per wRVU') && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-gray-600 dark:text-gray-400">
                Holidays Covered per Year
              </Label>
              <Tooltip content={getHolidayTooltip()} side="top" className="max-w-[300px]">
                <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
              </Tooltip>
            </div>
            {customModes.holidaysPerYear ? (
              <div className="space-y-2">
                <NumberInput
                  value={tier.burden.holidaysPerYear}
                  onChange={(value) => updateBurden({ holidaysPerYear: value })}
                  min={0}
                  placeholder="0"
                />
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setCustomModes(prev => ({ ...prev, holidaysPerYear: false }))}
                    className="text-xs text-primary hover:underline"
                  >
                    Use preset values
                  </button>
                  {burdenSuggestions && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Suggested: {burdenSuggestions.holidaysPerYear.suggested} (range: {burdenSuggestions.holidaysPerYear.min}-{burdenSuggestions.holidaysPerYear.max})
                    </p>
                  )}
                  {tier.burden.holidaysPerYear > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Averaged monthly: {tier.burden.holidaysPerYear} ÷ 12 = {(tier.burden.holidaysPerYear / 12).toFixed(2)} holidays/month
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <Select
                  value={holidaysPresets.includes(tier.burden.holidaysPerYear) 
                    ? tier.burden.holidaysPerYear.toString() 
                    : 'custom'}
                  onValueChange={(value) => {
                    if (value === 'custom') {
                      setCustomModes(prev => ({ ...prev, holidaysPerYear: true }));
                    } else {
                      updateBurden({ holidaysPerYear: parseInt(value, 10) });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select holidays" />
                  </SelectTrigger>
                  <SelectContent>
                    {holidaysPresets.map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom...</SelectItem>
                  </SelectContent>
                </Select>
                {burdenSuggestions && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Suggested: {burdenSuggestions.holidaysPerYear.suggested} (range: {burdenSuggestions.holidaysPerYear.min}-{burdenSuggestions.holidaysPerYear.max})
                  </p>
                )}
                {tier.burden.holidaysPerYear > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Averaged monthly: {tier.burden.holidaysPerYear} ÷ 12 = {(tier.burden.holidaysPerYear / 12).toFixed(2)} holidays/month
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Callbacks - Only show for Per Procedure and Per wRVU */}
        {(tier.paymentMethod === 'Per procedure' || tier.paymentMethod === 'Per wRVU') && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-gray-600 dark:text-gray-400">
                {tier.paymentMethod === 'Per wRVU' ? 'Avg wRVUs per 24h' : 'Avg Callbacks per 24h'}
              </Label>
              <Tooltip content={getCallbacksTooltip()} side="top" className="max-w-[300px]">
                <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
              </Tooltip>
            </div>
            {customModes.avgCallbacksPer24h ? (
              <div className="space-y-2">
                <NumberInput
                  value={tier.burden.avgCallbacksPer24h}
                  onChange={(value) =>
                    updateBurden({ avgCallbacksPer24h: value })
                  }
                  min={0}
                  step={0.1}
                  placeholder="0.0"
                />
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setCustomModes(prev => ({ ...prev, avgCallbacksPer24h: false }))}
                    className="text-xs text-primary hover:underline"
                  >
                    Use preset values
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {tier.paymentMethod === 'Per wRVU' 
                      ? 'Used to calculate total wRVUs per month' 
                      : 'Used to calculate total procedures/cases per month'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <Select
                  value={callbacksPresets.includes(tier.burden.avgCallbacksPer24h) 
                    ? tier.burden.avgCallbacksPer24h.toString() 
                    : 'custom'}
                  onValueChange={(value) => {
                    if (value === 'custom') {
                      setCustomModes(prev => ({ ...prev, avgCallbacksPer24h: true }));
                    } else {
                      updateBurden({ avgCallbacksPer24h: parseFloat(value) });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tier.paymentMethod === 'Per wRVU' ? 'Select wRVUs' : 'Select callbacks'} />
                  </SelectTrigger>
                  <SelectContent>
                    {callbacksPresets.map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom...</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {tier.paymentMethod === 'Per wRVU' 
                    ? 'Used to calculate total wRVUs per month' 
                    : 'Used to calculate total procedures/cases per month'}
                </p>
              </div>
            )}
          </div>
        )}

        {showCasesInput && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-gray-600 dark:text-gray-400">
                {tier.paymentMethod === 'Per wRVU' ? 'Avg wRVUs per 24h' : 'Avg Cases per 24h'}
                {!isProcedural && tier.paymentMethod !== 'Per wRVU' && (
                  <span className="text-gray-400 ml-1">(optional for non-procedural specialties)</span>
                )}
              </Label>
              <Tooltip content={getCasesTooltip()} side="top" className="max-w-[300px]">
                <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
              </Tooltip>
            </div>
            {customModes.avgCasesPer24h ? (
              <div className="space-y-2">
                <NumberInput
                  value={tier.burden.avgCasesPer24h || 0}
                  onChange={(value) => updateBurden({ avgCasesPer24h: value })}
                  min={0}
                  step={0.1}
                  placeholder="0.0"
                />
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setCustomModes(prev => ({ ...prev, avgCasesPer24h: false }))}
                    className="text-xs text-primary hover:underline"
                  >
                    Use preset values
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {tier.paymentMethod === 'Per wRVU' 
                      ? 'Used to calculate total wRVUs per month (preferred over callbacks for procedural specialties)'
                      : 'Preferred over callbacks for procedural specialties'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <Select
                  value={callbacksPresets.includes(tier.burden.avgCasesPer24h || 0) 
                    ? (tier.burden.avgCasesPer24h || 0).toString() 
                    : 'custom'}
                  onValueChange={(value) => {
                    if (value === 'custom') {
                      setCustomModes(prev => ({ ...prev, avgCasesPer24h: true }));
                    } else {
                      updateBurden({ avgCasesPer24h: parseFloat(value) });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tier.paymentMethod === 'Per wRVU' ? 'Select wRVUs' : 'Select cases'} />
                  </SelectTrigger>
                  <SelectContent>
                    {callbacksPresets.map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom...</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {tier.paymentMethod === 'Per wRVU' 
                    ? 'Preferred over callbacks for procedural specialties • Used to calculate total wRVUs per month'
                    : 'Preferred over callbacks for procedural specialties • Used to calculate total cases per month'}
                </p>
              </div>
            )}
          </div>
        )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Adjustment Factors - Optional */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Risk Adjustment Factors
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Apply adjustments for patient complexity, acuity, trauma center status, or case mix
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Label htmlFor={`risk-adjustment-toggle-${tier.id}`} className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                Enable
              </Label>
              <Switch
                id={`risk-adjustment-toggle-${tier.id}`}
                checked={!!tier.riskAdjustment}
                onCheckedChange={(enabled: boolean) => {
                  if (enabled) {
                    // Initialize with default values (all 1.0 = no adjustment)
                    updateField('riskAdjustment', {
                      patientComplexityMultiplier: 1.0,
                      acuityLevelModifier: 1.0,
                      traumaCenterAdjustment: 1.0,
                      caseMixAdjustment: 1.0,
                    });
                  } else {
                    // Remove risk adjustment
                    updateField('riskAdjustment', undefined);
                  }
                }}
              />
            </div>
          </div>
        </CardHeader>
        {tier.riskAdjustment && (
          <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-gray-600 dark:text-gray-400">
                Patient Complexity Multiplier
              </Label>
              <NumberInput
                value={tier.riskAdjustment?.patientComplexityMultiplier || 1.0}
                onChange={(value) =>
                  updateField('riskAdjustment', {
                    ...tier.riskAdjustment,
                    patientComplexityMultiplier: value,
                  })
                }
                min={0.8}
                max={1.5}
                step={0.05}
                placeholder="1.0"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Range: 0.8 - 1.5 (1.0 = no adjustment)
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-600 dark:text-gray-400">
                Acuity Level Modifier
              </Label>
              <NumberInput
                value={tier.riskAdjustment?.acuityLevelModifier || 1.0}
                onChange={(value) =>
                  updateField('riskAdjustment', {
                    ...tier.riskAdjustment,
                    acuityLevelModifier: value,
                  })
                }
                min={0.9}
                max={1.3}
                step={0.05}
                placeholder="1.0"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Range: 0.9 - 1.3 (1.0 = no adjustment)
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-600 dark:text-gray-400">
                Trauma Center Adjustment
              </Label>
              <NumberInput
                value={tier.riskAdjustment?.traumaCenterAdjustment || 1.0}
                onChange={(value) =>
                  updateField('riskAdjustment', {
                    ...tier.riskAdjustment,
                    traumaCenterAdjustment: value,
                  })
                }
                min={1.0}
                max={1.25}
                step={0.05}
                placeholder="1.0"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Range: 1.0 - 1.25 (1.0 = no adjustment)
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-600 dark:text-gray-400">
                Case Mix Adjustment
              </Label>
              <NumberInput
                value={tier.riskAdjustment?.caseMixAdjustment || 1.0}
                onChange={(value) =>
                  updateField('riskAdjustment', {
                    ...tier.riskAdjustment,
                    caseMixAdjustment: value,
                  })
                }
                min={0.85}
                max={1.15}
                step={0.05}
                placeholder="1.0"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Range: 0.85 - 1.15 (1.0 = no adjustment)
              </p>
            </div>
          </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Combined Adjustment:</strong>{' '}
                {(
                  (tier.riskAdjustment.patientComplexityMultiplier || 1.0) *
                  (tier.riskAdjustment.acuityLevelModifier || 1.0) *
                  (tier.riskAdjustment.traumaCenterAdjustment || 1.0) *
                  (tier.riskAdjustment.caseMixAdjustment || 1.0)
                ).toFixed(2)}x
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

