'use client';

import { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '@/components/ui/select';
import { AlertCircle, Building2 } from 'lucide-react';
import { CallPayContext, Specialty } from '@/types/call-pay';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface ContextCardProps {
  context: CallPayContext;
  onContextChange: (context: CallPayContext) => void;
  showTopBorder?: boolean;
  headerAction?: React.ReactNode;
}

const SPECIALTIES: Specialty[] = [
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

/**
 * Calculate valid rotation ratios based on number of providers
 * Returns ratios that make mathematical sense (1-in-N, 1-in-N/2, etc.)
 * 
 * Industry Standard: Rotation ratio represents how the total call burden is divided.
 * - 1-in-4 means each provider covers 1/4 of total calls
 * - If you have 6 providers with 1-in-4 rotation, it means 4 providers are active in rotation
 * - Common patterns: 1-in-N (all providers rotate), 1-in-N/2 (split into 2 groups), etc.
 */
function getValidRotationRatios(providersOnCall: number): number[] {
  if (providersOnCall < 1) return [];
  
  const ratios: number[] = [];
  // Always include full rotation (1-in-N) - most common pattern
  ratios.push(providersOnCall);
  
  // Add common divisors (1-in-N/2, 1-in-N/3, etc.)
  // These represent splitting providers into groups
  // Only include divisors that result in ratios >= 2
  for (let divisor = 2; divisor <= providersOnCall / 2; divisor++) {
    if (providersOnCall % divisor === 0) {
      const ratio = providersOnCall / divisor;
      if (ratio >= 2 && !ratios.includes(ratio)) {
        ratios.push(ratio);
      }
    }
  }
  
  // Also include common ratios that might not divide evenly but are used in practice
  // (e.g., 6 providers with 1-in-4 means 4 active, 2 backup)
  // But prioritize mathematically clean ratios first
  
  return ratios.sort((a, b) => a - b);
}

/**
 * Get service line suggestions based on specialty
 */
function getServiceLineSuggestions(specialty: string): string[] {
  if (!specialty || specialty === 'Other') {
    return ['Main Campus'];
  }
  
  return [
    `${specialty} Service Line`,
    `Main Campus - ${specialty}`,
    `${specialty} - Main Campus`,
    'Main Campus',
  ];
}

/**
 * Check if a rotation ratio is mathematically optimal for the given number of providers
 * 
 * Industry Standard: For clean rotation schedules, the ratio should divide evenly.
 * However, some organizations use ratios where not all providers are active (e.g., 6 providers, 1-in-4 = 4 active, 2 backup).
 * This function identifies "optimal" ratios but allows others with a warning.
 */
function isValidRotationRatio(providersOnCall: number, rotationRatio: number): boolean {
  if (providersOnCall < 1 || rotationRatio < 1) return false;
  // Mathematically optimal if rotationRatio divides evenly into providersOnCall
  // This means all providers participate equally in the rotation
  return providersOnCall % rotationRatio === 0;
}

/**
 * Get explanation text for rotation ratio validity
 */
function getRotationRatioExplanation(providersOnCall: number, rotationRatio: number): string {
  if (isValidRotationRatio(providersOnCall, rotationRatio)) {
    if (rotationRatio === providersOnCall) {
      return `All ${providersOnCall} providers rotate equally (1-in-${rotationRatio})`;
    } else {
      const groups = providersOnCall / rotationRatio;
      return `${groups} group${groups > 1 ? 's' : ''} of ${rotationRatio} provider${rotationRatio > 1 ? 's' : ''} each`;
    }
  } else {
    const activeProviders = rotationRatio;
    const backupProviders = providersOnCall - activeProviders;
    if (backupProviders > 0) {
      return `${activeProviders} active in rotation, ${backupProviders} backup/provider`;
    } else {
      return `Rotation may not distribute evenly among ${providersOnCall} providers`;
    }
  }
}

export function ContextCard({ context, onContextChange, showTopBorder = true, headerAction }: ContextCardProps) {
  const [serviceLineManuallyEdited, setServiceLineManuallyEdited] = useState(false);
  const [serviceLineFocused, setServiceLineFocused] = useState(false);
  
  // Check if current specialty is a custom one (not in the predefined list)
  const isCustomSpecialty = !SPECIALTIES.includes(context.specialty as Specialty);
  const displaySpecialty = isCustomSpecialty ? 'Other' : context.specialty;
  // Use the actual custom specialty value if it's custom, otherwise empty string
  const customSpecialtyValue = isCustomSpecialty ? context.specialty : '';

  // Calculate valid rotation ratios based on providers on call
  const validRotationRatios = useMemo(() => {
    return getValidRotationRatios(context.providersOnCall);
  }, [context.providersOnCall]);

  // Check if current rotation ratio is valid
  const isRotationRatioValid = useMemo(() => {
    return isValidRotationRatio(context.providersOnCall, context.rotationRatio);
  }, [context.providersOnCall, context.rotationRatio]);

  // Get service line suggestions
  const serviceLineSuggestions = useMemo(() => {
    const specialty = isCustomSpecialty ? customSpecialtyValue : context.specialty;
    return getServiceLineSuggestions(specialty);
  }, [context.specialty, isCustomSpecialty, customSpecialtyValue]);

  const updateField = <K extends keyof CallPayContext>(
    field: K,
    value: CallPayContext[K]
  ) => {
    onContextChange({ ...context, [field]: value });
  };

  // Auto-select rotation ratio when providers change
  useEffect(() => {
    // When providers on call changes and is > 0, auto-select the default (1-in-N)
    if (context.providersOnCall > 0 && validRotationRatios.length > 0) {
      // Only auto-select if rotation ratio is 0 (not set) or invalid for current providers
      // Don't reset if user has selected a valid ratio
      if (context.rotationRatio === 0 || (context.rotationRatio > 0 && !validRotationRatios.includes(context.rotationRatio))) {
        const defaultRatio = context.providersOnCall; // 1-in-N
        updateField('rotationRatio', defaultRatio);
      }
    } else if (context.providersOnCall === 0) {
      // Reset rotation ratio when providers is set to 0
      updateField('rotationRatio', 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.providersOnCall, validRotationRatios.length]);

  // Auto-suggest service line when specialty changes (if not manually edited)
  useEffect(() => {
    if (!serviceLineManuallyEdited && context.specialty && serviceLineSuggestions.length > 0) {
      updateField('serviceLine', serviceLineSuggestions[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.specialty, isCustomSpecialty, customSpecialtyValue, serviceLineManuallyEdited, serviceLineSuggestions]);

  const handleSpecialtyChange = (value: string) => {
    if (value === 'Other') {
      // If switching to "Other", keep existing custom value or set empty
      if (isCustomSpecialty) {
        // Already custom, keep it
        return;
      } else {
        // Switching to custom, clear it
        updateField('specialty', '');
      }
    } else {
      // Selecting a predefined specialty
      updateField('specialty', value as Specialty);
      // Reset manual edit flag when specialty changes
      setServiceLineManuallyEdited(false);
    }
  };

  const handleCustomSpecialtyChange = (value: string) => {
    updateField('specialty', value);
    // Reset manual edit flag when specialty changes
    setServiceLineManuallyEdited(false);
  };

  const handleProvidersOnCallChange = (value: string) => {
    const newProviders = parseInt(value, 10);
    updateField('providersOnCall', newProviders);
    // Auto-select default rotation ratio (1-in-N) will be handled by useEffect
    // This ensures validRotationRatios is calculated first
  };

  const handleServiceLineSuggestionClick = (suggestion: string) => {
    updateField('serviceLine', suggestion);
    setServiceLineManuallyEdited(false);
  };

  const handleServiceLineInputChange = (value: string) => {
    updateField('serviceLine', value);
    setServiceLineManuallyEdited(true);
  };

  return (
    <div className={cn(
      showTopBorder && "border-t border-gray-200 dark:border-gray-800",
      showTopBorder ? "pt-4" : "pt-0"
    )}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Context</h3>
        {headerAction && <div>{headerAction}</div>}
      </div>
      <div className="space-y-4">
          {/* Row 1: Model Year and Specialty side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Model Year</Label>
              <Select
                value={context.modelYear.toString()}
                onValueChange={(value) => updateField('modelYear', parseInt(value, 10))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {Array.from({ length: 81 }, (_, i) => {
                    const year = 2020 + i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Specialty</Label>
              <Select
                value={displaySpecialty || undefined}
                onValueChange={handleSpecialtyChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectGroup>
                    <SelectLabel>Primary Care / Hospital Medicine</SelectLabel>
                    {SPECIALTIES.slice(0, 4).map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Procedural / Surgical</SelectLabel>
                    {SPECIALTIES.slice(4, 15).map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Medical Subspecialties</SelectLabel>
                    {SPECIALTIES.slice(15, 23).map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Other</SelectLabel>
                    {SPECIALTIES.slice(23).filter(specialty => specialty !== 'Other').map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                    <SelectItem value="Other">
                      Custom
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Show custom specialty input when "Other" is selected - full width */}
          {(displaySpecialty === 'Other' || isCustomSpecialty) && (
            <div className="space-y-2">
              <Input
                value={customSpecialtyValue}
                onChange={(e) => handleCustomSpecialtyChange(e.target.value)}
                placeholder="Enter custom specialty"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Enter any specialty not listed above
              </p>
            </div>
          )}

          {/* Row 2: Core calculation inputs - Providers and Rotation (moved up for priority) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 flex flex-col">
              <Label className="text-sm font-semibold min-h-[2.5rem] flex items-start pt-1">
                Providers on Call
              </Label>
              <Select
                value={context.providersOnCall > 0 ? context.providersOnCall.toString() : undefined}
                onValueChange={handleProvidersOnCallChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex flex-col">
              <Label className="text-sm font-semibold min-h-[2.5rem] flex items-start pt-1">
                Rotation Ratio
              </Label>
              <Select
                key={`rotation-${context.providersOnCall}`}
                value={context.rotationRatio > 0 ? context.rotationRatio.toString() : undefined}
                onValueChange={(value) => updateField('rotationRatio', parseInt(value, 10))}
                disabled={context.providersOnCall === 0}
              >
                <SelectTrigger className={!isRotationRatioValid && context.rotationRatio > 0 ? 'border-amber-500' : ''}>
                  <SelectValue placeholder={context.providersOnCall === 0 ? "Select providers" : "Select"} />
                </SelectTrigger>
                <SelectContent>
                  {validRotationRatios.length > 0 ? (
                    validRotationRatios.map((ratio) => (
                      <SelectItem key={ratio} value={ratio.toString()}>
                        1-in-{ratio} {ratio === context.providersOnCall ? '(recommended)' : ''}
                      </SelectItem>
                    ))
                  ) : (
                    // Fallback: show common ratios if calculation fails
                    Array.from({ length: 10 }, (_, i) => i + 2).map((ratio) => (
                      <SelectItem key={ratio} value={ratio.toString()}>
                        1-in-{ratio}
                      </SelectItem>
                    ))
                  )}
                  {/* Always show common ratios 2-10 for flexibility */}
                  {validRotationRatios.length > 0 && (
                    <>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel>Other Common Ratios</SelectLabel>
                        {Array.from({ length: 9 }, (_, i) => i + 2)
                          .filter(ratio => !validRotationRatios.includes(ratio))
                          .map((ratio) => (
                            <SelectItem key={ratio} value={ratio.toString()}>
                              1-in-{ratio}
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    </>
                  )}
                </SelectContent>
              </Select>
              {!isRotationRatioValid && context.rotationRatio > 0 && context.providersOnCall > 0 && (
                <div className="flex items-start gap-1 text-xs text-amber-600 dark:text-amber-400 mt-1">
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Non-standard rotation</p>
                    <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                      {getRotationRatioExplanation(context.providersOnCall, context.rotationRatio)}. 
                      For equal distribution, consider 1-in-{context.providersOnCall}.
                    </p>
                  </div>
                </div>
              )}
              {isRotationRatioValid && context.rotationRatio > 0 && context.providersOnCall > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getRotationRatioExplanation(context.providersOnCall, context.rotationRatio)}
                </p>
              )}
            </div>
          </div>

          {/* Row 3: Service Line / Hospital (descriptive/optional, moved down) */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Service Line / Hospital
            </Label>
            <div className="relative">
              <Input
                value={context.serviceLine}
                onChange={(e) => handleServiceLineInputChange(e.target.value)}
                onFocus={() => setServiceLineFocused(true)}
                onBlur={() => {
                  // Delay to allow clicking on suggestions
                  setTimeout(() => setServiceLineFocused(false), 200);
                }}
                placeholder="e.g., Cardiac Surgery, Main Campus"
                icon={<Building2 className="w-5 h-5" />}
              />
              {/* Show suggestions dropdown only when specialty is selected and field is focused */}
              {context.specialty && serviceLineFocused && serviceLineSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-auto">
                  {serviceLineSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 first:rounded-t-lg last:rounded-b-lg transition-colors"
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent blur before click
                        handleServiceLineSuggestionClick(suggestion);
                        setServiceLineFocused(false);
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}

