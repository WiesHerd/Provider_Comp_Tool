'use client';

import { MetricSelector } from '@/components/fmv/metric-selector';

export default function FMVCalculatorPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
          FMV Calculator
        </h2>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          Fast FMV reasonableness checks and percentile analysis
        </p>
      </div>

      <MetricSelector />
    </div>
  );
}
