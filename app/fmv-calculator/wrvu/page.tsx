'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BenchmarkInputs } from '@/components/fmv/benchmark-inputs';
import { PercentileBreakdown } from '@/components/fmv/percentile-breakdown';
import { FMVSaveButton } from '@/components/fmv/fmv-save-button';
import { SpecialtyInput } from '@/components/fmv/specialty-input';
import { MarketDataSaveButton } from '@/components/fmv/market-data-save-button';
import { ProviderInputSaveButton } from '@/components/fmv/provider-input-save-button';
import { FTEInput } from '@/components/wrvu/fte-input';
import { WRVUInput } from '@/components/wrvu/wrvu-input';
import { StepIndicator } from '@/components/ui/step-indicator';
import { StepBadge } from '@/components/ui/step-badge';
import { ScreenInfoModal } from '@/components/ui/screen-info-modal';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';
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

  // Determine what steps are available based on state
  const getAvailableStep = () => {
    if (showResults) return 3;
    if (hasMarketData && normalizedWrvus > 0) return 2;
    return 1;
  };

  const availableStep = getAvailableStep();
  const currentStep = activeStep;

  const handleStepClick = (step: number) => {
    // Always allow going back to step 1
    if (step === 1) {
      setActiveStep(1);
      return;
    }
    
    // Allow going to step 2 if they have wRVU data
    if (step === 2 && normalizedWrvus > 0) {
      setActiveStep(2);
      return;
    }
    
    // Allow going to step 3 if results are ready
    if (step === 3) {
      if (showResults) {
        setActiveStep(3);
      } else if (normalizedWrvus > 0 && hasMarketData) {
        // If clicking on results step and ready, trigger calculation
        handleCalculate();
        setActiveStep(3);
      }
    }
  };
  
  const totalSteps = 3; // Always show all 3 steps
  const stepNames = ['Provider Input', 'Market Data', 'Results'];
  const completedSteps = showResults ? [1, 2] : hasMarketData && normalizedWrvus > 0 ? [1] : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8 space-y-6 sm:space-y-8">
      {/* Step Indicator */}
      <StepIndicator
        currentStep={currentStep}
        totalSteps={totalSteps}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
        stepNames={stepNames}
        className="mb-6 sm:mb-8"
      />

      {/* Step 1: Provider Input (Only show when on Step 1) */}
      {currentStep === 1 && (
      <Card id="provider-input" className="border border-gray-200 dark:border-gray-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <StepBadge number={1} variant="default" />
            <CardTitle className="flex items-center gap-2">
              Provider Input
              <ScreenInfoModal
                title="Provider Input - wRVU Calculator"
                description="Enter your provider information and wRVU data to calculate your percentile ranking against market benchmarks.\n\n• FTE (Full-Time Equivalent): Your employment status (0.1 to 1.0)\n• Projected wRVUs: Enter your annual wRVUs, monthly average, or monthly breakdown\n\nKey Features:\n• Market benchmarks are normalized to 1.0 FTE for fair comparison\n• Your wRVUs are automatically normalized based on your FTE\n• You can input wRVUs as annual total, monthly average, or by individual months\n\nAfter entering your data, proceed to Market Data to add benchmark percentiles for comparison."
              />
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
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
            }}
          />
          
          <FTEInput value={fte} onChange={setFte} />
          
          <div className="space-y-2">
            <Label className="text-base font-semibold">wRVUs</Label>
            <WRVUInput
              annualWrvus={annualWrvus}
              monthlyWrvus={monthlyWrvus}
              monthlyBreakdown={monthlyBreakdown}
              onAnnualChange={setAnnualWrvus}
              onMonthlyChange={setMonthlyWrvus}
              onMonthlyBreakdownChange={setMonthlyBreakdown}
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Market benchmarks are normalized to 1.0 FTE
            </p>
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
              <div className="flex justify-end">
                <ProviderInputSaveButton
                  scenarioType="fmv-wrvu"
                  fte={fte}
                  annualWrvus={annualWrvus}
                  monthlyWrvus={monthlyWrvus}
                  monthlyBreakdown={monthlyBreakdown}
                  specialty={specialty}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Step 2: Market Data (Only show when on Step 2) */}
      {currentStep === 2 && (
      <Card id="market-data" className="border border-gray-200 dark:border-gray-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <StepBadge number={2} variant="default" />
            <CardTitle className="flex items-center gap-2">
              Market Data
              <ScreenInfoModal
                title="Market Data - wRVU Calculator"
                description="Add market benchmark data to compare your wRVUs against industry standards and calculate your percentile ranking.\n\n• Required: At least one benchmark percentile (25th, 50th, 75th, or 90th) is needed to calculate percentiles\n• Benchmarks are normalized to 1.0 FTE for fair comparison\n• Your normalized wRVUs will be compared against these benchmarks\n\nPercentile Calculation:\n• Your percentile indicates where you rank compared to market data\n• For example, if you're at the 75th percentile, you generate more wRVUs than 75% of providers in your specialty\n\nYou can save market data by specialty for quick loading in future calculations."
              />
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Required:</strong> Add market benchmarks to compare your wRVUs against market data for percentile analysis. At least one benchmark (25th, 50th, 75th, or 90th percentile) is required to calculate percentiles.
          </p>
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
        </CardContent>
      </Card>
      )}

      {/* Navigation Buttons - Show when on Step 1 or 2 */}
      {currentStep === 1 && normalizedWrvus > 0 && !showResults && (
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 pt-4 pb-4 sm:pb-6 border-t border-gray-200 dark:border-gray-800 safe-area-inset-bottom">
          <Button
            onClick={() => setActiveStep(2)}
            className="w-full min-h-[48px] text-base font-semibold"
            size="lg"
          >
            Continue to Market Data →
          </Button>
        </div>
      )}

      {/* Calculate Button - Always visible on Step 2 */}
      {currentStep === 2 && normalizedWrvus > 0 && (
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 pt-4 pb-4 sm:pb-6 border-t border-gray-200 dark:border-gray-800 safe-area-inset-bottom">
          <Button
            onClick={handleCalculate}
            className="w-full min-h-[48px] text-base font-semibold"
            size="lg"
            disabled={!hasMarketData}
          >
            <Calculator className="w-5 h-5 mr-2" />
            Calculate Percentile
          </Button>
          {!hasMarketData && (
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-2">
              Please add market benchmark data to calculate percentile
            </p>
          )}
        </div>
      )}

      {/* Step 3: Results (Only shown after calculation) */}
      {currentStep === 3 && showResults && normalizedWrvus > 0 && (
        <div id="results-section" className="space-y-6">
          <Card className="border-2 border-primary/20 dark:border-primary/30 bg-white dark:bg-gray-900 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <StepBadge number={3} variant="completed" />
                <CardTitle>Results</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="pt-4 sm:pt-6">
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
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <FMVSaveButton
                  metricType="wrvu"
                  value={normalizedWrvus}
                  benchmarks={marketBenchmarks}
                  percentile={percentile}
                  fte={fte}
                />
              </div>

              {/* Start New Calculation */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={handleStartNew}
                  className="w-full"
                >
                  Start New Calculation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function WRVUCalculatorPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">Loading...</div>}>
      <WRVUCalculatorPageContent />
    </Suspense>
  );
}
