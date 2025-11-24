'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FTEInput } from '@/components/wrvu/fte-input';
import { WRVUInput } from '@/components/wrvu/wrvu-input';
import { KPIChip } from '@/components/wrvu/kpi-chip';
import { ScenarioSaveButton } from '@/components/wrvu/scenario-save-button';
import { CurrencyInput } from '@/components/ui/currency-input';
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
} from '@/components/ui/progressive-form';
import { FTE, ProviderScenario } from '@/types';
import { normalizeWrvus, normalizeTcc } from '@/lib/utils/normalization';
import { ScenarioLoader } from '@/components/scenarios/scenario-loader';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { useScenariosStore } from '@/lib/store/scenarios-store';
import { useProgressiveForm } from '@/components/ui/progressive-form';
import { MonthlyBreakdownChart } from '@/components/wrvu/monthly-breakdown-chart';
import { cn } from '@/lib/utils/cn';

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

interface ResultsStepContentProps {
  annualWrvus: number;
  productivityPay: number;
  productivityPerWrvu: number;
  monthlyBreakdown: number[];
  conversionFactor: number;
  normalizedWrvus: number;
  normalizedProductivityPay: number;
  fte: FTE;
  providerName: string;
  specialty: string;
  customSpecialty: string;
  onStartOver: () => void;
}

function ResultsStepContent({
  annualWrvus,
  productivityPay,
  productivityPerWrvu,
  monthlyBreakdown,
  conversionFactor,
  normalizedWrvus,
  normalizedProductivityPay,
  fte,
  providerName,
  specialty,
  customSpecialty,
  onStartOver,
}: ResultsStepContentProps) {
  const { goToStep } = useProgressiveForm();

  const handleStartOver = () => {
    onStartOver();
    goToStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6" data-tour="wrvu-results">
      <div className="flex items-center justify-between pb-4 border-b-2 border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Results</h3>
      </div>
      <div className="space-y-6">
        {/* KPI Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KPIChip
            label="Productivity Incentive"
            value={productivityPay}
            unit="$"
          />
          <KPIChip
            label="Annual wRVUs"
            value={annualWrvus}
          />
          <KPIChip
            label="Conversion Factor"
            value={conversionFactor}
            unit="$/wRVU"
          />
        </div>

        {/* Monthly Breakdown Chart */}
        {monthlyBreakdown.some(val => val > 0) && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Monthly Breakdown
            </h3>
            <MonthlyBreakdownChart
              monthlyBreakdown={monthlyBreakdown}
              conversionFactor={conversionFactor}
            />
          </div>
        )}

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

        {/* Save and Start Over Buttons */}
        <div className="pt-4 border-t-2 border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <ScenarioSaveButton
                fte={fte}
                annualWrvus={annualWrvus}
                conversionFactor={conversionFactor}
                productivityPay={productivityPay}
                providerName={providerName.trim() || undefined}
                specialty={specialty === 'Other' ? (customSpecialty.trim() || undefined) : (specialty || undefined)}
              />
            </div>
            <Button
              variant="outline"
              onClick={handleStartOver}
              className="w-full sm:w-auto gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Start Over
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WRVUModelerPageContent() {
  const searchParams = useSearchParams();
  const { getScenario, scenarios, loadScenarios } = useScenariosStore();
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

  // Load scenarios on mount
  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  // Check if there are wrvu-modeler scenarios to show border above Provider Info
  const hasWRVUModelerScenarios = React.useMemo(() => {
    return scenarios.some(s => s.scenarioType === 'wrvu-modeler' || (!s.scenarioType && s.annualWrvus));
  }, [scenarios]);

  const handleLoadScenario = useCallback((scenario: ProviderScenario) => {
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
  }, []);

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
  }, [searchParams, scenarioLoaded, handleLoadScenario, getScenario]);

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
    <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto py-4 sm:py-6 md:py-8">
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
          <div className="space-y-6">
            <ScenarioLoader
              scenarioType="wrvu-modeler"
              onLoad={handleLoadScenario}
            />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Provider Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Provider Name</Label>
                  <Input
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    placeholder="Enter name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Specialty</Label>
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
                </div>
              </div>
              {specialty === 'Other' && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Custom Specialty</Label>
                  <Input
                    value={customSpecialty}
                    onChange={(e) => setCustomSpecialty(e.target.value)}
                    placeholder="Enter custom specialty"
                  />
                </div>
              )}
            </div>
          </div>
          <ProgressiveFormNavigation nextLabel="FTE & wRVUs" />
        </ProgressiveFormStep>

        {/* Step 2: FTE & wRVUs */}
        <ProgressiveFormStep step={2}>
          <div className="space-y-6">
            <div className="space-y-2" data-tour="wrvu-fte">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">FTE & wRVUs</h3>
              <FTEInput value={fte} onChange={setFte} />
            </div>

            <div className="pt-4 border-t-2 border-gray-200 dark:border-gray-800" data-tour="wrvu-input">
              <WRVUInput
                annualWrvus={annualWrvus}
                monthlyWrvus={monthlyWrvus}
                monthlyBreakdown={monthlyBreakdown}
                onAnnualChange={setAnnualWrvus}
                onMonthlyChange={setMonthlyWrvus}
                onMonthlyBreakdownChange={setMonthlyBreakdown}
              />
            </div>

            {annualWrvus === 0 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Please enter projected wRVUs to continue.
                </p>
              </div>
            )}
          </div>
          <ProgressiveFormNavigation nextLabel="Conversion Factor" />
        </ProgressiveFormStep>

        {/* Step 3: Conversion Factor */}
        <ProgressiveFormStep step={3}>
          <div className="space-y-4" data-tour="wrvu-conversion">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Conversion Factor</h3>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Conversion Factor ($/wRVU)</Label>
              <CurrencyInput
                value={conversionFactor}
                onChange={setConversionFactor}
                placeholder="45.52"
              />
            </div>

            {conversionFactor === 0 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Please enter a conversion factor to continue.
                </p>
              </div>
            )}
          </div>
          <ProgressiveFormNavigation nextLabel="Results" />
        </ProgressiveFormStep>

        {/* Step 4: Results */}
        <ProgressiveFormStep step={4}>
          <ResultsStepContent
            annualWrvus={annualWrvus}
            productivityPay={productivityPay}
            productivityPerWrvu={productivityPerWrvu}
            monthlyBreakdown={monthlyBreakdown}
            conversionFactor={conversionFactor}
            normalizedWrvus={normalizedWrvus}
            normalizedProductivityPay={normalizedProductivityPay}
            fte={fte}
            providerName={providerName}
            specialty={specialty}
            customSpecialty={customSpecialty}
            onStartOver={handleStartOver}
          />
          <div className="mt-8 sm:mt-10" />
        </ProgressiveFormStep>
      </ProgressiveForm>
    </div>
  );
}

export default function WRVUModelerPage() {
  return (
    <Suspense fallback={<div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto py-4 sm:py-6 md:py-8">Loading...</div>}>
      <WRVUModelerPageContent />
    </Suspense>
  );
}
