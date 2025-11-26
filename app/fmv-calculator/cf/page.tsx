'use client';

import { useState, useEffect, Suspense } from 'react';
import { useDebouncedLocalStorage } from '@/hooks/use-debounced-local-storage';
import { useSearchParams } from 'next/navigation';
import { BenchmarkInputs } from '@/components/fmv/benchmark-inputs';
import { PercentileBreakdown } from '@/components/fmv/percentile-breakdown';
import { FMVSaveButton } from '@/components/fmv/fmv-save-button';
import { SpecialtyInput } from '@/components/fmv/specialty-input';
import { MarketDataSaveButton } from '@/components/fmv/market-data-save-button';
import { ProviderInputSaveButton } from '@/components/fmv/provider-input-save-button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Calculator, RotateCcw } from 'lucide-react';
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
  const [scenarioLoaded, setScenarioLoaded] = useState(false);

  const STORAGE_KEY = 'fmvCfDraftState';

  // Auto-save draft state to localStorage whenever inputs change (debounced, skip when scenario is loaded)
  const draftState = scenarioLoaded ? null : {
    specialty,
    cfValue,
    marketBenchmarks,
    showResults,
  };
  useDebouncedLocalStorage(STORAGE_KEY, draftState);

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
        if (draft.cfValue > 0) {
          setSpecialty(draft.specialty || '');
          setCfValue(draft.cfValue || 0);
          setMarketBenchmarks(draft.marketBenchmarks || {});
          setShowResults(draft.showResults || false);
        }
      }
    } catch (error) {
      console.error('Error loading draft state:', error);
    }
  }, [searchParams, scenarioLoaded]);

  const percentile = calculateCFPercentile(cfValue, marketBenchmarks);

  const formatValue = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/wRVU`;
  };

  const formatBenchmark = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Check if any benchmark value exists and is greater than 0
  // Convert to numbers to handle any string values from saved data
  const hasMarketData = 
    (marketBenchmarks.cf25 != null && Number(marketBenchmarks.cf25) > 0) || 
    (marketBenchmarks.cf50 != null && Number(marketBenchmarks.cf50) > 0) || 
    (marketBenchmarks.cf75 != null && Number(marketBenchmarks.cf75) > 0) || 
    (marketBenchmarks.cf90 != null && Number(marketBenchmarks.cf90) > 0);


  const handleCalculate = () => {
    if (cfValue > 0 && hasMarketData) {
      setShowResults(true);
    } else {
      console.warn('❌ Conditions NOT met:');
      console.warn('  - CF Value > 0:', cfValue > 0, '(value:', cfValue, ')');
      console.warn('  - Has Market Data:', hasMarketData);
      if (!hasMarketData) {
        console.warn('  - Market Benchmarks breakdown:');
        console.warn('    - cf25:', marketBenchmarks.cf25, '(> 0:', marketBenchmarks.cf25 != null && Number(marketBenchmarks.cf25) > 0, ')');
        console.warn('    - cf50:', marketBenchmarks.cf50, '(> 0:', marketBenchmarks.cf50 != null && Number(marketBenchmarks.cf50) > 0, ')');
        console.warn('    - cf75:', marketBenchmarks.cf75, '(> 0:', marketBenchmarks.cf75 != null && Number(marketBenchmarks.cf75) > 0, ')');
        console.warn('    - cf90:', marketBenchmarks.cf90, '(> 0:', marketBenchmarks.cf90 != null && Number(marketBenchmarks.cf90) > 0, ')');
      }
    }
  };

  const handleStartNew = () => {
    // Clear all form data
    setSpecialty('');
    setCfValue(0);
    setMarketBenchmarks({});
    setShowResults(false);
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
      }
    }
  }, [searchParams, getScenario, scenarioLoaded]);

  // Reset showResults when market data or CF value changes (so user can recalculate)
  // Note: Don't include showResults in deps to avoid resetting it immediately after setting it
  useEffect(() => {
    if (showResults) {
      setShowResults(false);
    }
  }, [marketBenchmarks, cfValue]); // Removed showResults from deps to prevent immediate reset

  // Scroll to results when they are shown
  useEffect(() => {
    if (showResults && cfValue > 0) {
      // Use requestAnimationFrame to wait for DOM update, then setTimeout for React render
      requestAnimationFrame(() => {
        setTimeout(() => {
          const resultsSection = document.getElementById('results-section');
          if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            // Try again after a longer delay in case React hasn't rendered yet
            setTimeout(() => {
              const retrySection = document.getElementById('results-section');
              if (retrySection) {
                retrySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 500);
          }
        }, 150);
      });
    }
  }, [showResults, cfValue]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8 md:pb-12 space-y-6 sm:space-y-8">

      {/* Combined Input Screen - CF Input and Market Data together */}
      {!showResults && (
      <div id="cf-input" className="space-y-6" data-tour="fmv-cf-content">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Conversion Factor</h2>
          <div className="flex items-center justify-between">
            {cfValue > 0 && (
              <ProviderInputSaveButton
                scenarioType="fmv-cf"
                fte={1.0}
                cfValue={cfValue}
                specialty={specialty}
              />
            )}
            <div className={cfValue > 0 ? '' : 'ml-auto'}>
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
                  setScenarioLoaded(true);
                }}
              />
            </div>
          </div>
          
          {/* CF Input Section */}
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

          {/* Market Data Section */}
          <div className="pt-6 space-y-6">
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
          </div>
        </div>
      </div>
      )}

      {/* Calculate Button - Always visible when not showing results */}
      {!showResults && cfValue > 0 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
          {!hasMarketData && (
            <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
              Please enter at least one benchmark value (25th, 50th, 75th, or 90th percentile) to calculate.
            </p>
          )}
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

      {/* Results (Only shown after calculation) */}
      {showResults && cfValue > 0 && (
        <div id="results-section" className="space-y-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Conversion Factor</h2>
          </div>
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
            valueLabel="Your Conversion Factor"
          />

          {/* Save and Start Over Buttons */}
          <div className="pt-4 border-t-2 border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <FMVSaveButton
                  metricType="cf"
                  value={cfValue}
                  benchmarks={marketBenchmarks}
                  percentile={percentile}
                  specialty={specialty}
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

export default function CFCalculatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6"><div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8 md:pb-12">Loading...</div></div>}>
      <CFCalculatorPageContent />
    </Suspense>
  );
}
