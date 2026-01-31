'use client';

import { useState, useEffect, Suspense } from 'react';
import { useDebouncedLocalStorage } from '@/hooks/use-debounced-local-storage';
import { loadDraftState, saveDraftState, deleteDraftState, DRAFT_SCREEN_IDS } from '@/lib/utils/draft-state-storage';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calculator, RotateCcw } from 'lucide-react';
import { ScenarioLoader } from '@/components/scenarios/scenario-loader';
import { MarketBenchmarks } from '@/types';
import { calculateCFPercentile } from '@/lib/utils/percentile';
import { useScenariosStore } from '@/lib/store/scenarios-store';

function CFCalculatorPageContent() {
  const searchParams = useSearchParams();
  const { getScenario } = useScenariosStore();
  const [specialty, setSpecialty] = useState<string>('');
  const [cfValue, setCfValue] = useState<number>(0);
  const [marketBenchmarks, setMarketBenchmarks] = useState<MarketBenchmarks>({});
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'provider' | 'results'>('provider');
  const [scenarioLoaded, setScenarioLoaded] = useState(false);

  const STORAGE_KEY = 'fmvCfDraftState';
  const SCREEN_ID = DRAFT_SCREEN_IDS.FMV_CF;

  // Auto-save draft state to Firebase/localStorage whenever inputs change (debounced, skip when scenario is loaded)
  const draftState = scenarioLoaded ? null : {
    specialty,
    cfValue,
    marketBenchmarks,
    showResults,
  };
  
  // Save to unified storage (debounced)
  useEffect(() => {
    if (scenarioLoaded || !draftState) return;
    
    const timeoutId = setTimeout(() => {
      void saveDraftState(SCREEN_ID, STORAGE_KEY, draftState);
    }, 1000); // 1 second debounce
    
    return () => clearTimeout(timeoutId);
  }, [draftState, scenarioLoaded]);
  
  // Also save to localStorage as immediate backup
  useDebouncedLocalStorage(STORAGE_KEY, draftState);

  // Load draft state on mount (if no scenario is being loaded via URL)
  useEffect(() => {
    if (typeof window === 'undefined' || scenarioLoaded) return;
    
    const scenarioId = searchParams.get('scenario');
    if (scenarioId) return; // URL scenario will be loaded by the other effect
    
    const loadDraft = async () => {
      try {
        const draft = await loadDraftState(SCREEN_ID, STORAGE_KEY);
        if (draft) {
          // Only load draft if it has meaningful data
          const d = draft as any;
          if (d.cfValue > 0) {
            setSpecialty(d.specialty || '');
            setCfValue(d.cfValue || 0);
            setMarketBenchmarks(d.marketBenchmarks || {});
            setShowResults(d.showResults || false);
          }
        }
      } catch (error) {
        console.error('Error loading draft state:', error);
      }
    };
    
    void loadDraft();
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
      setActiveTab('results'); // Navigate to results tab
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
    setActiveTab('provider'); // Go back to Provider tab
    setScenarioLoaded(false); // Reset scenario loaded flag
    // Clear draft state
    if (typeof window !== 'undefined') {
      void deleteDraftState(SCREEN_ID, STORAGE_KEY);
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
  useEffect(() => {
    if (showResults) {
      setShowResults(false);
      setActiveTab('provider');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketBenchmarks, cfValue]);

  // Ensure activeTab is valid - if results tab is selected but no results, go to provider
  const currentTab = (activeTab === 'results' && !showResults) ? 'provider' : activeTab;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6">
      <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto pt-6 sm:pt-8 md:pt-10 pb-4 sm:pb-6 md:pb-8">
      <Tabs value={currentTab} onValueChange={(value) => setActiveTab(value as 'provider' | 'results')} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="provider" className="text-sm font-medium">
            Provider
          </TabsTrigger>
          <TabsTrigger value="results" className="text-sm font-medium" disabled={!showResults || cfValue === 0}>
            Results
          </TabsTrigger>
        </TabsList>

        {/* Provider Tab - CF Input and Market Data together */}
        <TabsContent value="provider" className="space-y-6 mt-0" data-tour="fmv-cf-content">
        <Card className="border-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Conversion Factor</CardTitle>
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
          </CardHeader>
          <CardContent className="space-y-6">
            {/* CF Input Section */}
            <div className="space-y-2">
            <Label className="text-sm font-semibold">Conversion Factor ($/wRVU)</Label>
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
          </div>
          </CardContent>
        </Card>

          {/* Calculate Button */}
          <div className="pt-6">
            {!hasMarketData && (
              <p className="text-sm text-amber-600 dark:text-amber-400 text-center mb-3">
                Please enter at least one benchmark value (25th, 50th, 75th, or 90th percentile) to calculate.
              </p>
            )}
            <Button
              onClick={handleCalculate}
              className="w-full min-h-[48px] text-base font-semibold"
              size="lg"
              disabled={!hasMarketData || cfValue === 0}
            >
              <Calculator className="w-5 h-5 mr-2 flex-shrink-0" />
              {showResults ? 'Recalculate' : 'Calculate'}
            </Button>
          </div>

          {/* Save Buttons - Sticky bottom */}
          <div className="sticky bottom-24 md:static bg-gray-50 dark:bg-gray-900 pt-4 pb-4 border-t-2 border-gray-200 dark:border-gray-800 safe-area-inset-bottom z-30">
            <div className="flex flex-col sm:flex-row gap-3">
              {cfValue > 0 && (
                <div className="flex-1">
                  <ProviderInputSaveButton
                    scenarioType="fmv-cf"
                    fte={1.0}
                    cfValue={cfValue}
                    specialty={specialty}
                  />
                </div>
              )}
              {specialty && (
                <div className={cfValue > 0 ? "w-full sm:w-auto" : "flex-1"}>
                  <MarketDataSaveButton
                    specialty={specialty}
                    metricType="cf"
                    benchmarks={marketBenchmarks}
                  />
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6 mt-0">
          {showResults && cfValue > 0 && (
            <div id="results-section" className="space-y-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Conversion Factor</h2>
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

          {/* Action Buttons - Sticky bottom */}
          <div className="sticky bottom-24 md:static bg-gray-50 dark:bg-gray-900 pt-4 pb-4 border-t-2 border-gray-200 dark:border-gray-800 safe-area-inset-bottom z-30">
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
                <RotateCcw className="w-4 h-4 mr-2 flex-shrink-0" />
                Start Over
              </Button>
            </div>
          </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
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
