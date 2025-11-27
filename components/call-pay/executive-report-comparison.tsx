'use client';

import React from 'react';
import { ScenarioComparisonReportData } from '@/types/report';
import { format } from 'date-fns';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ExecutiveReportComparisonProps {
  data: ScenarioComparisonReportData;
}

export function ExecutiveReportComparison({ data }: ExecutiveReportComparisonProps) {
  const { scenarios, generatedAt } = data;

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

  return (
    <div className="executive-report-comparison bg-white text-gray-900 p-8 max-w-5xl mx-auto" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Cover / Title */}
      <div className="mb-12 border-b-2 border-gray-300 pb-8">
        <h1 className="text-3xl font-bold mb-2">Call Pay Scenario Comparison</h1>
        <p className="text-lg text-gray-600 mb-4">
          Side-by-side analysis of {scenarios.length} scenario{scenarios.length !== 1 ? 's' : ''}
        </p>
        <p className="text-sm text-gray-500">
          Generated: {format(new Date(generatedAt), 'MMMM d, yyyy h:mm a')}
        </p>
      </div>

      {/* Comparison Table */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Scenario Comparison</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="text-left py-3 px-4 font-semibold">Scenario</th>
                <th className="text-right py-3 px-4 font-semibold">Total Budget</th>
                <th className="text-right py-3 px-4 font-semibold">$/FTE</th>
                <th className="text-right py-3 px-4 font-semibold">Fairness Score</th>
                <th className="text-center py-3 px-4 font-semibold">FMV Risk</th>
                <th className="text-right py-3 px-4 font-semibold">Effective $/24h</th>
                <th className="text-left py-3 px-4 font-semibold">Specialty</th>
                <th className="text-left py-3 px-4 font-semibold">Year</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((scenario, index) => {
                const riskStyles = getRiskLevelStyles(scenario.fmvRiskLevel);
                const RiskIcon = riskStyles.icon;

                return (
                  <tr key={scenario.scenario.id} className={cn(
                    "border-b border-gray-200",
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  )}>
                    <td className="py-3 px-4 font-semibold">{scenario.scenario.name}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(scenario.totalAnnualCallBudget)}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(scenario.callPayPerFTE)}</td>
                    <td className="text-right py-3 px-4">
                      <span className={cn(
                        "font-semibold",
                        scenario.fairnessScore !== undefined && scenario.fairnessScore >= 80 ? "text-green-600" :
                        scenario.fairnessScore !== undefined && scenario.fairnessScore >= 60 ? "text-yellow-600" :
                        "text-red-600"
                      )}>
                        {scenario.fairnessScore !== undefined ? formatNumber(scenario.fairnessScore) : 'N/A'}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      {scenario.fmvRiskLevel ? (
                        <div className={cn('inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold', riskStyles.bg, riskStyles.text)}>
                          <RiskIcon className="w-3 h-3" />
                          {riskStyles.label}
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="text-right py-3 px-4">{formatCurrency(scenario.effectivePer24h)}</td>
                    <td className="py-3 px-4 text-sm">{scenario.specialty}</td>
                    <td className="py-3 px-4 text-sm">{scenario.modelYear}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FMV Narrative Summary */}
      {scenarios.some(s => s.fmvNarrative) && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">FMV Analysis Summary</h2>
          <div className="space-y-4">
            {scenarios.map((scenario) => {
              if (!scenario.fmvNarrative) return null;
              
              return (
                <div key={scenario.scenario.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold mb-2">{scenario.scenario.name}</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {scenario.fmvNarrative.length > 300 
                      ? `${scenario.fmvNarrative.substring(0, 300)}...` 
                      : scenario.fmvNarrative}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes / Disclaimers */}
      <div className="mt-12 pt-8 border-t-2 border-gray-300">
        <h2 className="text-xl font-bold mb-4">Notes & Disclaimers</h2>
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            This comparison report is generated for internal planning and analysis purposes. 
            Market benchmark data is sourced from industry surveys and may not reflect 
            all relevant factors for your specific situation.
          </p>
          <p>
            Fair Market Value (FMV) determinations should be reviewed by qualified 
            valuation professionals. This analysis is not a substitute for formal 
            FMV opinions or legal advice.
          </p>
          <p>
            Scenarios are compared based on the metrics shown. Actual implementation 
            may vary based on operational factors and scheduling constraints.
          </p>
        </div>
      </div>
    </div>
  );
}

