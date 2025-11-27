'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CallPayContext, CallTier, CallPayImpact } from '@/types/call-pay';
import { ProviderCallPayData, CallSchedule } from '@/types/provider-call-pay';
import { calculateTierAnnualPay } from '@/lib/utils/call-pay-coverage';
import { Calendar, DollarSign, Users } from 'lucide-react';

interface ProviderViewProps {
  providerId: string;
  providerName: string;
  context: CallPayContext;
  tiers: CallTier[];
  impact: CallPayImpact;
}

export function ProviderView({
  providerId,
  providerName,
  context,
  tiers,
  impact,
}: ProviderViewProps) {
  // Calculate provider-specific call pay
  const providerCallPay = useMemo(() => {
    const assignedTiers = tiers.filter(t => t.enabled);
    let totalAnnualPay = 0;

    for (const tier of assignedTiers) {
      const tierAnnualPay = calculateTierAnnualPay(tier, context);
      totalAnnualPay += tierAnnualPay;
    }

    return {
      annual: totalAnnualPay,
      monthly: totalAnnualPay / 12,
      perCall: totalAnnualPay / (context.providersOnCall > 0 ? context.providersOnCall : 1),
    };
  }, [tiers, context]);

  // Generate call schedule visualization
  const callSchedule = useMemo(() => {
    const enabledTiers = tiers.filter(t => t.enabled);
    if (enabledTiers.length === 0) return null;

    // Use the first enabled tier's burden as reference
    const referenceTier = enabledTiers[0];
    const totalCallsPerMonth = referenceTier.burden.weekdayCallsPerMonth + referenceTier.burden.weekendCallsPerMonth;
    const callsPerProviderPerMonth = totalCallsPerMonth / context.rotationRatio;

    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 12; i++) {
      const weekdayCalls = Math.round((referenceTier.burden.weekdayCallsPerMonth / context.rotationRatio) * (i % 2 === 0 ? 1 : 0.9));
      const weekendCalls = Math.round((referenceTier.burden.weekendCallsPerMonth / context.rotationRatio) * (i % 2 === 0 ? 1 : 1.1));
      const holidayCalls = i === 10 || i === 11 || i === 0 ? 1 : 0; // Nov, Dec, Jan have holidays

      months.push({
        month: i + 1,
        monthName: monthNames[i],
        weekdayCalls,
        weekendCalls,
        holidayCalls,
        totalCalls: weekdayCalls + weekendCalls + holidayCalls,
        expectedPay: providerCallPay.monthly,
      });
    }

    return months;
  }, [tiers, context, providerCallPay]);

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Provider Call Pay Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <Label className="text-sm text-gray-600 dark:text-gray-400">
                  Expected Annual Call Pay
                </Label>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                ${providerCallPay.annual.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>

            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <Label className="text-sm text-gray-600 dark:text-gray-400">
                  Expected Monthly Call Pay
                </Label>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                ${providerCallPay.monthly.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>

            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-primary" />
                <Label className="text-sm text-gray-600 dark:text-gray-400">
                  Rotation Ratio
                </Label>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                1-in-{context.rotationRatio}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div>
                <strong>Provider:</strong> {providerName}
              </div>
              <div>
                <strong>Specialty:</strong> {context.specialty}
              </div>
              <div>
                <strong>Service Line:</strong> {context.serviceLine}
              </div>
              <div>
                <strong>Total Providers on Call:</strong> {context.providersOnCall}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {callSchedule && (
        <Card className="border-2">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Expected Call Schedule
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {callSchedule.map((month) => (
                <div
                  key={month.month}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="font-semibold text-sm text-gray-900 dark:text-white mb-2">
                    {month.monthName}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div>Total Calls: {month.totalCalls}</div>
                    <div>Weekday: {month.weekdayCalls}</div>
                    <div>Weekend: {month.weekendCalls}</div>
                    {month.holidayCalls > 0 && (
                      <div>Holiday: {month.holidayCalls}</div>
                    )}
                    <div className="pt-1 border-t border-gray-200 dark:border-gray-700 mt-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        ${month.expectedPay.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



