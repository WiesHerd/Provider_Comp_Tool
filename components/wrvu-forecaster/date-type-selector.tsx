'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Plane, BookOpen, CalendarCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

interface DateTypeSelectorProps {
  selectedDates: Date[];
  onMarkAsVacation?: (dates: Date[]) => void;
  onMarkAsCME?: (dates: Date[]) => void;
  onMarkAsHoliday?: (dates: Date[]) => void;
  onClearType?: (dates: Date[]) => void;
  className?: string;
}

export function DateTypeSelector({
  selectedDates,
  onMarkAsVacation,
  onMarkAsCME,
  onMarkAsHoliday,
  onClearType,
  className,
}: DateTypeSelectorProps) {
  const hasSelection = selectedDates.length > 0;

  if (!hasSelection) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3',
          'p-4 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20',
          'rounded-xl border-2 border-primary/20 shadow-sm',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
            {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected
          </span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onMarkAsVacation?.(selectedDates)}
            className="h-9 text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 dark:hover:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400"
          >
            <Plane className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Vacation</span>
            <span className="sm:hidden">Vac</span>
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onMarkAsCME?.(selectedDates)}
            className="h-9 text-purple-600 border-purple-300 hover:bg-purple-50 hover:border-purple-400 dark:hover:bg-purple-900/20 dark:border-purple-700 dark:text-purple-400"
          >
            <BookOpen className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">CME</span>
            <span className="sm:hidden">CME</span>
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onMarkAsHoliday?.(selectedDates)}
            className="h-9 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 dark:hover:bg-red-900/20 dark:border-red-700 dark:text-red-400"
          >
            <CalendarCheck className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Holiday</span>
            <span className="sm:hidden">Hol</span>
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onClearType?.(selectedDates)}
            className="h-9 text-gray-600 border-gray-300 hover:bg-gray-100 hover:border-gray-400 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
          >
            <X className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Clear</span>
            <span className="sm:hidden">×</span>
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
