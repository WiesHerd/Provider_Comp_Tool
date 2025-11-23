'use client';

import { PerShiftInputs, calculatePerShiftPay } from '@/lib/utils/call-pay';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';

interface PerShiftFormProps {
  onResultsChange: (results: ReturnType<typeof calculatePerShiftPay>) => void;
}

export function PerShiftForm({ onResultsChange }: PerShiftFormProps) {
  const [inputs, setInputs] = useState<PerShiftInputs>({
    weekdayShiftsPerMonth: 0,
    weekendShiftsPerMonth: 0,
    weekdayRate: 0,
    weekendRate: 0,
  });

  const results = calculatePerShiftPay(inputs);

  useEffect(() => {
    onResultsChange(results);
  }, [results, onResultsChange]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 flex flex-col">
          <Label className="min-h-[2.5rem] flex items-start pt-1">Weekday Shifts per Month</Label>
          <NumberInput
            value={inputs.weekdayShiftsPerMonth}
            onChange={(value) => setInputs({ ...inputs, weekdayShiftsPerMonth: value })}
            min={0}
          />
        </div>
        <div className="space-y-2 flex flex-col">
          <Label className="min-h-[2.5rem] flex items-start pt-1">Weekend/Holiday Shifts per Month</Label>
          <NumberInput
            value={inputs.weekendShiftsPerMonth}
            onChange={(value) => setInputs({ ...inputs, weekendShiftsPerMonth: value })}
            min={0}
          />
        </div>
        <div className="space-y-2 flex flex-col">
          <Label className="min-h-[2.5rem] flex items-start pt-1">Rate per Weekday Shift ($)</Label>
          <NumberInput
            value={inputs.weekdayRate}
            onChange={(value) => setInputs({ ...inputs, weekdayRate: value })}
            min={0}
          />
        </div>
        <div className="space-y-2 flex flex-col">
          <Label className="min-h-[2.5rem] flex items-start pt-1">Rate per Weekend Shift ($)</Label>
          <NumberInput
            value={inputs.weekendRate}
            onChange={(value) => setInputs({ ...inputs, weekendRate: value })}
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
            <span className="text-gray-600 dark:text-gray-400">Effective Per-Shift Rate</span>
            <span className="font-bold text-lg">
              ${results.effectiveRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

