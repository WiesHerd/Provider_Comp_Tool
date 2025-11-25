'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BenchmarkInputs } from '@/components/fmv/benchmark-inputs';
import { PercentileBreakdown } from '@/components/fmv/percentile-breakdown';
import { FMVSaveButton } from '@/components/fmv/fmv-save-button';
import { SpecialtyInput } from '@/components/fmv/specialty-input';
import { MarketDataSaveButton } from '@/components/fmv/market-data-save-button';
import { ProviderInputSaveButton } from '@/components/fmv/provider-input-save-button';
import { TCCComponentsGrid } from '@/components/fmv/tcc-components-grid';
import { FTEInput } from '@/components/wrvu/fte-input';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Calculator, RotateCcw } from 'lucide-react';
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
  const [tccComponents, setTccComponents] = useState<TCCComponent[]>([
    {
      id: `component-${Date.now()}`,
      label: '',
      type: 'Base Salary',
      calculationMethod: 'fixed',
      amount: 0,
      fixedAmount: 0,
    }
  ]);
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
    // Clear all form data but keep one empty component
    setSpecialty('');
    setFte(1.0);
    setTccComponents([{
      id: `component-${Date.now()}`,
      label: '',
      type: 'Base Salary',
      calculationMethod: 'fixed',
      amount: 0,
      fixedAmount: 0,
    }]);
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
      <div id="provider-input" className="space-y-6" data-tour="fmv-tcc-content">
        {/* Content - No container */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Total Cash Compensation</h2>
          <div className="flex items-end justify-between gap-2 sm:gap-4">
            <div className="flex items-end gap-2 sm:gap-4">
              {tccComponents.some(c => c.amount > 0) && (
                <div className="flex items-end">
                  <ProviderInputSaveButton
                    scenarioType="fmv-tcc"
                    fte={fte}
                    tccComponents={tccComponents}
                    specialty={specialty}
                  />
                </div>
              )}
              <FTEInput value={fte} onChange={setFte} />
            </div>
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
          </div>
          
          <TCCComponentsGrid
            components={tccComponents}
            onComponentsChange={setTccComponents}
          />

          {totalTcc > 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
              {/* Itemized breakdown - only show components with amounts > 0 */}
              {tccComponents.some(c => c.amount > 0) && (
                <div className="space-y-1.5">
                  {tccComponents
                    .filter(component => component.amount > 0)
                    .map((component) => {
                      const displayLabel = component.label || component.type;
                      return (
                        <div key={component.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 dark:text-gray-400 truncate pr-2">{displayLabel}</span>
                          <span className="font-medium text-gray-900 dark:text-white whitespace-nowrap">
                            {formatValue(component.amount)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
              {/* Totals */}
              <div className="pt-2 space-y-1.5 border-t border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total TCC</span>
                  <span className="font-semibold text-base text-gray-900 dark:text-white">
                    {formatValue(totalTcc)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Normalized TCC (1.0 FTE)</span>
                  <span className="font-semibold text-base text-primary">
                    {formatValue(normalizedTcc)}
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
        </div>
      </div>
      )}

      {/* Navigation Buttons - Show when on Step 1 or 2 */}
      {currentStep === 1 && normalizedTcc > 0 && !showResults && (
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
      
      {/* Calculate Button - Always visible on Step 2 for easy recalculation */}
      {currentStep === 2 && (
        <div className="sticky bottom-20 md:bottom-0 bg-white dark:bg-gray-900 pt-4 pb-4 sm:pb-6 border-t border-gray-200 dark:border-gray-800 safe-area-inset-bottom z-10">
          <Button
            onClick={handleCalculate}
            className="w-full min-h-[48px] text-base font-semibold"
            size="lg"
            disabled={!hasMarketData || normalizedTcc === 0}
          >
            <Calculator className="w-5 h-5 mr-2" />
            {showResults ? 'Recalculate Percentile' : 'Calculate Percentile'}
          </Button>
        </div>
      )}

      {/* Step 3: Results (Only shown after calculation) */}
      {currentStep === 3 && showResults && normalizedTcc > 0 && (
        <div id="results-section" className="space-y-6 pt-8">
          {/* Back button in Step 3 to return to Step 2 */}
          <div className="flex items-center gap-2 mb-4">
            <BackButton onClick={() => setActiveStep(2)} aria-label="Back to Market Data" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Back to Market Data</span>
          </div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Total Cash Compensation</h2>
          </div>
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

          {/* Save and Start Over Buttons */}
          <div className="pt-4 border-t-2 border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
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

export default function TCCCalculatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6"><div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8 md:pb-12">Loading...</div></div>}>
      <TCCCalculatorPageContent />
    </Suspense>
  );
}
