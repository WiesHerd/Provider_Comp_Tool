'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NumberInputWithButtons } from '@/components/ui/number-input-with-buttons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Gift, CalendarCheck, BookOpen, Plus, Trash2 } from 'lucide-react';
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
    <Card className="h-full">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg font-bold text-primary">Work Schedule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <NumberInputWithButtons
          label="Vacation Weeks per Year"
          value={inputs.vacationWeeks}
          onChange={(value) => onInputChange('vacationWeeks', value)}
          icon={<Gift className="w-5 h-5" />}
          min={0}
          max={52}
          step={1}
          integerOnly
        />

        <NumberInputWithButtons
          label="Statutory Holidays per Year"
          value={inputs.statutoryHolidays}
          onChange={(value) => onInputChange('statutoryHolidays', value)}
          icon={<CalendarCheck className="w-5 h-5" />}
          min={0}
          max={365}
          step={1}
          integerOnly
        />

        <NumberInputWithButtons
          label="CME Days per Year"
          value={inputs.cmeDays}
          onChange={(value) => onInputChange('cmeDays', value)}
          icon={<BookOpen className="w-5 h-5" />}
          min={0}
          max={365}
          step={1}
          integerOnly
        />

        <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
          <Label className="text-sm font-semibold mb-2 sm:mb-3 block">Shift Types</Label>
          <div className="space-y-2 sm:space-y-3">
            {inputs.shifts.map((shift, index) => (
              <div key={shift.id} className="flex items-center gap-2 flex-wrap">
                <Input
                  value={shift.name}
                  onChange={(e) => onShiftChange(index, 'name', e.target.value)}
                  placeholder="Shift Name"
                  className="flex-1 min-w-[120px] text-sm sm:text-base"
                />
                <Input
                  type="number"
                  value={shift.hours}
                  onChange={(e) => onShiftChange(index, 'hours', Number(e.target.value) || 0)}
                  placeholder="Hours"
                  className="w-16 sm:w-20 text-sm sm:text-base"
                  min={0}
                />
                <Input
                  type="number"
                  value={shift.perWeek}
                  onChange={(e) => onShiftChange(index, 'perWeek', Number(e.target.value) || 0)}
                  placeholder="Per Week"
                  className="w-20 sm:w-24 text-sm sm:text-base"
                  min={0}
                />
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
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => onShiftChange(null, 'add', '')}
            className="mt-2 sm:mt-3 w-full min-h-[44px] touch-target"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Shift Type
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

