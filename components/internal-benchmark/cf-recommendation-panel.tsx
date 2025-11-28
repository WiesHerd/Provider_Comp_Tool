'use client';

import { CFRecommendation } from '@/types/internal-benchmark';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { TrendingUp, FileText } from 'lucide-react';

interface CFRecommendationPanelProps {
  recommendation: CFRecommendation | null;
}

export function CFRecommendationPanel({ recommendation }: CFRecommendationPanelProps) {
  if (!recommendation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            CF Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Blend benchmarks to generate CF recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          CF Recommendation
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Suggested conversion factor range based on blended benchmarks
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* CF Range Display */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Recommended CF Range
            </Label>
            <Badge
              variant="outline"
              className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
            >
              FY{recommendation.modelYear}
            </Badge>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              ${recommendation.minCF.toFixed(2)}
            </span>
            <span className="text-lg text-gray-600 dark:text-gray-400">–</span>
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              ${recommendation.maxCF.toFixed(2)}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">/wRVU</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            Median: ${recommendation.medianCF.toFixed(2)}/wRVU
          </p>
        </div>

        {/* Justification Text */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Executive Justification
            </Label>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {recommendation.justification}
            </p>
          </div>
        </div>

        {/* Commentary */}
        {recommendation.commentary && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Additional Commentary
            </Label>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {recommendation.commentary}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

