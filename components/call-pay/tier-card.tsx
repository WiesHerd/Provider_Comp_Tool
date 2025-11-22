'use client';

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
import { Tooltip } from '@/components/ui/tooltip';

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
          <Tooltip 
            content={tier.enabled 
              ? "This tier is enabled and will be included in budget calculations. Tap to disable." 
              : "This tier is disabled and won't be included in budget calculations. Tap to enable."}
            side="top"
          >
            <Switch
              checked={tier.enabled}
              onCheckedChange={(checked) => updateField('enabled', checked)}
            />
          </Tooltip>
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

      {/* Coverage Type */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Coverage Type</Label>
        <Select
          value={tier.coverageType}
          onValueChange={(value) =>
            updateField('coverageType', value as CoverageType)
          }
        >
          <SelectTrigger>
            <SelectValue />
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

      {/* Payment Method */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Payment Method</Label>
        <Select
          value={tier.paymentMethod}
          onValueChange={(value) =>
            updateField('paymentMethod', value as PaymentMethod)
          }
        >
          <SelectTrigger>
            <SelectValue />
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
              <Tooltip 
                content={tier.rates.usePercentageBasedRates 
                  ? "Weekend and holiday rates are automatically calculated from weekday rate using percentage uplifts. Tap to switch to manual entry." 
                  : "Enter weekend and holiday rates manually. Tap to automatically calculate from weekday rate using percentage uplifts."}
                side="left"
              >
                <Switch
                  checked={tier.rates.usePercentageBasedRates ?? false}
                  onCheckedChange={(checked) => {
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
              </Tooltip>
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
                      <NumberInput
                        value={tier.rates.weekendUpliftPercent ?? 20}
                        onChange={(value) => {
                          const uplift = value;
                          updateRates({
                            weekendUpliftPercent: uplift,
                            weekend: tier.rates.weekday * (1 + uplift / 100),
                          });
                        }}
                        min={0}
                        max={200}
                        step={0.1}
                        placeholder="20"
                      />
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
                      <NumberInput
                        value={tier.rates.holidayUpliftPercent ?? 30}
                        onChange={(value) => {
                          const uplift = value;
                          updateRates({
                            holidayUpliftPercent: uplift,
                            holiday: tier.rates.weekday * (1 + uplift / 100),
                          });
                        }}
                        min={0}
                        max={200}
                        step={0.1}
                        placeholder="30"
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 self-center">%</span>
                  </div>
                </div>
              </>
            ) : (
              // Manual entry inputs
              <>
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
              </>
            )}
            {showTraumaUplift && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    Trauma / High-Acuity Uplift (%)
                  </Label>
                  <Tooltip 
                    content={tier.rates.traumaUpliftPercent !== undefined 
                      ? "Trauma/high-acuity uplift is enabled. Additional percentage applied to rates for high-acuity cases. Tap to disable." 
                      : "Enable trauma/high-acuity uplift to add an additional percentage to rates for high-acuity cases. Tap to enable."}
                    side="left"
                  >
                    <Switch
                      checked={tier.rates.traumaUpliftPercent !== undefined}
                      onCheckedChange={(checked) =>
                        updateRates({
                          traumaUpliftPercent: checked ? 0 : undefined,
                        })
                      }
                    />
                  </Tooltip>
                </div>
                {tier.rates.traumaUpliftPercent !== undefined && (
                  <NumberInput
                    value={tier.rates.traumaUpliftPercent}
                    onChange={(value) =>
                      updateRates({ traumaUpliftPercent: value })
                    }
                    min={0}
                    max={100}
                    step={0.1}
                    placeholder="0.0"
                  />
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
          <div className="space-y-2">
            <Label className="text-xs text-gray-600 dark:text-gray-400">
              Weekday Calls/Shifts per Month
            </Label>
            <NumberInput
              value={tier.burden.weekdayCallsPerMonth}
              onChange={(value) =>
                updateBurden({ weekdayCallsPerMonth: value })
              }
              min={0}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-gray-600 dark:text-gray-400">
              Weekend Calls/Shifts per Month
            </Label>
            <NumberInput
              value={tier.burden.weekendCallsPerMonth}
              onChange={(value) =>
                updateBurden({ weekendCallsPerMonth: value })
              }
              min={0}
              placeholder="0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-gray-600 dark:text-gray-400">
            Holidays Covered per Year
          </Label>
          <NumberInput
            value={tier.burden.holidaysPerYear}
            onChange={(value) => updateBurden({ holidaysPerYear: value })}
            min={0}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-gray-600 dark:text-gray-400">
            Avg Callbacks per 24h
          </Label>
          <NumberInput
            value={tier.burden.avgCallbacksPer24h}
            onChange={(value) =>
              updateBurden({ avgCallbacksPer24h: value })
            }
            min={0}
            step={0.1}
            placeholder="0.0"
          />
        </div>

        {showCasesInput && (
          <div className="space-y-2">
            <Label className="text-xs text-gray-600 dark:text-gray-400">
              Avg Cases per 24h
              {!isProcedural && (
                <span className="text-gray-400 ml-1">(optional for non-procedural specialties)</span>
              )}
            </Label>
            <NumberInput
              value={tier.burden.avgCasesPer24h || 0}
              onChange={(value) => updateBurden({ avgCasesPer24h: value })}
              min={0}
              step={0.1}
              placeholder="0.0"
            />
          </div>
        )}
      </div>
    </div>
  );
}

