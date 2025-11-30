'use client';

import { useState, useEffect } from 'react';
import { MarketBenchmarks } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Stethoscope } from 'lucide-react';
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
import {
  loadMarketData,
  getSavedSpecialties,
  hasMarketData,
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

interface SpecialtyInputProps {
  metricType: 'tcc' | 'wrvu' | 'cf';
  specialty?: string; // Current specialty from parent (for persistence)
  onSpecialtyChange: (specialty: string) => void;
  onMarketDataLoad: (benchmarks: MarketBenchmarks) => void;
}

export function SpecialtyInput({
  metricType,
  specialty: specialtyProp = '',
  onSpecialtyChange,
  onMarketDataLoad,
}: SpecialtyInputProps) {
  const [specialty, setSpecialty] = useState<string>(specialtyProp);
  const [customSpecialty, setCustomSpecialty] = useState<string>('');
  const [savedSpecialties, setSavedSpecialties] = useState<string[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  // Load saved specialties on mount
  useEffect(() => {
    const saved = getSavedSpecialties(metricType);
    setSavedSpecialties(saved);
  }, [metricType]);

  // Sync internal state with prop (for persistence across navigation)
  useEffect(() => {
    if (specialtyProp) {
      // If prop has a value, check if it's in the common specialties list
      if (COMMON_SPECIALTIES.includes(specialtyProp)) {
        setSpecialty(specialtyProp);
        setCustomSpecialty('');
      } else {
        // It's a custom specialty
        setSpecialty('Other');
        setCustomSpecialty(specialtyProp);
      }
    } else {
      // Clear if prop is empty
      setSpecialty('');
      setCustomSpecialty('');
    }
  }, [specialtyProp]);

  const handleSpecialtyChange = (value: string) => {
    // Don't auto-load if we're currently loading via quick load button
    if (isLoadingSaved) {
      return;
    }
    
    setSpecialty(value);
    setCustomSpecialty('');
    
    const selectedSpecialty = value === 'Other' ? '' : value;
    onSpecialtyChange(selectedSpecialty);
    
    // Auto-load market data if saved
    if (selectedSpecialty && hasMarketData(selectedSpecialty, metricType)) {
      const loaded = loadMarketData(selectedSpecialty, metricType);
      if (loaded) {
        onMarketDataLoad(loaded);
      }
    } else {
      // Clear market data if switching to unsaved specialty
      onMarketDataLoad({});
    }
  };

  const handleCustomSpecialtyChange = (value: string) => {
    setCustomSpecialty(value);
    onSpecialtyChange(value);
    
    // Auto-load market data if saved
    if (value && hasMarketData(value, metricType)) {
      const loaded = loadMarketData(value, metricType);
      if (loaded) {
        onMarketDataLoad(loaded);
      }
    } else {
      onMarketDataLoad({});
    }
  };

  const handleLoadSaved = (savedSpecialty: string) => {
    setIsLoadingSaved(true);
    
    // Load market data FIRST before changing specialty
    // This ensures the data is set before any auto-load logic runs
    const loaded = loadMarketData(savedSpecialty, metricType);
    if (loaded) {
      onMarketDataLoad(loaded);
    }
    
    // Then update specialty state
    setSpecialty(savedSpecialty);
    setCustomSpecialty('');
    onSpecialtyChange(savedSpecialty);
    
    // Reset loading flag after a brief delay to allow state updates to complete
    setTimeout(() => {
      setIsLoadingSaved(false);
    }, 100);
  };

  const currentSpecialty = specialty === 'Other' ? customSpecialty : specialty;

  return (
    <div className="space-y-3">
      {/* Quick Load Saved Specialties - Show first, always visible if saved specialties exist */}
      {savedSpecialties.length > 0 && (
        <div className="-mt-2">
          <Label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block">
            Quick load saved market data:
          </Label>
          {savedSpecialties.length <= 5 ? (
            // For 5 or fewer: Show buttons (quick access)
            <div className="flex flex-wrap gap-2">
              {savedSpecialties.map((savedSpec) => (
                <button
                  key={savedSpec}
                  type="button"
                  onClick={() => handleLoadSaved(savedSpec)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
                    "min-h-[32px] touch-manipulation",
                    currentSpecialty === savedSpec
                      ? "bg-primary text-white shadow-sm"
                      : "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
                  )}
                >
                  {savedSpec}
                </button>
              ))}
            </div>
          ) : (
            // For 6+: Use dropdown (scalable, mobile-friendly)
            <Select value={currentSpecialty} onValueChange={(value) => handleLoadSaved(value)}>
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

      <Label className="text-base font-semibold mt-6">Specialty</Label>
      
      <div className="flex gap-2">
        <Select value={specialty} onValueChange={handleSpecialtyChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select specialty">
              {specialty === 'Other' && customSpecialty ? customSpecialty : specialty || 'Select specialty'}
            </SelectValue>
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
              <SelectItem value="Other">Custom</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        
        {specialty === 'Other' && (
          <Input
            value={customSpecialty}
            onChange={(e) => handleCustomSpecialtyChange(e.target.value)}
            placeholder="Enter specialty name"
            className="flex-1"
            icon={<Stethoscope className="w-5 h-5" />}
          />
        )}
      </div>
    </div>
  );
}

