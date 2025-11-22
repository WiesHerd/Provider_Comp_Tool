'use client';

import { useState, useEffect } from 'react';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface WRVUInputProps {
  annualWrvus?: number;
  monthlyWrvus?: number;
  monthlyBreakdown?: number[];
  onAnnualChange: (value: number) => void;
  onMonthlyChange: (value: number) => void;
  onMonthlyBreakdownChange?: (values: number[]) => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function WRVUInput({
  annualWrvus = 0,
  monthlyWrvus = 0,
  monthlyBreakdown = Array(12).fill(0),
  onAnnualChange,
  onMonthlyChange,
  onMonthlyBreakdownChange,
}: WRVUInputProps) {
  const [mode, setMode] = useState<'annual' | 'monthly' | 'breakdown'>('annual');

  const handleAnnualChange = (value: number) => {
    onAnnualChange(value);
    if (mode === 'annual') {
      onMonthlyChange(value / 12);
      if (onMonthlyBreakdownChange) {
        onMonthlyBreakdownChange(Array(12).fill(value / 12));
      }
    }
  };

  const handleMonthlyChange = (value: number) => {
    onMonthlyChange(value);
    if (mode === 'monthly') {
      onAnnualChange(value * 12);
      if (onMonthlyBreakdownChange) {
        onMonthlyBreakdownChange(Array(12).fill(value));
      }
    }
  };

  const handleMonthlyBreakdownChange = (monthIndex: number, value: number) => {
    if (!onMonthlyBreakdownChange) return;
    
    const newBreakdown = [...(monthlyBreakdown || Array(12).fill(0))];
    newBreakdown[monthIndex] = value;
    onMonthlyBreakdownChange(newBreakdown);
    
    // Calculate annual total from breakdown
    const annualTotal = newBreakdown.reduce((sum, val) => sum + val, 0);
    onAnnualChange(annualTotal);
    onMonthlyChange(annualTotal / 12);
  };

  // Sync breakdown when switching modes
  useEffect(() => {
    if (mode === 'breakdown' && monthlyBreakdown && monthlyBreakdown.length === 12) {
      const annualTotal = monthlyBreakdown.reduce((sum, val) => sum + val, 0);
      if (annualTotal !== annualWrvus) {
        onAnnualChange(annualTotal);
      }
    }
  }, [mode, monthlyBreakdown]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Label className="text-base font-semibold">Projected wRVUs</Label>
        <div className="flex gap-2">
          <Button
            variant={mode === 'annual' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('annual')}
          >
            Annual
          </Button>
          <Button
            variant={mode === 'monthly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('monthly')}
          >
            Monthly Avg
          </Button>
          <Button
            variant={mode === 'breakdown' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('breakdown')}
          >
            By Month
          </Button>
        </div>
      </div>
      
      {mode === 'annual' ? (
        <NumberInput
          value={annualWrvus}
          onChange={handleAnnualChange}
          placeholder="Enter annual wRVUs"
          min={0}
        />
      ) : mode === 'monthly' ? (
        <NumberInput
          value={monthlyWrvus}
          onChange={handleMonthlyChange}
          placeholder="Enter monthly average wRVUs"
          min={0}
        />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MONTH_NAMES.map((month, index) => (
              <div key={month} className="space-y-1">
                <Label className="text-xs text-gray-600 dark:text-gray-400">
                  {month.substring(0, 3)}
                </Label>
                <NumberInput
                  value={monthlyBreakdown?.[index] || 0}
                  onChange={(value) => handleMonthlyBreakdownChange(index, value)}
                  placeholder="0"
                  min={0}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-semibold">Annual Total</Label>
              <span className="text-lg font-bold">
                {(monthlyBreakdown || Array(12).fill(0)).reduce((sum, val) => sum + val, 0).toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

