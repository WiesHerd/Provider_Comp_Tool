'use client';

import { useState, useEffect } from 'react';
import { MarketDataUpload } from '@/components/market-data/market-data-upload';
import MarketDataTable from '@/components/market-data/market-data-table';
import { Database } from 'lucide-react';

export default function MarketDataPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  // Check screen size immediately on mount and on resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 640);
    };
    
    // Check immediately
    checkScreenSize();
    
    // Listen for resize
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleUploadComplete = () => {
    // Trigger refresh of table
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6">
      <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto pt-6 sm:pt-8 md:pt-10 pb-4 sm:pb-6 md:pb-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Market Data Management
            </h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isDesktop ? (
              'Upload, view, and manage market benchmark data (TCC, wRVU, CF) by specialty. This data is used across all FMV calculators and comparison tools.'
            ) : (
              'View and manage market benchmark data (TCC, wRVU, CF) by specialty. Bulk uploads available on desktop.'
            )}
          </p>
        </div>

        {/* Upload Section - Hidden on mobile with CSS + conditional rendering */}
        <div className="mb-6 hidden sm:block">
          {isDesktop && (
            <MarketDataUpload onUploadComplete={handleUploadComplete} />
          )}
        </div>

        {/* Table Section */}
        <div>
          <MarketDataTable key={refreshKey} onDataChange={handleUploadComplete} />
        </div>
      </div>
    </div>
  );
}


