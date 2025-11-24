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

  const currentStep = activeStep;

  return (
    <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto py-4 sm:py-6 md:py-8 space-y-6 sm:space-y-8">
      {/* Step 1: Provider Input (Only show when on Step 1) */}
      {currentStep === 1 && (
      <div id="provider-input" className="space-y-6" data-tour="fmv-wrvu-content">
        {/* Header - No container */}
        <div className="flex items-center gap-2">
          <ScreenInfoModal
            title="Provider Input - wRVU Calculator"
                description={`## Overview
Enter your provider information and wRVU data to calculate your percentile ranking against market benchmarks. This step collects your personal productivity data for comparison.

## Required Fields

### FTE (Full-Time Equivalent)
• Your employment status from 0.1 to 1.0
• 1.0 = full-time employment
• 0.5 = half-time employment
• Used to normalize your wRVUs for fair comparison

### Projected wRVUs
Enter your annual wRVUs using one of three methods:
  • **Annual Total**: Enter your total annual wRVUs directly
  • **Monthly Average**: Enter average wRVUs per month (automatically multiplies by 12)
  • **Monthly Breakdown**: Enter individual monthly values for precise tracking

## Key Features

### Normalized Calculations
• Market benchmarks are normalized to 1.0 FTE for fair comparison
• Your wRVUs are automatically normalized based on your FTE
• This ensures accurate percentile rankings regardless of employment status

### Flexible Input Methods
• Choose the input method that works best for your data
• Switch between methods at any time
• Monthly breakdown allows for seasonal variation tracking

## Next Steps
After entering your data, proceed to Market Data to add benchmark percentiles for comparison.`}
          />
        </div>
        
        {/* Content - No container */}
        <div className="space-y-6">
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
        </div>
      </div>
      )}

      {/* Step 2: Market Data (Only show when on Step 2) */}
      {currentStep === 2 && (
      <div id="market-data" className="space-y-6">
        {/* Header - No container */}
        <div className="flex items-center gap-2">
          <ScreenInfoModal
            title="Market Data - wRVU Calculator"
            description={`## Overview
Add market benchmark data to compare your wRVUs against industry standards and calculate your percentile ranking. Market benchmarks represent wRVU production levels at different percentiles for your specialty.

## Required Information

### Benchmark Percentiles
• **At least one percentile is required** to calculate your ranking
• Available percentiles: 25th, 50th, 75th, and 90th
• More percentiles provide more accurate percentile calculation

### Specialty Selection
• Select your medical specialty to load saved market data
• Market data can be saved by specialty for quick loading
• Benchmarks vary significantly by specialty

## How It Works

### Normalized Comparison
• All benchmarks are normalized to 1.0 FTE for fair comparison
• Your normalized wRVUs are compared against these benchmarks
• This ensures accurate rankings regardless of employment status

### Percentile Calculation
• Your percentile indicates where you rank compared to market data
• **Example**: If you're at the 75th percentile, you generate more wRVUs than 75% of providers in your specialty
• Percentiles are calculated using linear interpolation between benchmark values

## Saving Market Data
• You can save market data by specialty for quick loading in future calculations
• Saved data persists across sessions
• Update benchmarks as market data changes`}
          />
        </div>
        
        {/* Content - No container */}
        <div className="space-y-6">
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
        </div>
      </div>
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
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b-2 border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Results</h3>
            </div>
            <div className="space-y-6">
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
                    className="w-full sm:w-auto gap-2"
                  >
                    Start Over
                  </Button>
                </div>
              </div>
            </div>
          </div>
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
