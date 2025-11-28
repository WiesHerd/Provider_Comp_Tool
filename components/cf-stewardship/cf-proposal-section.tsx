'use client';

import { useState } from 'react';
import { ConversionFactorModel } from '@/types/cf-models';
import { CFModelSelector } from '@/components/physician-scenarios/cf-model-selector';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { NumberInput } from '@/components/ui/number-input';
import { FTE } from '@/types';
import { applyPercentageAdjustment } from '@/lib/utils/cf-stewardship';

interface CFProposalSectionProps {
  currentCFModel: ConversionFactorModel;
  proposedCFModel: ConversionFactorModel;
  adjustmentType: 'manual' | 'percentage';
  adjustmentPercent?: number;
  fte: FTE;
  onCurrentCFModelChange: (model: ConversionFactorModel) => void;
  onProposedCFModelChange: (model: ConversionFactorModel) => void;
  onAdjustmentTypeChange: (type: 'manual' | 'percentage') => void;
  onAdjustmentPercentChange: (percent: number) => void;
}

export function CFProposalSection({
  currentCFModel,
  proposedCFModel,
  adjustmentType,
  adjustmentPercent = 0,
  fte,
  onCurrentCFModelChange,
  onProposedCFModelChange,
  onAdjustmentTypeChange,
  onAdjustmentPercentChange,
}: CFProposalSectionProps) {
  const handleAdjustmentTypeToggle = (checked: boolean) => {
    const newType = checked ? 'percentage' : 'manual';
    onAdjustmentTypeChange(newType);
    
    // If switching to percentage, calculate proposed CF from current
    if (newType === 'percentage' && adjustmentPercent !== 0) {
      const adjusted = applyPercentageAdjustment(currentCFModel, adjustmentPercent);
      onProposedCFModelChange(adjusted);
    }
  };

  const handleAdjustmentPercentChange = (value: number) => {
    onAdjustmentPercentChange(value);
    
    // Auto-update proposed CF when percentage changes
    if (adjustmentType === 'percentage') {
      const adjusted = applyPercentageAdjustment(currentCFModel, value);
      onProposedCFModelChange(adjusted);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current CF Model */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Current CF Model
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CFModelSelector
            model={currentCFModel}
            onModelChange={onCurrentCFModelChange}
            fte={fte}
          />
        </CardContent>
      </Card>

      {/* Proposed CF Model */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Proposed CF Model
            </CardTitle>
            <div className="flex items-center gap-3">
              <Label htmlFor="adjustment-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                Use % adjustment
              </Label>
              <Switch
                id="adjustment-toggle"
                checked={adjustmentType === 'percentage'}
                onCheckedChange={handleAdjustmentTypeToggle}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {adjustmentType === 'percentage' ? (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Adjust Current CF by (%)</Label>
              <NumberInput
                value={adjustmentPercent}
                onChange={handleAdjustmentPercentChange}
                min={-100}
                max={100}
                step={0.1}
              />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Proposed CF will be calculated automatically based on the percentage adjustment.
              </p>
            </div>
          ) : (
            <CFModelSelector
              model={proposedCFModel}
              onModelChange={onProposedCFModelChange}
              fte={fte}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}


