'use client';

import { MetricSelector } from '@/components/fmv/metric-selector';
import { Info } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';

export default function FMVCalculatorPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6">
      <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto pb-6 sm:pb-8 md:pb-12">
        {/* Page Title */}
        <div className="mb-6 flex items-center gap-2 pt-6 sm:pt-8 md:pt-10">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            FMV Calculator
          </h1>
          <Tooltip 
            content="Check if an offer is fair by comparing to market data. Use before signing contracts or making offers."
            side="right"
          >
            <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
          </Tooltip>
        </div>

        <div className="mb-8 sm:mb-10 pt-4 sm:pt-0">
          <div className="flex justify-center">
            <div className="w-full max-w-sm sm:max-w-none">
              <MetricSelector />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
