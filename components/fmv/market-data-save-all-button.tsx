'use client';

import { useState, useMemo } from 'react';
import { MarketBenchmarks } from '@/types';
import { Button } from '@/components/ui/button';
import { Save, Check } from 'lucide-react';
import {
  saveMarketData,
  hasMarketData,
} from '@/lib/utils/market-data-storage';

interface MarketDataSaveAllButtonProps {
  specialty: string;
  benchmarks: MarketBenchmarks;
  onSave?: () => void;
}

export function MarketDataSaveAllButton({
  specialty,
  benchmarks,
  onSave,
}: MarketDataSaveAllButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Check which metrics have data
  const hasWrvuData = useMemo(() => {
    return benchmarks.wrvu25 || benchmarks.wrvu50 || benchmarks.wrvu75 || benchmarks.wrvu90;
  }, [benchmarks]);

  const hasTccData = useMemo(() => {
    return benchmarks.tcc25 || benchmarks.tcc50 || benchmarks.tcc75 || benchmarks.tcc90;
  }, [benchmarks]);

  const hasCfData = useMemo(() => {
    return benchmarks.cf25 || benchmarks.cf50 || benchmarks.cf75 || benchmarks.cf90;
  }, [benchmarks]);

  const hasAnyData = hasWrvuData || hasTccData || hasCfData;

  // Check which metrics are already saved
  const isWrvuSaved = specialty && hasMarketData(specialty, 'wrvu');
  const isTccSaved = specialty && hasMarketData(specialty, 'tcc');
  const isCfSaved = specialty && hasMarketData(specialty, 'cf');
  const allSaved = isWrvuSaved && isTccSaved && isCfSaved;

  const handleSave = () => {
    if (!specialty.trim()) {
      alert('Please select or enter a specialty first');
      return;
    }

    if (!hasAnyData) {
      alert('Please enter market benchmark data before saving');
      return;
    }

    setIsSaving(true);

    // Save all metrics that have data
    if (hasWrvuData) {
      saveMarketData(specialty.trim(), 'wrvu', benchmarks);
    }
    if (hasTccData) {
      saveMarketData(specialty.trim(), 'tcc', benchmarks);
    }
    if (hasCfData) {
      saveMarketData(specialty.trim(), 'cf', benchmarks);
    }

    setSaved(true);
    setIsSaving(false);

    // Notify parent to refresh saved specialties list
    if (onSave) {
      onSave();
    }

    // Reset saved state after 3 seconds
    setTimeout(() => setSaved(false), 3000);
  };

  if (!specialty) {
    return null;
  }

  // Build status message
  const savedMetrics = [];
  if (isWrvuSaved) savedMetrics.push('wRVU');
  if (isTccSaved) savedMetrics.push('TCC');
  if (isCfSaved) savedMetrics.push('CF');

  return (
    <div className="space-y-3">
      <Button
        onClick={handleSave}
        disabled={!hasAnyData || isSaving}
        className="w-full min-h-[44px] touch-target"
        size="lg"
      >
        {saved ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Saved!
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Save Market Data
          </>
        )}
      </Button>
      
      {savedMetrics.length > 0 && !saved && (
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          {savedMetrics.length === 3 
            ? 'All market data already saved for ' + specialty
            : `Saved: ${savedMetrics.join(', ')}`}
        </p>
      )}

      {hasAnyData && !saved && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Saves all entered market data (wRVU, TCC, CF) for {specialty}
        </p>
      )}
    </div>
  );
}

