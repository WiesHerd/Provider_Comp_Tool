'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShiftType, daysOfWeekToPerWeek } from '@/types/wrvu-forecaster';
import { cn } from '@/lib/utils/cn';
import { Clock } from 'lucide-react';

interface WeeklyScheduleViewProps {
  shifts: ShiftType[];
  className?: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBREVS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function WeeklyScheduleView({ shifts, className }: WeeklyScheduleViewProps) {
  // Create a map of day index to shifts for that day
  const dayToShifts = React.useMemo(() => {
    const map: Record<number, ShiftType[]> = {};
    for (let day = 0; day < 7; day++) {
      map[day] = [];
    }
    
    shifts.forEach((shift) => {
      const days = shift.daysOfWeek || [];
      days.forEach((day) => {
        if (day >= 0 && day < 7) {
          map[day].push(shift);
        }
      });
    });
    
    return map;
  }, [shifts]);

  // Calculate total hours per day
  const getTotalHoursForDay = (day: number): number => {
    return dayToShifts[day].reduce((total, shift) => total + shift.hours, 0);
  };

  // Calculate total hours per week
  const totalHoursPerWeek = React.useMemo(() => {
    return shifts.reduce((total, shift) => {
      const daysPerWeek = shift.daysOfWeek ? daysOfWeekToPerWeek(shift.daysOfWeek) : shift.perWeek;
      return total + shift.hours * daysPerWeek;
    }, 0);
  }, [shifts]);

  // Color palette for different shifts
  const shiftColors = [
    'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300',
    'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300',
    'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300',
    'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300',
    'bg-pink-50 dark:bg-pink-900/20 border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-300',
  ];

  const getShiftColor = (index: number): string => {
    return shiftColors[index % shiftColors.length];
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            Weekly Schedule Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {/* Scrollable container for mobile */}
          <div className="w-full overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-3 min-w-[700px]">
              {DAY_ABBREVS.map((day, index) => (
                <div
                  key={index}
                  className="text-center text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 py-2"
                >
                  <span className="hidden sm:inline">{DAY_NAMES[index]}</span>
                  <span className="sm:hidden">{day}</span>
                </div>
              ))}
            </div>

            {/* Schedule grid */}
            <div className="grid grid-cols-7 gap-2 sm:gap-3 min-w-[700px]">
            {Array.from({ length: 7 }, (_, dayIndex) => {
              const dayShifts = dayToShifts[dayIndex];
              const totalHours = getTotalHoursForDay(dayIndex);
              const isWeekend = dayIndex === 0 || dayIndex === 6;

              return (
                <div
                  key={dayIndex}
                  className={cn(
                    'min-h-[100px] sm:min-h-[120px] rounded-xl border-2 p-2 sm:p-3',
                    'flex flex-col gap-2',
                    isWeekend
                      ? 'bg-gray-50/30 dark:bg-gray-800/20 border-gray-200 dark:border-gray-700'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                  )}
                >
                  {dayShifts.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-xs text-gray-400 dark:text-gray-500">No shifts</span>
                    </div>
                  ) : (
                    <>
                      {dayShifts.map((shift, shiftIndex) => (
                        <div
                          key={shift.id}
                          className={cn(
                            'rounded-lg border p-2 text-xs sm:text-sm',
                            getShiftColor(shifts.findIndex((s) => s.id === shift.id))
                          )}
                        >
                          <div className="font-semibold mb-1">{shift.name}</div>
                          <div className="flex items-center gap-1 text-xs">
                            <Clock className="w-3 h-3" />
                            <span>{shift.hours}h</span>
                          </div>
                        </div>
                      ))}
                      {totalHours > 0 && (
                        <div className="mt-auto pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            Total: {totalHours}h
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
            </div>
          </div>

          {/* Summary */}
          <div className="mt-4 pt-4 border-t-2 border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Total Hours per Week
                </span>
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-primary">
                {totalHoursPerWeek}h
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

