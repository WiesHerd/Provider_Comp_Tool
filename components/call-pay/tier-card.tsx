'use client';

import { useState } from 'react';
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

interface TierCardProps {
  tier: CallTier;
  onTierChange: (tier: CallTier) => void;
  specialty?: Specialty; // Optional specialty to conditionally show fields
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

export function TierCard({ tier, onTierChange, specialty }: TierCardProps) {
  // Track which burden fields are in custom mode
  const [customModes, setCustomModes] = useState({
    weekdayCallsPerMonth: false,
    weekendCallsPerMonth: false,
    holidaysPerYear: false,
    avgCallbacksPer24h: false,
    avgCasesPer24h: false,
  });

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

  const showTraumaUplift =
    tier.paymentMethod === 'Daily / shift rate' ||
    tier.paymentMethod === 'Hourly rate';

  const showCasesInput =
    (tier.paymentMethod === 'Per procedure' ||
      tier.paymentMethod === 'Per wRVU') &&
    isProcedural;

  return (
    <div className="space-y-4">
      {/* Tier Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
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
        />
      </div>

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
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
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
            <div className="flex items-center justify-between py-2 border-t border-gray-200 dark:border-gray-700">
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
          <div className="space-y-2">
            <Label className="text-xs text-gray-600 dark:text-gray-400">
              Rate per {tier.paymentMethod === 'Per procedure' ? 'Procedure' : 'wRVU'}
            </Label>
            <CurrencyInput
              value={tier.rates.weekday}
              onChange={(value) => updateRates({ weekday: value })}
              placeholder="0.00"
            />
          </div>
        )}
      </div>

      {/* Burden Assumptions */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="flex items-start justify-between">
          <Label className="text-sm font-semibold">Burden Assumptions</Label>
          <span className="text-xs text-gray-500 dark:text-gray-400 italic">
            Total service needs per month
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2 flex flex-col">
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
                <button
                  type="button"
                  onClick={() => setCustomModes(prev => ({ ...prev, weekdayCallsPerMonth: false }))}
                  className="text-xs text-primary hover:underline"
                >
                  Use preset values
                </button>
              </div>
            ) : (
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
            )}
          </div>

          <div className="space-y-2 flex flex-col">
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
                <button
                  type="button"
                  onClick={() => setCustomModes(prev => ({ ...prev, weekendCallsPerMonth: false }))}
                  className="text-xs text-primary hover:underline"
                >
                  Use preset values
                </button>
              </div>
            ) : (
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
            )}
          </div>
        </div>

        {/* Holidays and Callbacks - side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs text-gray-600 dark:text-gray-400">
              Holidays Covered per Year
            </Label>
            {customModes.holidaysPerYear ? (
              <div className="space-y-2">
                <NumberInput
                  value={tier.burden.holidaysPerYear}
                  onChange={(value) => updateBurden({ holidaysPerYear: value })}
                  min={0}
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={() => setCustomModes(prev => ({ ...prev, holidaysPerYear: false }))}
                  className="text-xs text-primary hover:underline"
                >
                  Use preset values
                </button>
              </div>
            ) : (
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
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-gray-600 dark:text-gray-400">
              Avg Callbacks per 24h
            </Label>
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
              <button
                type="button"
                onClick={() => setCustomModes(prev => ({ ...prev, avgCallbacksPer24h: false }))}
                className="text-xs text-primary hover:underline"
              >
                Use preset values
              </button>
            </div>
          ) : (
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
                <SelectValue placeholder="Select callbacks" />
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
          )}
          </div>
        </div>

        {showCasesInput && (
          <div className="space-y-2">
            <Label className="text-xs text-gray-600 dark:text-gray-400">
              Avg Cases per 24h
              {!isProcedural && (
                <span className="text-gray-400 ml-1">(optional for non-procedural specialties)</span>
              )}
            </Label>
            {customModes.avgCasesPer24h ? (
              <div className="space-y-2">
                <NumberInput
                  value={tier.burden.avgCasesPer24h || 0}
                  onChange={(value) => updateBurden({ avgCasesPer24h: value })}
                  min={0}
                  step={0.1}
                  placeholder="0.0"
                />
                <button
                  type="button"
                  onClick={() => setCustomModes(prev => ({ ...prev, avgCasesPer24h: false }))}
                  className="text-xs text-primary hover:underline"
                >
                  Use preset values
                </button>
              </div>
            ) : (
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
                  <SelectValue placeholder="Select cases" />
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}

