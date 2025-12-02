'use client';

import * as React from 'react';
import { NumberInputWithButtons } from '@/components/ui/number-input-with-buttons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Clock, CalendarDays } from 'lucide-react';
import { ShiftType, daysOfWeekToPerWeek } from '@/types/wrvu-forecaster';
import { DaySelector } from './day-selector';

interface ShiftBuilderProps {
  shifts: ShiftType[];
  onShiftChange: (index: number | null, field: keyof ShiftType | 'add' | 'daysOfWeek', value: string | number | number[]) => void;
  onDeleteShift: (index: number) => void;
}

export function ShiftBuilder({
  shifts,
  onShiftChange,
  onDeleteShift,
}: ShiftBuilderProps) {
  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold mb-3 block">Shift Types</Label>
      
      <div className="space-y-3 sm:space-y-4">
        {shifts.map((shift, index) => (
          <div key={shift.id} className="p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-3">
            {/* Shift Name Row */}
            <div className="flex items-center gap-2">
              <Input
                value={shift.name}
                onChange={(e) => onShiftChange(index, 'name', e.target.value)}
                placeholder="Shift name"
                className="flex-1 text-sm sm:text-base"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDeleteShift(index)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 min-w-[44px] min-h-[44px] touch-target flex-shrink-0"
                aria-label="Delete shift"
              >
                <Trash2 className="w-6 h-6 sm:w-4 sm:h-4" />
              </Button>
            </div>
            
            {/* Hours and Per Week Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <NumberInputWithButtons
                label="Hours per Shift"
                value={shift.hours}
                onChange={(value) => onShiftChange(index, 'hours', value)}
                icon={<Clock className="w-5 h-5" />}
                min={0}
                max={24}
                step={1}
                integerOnly
              />
              <div>
                <NumberInputWithButtons
                  label="Shifts per Week"
                  value={shift.daysOfWeek ? daysOfWeekToPerWeek(shift.daysOfWeek) : shift.perWeek}
                  onChange={(value) => {
                    // When user manually changes perWeek, clear daysOfWeek to use legacy mode
                    onShiftChange(index, 'perWeek', value);
                    if (shift.daysOfWeek) {
                      onShiftChange(index, 'daysOfWeek', [] as number[]);
                    }
                  }}
                  icon={<CalendarDays className="w-5 h-5" />}
                  min={0}
                  max={168}
                  step={1}
                  integerOnly
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">
                  {shift.daysOfWeek && shift.daysOfWeek.length > 0
                    ? 'Auto-calculated from selected days'
                    : 'Or select specific days below'}
                </p>
              </div>
            </div>
            
            {/* Day Selector - Calendar Style */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <DaySelector
                daysOfWeek={shift.daysOfWeek}
                onDaysChange={(days) => {
                  // Update daysOfWeek
                  onShiftChange(index, 'daysOfWeek', days);
                  // Auto-update perWeek based on selected days
                  const newPerWeek = daysOfWeekToPerWeek(days);
                  if (newPerWeek > 0) {
                    onShiftChange(index, 'perWeek', newPerWeek);
                  }
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => onShiftChange(null, 'add', '')}
        className="mt-3 w-full sm:w-auto min-h-[44px] touch-target"
      >
        <Plus className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">Add Shift Type</span>
        <span className="sm:hidden">Add Shift</span>
      </Button>
    </div>
  );
}







