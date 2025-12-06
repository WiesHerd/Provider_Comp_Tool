'use client';

import { Suspense } from 'react';
import { CFStewardshipDashboard } from '@/components/cf-stewardship/cf-stewardship-dashboard';

function CFStewardshipDashboardContent() {
  return <CFStewardshipDashboard />;
}

export default function CFStewardshipDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8 md:pb-12">
            <div className="pt-6 sm:pt-8 md:pt-10">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mb-8"></div>
                <div className="space-y-4">
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <CFStewardshipDashboardContent />
    </Suspense>
  );
}









