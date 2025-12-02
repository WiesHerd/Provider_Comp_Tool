'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FTEInput } from '@/components/wrvu/fte-input';
import { WRVUInput } from '@/components/wrvu/wrvu-input';
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
import { FTE, ProviderScenario } from '@/types';
import { normalizeWrvus } from '@/lib/utils/normalization';
import { ScenarioLoader } from '@/components/scenarios/scenario-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCcw, User, Stethoscope, Info, Calendar, ChevronLeft, Calculator, DollarSign, ArrowUpRight, TrendingUp } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';
import { useScenariosStore } from '@/lib/store/scenarios-store';
import { MonthlyBreakdownChart } from '@/components/wrvu/monthly-breakdown-chart';
import { AutoHideSticky } from '@/components/ui/auto-hide-sticky';
import { useDebouncedLocalStorage } from '@/hooks/use-debounced-local-storage';
import { cn } from '@/lib/utils/cn';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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
  monthlyWrvus: number;
}

// StatItem component matching wrvu-forecaster pattern
interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  difference?: string;
  tooltipText: string;
  onClick?: () => void;
  isClickable?: boolean;
}

function StatItem({ icon, label, value, difference, tooltipText, onClick, isClickable }: StatItemProps) {
  // Check if value is negative (for incentive payments)
  const isNegative = value.startsWith('-') || value.includes('-$');
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-3 sm:p-4 border border-gray-200 dark:border-gray-800 rounded-lg transition-all bg-white dark:bg-gray-900",
        isClickable 
          ? "hover:shadow-md hover:border-primary/50 cursor-pointer active:scale-[0.98]" 
          : "hover:shadow-sm"
      )}
    >
      {/* Icon and label - Compact layout for mobile */}
      <div className="flex items-start gap-2 mb-3 sm:mb-4">
        <div className="text-primary flex-shrink-0 mt-0.5">{icon}</div>
        <Tooltip content={tooltipText} side="top" className="max-w-[250px] sm:max-w-[300px]">
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-tight block flex-1">
            {label}
          </span>
        </Tooltip>
        {isClickable && (
          <ArrowUpRight className="w-4 h-4 text-primary/60 flex-shrink-0 mt-0.5" />
        )}
      </div>
      
      {/* Value and difference - Apple-style: value large, pill on right */}
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn(
          "text-2xl sm:text-3xl lg:text-4xl font-bold break-words flex-1",
          isNegative 
            ? "text-red-600 dark:text-red-400" 
            : "text-gray-900 dark:text-gray-100"
        )}>
          {value}
        </span>
        {difference && (
          <Tooltip content="Potential increase using adjusted wRVU per encounter" side="top">
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold flex-shrink-0 touch-target cursor-help">
              {difference}
              <Info className="w-3 h-3 text-green-700 dark:text-green-400" />
            </div>
          </Tooltip>
        )}
      </div>
      {isClickable && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-primary/70 dark:text-primary/60">
            Tap to calculate percentile
          </p>
        </div>
      )}
    </div>
  );
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
  onBack,
  monthlyWrvus,
}: ResultsStepContentProps & { onBack: () => void; monthlyWrvus: number }) {
  const router = useRouter();
  
  const handleStartOver = () => {
    onStartOver();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate 1.0 FTE projections
  const normalizedBasePay = fte > 0 ? basePay / fte : 0;
  const totalCompensation = basePay + productivityPay;
  
  // Format currency helper
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  
  // Handle percentile calculation
  const handleCalculatePercentile = () => {
    const specialtyValue = specialty === 'Other' ? customSpecialty : specialty;
    const fteValue = fte;
    const totalTcc = totalCompensation;
    
    // Build query parameters
    const params = new URLSearchParams();
    params.set('totalTcc', totalTcc.toString());
    params.set('fte', fteValue.toString());
    if (specialtyValue) {
      params.set('specialty', specialtyValue);
    }
    
    router.push(`/fmv-calculator/tcc?${params.toString()}`);
  };
  
  // Format number helper
  const formatNumber = (value: number) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
  
  // Compensation metrics for StatItem cards
  const compensationMetrics: StatItemProps[] = [
    {
      icon: <DollarSign className="w-6 h-6" />,
      label: 'Estimated Total Compensation',
      value: formatCurrency(totalCompensation),
      tooltipText: `Total compensation: Base salary (${formatCurrency(basePay)}) + Productivity incentive (${formatCurrency(productivityPay)}) = ${formatCurrency(totalCompensation)}. Tap to calculate percentile ranking.`,
      onClick: handleCalculatePercentile,
      isClickable: true,
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      label: 'Estimated Incentive Payment',
      value: formatCurrency(productivityPay),
      tooltipText: `Incentive Payment = (${formatCurrency(conversionFactor)} × ${formatNumber(annualWrvus)} wRVUs) - ${formatCurrency(basePay)} = ${formatCurrency(productivityPay)}. ${productivityPay >= 0 ? 'Positive incentive payment above base salary (shown in green).' : 'Negative amount indicates wRVU compensation is below base salary (shown in red).'}`,
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      label: 'Annual wRVUs',
      value: formatNumber(annualWrvus),
      tooltipText: `Total work RVUs for the year: ${formatNumber(annualWrvus)} wRVUs. This is the productivity metric used to calculate incentive payments.`,
    },
  ];

  // Determine messaging based on productivity pay
  const isPositive = productivityPay >= 0;
  const heroTitle = isPositive 
    ? "Annual Productivity Incentive Calculation"
    : "Productivity Shortfall from Base Pay";
  const heroSubtitle = isPositive
    ? `Total Compensation: ${totalCompensation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `Not covering base pay guarantee. Shortfall: ${Math.abs(productivityPay).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Determine if monthly breakdown is from direct input or calculated/extrapolated
  // If all months are uniform and match the monthly average, it's likely calculated
  // If there's variation, it's from direct monthly input
  const firstValue = monthlyBreakdown[0];
  const isUniform = monthlyBreakdown.every(val => Math.abs(val - firstValue) < 0.01);
  const matchesMonthlyAverage = Math.abs(firstValue - monthlyWrvus) < 0.01;
  const isCalculated = isUniform && matchesMonthlyAverage && monthlyWrvus > 0;
  const dataSourceLabel = isCalculated 
    ? "Projected from monthly average"
    : "From monthly input data";

  return (
    <div className="space-y-6" data-tour="wrvu-results">
      {/* Hero Section - Large Total Compensation Display */}
      <Card className={cn(
        "border-2 text-center",
        isPositive 
          ? "border-primary/20 bg-primary/5 dark:bg-primary/10" 
          : "border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10"
      )}>
        <CardContent className="py-8 sm:py-12">
          <p className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-400 mb-2">
            {heroTitle}
          </p>
          <div className={cn(
            "text-3xl sm:text-4xl lg:text-5xl font-bold mb-1",
            isPositive ? "text-primary" : "text-red-600 dark:text-red-400"
          )}>
            {isPositive ? '+' : ''}${Math.abs(productivityPay).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
            {heroSubtitle}
          </p>
        </CardContent>
      </Card>

      {/* Compensation Section - Matching wrvu-forecaster style */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Compensation</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {compensationMetrics.map((item, index) => (
            <StatItem key={`comp-${index}`} {...item} />
          ))}
        </div>
      </div>

      {/* Monthly Breakdown Chart - Only show if there's variation */}
      {(() => {
        const hasData = monthlyBreakdown.some(val => val > 0);
        if (!hasData) return null;
        
        // Check if there's variation (not all months the same)
        const firstValue = monthlyBreakdown[0];
        const hasVariation = monthlyBreakdown.some(val => Math.abs(val - firstValue) > 0.01);
        
        // Only show the card if there's actual variation to display
        if (!hasVariation) return null;
        
        return (
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg font-bold text-primary">
                    Monthly Breakdown
                  </CardTitle>
                </div>
                <Tooltip
                  content={dataSourceLabel}
                  side="left"
                >
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-help transition-colors"
                    aria-label={dataSourceLabel}
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{dataSourceLabel}</span>
                  </button>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <MonthlyBreakdownChart
                monthlyBreakdown={monthlyBreakdown}
                conversionFactor={conversionFactor}
              />
            </CardContent>
          </Card>
        );
      })()}

      {/* 1.0 FTE Projections - Only show if FTE < 1.0 */}
      {fte < 1.0 && (
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-primary/5 dark:bg-primary/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Projected at 1.0 FTE (Full-Time)
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Comparison of current ({fte} FTE) vs projected (1.0 FTE) values
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Work RVUs Comparison */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Current ({fte} FTE)</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {annualWrvus.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">Work RVUs</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Projected (1.0 FTE)</p>
                <p className="text-xl font-bold text-primary">
                  {normalizedWrvus.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">Work RVUs</p>
              </div>
            </div>
            {/* Base Pay Comparison */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Current ({fte} FTE)</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  ${basePay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">Base Pay</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Projected (1.0 FTE)</p>
                <p className="text-xl font-bold text-primary">
                  ${normalizedBasePay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">Base Pay</p>
              </div>
            </div>
            {/* Productivity Incentive Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Current ({fte} FTE)</p>
                <p className={cn(
                  "text-xl font-bold",
                  productivityPay >= 0 ? "text-primary" : "text-red-600 dark:text-red-400"
                )}>
                  {productivityPay >= 0 ? '+' : ''}${Math.abs(productivityPay).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">Productivity Incentive</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Projected (1.0 FTE)</p>
                <p className={cn(
                  "text-xl font-bold",
                  normalizedProductivityPay >= 0 ? "text-primary" : "text-red-600 dark:text-red-400"
                )}>
                  {normalizedProductivityPay >= 0 ? '+' : ''}${Math.abs(normalizedProductivityPay).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">Productivity Incentive</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation and Action Buttons - Auto-hide on mobile, static on desktop */}
      <AutoHideSticky className="bg-gray-50 dark:bg-gray-900 pt-4 pb-4 border-t-2 border-gray-200 dark:border-gray-800 safe-area-inset-bottom z-10">
        {/* Back Button */}
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="w-full sm:w-auto min-h-[44px] touch-target"
          >
            <ChevronLeft className="w-4 h-4 mr-2 flex-shrink-0" />
            Back
          </Button>
        </div>
        {/* Save and Start Over Buttons */}
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
            <RotateCcw className="w-4 h-4 mr-2 flex-shrink-0" />
            Start Over
          </Button>
        </div>
      </AutoHideSticky>
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
  const [activeTab, setActiveTab] = useState<'setup' | 'input' | 'results'>('input');

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
    setActiveTab('input');
    // Clear draft state
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleCalculate = () => {
    if (annualWrvus > 0 && conversionFactor > 0) {
      setActiveTab('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setActiveTab('input');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6">
      <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto pt-6 sm:pt-8 md:pt-10 pb-4 sm:pb-6 md:pb-8">
      {/* Page Title */}
      <div className="mb-6 flex items-center gap-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Productivity Incentive Calculator
        </h1>
        <Tooltip 
          content="Calculate bonus pay based on how many patients you see. Perfect for reviewing productivity-based contracts."
          side="right"
        >
          <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
        </Tooltip>
      </div>

      {/* Tabs for organizing content */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'setup' | 'input' | 'results')} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="setup" className="text-sm font-medium">
            Provider
          </TabsTrigger>
          <TabsTrigger value="input" className="text-sm font-medium">
            wRVUs
          </TabsTrigger>
          <TabsTrigger value="results" className="text-sm font-medium" disabled={annualWrvus === 0 || conversionFactor === 0}>
            Results
          </TabsTrigger>
        </TabsList>

        {/* Setup Tab - Provider Information */}
        <TabsContent value="setup" className="space-y-6 mt-0">
          <Card className="border-2">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Provider Information</CardTitle>
                <ScenarioLoader
                  scenarioType="wrvu-modeler"
                  onLoad={handleLoadScenario}
                />
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Input Tab - Work RVUs & Conversion Factor */}
        <TabsContent value="input" className="space-y-6 mt-0">
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Work RVUs & Conversion Factor</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-6">
                {/* Work RVUs Section */}
                <div data-tour="wrvu-input">
                  <WRVUInput
                    annualWrvus={annualWrvus}
                    monthlyWrvus={monthlyWrvus}
                    monthlyBreakdown={monthlyBreakdown}
                    onAnnualChange={setAnnualWrvus}
                    onMonthlyChange={setMonthlyWrvus}
                    onMonthlyBreakdownChange={setMonthlyBreakdown}
                  />
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  {/* Conversion Factor Section */}
                  <div className="space-y-2" data-tour="wrvu-conversion">
                    <Label className="text-sm font-semibold">Conversion Factor ($/wRVU)</Label>
                    <CurrencyInput
                      value={conversionFactor}
                      onChange={setConversionFactor}
                      placeholder="45.52"
                      disabled={annualWrvus === 0}
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This is the dollar amount paid per wRVU for productivity incentives.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="mt-0">
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
            onBack={handleBack}
            monthlyWrvus={monthlyWrvus}
          />
        </TabsContent>
      </Tabs>

      {/* Calculate Button - Sticky bottom bar for Input tab */}
      {activeTab === 'input' && annualWrvus > 0 && conversionFactor > 0 && (
        <AutoHideSticky className="bg-white dark:bg-gray-900 pt-4 pb-4 sm:pb-6 border-t border-gray-200 dark:border-gray-800 safe-area-inset-bottom z-10">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setActiveTab('setup');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto min-h-[48px] text-base font-semibold"
              size="lg"
            >
              <ChevronLeft className="w-4 h-4 mr-2 flex-shrink-0" />
              Back
            </Button>
            <Button
              onClick={handleCalculate}
              className="w-full sm:flex-1 min-h-[48px] text-base font-semibold flex items-center"
              size="lg"
            >
              <Calculator className="w-5 h-5 mr-2 flex-shrink-0" />
              Calculate
            </Button>
          </div>
        </AutoHideSticky>
      )}
      </div>
    </div>
  );
}

export default function WRVUModelerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6">
        <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto pt-6 sm:pt-8 md:pt-10 pb-4 sm:pb-6 md:pb-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <WRVUModelerPageContent />
    </Suspense>
  );
}
