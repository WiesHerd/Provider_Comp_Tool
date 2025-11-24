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
  fteInput?: React.ReactNode;
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
  fteInput,
}: WRVUInputProps) {
  const [mode, setMode] = useState<'annual' | 'monthly' | 'breakdown'>('annual');

  const handleAnnualChange = (value: number) => {
    // Round to 2 decimal places
    const roundedValue = Math.round(value * 100) / 100;
    onAnnualChange(roundedValue);
    if (mode === 'annual') {
      const monthlyValue = Math.round((roundedValue / 12) * 100) / 100;
      onMonthlyChange(monthlyValue);
      if (onMonthlyBreakdownChange) {
        onMonthlyBreakdownChange(Array(12).fill(monthlyValue));
      }
    }
  };

  const handleMonthlyChange = (value: number) => {
    // Round to 2 decimal places
    const roundedValue = Math.round(value * 100) / 100;
    onMonthlyChange(roundedValue);
    if (mode === 'monthly') {
      const annualValue = Math.round((roundedValue * 12) * 100) / 100;
      onAnnualChange(annualValue);
      if (onMonthlyBreakdownChange) {
        onMonthlyBreakdownChange(Array(12).fill(roundedValue));
      }
    }
  };

  const handleMonthlyBreakdownChange = (monthIndex: number, value: number) => {
    if (!onMonthlyBreakdownChange) return;
    
    const newBreakdown = [...(monthlyBreakdown || Array(12).fill(0))];
    // Round to 2 decimal places
    newBreakdown[monthIndex] = Math.round(value * 100) / 100;
    onMonthlyBreakdownChange(newBreakdown);
    
    // Calculate annual total from breakdown (rounded to 2 decimal places)
    const annualTotal = Math.round(newBreakdown.reduce((sum, val) => sum + val, 0) * 100) / 100;
    onAnnualChange(annualTotal);
    onMonthlyChange(Math.round((annualTotal / 12) * 100) / 100);
  };

  const handleAnnualize = () => {
    if (!onMonthlyBreakdownChange) return;
    
    const breakdown = [...(monthlyBreakdown || Array(12).fill(0))];
    
    // Find the last month with data (non-zero value)
    let lastMonthIndex = -1;
    for (let i = breakdown.length - 1; i >= 0; i--) {
      if (breakdown[i] > 0) {
        lastMonthIndex = i;
        break;
      }
    }
    
    // If no data found, do nothing
    if (lastMonthIndex === -1) return;
    
    // Calculate average from months 0 to lastMonthIndex (inclusive)
    const monthsWithData = breakdown.slice(0, lastMonthIndex + 1);
    const sum = monthsWithData.reduce((acc, val) => acc + val, 0);
    const average = Math.round((sum / (lastMonthIndex + 1)) * 100) / 100; // Round to 2 decimal places
    
    // Fill remaining months (after lastMonthIndex) with the average
    const annualizedBreakdown = [...breakdown];
    for (let i = lastMonthIndex + 1; i < 12; i++) {
      annualizedBreakdown[i] = average;
    }
    
    // Update the breakdown
    onMonthlyBreakdownChange(annualizedBreakdown);
    
    // Recalculate annual total (rounded to 2 decimal places)
    const annualTotal = Math.round(annualizedBreakdown.reduce((sum, val) => sum + val, 0) * 100) / 100;
    onAnnualChange(annualTotal);
    onMonthlyChange(Math.round((annualTotal / 12) * 100) / 100);
  };

  // Check if annualize button should be enabled (only if there's partial data)
  const canAnnualize = () => {
    if (mode !== 'breakdown') return false;
    const breakdown = monthlyBreakdown || Array(12).fill(0);
    
    // Find first and last month with data
    let firstDataIndex = -1;
    let lastDataIndex = -1;
    
    for (let i = 0; i < breakdown.length; i++) {
      if (breakdown[i] > 0) {
        if (firstDataIndex === -1) firstDataIndex = i;
        lastDataIndex = i;
      }
    }
    
    // Enable if we have data but not all 12 months are filled
    return firstDataIndex !== -1 && lastDataIndex < 11;
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
      <div>
        <Label className="text-base font-semibold text-gray-900 dark:text-white mb-4 block">Productivity</Label>
      </div>
      
      {mode === 'annual' ? (
        <div className="flex items-start gap-4">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-3 whitespace-nowrap">Projected wRVUs</Label>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-end gap-2">
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
            <div className="flex items-end gap-3">
              {fteInput && <div className="flex-shrink-0">{fteInput}</div>}
              <div className="flex-1">
                <NumberInput
                  value={annualWrvus}
                  onChange={handleAnnualChange}
                  placeholder="Enter annual wRVUs"
                  min={0}
                  step={0.01}
                />
              </div>
            </div>
          </div>
        </div>
      ) : mode === 'monthly' ? (
        <div className="flex items-start gap-4">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-3 whitespace-nowrap">Projected wRVUs</Label>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-end gap-2">
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
            <NumberInput
              value={monthlyWrvus}
              onChange={handleMonthlyChange}
              placeholder="Enter monthly average wRVUs"
              min={0}
              step={0.01}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Projected wRVUs</Label>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MONTH_NAMES.map((month, index) => (
              <div key={month} className="space-y-1">
                <Label className="text-xs text-gray-600 dark:text-gray-400">
                  {month.substring(0, 3)}
                </Label>
                <NumberInput
                  value={monthlyBreakdown?.[index] || 0}
                  onChange={(value) => handleMonthlyBreakdownChange(index, value)}
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-semibold">Annual Total</Label>
              <span className="text-lg font-bold">
                {(monthlyBreakdown || Array(12).fill(0)).reduce((sum, val) => sum + val, 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              {canAnnualize() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnnualize}
                  className="text-xs"
                >
                  Annualize from Entered Months
                </Button>
              )}
              {(monthlyBreakdown || Array(12).fill(0)).some(val => val > 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (onMonthlyBreakdownChange) {
                      onMonthlyBreakdownChange(Array(12).fill(0));
                    }
                  }}
                  className="text-xs"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

