'use client';

import { MetricSelector } from '@/components/fmv/metric-selector';

export default function FMVCalculatorPage() {
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 space-y-8">
      <MetricSelector />
    </div>
  );
}
