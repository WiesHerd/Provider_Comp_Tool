'use client';

import { useState, useEffect } from 'react';
import { MarketBenchmarks } from '@/types';
import { Input } from '@/components/ui/input';
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
  onSpecialtyChange: (specialty: string) => void;
  onMarketDataLoad: (benchmarks: MarketBenchmarks) => void;
}

export function SpecialtyInput({
  metricType,
  onSpecialtyChange,
  onMarketDataLoad,
}: SpecialtyInputProps) {
  const [specialty, setSpecialty] = useState<string>('');
  const [customSpecialty, setCustomSpecialty] = useState<string>('');
  const [savedSpecialties, setSavedSpecialties] = useState<string[]>([]);

  // Load saved specialties on mount
  useEffect(() => {
    const saved = getSavedSpecialties(metricType);
    setSavedSpecialties(saved);
  }, [metricType]);

  const handleSpecialtyChange = (value: string) => {
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
    setSpecialty(savedSpecialty);
    setCustomSpecialty('');
    onSpecialtyChange(savedSpecialty);
    
    const loaded = loadMarketData(savedSpecialty, metricType);
    if (loaded) {
      onMarketDataLoad(loaded);
    }
  };

  const currentSpecialty = specialty === 'Other' ? customSpecialty : specialty;

  return (
    <div className="space-y-3">
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
            onChange={(e) => handleCustomSpecialtyChange(e.target.value)}
            placeholder="Enter specialty name"
            className="flex-1"
          />
        )}
      </div>

      {/* Quick Load Saved Specialties */}
      {savedSpecialties.length > 0 && (
        <div className="pt-2">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Quick load saved market data:
          </p>
          <div className="flex flex-wrap gap-2">
            {savedSpecialties.map((savedSpec) => (
              <button
                key={savedSpec}
                type="button"
                onClick={() => handleLoadSaved(savedSpec)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  "min-h-[32px]",
                  currentSpecialty === savedSpec
                    ? "bg-primary text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                {savedSpec}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

