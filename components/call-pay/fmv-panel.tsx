'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, AlertTriangle, FileText, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { evaluateFMV } from '@/lib/utils/fmv-evaluator';
import { FMVEvaluationInput, FMVEvaluationResult } from '@/types/fmv';
import { Tooltip } from '@/components/ui/tooltip';

interface FMVPanelProps {
  specialty: string;
  coverageType: string;
  effectiveRatePer24h: number;
  burdenScore?: number;   // e.g. fairness/burden score from existing logic
}

export function FMVPanel({
  specialty,
  coverageType,
  effectiveRatePer24h,
  burdenScore,
}: FMVPanelProps) {
  // Evaluate FMV
  const evaluation = React.useMemo<FMVEvaluationResult>(() => {
    const input: FMVEvaluationInput = {
      specialty,
      coverageType,
      effectiveRatePer24h,
      burdenScore,
    };
    return evaluateFMV(input);
  }, [specialty, coverageType, effectiveRatePer24h, burdenScore]);

  // Get risk level styling
  const getRiskLevelStyles = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          text: 'text-green-700 dark:text-green-300',
          icon: CheckCircle2,
          label: 'Low Risk',
        };
      case 'MODERATE':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-700 dark:text-yellow-300',
          icon: AlertTriangle,
          label: 'Moderate Risk',
        };
      case 'HIGH':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-700 dark:text-red-300',
          icon: AlertCircle,
          label: 'High Risk',
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-800',
          border: 'border-gray-200 dark:border-gray-700',
          text: 'text-gray-700 dark:text-gray-300',
          icon: AlertCircle,
          label: 'Unknown',
        };
    }
  };

  const riskStyles = getRiskLevelStyles(evaluation.riskLevel);
  const RiskIcon = riskStyles.icon;

  // Copy narrative to clipboard
  const handleCopyNarrative = () => {
    navigator.clipboard.writeText(evaluation.narrativeSummary);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            FMV Compliance Analysis
          </CardTitle>
          <Badge
            className={cn(
              'px-3 py-1.5 text-sm font-medium',
              riskStyles.bg,
              riskStyles.border,
              riskStyles.text,
              'border shadow-sm'
            )}
          >
            <RiskIcon className="w-4 h-4 mr-1.5 inline" />
            {riskStyles.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Benchmark Information */}
        {evaluation.benchmark ? (
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Market Benchmark
              </h4>
              <div className="bg-gray-50/80 dark:bg-gray-800/80 rounded-lg p-4 space-y-2 border border-gray-200/40 dark:border-gray-700/40 shadow-sm">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Source:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {evaluation.benchmark.source === 'SC' ? 'SullivanCotter' :
                     evaluation.benchmark.source === 'MGMA' ? 'MGMA' :
                     evaluation.benchmark.source === 'ECG' ? 'ECG' :
                     evaluation.benchmark.source === 'Gallagher' ? 'Gallagher' :
                     evaluation.benchmark.source} {evaluation.benchmark.surveyYear}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Specialty:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {evaluation.benchmark.specialty}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Coverage Type:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {evaluation.benchmark.coverageType}
                  </span>
                </div>
              </div>
            </div>

            {/* Rate Comparison */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Rate Comparison
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 rounded-lg p-3 shadow-sm transition-shadow duration-200 hover:shadow-md">
                  <p className="text-xs text-gray-500/80 dark:text-gray-400/80 mb-1 font-medium">Our Effective Rate</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                    ${effectiveRatePer24h.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500/70 dark:text-gray-400/70 mt-1">per 24-hour period</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 rounded-lg p-3 shadow-sm transition-shadow duration-200 hover:shadow-md">
                  <p className="text-xs text-gray-500/80 dark:text-gray-400/80 mb-1 font-medium">Market Median</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                    ${evaluation.benchmark.medianRatePer24h.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500/70 dark:text-gray-400/70 mt-1">per 24-hour period</p>
                </div>
              </div>
              
              {/* Percentile Indicators */}
              {evaluation.percentileEstimate !== undefined && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Percentile Position:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ~{evaluation.percentileEstimate}th percentile
                    </span>
                  </div>
                  {evaluation.benchmark.p25RatePer24h && evaluation.benchmark.p75RatePer24h && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>25th: ${evaluation.benchmark.p25RatePer24h.toLocaleString()}</span>
                      <span>•</span>
                      <span>75th: ${evaluation.benchmark.p75RatePer24h.toLocaleString()}</span>
                      {evaluation.benchmark.p90RatePer24h && (
                        <>
                          <span>•</span>
                          <span>90th: ${evaluation.benchmark.p90RatePer24h.toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                  No Direct Benchmark Available
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  No market benchmark data found for {specialty} with {coverageType} coverage type. 
                  Professional judgment and formal valuation may be required.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Key Flags / Notes */}
        {evaluation.notes.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Key Observations
            </h4>
            <ul className="space-y-1.5">
              {evaluation.notes.map((note, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-primary mt-1">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Narrative Summary */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              FMV Narrative Summary
            </h4>
            <Tooltip content="Copy narrative to clipboard">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyNarrative}
                className="h-8 px-2"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </Tooltip>
          </div>
          <Textarea
            value={evaluation.narrativeSummary}
            readOnly
            className="min-h-[120px] text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 resize-none"
            placeholder="FMV narrative will appear here..."
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            This narrative can be copied and used in FMV memos, legal documentation, or compliance reports.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

