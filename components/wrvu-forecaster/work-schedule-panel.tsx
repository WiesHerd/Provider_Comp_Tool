'use client';

import { NumberInputWithButtons } from '@/components/ui/number-input-with-buttons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plane, CalendarCheck, BookOpen, Plus, Trash2 } from 'lucide-react';
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
        
        {/* Headers - hidden on mobile, shown on larger screens */}
        <div className="hidden sm:grid sm:grid-cols-[1fr_100px_120px_44px] gap-2 mb-2">
          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Shift Name</Label>
          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Hours</Label>
          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Per Week</Label>
          <div></div> {/* Spacer for delete button */}
        </div>
        
        <div className="space-y-3 sm:space-y-3">
          {inputs.shifts.map((shift, index) => (
            <div key={shift.id} className="flex flex-col sm:grid sm:grid-cols-[1fr_100px_120px_44px] gap-3 sm:gap-2 sm:items-center p-3 sm:p-0 rounded-lg border border-gray-200 dark:border-gray-700 sm:border-0 bg-gray-50 dark:bg-gray-800/50 sm:bg-transparent">
              {/* Shift Name */}
              <div className="flex flex-col sm:block">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:hidden">Shift Name</Label>
                <Input
                  value={shift.name}
                  onChange={(e) => onShiftChange(index, 'name', e.target.value)}
                  placeholder="Shift name"
                  className="w-full text-sm sm:text-base"
                />
              </div>
              
              {/* Hours */}
              <div className="flex flex-col sm:block">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:hidden">Hours per Shift</Label>
                <Input
                  type="number"
                  value={shift.hours}
                  onChange={(e) => onShiftChange(index, 'hours', Number(e.target.value) || 0)}
                  placeholder="Hours"
                  className="w-full text-sm sm:text-base"
                  min={0}
                />
              </div>
              
              {/* Per Week */}
              <div className="flex flex-col sm:block">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:hidden">Shifts per Week</Label>
                <Input
                  type="number"
                  value={shift.perWeek}
                  onChange={(e) => onShiftChange(index, 'perWeek', Number(e.target.value) || 0)}
                  placeholder="Per week"
                  className="w-full text-sm sm:text-base"
                  min={0}
                />
              </div>
              
              {/* Delete Button */}
              <div className="flex justify-end sm:justify-center pt-1 sm:pt-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteShift(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 min-w-[44px] min-h-[44px] touch-target"
                  aria-label="Delete shift"
                >
                  <Trash2 className="w-4 h-4" />
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

