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
import { FTEInput } from '@/components/wrvu/fte-input';
import { WRVUInput } from '@/components/wrvu/wrvu-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calculator, RotateCcw } from 'lucide-react';
import { ScenarioLoader } from '@/components/scenarios/scenario-loader';
import { MarketBenchmarks, FTE } from '@/types';
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
  const [activeTab, setActiveTab] = useState<'provider' | 'market' | 'results'>('provider');
  const [scenarioLoaded, setScenarioLoaded] = useState(false);

  const STORAGE_KEY = 'fmvWrvuDraftState';

  // Auto-save draft state to localStorage whenever inputs change (debounced, skip when scenario is loaded)
  const draftState = scenarioLoaded ? null : {
    specialty,
    annualWrvus,
    monthlyWrvus,
    monthlyBreakdown,
    fte,
    marketBenchmarks,
    activeTab,
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
        if (draft.annualWrvus > 0) {
          setSpecialty(draft.specialty || '');
          setAnnualWrvus(draft.annualWrvus || 0);
          setMonthlyWrvus(draft.monthlyWrvus || 0);
          setMonthlyBreakdown(Array.isArray(draft.monthlyBreakdown) && draft.monthlyBreakdown.length === 12 ? draft.monthlyBreakdown : Array(12).fill(0));
          setFte(draft.fte || 1.0);
          setMarketBenchmarks(draft.marketBenchmarks || {});
          setActiveTab(draft.activeTab === 'provider' || draft.activeTab === 'market' || draft.activeTab === 'results' ? draft.activeTab : 'provider');
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
      setActiveTab('results'); // Navigate to results tab
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
    setActiveTab('provider'); // Go back to Provider tab
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
        // If we have both wRVU and market data, go to market tab
        if (scenario.annualWrvus > 0 && scenario.marketBenchmarks) {
          setActiveTab('market');
        }
      }
    }
  }, [searchParams, getScenario, scenarioLoaded]);

  // Reset showResults when market data changes (so user can recalculate)
  useEffect(() => {
    if (showResults && activeTab === 'market') {
      setShowResults(false);
    }
  }, [marketBenchmarks, activeTab, showResults]);

  // Ensure activeTab is valid - if results tab is selected but no results, go to provider
  const currentTab = (activeTab === 'results' && !showResults) ? 'provider' : activeTab;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6">
      <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto pt-6 sm:pt-8 md:pt-10 pb-4 sm:pb-6 md:pb-8">
      <Tabs value={currentTab} onValueChange={(value) => setActiveTab(value as 'provider' | 'market' | 'results')} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="provider" className="text-sm font-medium">
            Provider
          </TabsTrigger>
          <TabsTrigger value="market" className="text-sm font-medium" disabled={normalizedWrvus === 0}>
            Market Data
          </TabsTrigger>
          <TabsTrigger value="results" className="text-sm font-medium" disabled={!showResults || normalizedWrvus === 0}>
            Results
          </TabsTrigger>
        </TabsList>

        {/* Provider Tab */}
        <TabsContent value="provider" className="space-y-6 mt-0" data-tour="fmv-wrvu-content">
        <Card className="border-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">wRVUs</CardTitle>
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
          </CardHeader>
          <CardContent className="space-y-6">
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
                  <Label className="text-sm font-semibold">Normalized wRVUs (1.0 FTE)</Label>
                  <span className="font-semibold text-lg text-primary">
                    {formatValue(normalizedWrvus)}
                  </span>
                </div>
              </div>
            </div>
          )}
          </CardContent>
        </Card>
        </TabsContent>

        {/* Market Data Tab */}
        <TabsContent value="market" className="space-y-6 mt-0">
        <Card className="border-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">wRVUs</CardTitle>
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
          </CardHeader>
          <CardContent className="space-y-6">
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

          {/* Calculate Button */}
          <div className="pt-6">
            <Button
              onClick={handleCalculate}
              className="w-full min-h-[48px] text-base font-semibold"
              size="lg"
              disabled={!hasMarketData || normalizedWrvus === 0}
            >
              <Calculator className="w-5 h-5 mr-2 flex-shrink-0" />
              {showResults ? 'Recalculate' : 'Calculate'}
            </Button>
          </div>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6 mt-0">
          {showResults && normalizedWrvus > 0 && (
            <div id="results-section" className="space-y-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">wRVUs</h2>
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

              {/* Action Buttons */}
              <div className="pt-6 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <FMVSaveButton
                      metricType="wrvu"
                      value={normalizedWrvus}
                      benchmarks={marketBenchmarks}
                      percentile={percentile}
                      specialty={specialty}
                      fte={fte}
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

export default function WRVUCalculatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6"><div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8 md:pb-12">Loading...</div></div>}>
      <WRVUCalculatorPageContent />
    </Suspense>
  );
}
