'use client';

import { MetricSelector } from '@/components/fmv/metric-selector';

export default function FMVCalculatorPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6">
      <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto pb-6 sm:pb-8 md:pb-12">
        <div className="mb-8 sm:mb-10 pt-8 sm:pt-12">
          <MetricSelector />
        </div>
      </div>
    </div>
  );
}
