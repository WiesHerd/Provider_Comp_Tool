'use client';

import { NumberInputWithButtons } from '@/components/ui/number-input-with-buttons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plane, CalendarCheck, BookOpen, Plus, Minus, Trash2 } from 'lucide-react';
import { ShiftType, WRVUForecasterInputs } from '@/types/wrvu-forecaster';

interface WorkSchedulePanelProps {
  inputs: WRVUForecasterInputs;
  onInputChange: (field: keyof WRVUForecasterInputs, value: number) => void;
  onShiftChange: (index: number | null, field: keyof ShiftType | 'add', value: string | number) => void;
  onDeleteShift: (index: number) => void;
}

export function WorkSchedulePanel({
  inputs,
  onInputChange,
  onShiftChange,
  onDeleteShift,
}: WorkSchedulePanelProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Work Schedule</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <NumberInputWithButtons
          label="Vacation Weeks"
          value={inputs.vacationWeeks}
          onChange={(value) => onInputChange('vacationWeeks', value)}
          icon={<Plane className="w-5 h-5" />}
          min={0}
          max={52}
          step={1}
          integerOnly
        />

        <NumberInputWithButtons
          label="Statutory Holidays"
          value={inputs.statutoryHolidays}
          onChange={(value) => onInputChange('statutoryHolidays', value)}
          icon={<CalendarCheck className="w-5 h-5" />}
          min={0}
          max={365}
          step={1}
          integerOnly
        />

        <NumberInputWithButtons
          label="CME Days"
          value={inputs.cmeDays}
          onChange={(value) => onInputChange('cmeDays', value)}
          icon={<BookOpen className="w-5 h-5" />}
          min={0}
          max={365}
          step={1}
          integerOnly
        />
      </div>

      <div className="pt-4 border-t-2 border-gray-200 dark:border-gray-800">
        <Label className="text-sm font-semibold mb-3 block">Shift Types</Label>
        
        {/* Headers - shown on all screens */}
        <div className="grid grid-cols-[180px_80px_80px_44px] sm:grid-cols-[1fr_100px_120px_44px] gap-2 mb-2">
          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Shift Name</Label>
          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Hours</Label>
          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Per Week</Label>
          <div></div> {/* Spacer for delete button */}
        </div>
        
        <div className="space-y-2 sm:space-y-3">
          {inputs.shifts.map((shift, index) => (
            <div key={shift.id} className="grid grid-cols-[180px_80px_80px_44px] sm:grid-cols-[1fr_100px_120px_44px] gap-2 items-center p-2 sm:p-0 rounded-lg border border-gray-200 dark:border-gray-700 sm:border-0 bg-gray-50 dark:bg-gray-800/50 sm:bg-transparent">
              {/* Shift Name */}
              <Input
                value={shift.name}
                onChange={(e) => onShiftChange(index, 'name', e.target.value)}
                placeholder="Shift name"
                className="w-full text-sm sm:text-base truncate"
              />
              
              {/* Hours */}
              <div className="relative flex items-center">
                <Input
                  type="number"
                  value={shift.hours}
                  onChange={(e) => onShiftChange(index, 'hours', Number(e.target.value) || 0)}
                  placeholder="Hours"
                  className="w-full text-sm sm:text-base pr-14 sm:pr-12"
                  min={0}
                />
                <div className="absolute right-1 flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onShiftChange(index, 'hours', Math.max(0, shift.hours + 1))}
                    className="h-6 w-6 sm:h-5 sm:w-5 p-0 hover:bg-primary hover:text-white rounded active:scale-95 transition-transform touch-manipulation min-w-[24px] min-h-[24px] sm:min-w-[20px] sm:min-h-[20px] flex items-center justify-center"
                    aria-label="Increase hours"
                  >
                    <Plus className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onShiftChange(index, 'hours', Math.max(0, shift.hours - 1))}
                    className="h-6 w-6 sm:h-5 sm:w-5 p-0 hover:bg-primary hover:text-white rounded active:scale-95 transition-transform touch-manipulation min-w-[24px] min-h-[24px] sm:min-w-[20px] sm:min-h-[20px] flex items-center justify-center"
                    disabled={shift.hours <= 0}
                    aria-label="Decrease hours"
                  >
                    <Minus className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                  </Button>
                </div>
              </div>
              
              {/* Per Week */}
              <div className="relative flex items-center">
                <Input
                  type="number"
                  value={shift.perWeek}
                  onChange={(e) => onShiftChange(index, 'perWeek', Number(e.target.value) || 0)}
                  placeholder="Per week"
                  className="w-full text-sm sm:text-base pr-14 sm:pr-12"
                  min={0}
                />
                <div className="absolute right-1 flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onShiftChange(index, 'perWeek', Math.max(0, shift.perWeek + 1))}
                    className="h-6 w-6 sm:h-5 sm:w-5 p-0 hover:bg-primary hover:text-white rounded active:scale-95 transition-transform touch-manipulation min-w-[24px] min-h-[24px] sm:min-w-[20px] sm:min-h-[20px] flex items-center justify-center"
                    aria-label="Increase per week"
                  >
                    <Plus className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onShiftChange(index, 'perWeek', Math.max(0, shift.perWeek - 1))}
                    className="h-6 w-6 sm:h-5 sm:w-5 p-0 hover:bg-primary hover:text-white rounded active:scale-95 transition-transform touch-manipulation min-w-[24px] min-h-[24px] sm:min-w-[20px] sm:min-h-[20px] flex items-center justify-center"
                    disabled={shift.perWeek <= 0}
                    aria-label="Decrease per week"
                  >
                    <Minus className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                  </Button>
                </div>
              </div>
              
              {/* Delete Button */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteShift(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 min-w-[44px] min-h-[44px] touch-target"
                  aria-label="Delete shift"
                >
                  <Trash2 className="w-6 h-6 sm:w-4 sm:h-4" />
                </Button>
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
    </div>
  );
}

