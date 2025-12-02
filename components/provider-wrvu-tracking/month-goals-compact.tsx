'use client';

import * as React from 'react';
import { Target, Plus, X, Check, Edit2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import { MonthlyGoals } from '@/types/provider-wrvu-tracking';

interface MonthGoalsCompactProps {
  goals?: MonthlyGoals;
  onGoalsChange: (goals: MonthlyGoals) => void;
  className?: string;
  actualPatients?: number;
  actualWRVUs?: number;
}

export function MonthGoalsCompact({
  goals,
  onGoalsChange,
  className,
  actualPatients = 0,
  actualWRVUs = 0,
}: MonthGoalsCompactProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editingField, setEditingField] = React.useState<'patients' | 'wrvus' | 'both' | null>(null);
  const [targetPatients, setTargetPatients] = React.useState(goals?.targetPatients?.toString() || '');
  const [targetWRVUs, setTargetWRVUs] = React.useState(goals?.targetWRVUs?.toString() || '');

  const patientsInputRef = React.useRef<HTMLInputElement>(null);
  const wrvusInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setTargetPatients(goals?.targetPatients?.toString() || '');
    setTargetWRVUs(goals?.targetWRVUs?.toString() || '');
  }, [goals]);

  React.useEffect(() => {
    if (isEditing && editingField === 'patients' && patientsInputRef.current) {
      patientsInputRef.current.focus();
      patientsInputRef.current.select();
    } else if (isEditing && editingField === 'wrvus' && wrvusInputRef.current) {
      wrvusInputRef.current.focus();
      wrvusInputRef.current.select();
    }
  }, [isEditing, editingField]);

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
    setIsEditing(false);
    setEditingField(null);
  };

  const handleCancel = () => {
    setTargetPatients(goals?.targetPatients?.toString() || '');
    setTargetWRVUs(goals?.targetWRVUs?.toString() || '');
    setIsEditing(false);
    setEditingField(null);
  };


  const handleKeyDown = (e: React.KeyboardEvent, field: 'patients' | 'wrvus') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'patients' && targetWRVUs) {
        // Move to wRVUs input
        setEditingField('wrvus');
        setTimeout(() => wrvusInputRef.current?.focus(), 0);
      } else {
        handleSave();
      }
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const hasGoals = goals?.targetPatients || goals?.targetWRVUs;
  const patientsProgress = goals?.targetPatients ? (actualPatients / goals.targetPatients) * 100 : 0;
  const wrvusProgress = goals?.targetWRVUs ? (actualWRVUs / goals.targetWRVUs) * 100 : 0;

  // If no goals and not editing, show simple "Set Goals" button
  if (!hasGoals && !isEditing) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <button
          onClick={() => {
            setIsEditing(true);
            setEditingField('both');
          }}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 sm:px-2.5 py-2 sm:py-1 rounded-md",
            "text-sm sm:text-xs font-medium touch-target",
            "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100",
            "hover:bg-gray-100 dark:hover:bg-gray-800",
            "transition-colors duration-150"
          )}
        >
          <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          <span>Set Goals</span>
        </button>
      </div>
    );
  }

  // Editing mode - inline inputs
  if (isEditing) {
    return (
      <div className={cn("flex items-center gap-2 flex-wrap", className)}>
        {/* Patients Goal Input */}
        <div className="flex items-center gap-2 sm:gap-1.5">
          <span className="text-sm sm:text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Patients:</span>
          <Input
            ref={patientsInputRef}
            type="number"
            value={targetPatients}
            onChange={(e) => setTargetPatients(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'patients')}
            onBlur={() => {
              // Don't auto-close if clicking on wRVUs input
              setTimeout(() => {
                if (editingField === 'patients' && !wrvusInputRef.current?.matches(':focus')) {
                  handleSave();
                }
              }, 200);
            }}
            placeholder="0"
            min={0}
            step={1}
            className="h-11 sm:h-7 w-24 sm:w-20 px-3 sm:px-2 text-sm sm:text-xs text-center border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-1 focus:ring-primary touch-target"
          />
        </div>

        {/* wRVUs Goal Input */}
        <div className="flex items-center gap-2 sm:gap-1.5">
          <span className="text-sm sm:text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">wRVUs:</span>
          <Input
            ref={wrvusInputRef}
            type="number"
            value={targetWRVUs}
            onChange={(e) => setTargetWRVUs(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, 'wrvus')}
            onBlur={() => {
              setTimeout(() => {
                if (editingField === 'wrvus' && !patientsInputRef.current?.matches(':focus')) {
                  handleSave();
                }
              }, 200);
            }}
            placeholder="0"
            min={0}
            step={0.01}
            className="h-11 sm:h-7 w-24 sm:w-20 px-3 sm:px-2 text-sm sm:text-xs text-center border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-1 focus:ring-primary touch-target"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 sm:gap-1">
          <button
            onClick={handleSave}
            className="p-2 sm:p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors touch-target"
            aria-label="Save"
            title="Save (Enter)"
          >
            <Check className="w-5 h-5 sm:w-3.5 sm:h-3.5" />
          </button>
          <button
            onClick={handleCancel}
            className="p-2 sm:p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors touch-target"
            aria-label="Cancel"
            title="Cancel (Esc)"
          >
            <X className="w-5 h-5 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Display mode - show goals as chips with progress
  return (
    <div className={cn("flex items-center gap-2 flex-wrap min-w-0", className)}>
      {goals?.targetPatients && (
        <button
          onClick={() => {
            setIsEditing(true);
            setEditingField('patients');
          }}
          className={cn(
            "inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full",
            "text-xs sm:text-sm font-medium touch-target",
            "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
            "border border-blue-200 dark:border-blue-800",
            "hover:bg-blue-100 dark:hover:bg-blue-900/30",
            "transition-all duration-150 group",
            "max-w-full min-w-0 flex-shrink"
          )}
        >
          <Target className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="hidden sm:inline text-blue-600 dark:text-blue-400 font-semibold">Goal:</span>
          <span className="font-semibold whitespace-nowrap">{goals.targetPatients}</span>
          <span className="text-blue-500 dark:text-blue-400 whitespace-nowrap hidden xs:inline">patients</span>
          {actualPatients > 0 && (
            <span className={cn(
              "ml-0.5 sm:ml-1 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold whitespace-nowrap flex-shrink-0",
              patientsProgress >= 100 ? "bg-green-500 text-white" :
              patientsProgress >= 75 ? "bg-blue-500 text-white" :
              patientsProgress >= 50 ? "bg-amber-500 text-white" :
              "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
            )}>
              {Math.min(patientsProgress, 100).toFixed(0)}%
            </span>
          )}
          <Edit2 className="w-3 h-3 sm:w-4 sm:h-4 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 flex-shrink-0 hidden sm:block" />
        </button>
      )}

      {goals?.targetWRVUs && (
        <button
          onClick={() => {
            setIsEditing(true);
            setEditingField('wrvus');
          }}
          className={cn(
            "inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full",
            "text-xs sm:text-sm font-medium touch-target",
            "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300",
            "border border-purple-200 dark:border-purple-800",
            "hover:bg-purple-100 dark:hover:bg-purple-900/30",
            "transition-all duration-150 group",
            "max-w-full min-w-0 flex-shrink"
          )}
        >
          <Target className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="hidden sm:inline text-purple-600 dark:text-purple-400 font-semibold">Goal:</span>
          <span className="font-semibold whitespace-nowrap">{goals.targetWRVUs.toFixed(0)}</span>
          <span className="text-purple-500 dark:text-purple-400 whitespace-nowrap hidden xs:inline">wRVUs</span>
          {actualWRVUs > 0 && (
            <span className={cn(
              "ml-0.5 sm:ml-1 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold whitespace-nowrap flex-shrink-0",
              wrvusProgress >= 100 ? "bg-green-500 text-white" :
              wrvusProgress >= 75 ? "bg-purple-500 text-white" :
              wrvusProgress >= 50 ? "bg-amber-500 text-white" :
              "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
            )}>
              {Math.min(wrvusProgress, 100).toFixed(0)}%
            </span>
          )}
          <Edit2 className="w-3 h-3 sm:w-4 sm:h-4 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 flex-shrink-0 hidden sm:block" />
        </button>
      )}

      {/* Add more goals button */}
      {(!goals?.targetPatients || !goals?.targetWRVUs) && (
        <button
          onClick={() => {
            setIsEditing(true);
            setEditingField('both');
          }}
          className={cn(
            "inline-flex items-center justify-center gap-1 px-3 sm:px-2 py-2 sm:py-1 rounded-full",
            "text-sm sm:text-xs font-medium touch-target",
            "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200",
            "hover:bg-gray-100 dark:hover:bg-gray-800",
            "border border-dashed border-gray-300 dark:border-gray-700",
            "transition-colors duration-150"
          )}
        >
          <Plus className="w-4 h-4 sm:w-3 sm:h-3" />
        </button>
      )}
    </div>
  );
}
