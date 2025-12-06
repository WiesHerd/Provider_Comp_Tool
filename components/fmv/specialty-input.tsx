'use client';

import { useState, useEffect } from 'react';
import { MarketBenchmarks } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Stethoscope, Upload } from 'lucide-react';
import Link from 'next/link';
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


  const currentSpecialty = specialty === 'Other' ? customSpecialty : specialty;
  
  // Filter out saved specialties from common list to avoid duplicates
  const unsavedSpecialties = COMMON_SPECIALTIES.filter(s => !savedSpecialties.includes(s));
  // Get saved specialties that aren't in common list (custom saved specialties)
  const customSavedSpecialties = savedSpecialties.filter(s => !COMMON_SPECIALTIES.includes(s));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Specialty</Label>
        <Link
          href="/market-data"
          className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
        >
          <Upload className="w-3 h-3" />
          Manage Market Data
        </Link>
      </div>
      
      <div className="flex gap-2">
        <Select value={specialty} onValueChange={handleSpecialtyChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select specialty">
              {specialty === 'Other' && customSpecialty ? customSpecialty : specialty || 'Select specialty'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {/* Saved Market Data - Show first if any exist */}
            {savedSpecialties.length > 0 && (
              <>
                <SelectGroup>
                  <SelectLabel>Saved Market Data ({savedSpecialties.length})</SelectLabel>
                  {savedSpecialties.map((savedSpec) => {
                    const isActive = currentSpecialty === savedSpec;
                    return (
                      <SelectItem key={savedSpec} value={savedSpec}>
                        <div className="flex items-center justify-between w-full">
                          <span>{savedSpec}</span>
                          {isActive && (
                            <span className="text-primary text-xs ml-2">●</span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
                <SelectSeparator />
              </>
            )}
            
            {/* Primary Care / Hospital Medicine */}
            {unsavedSpecialties.filter(s => COMMON_SPECIALTIES.slice(0, 4).includes(s)).length > 0 && (
              <>
                <SelectGroup>
                  <SelectLabel>Primary Care / Hospital Medicine</SelectLabel>
                  {unsavedSpecialties
                    .filter(s => COMMON_SPECIALTIES.slice(0, 4).includes(s))
                    .map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                </SelectGroup>
                <SelectSeparator />
              </>
            )}
            
            {/* Procedural / Surgical */}
            {unsavedSpecialties.filter(s => COMMON_SPECIALTIES.slice(4, 15).includes(s)).length > 0 && (
              <>
                <SelectGroup>
                  <SelectLabel>Procedural / Surgical</SelectLabel>
                  {unsavedSpecialties
                    .filter(s => COMMON_SPECIALTIES.slice(4, 15).includes(s))
                    .map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                </SelectGroup>
                <SelectSeparator />
              </>
            )}
            
            {/* Medical Subspecialties */}
            {unsavedSpecialties.filter(s => COMMON_SPECIALTIES.slice(15, 23).includes(s)).length > 0 && (
              <>
                <SelectGroup>
                  <SelectLabel>Medical Subspecialties</SelectLabel>
                  {unsavedSpecialties
                    .filter(s => COMMON_SPECIALTIES.slice(15, 23).includes(s))
                    .map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                </SelectGroup>
                <SelectSeparator />
              </>
            )}
            
            {/* Other */}
            <SelectGroup>
              <SelectLabel>Other</SelectLabel>
              {unsavedSpecialties
                .filter(s => COMMON_SPECIALTIES.slice(23).includes(s))
                .map((s) => (
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
      
      {savedSpecialties.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {savedSpecialties.length} saved {savedSpecialties.length === 1 ? 'specialty' : 'specialties'} available. Select from dropdown to auto-load market data.
        </p>
      )}
    </div>
  );
}

