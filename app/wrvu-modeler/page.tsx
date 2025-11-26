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
import { normalizeWrvus } from '@/lib/utils/normalization';
import { ScenarioLoader } from '@/components/scenarios/scenario-loader';
import { Button } from '@/components/ui/button';
import { RotateCcw, User, Stethoscope } from 'lucide-react';
import { useScenariosStore } from '@/lib/store/scenarios-store';
import { useProgressiveForm } from '@/components/ui/progressive-form';
import { MonthlyBreakdownChart } from '@/components/wrvu/monthly-breakdown-chart';
import { useDebouncedLocalStorage } from '@/hooks/use-debounced-local-storage';
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
  monthlyBreakdown: number[];
  conversionFactor: number;
  normalizedWrvus: number;
  normalizedProductivityPay: number;
  fte: FTE;
  basePay: number;
  providerName: string;
  specialty: string;
  customSpecialty: string;
  onStartOver: () => void;
}

function ResultsStepContent({
  annualWrvus,
  productivityPay,
  monthlyBreakdown,
  conversionFactor,
  normalizedWrvus,
  normalizedProductivityPay,
  fte,
  basePay,
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

  // Calculate 1.0 FTE projections
  const normalizedBasePay = fte > 0 ? basePay / fte : 0;

  return (
    <div className="space-y-6" data-tour="wrvu-results">
      <div className="flex items-center justify-between pb-4 border-b-2 border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Results</h3>
      </div>
      <div className="space-y-6">
        {/* KPI Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KPIChip
            label="Base Pay"
            value={basePay}
            unit="$"
          />
          <KPIChip
            label="Productivity Incentive"
            value={productivityPay}
            unit="$"
          />
          <KPIChip
            label="Annual wRVUs"
            value={annualWrvus}
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

        {/* 1.0 FTE Projections - Only show if FTE < 1.0 */}
        {fte < 1.0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Projected at 1.0 FTE (Full-Time)
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Work RVUs at 1.0 FTE</span>
                <span className="font-semibold text-lg text-primary">
                  {normalizedWrvus.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Base Pay at 1.0 FTE</span>
                <span className="font-semibold text-lg text-primary">
                  ${normalizedBasePay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Productivity Incentive at 1.0 FTE</span>
                <span className={cn(
                  "font-semibold text-lg",
                  normalizedProductivityPay < 0 
                    ? "text-red-600 dark:text-red-400" 
                    : "text-primary"
                )}>
                  {normalizedProductivityPay < 0 ? '-' : ''}${Math.abs(normalizedProductivityPay).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Save and Start Over Buttons */}
        <div className="pt-4 border-t-2 border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <ScenarioSaveButton
                fte={fte}
                annualWrvus={annualWrvus}
                conversionFactor={conversionFactor}
                productivityPay={productivityPay}
                basePay={basePay}
                providerName={providerName.trim() || undefined}
                specialty={specialty === 'Other' ? (customSpecialty.trim() || undefined) : (specialty || undefined)}
              />
            </div>
            <Button
              variant="outline"
              onClick={handleStartOver}
              className="w-full sm:w-auto min-h-[44px] touch-target"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
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
  const { getScenario, loadScenarios } = useScenariosStore();
  const [fte, setFte] = useState<FTE>(1.0);
  const previousFteRef = React.useRef<FTE>(1.0);
  const [annualWrvus, setAnnualWrvus] = useState(0);
  const [monthlyWrvus, setMonthlyWrvus] = useState(0);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<number[]>(Array(12).fill(0));
  const [conversionFactor, setConversionFactor] = useState(45.52);
  const [providerName, setProviderName] = useState('');
  const [specialty, setSpecialty] = useState<string>('');
  const [customSpecialty, setCustomSpecialty] = useState('');
  const [basePay, setBasePay] = useState(0);
  const [scenarioLoaded, setScenarioLoaded] = useState(false);

  const STORAGE_KEY = 'wrvuModelerDraftState';

  // Auto-save draft state to localStorage whenever inputs change (debounced)
  const draftState = {
    fte,
    annualWrvus,
    monthlyWrvus,
    monthlyBreakdown,
    conversionFactor,
    providerName,
    specialty,
    customSpecialty,
    basePay,
  };
  useDebouncedLocalStorage(STORAGE_KEY, draftState);

  // Load draft state on mount (if no scenario is being loaded via URL)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Don't load draft if there's a scenario in URL params
    const scenarioId = searchParams.get('scenario');
    if (scenarioId) return; // URL scenario will be loaded by the other effect
    
    // Load draft state if available
    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        // Only load draft if it has meaningful data
        if (draft.annualWrvus > 0 || draft.basePay > 0 || draft.providerName) {
          setFte(draft.fte || 1.0);
          setAnnualWrvus(draft.annualWrvus || 0);
          setMonthlyWrvus(draft.monthlyWrvus || 0);
          setMonthlyBreakdown(draft.monthlyBreakdown || Array(12).fill(0));
          setConversionFactor(draft.conversionFactor || 45.52);
          setProviderName(draft.providerName || '');
          setSpecialty(draft.specialty || '');
          setCustomSpecialty(draft.customSpecialty || '');
          setBasePay(draft.basePay || 0);
        }
      }
    } catch (error) {
      console.error('Error loading draft state:', error);
    }
  }, [searchParams]);

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
  // Productivity incentive can be negative (showing shortfall from base pay)
  const productivityPay = (annualWrvus * conversionFactor) - basePay;
  const normalizedWrvus = normalizeWrvus(annualWrvus, fte);
  const normalizedBasePay = fte > 0 ? basePay / fte : 0;
  const normalizedProductivityPay = (normalizedWrvus * conversionFactor) - normalizedBasePay;
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
    // Load base pay and conversion factor from TCC components if available
    if (scenario.tccComponents && scenario.tccComponents.length > 0) {
      const baseSalaryComponent = scenario.tccComponents.find(
        c => c.type === 'Base Salary'
      );
      if (baseSalaryComponent) {
        setBasePay(baseSalaryComponent.amount);
      }
      
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
    setBasePay(0);
    // Clear draft state
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto py-4 sm:py-6 md:py-8">
      <ProgressiveForm
        totalSteps={4}
        stepNames={['Provider Info', 'Work RVUs', 'Conversion Factor', 'Results']}
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Provider Information</h3>
                <ScenarioLoader
                  scenarioType="wrvu-modeler"
                  onLoad={handleLoadScenario}
                />
              </div>
              <div className="space-y-4">
                {/* Provider Name and FTE - side by side on larger screens, stack on mobile */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="flex-1 w-full sm:w-auto space-y-2 min-w-0">
                    <Label className="text-sm font-semibold">Provider Name</Label>
                    <Input
                      value={providerName}
                      onChange={(e) => setProviderName(e.target.value)}
                      placeholder="Enter name"
                      icon={<User className="w-5 h-5" />}
                    />
                  </div>
                  <div className="w-full sm:w-auto sm:flex-shrink-0" data-tour="wrvu-fte">
                    <FTEInput value={fte} onChange={setFte} />
                  </div>
                </div>
                
                {/* Specialty */}
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
                
                {specialty === 'Other' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Custom Specialty</Label>
                    <Input
                      value={customSpecialty}
                      onChange={(e) => setCustomSpecialty(e.target.value)}
                      placeholder="Enter custom specialty"
                      icon={<Stethoscope className="w-5 h-5" />}
                    />
                  </div>
                )}
                
                {/* Base Pay Compensation */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Base Pay Compensation</Label>
                  <CurrencyInput
                    value={basePay}
                    onChange={setBasePay}
                    placeholder="0.00"
                    className="min-h-[44px] touch-target"
                  />
                </div>
              </div>
            </div>
          </div>
          <ProgressiveFormNavigation nextLabel="Work RVUs" />
        </ProgressiveFormStep>

        {/* Step 2: Work RVUs */}
        <ProgressiveFormStep step={2}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Work RVUs</h3>
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

          </div>
          <ProgressiveFormNavigation 
            nextLabel="Conversion Factor" 
            disabled={annualWrvus === 0}
          />
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
                disabled={annualWrvus === 0}
              />
            </div>
          </div>
          <ProgressiveFormNavigation nextLabel="Results" />
        </ProgressiveFormStep>

        {/* Step 4: Results */}
        <ProgressiveFormStep step={4}>
          <ResultsStepContent
            annualWrvus={annualWrvus}
            productivityPay={productivityPay}
            monthlyBreakdown={monthlyBreakdown}
            conversionFactor={conversionFactor}
            normalizedWrvus={normalizedWrvus}
            normalizedProductivityPay={normalizedProductivityPay}
            fte={fte}
            basePay={basePay}
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
