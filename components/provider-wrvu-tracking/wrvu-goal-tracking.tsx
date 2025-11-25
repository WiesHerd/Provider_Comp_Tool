'use client';

import * as React from 'react';
import { format, startOfMonth, endOfMonth, differenceInDays, isPast, isToday } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Target, TrendingUp, Users, Calendar, AlertCircle, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { MonthlyGoals } from '@/types/provider-wrvu-tracking';
import { DailyTrackingData } from '@/types/provider-wrvu-tracking';

interface WRVUGoalTrackingProps {
  currentDate: Date;
  goals?: MonthlyGoals;
  actualPatients: number;
  actualWRVUs: number;
  dailyData?: Record<string, DailyTrackingData>;
  onGoalsChange: (goals: MonthlyGoals) => void;
}

export function WRVUGoalTracking({
  currentDate,
  goals,
  actualPatients,
  actualWRVUs,
  dailyData = {},
  onGoalsChange,
}: WRVUGoalTrackingProps) {
  const [targetPatients, setTargetPatients] = React.useState(goals?.targetPatients?.toString() || '');
  const [targetWRVUs, setTargetWRVUs] = React.useState(goals?.targetWRVUs?.toString() || '');

  React.useEffect(() => {
    setTargetPatients(goals?.targetPatients?.toString() || '');
    setTargetWRVUs(goals?.targetWRVUs?.toString() || '');
  }, [goals]);

  const handleSave = () => {
    const newGoals: MonthlyGoals = {
      targetPatients: targetPatients && !isNaN(parseInt(targetPatients, 10)) 
        ? parseInt(targetPatients, 10) 
        : undefined,
      targetWRVUs: targetWRVUs && !isNaN(parseFloat(targetWRVUs)) 
        ? parseFloat(targetWRVUs) 
        : undefined,
    };
    onGoalsChange(newGoals);
  };

  const handleClear = () => {
    setTargetPatients('');
    setTargetWRVUs('');
    onGoalsChange({ targetPatients: undefined, targetWRVUs: undefined });
  };

  const monthName = format(currentDate, 'MMMM yyyy');
  
  // Calculate days elapsed and remaining
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const today = new Date();
  const daysElapsed = React.useMemo(() => {
    // Check if we're viewing the current month
    const isCurrentMonth = 
      currentDate.getFullYear() === today.getFullYear() &&
      currentDate.getMonth() === today.getMonth();
    
    if (!isCurrentMonth) {
      // Past or future month
      if (isPast(monthEnd) || isToday(monthEnd)) {
        // Past month - return total days
        return differenceInDays(monthEnd, monthStart) + 1;
      } else {
        // Future month
        return 0;
      }
    } else {
      // Current month - calculate days from start to today
      return differenceInDays(today, monthStart) + 1;
    }
  }, [currentDate, monthStart, monthEnd, today]);
  
  const totalDaysInMonth = differenceInDays(monthEnd, monthStart) + 1;
  const daysRemaining = Math.max(0, totalDaysInMonth - daysElapsed);
  
  // Calculate current pace (per day)
  const avgPatientsPerDay = daysElapsed > 0 ? actualPatients / daysElapsed : 0;
  const avgWRVUsPerDay = daysElapsed > 0 ? actualWRVUs / daysElapsed : 0;
  
  // Project month-end totals based on current pace
  const projectedPatients = daysElapsed > 0 ? avgPatientsPerDay * totalDaysInMonth : 0;
  const projectedWRVUs = daysElapsed > 0 ? avgWRVUsPerDay * totalDaysInMonth : 0;
  
  // Annualized projections (if current pace continues for 12 months)
  const annualizedPatients = avgPatientsPerDay * 365;
  const annualizedWRVUs = avgWRVUsPerDay * 365;
  
  // Progress vs goals
  const patientsProgress = goals?.targetPatients ? (actualPatients / goals.targetPatients) * 100 : 0;
  const wrvusProgress = goals?.targetWRVUs ? (actualWRVUs / goals.targetWRVUs) * 100 : 0;
  
  // Projected progress vs goals
  const projectedPatientsProgress = goals?.targetPatients && projectedPatients > 0 
    ? (projectedPatients / goals.targetPatients) * 100 
    : 0;
  const projectedWRVUsProgress = goals?.targetWRVUs && projectedWRVUs > 0 
    ? (projectedWRVUs / goals.targetWRVUs) * 100 
    : 0;

  // Calculate remaining needed
  const remainingPatients = goals?.targetPatients ? Math.max(0, goals.targetPatients - actualPatients) : 0;
  const remainingWRVUs = goals?.targetWRVUs ? Math.max(0, goals.targetWRVUs - actualWRVUs) : 0;
  
  // Calculate required daily average to reach goal
  const requiredPatientsPerDay = daysRemaining > 0 && remainingPatients > 0 
    ? remainingPatients / daysRemaining 
    : 0;
  const requiredWRVUsPerDay = daysRemaining > 0 && remainingWRVUs > 0 
    ? remainingWRVUs / daysRemaining 
    : 0;

  // Compare current pace vs required pace
  const patientsOnTrack = requiredPatientsPerDay === 0 || avgPatientsPerDay >= requiredPatientsPerDay * 0.95;
  const patientsSlightlyBehind = !patientsOnTrack && avgPatientsPerDay >= requiredPatientsPerDay * 0.8;
  const wrvusOnTrack = requiredWRVUsPerDay === 0 || avgWRVUsPerDay >= requiredWRVUsPerDay * 0.95;
  const wrvusSlightlyBehind = !wrvusOnTrack && avgWRVUsPerDay >= requiredWRVUsPerDay * 0.8;

  const formatNumber = (value: number, decimals: number = 0) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: decimals,
      minimumFractionDigits: value % 1 === 0 ? 0 : decimals,
    }).format(value);
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-bold text-primary">
              Monthly Goals & Progress - {monthName}
            </CardTitle>
          </div>
          {daysElapsed > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Day {daysElapsed} of {totalDaysInMonth}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Goal Inputs - Collapsible */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target-patients" className="text-sm font-semibold">
                Target Patients
              </Label>
              <Input
                id="target-patients"
                type="number"
                value={targetPatients}
                onChange={(e) => setTargetPatients(e.target.value)}
                placeholder="Enter target"
                min={0}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-wrvus" className="text-sm font-semibold">
                Target wRVUs
              </Label>
              <Input
                id="target-wrvus"
                type="number"
                value={targetWRVUs}
                onChange={(e) => setTargetWRVUs(e.target.value)}
                placeholder="Enter target"
                min={0}
                step={0.01}
              />
            </div>
          </div>

          {/* Save/Clear Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1" size="sm">
              Save Goals
            </Button>
            <Button variant="outline" onClick={handleClear} size="sm">
              Clear
            </Button>
          </div>
        </div>

        {/* Real-Time Progress & Projections */}
        {daysElapsed > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-6">
            {/* Current Pace */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Current Pace (Patients/Day)
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(avgPatientsPerDay, 1)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatNumber(actualPatients)} patients in {daysElapsed} day{daysElapsed !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Current Pace (wRVUs/Day)
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(avgWRVUsPerDay, 2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatNumber(actualWRVUs, 2)} wRVUs in {daysElapsed} day{daysElapsed !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Projected Month-End Totals */}
            {daysRemaining > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Projected Month-End Totals
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {formatNumber(projectedPatients)}
                      </span>
                      <span className="text-sm text-blue-700 dark:text-blue-300">patients</span>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {goals?.targetPatients && (
                        <span className={projectedPatients >= goals.targetPatients ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>
                          {projectedPatients >= goals.targetPatients ? '✓' : '⚠'} {formatNumber(projectedPatientsProgress, 1)}% of goal
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {formatNumber(projectedWRVUs, 2)}
                      </span>
                      <span className="text-sm text-blue-700 dark:text-blue-300">wRVUs</span>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {goals?.targetWRVUs && (
                        <span className={projectedWRVUs >= goals.targetWRVUs ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>
                          {projectedWRVUs >= goals.targetWRVUs ? '✓' : '⚠'} {formatNumber(projectedWRVUsProgress, 1)}% of goal
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                  Based on current pace continuing for remaining {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* Annualized Projections */}
            {daysElapsed >= 7 && (
              <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Annualized Projections
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">If current pace continues for 12 months:</p>
                    <p className="text-xl font-bold text-primary">
                      {formatNumber(annualizedPatients)} patients/year
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">If current pace continues for 12 months:</p>
                    <p className="text-xl font-bold text-primary">
                      {formatNumber(annualizedWRVUs, 2)} wRVUs/year
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Remaining Needed - Apple-style */}
            {daysRemaining > 0 && (goals?.targetPatients || goals?.targetWRVUs) && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  To Reach Your Goals
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {goals.targetPatients && remainingPatients > 0 && (
                    <div className={cn(
                      "bg-white dark:bg-gray-800 rounded-lg p-3 border",
                      patientsOnTrack ? "border-green-200 dark:border-green-800" :
                      patientsSlightlyBehind ? "border-amber-200 dark:border-amber-800" :
                      "border-red-200 dark:border-red-800"
                    )}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Patients Needed
                          </p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatNumber(remainingPatients)}
                          </p>
                        </div>
                        {patientsOnTrack ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        ) : patientsSlightlyBehind ? (
                          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        That's <span className={cn(
                          "font-semibold",
                          patientsOnTrack ? "text-green-600 dark:text-green-400" :
                          patientsSlightlyBehind ? "text-amber-600 dark:text-amber-400" :
                          "text-red-600 dark:text-red-400"
                        )}>
                          {formatNumber(requiredPatientsPerDay, 1)}/day
                        </span>
                      </p>
                      {daysElapsed > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          You're seeing {formatNumber(avgPatientsPerDay, 1)}/day
                        </p>
                      )}
                    </div>
                  )}
                  {goals.targetWRVUs && remainingWRVUs > 0 && (
                    <div className={cn(
                      "bg-white dark:bg-gray-800 rounded-lg p-3 border",
                      wrvusOnTrack ? "border-green-200 dark:border-green-800" :
                      wrvusSlightlyBehind ? "border-amber-200 dark:border-amber-800" :
                      "border-red-200 dark:border-red-800"
                    )}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            wRVUs Needed
                          </p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatNumber(remainingWRVUs, 2)}
                          </p>
                        </div>
                        {wrvusOnTrack ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        ) : wrvusSlightlyBehind ? (
                          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        That's <span className={cn(
                          "font-semibold",
                          wrvusOnTrack ? "text-green-600 dark:text-green-400" :
                          wrvusSlightlyBehind ? "text-amber-600 dark:text-amber-400" :
                          "text-red-600 dark:text-red-400"
                        )}>
                          {formatNumber(requiredWRVUsPerDay, 2)}/day
                        </span>
                      </p>
                      {daysElapsed > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          You're seeing {formatNumber(avgWRVUsPerDay, 2)}/day
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {(remainingPatients === 0 || remainingWRVUs === 0) && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <p className="text-xs font-medium text-green-900 dark:text-green-100">
                        {remainingPatients === 0 && remainingWRVUs === 0 
                          ? "You've reached all your goals! 🎉"
                          : remainingPatients === 0 
                          ? "Patient goal reached! Keep up the great work."
                          : "wRVU goal reached! Keep up the great work."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Progress vs Goals */}
            {(goals?.targetPatients || goals?.targetWRVUs) && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Progress vs Goals
                </h4>
                
                {goals.targetPatients && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="font-medium">Patients</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-600 dark:text-gray-400">
                          {formatNumber(actualPatients)} / {formatNumber(goals.targetPatients)}
                        </span>
                        <span className={cn(
                          "font-bold",
                          patientsProgress >= 100 ? "text-green-600 dark:text-green-400" : 
                          patientsProgress >= 75 ? "text-blue-600 dark:text-blue-400" :
                          patientsProgress >= 50 ? "text-amber-600 dark:text-amber-400" :
                          "text-red-600 dark:text-red-400"
                        )}>
                          {formatNumber(patientsProgress, 1)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative">
                      <div
                        className={cn(
                          "h-4 rounded-full transition-all duration-300",
                          patientsProgress >= 100 ? "bg-green-500" : 
                          patientsProgress >= 75 ? "bg-blue-500" :
                          patientsProgress >= 50 ? "bg-amber-500" :
                          "bg-red-500"
                        )}
                        style={{ width: `${Math.min(patientsProgress, 100)}%` }}
                      />
                      {projectedPatientsProgress > patientsProgress && daysRemaining > 0 && (
                        <div
                          className="absolute top-0 h-4 rounded-full bg-primary/30 border-r-2 border-primary"
                          style={{ width: `${Math.min(projectedPatientsProgress, 100)}%` }}
                        />
                      )}
                    </div>
                    {daysRemaining > 0 && projectedPatientsProgress > patientsProgress && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Projected: {formatNumber(projectedPatientsProgress, 1)}% if pace continues
                      </p>
                    )}
                  </div>
                )}

                {goals.targetWRVUs && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="font-medium">wRVUs</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-600 dark:text-gray-400">
                          {formatNumber(actualWRVUs, 2)} / {formatNumber(goals.targetWRVUs, 2)}
                        </span>
                        <span className={cn(
                          "font-bold",
                          wrvusProgress >= 100 ? "text-green-600 dark:text-green-400" : 
                          wrvusProgress >= 75 ? "text-blue-600 dark:text-blue-400" :
                          wrvusProgress >= 50 ? "text-amber-600 dark:text-amber-400" :
                          "text-red-600 dark:text-red-400"
                        )}>
                          {formatNumber(wrvusProgress, 1)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative">
                      <div
                        className={cn(
                          "h-4 rounded-full transition-all duration-300",
                          wrvusProgress >= 100 ? "bg-green-500" : 
                          wrvusProgress >= 75 ? "bg-blue-500" :
                          wrvusProgress >= 50 ? "bg-amber-500" :
                          "bg-red-500"
                        )}
                        style={{ width: `${Math.min(wrvusProgress, 100)}%` }}
                      />
                      {projectedWRVUsProgress > wrvusProgress && daysRemaining > 0 && (
                        <div
                          className="absolute top-0 h-4 rounded-full bg-primary/30 border-r-2 border-primary"
                          style={{ width: `${Math.min(projectedWRVUsProgress, 100)}%` }}
                        />
                      )}
                    </div>
                    {daysRemaining > 0 && projectedWRVUsProgress > wrvusProgress && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Projected: {formatNumber(projectedWRVUsProgress, 1)}% if pace continues
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* No Data Message */}
        {daysElapsed === 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <AlertCircle className="w-4 h-4" />
              <span>Enter data to see real-time progress and projections</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

