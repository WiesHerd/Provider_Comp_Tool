'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FTEInput } from '@/components/wrvu/fte-input';
import { WRVUInput } from '@/components/wrvu/wrvu-input';
import { KPIChip } from '@/components/wrvu/kpi-chip';
import { ScenarioSaveButton } from '@/components/wrvu/scenario-save-button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { StepBadge } from '@/components/ui/step-badge';
import { ScreenInfoModal } from '@/components/ui/screen-info-modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ProgressiveForm,
  ProgressiveFormStep,
  ProgressiveFormNavigation,
  useProgressiveForm,
} from '@/components/ui/progressive-form';
import { FTE, ProviderScenario } from '@/types';
import { normalizeWrvus, normalizeTcc } from '@/lib/utils/normalization';
import { ScenarioLoader } from '@/components/scenarios/scenario-loader';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { useScenariosStore } from '@/lib/store/scenarios-store';

// Common medical specialties (matching the pattern from other components)
const SPECIALTIES = [
  // Primary Care / Hospital Medicine
  'Family Medicine',
  'Internal Medicine',
  'Hospitalist',
  'Pediatrics',
  // Procedural / Surgical
  'Anesthesiology',
  'General Surgery',
  'Orthopedic Surgery',
  'Neurosurgery',
  'Trauma Surgery',
  'Cardiothoracic Surgery',
  'Vascular Surgery',
  'Urology',
  'OB/GYN',
  'ENT (Otolaryngology)',
  'Ophthalmology',
  // Medical Subspecialties
  'Cardiology',
  'Critical Care',
  'Emergency Medicine',
  'Gastroenterology',
  'Nephrology',
  'Neurology',
  'Pulmonology',
  'Radiology',
  // Other
  'Psychiatry',
  'Pathology',
  'Other',
];

function WRVUModelerPageContent() {
  const searchParams = useSearchParams();
  const { getScenario } = useScenariosStore();
  const [fte, setFte] = useState<FTE>(1.0);
  const previousFteRef = React.useRef<FTE>(1.0);
  const [annualWrvus, setAnnualWrvus] = useState(0);
  const [monthlyWrvus, setMonthlyWrvus] = useState(0);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<number[]>(Array(12).fill(0));
  const [conversionFactor, setConversionFactor] = useState(45.52);
  const [providerName, setProviderName] = useState('');
  const [specialty, setSpecialty] = useState<string>('');
  const [customSpecialty, setCustomSpecialty] = useState('');
  const [scenarioLoaded, setScenarioLoaded] = useState(false);

  // Scale wRVU values when FTE changes
  useEffect(() => {
    const previousFte = previousFteRef.current;
    
    // Only scale if FTE actually changed and we have existing wRVU data
    if (fte !== previousFte && previousFte > 0 && fte > 0) {
      const scaleFactor = fte / previousFte;
      
      // Scale annual wRVUs
      setAnnualWrvus(prev => {
        if (prev > 0) {
          return Math.round(prev * scaleFactor * 100) / 100;
        }
        return prev;
      });
      
      // Scale monthly average
      setMonthlyWrvus(prev => {
        if (prev > 0) {
          return Math.round(prev * scaleFactor * 100) / 100;
        }
        return prev;
      });
      
      // Scale monthly breakdown
      setMonthlyBreakdown(prev => {
        const hasMonthlyData = prev.some(val => val > 0);
        if (hasMonthlyData) {
          return prev.map(val => Math.round(val * scaleFactor * 100) / 100);
        }
        return prev;
      });
    }
    
    // Update previous FTE after scaling
    previousFteRef.current = fte;
  }, [fte]);

  // Calculations
  const productivityPay = annualWrvus * conversionFactor;
  const normalizedWrvus = normalizeWrvus(annualWrvus, fte);
  const normalizedProductivityPay = normalizeTcc(productivityPay, fte);
  const productivityPerWrvu = annualWrvus > 0 ? productivityPay / annualWrvus : 0;

  // Validation functions
  const validateStep1 = () => {
    // Provider name and specialty are optional, so step 1 is always valid
    return true;
  };

  const validateStep2 = () => {
    return annualWrvus > 0;
  };

  const validateStep3 = () => {
    return conversionFactor > 0;
  };

  const handleLoadScenario = (scenario: ProviderScenario) => {
    setFte(scenario.fte);
    const annual = scenario.annualWrvus;
    const monthly = Math.round((annual / 12) * 100) / 100;
    setAnnualWrvus(annual);
    setMonthlyWrvus(monthly);
    setMonthlyBreakdown(Array(12).fill(monthly));
    if (scenario.providerName) setProviderName(scenario.providerName);
    if (scenario.specialty) {
      if (SPECIALTIES.includes(scenario.specialty)) {
        setSpecialty(scenario.specialty);
        setCustomSpecialty('');
      } else {
        setSpecialty('Other');
        setCustomSpecialty(scenario.specialty);
      }
    }
    // Load conversion factor from TCC components if available
    if (scenario.tccComponents && scenario.tccComponents.length > 0) {
      const productivityComponent = scenario.tccComponents.find(
        c => c.type === 'Productivity Incentive'
      );
      if (productivityComponent && annual > 0) {
        setConversionFactor(Math.round((productivityComponent.amount / annual) * 100) / 100);
      }
    }
  };

  // Auto-load scenario from query parameter
  useEffect(() => {
    const scenarioId = searchParams.get('scenario');
    if (scenarioId && !scenarioLoaded) {
      const scenario = getScenario(scenarioId);
      if (scenario && (scenario.scenarioType === 'wrvu-modeler' || !scenario.scenarioType)) {
        handleLoadScenario(scenario);
        setScenarioLoaded(true);
      }
    }
  }, [searchParams, getScenario, scenarioLoaded]);

  const handleStartOver = () => {
    setFte(1.0);
    setAnnualWrvus(0);
    setMonthlyWrvus(0);
    setMonthlyBreakdown(Array(12).fill(0));
    setConversionFactor(45.52);
    setProviderName('');
    setSpecialty('');
    setCustomSpecialty('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
      <ProgressiveForm
        totalSteps={4}
        stepNames={['Provider Info', 'FTE & wRVUs', 'Conversion Factor', 'Results']}
        validateStep={(step) => {
          if (step === 1) return validateStep1();
          if (step === 2) return validateStep2();
          if (step === 3) return validateStep3();
          return true;
        }}
        allowStepJump={false}
      >
        {/* Step 1: Provider Info */}
        <ProgressiveFormStep step={1}>
          <Card className="border border-gray-200 dark:border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <StepBadge number={1} variant="default" />
                <CardTitle className="flex items-center gap-2">
                  Provider Information
                  <ScreenInfoModal
                    title="Provider Information"
                    description="Enter optional provider information to help organize and identify your scenarios.\n\n• Provider Name: Optional identifier for this scenario\n• Specialty: Select your medical specialty from the dropdown or enter a custom specialty\n\nThis information is saved with your scenario and can help you organize multiple calculations. All fields are optional - you can proceed without entering any information."
                  />
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ScenarioLoader
                scenarioType="wrvu-modeler"
                onLoad={handleLoadScenario}
                className="pb-4 border-b border-gray-200 dark:border-gray-700"
              />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Provider Name (Optional)</Label>
                  <Input
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    placeholder="Enter provider name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Specialty (Optional)</Label>
                  <Select value={specialty} onValueChange={(value) => {
                    setSpecialty(value);
                    if (value !== 'Other') {
                      setCustomSpecialty('');
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Primary Care / Hospital Medicine</SelectLabel>
                        {SPECIALTIES.slice(0, 4).map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel>Procedural / Surgical</SelectLabel>
                        {SPECIALTIES.slice(4, 15).map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel>Medical Subspecialties</SelectLabel>
                        {SPECIALTIES.slice(15, 23).map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel>Other</SelectLabel>
                        {SPECIALTIES.slice(23).map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {specialty === 'Other' && (
                    <Input
                      value={customSpecialty}
                      onChange={(e) => setCustomSpecialty(e.target.value)}
                      placeholder="Enter custom specialty"
                      className="mt-2"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <ProgressiveFormNavigation nextLabel="Continue to FTE & wRVUs" />
        </ProgressiveFormStep>

        {/* Step 2: FTE & wRVUs */}
        <ProgressiveFormStep step={2}>
          <Card className="border border-gray-200 dark:border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <StepBadge number={2} variant="default" />
                <CardTitle className="flex items-center gap-2">
                  FTE & Projected wRVUs
                  <ScreenInfoModal
                    title="FTE & Projected wRVUs"
                    description="Enter your Full-Time Equivalent (FTE) status and projected wRVU production.\n\n• FTE: Your employment status from 0.1 to 1.0 (1.0 = full-time)\n• Changing FTE will automatically scale your wRVU values proportionally\n• Projected wRVUs: Enter your annual wRVUs in one of three ways:\n  - Annual: Total annual wRVUs\n  - Monthly Avg: Average wRVUs per month\n  - By Month: Individual monthly breakdown\n\nKey Features:\n• Normalized calculations: All values are normalized to 1.0 FTE for comparison\n• Automatic scaling: When you change FTE, existing wRVU values scale proportionally\n• Flexible input: Choose the input method that works best for your data"
                  />
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <FTEInput value={fte} onChange={setFte} />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Changing FTE will scale wRVU values proportionally. FTE also affects normalized calculations.
                </p>
              </div>

              <WRVUInput
                annualWrvus={annualWrvus}
                monthlyWrvus={monthlyWrvus}
                monthlyBreakdown={monthlyBreakdown}
                onAnnualChange={setAnnualWrvus}
                onMonthlyChange={setMonthlyWrvus}
                onMonthlyBreakdownChange={setMonthlyBreakdown}
              />

              {annualWrvus === 0 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Please enter projected wRVUs to continue.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          <ProgressiveFormNavigation nextLabel="Continue to Conversion Factor" />
        </ProgressiveFormStep>

        {/* Step 3: Conversion Factor */}
        <ProgressiveFormStep step={3}>
          <Card className="border border-gray-200 dark:border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <StepBadge number={3} variant="default" />
                <CardTitle className="flex items-center gap-2">
                  Conversion Factor
                  <ScreenInfoModal
                    title="Conversion Factor"
                    description="Enter your conversion factor to calculate productivity-based compensation.\n\n• Conversion Factor ($/wRVU): The dollar amount paid per wRVU for productivity incentives\n• This represents how much you earn per wRVU generated\n• Common CF values range from $40-$60 per wRVU depending on specialty and market\n\nCalculations:\n• Productivity Pay = Annual wRVUs × Conversion Factor\n• Normalized Productivity Pay = Productivity Pay normalized to 1.0 FTE\n• Productivity $ per wRVU = Productivity Pay ÷ Annual wRVUs\n\nThe conversion factor is a key component in determining your total compensation structure."
                  />
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Conversion Factor ($/wRVU)</Label>
                <CurrencyInput
                  value={conversionFactor}
                  onChange={setConversionFactor}
                  placeholder="45.52"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This is the dollar amount paid per wRVU for productivity incentives.
                </p>
              </div>

              {conversionFactor === 0 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Please enter a conversion factor to continue.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          <ProgressiveFormNavigation nextLabel="Calculate Results" />
        </ProgressiveFormStep>

        {/* Step 4: Results */}
        <ProgressiveFormStep step={4}>
          <Card className="border-2 border-primary/20 dark:border-primary/30 bg-white dark:bg-gray-900 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StepBadge number={4} variant="completed" />
                  <CardTitle>Results</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartOver}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Start Over
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* KPI Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KPIChip
                  label="Annual wRVUs"
                  value={annualWrvus}
                />
                <KPIChip
                  label="Productivity Incentive (at current FTE)"
                  value={productivityPay}
                  unit="$"
                />
                <KPIChip
                  label="Productivity $ per wRVU"
                  value={productivityPerWrvu}
                  unit="$"
                />
              </div>

              {/* Additional Metrics */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Normalized wRVUs (1.0 FTE)</span>
                  <span className="font-semibold text-lg text-primary">
                    {normalizedWrvus.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Normalized Productivity Pay (1.0 FTE)</span>
                  <span className="font-semibold text-lg text-primary">
                    ${normalizedProductivityPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <ScenarioSaveButton
                  fte={fte}
                  annualWrvus={annualWrvus}
                  conversionFactor={conversionFactor}
                  productivityPay={productivityPay}
                  providerName={providerName.trim() || undefined}
                  specialty={specialty === 'Other' ? (customSpecialty.trim() || undefined) : (specialty || undefined)}
                />
              </div>
            </CardContent>
          </Card>
          <div className="mt-8 sm:mt-10" />
        </ProgressiveFormStep>
      </ProgressiveForm>
    </div>
  );
}

export default function WRVUModelerPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">Loading...</div>}>
      <WRVUModelerPageContent />
    </Suspense>
  );
}
