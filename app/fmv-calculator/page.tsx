'use client';

import { MetricSelector } from '@/components/fmv/metric-selector';

export default function FMVCalculatorPage() {
  return (
    <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto py-4 sm:py-6 md:py-8 space-y-8">
      <MetricSelector />
    </div>
  );
}
