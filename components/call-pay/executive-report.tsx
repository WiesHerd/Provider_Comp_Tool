'use client';

import React from 'react';
import { ScenarioReportData } from '@/types/report';
import { format } from 'date-fns';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ExecutiveReportProps {
  data: ScenarioReportData;
}

export function ExecutiveReport({ data }: ExecutiveReportProps) {
  const {
    scenario,
    totalAnnualCallBudget,
    callPayPerFTE,
    effectivePer24h,
    fairnessScore,
    fmvRiskLevel,
    fmvPercentileEstimate,
    fmvNarrative,
    specialty,
    modelYear,
    serviceLine,
    providersOnCall,
    totalEligibleFTE,
    eligibleProviderCount,
  } = data;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 1) => {
    return value.toFixed(decimals);
  };

  const getRiskLevelStyles = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'LOW':
        return {
          bg: 'bg-green-50',
          text: 'text-green-700',
          icon: CheckCircle2,
          label: 'Low Risk',
        };
      case 'MODERATE':
        return {
          bg: 'bg-yellow-50',
          text: 'text-yellow-700',
          icon: AlertTriangle,
          label: 'Moderate Risk',
        };
      case 'HIGH':
        return {
          bg: 'bg-red-50',
          text: 'text-red-700',
          icon: AlertCircle,
          label: 'High Risk',
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          icon: AlertCircle,
          label: 'N/A',
        };
    }
  };

  const riskStyles = getRiskLevelStyles(fmvRiskLevel);
  const RiskIcon = riskStyles.icon;

  return (
    <div className="executive-report bg-white text-gray-900 p-8 max-w-4xl mx-auto" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Cover / Summary Section */}
      <div className="mb-12 border-b-2 border-gray-300 pb-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Call Pay Compensation Report</h1>
          <p className="text-lg text-gray-600">{scenario.name}</p>
          <p className="text-sm text-gray-500 mt-2">
            Generated: {format(new Date(), 'MMMM d, yyyy h:mm a')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Specialty</p>
            <p className="text-base font-semibold">{specialty}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Model Year</p>
            <p className="text-base font-semibold">{modelYear}</p>
          </div>
          {serviceLine && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Service Line</p>
              <p className="text-base font-semibold">{serviceLine}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600 mb-1">Providers on Call</p>
            <p className="text-base font-semibold">{providersOnCall}</p>
          </div>
        </div>

        {/* Key KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Total Annual Budget</p>
            <p className="text-xl font-bold">{formatCurrency(totalAnnualCallBudget)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Call Pay per FTE</p>
            <p className="text-xl font-bold">{formatCurrency(callPayPerFTE)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Effective $/24h</p>
            <p className="text-xl font-bold">{formatCurrency(effectivePer24h)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Fairness Score</p>
            <p className={cn(
              "text-xl font-bold",
              fairnessScore !== undefined && fairnessScore >= 80 ? "text-green-600" :
              fairnessScore !== undefined && fairnessScore >= 60 ? "text-yellow-600" :
              "text-red-600"
            )}>
              {fairnessScore !== undefined ? formatNumber(fairnessScore) : 'N/A'}
            </p>
          </div>
        </div>

        {fmvRiskLevel && (
          <div className="mt-6 flex items-center gap-3">
            <p className="text-sm text-gray-600">FMV Risk Level:</p>
            <div className={cn('px-3 py-1 rounded-md text-sm font-semibold flex items-center gap-2', riskStyles.bg, riskStyles.text)}>
              <RiskIcon className="w-4 h-4" />
              {riskStyles.label}
            </div>
            {fmvPercentileEstimate !== undefined && (
              <p className="text-sm text-gray-600">
                (~{fmvPercentileEstimate}th percentile)
              </p>
            )}
          </div>
        )}
      </div>

      {/* Inputs & Assumptions Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Inputs & Assumptions</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Provider Summary</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Eligible Providers</p>
                <p className="text-base font-semibold">{eligibleProviderCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Eligible FTE</p>
                <p className="text-base font-semibold">{formatNumber(totalEligibleFTE, 2)}</p>
              </div>
            </div>
            
            {scenario.providers.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">Provider Details</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-2 px-2">Provider</th>
                      <th className="text-right py-2 px-2">FTE</th>
                      <th className="text-left py-2 px-2">Tier</th>
                      <th className="text-center py-2 px-2">Eligible</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenario.providers.slice(0, 10).map((provider) => (
                      <tr key={provider.id} className="border-b border-gray-200">
                        <td className="py-2 px-2">{provider.name || `Provider ${provider.id}`}</td>
                        <td className="text-right py-2 px-2">{formatNumber(provider.fte, 2)}</td>
                        <td className="py-2 px-2">{provider.tierId}</td>
                        <td className="text-center py-2 px-2">
                          {provider.eligibleForCall ? 'Yes' : 'No'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {scenario.providers.length > 10 && (
                  <p className="text-xs text-gray-500 mt-2">
                    ... and {scenario.providers.length - 10} more providers
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Call Volume Assumptions</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Weekday Calls/Month</p>
                <p className="text-base font-semibold">{scenario.assumptions.weekdayCallsPerMonth}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Weekend Calls/Month</p>
                <p className="text-base font-semibold">{scenario.assumptions.weekendCallsPerMonth}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Holidays/Year</p>
                <p className="text-base font-semibold">{scenario.assumptions.holidaysPerYear}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Coverage Tiers</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-3">
              {scenario.tiers.filter(t => t.enabled).map((tier) => (
                <div key={tier.id} className="border-b border-gray-200 last:border-b-0 pb-3 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{tier.id} - {tier.coverageType}</p>
                      <p className="text-sm text-gray-600">{tier.paymentMethod}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Base Rate</p>
                      <p className="font-semibold">{formatCurrency(tier.baseRate)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Burden & Fairness Section */}
      {scenario.burdenSummary && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Burden & Fairness Analysis</h2>
          
          <div className="mb-6">
            <p className="text-base text-gray-700 mb-4">
              The call burden distribution across providers is evaluated based on FTE-weighted allocation. 
              The fairness score (0-100) measures the equity of call distribution, with higher scores 
              indicating more equitable distribution.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Average Calls/Provider</p>
                  <p className="text-base font-semibold">
                    {formatNumber(scenario.burdenSummary.groupAverageCalls, 1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Min Calls</p>
                  <p className="text-base font-semibold">
                    {formatNumber(scenario.burdenSummary.minCalls, 1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Max Calls</p>
                  <p className="text-base font-semibold">
                    {formatNumber(scenario.burdenSummary.maxCalls, 1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Fairness Score</p>
                  <p className={cn(
                    "text-base font-semibold",
                    scenario.burdenSummary.fairnessScore >= 80 ? "text-green-600" :
                    scenario.burdenSummary.fairnessScore >= 60 ? "text-yellow-600" :
                    "text-red-600"
                  )}>
                    {formatNumber(scenario.burdenSummary.fairnessScore, 1)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FMV / Compliance Section */}
      {scenario.fmvSummary && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">FMV / Compliance Analysis</h2>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Effective Rate vs Market Benchmarks</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Our Effective Rate</p>
                  <p className="text-lg font-bold">{formatCurrency(effectivePer24h)}</p>
                </div>
                {fmvPercentileEstimate !== undefined && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Percentile Position</p>
                    <p className="text-lg font-bold">~{fmvPercentileEstimate}th percentile</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Risk Assessment</p>
              <div className={cn('inline-flex items-center gap-2 px-3 py-2 rounded-md', riskStyles.bg, riskStyles.text)}>
                <RiskIcon className="w-5 h-5" />
                <span className="font-semibold">{riskStyles.label}</span>
              </div>
            </div>
          </div>

          {fmvNarrative && (
            <div className="bg-white border border-gray-300 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">FMV Narrative Summary</h3>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {fmvNarrative}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Notes / Disclaimers Section */}
      <div className="mt-12 pt-8 border-t-2 border-gray-300">
        <h2 className="text-xl font-bold mb-4">Notes & Disclaimers</h2>
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            This report is generated for internal planning and analysis purposes. 
            Market benchmark data is sourced from industry surveys and may not reflect 
            all relevant factors for your specific situation.
          </p>
          <p>
            Fair Market Value (FMV) determinations should be reviewed by qualified 
            valuation professionals. This analysis is not a substitute for formal 
            FMV opinions or legal advice.
          </p>
          <p>
            Call volume assumptions are estimates based on historical patterns and 
            may vary in practice. Actual call distribution will depend on scheduling 
            and operational factors.
          </p>
        </div>
      </div>
    </div>
  );
}





