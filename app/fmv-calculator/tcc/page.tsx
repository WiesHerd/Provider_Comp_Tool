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

  const currentStep = activeStep;

  return (
    <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto py-4 sm:py-6 md:py-8 space-y-6 sm:space-y-8">
      {/* Step 1: Provider Input (Only show when on Step 1) */}
      {currentStep === 1 && (
      <div id="provider-input" className="space-y-6" data-tour="fmv-tcc-content">
        {/* Content - No container */}
        <div className="space-y-6">
          <div className="flex items-center justify-end">
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
        </div>
      </div>
      )}

      {/* Step 2: Market Data (Only show when on Step 2) */}
      {currentStep === 2 && (
      <div id="market-data" className="space-y-6">
        {/* Content - No container */}
        <div className="space-y-6">
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
        </div>
      </div>
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
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b-2 border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Results</h3>
            </div>
            <div className="space-y-6">
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

export default function TCCCalculatorPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">Loading...</div>}>
      <TCCCalculatorPageContent />
    </Suspense>
  );
}
