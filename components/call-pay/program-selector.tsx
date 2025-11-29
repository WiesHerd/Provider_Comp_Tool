'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useProgramCatalogStore } from '@/lib/store/program-catalog-store';
import { useUserPreferencesStore } from '@/lib/store/user-preferences-store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';

interface ProgramSelectorProps {
  compact?: boolean;
}

export function ProgramSelector({ compact = false }: ProgramSelectorProps) {
  const router = useRouter();
  const { programs, getProgram } = useProgramCatalogStore();
  const { activeProgramId, setActiveProgram } = useUserPreferencesStore();
  const activeProgram = activeProgramId ? getProgram(activeProgramId) : null;

  const handleProgramChange = (programId: string) => {
    if (programId === 'manage') {
      router.push('/call-programs');
      return;
    }
    setActiveProgram(programId);
  };

  if (programs.length === 0) {
    return (
      <button
        onClick={() => router.push('/call-programs')}
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/30 border border-gray-200/60 dark:border-gray-700/60 whitespace-nowrap"
      >
        {compact ? 'No program' : 'No programs available'}
      </button>
    );
  }

  return (
    <div className={cn(compact ? "" : "space-y-2")}>
      {!compact && (
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Program Selector
        </Label>
      )}
      <Select
        value={activeProgramId || undefined}
        onValueChange={handleProgramChange}
      >
        <SelectTrigger className={cn(compact ? "w-auto min-w-[200px]" : "w-full")}>
          <SelectValue placeholder="Select a program">
            {activeProgram 
              ? compact 
                ? activeProgram.name
                : `${activeProgram.name}${activeProgram.specialty ? ` • ${activeProgram.specialty}` : ''}${activeProgram.site ? ` • ${activeProgram.site}` : ''}${activeProgram.modelYear ? ` • ${activeProgram.modelYear}` : ''}`
              : 'Select a program'
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {programs.map((program) => (
            <SelectItem
              key={program.id}
              value={program.id}
              className={cn(
                activeProgramId === program.id && 'bg-primary/5 dark:bg-primary/10'
              )}
            >
              <div className="flex flex-col items-start py-0.5">
                <span className="font-medium text-sm">{program.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {program.specialty}
                  {program.site && ` • ${program.site}`}
                  {` • ${program.modelYear}`}
                </span>
              </div>
            </SelectItem>
          ))}
          <div className="border-t border-gray-200/40 dark:border-gray-700/40 mt-1 pt-1">
            <SelectItem value="manage" className="text-primary font-medium">
              Manage Programs
            </SelectItem>
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}

