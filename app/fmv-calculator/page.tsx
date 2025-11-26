'use client';

import { MetricSelector } from '@/components/fmv/metric-selector';
import { cn } from '@/lib/utils/cn';

export default function FMVCalculatorPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6">
      <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto pb-6 sm:pb-8 md:pb-12">
        {/* CompLens Branding Header */}
        <div className="mb-8 sm:mb-12 pt-6 sm:pt-8 md:pt-10">
          <div className="flex flex-col items-center justify-center">
            <h1 className={cn(
              "flex items-baseline",
              "text-3xl sm:text-4xl md:text-5xl font-bold",
              "tracking-tight",
              "animate-fade-in",
              "transition-opacity duration-300",
              "transform -skew-x-[-2deg]",
              "leading-tight",
              "mb-2"
            )}>
              <span className="text-gray-900 dark:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">Comp</span>
              <span className="text-purple-600 dark:text-purple-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">Lens</span>
              <sup className="text-sm sm:text-base font-normal text-gray-900 dark:text-white opacity-90 ml-1 -skew-x-[2deg]">™</sup>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 text-center mt-2">
              FMV Calculator
            </p>
          </div>
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
