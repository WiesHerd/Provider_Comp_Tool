'use client';

import { TieredCallPayInputs, calculateTieredCallPay } from '@/lib/utils/call-pay';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';

interface TieredFormProps {
  onResultsChange: (results: ReturnType<typeof calculateTieredCallPay>) => void;
}

export function TieredForm({ onResultsChange }: TieredFormProps) {
  const [inputs, setInputs] = useState<TieredCallPayInputs>({
    threshold: 0,
    rateBelowThreshold: 0,
    rateAboveThreshold: 0,
    actualCallsOrShifts: 0,
  });

  const results = calculateTieredCallPay(inputs);

  useEffect(() => {
    onResultsChange(results);
  }, [results, onResultsChange]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Threshold (calls/shifts per month)</Label>
          <NumberInput
            value={inputs.threshold}
            onChange={(value) => setInputs({ ...inputs, threshold: value })}
            min={0}
          />
        </div>
        <div className="space-y-2">
          <Label>Actual Calls/Shifts per Month</Label>
          <NumberInput
            value={inputs.actualCallsOrShifts}
            onChange={(value) => setInputs({ ...inputs, actualCallsOrShifts: value })}
            min={0}
          />
        </div>
        <div className="space-y-2">
          <Label>Rate Below Threshold ($)</Label>
          <NumberInput
            value={inputs.rateBelowThreshold}
            onChange={(value) => setInputs({ ...inputs, rateBelowThreshold: value })}
            min={0}
          />
        </div>
        <div className="space-y-2">
          <Label>Rate Above Threshold ($)</Label>
          <NumberInput
            value={inputs.rateAboveThreshold}
            onChange={(value) => setInputs({ ...inputs, rateAboveThreshold: value })}
            min={0}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Monthly Call Pay</span>
            <span className="font-bold text-lg">
              ${results.monthlyPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Annual Call Pay</span>
            <span className="font-bold text-lg text-primary">
              ${results.annualPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Blended Average Rate</span>
            <span className="font-bold text-lg">
              ${results.effectiveRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

