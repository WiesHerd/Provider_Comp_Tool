'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CallPayContext, Specialty } from '@/types/call-pay';

interface ContextCardProps {
  context: CallPayContext;
  onContextChange: (context: CallPayContext) => void;
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

export function ContextCard({ context, onContextChange }: ContextCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Check if current specialty is a custom one (not in the predefined list)
  const isCustomSpecialty = !SPECIALTIES.includes(context.specialty as Specialty);
  const displaySpecialty = isCustomSpecialty ? 'Other' : context.specialty;
  // Use the actual custom specialty value if it's custom, otherwise empty string
  const customSpecialtyValue = isCustomSpecialty ? context.specialty : '';

  const updateField = <K extends keyof CallPayContext>(
    field: K,
    value: CallPayContext[K]
  ) => {
    onContextChange({ ...context, [field]: value });
  };

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
    }
  };

  const handleCustomSpecialtyChange = (value: string) => {
    updateField('specialty', value);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between"
        >
          <CardTitle className="text-lg font-semibold">Step 1: Context</CardTitle>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Specialty</Label>
            <Select
              value={displaySpecialty}
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
                  {SPECIALTIES.slice(23).map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                  <SelectItem value="Other">
                    Other (Custom)
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            
            {/* Show custom input when "Other" is selected */}
            {(displaySpecialty === 'Other' || isCustomSpecialty) && (
              <div className="mt-2">
                <Input
                  value={customSpecialtyValue}
                  onChange={(e) => handleCustomSpecialtyChange(e.target.value)}
                  placeholder="Enter custom specialty"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter any specialty not listed above
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Service Line / Hospital
            </Label>
            <Input
              value={context.serviceLine}
              onChange={(e) => updateField('serviceLine', e.target.value)}
              placeholder="e.g., Cardiac Surgery, Main Campus"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Providers on Call
              </Label>
              <NumberInput
                value={context.providersOnCall}
                onChange={(value) => updateField('providersOnCall', value)}
                min={1}
                placeholder="Number"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Rotation Ratio</Label>
              <NumberInput
                value={context.rotationRatio}
                onChange={(value) => updateField('rotationRatio', value)}
                min={1}
                placeholder="1-in-N"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                1-in-{context.rotationRatio || 'N'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Model Year</Label>
            <NumberInput
              value={context.modelYear}
              onChange={(value) => updateField('modelYear', value)}
              min={2020}
              max={2100}
              placeholder="2024"
              integerOnly={true}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}

