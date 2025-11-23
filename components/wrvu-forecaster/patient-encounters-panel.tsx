'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NumberInputWithButtons } from '@/components/ui/number-input-with-buttons';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Users, TrendingUp, DollarSign } from 'lucide-react';
import { WRVUForecasterInputs } from '@/types/wrvu-forecaster';

interface PatientEncountersPanelProps {
  inputs: WRVUForecasterInputs;
  onInputChange: (field: keyof WRVUForecasterInputs, value: number | boolean) => void;
  targetAnnualWRVUs: number;
}

export function PatientEncountersPanel({
  inputs,
  onInputChange,
  targetAnnualWRVUs,
}: PatientEncountersPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <CardTitle className="text-base sm:text-lg font-bold text-primary">Patient Encounters</CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <Label htmlFor="toggle-mode" className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              {inputs.isPerHour ? 'Patients Per Hour' : 'Patients Per Day'}
            </Label>
            <Switch
              id="toggle-mode"
              checked={inputs.isPerHour}
              onCheckedChange={(checked: boolean) => onInputChange('isPerHour', checked)}
              className="touch-target"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <NumberInputWithButtons
          label={inputs.isPerHour ? 'Patients Seen Per Hour' : 'Patients Seen Per Day'}
          value={inputs.isPerHour ? inputs.patientsPerHour : inputs.patientsPerDay}
          onChange={(value) =>
            onInputChange(inputs.isPerHour ? 'patientsPerHour' : 'patientsPerDay', value)
          }
          icon={<Users className="w-5 h-5" />}
          min={0}
          step={1}
          integerOnly
        />

        <NumberInputWithButtons
          label="Average wRVU Per Encounter"
          value={inputs.avgWRVUPerEncounter}
          onChange={(value) => onInputChange('avgWRVUPerEncounter', value)}
          icon={<TrendingUp className="w-5 h-5" />}
          min={0}
          step={0.01}
        />

        <NumberInputWithButtons
          label="Adjusted wRVU Per Encounter"
          value={inputs.adjustedWRVUPerEncounter}
          onChange={(value) => onInputChange('adjustedWRVUPerEncounter', value)}
          icon={<TrendingUp className="w-5 h-5" />}
          min={0}
          step={0.01}
        />

        <div>
          <Label className="text-sm font-semibold mb-2 block">Base Salary</Label>
          <CurrencyInput
            value={inputs.baseSalary}
            onChange={(value) => onInputChange('baseSalary', value)}
            placeholder="150000"
            showDecimals={false}
          />
        </div>

        <div>
          <NumberInputWithButtons
            label="wRVU Conversion Factor"
            value={inputs.wrvuConversionFactor}
            onChange={(value) => onInputChange('wrvuConversionFactor', value)}
            icon={<DollarSign className="w-5 h-5" />}
            min={0}
            step={0.01}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">/ wRVU</p>
        </div>

        <div>
          <Label className="text-sm font-semibold mb-2 block">Target Annual wRVUs</Label>
          <Input
            value={
              inputs.wrvuConversionFactor > 0
                ? Math.round(inputs.baseSalary / inputs.wrvuConversionFactor).toLocaleString()
                : '0'
            }
            readOnly
            className="bg-gray-50 dark:bg-gray-800"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Target wRVUs needed to reach base salary (Base Salary ÷ Conversion Factor)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

