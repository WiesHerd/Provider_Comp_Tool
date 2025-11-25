'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as Dialog from '@radix-ui/react-dialog';
import { useScenariosStore } from '@/lib/store/scenarios-store';
import { ProviderScenario, CallPayScenarioData } from '@/types';
import { CallPayContext, CallTier, CallPayImpact } from '@/types/call-pay';
import { Mail, Save } from 'lucide-react';

interface CallPaySaveButtonProps {
  context: CallPayContext;
  tiers: CallTier[];
  impact: CallPayImpact;
  annualAllowableBudget?: number | null;
  onEmailReport?: () => void;
  currentScenarioId?: string | null; // ID of currently loaded scenario, if any
}

export function CallPaySaveButton({ context, tiers, impact, annualAllowableBudget, onEmailReport, currentScenarioId }: CallPaySaveButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { saveScenario, updateScenario, getScenario } = useScenariosStore();
  
  // Load scenario name if updating
  useEffect(() => {
    if (currentScenarioId) {
      const scenario = getScenario(currentScenarioId);
      if (scenario) {
        setName(scenario.name);
        setIsUpdating(true);
      }
    } else {
      setName('');
      setIsUpdating(false);
    }
  }, [currentScenarioId, getScenario]);

  // Pre-fill name for new saves
  useEffect(() => {
    if (open && !currentScenarioId && !name.trim()) {
      const year = context.modelYear || new Date().getFullYear();
      let suggestedName = '';
      
      if (context.specialty) {
        suggestedName = `${context.specialty} Call Coverage ${year}`;
      } else if (context.serviceLine) {
        suggestedName = `${context.serviceLine} Call Coverage ${year}`;
      } else {
        suggestedName = `Call Coverage ${year}`;
      }
      
      setName(suggestedName);
    }
  }, [open, currentScenarioId, context.specialty, context.serviceLine, context.modelYear, name]);

  const handleEmailReport = () => {
    if (onEmailReport) {
      onEmailReport();
      return;
    }

    // Generate comprehensive email report
    const formatCurrency = (value: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);

    const formatNumber = (value: number, decimals: number = 0) =>
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);

    // Helper to calculate tier breakdown
    const getTierBreakdown = (tier: CallTier) => {
      if (!tier.enabled) return null;

      const { paymentMethod, rates, burden } = tier;
      const { rotationRatio } = context;
      let monthlyPay = 0;
      let steps: string[] = [];

      switch (paymentMethod) {
        case 'Annual stipend': {
          monthlyPay = rates.weekday / 12;
          steps.push(`Annual Stipend: ${formatCurrency(rates.weekday)}`);
          steps.push(`Monthly Equivalent: ${formatCurrency(monthlyPay)} (${formatCurrency(rates.weekday)} ÷ 12)`);
          break;
        }
        case 'Daily / shift rate': {
          const weekdayMonthly = burden.weekdayCallsPerMonth * rates.weekday;
          const weekendMonthly = burden.weekendCallsPerMonth * rates.weekend;
          const holidayMonthly = (burden.holidaysPerYear / 12) * rates.holiday;
          monthlyPay = weekdayMonthly + weekendMonthly + holidayMonthly;
          
          steps.push(`Weekday Monthly: ${burden.weekdayCallsPerMonth} calls × ${formatCurrency(rates.weekday)} = ${formatCurrency(weekdayMonthly)}`);
          steps.push(`Weekend Monthly: ${burden.weekendCallsPerMonth} calls × ${formatCurrency(rates.weekend)} = ${formatCurrency(weekendMonthly)}`);
          steps.push(`Holiday Monthly: (${burden.holidaysPerYear} ÷ 12) × ${formatCurrency(rates.holiday)} = ${formatCurrency(holidayMonthly)}`);
          steps.push(`Total Monthly: ${formatCurrency(weekdayMonthly)} + ${formatCurrency(weekendMonthly)} + ${formatCurrency(holidayMonthly)} = ${formatCurrency(monthlyPay)}`);
          
          if (rates.traumaUpliftPercent && rates.traumaUpliftPercent > 0) {
            const upliftAmount = monthlyPay * (rates.traumaUpliftPercent / 100);
            monthlyPay *= 1 + rates.traumaUpliftPercent / 100;
            steps.push(`Trauma Uplift (${rates.traumaUpliftPercent}%): ${formatCurrency(monthlyPay - upliftAmount)} × ${rates.traumaUpliftPercent}% = ${formatCurrency(upliftAmount)}`);
            steps.push(`Adjusted Monthly: ${formatCurrency(monthlyPay)}`);
          }
          break;
        }
        case 'Hourly rate': {
          const weekdayHours = burden.weekdayCallsPerMonth * 24 * rates.weekday;
          const weekendHours = burden.weekendCallsPerMonth * 24 * rates.weekend;
          const holidayHours = (burden.holidaysPerYear / 12) * 24 * rates.holiday;
          monthlyPay = weekdayHours + weekendHours + holidayHours;
          
          steps.push(`Weekday Monthly: ${burden.weekdayCallsPerMonth} calls × 24 hrs × ${formatCurrency(rates.weekday)}/hr = ${formatCurrency(weekdayHours)}`);
          steps.push(`Weekend Monthly: ${burden.weekendCallsPerMonth} calls × 24 hrs × ${formatCurrency(rates.weekend)}/hr = ${formatCurrency(weekendHours)}`);
          steps.push(`Holiday Monthly: (${burden.holidaysPerYear} ÷ 12) × 24 hrs × ${formatCurrency(rates.holiday)}/hr = ${formatCurrency(holidayHours)}`);
          steps.push(`Total Monthly: ${formatCurrency(weekdayHours)} + ${formatCurrency(weekendHours)} + ${formatCurrency(holidayHours)} = ${formatCurrency(monthlyPay)}`);
          
          if (rates.traumaUpliftPercent && rates.traumaUpliftPercent > 0) {
            const upliftAmount = monthlyPay * (rates.traumaUpliftPercent / 100);
            monthlyPay *= 1 + rates.traumaUpliftPercent / 100;
            steps.push(`Trauma Uplift (${rates.traumaUpliftPercent}%): ${formatCurrency(upliftAmount)}`);
            steps.push(`Adjusted Monthly: ${formatCurrency(monthlyPay)}`);
          }
          break;
        }
        case 'Monthly retainer': {
          monthlyPay = rates.weekday;
          steps.push(`Monthly Retainer: ${formatCurrency(monthlyPay)}`);
          break;
        }
        case 'Per procedure': {
          const casesPerMonth = (burden.avgCasesPer24h || burden.avgCallbacksPer24h) * (burden.weekdayCallsPerMonth + burden.weekendCallsPerMonth);
          monthlyPay = casesPerMonth * rates.weekday;
          steps.push(`Cases per Month: ${formatNumber(burden.avgCasesPer24h || burden.avgCallbacksPer24h, 1)} cases/24h × ${burden.weekdayCallsPerMonth + burden.weekendCallsPerMonth} calls = ${formatNumber(casesPerMonth, 1)}`);
          steps.push(`Monthly Pay: ${formatNumber(casesPerMonth, 1)} cases × ${formatCurrency(rates.weekday)}/case = ${formatCurrency(monthlyPay)}`);
          break;
        }
        case 'Per wRVU': {
          const wrvusPerMonth = (burden.avgCasesPer24h || burden.avgCallbacksPer24h) * (burden.weekdayCallsPerMonth + burden.weekendCallsPerMonth);
          monthlyPay = wrvusPerMonth * rates.weekday;
          steps.push(`wRVUs per Month: ${formatNumber(burden.avgCasesPer24h || burden.avgCallbacksPer24h, 1)} wRVUs/24h × ${burden.weekdayCallsPerMonth + burden.weekendCallsPerMonth} calls = ${formatNumber(wrvusPerMonth, 1)}`);
          steps.push(`Monthly Pay: ${formatNumber(wrvusPerMonth, 1)} wRVUs × ${formatCurrency(rates.weekday)}/wRVU = ${formatCurrency(monthlyPay)}`);
          break;
        }
      }

      const annualPayPerProvider = monthlyPay * 12;
      const adjustedAnnualPay = annualPayPerProvider / rotationRatio;
      const annualPayForGroup = adjustedAnnualPay * context.providersOnCall;

      steps.push(`Annual Pay (Before Rotation): ${formatCurrency(monthlyPay)} × 12 = ${formatCurrency(annualPayPerProvider)}`);
      steps.push(`Annual Pay per Provider (1-in-${rotationRatio}): ${formatCurrency(annualPayPerProvider)} ÷ ${rotationRatio} = ${formatCurrency(adjustedAnnualPay)}`);
      steps.push(`Annual Budget for Group (${context.providersOnCall} providers): ${formatCurrency(adjustedAnnualPay)} × ${context.providersOnCall} = ${formatCurrency(annualPayForGroup)}`);

      return {
        monthlyPay,
        annualPayPerProvider: adjustedAnnualPay,
        annualPayForGroup,
        steps,
      };
    };

    // Build email subject
    const subject = encodeURIComponent(`Call Pay Modeler Report - ${context.specialty} ${new Date().getFullYear()}`);

    // Build comprehensive email body
    const enabledTiers = tiers.filter(t => t.enabled);
    const tierSections = enabledTiers.map(tier => {
      const breakdown = getTierBreakdown(tier);
      if (!breakdown) return '';

      const tierImpact = impact.tiers.find(t => t.tierId === tier.id);
      
      return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TIER: ${tier.name} - ${tier.coverageType} Coverage
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONFIGURATION:
  Payment Method: ${tier.paymentMethod}
  Coverage Type: ${tier.coverageType}
  
RATES:
  Weekday Rate: ${formatCurrency(tier.rates.weekday)}
  Weekend Rate: ${formatCurrency(tier.rates.weekend)}
  Holiday Rate: ${formatCurrency(tier.rates.holiday)}
  ${tier.rates.traumaUpliftPercent !== undefined && tier.rates.traumaUpliftPercent > 0 
    ? `Trauma/High-Acuity Uplift: ${tier.rates.traumaUpliftPercent}%` 
    : ''}
  ${tier.rates.usePercentageBasedRates 
    ? `Weekend Uplift: ${tier.rates.weekendUpliftPercent ?? 0}% above base\n  Holiday Uplift: ${tier.rates.holidayUpliftPercent ?? 0}% above base` 
    : ''}

BURDEN ASSUMPTIONS (Total Service Needs):
  Weekday Calls/Shifts per Month: ${tier.burden.weekdayCallsPerMonth}
  Weekend Calls/Shifts per Month: ${tier.burden.weekendCallsPerMonth}
  Holidays Covered per Year: ${tier.burden.holidaysPerYear}
  Avg Callbacks per 24h: ${formatNumber(tier.burden.avgCallbacksPer24h, 1)}
  ${tier.burden.avgCasesPer24h ? `Avg Cases per 24h: ${formatNumber(tier.burden.avgCasesPer24h, 1)}` : ''}

CALCULATION BREAKDOWN:
${breakdown.steps.map((step, i) => `  ${i + 1}. ${step}`).join('\n')}

RESULTS:
  Monthly Pay per Provider: ${formatCurrency(breakdown.monthlyPay)}
  Annual Pay per Provider: ${formatCurrency(breakdown.annualPayPerProvider)}
  Annual Budget for Group: ${formatCurrency(breakdown.annualPayForGroup)}
  ${tierImpact ? `Effective $/24h: ${formatCurrency(tierImpact.effectiveDollarsPer24h)}` : ''}
  ${tierImpact ? `Effective $/call: ${formatCurrency(tierImpact.effectiveDollarsPerCall)}` : ''}
`;
    }).join('\n');

    const emailBody = encodeURIComponent(`CALL PAY MODELER REPORT
Generated: ${new Date().toLocaleDateString('en-US', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

═══════════════════════════════════════════════════════════════════════════════════
EXECUTIVE SUMMARY
═══════════════════════════════════════════════════════════════════════════════════

Specialty: ${context.specialty}
${context.serviceLine ? `Service Line: ${context.serviceLine}\n` : ''}Model Year: ${context.modelYear}
Providers on Call: ${context.providersOnCall}
Rotation Ratio: 1-in-${context.rotationRatio} (each provider covers ${((1 / context.rotationRatio) * 100).toFixed(1)}% of total calls)

TOTAL ANNUAL CALL BUDGET: ${formatCurrency(impact.totalAnnualCallSpend)}
Average Call Pay per Provider: ${formatCurrency(impact.averageCallPayPerProvider)}
Call Pay per 1.0 FTE: ${formatCurrency(impact.callPayPer1FTE)}
${impact.callPayAsPercentOfTCC !== undefined ? `Call Pay as % of TCC: ${impact.callPayAsPercentOfTCC.toFixed(1)}%` : ''}
${annualAllowableBudget ? `\nAnnual Allowable Budget: ${formatCurrency(annualAllowableBudget)}` : ''}
${annualAllowableBudget ? `Budget Usage: ${((impact.totalAnnualCallSpend / annualAllowableBudget) * 100).toFixed(1)}%` : ''}
${annualAllowableBudget ? `Remaining Budget: ${formatCurrency(Math.max(0, annualAllowableBudget - impact.totalAnnualCallSpend))}` : ''}

═══════════════════════════════════════════════════════════════════════════════════
TIER-BY-TIER DETAILED BREAKDOWN
═══════════════════════════════════════════════════════════════════════════════════

${tierSections}

═══════════════════════════════════════════════════════════════════════════════════
KEY INSIGHTS & METHODOLOGY
═══════════════════════════════════════════════════════════════════════════════════

• Rotation Ratio Impact: A 1-in-${context.rotationRatio} rotation means each provider covers ${((1 / context.rotationRatio) * 100).toFixed(1)}% of total service needs. The annual pay per provider is calculated by dividing the total annual service cost by the rotation ratio.

• Burden Assumptions: All burden inputs represent TOTAL service needs per month/year, not per-provider requirements. This ensures accurate budget allocation across the entire group.

• Holiday Distribution: Holidays are averaged monthly (holidays per year ÷ 12) for consistent budgeting throughout the year.

• Trauma/High-Acuity Uplift: When applicable, trauma uplifts are applied to monthly pay before annualization and rotation adjustment.

• Payment Method Variations:
  - Daily/Shift Rate: Based on number of calls/shifts × rate per call/shift
  - Hourly Rate: Calls × 24 hours × hourly rate
  - Annual Stipend: Fixed annual amount divided by rotation ratio
  - Monthly Retainer: Fixed monthly amount × 12 ÷ rotation ratio
  - Per Procedure/wRVU: Based on cases/wRVUs per call × rate per unit

═══════════════════════════════════════════════════════════════════════════════════
AUDIT TRAIL
═══════════════════════════════════════════════════════════════════════════════════

Report Generated: ${new Date().toISOString()}
Enabled Tiers: ${enabledTiers.map(t => t.name).join(', ')}
Total Tiers Configured: ${tiers.length}
Calculation Method: Provider Compensation Intelligence Engine v1.0

═══════════════════════════════════════════════════════════════════════════════════
Generated by CompLens™ Provider Compensation Intelligence
═══════════════════════════════════════════════════════════════════════════════════`);

    // Open email client
    window.location.href = `mailto:?subject=${subject}&body=${emailBody}`;
  };

  const handleSave = () => {
    if (!name.trim()) return;

    // Create TCC component for call pay
    const callPayComponent = {
      id: 'call-pay',
      label: 'Call Pay',
      type: 'Call Pay' as const,
      calculationMethod: 'fixed' as const,
      amount: impact.averageCallPayPerProvider,
      fixedAmount: impact.averageCallPayPerProvider,
    };

    // Store call-pay specific data for restoration
    const callPayData: CallPayScenarioData = {
      context,
      tiers: tiers.filter(t => t.enabled), // Only save enabled tiers
      impact,
    };

    if (currentScenarioId && isUpdating) {
      // Update existing scenario
      updateScenario(currentScenarioId, {
        name: name.trim(),
        specialty: context.specialty,
        providerName: context.serviceLine || undefined,
        tccComponents: [callPayComponent],
        totalTcc: impact.averageCallPayPerProvider,
        normalizedTcc: impact.callPayPer1FTE,
        callPayData,
      });
    } else {
      // Create new scenario
      const scenario: ProviderScenario = {
        id: `call-pay-${Date.now()}`,
        name: name.trim(),
        scenarioType: 'call-pay',
        specialty: context.specialty,
        providerName: context.serviceLine || undefined,
        fte: 1.0,
        annualWrvus: 0,
        tccComponents: [callPayComponent],
        totalTcc: impact.averageCallPayPerProvider,
        normalizedTcc: impact.callPayPer1FTE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        callPayData,
      };
      saveScenario(scenario);
    }

    // Reset state
    if (!currentScenarioId || !isUpdating) {
      setName('');
      setIsUpdating(false);
    }
    setOpen(false);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <Button className="w-full sm:w-auto min-h-[44px] touch-target">
            <Save className="w-4 h-4 mr-2" />
            {currentScenarioId ? 'Update' : 'Save'}
          </Button>
        </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-[90vw] z-50 shadow-xl">
          <Dialog.Title className="text-xl font-bold mb-2">
            {currentScenarioId ? 'Update Call Pay Scenario' : 'Save Call Pay Scenario'}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {currentScenarioId 
              ? `Update the name or save as a new scenario. Current scenario: "${name}"`
              : `Enter a name for this call pay structure. The scenario will include your specialty (${context.specialty}), service line, and tier configuration.`}
          </Dialog.Description>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Cardiology Call Coverage 2025"
            className="mb-4"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              }
            }}
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 space-y-1">
            <div>Specialty: <strong>{context.specialty}</strong></div>
            {context.serviceLine && (
              <div>Service Line: <strong>{context.serviceLine}</strong></div>
            )}
            <div>Annual Call Budget: <strong>${impact.totalAnnualCallSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Dialog.Close asChild>
              <Button variant="outline" className="w-full sm:w-auto min-h-[44px] touch-target">Cancel</Button>
            </Dialog.Close>
            {currentScenarioId && isUpdating && (
              <Button 
                onClick={() => {
                  setIsUpdating(false);
                  setName('');
                }} 
                variant="outline"
                className="w-full sm:w-auto"
              >
                Save as New
              </Button>
            )}
            <Button onClick={handleSave} disabled={!name.trim()} className="w-full sm:w-auto">
              {currentScenarioId && isUpdating ? 'Update' : 'Save'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
    
    <Button 
      variant="outline" 
      onClick={handleEmailReport}
      className="flex-1 w-full sm:w-auto min-h-[44px] touch-target"
    >
      <Mail className="w-4 h-4 mr-2" />
      Email
    </Button>
    </div>
  );
}

