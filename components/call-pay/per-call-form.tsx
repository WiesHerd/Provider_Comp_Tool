'use client';

import { PerCallInputs, calculatePerCallStipend } from '@/lib/utils/call-pay';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';

interface PerCallFormProps {
  onResultsChange: (results: ReturnType<typeof calculatePerCallStipend>) => void;
}

export function PerCallForm({ onResultsChange }: PerCallFormProps) {
  const [inputs, setInputs] = useState<PerCallInputs>({
    weekdayCallsPerMonth: 0,
    weekendCallsPerMonth: 0,
    weekdayStipend: 0,
    weekendStipend: 0,
  });

  const results = calculatePerCallStipend(inputs);

  // Update parent when inputs change
  useEffect(() => {
    onResultsChange(results);
  }, [results, onResultsChange]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 flex flex-col">
          <Label className="min-h-[2.5rem] flex items-start pt-1">Weekday Calls per Month</Label>
          <NumberInput
            value={inputs.weekdayCallsPerMonth}
            onChange={(value) => setInputs({ ...inputs, weekdayCallsPerMonth: value })}
            min={0}
          />
        </div>
        <div className="space-y-2 flex flex-col">
          <Label className="min-h-[2.5rem] flex items-start pt-1">Weekend/Holiday Calls per Month</Label>
          <NumberInput
            value={inputs.weekendCallsPerMonth}
            onChange={(value) => setInputs({ ...inputs, weekendCallsPerMonth: value })}
            min={0}
          />
        </div>
        <div className="space-y-2 flex flex-col">
          <Label className="min-h-[2.5rem] flex items-start pt-1">Stipend per Weekday Call ($)</Label>
          <NumberInput
            value={inputs.weekdayStipend}
            onChange={(value) => setInputs({ ...inputs, weekdayStipend: value })}
            min={0}
          />
        </div>
        <div className="space-y-2 flex flex-col">
          <Label className="min-h-[2.5rem] flex items-start pt-1">Stipend per Weekend Call ($)</Label>
          <NumberInput
            value={inputs.weekendStipend}
            onChange={(value) => setInputs({ ...inputs, weekendStipend: value })}
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
            <span className="text-gray-600 dark:text-gray-400">Effective Per-Call Rate</span>
            <span className="font-bold text-lg">
              ${results.effectiveRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

