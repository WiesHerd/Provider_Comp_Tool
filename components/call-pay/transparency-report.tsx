'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { CallPayContext, CallTier, CallPayImpact } from '@/types/call-pay';
import { calculateTierAnnualPay } from '@/lib/utils/call-pay-coverage';

interface TransparencyReportProps {
  providerName: string;
  context: CallPayContext;
  tiers: CallTier[];
  impact: CallPayImpact;
  peerComparison?: {
    averageCallPay: number;
    percentile: number;
  };
}

export function TransparencyReport({
  providerName,
  context,
  tiers,
  impact,
  peerComparison,
}: TransparencyReportProps) {
  const providerCallPay = useMemo(() => {
    const assignedTiers = tiers.filter(t => t.enabled);
    let totalAnnualPay = 0;

    for (const tier of assignedTiers) {
      const tierAnnualPay = calculateTierAnnualPay(tier, context);
      totalAnnualPay += tierAnnualPay;
    }

    return totalAnnualPay;
  }, [tiers, context]);

  const handleExport = () => {
    const report = generateTransparencyReport({
      providerName,
      context,
      tiers,
      impact,
      providerCallPay,
      peerComparison,
    });

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Call_Pay_Transparency_Report_${providerName}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Call Pay Transparency Report
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Individual Pay Calculation */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Your Call Pay Calculation
          </h3>
          <div className="space-y-2 text-sm">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="font-medium text-gray-900 dark:text-white mb-1">
                Expected Annual Call Pay
              </div>
              <div className="text-2xl font-bold text-primary">
                ${providerCallPay.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              <p>
                This amount is calculated based on your rotation ratio (1-in-{context.rotationRatio}) 
                and the call coverage structure for {context.specialty}.
              </p>
            </div>
          </div>
        </div>

        {/* Rotation Impact Explanation */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            How Rotation Ratio Affects Your Pay
          </h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>
              With a 1-in-{context.rotationRatio} rotation, you cover approximately{' '}
              {((1 / context.rotationRatio) * 100).toFixed(1)}% of the total call coverage needs.
            </p>
            <p>
              There are {context.providersOnCall} providers in the call rotation, and the total 
              annual call budget is divided among all providers based on the rotation schedule.
            </p>
          </div>
        </div>

        {/* Calculation Methodology */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Calculation Methodology
          </h3>
          <div className="space-y-3 text-sm">
            {tiers.filter(t => t.enabled).map((tier) => {
              const tierPay = calculateTierAnnualPay(tier, context);
              return (
                <div key={tier.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="font-medium text-gray-900 dark:text-white mb-2">
                    Tier {tier.name} - {tier.coverageType}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 space-y-1">
                    <div>Payment Method: {tier.paymentMethod}</div>
                    <div>Annual Pay from this Tier: ${tierPay.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Peer Comparison (Anonymized) */}
        {peerComparison && (
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Peer Comparison
            </h3>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Average Call Pay (Specialty):</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                  ${peerComparison.averageCallPay.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Your Percentile:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                  {peerComparison.percentile}th percentile
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                * Peer comparison data is anonymized and based on specialty averages
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function generateTransparencyReport(data: {
  providerName: string;
  context: CallPayContext;
  tiers: CallTier[];
  impact: CallPayImpact;
  providerCallPay: number;
  peerComparison?: { averageCallPay: number; percentile: number };
}): string {
  return `
CALL PAY TRANSPARENCY REPORT
Generated: ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}

Provider: ${data.providerName}
Specialty: ${data.context.specialty}
Service Line: ${data.context.serviceLine}

═══════════════════════════════════════════════════════════════════════════════════
YOUR CALL PAY CALCULATION
═══════════════════════════════════════════════════════════════════════════════════

Expected Annual Call Pay: $${data.providerCallPay.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}

Expected Monthly Call Pay: $${(data.providerCallPay / 12).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}

═══════════════════════════════════════════════════════════════════════════════════
ROTATION RATIO EXPLANATION
═══════════════════════════════════════════════════════════════════════════════════

Rotation Ratio: 1-in-${data.context.rotationRatio}
Total Providers on Call: ${data.context.providersOnCall}

With a 1-in-${data.context.rotationRatio} rotation, you cover approximately ${((1 / data.context.rotationRatio) * 100).toFixed(1)}% of the total call coverage needs.

The total annual call budget is divided among all providers based on the rotation schedule.

═══════════════════════════════════════════════════════════════════════════════════
CALCULATION METHODOLOGY
═══════════════════════════════════════════════════════════════════════════════════

${data.tiers.filter(t => t.enabled).map(tier => {
    const tierPay = calculateTierAnnualPay(tier, data.context);
    return `
Tier ${tier.name} - ${tier.coverageType}
  Payment Method: ${tier.paymentMethod}
  Annual Pay from this Tier: $${tierPay.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
`;
  }).join('')}

═══════════════════════════════════════════════════════════════════════════════════
${data.peerComparison ? 'PEER COMPARISON' : ''}
${data.peerComparison ? '═══════════════════════════════════════════════════════════════════════════════════' : ''}
${data.peerComparison ? `
Average Call Pay (Specialty): $${data.peerComparison.averageCallPay.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}

Your Percentile: ${data.peerComparison.percentile}th percentile

* Peer comparison data is anonymized and based on specialty averages
` : ''}

═══════════════════════════════════════════════════════════════════════════════════
Generated by CompLens™ Provider Compensation Intelligence
═══════════════════════════════════════════════════════════════════════════════════
  `.trim();
}



