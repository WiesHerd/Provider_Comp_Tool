'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FTEInput } from '@/components/wrvu/fte-input';
import { WRVUInput } from '@/components/wrvu/wrvu-input';
import { KPIChip } from '@/components/wrvu/kpi-chip';
import { ScenarioSaveButton } from '@/components/wrvu/scenario-save-button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { FTE } from '@/types';
import { normalizeWrvus, normalizeTcc } from '@/lib/utils/normalization';

export default function WRVUModelerPage() {
  const [fte, setFte] = useState<FTE>(1.0);
  const [annualWrvus, setAnnualWrvus] = useState(0);
  const [monthlyWrvus, setMonthlyWrvus] = useState(0);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<number[]>(Array(12).fill(0));
  const [conversionFactor, setConversionFactor] = useState(45.52);

  // Calculations
  const productivityPay = annualWrvus * conversionFactor;
  const normalizedWrvus = normalizeWrvus(annualWrvus, fte);
  const normalizedProductivityPay = normalizeTcc(productivityPay, fte);
  const productivityPerWrvu = annualWrvus > 0 ? productivityPay / annualWrvus : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          wRVU Modeler
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Estimate wRVUs and productivity incentives
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inputs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FTEInput value={fte} onChange={setFte} />

          <WRVUInput
            annualWrvus={annualWrvus}
            monthlyWrvus={monthlyWrvus}
            monthlyBreakdown={monthlyBreakdown}
            onAnnualChange={setAnnualWrvus}
            onMonthlyChange={setMonthlyWrvus}
            onMonthlyBreakdownChange={setMonthlyBreakdown}
          />

          <div className="space-y-2">
            <Label className="text-base font-semibold">Conversion Factor ($/wRVU)</Label>
            <CurrencyInput
              value={conversionFactor}
              onChange={setConversionFactor}
              placeholder="45.52"
            />
          </div>
        </CardContent>
      </Card>

      {/* KPI Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPIChip
          label="Annual wRVUs"
          value={annualWrvus}
        />
        <KPIChip
          label="wRVUs per 1.0 FTE"
          value={normalizedWrvus}
        />
        <KPIChip
          label="Productivity Incentive"
          value={normalizedProductivityPay}
          unit="$"
        />
        <KPIChip
          label="Productivity $ per wRVU"
          value={productivityPerWrvu}
          unit="$"
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-center">
        <ScenarioSaveButton
          fte={fte}
          annualWrvus={annualWrvus}
          conversionFactor={conversionFactor}
          productivityPay={productivityPay}
        />
      </div>
    </div>
  );
}

