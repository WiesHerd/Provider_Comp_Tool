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
import { TCCComponentsGrid } from '@/components/fmv/tcc-components-grid';
import { FTEInput } from '@/components/wrvu/fte-input';
import { StepIndicator } from '@/components/ui/step-indicator';
import { StepBadge } from '@/components/ui/step-badge';
import { ScreenInfoModal } from '@/components/ui/screen-info-modal';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';
import { ScenarioLoader } from '@/components/scenarios/scenario-loader';
import { MarketBenchmarks, TCCComponent, FTE, ProviderScenario } from '@/types';
import { calculateTCCPercentile } from '@/lib/utils/percentile';
import { normalizeTcc } from '@/lib/utils/normalization';
import { useScenariosStore } from '@/lib/store/scenarios-store';

function TCCCalculatorPageContent() {
  const searchParams = useSearchParams();
  const { getScenario } = useScenariosStore();
  const [specialty, setSpecialty] = useState<string>('');
  const [fte, setFte] = useState<FTE>(1.0);
  const [tccComponents, setTccComponents] = useState<TCCComponent[]>([]);
  const [marketBenchmarks, setMarketBenchmarks] = useState<MarketBenchmarks>({});
  const [showResults, setShowResults] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [scenarioLoaded, setScenarioLoaded] = useState(false);

  // Calculate total TCC from components
  const totalTcc = tccComponents.reduce((sum, c) => sum + c.amount, 0);
  const normalizedTcc = normalizeTcc(totalTcc, fte);
  const percentile = calculateTCCPercentile(normalizedTcc, marketBenchmarks);

  const formatValue = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const hasMarketData = marketBenchmarks.tcc25 || marketBenchmarks.tcc50 || marketBenchmarks.tcc75 || marketBenchmarks.tcc90;

  const handleCalculate = () => {
    if (normalizedTcc > 0 && hasMarketData) {
      setShowResults(true);
      setActiveStep(3); // Navigate to results step
    }
  };

  const handleStartNew = () => {
    // Clear all form data
    setSpecialty('');
    setFte(1.0);
    setTccComponents([]);
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
      if (scenario && scenario.scenarioType === 'fmv-tcc') {
        setFte(scenario.fte);
        if (scenario.tccComponents && scenario.tccComponents.length > 0) {
          setTccComponents(scenario.tccComponents);
        }
        if (scenario.marketBenchmarks) {
          setMarketBenchmarks(scenario.marketBenchmarks);
        }
        if (scenario.specialty) {
          setSpecialty(scenario.specialty);
        }
        setScenarioLoaded(true);
        // If we have both TCC and market data, go to step 2
        if (scenario.tccComponents && scenario.tccComponents.length > 0 && scenario.marketBenchmarks) {
          setActiveStep(2);
        }
      }
    }
  }, [searchParams, getScenario, scenarioLoaded]);

  // Handle callPay query parameter from call-pay-modeler
  useEffect(() => {
    const callPayParam = searchParams.get('callPay');
    if (callPayParam) {
      const callPayAmount = parseFloat(callPayParam);
      if (!isNaN(callPayAmount) && callPayAmount > 0) {
        // Check if call pay component already exists
        const existingCallPay = tccComponents.find(c => c.type === 'Call Pay');
        if (existingCallPay) {
          // Update existing call pay component
          setTccComponents(prev => prev.map(c => 
            c.id === existingCallPay.id
              ? { ...c, amount: callPayAmount, fixedAmount: callPayAmount }
              : c
          ));
        } else {
          // Add new call pay component
          const callPayComponent: TCCComponent = {
            id: `call-pay-${Date.now()}`,
            label: 'Call Pay',
            type: 'Call Pay',
            calculationMethod: 'fixed',
            amount: callPayAmount,
            fixedAmount: callPayAmount,
          };
          setTccComponents(prev => [...prev, callPayComponent]);
        }
        // Clear the query parameter to avoid re-adding on re-render
        const url = new URL(window.location.href);
        url.searchParams.delete('callPay');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset showResults when market data changes (so user can recalculate)
  useEffect(() => {
    if (showResults && activeStep === 2) {
      setShowResults(false);
    }
  }, [marketBenchmarks, activeStep, showResults]);

  // Determine what steps are available based on state
  const getAvailableStep = () => {
    if (showResults) return 3;
    if (hasMarketData && normalizedTcc > 0) return 2;
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
    
    // Allow going to step 2 if they have TCC data
    if (step === 2 && normalizedTcc > 0) {
      setActiveStep(2);
      return;
    }
    
    // Allow going to step 3 if results are ready
    if (step === 3) {
      if (showResults) {
        setActiveStep(3);
      } else if (normalizedTcc > 0 && hasMarketData) {
        // If clicking on results step and ready, trigger calculation
        handleCalculate();
        setActiveStep(3);
      }
    }
  };
  const totalSteps = 3; // Always show all 3 steps
  const stepNames = ['Provider Input', 'Market Data', 'Results'];
  const completedSteps = showResults ? [1, 2] : hasMarketData && normalizedTcc > 0 ? [1] : [];

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
                title="Provider Input - TCC Calculator"
                description="## Overview\nEnter your provider information and Total Cash Compensation (TCC) components to calculate your percentile ranking against market benchmarks. TCC represents your complete cash compensation package.\n\n## Required Fields\n\n### Specialty\n• Select your medical specialty to load relevant market benchmarks\n• Specialty selection helps identify appropriate market data\n• Benchmarks vary significantly by specialty\n\n### FTE (Full-Time Equivalent)\n• Your employment status from 0.1 to 1.0\n• 1.0 = full-time employment\n• Used to normalize your TCC for fair comparison\n\n### TCC Components\nAdd all components of your total cash compensation:\n  • **Base Salary**: Guaranteed annual base compensation\n  • **Productivity Incentive**: Performance-based compensation tied to wRVUs or other metrics\n  • **Retention Bonus**: Bonuses for staying with the organization\n  • **Long-Term Incentive**: Multi-year incentive programs\n  • **Other Compensation**: Any additional cash compensation components\n\n## Key Features\n\n### Normalized Calculations\n• Market benchmarks are normalized to 1.0 FTE for fair comparison\n• Your TCC is automatically normalized based on your FTE\n• This ensures accurate percentile rankings regardless of employment status\n\n### Total TCC Calculation\n• Total TCC is the sum of all components you add\n• Each component is included in the final calculation\n• You can add or remove components as needed\n\n## Next Steps\nAfter entering your data, proceed to Market Data to add benchmark percentiles for comparison."
              />
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ScenarioLoader
            scenarioType="fmv-tcc"
            onLoad={(scenario) => {
              setFte(scenario.fte);
              if (scenario.tccComponents && scenario.tccComponents.length > 0) {
                setTccComponents(scenario.tccComponents);
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
          
          <TCCComponentsGrid
            components={tccComponents}
            onComponentsChange={setTccComponents}
          />

          {totalTcc > 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total TCC</span>
                  <span className="font-semibold text-lg">
                    {formatValue(totalTcc)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Normalized TCC (1.0 FTE)</span>
                  <span className="font-semibold text-lg text-primary">
                    {formatValue(normalizedTcc)}
                  </span>
                </div>
              </div>
              <div className="flex justify-end">
                <ProviderInputSaveButton
                  scenarioType="fmv-tcc"
                  fte={fte}
                  tccComponents={tccComponents}
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
                title="Market Data - TCC Calculator"
                description="## Overview\nAdd market benchmark data to compare your Total Cash Compensation (TCC) against industry standards and calculate your percentile ranking. Market benchmarks represent TCC levels at different percentiles for your specialty.\n\n## Required Information\n\n### Benchmark Percentiles\n• **At least one percentile is required** to calculate your ranking\n• Available percentiles: 25th, 50th, 75th, and 90th\n• More percentiles provide more accurate percentile calculation\n\n### Specialty Selection\n• Select your medical specialty to load saved market data\n• Market data can be saved by specialty for quick loading\n• TCC benchmarks vary significantly by specialty and geographic market\n\n## How It Works\n\n### Normalized Comparison\n• All benchmarks are normalized to 1.0 FTE for fair comparison\n• Your normalized TCC is compared against these benchmarks\n• This ensures accurate rankings regardless of employment status\n\n### Percentile Calculation\n• Your percentile indicates where you rank compared to market data\n• **Example**: If you're at the 75th percentile, your TCC is higher than 75% of providers in your specialty\n• Percentiles are calculated using linear interpolation between benchmark values\n\n### Understanding Percentiles\n• **25th Percentile**: Lower end of market range\n• **50th Percentile**: Median market value\n• **75th Percentile**: Above average, competitive\n• **90th Percentile**: Top tier, highly competitive\n\n## Saving Market Data\n• You can save market data by specialty for quick loading in future calculations\n• Saved data persists across sessions\n• Update benchmarks as market data changes"
              />
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Required:</strong> Add market benchmarks to compare your TCC against market data for percentile analysis. At least one benchmark (25th, 50th, 75th, or 90th percentile) is required to calculate percentiles.
          </p>
          <SpecialtyInput
            metricType="tcc"
            specialty={specialty}
            onSpecialtyChange={setSpecialty}
            onMarketDataLoad={setMarketBenchmarks}
          />
          <BenchmarkInputs
            benchmarks={marketBenchmarks}
            onBenchmarksChange={setMarketBenchmarks}
            type="tcc"
          />
          
          <MarketDataSaveButton
            specialty={specialty}
            metricType="tcc"
            benchmarks={marketBenchmarks}
          />
        </CardContent>
      </Card>
      )}

      {/* Navigation Buttons - Show when on Step 1 or 2 */}
      {currentStep === 1 && normalizedTcc > 0 && !showResults && (
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
      
      {/* Calculate Button - Always visible on Step 2 for easy recalculation */}
      {currentStep === 2 && (
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 pt-4 pb-4 sm:pb-6 border-t border-gray-200 dark:border-gray-800 safe-area-inset-bottom z-10">
          <Button
            onClick={handleCalculate}
            className="w-full min-h-[48px] text-base font-semibold"
            size="lg"
            disabled={!hasMarketData || normalizedTcc === 0}
          >
            <Calculator className="w-5 h-5 mr-2" />
            {showResults ? 'Recalculate Percentile' : 'Calculate Percentile'}
          </Button>
          {!hasMarketData && (
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-2">
              Please add at least one market benchmark to calculate percentile
            </p>
          )}
          {hasMarketData && normalizedTcc === 0 && (
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-2">
              Please add TCC components in Step 1 to calculate percentile
            </p>
          )}
        </div>
      )}

      {/* Step 3: Results (Only shown after calculation) */}
      {currentStep === 3 && showResults && normalizedTcc > 0 && (
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
                  value={normalizedTcc}
                  percentile={percentile}
                  benchmarks={{
                    p25: marketBenchmarks.tcc25,
                    p50: marketBenchmarks.tcc50,
                    p75: marketBenchmarks.tcc75,
                    p90: marketBenchmarks.tcc90,
                  }}
                  formatValue={formatValue}
                  valueLabel="Your Normalized TCC"
                />
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <FMVSaveButton
                  metricType="tcc"
                  value={normalizedTcc}
                  benchmarks={marketBenchmarks}
                  percentile={percentile}
                  tccComponents={tccComponents}
                  fte={fte}
                  totalTcc={totalTcc}
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

export default function TCCCalculatorPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">Loading...</div>}>
      <TCCCalculatorPageContent />
    </Suspense>
  );
}
