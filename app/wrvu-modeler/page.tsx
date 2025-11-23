'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FTEInput } from '@/components/wrvu/fte-input';
import { WRVUInput } from '@/components/wrvu/wrvu-input';
import { KPIChip } from '@/components/wrvu/kpi-chip';
import { ScenarioSaveButton } from '@/components/wrvu/scenario-save-button';
import { CurrencyInput } from '@/components/ui/currency-input';
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
import { FTE, ProviderScenario } from '@/types';
import { normalizeWrvus, normalizeTcc } from '@/lib/utils/normalization';
import { ScenarioLoader } from '@/components/scenarios/scenario-loader';

// Common medical specialties (matching the pattern from other components)
const SPECIALTIES = [
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

export default function WRVUModelerPage() {
  const [fte, setFte] = useState<FTE>(1.0);
  const previousFteRef = React.useRef<FTE>(1.0);
  const [annualWrvus, setAnnualWrvus] = useState(0);
  const [monthlyWrvus, setMonthlyWrvus] = useState(0);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<number[]>(Array(12).fill(0));
  const [conversionFactor, setConversionFactor] = useState(45.52);
  const [providerName, setProviderName] = useState('');
  const [specialty, setSpecialty] = useState<string>('');
  const [customSpecialty, setCustomSpecialty] = useState('');

  // Scale wRVU values when FTE changes
  useEffect(() => {
    const previousFte = previousFteRef.current;
    
    // Only scale if FTE actually changed and we have existing wRVU data
    if (fte !== previousFte && previousFte > 0 && fte > 0) {
      const scaleFactor = fte / previousFte;
      
      // Scale annual wRVUs
      setAnnualWrvus(prev => {
        if (prev > 0) {
          return Math.round(prev * scaleFactor * 100) / 100;
        }
        return prev;
      });
      
      // Scale monthly average
      setMonthlyWrvus(prev => {
        if (prev > 0) {
          return Math.round(prev * scaleFactor * 100) / 100;
        }
        return prev;
      });
      
      // Scale monthly breakdown
      setMonthlyBreakdown(prev => {
        const hasMonthlyData = prev.some(val => val > 0);
        if (hasMonthlyData) {
          return prev.map(val => Math.round(val * scaleFactor * 100) / 100);
        }
        return prev;
      });
    }
    
    // Update previous FTE after scaling
    previousFteRef.current = fte;
  }, [fte]);

  // Calculations
  const productivityPay = annualWrvus * conversionFactor;
  const normalizedWrvus = normalizeWrvus(annualWrvus, fte);
  const normalizedProductivityPay = normalizeTcc(productivityPay, fte);
  const productivityPerWrvu = annualWrvus > 0 ? productivityPay / annualWrvus : 0;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Inputs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <ScenarioLoader
            scenarioType="wrvu-modeler"
            onLoad={(scenario) => {
              setFte(scenario.fte);
              const annual = scenario.annualWrvus;
              const monthly = Math.round((annual / 12) * 100) / 100;
              setAnnualWrvus(annual);
              setMonthlyWrvus(monthly);
              setMonthlyBreakdown(Array(12).fill(monthly));
              if (scenario.providerName) setProviderName(scenario.providerName);
              if (scenario.specialty) {
                if (SPECIALTIES.includes(scenario.specialty)) {
                  setSpecialty(scenario.specialty);
                  setCustomSpecialty('');
                } else {
                  setSpecialty('Other');
                  setCustomSpecialty(scenario.specialty);
                }
              }
              // Load conversion factor from TCC components if available
              if (scenario.tccComponents && scenario.tccComponents.length > 0) {
                const productivityComponent = scenario.tccComponents.find(
                  c => c.type === 'Productivity Incentive'
                );
                if (productivityComponent && annual > 0) {
                  setConversionFactor(Math.round((productivityComponent.amount / annual) * 100) / 100);
                }
              }
            }}
            className="pb-4 border-b border-gray-200 dark:border-gray-700"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm sm:text-base font-semibold">Provider Name</Label>
              <Input
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                placeholder="Enter provider name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm sm:text-base font-semibold">Specialty</Label>
              <Select value={specialty} onValueChange={(value) => {
                setSpecialty(value);
                if (value !== 'Other') {
                  setCustomSpecialty('');
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Primary Care / Hospital Medicine</SelectLabel>
                    {SPECIALTIES.slice(0, 4).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Procedural / Surgical</SelectLabel>
                    {SPECIALTIES.slice(4, 15).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Medical Subspecialties</SelectLabel>
                    {SPECIALTIES.slice(15, 23).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Other</SelectLabel>
                    {SPECIALTIES.slice(23).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {specialty === 'Other' && (
                <Input
                  value={customSpecialty}
                  onChange={(e) => setCustomSpecialty(e.target.value)}
                  placeholder="Enter custom specialty"
                  className="mt-2"
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <FTEInput value={fte} onChange={setFte} />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Changing FTE will scale wRVU values proportionally. FTE also affects normalized calculations below.
            </p>
          </div>

          <WRVUInput
            annualWrvus={annualWrvus}
            monthlyWrvus={monthlyWrvus}
            monthlyBreakdown={monthlyBreakdown}
            onAnnualChange={setAnnualWrvus}
            onMonthlyChange={setMonthlyWrvus}
            onMonthlyBreakdownChange={setMonthlyBreakdown}
          />

          <div className="space-y-2">
            <Label className="text-sm sm:text-base font-semibold">Conversion Factor ($/wRVU)</Label>
            <CurrencyInput
              value={conversionFactor}
              onChange={setConversionFactor}
              placeholder="45.52"
            />
          </div>
        </CardContent>
      </Card>

      {/* KPI Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        <KPIChip
          label="Annual wRVUs"
          value={annualWrvus}
        />
        <KPIChip
          label="wRVUs per 1.0 FTE"
          value={normalizedWrvus}
        />
        <KPIChip
          label="Productivity Incentive (at current FTE)"
          value={productivityPay}
          unit="$"
        />
        <KPIChip
          label="Productivity Incentive (normalized to 1.0 FTE)"
          value={normalizedProductivityPay}
          unit="$"
        />
        <KPIChip
          label="Productivity $ per wRVU"
          value={productivityPerWrvu}
          unit="$"
        />
        <KPIChip
          label="Effective Conversion Factor (normalized)"
          value={normalizedWrvus > 0 ? normalizedProductivityPay / normalizedWrvus : 0}
          unit="$/wRVU"
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-center">
        <ScenarioSaveButton
          fte={fte}
          annualWrvus={annualWrvus}
          conversionFactor={conversionFactor}
          productivityPay={productivityPay}
          providerName={providerName.trim() || undefined}
          specialty={specialty === 'Other' ? (customSpecialty.trim() || undefined) : (specialty || undefined)}
        />
      </div>
    </div>
  );
}

