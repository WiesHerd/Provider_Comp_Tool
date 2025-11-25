'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Target, TrendingUp, Users } from 'lucide-react';
import { MonthlyGoals } from '@/types/provider-wrvu-tracking';

interface WRVUGoalTrackingProps {
  currentDate: Date;
  goals?: MonthlyGoals;
  actualPatients: number;
  actualWRVUs: number;
  onGoalsChange: (goals: MonthlyGoals) => void;
}

export function WRVUGoalTracking({
  currentDate,
  goals,
  actualPatients,
  actualWRVUs,
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
      targetPatients: targetPatients ? parseInt(targetPatients, 10) : undefined,
      targetWRVUs: targetWRVUs ? parseFloat(targetWRVUs) : undefined,
    };
    onGoalsChange(newGoals);
  };

  const handleClear = () => {
    setTargetPatients('');
    setTargetWRVUs('');
    onGoalsChange({});
  };

  const monthName = format(currentDate, 'MMMM yyyy');
  const patientsProgress = goals?.targetPatients ? (actualPatients / goals.targetPatients) * 100 : 0;
  const wrvusProgress = goals?.targetWRVUs ? (actualWRVUs / goals.targetWRVUs) * 100 : 0;

  const formatNumber = (value: number, decimals: number = 0) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: decimals,
      minimumFractionDigits: value % 1 === 0 ? 0 : decimals,
    }).format(value);
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg font-bold text-primary">
            Monthly Goals - {monthName}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Goal Inputs */}
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
          <Button onClick={handleSave} className="flex-1">
            Save Goals
          </Button>
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
        </div>

        {/* Progress Display */}
        {(goals?.targetPatients || goals?.targetWRVUs) && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
            {goals.targetPatients && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="font-medium">Patients Progress</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatNumber(actualPatients)} / {formatNumber(goals.targetPatients)} ({formatNumber(patientsProgress, 1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(patientsProgress, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {goals.targetWRVUs && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="font-medium">wRVUs Progress</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatNumber(actualWRVUs, 2)} / {formatNumber(goals.targetWRVUs, 2)} ({formatNumber(wrvusProgress, 1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(wrvusProgress, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

