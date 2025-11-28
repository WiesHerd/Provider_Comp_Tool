'use client';

import { useState, useEffect } from 'react';
import { MarketBenchmarks } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, X } from 'lucide-react';
import {
  saveMarketData,
  loadMarketData,
  getSavedSpecialties,
  hasMarketData,
  deleteMarketData,
} from '@/lib/utils/market-data-storage';
import { cn } from '@/lib/utils/cn';

// Common medical specialties
const COMMON_SPECIALTIES = [
  // Primary Care / Hospital Medicine
  'Family Medicine',
  'Internal Medicine',
  'Hospitalist',
  'Pediatrics',
  // Procedural / Surgical
  'Anesthesiology',
  'General Surgery',
  'Orthopedic Surgery',
  'Neurosurgery',
  'Trauma Surgery',
  'Cardiothoracic Surgery',
  'Vascular Surgery',
  'Urology',
  'OB/GYN',
  'ENT (Otolaryngology)',
  'Ophthalmology',
  // Medical Subspecialties
  'Cardiology',
  'Critical Care',
  'Emergency Medicine',
  'Gastroenterology',
  'Nephrology',
  'Neurology',
  'Pulmonology',
  'Radiology',
  // Other
  'Psychiatry',
  'Pathology',
  'Other',
];

interface SpecialtySelectorProps {
  metricType: 'tcc' | 'wrvu' | 'cf';
  benchmarks: MarketBenchmarks;
  onBenchmarksChange: (benchmarks: MarketBenchmarks) => void;
}

export function SpecialtySelector({
  metricType,
  benchmarks,
  onBenchmarksChange,
}: SpecialtySelectorProps) {
  const [specialty, setSpecialty] = useState<string>('');
  const [customSpecialty, setCustomSpecialty] = useState<string>('');
  const [savedSpecialties, setSavedSpecialties] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  // Load saved specialties on mount
  useEffect(() => {
    const saved = getSavedSpecialties(metricType);
    setSavedSpecialties(saved);
  }, [metricType]);

  // Check if current specialty has saved data and auto-load
  useEffect(() => {
    if (!specialty) {
      setIsSaved(false);
      return;
    }
    
    const currentSpecialty = specialty === 'Other' ? customSpecialty : specialty;
    if (currentSpecialty) {
      const saved = hasMarketData(currentSpecialty, metricType);
      setIsSaved(saved);
      
      // Auto-load if saved
      if (saved) {
        const loaded = loadMarketData(currentSpecialty, metricType);
        if (loaded) {
          onBenchmarksChange(loaded);
        }
      }
    } else {
      setIsSaved(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialty, customSpecialty, metricType]);

  const handleSpecialtyChange = (value: string) => {
    setSpecialty(value);
    setCustomSpecialty('');
    
    // Auto-load if saved
    if (value && value !== 'Other') {
      const saved = hasMarketData(value, metricType);
      setIsSaved(saved);
      if (saved) {
        const loaded = loadMarketData(value, metricType);
        if (loaded) {
          onBenchmarksChange(loaded);
        }
      } else {
        // Clear benchmarks if switching to unsaved specialty
        onBenchmarksChange({});
      }
    } else {
      setIsSaved(false);
    }
  };

  const handleSave = () => {
    const currentSpecialty = specialty === 'Other' ? customSpecialty.trim() : specialty;
    if (!currentSpecialty) {
      alert('Please select or enter a specialty');
      return;
    }
    
    if (!hasData) {
      alert('Please enter market benchmark data before saving');
      return;
    }
    
    saveMarketData(currentSpecialty, metricType, benchmarks);
    setIsSaved(true);
    
    // Update saved specialties list
    const saved = getSavedSpecialties(metricType);
    setSavedSpecialties(saved);
    
    // Show brief success feedback (could be replaced with toast)
    const button = document.activeElement as HTMLElement;
    if (button) {
      const originalText = button.textContent;
      button.textContent = '✓ Saved!';
      setTimeout(() => {
        if (button.textContent === '✓ Saved!') {
          button.textContent = originalText || 'Save Market Data';
        }
      }, 2000);
    }
  };

  const handleLoad = (selectedSpecialty: string) => {
    setSpecialty(selectedSpecialty);
    setCustomSpecialty('');
    const loaded = loadMarketData(selectedSpecialty, metricType);
    if (loaded) {
      onBenchmarksChange(loaded);
    }
  };

  const handleDelete = () => {
    const currentSpecialty = specialty === 'Other' ? customSpecialty : specialty;
    if (!currentSpecialty) return;
    
    if (confirm(`Delete saved market data for ${currentSpecialty}?`)) {
      deleteMarketData(currentSpecialty, metricType);
      setIsSaved(false);
      
      // Update saved specialties list
      const saved = getSavedSpecialties(metricType);
      setSavedSpecialties(saved);
      
      // Clear specialty if it was deleted
      if (saved.length === 0 || !saved.includes(currentSpecialty)) {
        setSpecialty('');
        setCustomSpecialty('');
        onBenchmarksChange({});
      }
    }
  };

  const currentSpecialty = specialty === 'Other' ? customSpecialty : specialty;
  const hasData = Object.values(benchmarks).some(v => v !== undefined && v > 0);

  return (
    <div className="space-y-4">
      {/* Specialty Selection */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">Specialty</Label>
        <div className="flex gap-2">
          <Select value={specialty} onValueChange={handleSpecialtyChange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select specialty" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Primary Care / Hospital Medicine</SelectLabel>
                {COMMON_SPECIALTIES.slice(0, 4).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Procedural / Surgical</SelectLabel>
                {COMMON_SPECIALTIES.slice(4, 15).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Medical Subspecialties</SelectLabel>
                {COMMON_SPECIALTIES.slice(15, 23).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Other</SelectLabel>
                {COMMON_SPECIALTIES.slice(23).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
                <SelectItem value="Other">Custom Specialty...</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          
          {specialty === 'Other' && (
            <Input
              value={customSpecialty}
              onChange={(e) => setCustomSpecialty(e.target.value)}
              placeholder="Enter specialty name"
              className="flex-1"
            />
          )}
        </div>
      </div>

      {/* Saved Specialties Quick Access - Scalable Design */}
      {savedSpecialties.length > 0 && (
        <div className="space-y-3 -mt-2">
          <Label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block">
            Quick load saved market data:
          </Label>
          {savedSpecialties.length <= 5 ? (
            // For 5 or fewer: Show buttons (quick access)
            <div className="flex flex-wrap gap-2">
              {savedSpecialties.map((savedSpec) => {
                const isActive = currentSpecialty === savedSpec;
                return (
                  <button
                    key={savedSpec}
                    type="button"
                    onClick={() => handleLoad(savedSpec)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
                      "min-h-[32px] touch-manipulation",
                      isActive
                        ? "bg-primary text-white shadow-sm"
                        : "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
                    )}
                  >
                    {savedSpec}
                  </button>
                );
              })}
            </div>
          ) : (
            // For 6+: Use dropdown (scalable, mobile-friendly)
            <Select value={currentSpecialty || ''} onValueChange={(value) => handleLoad(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={`Select from ${savedSpecialties.length} saved specialties...`} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectGroup>
                  <SelectLabel>Saved Market Data ({savedSpecialties.length})</SelectLabel>
                  {savedSpecialties.map((savedSpec) => (
                    <SelectItem key={savedSpec} value={savedSpec}>
                      <div className="flex items-center justify-between w-full">
                        <span>{savedSpec}</span>
                        {currentSpecialty === savedSpec && (
                          <span className="text-primary text-xs ml-2">●</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
          {savedSpecialties.length > 5 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {savedSpecialties.length} saved specialties available
            </p>
          )}
        </div>
      )}

      {/* Save/Load Actions */}
      {currentSpecialty && (
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <Button
              onClick={handleSave}
              disabled={!hasData}
              className="flex-1 min-h-[44px]"
              variant={isSaved ? 'outline' : 'default'}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaved ? 'Update Saved Data' : 'Save Market Data'}
            </Button>
            
            {isSaved && (
              <Button
                onClick={handleDelete}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 min-h-[44px] min-w-[44px]"
                title="Delete saved data"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          {isSaved && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Market data saved for {currentSpecialty}. It will auto-load when you select this specialty.</span>
            </div>
          )}
          
          {!isSaved && hasData && (
            <div className="text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              💡 Save this data to quickly reload it next time you work with {currentSpecialty}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

