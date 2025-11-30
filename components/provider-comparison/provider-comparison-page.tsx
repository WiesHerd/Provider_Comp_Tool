'use client';

import { useState, useEffect } from 'react';
import { ProviderComparison } from '@/components/physician-scenarios/provider-comparison';
import { MarketBenchmarks } from '@/types';
import { SpecialtyInput } from '@/components/fmv/specialty-input';
import { BenchmarkInputs } from '@/components/fmv/benchmark-inputs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  loadMarketData
} from '@/lib/utils/market-data-storage';

export function ProviderComparisonPageContent() {
  const [specialty, setSpecialty] = useState<string>('');
  const [marketBenchmarks, setMarketBenchmarks] = useState<MarketBenchmarks>({});
  const [showManualEntry, setShowManualEntry] = useState<boolean>(false);

  // Auto-load market data when specialty changes
  useEffect(() => {
    if (!specialty || specialty === 'Other') return;
    
    // Load wRVU data
    const wrvuData = loadMarketData(specialty, 'wrvu');
    // Load TCC data
    const tccData = loadMarketData(specialty, 'tcc');
    // Load CF data
    const cfData = loadMarketData(specialty, 'cf');

    // Merge all loaded data
    const loadedBenchmarks: MarketBenchmarks = {
      ...(wrvuData || {}),
      ...(tccData || {}),
      ...(cfData || {}),
    };

    // Only update if we have some data
    if (Object.keys(loadedBenchmarks).length > 0) {
      setMarketBenchmarks(loadedBenchmarks);
    }
  }, [specialty]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6">
      <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto pt-6 sm:pt-8 md:pt-10 pb-4 sm:pb-6 md:pb-8">
        {/* Page Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
              Provider Comparison
            </h1>
            <Tooltip 
              content="Quickly compare two providers side-by-side with different pay, CF models, and productivity levels to see how they calculate incentives and total cash compensation."
              side="right"
            >
              <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
            </Tooltip>
          </div>
        </div>

        {/* Specialty Selection - Optional but helpful for market data */}
        <Card className="border-2 mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Market Data (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Specialty</Label>
                <SpecialtyInput
                  metricType="wrvu"
                  specialty={specialty}
                  onSpecialtyChange={setSpecialty}
                  onMarketDataLoad={setMarketBenchmarks}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Select a specialty to load market benchmarks. This enables percentile calculations and alignment status. The comparison works without market data, but results will be more limited.
                </p>
              </div>

              {/* Manual Entry Toggle */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  onClick={() => setShowManualEntry(!showManualEntry)}
                  className="w-full justify-between text-sm"
                >
                  <span>Enter market data manually</span>
                  {showManualEntry ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>

                {showManualEntry && (
                  <div className="mt-4 space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <BenchmarkInputs
                      benchmarks={marketBenchmarks}
                      onBenchmarksChange={setMarketBenchmarks}
                      type="wrvu"
                    />
                    <BenchmarkInputs
                      benchmarks={marketBenchmarks}
                      onBenchmarksChange={setMarketBenchmarks}
                      type="tcc"
                    />
                    <BenchmarkInputs
                      benchmarks={marketBenchmarks}
                      onBenchmarksChange={setMarketBenchmarks}
                      type="cf"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Provider Comparison Component */}
        <ProviderComparison marketBenchmarks={marketBenchmarks} />
      </div>
    </div>
  );
}

