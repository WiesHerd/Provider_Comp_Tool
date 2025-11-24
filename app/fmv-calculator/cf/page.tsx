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
import { CurrencyInput } from '@/components/ui/currency-input';
import { StepIndicator } from '@/components/ui/step-indicator';
import { StepBadge } from '@/components/ui/step-badge';
import { ScreenInfoModal } from '@/components/ui/screen-info-modal';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';
import { ScenarioLoader } from '@/components/scenarios/scenario-loader';
import { MarketBenchmarks, ProviderScenario } from '@/types';
import { calculateCFPercentile } from '@/lib/utils/percentile';
import { useScenariosStore } from '@/lib/store/scenarios-store';

function CFCalculatorPageContent() {
  const searchParams = useSearchParams();
  const { getScenario } = useScenariosStore();
  const [specialty, setSpecialty] = useState<string>('');
  const [cfValue, setCfValue] = useState<number>(0);
  const [marketBenchmarks, setMarketBenchmarks] = useState<MarketBenchmarks>({});
  const [showResults, setShowResults] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [scenarioLoaded, setScenarioLoaded] = useState(false);

  const percentile = calculateCFPercentile(cfValue, marketBenchmarks);

  const formatValue = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/wRVU`;
  };

  const formatBenchmark = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const hasMarketData = marketBenchmarks.cf25 || marketBenchmarks.cf50 || marketBenchmarks.cf75 || marketBenchmarks.cf90;

  const handleCalculate = () => {
    if (cfValue > 0 && hasMarketData) {
      setShowResults(true);
      setActiveStep(3); // Navigate to results step
    }
  };

  const handleStartNew = () => {
    // Clear all form data
    setSpecialty('');
    setCfValue(0);
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
      if (scenario && scenario.scenarioType === 'fmv-cf') {
        // CF is stored in computedPercentiles or we can calculate from normalizedTcc/normalizedWrvus
        if (scenario.cfValue !== undefined && scenario.cfValue > 0) {
          setCfValue(scenario.cfValue);
        } else if (scenario.normalizedTcc && scenario.normalizedWrvus && scenario.normalizedWrvus > 0) {
          setCfValue(scenario.normalizedTcc / scenario.normalizedWrvus);
        }
        if (scenario.marketBenchmarks) {
          setMarketBenchmarks(scenario.marketBenchmarks);
        }
        if (scenario.specialty) {
          setSpecialty(scenario.specialty);
        }
        setScenarioLoaded(true);
        // If we have both CF and market data, go to step 2
        if (scenario.cfValue !== undefined && scenario.cfValue > 0 && scenario.marketBenchmarks) {
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
    if (hasMarketData && cfValue > 0) return 2;
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
    
    // Allow going to step 2 if they have CF data
    if (step === 2 && cfValue > 0) {
      setActiveStep(2);
      return;
    }
    
    // Allow going to step 3 if results are ready
    if (step === 3) {
      if (showResults) {
        setActiveStep(3);
      } else if (cfValue > 0 && hasMarketData) {
        // If clicking on results step and ready, trigger calculation
        handleCalculate();
        setActiveStep(3);
      }
    }
  };
  
  const totalSteps = 3; // Always show all 3 steps
  const stepNames = ['Provider Input', 'Market Data', 'Results'];
  const completedSteps = showResults ? [1, 2] : hasMarketData && cfValue > 0 ? [1] : [];

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
      <Card id="provider-input" className="border border-gray-200 dark:border-gray-800" data-tour="fmv-cf-content">
        <CardHeader>
          <div className="flex items-center gap-2">
            <StepBadge number={1} variant="default" />
            <CardTitle className="flex items-center gap-2">
              Provider Input
              <ScreenInfoModal
                title="Provider Input - Conversion Factor Calculator"
                description={`## Overview
Enter your conversion factor (CF) to calculate your percentile ranking against market benchmarks. The conversion factor determines how much you earn per wRVU generated.

## What is Conversion Factor?

### Definition
• **Conversion Factor ($/wRVU)**: The dollar amount paid per wRVU for productivity incentives
• Represents how much you earn per wRVU generated
• A key component of productivity-based compensation models

### Typical Values
• Common CF values range from $40-$60 per wRVU
• Values vary significantly by:
  - Medical specialty
  - Geographic market
  - Practice type (academic vs. private)
  - Market competitiveness

### How It's Used
• Multiplied by your annual wRVUs to calculate productivity pay
• Higher CF = more compensation per wRVU
• Often combined with base salary guarantees

## Next Steps
After entering your CF, proceed to Market Data to add benchmark percentiles for comparison.`}
              />
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ScenarioLoader
            scenarioType="fmv-cf"
            onLoad={(scenario) => {
              // CF is stored in computedPercentiles or we can calculate from normalizedTcc/normalizedWrvus
              if (scenario.cfValue !== undefined && scenario.cfValue > 0) {
                setCfValue(scenario.cfValue);
              } else if (scenario.normalizedTcc && scenario.normalizedWrvus && scenario.normalizedWrvus > 0) {
                setCfValue(scenario.normalizedTcc / scenario.normalizedWrvus);
              }
              if (scenario.marketBenchmarks) {
                setMarketBenchmarks(scenario.marketBenchmarks);
              }
              if (scenario.specialty) {
                setSpecialty(scenario.specialty);
              }
            }}
          />
          
          <div className="space-y-2">
            <Label className="text-base font-semibold">Conversion Factor ($/wRVU)</Label>
            <CurrencyInput
              value={cfValue}
              onChange={setCfValue}
              placeholder="Enter CF amount"
              min={0}
              showDecimals={true}
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This is the dollar amount paid per wRVU for productivity incentives.
            </p>
          </div>
          
          {cfValue > 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-end">
                <ProviderInputSaveButton
                  scenarioType="fmv-cf"
                  fte={1.0}
                  cfValue={cfValue}
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
                title="Market Data - Conversion Factor Calculator"
                description={`## Overview
Add market benchmark data to compare your conversion factor against industry standards. Market benchmarks represent CF values at different percentiles for your specialty.

## Required Information

### Benchmark Percentiles
• **At least one percentile is required** to calculate your ranking
• Available percentiles: 25th, 50th, 75th, and 90th
• More percentiles provide more accurate percentile calculation

### Specialty Selection
• Select your medical specialty to load saved market data
• Market data can be saved by specialty for quick loading
• CF benchmarks vary significantly by specialty and market

## How It Works

### Percentile Calculation
• Your percentile indicates where your CF ranks compared to market data
• **Higher percentiles** indicate more competitive compensation per wRVU
• Percentiles are calculated using linear interpolation between benchmark values

### Understanding Percentiles
• **25th Percentile**: Lower end of market range
• **50th Percentile**: Median market value
• **75th Percentile**: Above average, competitive
• **90th Percentile**: Top tier, highly competitive

## Saving Market Data
• You can save market data by specialty for quick loading in future calculations
• Saved data persists across sessions
• Update benchmarks as market data changes`}
              />
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Required:</strong> Add market benchmarks to compare your CF against market data for percentile analysis. At least one benchmark (25th, 50th, 75th, or 90th percentile) is required to calculate percentiles.
          </p>
          <SpecialtyInput
            metricType="cf"
            specialty={specialty}
            onSpecialtyChange={setSpecialty}
            onMarketDataLoad={setMarketBenchmarks}
          />
          <BenchmarkInputs
            benchmarks={marketBenchmarks}
            onBenchmarksChange={setMarketBenchmarks}
            type="cf"
          />
          
          <MarketDataSaveButton
            specialty={specialty}
            metricType="cf"
            benchmarks={marketBenchmarks}
          />
        </CardContent>
      </Card>
      )}

      {/* Navigation Buttons - Show when on Step 1 or 2 */}
      {currentStep === 1 && cfValue > 0 && !showResults && (
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
      {currentStep === 2 && cfValue > 0 && (
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
      {currentStep === 3 && showResults && cfValue > 0 && (
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
                  value={cfValue}
                  percentile={percentile}
                  benchmarks={{
                    p25: marketBenchmarks.cf25,
                    p50: marketBenchmarks.cf50,
                    p75: marketBenchmarks.cf75,
                    p90: marketBenchmarks.cf90,
                  }}
                  formatValue={formatValue}
                  formatBenchmark={formatBenchmark}
                  valueLabel="Your CF"
                />
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <FMVSaveButton
                  metricType="cf"
                  value={cfValue}
                  benchmarks={marketBenchmarks}
                  percentile={percentile}
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

export default function CFCalculatorPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">Loading...</div>}>
      <CFCalculatorPageContent />
    </Suspense>
  );
}
