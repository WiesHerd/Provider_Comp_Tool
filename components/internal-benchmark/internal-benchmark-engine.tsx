'use client';

import { useState, useEffect, useMemo } from 'react';
import { useDebouncedLocalStorage } from '@/hooks/use-debounced-local-storage';
import { ProviderRecord, InternalPercentiles, BlendedBenchmarks, CFRecommendation } from '@/types/internal-benchmark';
import { MarketBenchmarks } from '@/types';
import { SpecialtyInput } from '@/components/fmv/specialty-input';
import { DataUploadSection } from './data-upload-section';
import { PercentileCalculator } from './percentile-calculator';
import { InternalVsMarketComparison } from './internal-vs-market-comparison';
import { BlendedBenchmarkPanel } from './blended-benchmark-panel';
import { CFRecommendationPanel } from './cf-recommendation-panel';
import { ExportPanel } from './export-panel';
import {
  calculateInternalPercentiles,
  blendBenchmarks,
  calculateCFRecommendation,
  generateJustificationText,
} from '@/lib/utils/internal-benchmark';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart3 } from 'lucide-react';

const STORAGE_KEY = 'internalBenchmarkEngineDraftState';

export function InternalBenchmarkEngine() {
  const [specialty, setSpecialty] = useState<string>('');
  const [modelYear, setModelYear] = useState<number>(new Date().getFullYear());
  const [records, setRecords] = useState<ProviderRecord[]>([
    {
      id: 'record-1',
      name: '',
      fte: 1.0,
      wrvus: 0,
      tcc: 0,
      notes: '',
    },
  ]);
  const [marketBenchmarks, setMarketBenchmarks] = useState<MarketBenchmarks>({});
  const [blendedBenchmarks, setBlendedBenchmarks] = useState<BlendedBenchmarks | null>(null);

  // Auto-save draft state
  const draftState = {
    specialty,
    modelYear,
    records,
    marketBenchmarks,
    blendedBenchmarks,
  };
  useDebouncedLocalStorage(STORAGE_KEY, draftState);

  // Load draft state on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        setSpecialty(draft.specialty || '');
        setModelYear(draft.modelYear || new Date().getFullYear());
        setRecords(draft.records || [
          {
            id: 'record-1',
            name: '',
            fte: 1.0,
            wrvus: 0,
            tcc: 0,
            notes: '',
          },
        ]);
        setMarketBenchmarks(draft.marketBenchmarks || {});
        setBlendedBenchmarks(draft.blendedBenchmarks || null);
      }
    } catch (error) {
      console.error('Error loading draft state:', error);
    }
  }, []);

  // Calculate internal percentiles
  const internalPercentiles = useMemo<InternalPercentiles | null>(() => {
    const validRecords = records.filter((r) => r.name && r.wrvus > 0 && r.tcc > 0 && r.fte > 0);
    if (validRecords.length === 0) {
      return null;
    }
    return calculateInternalPercentiles(validRecords);
  }, [records]);

  // Calculate CF recommendation
  const recommendation = useMemo<CFRecommendation | null>(() => {
    if (!blendedBenchmarks) {
      return null;
    }

    const cfRec = calculateCFRecommendation(blendedBenchmarks, modelYear);

    // Generate justification text
    if (internalPercentiles && marketBenchmarks && Object.keys(marketBenchmarks).length > 0) {
      cfRec.commentary = generateJustificationText(
        internalPercentiles,
        marketBenchmarks,
        blendedBenchmarks,
        cfRec
      );
    }

    return cfRec;
  }, [blendedBenchmarks, modelYear, internalPercentiles, marketBenchmarks]);

  return (
    <div className="space-y-6">
      {/* Title & UX Message */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Internal Benchmark Engine
          </h1>
        </div>
        <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed max-w-4xl">
          This module allows compensation professionals to upload actual compensation
          and productivity data for a specialty — then compare it directly to market survey data
          to generate internal percentiles, identify drift, and build FMV-ready recommendations.
          No EMR data is required.
        </p>
      </div>

      {/* Context Panel */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Specialty</Label>
              <SpecialtyInput
                metricType="cf"
                specialty={specialty}
                onSpecialtyChange={setSpecialty}
                onMarketDataLoad={setMarketBenchmarks}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Model Year</Label>
              <Select
                value={modelYear.toString()}
                onValueChange={(value) => setModelYear(parseInt(value, 10))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {Array.from({ length: 11 }, (_, i) => {
                    const year = new Date().getFullYear() - 5 + i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Upload Section */}
      <DataUploadSection records={records} onRecordsChange={setRecords} />

      {/* Percentile Calculator */}
      <PercentileCalculator
        internalPercentiles={internalPercentiles}
        surveyBenchmarks={marketBenchmarks}
      />

      {/* Internal vs Market Comparison Chart */}
      <InternalVsMarketComparison
        internalPercentiles={internalPercentiles}
        surveyBenchmarks={marketBenchmarks}
      />

      {/* Blended Benchmark Panel */}
      <BlendedBenchmarkPanel
        internalPercentiles={internalPercentiles}
        surveyBenchmarks={marketBenchmarks}
        onBlendedBenchmarksChange={setBlendedBenchmarks}
      />

      {/* CF Recommendation Panel */}
      <CFRecommendationPanel recommendation={recommendation} />

      {/* Export Panel */}
      <ExportPanel
        records={records}
        internalPercentiles={internalPercentiles}
        surveyBenchmarks={marketBenchmarks}
        blendedBenchmarks={blendedBenchmarks}
        recommendation={recommendation}
        specialty={specialty}
        modelYear={modelYear}
      />
    </div>
  );
}


