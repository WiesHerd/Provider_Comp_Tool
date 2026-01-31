'use client';

import { useState } from 'react';
import {
  InternalPercentiles,
  BlendedBenchmarks,
  BlendingMode,
  BlendingWeights,
} from '@/types/internal-benchmark';
import { MarketBenchmarks } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { blendBenchmarks } from '@/lib/utils/internal-benchmark';
import { Sliders } from 'lucide-react';

interface BlendedBenchmarkPanelProps {
  internalPercentiles: InternalPercentiles | null;
  surveyBenchmarks: MarketBenchmarks | null;
  onBlendedBenchmarksChange: (blended: BlendedBenchmarks | null) => void;
}

export function BlendedBenchmarkPanel({
  internalPercentiles,
  surveyBenchmarks,
  onBlendedBenchmarksChange,
}: BlendedBenchmarkPanelProps) {
  const [blendingMode, setBlendingMode] = useState<BlendingMode>('blended');
  const [customWeights, setCustomWeights] = useState<BlendingWeights>({
    internalWeight: 0.5,
    surveyWeight: 0.5,
  });

  const handleModeChange = (mode: BlendingMode) => {
    setBlendingMode(mode);
    if (!internalPercentiles || !surveyBenchmarks) {
      onBlendedBenchmarksChange(null);
      return;
    }

    const weights = mode === 'blended' ? customWeights : undefined;
    const blended = blendBenchmarks(internalPercentiles, surveyBenchmarks, mode, weights);
    onBlendedBenchmarksChange(blended);
  };

  const handleWeightChange = (weights: BlendingWeights) => {
    setCustomWeights(weights);
    if (blendingMode === 'blended' && internalPercentiles && surveyBenchmarks) {
      const blended = blendBenchmarks(internalPercentiles, surveyBenchmarks, 'blended', weights);
      onBlendedBenchmarksChange(blended);
    }
  };

  const applyPreset = (internalWeight: number) => {
    const weights: BlendingWeights = {
      internalWeight,
      surveyWeight: 1 - internalWeight,
    };
    handleWeightChange(weights);
  };

  if (!internalPercentiles || !surveyBenchmarks) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Blended Benchmarks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload provider data and select a specialty to blend benchmarks.
          </p>
        </CardContent>
      </Card>
    );
  }

  const blended = blendBenchmarks(
    internalPercentiles,
    surveyBenchmarks,
    blendingMode,
    blendingMode === 'blended' ? customWeights : undefined
  );

  const formatNumber = (value: number, decimals: number = 0): string => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Sliders className="w-5 h-5" />
          Blended Benchmarks
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Combine internal and survey data to create recommended operating ranges
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Blending Mode Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Blending Mode</Label>
            <Select value={blendingMode} onValueChange={handleModeChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="survey-only">Survey Only (100% Market Data)</SelectItem>
                <SelectItem value="internal-only">Internal Only (100% Internal Data)</SelectItem>
                <SelectItem value="blended">Blended (Custom Weights)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Weight Controls (only for blended mode) */}
          {blendingMode === 'blended' && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Blending Weights</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(0.5)}
                    className={customWeights.internalWeight === 0.5 ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  >
                    50/50
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(0.65)}
                    className={customWeights.internalWeight === 0.65 ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  >
                    65/35
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(0.8)}
                    className={customWeights.internalWeight === 0.8 ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  >
                    80/20
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    Internal Weight
                  </Label>
                  <NumberInput
                    value={customWeights.internalWeight}
                    onChange={(value) => {
                      const newWeight = Math.max(0, Math.min(1, value));
                      handleWeightChange({
                        internalWeight: newWeight,
                        surveyWeight: 1 - newWeight,
                      });
                    }}
                    min={0}
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(customWeights.internalWeight * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">
                    Survey Weight
                  </Label>
                  <NumberInput
                    value={customWeights.surveyWeight}
                    onChange={(value) => {
                      const newWeight = Math.max(0, Math.min(1, value));
                      handleWeightChange({
                        internalWeight: 1 - newWeight,
                        surveyWeight: newWeight,
                      });
                    }}
                    min={0}
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(customWeights.surveyWeight * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Blended Results Table */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Blended Percentiles
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Percentile
                    </th>
                    <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      wRVUs
                    </th>
                    <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      TCC
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400">25th</td>
                    <td className="py-2 px-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {formatNumber(blended.wrvu25)}
                    </td>
                    <td className="py-2 px-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      ${formatNumber(blended.tcc25, 0)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400">50th</td>
                    <td className="py-2 px-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {formatNumber(blended.wrvu50)}
                    </td>
                    <td className="py-2 px-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      ${formatNumber(blended.tcc50, 0)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400">75th</td>
                    <td className="py-2 px-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {formatNumber(blended.wrvu75)}
                    </td>
                    <td className="py-2 px-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      ${formatNumber(blended.tcc75, 0)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400">90th</td>
                    <td className="py-2 px-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {formatNumber(blended.wrvu90)}
                    </td>
                    <td className="py-2 px-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      ${formatNumber(blended.tcc90, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}






















