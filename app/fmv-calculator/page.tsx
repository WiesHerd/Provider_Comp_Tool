'use client';

import { MetricSelector } from '@/components/fmv/metric-selector';

export default function FMVCalculatorPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          FMV Quick Calculator
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Fast FMV reasonableness checks with percentile analysis. Select a metric to get started.
        </p>
      </div>

      <MetricSelector />
    </div>
  );
}
