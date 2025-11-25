'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BenchmarkInputs } from '@/components/fmv/benchmark-inputs';
import { PercentileBreakdown } from '@/components/fmv/percentile-breakdown';
import { FMVSaveButton } from '@/components/fmv/fmv-save-button';
import { SpecialtyInput } from '@/components/fmv/specialty-input';
import { MarketDataSaveButton } from '@/components/fmv/market-data-save-button';
import { ProviderInputSaveButton } from '@/components/fmv/provider-input-save-button';
import { FTEInput } from '@/components/wrvu/fte-input';
import { WRVUInput } from '@/components/wrvu/wrvu-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Calculator, RotateCcw } from 'lucide-react';
import { ScenarioLoader } from '@/components/scenarios/scenario-loader';
import { MarketBenchmarks, ProviderScenario, FTE } from '@/types';
import { calculateWRVUPercentile } from '@/lib/utils/percentile';
import { normalizeWrvus } from '@/lib/utils/normalization';
import { useScenariosStore } from '@/lib/store/scenarios-store';

function WRVUCalculatorPageContent() {
  const searchParams = useSearchParams();
  const { getScenario } = useScenariosStore();
  const [specialty, setSpecialty] = useState<string>('');
  const [annualWrvus, setAnnualWrvus] = useState<number>(0);
  const [monthlyWrvus, setMonthlyWrvus] = useState<number>(0);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<number[]>(Array(12).fill(0));
  const [fte, setFte] = useState<FTE>(1.0);
  const [marketBenchmarks, setMarketBenchmarks] = useState<MarketBenchmarks>({});
  const [showResults, setShowResults] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [scenarioLoaded, setScenarioLoaded] = useState(false);

  const STORAGE_KEY = 'fmvWrvuDraftState';

  // Auto-save draft state to localStorage whenever inputs change
  useEffect(() => {
    if (typeof window !== 'undefined' && !scenarioLoaded) {
      const draftState = {
        specialty,
        annualWrvus,
        monthlyWrvus,
        monthlyBreakdown,
        fte,
        marketBenchmarks,
        activeStep,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draftState));
    }
  }, [specialty, annualWrvus, monthlyWrvus, monthlyBreakdown, fte, marketBenchmarks, activeStep, scenarioLoaded]);

  // Load draft state on mount (if no scenario is being loaded via URL)
  useEffect(() => {
    if (typeof window === 'undefined' || scenarioLoaded) return;
    
    const scenarioId = searchParams.get('scenario');
    if (scenarioId) return; // URL scenario will be loaded by the other effect
    
    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        // Only load draft if it has meaningful data
        if (draft.annualWrvus > 0) {
          setSpecialty(draft.specialty || '');
          setAnnualWrvus(draft.annualWrvus || 0);
          setMonthlyWrvus(draft.monthlyWrvus || 0);
          setMonthlyBreakdown(draft.monthlyBreakdown || Array(12).fill(0));
          setFte(draft.fte || 1.0);
          setMarketBenchmarks(draft.marketBenchmarks || {});
          setActiveStep(draft.activeStep || 1);
        }
      }
    } catch (error) {
      console.error('Error loading draft state:', error);
    }
  }, [searchParams, scenarioLoaded]);

  // Normalize wRVUs to 1.0 FTE for comparison with market benchmarks
  // Market benchmarks are always normalized to 1.0 FTE
  const normalizedWrvus = normalizeWrvus(annualWrvus, fte);
  const percentile = calculateWRVUPercentile(normalizedWrvus, marketBenchmarks);

  const formatValue = (value: number) => {
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  const hasMarketData = marketBenchmarks.wrvu25 || marketBenchmarks.wrvu50 || marketBenchmarks.wrvu75 || marketBenchmarks.wrvu90;

  const handleCalculate = () => {
    if (normalizedWrvus > 0 && hasMarketData) {
      setShowResults(true);
      setActiveStep(3); // Navigate to results step
    }
  };

  const handleStartNew = () => {
    // Clear all form data
    setSpecialty('');
    setAnnualWrvus(0);
    setMonthlyWrvus(0);
    setMonthlyBreakdown(Array(12).fill(0));
    setFte(1.0);
    setMarketBenchmarks({});
    setShowResults(false);
    setActiveStep(1); // Go back to Step 1
    setScenarioLoaded(false); // Reset scenario loaded flag
    // Clear draft state
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Auto-load scenario from query parameter
  useEffect(() => {
    const scenarioId = searchParams.get('scenario');
    if (scenarioId && !scenarioLoaded) {
      const scenario = getScenario(scenarioId);
      if (scenario && scenario.scenarioType === 'fmv-wrvu') {
        if (scenario.fte) {
          setFte(scenario.fte);
        }
        // Load annual wRVUs - prefer annualWrvus if available, otherwise calculate from normalized
        if (scenario.annualWrvus && scenario.annualWrvus > 0) {
          setAnnualWrvus(scenario.annualWrvus);
        } else if (scenario.normalizedWrvus) {
          const loadedFte = scenario.fte || 1.0;
          setAnnualWrvus(scenario.normalizedWrvus * loadedFte);
        }
        // Load monthly breakdown if available
        if (scenario.monthlyBreakdown && scenario.monthlyBreakdown.length === 12) {
          setMonthlyBreakdown([...scenario.monthlyBreakdown]);
        }
        // Load monthly average if available
        if (scenario.monthlyWrvus !== undefined) {
          setMonthlyWrvus(scenario.monthlyWrvus);
        }
        if (scenario.marketBenchmarks) {
          setMarketBenchmarks(scenario.marketBenchmarks);
        }
        if (scenario.specialty) {
          setSpecialty(scenario.specialty);
        }
        setScenarioLoaded(true);
        // If we have both wRVU and market data, go to step 2
        if (scenario.annualWrvus > 0 && scenario.marketBenchmarks) {
          setActiveStep(2);
        }
      }
    }
  }, [searchParams, getScenario, scenarioLoaded]);

  // Reset showResults when market data changes (so user can recalculate)
  useEffect(() => {
    if (showResults && activeStep === 2) {
      setShowResults(false);
    }
  }, [marketBenchmarks, activeStep, showResults]);

  const currentStep = activeStep;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8 md:pb-12 space-y-6 sm:space-y-8">
      {/* Back button to metric selector - visible on all steps */}
      <div className="pt-8 flex items-center gap-4">
        <BackButton href="/fmv-calculator" aria-label="Back to FMV Calculator" />
      </div>

      {/* Step 1: Provider Input (Only show when on Step 1) */}
      {currentStep === 1 && (
      <div id="provider-input" className="space-y-6" data-tour="fmv-wrvu-content">
        {/* Content - No container */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">wRVUs</h2>
          <div className="flex items-end justify-between gap-2 sm:gap-4">
            <div className="flex items-end gap-2 sm:gap-4">
              {annualWrvus > 0 && fte > 0 && (
                <div className="flex items-end">
                  <ProviderInputSaveButton
                    scenarioType="fmv-wrvu"
                    fte={fte}
                    annualWrvus={annualWrvus}
                    monthlyWrvus={monthlyWrvus}
                    monthlyBreakdown={monthlyBreakdown}
                    specialty={specialty}
                  />
                </div>
              )}
              <FTEInput value={fte} onChange={setFte} />
            </div>
            <ScenarioLoader
              scenarioType="fmv-wrvu"
              onLoad={(scenario) => {
                if (scenario.fte) {
                  setFte(scenario.fte);
                }
                // Load annual wRVUs - prefer annualWrvus if available, otherwise calculate from normalized
                if (scenario.annualWrvus && scenario.annualWrvus > 0) {
                  setAnnualWrvus(scenario.annualWrvus);
                } else if (scenario.normalizedWrvus) {
                  const loadedFte = scenario.fte || 1.0;
                  setAnnualWrvus(scenario.normalizedWrvus * loadedFte);
                }
                // Load monthly breakdown if available
                if (scenario.monthlyBreakdown && scenario.monthlyBreakdown.length === 12) {
                  setMonthlyBreakdown([...scenario.monthlyBreakdown]);
                }
                // Load monthly average if available
                if (scenario.monthlyWrvus !== undefined) {
                  setMonthlyWrvus(scenario.monthlyWrvus);
                }
                if (scenario.marketBenchmarks) {
                  setMarketBenchmarks(scenario.marketBenchmarks);
                }
                if (scenario.specialty) {
                  setSpecialty(scenario.specialty);
                }
                setScenarioLoaded(true);
              }}
            />
          </div>
          
          <div className="space-y-4">
            <WRVUInput
              annualWrvus={annualWrvus}
              monthlyWrvus={monthlyWrvus}
              monthlyBreakdown={monthlyBreakdown}
              onAnnualChange={setAnnualWrvus}
              onMonthlyChange={setMonthlyWrvus}
              onMonthlyBreakdownChange={setMonthlyBreakdown}
            />
          </div>
          
          {annualWrvus > 0 && fte > 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Normalized wRVUs (1.0 FTE)</span>
                  <span className="font-semibold text-lg text-primary">
                    {formatValue(normalizedWrvus)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Step 2: Market Data (Only show when on Step 2) */}
      {currentStep === 2 && (
      <div id="market-data" className="space-y-6">
        {/* Content - No container */}
        <div className="space-y-6 pt-8">
          <SpecialtyInput
            metricType="wrvu"
            specialty={specialty}
            onSpecialtyChange={setSpecialty}
            onMarketDataLoad={setMarketBenchmarks}
          />
          <BenchmarkInputs
            benchmarks={marketBenchmarks}
            onBenchmarksChange={setMarketBenchmarks}
            type="wrvu"
          />
          
          <MarketDataSaveButton
            specialty={specialty}
            metricType="wrvu"
            benchmarks={marketBenchmarks}
          />
        </div>
      </div>
      )}

      {/* Navigation Buttons - Show when on Step 1 or 2 */}
      {currentStep === 1 && normalizedWrvus > 0 && !showResults && (
        <div className="sticky bottom-20 md:bottom-0 bg-white dark:bg-gray-900 pt-4 pb-4 sm:pb-6 border-t border-gray-200 dark:border-gray-800 safe-area-inset-bottom z-10">
          <Button
            onClick={() => setActiveStep(2)}
            className="w-full min-h-[48px] text-base font-semibold"
            size="lg"
          >
            Continue to Market Data →
          </Button>
        </div>
      )}
      
      {/* Back button in Step 2 to return to Step 1 */}
      {currentStep === 2 && (
        <div className="flex items-center gap-2 mb-4">
          <BackButton onClick={() => setActiveStep(1)} aria-label="Back to Provider Input" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Back to Provider Input</span>
        </div>
      )}

      {/* Calculate Button - Always visible on Step 2 */}
      {currentStep === 2 && normalizedWrvus > 0 && (
        <div className="sticky bottom-20 md:bottom-0 bg-white dark:bg-gray-900 pt-4 pb-4 sm:pb-6 border-t border-gray-200 dark:border-gray-800 safe-area-inset-bottom z-10">
          <Button
            onClick={handleCalculate}
            className="w-full min-h-[48px] text-base font-semibold"
            size="lg"
            disabled={!hasMarketData}
          >
            <Calculator className="w-5 h-5 mr-2" />
            Calculate Percentile
          </Button>
        </div>
      )}

      {/* Step 3: Results (Only shown after calculation) */}
      {currentStep === 3 && showResults && normalizedWrvus > 0 && (
        <div id="results-section" className="space-y-6 pt-8">
          {/* Back button in Step 3 to return to Step 2 */}
          <div className="flex items-center gap-2 mb-4">
            <BackButton onClick={() => setActiveStep(2)} aria-label="Back to Market Data" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Back to Market Data</span>
          </div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">wRVUs</h2>
          </div>
          <PercentileBreakdown
            value={normalizedWrvus}
            percentile={percentile}
            benchmarks={{
              p25: marketBenchmarks.wrvu25,
              p50: marketBenchmarks.wrvu50,
              p75: marketBenchmarks.wrvu75,
              p90: marketBenchmarks.wrvu90,
            }}
            formatValue={formatValue}
            valueLabel="Your Normalized wRVUs (1.0 FTE)"
          />

          {/* Save and Start Over Buttons */}
          <div className="pt-4 border-t-2 border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <FMVSaveButton
                  metricType="wrvu"
                  value={normalizedWrvus}
                  benchmarks={marketBenchmarks}
                  percentile={percentile}
                  fte={fte}
                />
              </div>
              <Button
                variant="outline"
                onClick={handleStartNew}
                className="w-full sm:w-auto min-h-[44px] touch-target"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Start Over
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default function WRVUCalculatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6"><div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8 md:pb-12">Loading...</div></div>}>
      <WRVUCalculatorPageContent />
    </Suspense>
  );
}
