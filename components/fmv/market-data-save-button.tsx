'use client';

import { useState } from 'react';
import { MarketBenchmarks } from '@/types';
import { Button } from '@/components/ui/button';
import { Save, Check } from 'lucide-react';
import {
  saveMarketData,
  hasMarketData,
} from '@/lib/utils/market-data-storage';

interface MarketDataSaveButtonProps {
  specialty: string;
  metricType: 'tcc' | 'wrvu' | 'cf';
  benchmarks: MarketBenchmarks;
}

export function MarketDataSaveButton({
  specialty,
  metricType,
  benchmarks,
}: MarketDataSaveButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Check if data is already saved
  const isAlreadySaved = specialty && hasMarketData(specialty, metricType);

  const hasData = Object.values(benchmarks).some(v => v !== undefined && v > 0);

  const handleSave = () => {
    if (!specialty.trim()) {
      alert('Please select or enter a specialty first');
      return;
    }

    if (!hasData) {
      alert('Please enter market benchmark data before saving');
      return;
    }

    setIsSaving(true);
    saveMarketData(specialty.trim(), metricType, benchmarks);
    setSaved(true);
    setIsSaving(false);

    // Reset saved state after 3 seconds
    setTimeout(() => setSaved(false), 3000);
  };

  if (!specialty) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleSave}
        disabled={!hasData || isSaving}
        className="w-full sm:w-auto min-h-[44px] touch-target"
      >
        {saved ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Saved!
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Save
          </>
        )}
      </Button>
      
      {isAlreadySaved && !saved && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Market data already saved for {specialty}
        </span>
      )}
    </div>
  );
}




