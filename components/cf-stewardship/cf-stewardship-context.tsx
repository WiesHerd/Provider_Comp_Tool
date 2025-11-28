'use client';

import { ConversionFactorModel } from '@/types/cf-models';
import { MarketBenchmarks } from '@/types';
import { AlignmentStatus } from '@/types/physician-scenarios';
import { MarketMovement } from '@/types/cf-stewardship';
import { SpecialtyInput } from '@/components/fmv/specialty-input';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { getCFModelSummary } from '@/lib/utils/cf-model-engine';
import { Tooltip } from '@/components/ui/tooltip';

interface CFStewardshipContextProps {
  specialty: string;
  modelYear: number;
  surveySource: string;
  currentCFModel: ConversionFactorModel;
  lastYearCF?: number;
  marketMovement?: MarketMovement;
  alignmentSnapshot?: AlignmentStatus;
  onSpecialtyChange: (specialty: string) => void;
  onModelYearChange: (year: number) => void;
  onSurveySourceChange: (source: string) => void;
  onLastYearCFChange: (cf: number | undefined) => void;
  onMarketDataLoad: (benchmarks: MarketBenchmarks) => void;
}

export function CFStewardshipContext({
  specialty,
  modelYear,
  surveySource,
  currentCFModel,
  lastYearCF,
  marketMovement,
  alignmentSnapshot,
  onSpecialtyChange,
  onModelYearChange,
  onSurveySourceChange,
  onLastYearCFChange,
  onMarketDataLoad,
}: CFStewardshipContextProps) {
  const currentCFSummary = getCFModelSummary(currentCFModel);
  
  // Calculate % change for last year CF
  const getLastYearCFDisplay = () => {
    if (!lastYearCF) {
      return 'Not available';
    }
    
    // Extract CF value from current model (for single CF only)
    let currentCFValue = 0;
    if (currentCFModel.modelType === 'single') {
      currentCFValue = (currentCFModel.parameters as { cf: number }).cf;
    }
    
    if (currentCFValue > 0 && lastYearCF > 0) {
      const percentChange = ((currentCFValue - lastYearCF) / lastYearCF) * 100;
      const sign = percentChange >= 0 ? '+' : '';
      return `$${lastYearCF.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/wRVU (${sign}${percentChange.toFixed(1)}%)`;
    }
    
    return `$${lastYearCF.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/wRVU`;
  };

  const getMarketMovementDisplay = () => {
    if (!marketMovement || marketMovement.tccMedianChange === undefined) {
      return 'No comparison data';
    }
    
    const tccChange = marketMovement.tccMedianChange;
    const wrvuChange = marketMovement.wrvuMedianChange || 0;
    
    const tccSign = tccChange >= 0 ? '+' : '';
    const wrvuSign = wrvuChange >= 0 ? '+' : '';
    
    return `TCC: ${tccSign}${tccChange.toFixed(1)}% | wRVU: ${wrvuSign}${wrvuChange.toFixed(1)}%`;
  };

  const getAlignmentBadge = (status?: AlignmentStatus) => {
    if (!status) {
      return (
        <Badge variant="outline" className="bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800">
          Not calculated
        </Badge>
      );
    }

    switch (status) {
      case 'Aligned':
        return (
          <Badge
            variant="outline"
            className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Aligned
          </Badge>
        );
      case 'Mild Drift':
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            Mild Drift
          </Badge>
        );
      case 'Risk Zone':
        return (
          <Badge
            variant="outline"
            className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            Risk Zone
          </Badge>
        );
    }
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          Context
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Specialty</Label>
            <SpecialtyInput
              metricType="cf"
              specialty={specialty}
              onSpecialtyChange={onSpecialtyChange}
              onMarketDataLoad={onMarketDataLoad}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Model Year</Label>
            <Select
              value={modelYear.toString()}
              onValueChange={(value) => onModelYearChange(parseInt(value, 10))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {Array.from({ length: 81 }, (_, i) => {
                  const year = 2020 + i;
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

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Survey Benchmark Source</Label>
          <Input
            value={surveySource}
            onChange={(e) => onSurveySourceChange(e.target.value)}
            placeholder="e.g., MGMA 2024, Gallagher, AAMC"
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Current CF Card */}
          <div className="p-3 sm:p-4 border border-gray-200/60 dark:border-gray-800/60 rounded-lg transition-all duration-200 ease-out bg-white dark:bg-gray-900 hover:shadow-md shadow-sm">
            <div className="flex items-start gap-2 mb-3 sm:mb-4">
              <div className="text-primary flex-shrink-0 mt-0.5">
                <TrendingUp className="w-6 h-6" />
              </div>
              <Tooltip content="Current conversion factor model configuration" side="top" className="max-w-[250px] sm:max-w-[300px]">
                <span className="text-xs sm:text-sm text-gray-600/80 dark:text-gray-400/80 leading-tight block flex-1 font-medium">
                  Current CF
                </span>
              </Tooltip>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm sm:text-base font-semibold break-words flex-1 text-gray-900 dark:text-gray-100">
                {currentCFSummary}
              </span>
            </div>
          </div>

          {/* Last Year CF Card */}
          <div className="p-3 sm:p-4 border border-gray-200/60 dark:border-gray-800/60 rounded-lg transition-all duration-200 ease-out bg-white dark:bg-gray-900 hover:shadow-md shadow-sm">
            <div className="flex items-start gap-2 mb-3 sm:mb-4">
              <div className="text-primary flex-shrink-0 mt-0.5">
                <TrendingDown className="w-6 h-6" />
              </div>
              <Tooltip content="Last year's conversion factor for comparison (optional)" side="top" className="max-w-[250px] sm:max-w-[300px]">
                <span className="text-xs sm:text-sm text-gray-600/80 dark:text-gray-400/80 leading-tight block flex-1 font-medium">
                  Last Year CF
                </span>
              </Tooltip>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm sm:text-base font-semibold break-words flex-1 text-gray-900 dark:text-gray-100">
                {getLastYearCFDisplay()}
              </span>
            </div>
            {!lastYearCF && (
              <div className="mt-2">
                <Input
                  type="number"
                  placeholder="Enter last year CF"
                  className="text-sm"
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    onLastYearCFChange(isNaN(value) ? undefined : value);
                  }}
                />
              </div>
            )}
          </div>

          {/* Market Movement Card */}
          <div className="p-3 sm:p-4 border border-gray-200/60 dark:border-gray-800/60 rounded-lg transition-all duration-200 ease-out bg-white dark:bg-gray-900 hover:shadow-md shadow-sm">
            <div className="flex items-start gap-2 mb-3 sm:mb-4">
              <div className="text-primary flex-shrink-0 mt-0.5">
                <TrendingUp className="w-6 h-6" />
              </div>
              <Tooltip content="Year-over-year change in market benchmarks" side="top" className="max-w-[250px] sm:max-w-[300px]">
                <span className="text-xs sm:text-sm text-gray-600/80 dark:text-gray-400/80 leading-tight block flex-1 font-medium">
                  Survey Market Movement
                </span>
              </Tooltip>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm sm:text-base font-semibold break-words flex-1 text-gray-900 dark:text-gray-100">
                {getMarketMovementDisplay()}
              </span>
            </div>
          </div>

          {/* Alignment Snapshot Card */}
          <div className="p-3 sm:p-4 border border-gray-200/60 dark:border-gray-800/60 rounded-lg transition-all duration-200 ease-out bg-white dark:bg-gray-900 hover:shadow-md shadow-sm">
            <div className="flex items-start gap-2 mb-3 sm:mb-4">
              <div className="text-primary flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <Tooltip content="Overall alignment status based on current CF model" side="top" className="max-w-[250px] sm:max-w-[300px]">
                <span className="text-xs sm:text-sm text-gray-600/80 dark:text-gray-400/80 leading-tight block flex-1 font-medium">
                  Alignment Snapshot
                </span>
              </Tooltip>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex-1">
                {getAlignmentBadge(alignmentSnapshot)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

